import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const extractRelevantActionsInputSchema = z.object({
  sessionId: z.string(),
  strategy: z.enum(['FILL_REQUIRED', 'SKIP_PAGE', 'SUBMIT', 'NEED_HELP']),
  focus: z.string().optional(),
  confidence: z.number(),
  reason: z.string(),
});

const extractRelevantActionsOutputSchema = z.object({
  sessionId: z.string(),
  actions: z.array(z.object({
    selector: z.string(),
    type: z.enum(['text', 'select', 'click', 'checkbox', 'radio', 'file']),
    label: z.string(),
    required: z.boolean(),
    fieldGroup: z.string().optional(),
    priority: z.number(),
  })),
  totalExtracted: z.number(),
  filteredOut: z.number(),
});

/**
 * Extract Relevant Actions Step
 * 
 * Action extractor agent analyzes the page based on supervisor's strategy
 * and extracts only the relevant actions to execute.
 * This is the second part of our sequential two-agent architecture.
 * 
 * PLACEHOLDER IMPLEMENTATION - Returns mock filtered actions
 */
export const extractRelevantActionsStep = createStep({
  id: 'extract-relevant-actions',
  description: 'Action extractor agent identifies relevant form fields and actions based on strategic decision',
  inputSchema: extractRelevantActionsInputSchema,
  outputSchema: extractRelevantActionsOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const { sessionId, strategy, focus, confidence } = inputData;
    const logger = mastra.getLogger();
    
    logger.info('Extracting relevant actions', { 
      component: 'EXTRACTOR', 
      sessionId,
      strategy,
      focus
    });
    
    // PLACEHOLDER: Mock action extraction
    // In real implementation, this would:
    // 1. Retrieve snapshot from session
    // 2. Call action extractor agent with snapshot + strategy
    // 3. Get filtered list of actions based on focus area
    
    console.log('[EXTRACTOR] Extracting actions based on strategy:', strategy);
    if (focus) {
      console.log(`[EXTRACTOR] Focusing on: ${focus}`);
    }
    
    let actions = [];
    let totalExtracted = 0;
    let filteredOut = 0;
    
    if (strategy === 'SKIP_PAGE') {
      console.log('[EXTRACTOR] Strategy is SKIP_PAGE, no actions to extract');
      actions = [];
    } else if (strategy === 'SUBMIT') {
      console.log('[EXTRACTOR] Looking for submit button only');
      actions = [
        {
          selector: 'button[type="submit"]',
          type: 'click',
          label: 'Submit Application',
          required: true,
          fieldGroup: 'submission',
          priority: 1
        }
      ];
      totalExtracted = 1;
    } else if (strategy === 'FILL_REQUIRED') {
      // Mock different actions based on focus area
      if (focus === 'employment_section') {
        console.log('[EXTRACTOR] Extracting employment-related fields');
        actions = [
          {
            selector: '#current-employer',
            type: 'text',
            label: 'Current Employer',
            required: true,
            fieldGroup: 'employment',
            priority: 1
          },
          {
            selector: '#job-title',
            type: 'text',
            label: 'Job Title',
            required: true,
            fieldGroup: 'employment',
            priority: 2
          },
          {
            selector: '#years-experience',
            type: 'select',
            label: 'Years of Experience',
            required: true,
            fieldGroup: 'employment',
            priority: 3
          }
        ];
        totalExtracted = 5;
        filteredOut = 2; // Simulating we filtered out optional fields
      } else if (focus === 'contact_information') {
        console.log('[EXTRACTOR] Extracting contact fields');
        actions = [
          {
            selector: '#email',
            type: 'text',
            label: 'Email Address',
            required: true,
            fieldGroup: 'contact',
            priority: 1
          },
          {
            selector: '#phone',
            type: 'text',
            label: 'Phone Number',
            required: true,
            fieldGroup: 'contact',
            priority: 2
          },
          {
            selector: '#address',
            type: 'text',
            label: 'Street Address',
            required: false,
            fieldGroup: 'contact',
            priority: 3
          }
        ];
        totalExtracted = 3;
        filteredOut = 0;
      } else {
        // Default generic fields
        console.log('[EXTRACTOR] Extracting generic form fields');
        actions = [
          {
            selector: '#field1',
            type: 'text',
            label: 'Generic Field 1',
            required: true,
            fieldGroup: 'general',
            priority: 1
          }
        ];
        totalExtracted = 1;
        filteredOut = 0;
      }
    }
    
    console.log(`[EXTRACTOR] Extracted ${actions.length} relevant actions`);
    console.log(`[EXTRACTOR] Filtered out ${filteredOut} irrelevant actions`);
    
    logger.info('Actions extracted', { 
      component: 'EXTRACTOR', 
      sessionId,
      actionCount: actions.length,
      totalExtracted,
      filteredOut
    });
    
    // Return extracted actions
    return {
      sessionId,
      actions,
      totalExtracted,
      filteredOut
    };
  }
});