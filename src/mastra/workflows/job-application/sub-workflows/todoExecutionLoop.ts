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
      console.log('[REACT-LOOP] Should continue?', inputData.shouldContinueLoop);
      // For placeholder, just run once
      return false;
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