import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { strategyAnalyzerAgent } from '../../../../agents/StrategyAnalyzerAgent';
import { sessionStore } from '../../../../../core/session';

const analyzePageStrategyInputSchema = z.object({
  sessionId: z.string(),
  snapshotId: z.string(),
  elementCount: z.number(),
  timestamp: z.number(),
});

const analyzePageStrategyOutputSchema = z.object({
  sessionId: z.string(),
  strategy: z.enum(['FILL_REQUIRED', 'SKIP_PAGE', 'SUBMIT', 'NEED_HELP']),
  focus: z.string().optional(),
  confidence: z.number(),
  reason: z.string(),
});

/**
 * Analyze Page Strategy Step
 * 
 * Strategy analyzer agent analyzes the page snapshot and determines the strategic approach.
 * This is the first part of our sequential two-agent architecture.
 */
export const analyzePageStrategyStep = createStep({
  id: 'analyze-page-strategy',
  description: 'Strategy analyzer agent analyzes page snapshot and determines strategic approach (what to do on this page)',
  inputSchema: analyzePageStrategyInputSchema,
  outputSchema: analyzePageStrategyOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const { sessionId, snapshotId, elementCount } = inputData;
    const logger = mastra.getLogger();
    
    logger.info('Analyzing page strategy', { 
      component: 'STRATEGY', 
      sessionId,
      snapshotId,
      elementCount
    });
    
    // Retrieve the snapshot from session
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const pageData = session.getCurrentPageData();
    if (!pageData || !pageData.baselineSnapshot) {
      throw new Error(`No snapshot found for session ${sessionId}`);
    }
    
    // Convert accessibility tree to string for analysis
    const snapshotContent = JSON.stringify(pageData.baselineSnapshot.accessibilityTree, null, 2);
    
    // Create prompt for strategy analysis
    const prompt = `
Analyze this job application page and determine the strategic approach.

ACCESSIBILITY TREE:
${snapshotContent}

ANALYSIS REQUIRED:
1. What type of page is this? (login form, application form, review page, confirmation, error page)
2. Are there required fields that need to be filled? (look for *, required, mandatory markers)
3. Is this an optional section? (diversity survey, optional uploads, preferences)
4. Can you see a submit/next/continue button?
5. Are there any error messages or validation issues visible?

Based on your analysis, choose ONE strategy:
- FILL_REQUIRED: If there are required fields that must be completed
- SKIP_PAGE: If this page contains only optional content
- SUBMIT: If the application appears complete and ready to submit
- NEED_HELP: If you cannot determine what to do or the page has errors

If choosing FILL_REQUIRED, specify the focus area (e.g., "employment_section", "contact_information", "education", "skills", "questions").

Return your analysis as JSON.`;
    
    try {
      // Call strategy analyzer agent
      const result = await strategyAnalyzerAgent.generate(prompt, {
        experimental_output: {
          type: 'object',
          properties: {
            strategy: { 
              type: 'string',
              enum: ['FILL_REQUIRED', 'SKIP_PAGE', 'SUBMIT', 'NEED_HELP']
            },
            focus: { type: 'string' },
            confidence: { type: 'number' },
            reason: { type: 'string' }
          },
          required: ['strategy', 'confidence', 'reason']
        }
      });
      
      const analysis = result.object as {
        strategy: 'FILL_REQUIRED' | 'SKIP_PAGE' | 'SUBMIT' | 'NEED_HELP';
        focus?: string;
        confidence: number;
        reason: string;
      };
      
      logger.info('Page strategy determined', { 
        component: 'STRATEGY', 
        sessionId,
        strategy: analysis.strategy,
        focus: analysis.focus,
        confidence: analysis.confidence
      });
      
      console.log(`[STRATEGY] Decision: ${analysis.strategy}${analysis.focus ? ` (focus: ${analysis.focus})` : ''}`);
      console.log(`[STRATEGY] Confidence: ${analysis.confidence}`);
      console.log(`[STRATEGY] Reason: ${analysis.reason}`);
      
      // Return strategic decision
      return {
        sessionId,
        strategy: analysis.strategy,
        focus: analysis.focus,
        confidence: analysis.confidence,
        reason: analysis.reason
      };
    } catch (error) {
      logger.error('Failed to analyze page strategy', { 
        component: 'STRATEGY', 
        sessionId,
        error 
      });
      
      // Fallback to NEED_HELP if analysis fails
      return {
        sessionId,
        strategy: 'NEED_HELP' as const,
        focus: undefined,
        confidence: 0.1,
        reason: `Failed to analyze page: ${error}`
      };
    }
  }
});