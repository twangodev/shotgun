import {generateObject} from 'ai';
import {PageAnalysisSchema, PageAnalysis} from './schemas';
import {PageSnapshot} from '../browser/snapshot';
import {UserProfile} from '../profile';
import {AI_MODEL, AI_CONFIG} from './config';

/**
 * Lean AI decision engine for page analysis
 * Back to structured outputs - simpler and more predictable than tool calling
 */
export class DecisionEngine {
	private conversationHistory: Array<{
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}> = [];
	
	constructor(private profile: UserProfile) {}
	
	/**
	 * Analyze a page snapshot and determine what actions to take
	 */
	async analyzePage(snapshot: PageSnapshot, retryCount = 3): Promise<PageAnalysis> {
		const systemPrompt = this.buildSystemPrompt();
		const userPrompt = this.buildUserPrompt(snapshot);
		
		// Store in conversation history
		this.conversationHistory.push({
			role: 'user',
			content: userPrompt,
			timestamp: new Date(),
		});
		
		let lastError: Error | null = null;
		
		for (let attempt = 1; attempt <= retryCount; attempt++) {
			try {
				console.log(`🤖 AI Analysis Attempt ${attempt}/${retryCount}:`);
				console.log('System Prompt:', systemPrompt.substring(0, 200) + '...');
				console.log('User Prompt:', userPrompt.substring(0, 300) + '...');
				
				const result = await generateObject({
					model: AI_MODEL,
					schema: PageAnalysisSchema,
					system: systemPrompt,
					prompt: userPrompt,
					...AI_CONFIG,
				});
				
				console.log('✅ AI Response Success:');
				console.log(JSON.stringify(result.object, null, 2));
				
				// Store AI response in history
				this.conversationHistory.push({
					role: 'assistant',
					content: JSON.stringify(result.object),
					timestamp: new Date(),
				});
				
				return result.object;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				
				console.error(`❌ AI analysis attempt ${attempt}/${retryCount} failed:`);
				console.error('Error details:', {
					message: lastError.message,
					name: lastError.name,
					stack: lastError.stack?.split('\n').slice(0, 3).join('\n'),
				});
				
				// Try to extract and log the raw response if available
				if (error && typeof error === 'object') {
					console.log('🔍 Full error object:');
					console.log(JSON.stringify(error, null, 2));
					
					// Check for common properties where response might be stored
					if ('response' in error) {
						console.log('📄 Raw AI Response found:');
						console.log(JSON.stringify((error as any).response, null, 2));
					}
					if ('data' in error) {
						console.log('📄 Error data:');
						console.log(JSON.stringify((error as any).data, null, 2));
					}
					if ('cause' in error) {
						console.log('📄 Error cause:');
						console.log(JSON.stringify((error as any).cause, null, 2));
					}
				}
				
				if (attempt < retryCount) {
					// Exponential backoff
					const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
					await this.delay(delay);
				}
			}
		}
		
		// All attempts failed
		console.error('All AI analysis attempts failed:', {
			error: lastError?.message,
			attempts: retryCount,
			snapshot: { url: snapshot.url, title: snapshot.title },
		});
		
		throw new Error(`AI analysis failed after ${retryCount} attempts: ${lastError?.message || 'Unknown error'}`);
	}
	
	/**
	 * Build the system prompt that defines the AI's role and capabilities
	 */
	private buildSystemPrompt(): string {
		return `You are an expert job application automation agent. Your role is to:

1. Analyze web pages to understand their structure and purpose
2. Identify job application forms and their fields
3. Map form fields to user profile data intelligently
4. Determine the sequence of actions needed to complete applications
5. Recognize when human intervention is required (CAPTCHAs, complex questions, etc.)

Key principles:
- Be confident in standard form fields (name, email, phone, etc.)
- Be cautious with ambiguous fields or questions requiring human judgment
- Always provide clear reasoning for your decisions
- Identify the most efficient path through multi-step forms
- Detect and handle edge cases (login requirements, errors, etc.)

You work with accessibility snapshots that include ref attributes for element targeting.
Each element can be targeted using its [ref=X] attribute for reliable interaction.

Remember: You're helping automate repetitive form filling while ensuring accuracy and respecting the application process.`;
	}
	
