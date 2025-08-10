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
      console.log('[PAGE-LOOP] Checking if all TODOs complete...');
      // For placeholder, just run once
      console.log('[PAGE-LOOP] Placeholder mode - exiting after one TODO');
      return true;
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