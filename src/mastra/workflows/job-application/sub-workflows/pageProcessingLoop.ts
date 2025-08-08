import { createWorkflow } from '@mastra/core/workflows';
import * as recon from '../steps/reconnaissance';
import * as navigation from '../steps/navigation';
import { actionExecutionLoop } from './actionExecutionLoop';

/**
 * Page Processing Loop Sub-Workflow
 * 
 * Processes a single page from reconnaissance through navigation.
 * Handles the complete lifecycle of one page in the application.
 * Includes action execution loop and page transition logic.
 */
export const pageProcessingLoop = createWorkflow({
  id: 'page-processing-loop',
  description: 'Complete page processing from initial snapshot through navigation. Performs reconnaissance, executes all actions via inner loop, then handles navigation to next page.',
})
  // RECONNAISSANCE PHASE
  // Take expensive snapshot once per page
  .then(recon.takeBaselineSnapshotStep)
  
  // Extract all possible actions from page
  .then(recon.extractPageActionsStep)
  
  // Build smart action queue with risk levels
  .then(recon.buildActionQueueStep)
  
  // Store everything externally
  .then(recon.storePageStructureStep)
  
  // Clear context to save tokens
  .then(recon.clearContextStep)
  
  // ACTION EXECUTION PHASE
  // Loop until all actions complete
  .dountil(
    actionExecutionLoop,
    async ({ inputData }) => {
      // For dry run: Exit after one iteration
      console.log('[PAGE-LOOP] Checking if actions complete...');
      console.log('[PAGE-LOOP] Dry run mode - exiting after one action batch');
      return true; // Exit immediately for dry run
    }
  )
  
  // NAVIGATION PHASE
  // Check if we can navigate to next page
  .then(navigation.checkForNavigationStep)
  
  // Execute navigation if available
  .then(navigation.executeNavigationStep)
  
  // Verify page changed
  .then(navigation.detectPageChangeStep)
  
  // Update state for next iteration
  .then(navigation.updatePageStateStep)
  
  .commit();

// Implementation notes:
// - This workflow processes one complete page
// - Called in a loop until application complete
// - Expensive snapshot only once per page
// - Smart batching in inner action loop
// - Clean separation of phases