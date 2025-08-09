/**
 * Ultra-simple Session class for MVP
 * Tracks the state of one job application attempt
 */

import { PlaywrightMCPClient } from '../playwright/PlaywrightMCPClient';
import type { PageData } from '../../mastra/workflows/job-application/types';

export type Phase = 'init' | 'recon' | 'execution' | 'navigation' | 'complete';

export class Session {
  public readonly id: string;
  public readonly applicationUrl: string;

  public phase: Phase;
  public playwrightClient?: PlaywrightMCPClient;
  
  // Page management - array where index = page number
  public pages: PageData[] = [];
  public currentPageNumber: number = 0;
  
  private logger?: any;

  constructor(id: string, applicationUrl: string, logger?: any) {
    this.logger = logger;
    this.id = id;
    this.applicationUrl = applicationUrl;
    this.currentPageNumber = 0;
    this.phase = 'init';
    this.pages = [];
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

  // Page management helpers
  getCurrentPageData(): PageData | undefined {
    return this.pages[this.currentPageNumber];
  }

  initializePageData(snapshot: any, actions: any[] = []): PageData {
    const pageData: PageData = {
      snapshot,
      actions
    };
    this.pages[this.currentPageNumber] = pageData;
    return pageData;
  }

  nextPage() {
    this.currentPageNumber++;
    // New page will be initialized when we take its snapshot
  }

  // Action queue management - now works with current page
  getNextActions(count: number = 1): any[] {
    const currentPage = this.getCurrentPageData();
    if (!currentPage) return [];
    return currentPage.actions.filter(a => !a.completed).slice(0, count);
  }

  markActionComplete(actionId: string) {
    const currentPage = this.getCurrentPageData();
    if (!currentPage) return;
    const action = currentPage.actions.find(a => a.id === actionId);
    if (action) action.completed = true;
  }

  areAllActionsComplete(): boolean {
    const currentPage = this.getCurrentPageData();
    if (!currentPage) return true;
    return currentPage.actions.every(a => a.completed);
  }

  // Simple status check
  isComplete(): boolean {
    return this.phase === 'complete';
  }
}
