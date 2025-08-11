import {UserProfile} from '../profile';
import {ApplicationEvent, AgentConfig} from './types';
import {CommandEvent} from '../events';

/**
 * Mock implementation of JobApplicationAgent for Phase 1
 * This simulates the application process with delays to demonstrate streaming
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
	 * Mock apply to job - simulates the application process
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

		yield {
			type: 'progress',
			message: `Starting application to ${url}`,
		};

		// Simulate delay
		await this.delay(1000);

		yield {
			type: 'progress',
			message: 'Navigating to job posting...',
		};

		await this.delay(1500);

		yield {
			type: 'progress',
			message: 'Analyzing page structure...',
		};

		await this.delay(2000);

		// Simulate filling form fields
		const fields = [
			{name: 'First Name', value: this.profile.personal.firstName},
			{name: 'Last Name', value: this.profile.personal.lastName},
			{name: 'Email', value: this.profile.personal.email},
			{name: 'Phone', value: this.profile.personal.phone},
			{name: 'Current Title', value: this.profile.professional.currentTitle},
			{
				name: 'Years of Experience',
				value: this.profile.professional.yearsExperience.toString(),
			},
		];

		for (const field of fields) {
			yield {
				type: 'progress',
				message: `Filling field: ${field.name} → ${field.value}`,
			};
			await this.delay(500);
		}

		yield {
			type: 'progress',
			message: 'Uploading resume...',
		};
		await this.delay(2000);

		yield {
			type: 'progress',
			message: 'Clicking submit button...',
		};
		await this.delay(1000);

		// Simulate multi-page application
		yield {
			type: 'progress',
			message: 'Page 1 completed, navigating to page 2...',
		};
		await this.delay(1500);

		yield {
			type: 'progress',
			message: 'Filling additional information...',
		};
		await this.delay(2000);

		yield {
			type: 'progress',
			message: 'Reviewing application...',
		};
		await this.delay(1000);

		yield {
			type: 'progress',
			message: 'Submitting final application...',
		};
		await this.delay(1500);

		// Success!
		const confirmationNumber = this.generateConfirmationNumber();
		yield {
			type: 'completed',
			data: {
				confirmationNumber,
				appliedAt: new Date().toISOString(),
				position: 'Software Engineer', // Mock position
				company: 'Example Corp', // Mock company
			},
		};

		yield {
			type: 'message',
			content: `✅ Application submitted successfully!\nConfirmation: ${confirmationNumber}`,
		};
	}

	/**
	 * Streaming wrapper to convert ApplicationEvents to CommandEvents
	 */
	async *streamApplication(url: string): AsyncGenerator<CommandEvent> {
		try {
			// In Phase 2, this will use the real applyToJob implementation
			yield* this.applyToJob(url);
		} catch (error) {
			yield {
				type: 'error',
				error: error instanceof Error ? error : new Error('Unknown error'),
			};
		}
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

	private generateConfirmationNumber(): string {
		return `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
	}
}