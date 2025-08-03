import {BrowserManager} from '../core/browser/browserManager.js';
import {ApplicationSession} from '../core/session/ApplicationSession.js';
import {SessionInfo} from '../core/session/types.js';
import {JobApplicationSupervisor} from '../agents/JobApplicationSupervisor.js';
import {PlaywrightMCPService} from './PlaywrightMCPService.js';

export class SessionManager {
	private static instance: SessionManager;
	private browserManager: BrowserManager;
	private mcpService: PlaywrightMCPService;
	
	private constructor() {
		this.browserManager = BrowserManager.getInstance();
		this.mcpService = PlaywrightMCPService.getInstance();
	}
	
	static getInstance(): SessionManager {
		if (!SessionManager.instance) {
			SessionManager.instance = new SessionManager();
		}
		return SessionManager.instance;
	}
	
	async createSession(url: string): Promise<ApplicationSession> {
		const session = await this.browserManager.createSession(url);
		
		// Create and start supervisor agent
		const supervisor = new JobApplicationSupervisor(session, this.mcpService);
		
		// Start analysis in background
		supervisor.start().catch(error => {
			console.error('Supervisor failed:', error);
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