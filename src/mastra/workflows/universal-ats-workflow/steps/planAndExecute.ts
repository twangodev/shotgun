import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { supervisorAgent } from '../../../agents/SupervisorAgent';

/**
 * Step 2: Plan and execute actions
 * Takes the todos from observation and executes them
 * Could be split into separate plan/execute steps if needed
 */
export const planAndExecute = createStep({
  id: 'plan-execute',
  description: 'Plan actions based on observation and execute them',
  inputSchema: z.object({
    pageDescription: z.string(),
    todos: z.array(z.string()),
  }),
  outputSchema: z.object({
    actionsExecuted: z.number(),
    success: z.boolean(),
    result: z.string(),
  }),
  execute: async ({ inputData, getInitData }) => {
    const { todos, pageDescription } = inputData;
    const initData = getInitData() as { url: string; cycleCount: number };
    
    console.log(`[EXECUTE] Processing ${todos.length} tasks for: ${pageDescription}`);
    
    // Use SupervisorAgent with memory to execute the tasks
    const result = await supervisorAgent.generate(
      `Execute the following tasks to progress the job application:
      
      Page context: ${pageDescription}
      
      Tasks to complete:
      ${todos.map((task, i) => `${i + 1}. ${task}`).join('\n')}
      
      Fill out forms using the user profile data from your instructions.
      Return a JSON response with:
      - actionsExecuted: Number of tasks you completed
      - success: Whether all tasks were completed successfully
      - result: A summary of what was accomplished`,
      {
        memory: {
          thread: initData.url, // Same thread as observe step
          resource: 'user-default'
        },
        experimental_output: {
          type: 'object',
          properties: {
            actionsExecuted: { type: 'number' },
            success: { type: 'boolean' },
            result: { type: 'string' }
          },
          required: ['actionsExecuted', 'success', 'result']
        }
      }
    );
    
    return result.object as {
      actionsExecuted: number;
      success: boolean;
      result: string;
    };
  },
});