import {generateObject} from 'ai';
import {PageAnalysisSchema, PageAnalysis} from './schemas';
import {PageSnapshot} from '../browser/snapshot';
import {UserProfile} from '../profile';
import {AI_MODEL, AI_CONFIG} from './config';

/**
 * Lean AI decision engine - just generates actions
 * No analysis, no metadata, just "what to do next"
 */
export class DecisionEngine {
	constructor(private profile: UserProfile) {}
	
	/**
	 * Analyze a page and return actions to take
	 * Empty array means complete
	 */
	async analyzePage(snapshot: PageSnapshot, retryCount = 3): Promise<PageAnalysis> {
		const systemPrompt = this.buildSystemPrompt();
		const userPrompt = this.buildUserPrompt(snapshot);
		
		let lastError: Error | null = null;
		
		for (let attempt = 1; attempt <= retryCount; attempt++) {
			try {
				console.log(`🤖 AI Analysis Attempt ${attempt}/${retryCount}`);
				
				// Log full snapshot for debugging
				if (attempt === 1) {
					console.log('📸 Full snapshot:');
					console.log('=' .repeat(80));
					console.log(userPrompt);
					console.log('=' .repeat(80));
				}
				
				const result = await generateObject({
					model: AI_MODEL,
					schema: PageAnalysisSchema,
					system: systemPrompt,
					prompt: userPrompt,
					...AI_CONFIG,
				});
				
				console.log('✅ AI Response:', JSON.stringify(result.object, null, 2));
				return result.object;
				
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
				
				if (attempt < retryCount) {
					await this.delay(Math.min(1000 * Math.pow(2, attempt - 1), 5000));
				}
			}
		}
		
		throw new Error(`AI analysis failed after ${retryCount} attempts: ${lastError?.message || 'Unknown error'}`);
	}
	
	/**
	 * Build the system prompt - focused on action generation
	 */
	private buildSystemPrompt(): string {
		return `You are a browser automation agent that fills out job application forms.

Your ONLY job is to output a list of actions to take on the current page.

CRITICAL RULES:
1. ALWAYS FILL OUT THE FORM - DO NOT STOP FOR reCAPTCHA BADGES
2. reCAPTCHA badges/logos are PASSIVE - they don't block form filling
3. Fill EVERY field you can with the user's data
4. For yes/no questions about work authorization, visa, etc - answer honestly based on profile
5. For demographic questions - you can select "Prefer not to answer" if available
6. Empty actions array = form is complete/submitted

ONLY use human_intervention in these RARE cases:
- An ACTIVE CAPTCHA challenge popup appears (not just a badge)
- A question has NO reasonable answer from the profile
- You get an error after trying to submit

DO NOT USE human_intervention for:
- reCAPTCHA badges or logos
- Work authorization questions (answer based on profile)
- Demographic questions (select "prefer not to answer")
- Any field that can be filled from profile data

ALWAYS:
- Fill ALL fields first
- Click submit/continue after filling everything
- Let the human handle CAPTCHA only if it blocks submission

Actions available:
- fill_field: {ref: "e5", value: "text"}
- select: {ref: "e10", value: "option"}
- checkbox: {ref: "e12", checked: true/false}
- click: {ref: "e14"}
- upload: {ref: "e15", filePath: "/path/to/file"}
- human_intervention: {reason: "captcha"}

Be efficient. Only include necessary actions.`;
	}
	
	/**
	 * Build the user prompt with snapshot and profile
	 */
	private buildUserPrompt(snapshot: PageSnapshot): string {
		return `Current page:
URL: ${snapshot.url}
Title: ${snapshot.title}

User profile:
Name: ${this.profile.personal.firstName} ${this.profile.personal.lastName}
Email: ${this.profile.personal.email}
Phone: ${this.profile.personal.phone}
Location: ${this.profile.personal.location.city}, ${this.profile.personal.location.state}
Current Role: ${this.profile.professional.currentTitle}
Years Experience: ${this.profile.professional.yearsExperience}
Skills: ${this.profile.professional.skills.slice(0, 5).join(', ')}
Work Authorization: ${this.profile.professional.workAuthorization || 'Authorized to work in the US'}
Requires Visa Sponsorship: No
Resume: /Users/jding/Documents/resume.pdf

For demographic questions, select "Prefer not to answer" when available.

Page snapshot:
${snapshot.ariaSnapshot}

What actions should I take? Return empty array if page is complete/submitted.`;
	}
	
	/**
	 * Delay utility
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}