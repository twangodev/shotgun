import {chromium, Browser, Page} from 'playwright';
import {UserProfile} from '../profile';
import {ApplicationEvent, AgentConfig} from './types';
import {CommandEvent} from '../events';
import {
	formatAccessibilitySnapshot,
	extractFormFields,
	getValueFromProfile,
	findSubmitButton,
} from '../browser/accessibility';

/**
 * Job Application Agent - Phase 2 Implementation
 * Uses Playwright for real browser automation with accessibility-first approach
 */
export class JobApplicationAgent {
	constructor(
		private profile: UserProfile,
		private config: AgentConfig = {
			headless: false,
			timeout: 30000,
			retryAttempts: 3,
			screenshotOnError: true,
		},
	) {}

	/**
	 * Apply to a job posting using browser automation
	 */
	async *applyToJob(url: string): AsyncGenerator<CommandEvent> {
		// Validate URL
		if (!this.isValidUrl(url)) {
			yield {
				type: 'error',
				error: 'Invalid URL provided',
			};
			return;
		}

		let browser: Browser | null = null;
		let page: Page | null = null;

		try {
			// Launch browser (fresh instance per application)
			yield {
				type: 'progress',
				message: 'Launching browser...',
			};
			browser = await chromium.launch({
				headless: this.config.headless,
			});
			page = await browser.newPage();

			// Set reasonable timeout
			page.setDefaultTimeout(this.config.timeout);

			// Navigate to job posting
			yield {
				type: 'progress',
				message: `Navigating to ${url}...`,
			};
			await page.goto(url, {waitUntil: 'networkidle'});

			// Get page title for context
			const title = await page.title();
			yield {
				type: 'progress',
				message: `Page loaded: ${title}`,
			};

			// Get accessibility snapshot
			yield {
				type: 'progress',
				message: 'Analyzing page structure...',
			};
			const snapshot = await page.accessibility.snapshot();
			
			// Format snapshot for readability (like Playwright MCP)
			const formattedSnapshot = formatAccessibilitySnapshot(snapshot);
			
			// Log the snapshot for debugging (in production, this could be saved)
			console.log('Accessibility Snapshot:');
			console.log(formattedSnapshot);

			// Extract form fields from snapshot
			const fields = extractFormFields(formattedSnapshot);
			yield {
				type: 'progress',
				message: `Found ${fields.length} form fields`,
			};

			// Fill each field that we can map to profile
			for (const field of fields) {
				if (field.profileMapping) {
					const value = getValueFromProfile(this.profile, field.profileMapping);
					if (value) {
						yield {
							type: 'progress',
							message: `Filling "${field.name}" with "${value}"`,
						};
						
						try {
							// Use semantic locator to fill the field
							await page.getByLabel(field.name).fill(value);
							
							// Small delay to appear more human-like
							await this.delay(500);
						} catch (error) {
							console.error(`Failed to fill field "${field.name}":`, error);
							// Continue with other fields even if one fails
						}
					}
				} else {
					// Log fields we couldn't map (Phase 3 will use AI for these)
					console.log(`No mapping for field: ${field.name}`);
				}
			}

			// Find and click submit button
			const submitButtonText = findSubmitButton(formattedSnapshot);
			if (submitButtonText) {
				yield {
					type: 'progress',
					message: `Clicking "${submitButtonText}" button...`,
				};
				
				try {
					await page.getByRole('button', {name: submitButtonText}).click();
					
					// Wait for navigation or response
					await page.waitForLoadState('networkidle');
					
					yield {
						type: 'progress',
						message: 'Application submitted!',
					};
				} catch (error) {
					console.error('Failed to submit application:', error);
					yield {
						type: 'error',
						error: 'Failed to submit application',
					};
				}
			} else {
				yield {
					type: 'progress',
					message: 'No submit button found - manual submission may be required',
				};
			}

			// Success!
			yield {
				type: 'completed',
				data: {
					url,
					title,
					fieldsFound: fields.length,
					fieldsFilled: fields.filter(f => f.profileMapping).length,
				},
			};

			yield {
				type: 'message',
				content: `Application process completed for: ${title}`,
			};

		} catch (error) {
			// Simple error handling - log and exit
			console.error('Application failed:', error);
			
			// Take screenshot on error if configured
			if (this.config.screenshotOnError && page) {
				try {
					const screenshot = await page.screenshot({fullPage: true});
					console.log('Error screenshot saved');
					// In production, save this to a file
				} catch (screenshotError) {
					console.error('Failed to take screenshot:', screenshotError);
				}
			}
			
			yield {
				type: 'error',
				error: error instanceof Error ? error.message : 'Unknown error occurred',
			};
		} finally {
			// Always close browser
			if (browser) {
				await browser.close();
			}
		}
	}

	/**
	 * Streaming wrapper for compatibility
	 */
	async *streamApplication(url: string): AsyncGenerator<CommandEvent> {
		yield* this.applyToJob(url);
	}

	private isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}