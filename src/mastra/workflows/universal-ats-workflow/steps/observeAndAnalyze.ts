import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { supervisorAgent } from '../../../agents/SupervisorAgent';

/**
 * Step 1: Observe and understand the page
 * Combines observation and analysis into a single step
 * Returns a list of todos that need to be executed
 */
export const observeAndAnalyze = createStep({
  id: 'observe-analyze',
  description: 'Observe page and understand what needs to be done',
  inputSchema: z.object({
    url: z.string(),
    cycleCount: z.number(),
  }),
  outputSchema: z.object({
    pageDescription: z.string(),
    todos: z.array(z.string()), // Simple list of things to do
  }),
  execute: async ({ inputData }) => {
    console.log(`[OBSERVE] Cycle ${inputData.cycleCount}: ${inputData.url}`);

    // Use SupervisorAgent with memory to analyze the page
    const result = await supervisorAgent.generate(
      `Navigate to ${inputData.url} and analyze what needs to be done to complete the job application.
      This is cycle ${inputData.cycleCount}.

      Return a JSON response with:
      - pageDescription: A brief description of what you see
      - todos: An array of specific tasks that need to be completed`,
      {
        memory: {
          thread: inputData.url, // Use job URL as thread ID for consistency
          resource: 'user-default'
        },
        experimental_output: {
          type: 'object',
          properties: {
            pageDescription: { type: 'string' },
            todos: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['pageDescription', 'todos']
        },
      }
    );

    return result.object as {
      pageDescription: string;
      todos: string[];
    };
  },
});
