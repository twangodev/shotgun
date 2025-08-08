import { createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import * as init from './steps/initialization';
import * as finalization from './steps/finalization';
import { pageProcessingLoop } from './sub-workflows';

/**
 * Input schema for the workflow
 * Defines what data is needed to start a job application
 */
const jobApplicationInputSchema = z.object({
  applicationUrl: z.string().url(),
  // Future additions:
  // userDataRef: z.string().optional(),
  // options: z.object({
  //   maxPages: z.number().optional(),
  //   timeout: z.number().optional(),
  //   retryOnError: z.boolean().optional(),
  // }).optional(),
});

/**
 * Output schema for the workflow
 * Defines what the workflow returns upon completion
 */
const jobApplicationOutputSchema = z.object({
  success: z.boolean(),
  sessionId: z.string(),
  confirmationNumber: z.string().optional(),
  message: z.string(),
});

/**
 * Universal Job Application Workflow
 * 
 * Main workflow that orchestrates the entire job application process.
 * Handles initialization, page-by-page processing, and finalization.
 * Adapts to any job application form structure.
 * 
 * Architecture:
 * - Initialization: Set up session and navigate
 * - Page Loop: Process each page sequentially
 *   - Reconnaissance: Snapshot and extract actions
 *   - Action Loop: Execute actions with smart batching
 *   - Navigation: Move to next page
 * - Finalization: Submit and capture confirmation
 * 
 * Key Features:
 * - Token-efficient diff-based verification
 * - Smart action batching based on risk
 * - Integrated error recovery
 * - Human-like execution patterns
 * - External memory for state management
 */
export const jobApplicationWorkflow = createWorkflow({
  id: 'job-application-workflow',
  description: 'Universal job application automation workflow. Handles any form structure with smart adaptation, diff-based verification, and human-like behavior.',
  inputSchema: jobApplicationInputSchema,
  outputSchema: jobApplicationOutputSchema,
})
  // INITIALIZATION PHASE
  // Set up session and navigate to application
  .then(init.initializeSessionStep)
  .then(init.navigateToUrlStep)
  
  // MAIN PAGE PROCESSING LOOP
  // Continue until application is complete
  .dountil(
    pageProcessingLoop,
    async ({ inputData }) => {
      // Check if application is complete
      // This will be determined by landing on confirmation page
      // or detecting submission success
      // Placeholder for now - will be implemented with proper data flow
      console.log('[MAIN] Checking if application complete...');
      return inputData.applicationComplete || false;
    }
  )
  
  // FINALIZATION PHASE
  // Submit and capture confirmation
  .then(finalization.finalVerificationStep)
  .then(finalization.submitApplicationStep)
  .then(finalization.captureConfirmationStep)
  .then(finalization.cleanupSessionStep)
  
  .commit();

/**
 * Workflow Execution Example (placeholder)
 * 
 * const result = await jobApplicationWorkflow.execute({
 *   url: 'https://example.com/careers/apply',
 *   userData: {
 *     fullName: 'John Doe',
 *     email: 'john@example.com',
 *     phone: '+1-555-0123',
 *     // ... more user data
 *   },
 *   options: {
 *     maxPages: 10,
 *     timeout: 30 * 60 * 1000, // 30 minutes
 *     retryOnError: true,
 *   }
 * });
 * 
 * console.log('Application submitted:', result.confirmationNumber);
 */

// Export all components for testing and modularity
export * from './steps/initialization';
export * from './steps/reconnaissance';
export * from './steps/actions';
export * from './steps/verification';
export * from './steps/error-handling';
export * from './steps/navigation';
export * from './steps/finalization';
export * from './sub-workflows';