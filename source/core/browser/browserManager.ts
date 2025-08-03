import {chromium, Browser} from 'playwright';
import {ApplicationSession} from '../session/ApplicationSession.js';
import {randomUUID} from 'crypto';

export class BrowserManager {
	private static instance: BrowserManager;
	private browser: Browser | null = null;
	private sessions: Map<string, ApplicationSession> = new Map();
	private onSessionChangeCallback?: (count: number) => void;

	static getInstance(): BrowserManager {
		if (!BrowserManager.instance) {
			BrowserManager.instance = new BrowserManager();
		}
		return BrowserManager.instance;
	}

	setOnSessionChange(callback: (count: number) => void) {
		this.onSessionChangeCallback = callback;
	}

	private notifySessionChange() {
		if (this.onSessionChangeCallback) {
			this.onSessionChangeCallback(this.sessions.size);
		}
	}

	async ensureBrowserLaunched(): Promise<void> {
		if (!this.browser) {
			this.browser = await chromium.launch({
				headless: false,
				args: ['--remote-debugging-port=9222'], // For future MCP connection
			});

			// Track when browser is closed
			this.browser.on('disconnected', () => {
				this.sessions.clear();
				this.browser = null;
				this.notifySessionChange();
			});
		}
	}

	async createSession(url: string): Promise<ApplicationSession> {
		await this.ensureBrowserLaunched();
		
		// Create isolated context for this session
		const context = await this.browser!.newContext({
			// Each session gets its own cookies, storage, etc.
		});
		
		const page = await context.newPage();
		const sessionId = randomUUID();
		
		const session = new ApplicationSession({
			id: sessionId,
			url,
			page,
			context,
		});

		// Track when context is closed
		context.on('close', () => {
			this.sessions.delete(sessionId);
			this.notifySessionChange();
		});

		// Also track session events
		session.on('closed', () => {
			console.log(`[BrowserManager] Session ${sessionId} closed, removing from map`);
			this.sessions.delete(sessionId);
			this.notifySessionChange();
		});

		// Navigate to the URL
		await page.goto(url);
		
		// Store the session
		this.sessions.set(sessionId, session);
		console.log(`[BrowserManager] Created session ${sessionId}, total sessions: ${this.sessions.size}`);
		this.notifySessionChange();
		
		return session;
	}

	getSession(sessionId: string): ApplicationSession | undefined {
		const session = this.sessions.get(sessionId);
		console.log(`[BrowserManager] getSession(${sessionId}): ${session ? 'found' : 'not found'}, total sessions: ${this.sessions.size}`);
		if (!session && this.sessions.size > 0) {
			console.log('[BrowserManager] Available session IDs:', Array.from(this.sessions.keys()));
		}
		return session;
	}

	async closeSession(sessionId: string): Promise<void> {
		const session = this.sessions.get(sessionId);
		if (session) {
			await session.close();
			// Session close event will handle cleanup
		}
	}

	getActiveSessionCount(): number {
		return this.sessions.size;
	}

	hasActiveSessions(): boolean {
		return this.sessions.size > 0;
	}

	listSessions(): ApplicationSession[] {
		const sessions = Array.from(this.sessions.values());
		console.log(`[BrowserManager] listSessions: returning ${sessions.length} sessions`);
		if (sessions.length > 0) {
			console.log('[BrowserManager] Session IDs:', sessions.map(s => s.id));
		}
		return sessions;
	}
	
	getAllSessions(): Map<string, ApplicationSession> {
		return this.sessions;
	}

	async cleanup(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
			this.sessions.clear();
			this.notifySessionChange();
		}
	}
}
