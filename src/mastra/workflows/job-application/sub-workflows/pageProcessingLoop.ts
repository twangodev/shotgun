import { createWorkflow } from '@mastra/core/workflows';
import * as recon from '../steps/reconnaissance';
import { todoExecutionLoop } from './todoExecutionLoop';

/**
 * Page Processing Loop Sub-Workflow (Simplified MVP)
 * 
 * Minimal flow: Snapshot → TODOs → Execute → Check
 * Navigation is handled as a TODO (e.g., "Click continue")
 */
export const pageProcessingLoop = createWorkflow({
  id: 'page-processing-loop',
  description: 'Simplified page processing using TODO list and ReAct execution',
})
  // Take snapshot of current page
  .then(recon.takeBaselineSnapshotStep)
  
  // Generate TODO list (includes navigation as a TODO)
  .then(recon.generateTODOListStep)
  
  // Execute all TODOs using ReAct pattern
  .dountil(
    todoExecutionLoop,
    async ({ inputData }) => {
      // Continue until all TODOs are processed
      const { todos = [], allTodosProcessed = false } = inputData;
      
      const pendingCount = todos.filter((t: any) => t.status === 'pending').length;
      const completeCount = todos.filter((t: any) => t.status === 'complete').length;
      const failedCount = todos.filter((t: any) => t.status === 'failed').length;
      
      console.log('[PAGE-LOOP] TODO Status:', {
        pending: pendingCount,
        complete: completeCount,
        failed: failedCount,
        total: todos.length
      });
      
      // Stop when no pending TODOs remain
      const shouldStop = pendingCount === 0 || allTodosProcessed;
      
      if (shouldStop) {
        console.log('[PAGE-LOOP] All TODOs processed, moving to page complete check');
      }
      
      return shouldStop;
    }
  )
  
  // Check if page is complete and ready for next
  .then(recon.checkPageCompleteStep)
  
  .commit();

// Implementation notes:
// - This workflow processes one complete page
// - Called in a loop until application complete
// - Expensive snapshot only once per page
// - Smart batching in inner action loop
// - Clean separation of phases