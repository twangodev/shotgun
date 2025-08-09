import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { sessionStore } from '../../../../../core/session';

/**
 * Input schema for cleanup
 * Expects the session ID to clean up
 */
const cleanupSessionInputSchema = z.object({
  sessionId: z.string(),
});

/**
 * Output schema for cleanup
 * Returns success status
 */
const cleanupSessionOutputSchema = z.object({
  sessionId: z.string(),
  cleaned: z.boolean(),
});

/**
 * Cleanup Session Step
 * 
 * Properly closes the Playwright MCP connection and removes the session from memory.
 * This ensures browser resources are released and prevents memory leaks.
 */
export const cleanupSessionStep = createStep({
  id: 'cleanup-session',
  description: 'Closes the Playwright MCP client, releases browser resources, and removes the session from memory store.',
  inputSchema: cleanupSessionInputSchema,
  outputSchema: cleanupSessionOutputSchema,
  execute: async ({ inputData }) => {
    const { sessionId } = inputData;
    
    console.log('[CLEANUP] Starting session cleanup...');
    console.log('[CLEANUP] Session ID:', sessionId);
    
    try {
      // Close session and disconnect MCP
      const success = await sessionStore.closeSession(sessionId);
      
      if (success) {
        console.log('[CLEANUP] Session closed successfully');
        console.log('[CLEANUP] Browser resources released');
        console.log('[CLEANUP] Session removed from store');
      } else {
        console.warn('[CLEANUP] Session not found in store');
      }
      
      return {
        sessionId,
        cleaned: success
      };
    } catch (error) {
      console.error('[CLEANUP] Error during cleanup:', error);
      // Try to delete anyway to prevent memory leak
      sessionStore.deleteSession(sessionId);
      throw new Error(`Failed to cleanup session: ${error}`);
    }
  }
});