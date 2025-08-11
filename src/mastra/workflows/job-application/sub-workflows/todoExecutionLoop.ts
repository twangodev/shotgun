import { createWorkflow } from '@mastra/core/workflows';
import * as todoExec from '../steps/todo-execution';

/**
 * TODO Execution Loop Sub-Workflow
 * 
 * Implements the ReAct pattern for executing a single TODO.
 * Think → Act → Observe → Decide loop with retry capability.
 */
export const todoExecutionLoop = createWorkflow({
  id: 'todo-execution-loop',
  description: 'ReAct loop for executing a single TODO with retry capability',
})
  // Get the next TODO to process
  .then(todoExec.getNextTODOStep)
  
  // ReAct loop for this TODO
  .dowhile(
    createWorkflow({
      id: 'react-loop',
      description: 'Think-Act-Observe loop for TODO'
    })
      // THINK: Analyze TODO and plan actions
      .then(todoExec.thinkStep)
      
      // ACT: Execute the planned actions
      .then(todoExec.actStep)
      
      // OBSERVE: Check what happened
      .then(todoExec.observeStep)
      
      // DECIDE: Determine if we need to retry
      .then(todoExec.decideContinuationStep)
      
      .commit(),
    
    // Continue loop if decision is RETRY
    async ({ inputData }) => {
      const { decision = 'COMPLETE', retryCount = 0 } = inputData;
      const maxRetries = 3;
      
      // Continue if decision is RETRY and we haven't hit max retries
      const shouldRetry = decision === 'RETRY' && retryCount < maxRetries;
      
      console.log('[REACT-LOOP] Decision:', decision, 'Retry count:', retryCount);
      
      if (shouldRetry) {
        console.log('[REACT-LOOP] Retrying TODO execution...');
      } else if (retryCount >= maxRetries) {
        console.log('[REACT-LOOP] Max retries reached, marking as failed');
      }
      
      return shouldRetry;
    }
  )
  
  // Update TODO status based on final decision
  .then(todoExec.updateTODOStatusStep)
  
  .commit();

// Implementation notes:
// - Each TODO gets its own ReAct loop
// - Can retry on errors
// - Updates TODO status when done
// - Returns to main loop for next TODO