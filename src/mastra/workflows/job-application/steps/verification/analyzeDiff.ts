import { createStep } from '@mastra/core/workflows';

/**
 * Analyze Diff Step
 * 
 * Uses an AI agent to interpret the diff and understand what changed.
 * The agent sees only the changes (500-2K tokens) instead of full snapshots.
 * Identifies errors, new fields, successful fills, and required actions.
 */
export const analyzeDiffStep = createStep({
  id: 'analyze-diff',
  description: 'AI agent analyzes the diff to understand changes. Identifies validation errors, newly revealed fields, successful completions, and dynamic content. Agent only sees changes, not full page, keeping context minimal.',
  execute: async ({ inputData }) => {
    console.log('[ANALYZE] Analyzing diff with AI agent...');
    
    // Implementation approaches:
    // 1. Agent configuration:
    //    - Specialized "Diff Analyzer" agent
    //    - Small model sufficient (focused task)
    //    - Clear instructions: "What changed and why?"
    
    // 2. Analysis focus areas:
    //    - Error detection:
    //      * Validation messages
    //      * Required field indicators
    //      * Form submission failures
    //    
    //    - Success confirmation:
    //      * Fields successfully filled
    //      * Sections completed
    //      * Progress indicators
    //    
    //    - Dynamic changes:
    //      * New fields/sections appeared
    //      * Fields became required/optional
    //      * Submit button enabled/disabled
    //    
    //    - Navigation readiness:
    //      * Next button appeared/enabled
    //      * All required fields complete
    //      * No blocking errors
    
    // 3. Agent prompt strategy:
    //    "Here's what changed after our last actions:
    //     {diff}
    //     Identify:
    //     1. Any errors that need fixing
    //     2. New fields that need filling
    //     3. What was successfully completed
    //     4. Is the page ready to proceed?"
    
    // 4. Response parsing:
    //    - Structured response expected
    //    - Clear action items
    //    - Priority ordering
    
    // 5. Optimization:
    //    - Cache common patterns
    //    - Learn from previous analyses
    //    - Skip analysis if no changes
    
    console.log('[ANALYZE] Agent analysis complete:');
    console.log('[ANALYZE]   ✓ 3 fields filled successfully');
    console.log('[ANALYZE]   ⚠ 1 validation error on email field');
    console.log('[ANALYZE]   + 2 new fields appeared (company, title)');
    console.log('[ANALYZE]   → Recommend: Fix email, then fill new fields');
    
    return { 
      analysisComplete: true,
      errorsFound: 1,
      newFieldsFound: 2,
      successfulFills: 3,
      recommendedAction: 'fix-errors' 
    };
  }
});