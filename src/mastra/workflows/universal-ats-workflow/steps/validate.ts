import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { supervisorAgent } from '../../../agents/SupervisorAgent';

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
  execute: async ({ inputData, getInitData }) => {
    const initData = getInitData() as { url: string; cycleCount: number };
    
    console.log(`[VALIDATE] Checking: ${inputData.result}`);
    
    // Use SupervisorAgent with memory to validate the application status
    const result = await supervisorAgent.generate(
      `Check the current state of the job application.
      
      Previous action result: ${inputData.result}
      Actions executed: ${inputData.actionsExecuted}
      
      Determine if:
      1. The application has been successfully submitted (look for confirmation messages, thank you pages, etc.)
      2. More steps are needed (additional pages, required fields, etc.)
      3. There are any errors that need to be addressed
      
      Return a JSON response with:
      - isComplete: Whether the entire application is finished
      - shouldContinue: Whether we need another cycle to continue
      - message: Explanation of the current status`,
      {
        memory: {
          thread: initData.url, // Same thread as other steps
          resource: 'user-default'
        },
        experimental_output: {
          type: 'object',
          properties: {
            isComplete: { type: 'boolean' },
            shouldContinue: { type: 'boolean' },
            message: { type: 'string' }
          },
          required: ['isComplete', 'shouldContinue', 'message']
        }
      }
    );
    
    const validationResult = result.object as {
      isComplete: boolean;
      shouldContinue: boolean;
      message: string;
    };
    
    console.log(`[VALIDATE] Complete: ${validationResult.isComplete}, Continue: ${validationResult.shouldContinue}`);
    
    return validationResult;
  },
});