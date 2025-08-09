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
  execute: async ({ inputData, mastra }) => {
    const { applicationUrl } = inputData;
    const logger = mastra.getLogger();
    
    logger.info('Creating new session', { 
      component: 'INIT', 
      applicationUrl 
    });
    
    try {
      // Set the logger on the session store
      sessionStore.setLogger(logger);
      
      // Create session using the core session store (now async)
      const session = await sessionStore.createSession(applicationUrl);
      
      logger.info('Session created successfully', { 
        component: 'INIT', 
        sessionId: session.id 
      });
      logger.debug('Playwright MCP connected and ready', { 
        component: 'INIT', 
        sessionId: session.id 
      });

      // Return minimal data - just the session ID
      return {
        sessionId: session.id,
        initialized: true
      };
    } catch (error) {
      logger.error('Failed to initialize session', { 
        component: 'INIT', 
        error 
      });
      throw new Error(`Failed to initialize session: ${error}`);
    }
  }
});
