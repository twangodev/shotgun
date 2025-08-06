import { createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { MAX_CYCLES } from './config';

// Import steps
import { observeAndAnalyze } from './steps/observeAndAnalyze';
import { planAndExecute } from './steps/planAndExecute';
import { validate } from './steps/validate';

/**
 * Universal ATS Workflow
 * 
 * Simplified adaptive workflow that handles any ATS system through iterative cycles.
 * Each cycle: observes/analyzes, plans/executes, and validates.
 * Continues until validation passes or max cycles reached.
 */
export const universalATSWorkflow = createWorkflow({
  id: 'universal-ats-workflow',
  description: 'Simplified ATS workflow',
  inputSchema: z.object({
    jobUrl: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
})
  // Initialize first cycle
  .map(async ({ inputData }) => ({
    url: inputData.jobUrl,
    cycleCount: 1,
  }))
  // Run adaptive cycles
  .dowhile(
    // Inner cycle workflow
    createWorkflow({ 
      id: 'cycle',
      inputSchema: z.object({ 
        url: z.string(), 
        cycleCount: z.number() 
      }),
      outputSchema: z.object({ 
        shouldContinue: z.boolean(), 
        cycleCount: z.number(),
        url: z.string(),
      }),
    })
      .then(observeAndAnalyze)
      .then(planAndExecute)
      .then(validate)
      .map(async ({ inputData, getInitData }) => {
        const validationResult = inputData;
        const init = getInitData() as { url: string; cycleCount: number };
        
        return {
          shouldContinue: validationResult.shouldContinue,
          cycleCount: init.cycleCount + 1,
          url: init.url,
        };
      })
      .commit(),
    // Continue condition: keep going while not complete and under max cycles
    async ({ inputData }) => {
      return inputData.shouldContinue && inputData.cycleCount <= MAX_CYCLES;
    }
  )
  // Final output
  .map(async ({ inputData }) => ({
    success: !inputData.shouldContinue,
    message: inputData.shouldContinue 
      ? `Reached max cycles (${MAX_CYCLES})`
      : `Completed successfully after ${inputData.cycleCount - 1} cycle(s)`,
  }))
  .commit();