import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { sessionStore } from '../../../../../core/session';

/**
 * Input schema for session initialization
 * Validates that we have a valid URL to apply to
 */
const initializeSessionInputSchema = z.object({
  applicationUrl: z.string().url(),
});

/**
 * Output schema for session initialization
 * Returns the session ID and initialization status
 */
const initializeSessionOutputSchema = z.object({
  sessionId: z.string(),
  initialized: z.boolean(),
});

/**
 * Initialize Session Step
 *
 * Creates a new session for the job application process.
 * Sets up the session in memory store for tracking workflow state.
 */
export const initializeSessionStep = createStep({
  id: 'initialize-session',
  description: 'Creates a new session with unique ID. Sets up in-memory session tracking for the job application workflow.',
  inputSchema: initializeSessionInputSchema,
  outputSchema: initializeSessionOutputSchema,
  execute: async ({ inputData }) => {
    const { applicationUrl } = inputData;
    
    console.log('[INIT] Creating new session...');
    console.log('[INIT] Application URL:', applicationUrl);
    
    // Create session using the core session store
    const session = sessionStore.createSession(applicationUrl);
    
    console.log(`[INIT] Session created with ID: ${session.id}`);
    console.log('[INIT] Session initialized and ready');

    // Return minimal data - just the session ID
    return {
      sessionId: session.id,
      initialized: true
    };
  }
});
