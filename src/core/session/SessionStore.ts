/**
 * Simple Map-based session store for MVP
 * No persistence - sessions live in memory only
 */

import { Session } from './Session';

class SessionStore {
  private sessions: Map<string, Session> = new Map();
  
  createSession(applicationUrl: string): Session {
    // Simple ID generation
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = new Session(id, applicationUrl);
    this.sessions.set(id, session);
    
    console.log(`[SessionStore] Created session ${id} for ${applicationUrl}`);
    return session;
  }
  
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
  
  deleteSession(sessionId: string): boolean {
    console.log(`[SessionStore] Deleting session ${sessionId}`);
    return this.sessions.delete(sessionId);
  }
  
  // Debug helper
  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

// Singleton instance
export const sessionStore = new SessionStore();