	/**
	 * Build the user prompt with page context and profile data
	 */
	private buildUserPrompt(snapshot: PageSnapshot): string {
		return `Analyze this job application page and determine the best actions to take.

Page Information:
- URL: ${snapshot.url}
- Title: ${snapshot.title}
- Has File Upload: ${snapshot.hasFileUpload}

User Profile Summary:
- Name: ${this.profile.personal.firstName} ${this.profile.personal.lastName}
- Email: ${this.profile.personal.email}
- Phone: ${this.profile.personal.phone}
- Location: ${this.profile.personal.location.city}, ${this.profile.personal.location.state}
- Current Role: ${this.profile.professional.currentRole}
- Years of Experience: ${this.profile.professional.yearsOfExperience}
- Skills: ${this.profile.professional.skills.slice(0, 5).join(', ')}
- Resume Path: ~/Documents/resume.pdf (use this exact path for upload actions)

Accessibility Snapshot:
${snapshot.ariaSnapshot}

Instructions:
1. Identify what type of page this is
2. Find all form fields that need to be filled
3. Map each field to the appropriate profile data
4. Determine the sequence of actions to complete the form
5. For file uploads: include a 'click' action to open the file selector, followed by an 'upload' action
6. Only mark interventionRequired=true for CAPTCHAs or complex questions needing human judgment
7. File uploads should NOT trigger interventionRequired - we can click the button and ask for help at that step
8. Provide confidence scores and reasoning for all decisions

Return a comprehensive analysis with specific actions to take.`;
	}
	
	/**
	 * Re-analyze a page after taking actions to determine next steps
	 */
	async reanalyzePage(
		snapshot: PageSnapshot,
		previousAnalysis: PageAnalysis,
		executionResult: {success: boolean; error?: string},
	): Promise<PageAnalysis> {
		const systemPrompt = this.buildSystemPrompt();
		const userPrompt = `Re-analyze this page after taking actions.

Previous Analysis:
- Page Type: ${previousAnalysis.pageType}
- Actions Attempted: ${previousAnalysis.requiredActions.length}
- Execution Result: ${executionResult.success ? 'Success' : `Failed: ${executionResult.error}`}

Current Page State:
- URL: ${snapshot.url}
- Title: ${snapshot.title}

Accessibility Snapshot:
${snapshot.ariaSnapshot}

Determine:
1. Did the page change as expected?
2. Are we on a new step of the application?
3. What actions should be taken next?
4. Are there any errors or issues to address?
5. Is the application complete?

Provide updated analysis and next actions.`;
		
		try {
			const result = await generateObject({
				model: AI_MODEL,
				schema: PageAnalysisSchema,
				system: systemPrompt,
				prompt: userPrompt,
				...AI_CONFIG,
			});
			
			return result.object;
		} catch (error) {
			console.error('Failed to re-analyze page:', error);
			throw new Error(`AI re-analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
	
	/**
	 * Get a human-readable summary of the analysis
	 */
	formatAnalysisSummary(analysis: PageAnalysis): string {
		const lines = [
			`📄 Page Type: ${analysis.pageType}`,
			`📊 Confidence: ${(analysis.confidence.overall * 100).toFixed(0)}%`,
			``,
			`📝 ${analysis.pageContext.description}`,
			``,
		];
		
		if (analysis.formSections && analysis.formSections.length > 0) {
			lines.push(`Form Sections Found:`);
			analysis.formSections.forEach(section => {
				lines.push(`  • ${section}`);
			});
			lines.push(``);
		}
		
		if (analysis.requiredActions.length > 0) {
			lines.push(`Actions to Take (${analysis.requiredActions.length}):`);
			analysis.requiredActions.slice(0, 5).forEach((action, i) => {
				lines.push(`  ${i + 1}. ${action.description} (${action.toolName})`);
			});
			if (analysis.requiredActions.length > 5) {
				lines.push(`  ... and ${analysis.requiredActions.length - 5} more`);
			}
			lines.push(``);
		}
		
		if (analysis.interventionRequired.needed) {
			lines.push(`⚠️ Human Intervention Required: ${analysis.interventionRequired.reason}`);
			lines.push(``);
		}
		
		lines.push(`Next: ${analysis.nextSteps.expectedOutcome}`);
		
		return lines.join('\n');
	}
	
	/**
	 * Delay utility for retry logic
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}