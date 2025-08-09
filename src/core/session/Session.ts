/**
 * Ultra-simple Session class for MVP
 * Tracks the state of one job application attempt
 */

import { PlaywrightMCPClient } from '../playwright/PlaywrightMCPClient';

export type Phase = 'init' | 'recon' | 'execution' | 'navigation' | 'complete';

export interface ActionItem {
  id: string;
  type: 'FILL' | 'CLICK' | 'SELECT';
  selector: string;
  value?: any;
  label?: string;
  completed: boolean;
}

export class Session {
  public readonly id: string;
  public readonly applicationUrl: string;

  public currentPage: number;
  public phase: Phase;
  public actionQueue: ActionItem[];
  public lastSnapshot: any;
  public playwrightClient?: PlaywrightMCPClient;
  private logger?: any;

  constructor(id: string, applicationUrl: string, logger?: any) {
    this.logger = logger;
    this.id = id;
    this.applicationUrl = applicationUrl;
    this.currentPage = 0;
    this.phase = 'init';
    this.actionQueue = [];
    this.lastSnapshot = null;
  }

  /**
   * Initialize the session with Playwright MCP
   */
  async initialize(): Promise<void> {
    this.logger?.info('Initializing Playwright MCP client', { 
      component: 'Session', 
      sessionId: this.id 
    });
    this.playwrightClient = new PlaywrightMCPClient(this.id, this.logger);
    await this.playwrightClient.connect();
    this.logger?.info('Playwright MCP client connected', { 
      component: 'Session', 
      sessionId: this.id 
    });
  }

  /**
   * Close the session and cleanup resources
   */
  async close(): Promise<void> {
    this.logger?.info('Closing session', { 
      component: 'Session', 
      sessionId: this.id 
    });
    if (this.playwrightClient) {
      await this.playwrightClient.disconnect();
      this.playwrightClient = undefined;
    }
    this.logger?.info('Session closed', { 
      component: 'Session', 
      sessionId: this.id 
    });
  }

  // Update phase
  setPhase(phase: Phase) {
    this.phase = phase;
  }

  // Page management
  nextPage() {
    this.currentPage++;
    this.actionQueue = []; // Clear queue for new page
  }

  // Action queue management
  setActionQueue(actions: ActionItem[]) {
    this.actionQueue = actions;
  }

  getNextActions(count: number = 1): ActionItem[] {
    return this.actionQueue.filter(a => !a.completed).slice(0, count);
  }

  markActionComplete(actionId: string) {
    const action = this.actionQueue.find(a => a.id === actionId);
    if (action) action.completed = true;
  }

  areAllActionsComplete(): boolean {
    return this.actionQueue.every(a => a.completed);
  }

  // Snapshot for diffs
  setSnapshot(snapshot: any) {
    this.lastSnapshot = snapshot;
  }

  // Simple status check
  isComplete(): boolean {
    return this.phase === 'complete';
  }
}
