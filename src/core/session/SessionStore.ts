/**
 * Simple Map-based session store for MVP
 * No persistence - sessions live in memory only
 */

import { v4 as uuidv4 } from 'uuid';
import { Session } from './Session';

class SessionStore {
  private sessions: Map<string, Session> = new Map();
  private logger?: any;
  
  setLogger(logger: any) {
    this.logger = logger;
  }
  
  async createSession(applicationUrl: string): Promise<Session> {
    // Generate UUID v4 for session ID
    const id = uuidv4();
    const session = new Session(id, applicationUrl, this.logger);
    
    // Initialize the session (connects Playwright MCP)
    await session.initialize();
    
    this.sessions.set(id, session);
    
    this.logger?.info('Created and initialized session', {
      component: 'SessionStore',
      sessionId: id,
      applicationUrl
    });
    return session;
  }
  
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
  
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.close();
      this.logger?.info('Closed and deleted session', {
        component: 'SessionStore',
        sessionId
      });
      return this.sessions.delete(sessionId);
    }
    return false;
  }
  
  deleteSession(sessionId: string): boolean {
    this.logger?.warn('Deleting session without closing', {
      component: 'SessionStore',
      sessionId
    });
    return this.sessions.delete(sessionId);
  }
  
  // Debug helper
  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

// Singleton instance
export const sessionStore = new SessionStore();