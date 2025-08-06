import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * Step 3: Validate and decide continuation
 * Checks if the execution was successful and determines if another cycle is needed
 * Combines validation with the decision to continue
 */
export const validate = createStep({
  id: 'validate',
  description: 'Validate results and decide if another cycle is needed',
  inputSchema: z.object({
    actionsExecuted: z.number(),
    success: z.boolean(),
    result: z.string(),
  }),
  outputSchema: z.object({
    isComplete: z.boolean(),
    shouldContinue: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log(`[VALIDATE] Checking: ${inputData.result}`);
    
    // TODO: Replace with actual validation using agent
    // const pageState = await supervisorAgent.getCurrentPageState();
    // const isComplete = await supervisorAgent.checkIfTaskComplete(pageState);
    
    // TEMPORARY: Random 50% chance for testing cycles
    const randomChance = Math.random();
    const isComplete = randomChance > 0.5; // 50% chance to complete
    const shouldContinue = !isComplete;
    
    console.log(`[VALIDATE] Random: ${randomChance.toFixed(2)} - Complete: ${isComplete}`);
    
    const message = isComplete 
      ? 'Task completed successfully'
      : 'Additional processing needed';
    
    console.log(`[VALIDATE] Complete: ${isComplete}, Continue: ${shouldContinue}`);
    
    return {
      isComplete,
      shouldContinue,
      message,
    };
  },
});