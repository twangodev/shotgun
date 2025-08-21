import {z} from 'zod';

/**
 * Simplified schema for browser tool calls
 * Each action is self-contained with all needed information
 */
export const BrowserActionSchema = z.object({
	tool: z.enum([
		'fill_field',
		'click',
		'select',
		'checkbox',
		'upload',
		'wait',
		'scroll',
		'navigate',
		'human_intervention',  // Special action for blockers
	]).describe('The browser tool to use'),
	params: z.record(z.any()).describe('Parameters for the tool'),
});

/**
 * Simplified page analysis - just actions!
 * Empty array means complete
 * human_intervention action means blocked
 */
export const PageAnalysisSchema = z.object({
	actions: z.array(BrowserActionSchema).describe('Actions to take on this page. Empty array means complete.'),
});

// Legacy schemas kept for reference during migration
// TODO: Remove after migration complete
export const BrowserToolCallSchema = z.object({
	toolName: z.enum([
		'snapshot',
		'fill_field',
		'click',
		'select',
		'checkbox',
		'upload',
		'wait',
		'scroll',
		'navigate',
		'human_intervention',
	]).describe('The browser tool to use'),
	params: z.record(z.any()).describe('Parameters for the tool'),
	description: z.string().describe('Human-readable description of what this tool call does'),
	reasoning: z.string().describe('Why the AI decided to make this tool call'),
	confidence: z.number().min(0).max(1).describe('Confidence level for this action (0-1)'),
	expectsDomChange: z.boolean().describe('Whether this action is expected to change the DOM'),
});

// Type exports
export type BrowserAction = z.infer<typeof BrowserActionSchema>;
export type PageAnalysis = z.infer<typeof PageAnalysisSchema>;
export type BrowserToolCall = z.infer<typeof BrowserToolCallSchema>; // Legacy