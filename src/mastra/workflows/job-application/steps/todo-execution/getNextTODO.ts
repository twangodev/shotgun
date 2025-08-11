import { createStep } from '@mastra/core/workflows';

/**
 * Get Next TODO Step
 * 
 * Retrieves the next pending TODO from the list.
 * Uses simple array with status tracking - no mutations, just finds first pending.
 */
export const getNextTODOStep = createStep({
  id: 'get-next-todo',
  description: 'Gets the next pending TODO from the list',
  execute: async ({ inputData }) => {
    const { todos = [] } = inputData;
    
    console.log('[GET-TODO] Checking TODO queue...', {
      total: todos.length,
      pending: todos.filter(t => t.status === 'pending').length,
      complete: todos.filter(t => t.status === 'complete').length
    });
    
    // Find first pending TODO (maintains order)
    const nextTodo = todos.find(t => t.status === 'pending');
    
    if (!nextTodo) {
      console.log('[GET-TODO] No pending TODOs remaining');
      return {
        ...inputData,
        currentTodo: null,
        hasPendingTodos: false
      };
    }
    
    // Mark as processing (in the workflow data, not mutating original)
    const todoIndex = todos.indexOf(nextTodo);
    const updatedTodos = [...todos];
    updatedTodos[todoIndex] = { ...nextTodo, status: 'processing' };
    
    console.log(`[GET-TODO] Processing: "${nextTodo.task}"`);
    
    return {
      ...inputData,
      todos: updatedTodos,
      currentTodo: nextTodo,
      currentTodoIndex: todoIndex,
      hasPendingTodos: true
    };
  }
});