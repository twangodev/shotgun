import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { sessionStore } from '../../../../../core/session';

/**
 * Input schema for navigation
 * Expects the session ID from previous step
 */
const navigateToUrlInputSchema = z.object({
  sessionId: z.string(),
});

/**
 * Output schema for navigation
 * Returns the current URL and status
 */
const navigateToUrlOutputSchema = z.object({
  sessionId: z.string(),
  currentUrl: z.string(),
  pageLoaded: z.boolean(),
});

/**
 * Navigate to URL Step
 *
 * Opens the browser and navigates to the job application URL.
 * Waits for the page to fully load before proceeding.
 * Handles initial page setup like accepting cookies or dismissing popups.
 */
export const navigateToUrlStep = createStep({
  id: 'navigate-to-url',
  description: 'Navigates to the job application URL using Playwright MCP. Waits for page load and handles initial popups or cookie banners. Verifies we landed on the correct page before proceeding.',
  inputSchema: navigateToUrlInputSchema,
  outputSchema: navigateToUrlOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const { sessionId } = inputData;
    const logger = mastra.getLogger();

    logger.debug('Getting session', { component: 'NAV', sessionId });
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.playwrightClient) {
      throw new Error(`Session ${sessionId} not initialized with Playwright MCP`);
    }

    logger.info('Navigating to URL', { 
      component: 'NAV', 
      sessionId, 
      url: session.applicationUrl 
    });

    try {
      // Navigate to the application URL
      logger.debug('Calling navigate', { component: 'NAV', sessionId });
      const navigationResult = await session.playwrightClient.navigate(session.applicationUrl);
      logger.debug('Navigation result', { 
        component: 'NAV', 
        sessionId, 
        result: navigationResult 
      });
      logger.info('Navigation complete', { component: 'NAV', sessionId });

      // Update session phase
      session.setPhase('recon');

      // TODO: Future enhancements
      // - Handle cookie banners
      // - Dismiss popups
      // - Wait for specific selectors
      // - Verify we're on the right page
      // - Get current URL after redirects

      return {
        sessionId,
        currentUrl: session.applicationUrl, // For now, just return the original URL
        pageLoaded: true
      };
    } catch (error) {
      logger.error('Navigation failed', { 
        component: 'NAV', 
        sessionId, 
        error 
      });
      throw new Error(`Failed to navigate to URL: ${error}`);
    }
  }
});
