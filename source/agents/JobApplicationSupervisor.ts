import {ApplicationSession} from '../core/session/ApplicationSession.js';
import {PlaywrightMCPService} from '../services/PlaywrightMCPService.js';

export interface PageAnalysis {
	pageType: 'job_listing' | 'job_search' | 'login' | 'application_form' | 'success_page' | 'unknown';
	confidence: number;
	elements: {
		hasLoginForm: boolean;
		hasSearchBar: boolean;
		hasJobListings: boolean;
		hasApplicationForm: boolean;
		hasSubmitButton: boolean;
	};
	suggestedAction: AgentAction;
}

export type AgentAction =
	| {type: 'login'; method: 'credentials' | 'oauth'}
	| {type: 'search'; query: string}
	| {type: 'select_job'; criteria: string}
	| {type: 'fill_form'; fields: string[]}
	| {type: 'navigate'; target: string}
	| {type: 'extract_info'; data: string[]}
	| {type: 'need_help'; reason: string};

export class JobApplicationSupervisor {
	private isRunning = false;

	constructor(
		private session: ApplicationSession,
		private mcpService: PlaywrightMCPService,
	) {}

	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.emitThought('Starting job application analysis...');

		try {
			// Make sure MCP service is started
			await this.mcpService.start();
			
			// Wait a moment for the page to load
			await this.sleep(2000);
			
			// Analyze current page
			const pageAnalysis = await this.analyzePage();

			// Decide next action
			const action = this.decideAction(pageAnalysis);

			// For now, just emit the decision
			this.emitThought(`Decision: ${this.describeAction(action)}`);
			
			// In the future, execute the action
			// await this.executeAction(action);
		} catch (error: any) {
			this.emitError(`Error: ${error.message}`);
			this.session.metadata.status = 'error';
			// Session stays open for inspection
		} finally {
			this.isRunning = false;
		}
	}

	private async analyzePage(): Promise<PageAnalysis> {
		this.emitThought('Analyzing page structure...');

		try {
			// Extract page content
			const contentResult = await this.mcpService.extract();
			const content = this.extractTextFromResult(contentResult);
			
			this.emitThought('Extracting page title and main elements...');
			
			// Simple heuristic analysis
			const elements = {
				hasLoginForm: this.hasLoginElements(content),
				hasSearchBar: this.hasSearchElements(content),
				hasJobListings: this.hasJobListings(content),
				hasApplicationForm: this.hasFormElements(content),
				hasSubmitButton: this.hasSubmitButton(content),
			};

			this.emitThought('Determining page type...');
			const pageType = this.determinePageType(elements, content);
			
			const analysis: PageAnalysis = {
				pageType,
				confidence: 0.8, // Simple confidence for now
				elements,
				suggestedAction: this.getSuggestedAction(pageType, elements),
			};

			this.emitThought(`This appears to be a ${pageType} page`);
			return analysis;
		} catch (error: any) {
			this.emitThought(`Failed to analyze page: ${error.message}`);
			throw error;
		}
	}

	private determinePageType(elements: PageAnalysis['elements'], content: string): PageAnalysis['pageType'] {
		const lowerContent = content.toLowerCase();

		if (elements.hasLoginForm || lowerContent.includes('sign in') || lowerContent.includes('log in')) {
			return 'login';
		}
		
		if (elements.hasSearchBar && (lowerContent.includes('job') || lowerContent.includes('career'))) {
			return 'job_search';
		}
		
		if (elements.hasJobListings || lowerContent.includes('apply now')) {
			return 'job_listing';
		}
		
		if (elements.hasApplicationForm && elements.hasSubmitButton) {
			return 'application_form';
		}
		
		if (lowerContent.includes('thank you') || lowerContent.includes('application received')) {
			return 'success_page';
		}

		return 'unknown';
	}

	private getSuggestedAction(pageType: PageAnalysis['pageType'], _elements: PageAnalysis['elements']): AgentAction {
		switch (pageType) {
			case 'login':
				return {type: 'need_help', reason: 'Login required - credentials needed'};
			
			case 'job_search':
				return {type: 'search', query: 'React Developer'}; // Default for now
			
			case 'job_listing':
				return {type: 'navigate', target: 'apply button'};
			
			case 'application_form':
				return {type: 'fill_form', fields: []};
			
			case 'success_page':
				return {type: 'extract_info', data: ['confirmation number']};
			
			default:
				return {type: 'need_help', reason: 'Unable to determine page type'};
		}
	}

	private decideAction(analysis: PageAnalysis): AgentAction {
		return analysis.suggestedAction;
	}

	private describeAction(action: AgentAction): string {
		switch (action.type) {
			case 'login':
				return `Need to login using ${action.method}`;
			case 'search':
				return `Search for "${action.query}"`;
			case 'select_job':
				return `Select job based on ${action.criteria}`;
			case 'fill_form':
				return `Fill application form`;
			case 'navigate':
				return `Navigate to ${action.target}`;
			case 'extract_info':
				return `Extract ${action.data.join(', ')}`;
			case 'need_help':
				return action.reason;
		}
	}

	private emitThought(message: string) {
		this.session.emitThought(message);
	}

	// Will be used when implementing actions
	// private emitAction(message: string) {
	// 	this.session.emitAction(message);
	// }

	private emitError(message: string) {
		this.session.emitError(message);
	}

	// Helper methods for content analysis
	private extractTextFromResult(result: any): string {
		// MCP tools return content in a specific format
		if (result?.content && Array.isArray(result.content)) {
			return result.content
				.map((item: any) => item.text || '')
				.join(' ');
		}
		return '';
	}

	private hasLoginElements(content: string): boolean {
		const loginKeywords = ['password', 'email', 'username', 'sign in', 'log in'];
		const lower = content.toLowerCase();
		return loginKeywords.some(keyword => lower.includes(keyword));
	}

	private hasSearchElements(content: string): boolean {
		const searchKeywords = ['search', 'find jobs', 'keywords', 'location'];
		const lower = content.toLowerCase();
		return searchKeywords.some(keyword => lower.includes(keyword));
	}

	private hasJobListings(content: string): boolean {
		const jobKeywords = ['apply', 'posted', 'salary', 'requirements', 'job description'];
		const lower = content.toLowerCase();
		return jobKeywords.some(keyword => lower.includes(keyword));
	}

	private hasFormElements(content: string): boolean {
		const formKeywords = ['first name', 'last name', 'email', 'phone', 'resume'];
		const lower = content.toLowerCase();
		return formKeywords.some(keyword => lower.includes(keyword));
	}

	private hasSubmitButton(content: string): boolean {
		const submitKeywords = ['submit', 'apply', 'send application'];
		const lower = content.toLowerCase();
		return submitKeywords.some(keyword => lower.includes(keyword));
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}