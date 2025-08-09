import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { sessionStore } from '../../../../../core/session';
import { v4 as uuidv4 } from 'uuid';

const takeBaselineSnapshotInputSchema = z.object({
  sessionId: z.string(),
});

const takeBaselineSnapshotOutputSchema = z.object({
  sessionId: z.string(),
  snapshotId: z.string(),
  elementCount: z.number(),
  timestamp: z.number(),
});

/**
 * Take Baseline Snapshot Step
 * 
 * Captures the full accessibility tree of the current page.
 * This expensive operation (10-20K tokens) happens once per page.
 * The snapshot becomes the reference point for all diff operations.
 */
export const takeBaselineSnapshotStep = createStep({
  id: 'take-baseline-snapshot',
  description: 'Captures complete accessibility tree using Playwright MCP snapshot tool. This is the most token-expensive operation but provides comprehensive page structure. Stored externally and used as baseline for diff computations.',
  inputSchema: takeBaselineSnapshotInputSchema,
  outputSchema: takeBaselineSnapshotOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const { sessionId } = inputData;
    const logger = mastra.getLogger();
    
    logger.info('Taking baseline snapshot', { 
      component: 'RECON', 
      sessionId 
    });
    
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    if (!session.playwrightClient) {
      throw new Error(`Session ${sessionId} not initialized with Playwright MCP`);
    }
    
    try {
      // Get the accessibility tree snapshot
      const accessibilityTree = await session.playwrightClient.snapshot();
      
      // Generate snapshot ID
      const snapshotId = `snapshot-${uuidv4()}`;
      
      // Count elements for metrics (simple approximation)
      const elementCount = JSON.stringify(accessibilityTree).split('role:').length - 1;
      
      // Initialize page data for current page with the snapshot
      session.initializePageData({
        id: snapshotId,
        timestamp: Date.now(),
        accessibilityTree
      });
      
      logger.info('Baseline snapshot stored', { 
        component: 'RECON', 
        sessionId,
        snapshotId,
        elementCount,
        pageNumber: session.currentPageNumber
      });
      
      // Return minimal data - snapshot stays in session
      return {
        sessionId,
        snapshotId,
        elementCount,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Failed to take baseline snapshot', { 
        component: 'RECON', 
        sessionId, 
        error 
      });
      throw new Error(`Failed to take baseline snapshot: ${error}`);
    }
  }
});