import { createStep } from '@mastra/core/workflows';

/**
 * Update TODO Status Step
 * 
 * Updates the status of the current TODO based on execution results.
 * Maintains immutable array updates - no mutations.
 */
export const updateTODOStatusStep = createStep({
  id: 'update-todo-status',
  description: 'Updates the status of the current TODO',
  execute: async ({ inputData }) => {
    const { currentTodoIndex, todos = [], decision = 'RETRY' } = inputData;
    
    if (currentTodoIndex === undefined || !todos[currentTodoIndex]) {
      console.log('[UPDATE] No TODO to update');
      return inputData;
    }
    
    const currentTodo = todos[currentTodoIndex];
    
    // Map decision to status
    let newStatus = 'pending';  // Default for retry
    if (decision === 'COMPLETE') {
      newStatus = 'complete';
    } else if (decision === 'SKIP' || decision === 'FAILED') {
      newStatus = 'failed';
    }
    
    // Update TODO in array (immutable)
    const updatedTodos = [...todos];
    updatedTodos[currentTodoIndex] = {
      ...currentTodo,
      status: newStatus,
      retryCount: currentTodo.retryCount ? currentTodo.retryCount + 1 : 0
    };
    
    console.log(`[UPDATE] TODO "${currentTodo.task}": ${currentTodo.status} → ${newStatus}`);
    
    // Calculate stats
    const stats = {
      total: updatedTodos.length,
      complete: updatedTodos.filter(t => t.status === 'complete').length,
      failed: updatedTodos.filter(t => t.status === 'failed').length,
      pending: updatedTodos.filter(t => t.status === 'pending').length
    };
    
    console.log('[UPDATE] Queue status:', stats);
    
    return {
      ...inputData,
      todos: updatedTodos,
      todoStats: stats,
      allTodosProcessed: stats.pending === 0
    };
  }
});