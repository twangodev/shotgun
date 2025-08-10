import { createStep } from '@mastra/core/workflows';

/**
 * Update TODO Status Step
 * 
 * Updates the status of the current TODO based on the decision.
 * Marks it as complete, failed, or keeps it pending for retry.
 */
export const updateTODOStatusStep = createStep({
  id: 'update-todo-status',
  description: 'Updates the status of the current TODO',
  execute: async ({ inputData }) => {
    const { currentTodo, decision } = inputData;
    
    console.log('[UPDATE] Updating TODO status:', currentTodo.task);
    
    // PLACEHOLDER: In real implementation:
    // 1. Update TODO status in session
    // 2. Track completion metrics
    // 3. Log for debugging
    
    let newStatus = 'pending';
    if (decision === 'COMPLETE') {
      newStatus = 'completed';
    } else if (decision === 'SKIP') {
      newStatus = 'skipped';
    }
    
    console.log(`[UPDATE] TODO "${currentTodo.task}" status: ${currentTodo.status} → ${newStatus}`);
    
    return {
      ...inputData,
      todoUpdated: true,
      newStatus
    };
  }
});