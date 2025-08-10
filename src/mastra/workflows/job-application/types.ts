/**
 * Shared types for the job application workflow
 */

export interface PageSnapshot {
  id: string;
  timestamp: number;
  accessibilityTree: any; // The raw tree from Playwright MCP
}

export type ActionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ActionQueueItem {
  id: string;
  type: 'FILL' | 'CLICK' | 'SELECT' | 'UPLOAD';
  selector: string;
  label?: string;
  value?: any;
  risk: ActionRiskLevel;
  priority: number;
  completed: boolean;
}

export interface PageData {
  baselineSnapshot?: PageSnapshot;
  actions: ActionQueueItem[];
}