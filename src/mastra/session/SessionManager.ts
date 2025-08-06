import { MCPClient } from '@mastra/mcp';
import { SessionState, SessionStatus, UserProfile } from '../types';
import { RuntimeContext } from '@mastra/core/di';

export class SessionManager {
  private sessions: Map<string, SessionState>;
  private mcpClients: Map<string, MCPClient>;

  constructor() {
    this.sessions = new Map();
    this.mcpClients = new Map();
  }

  async createSession(jobUrl: string, userProfile: UserProfile): Promise<string> {
    const sessionId = this.generateSessionId();
    
    // Create MCP client for this session with isolated Playwright instance
    const mcpClient = new MCPClient({
      servers: {
        playwright: {
          command: 'npx',
          args: [
            '@playwright/mcp@latest',
            '--isolated',
            '--session-id',
            sessionId
          ],
          env: {
            SESSION_ID: sessionId
          }
        }
      }
    });

    // Initialize session state
    const sessionState: SessionState = {
      id: sessionId,
      status: SessionStatus.INITIALIZING,
      jobUrl,
      userProfile,
      progress: {
        currentPhase: 'initialization',
        completedSteps: [],
        errors: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store session and client
    this.sessions.set(sessionId, sessionState);
    this.mcpClients.set(sessionId, mcpClient);

    // Initialize browser context
    await this.initializeBrowserContext(sessionId);

    // Update status
    this.updateSessionStatus(sessionId, SessionStatus.ACTIVE);

    return sessionId;
  }

  async suspendSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.updateSessionStatus(sessionId, SessionStatus.SUSPENDED);
    
    // Save browser state if needed
    const mcpClient = this.getMCPClient(sessionId);
    if (mcpClient) {
      // Could save cookies, localStorage, etc. here
      const tools = await mcpClient.getTools();
      if (tools['browser_get_cookies']) {
        const cookies = await tools['browser_get_cookies'].execute({});
        session.browserContext = {
          ...session.browserContext,
          cookies
        } as any;
      }
    }
  }

  async resumeSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== SessionStatus.SUSPENDED) {
      throw new Error(`Session ${sessionId} is not suspended`);
    }

    // Restore browser context
    await this.initializeBrowserContext(sessionId);

    // Restore any saved state
    if ((session.browserContext as any)?.cookies) {
      const mcpClient = this.getMCPClient(sessionId);
      if (mcpClient) {
        const tools = await mcpClient.getTools();
        if (tools['browser_set_cookies']) {
          await tools['browser_set_cookies'].execute({
            cookies: (session.browserContext as any).cookies
          });
        }
      }
    }

    this.updateSessionStatus(sessionId, SessionStatus.ACTIVE);
  }

  async destroySession(sessionId: string): Promise<void> {
    const mcpClient = this.mcpClients.get(sessionId);
    
    if (mcpClient) {
      // Close browser tab/context
      const tools = await mcpClient.getTools();
      if (tools['browser_close_tab']) {
        const session = this.getSession(sessionId);
        if (session?.browserContext?.tabId) {
          await tools['browser_close_tab'].execute({
            tabId: session.browserContext.tabId
          });
        }
      }
      
      // Disconnect MCP client
      await mcpClient.disconnect();
      this.mcpClients.delete(sessionId);
    }

    this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  getMCPClient(sessionId: string): MCPClient | undefined {
    return this.mcpClients.get(sessionId);
  }

  getAllSessions(): SessionState[] {
    return Array.from(this.sessions.values());
  }

  getActiveSessions(): SessionState[] {
    return this.getAllSessions().filter(s => s.status === SessionStatus.ACTIVE);
  }

  updateSession(sessionId: string, updates: Partial<SessionState>): void {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, updatedSession);
  }

  createRuntimeContext(sessionId: string): RuntimeContext {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const context = new RuntimeContext();
    context.set('sessionId', sessionId);
    context.set('userProfile', session.userProfile);
    context.set('formAnalysis', session.formAnalysis);
    context.set('fieldMappings', session.fieldMappings);
    context.set('mcpClient', this.getMCPClient(sessionId));
    
    return context;
  }

  private async initializeBrowserContext(sessionId: string): Promise<void> {
    const mcpClient = this.getMCPClient(sessionId);
    if (!mcpClient) {
      throw new Error(`MCP client not found for session ${sessionId}`);
    }

    const tools = await mcpClient.getTools();
    
    // Create new browser tab
    if (tools['browser_new_tab']) {
      const result = await tools['browser_new_tab'].execute({});
      const tabId = result.tabId;
      
      this.updateSession(sessionId, {
        browserContext: {
          tabId,
          currentUrl: 'about:blank'
        }
      });
    }
  }

  private updateSessionStatus(sessionId: string, status: SessionStatus): void {
    this.updateSession(sessionId, { status });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async cleanup(): Promise<void> {
    // Destroy all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.destroySession(sessionId);
    }
  }
}