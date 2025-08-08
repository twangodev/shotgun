/**
 * Simple Map-based session store for MVP
 * No persistence - sessions live in memory only
 */

import { v4 as uuidv4 } from 'uuid';
import { Session } from './Session';

class SessionStore {
  private sessions: Map<string, Session> = new Map();
  
  createSession(applicationUrl: string): Session {
    // Generate UUID v4 for session ID
    const id = uuidv4();
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