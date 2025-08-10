import { createStep } from '@mastra/core/workflows';

/**
 * Get Next TODO Step
 * 
 * Retrieves the next pending TODO from the list.
 * Part of the ReAct loop for executing individual TODOs.
 */
export const getNextTODOStep = createStep({
  id: 'get-next-todo',
  description: 'Gets the next pending TODO from the list',
  execute: async ({ inputData }) => {
    console.log('[GET-TODO] Getting next pending TODO...');
    
    // PLACEHOLDER: In real implementation:
    // 1. Get TODOs from session
    // 2. Find first pending TODO (order matters!)
    // 3. Return it for processing
    
    const mockCurrentTodo = {
      task: 'Fill employment history section',
      status: 'pending'
    };
    
    console.log(`[GET-TODO] Next task: "${mockCurrentTodo.task}"`);
    
    return {
      sessionId: inputData.sessionId,
      currentTodo: mockCurrentTodo,
      remainingTodos: 3
    };
  }
});