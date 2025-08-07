import { createWorkflow } from '@mastra/core/workflows';
import * as actions from '../steps/actions';
import * as verification from '../steps/verification';
import * as errorHandling from '../steps/error-handling';

/**
 * Action Execution Loop Sub-Workflow
 * 
 * Inner loop that processes actions on a single page.
 * Executes batches of actions with smart verification and error handling.
 * Continues until all actions on the current page are complete.
 */
export const actionExecutionLoop = createWorkflow({
  id: 'action-execution-loop',
  description: 'Processes all actions on current page using smart batching. Executes actions, verifies changes via diff, handles errors, and updates queue. Repeats until page is complete.',
})
  // Get next batch of actions based on risk levels
  .then(actions.getNextActionBatchStep)
  
  // Classify risk levels for batching strategy
  .then(actions.classifyActionRiskStep)
  
  // Execute the batch
  .then(actions.executeActionBatchStep)
  
  // Take checkpoint for diff (based on risk level)
  .then(verification.takeCheckpointSnapshotStep)
  
  // Compute diff to see what changed
  .then(verification.computeDiffStep)
  
  // Analyze the diff with AI
  .then(verification.analyzeDiffStep)
  
  // Detect types of changes
  .then(verification.detectChangesStep)
  
  // Handle errors if any found
  .then(errorHandling.detectErrorsStep)
  .then(errorHandling.classifyErrorsStep)
  .then(errorHandling.generateFixActionsStep)
  .then(errorHandling.executeErrorFixesStep)
  
  // Update action queue with results
  .then(actions.updateActionQueueStep)
  
  .commit();

// Implementation notes:
// - This workflow will be called in a loop (dountil)
// - Returns whether all actions are complete
// - Smart batching based on risk levels
// - Diff-based verification for efficiency
// - Integrated error recovery