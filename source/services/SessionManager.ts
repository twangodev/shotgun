import {BrowserManager} from '../core/browser/browserManager.js';
import {ApplicationSession} from '../core/session/ApplicationSession.js';
import {SessionInfo} from '../core/session/types.js';
import {MastraAgentService} from './MastraAgentService.js';
import {sessionSupervisor} from '../mastra/agents/session-supervisor.js';

export class SessionManager {
	private static instance: SessionManager;
	private browserManager: BrowserManager;
	private mastraService: MastraAgentService;
	
	private constructor() {
		this.browserManager = BrowserManager.getInstance();
		this.mastraService = MastraAgentService.getInstance();
	}
	
	static getInstance(): SessionManager {
		if (!SessionManager.instance) {
			SessionManager.instance = new SessionManager();
		}
		return SessionManager.instance;
	}
	
	async createSession(url: string): Promise<ApplicationSession> {
		const session = await this.browserManager.createSession(url);
		
		// Start agent analysis in background
		const initialPrompt = `I need you to analyze the web page at ${url}. Please extract the page content and determine what type of page this is (login, job search, job listing, application form, etc.) and suggest appropriate next actions.`;
		
		this.mastraService.runAgent(sessionSupervisor, session, initialPrompt).catch(error => {
			console.error('Agent failed:', error);
			session.emitError(`Agent failed: ${error.message}`);
		});
		
		return session;
	}
	
	getSession(sessionId: string): ApplicationSession | undefined {
		console.log(`[SessionManager] getSession called with: ${sessionId}`);
		const session = this.browserManager.getSession(sessionId);
		console.log(`[SessionManager] getSession result: ${session ? 'found' : 'not found'}`);
		return session;
	}
	
	listSessions(): SessionInfo[] {
		return this.browserManager.listSessions().map(session => ({
			id: session.id,
			url: session.url,
			status: session.metadata.status,
			currentStep: session.metadata.currentStep,
			createdAt: session.metadata.createdAt,
			lastActivity: session.metadata.lastActivity,
		}));
	}
	
	async closeSession(sessionId: string): Promise<void> {
		await this.browserManager.closeSession(sessionId);
	}
	
	getActiveSessionCount(): number {
		return this.browserManager.getActiveSessionCount();
	}
	
	getAllSessions(): Map<string, ApplicationSession> {
		return this.browserManager.getAllSessions();
	}
}