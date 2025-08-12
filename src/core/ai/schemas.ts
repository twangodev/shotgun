import {z} from 'zod';

/**
 * Schema for field mapping from AI analysis
 */
export const FieldMappingSchema = z.object({
	ref: z.string().describe('The ref attribute from the accessibility snapshot'),
	fieldType: z.enum([
		'text',
		'email',
		'phone',
		'url',
		'file',
		'select',
		'checkbox',
		'radio',
		'textarea',
		'button',
		'link',
	]).describe('The type of form field'),
	label: z.string().describe('The field label or aria-label'),
	profileKey: z.string().optional().describe('The key from UserProfile to map to this field'),
	value: z.string().optional().describe('The value to fill in this field'),
	required: z.boolean().optional().describe('Whether this field is required'),
	reasoning: z.string().describe('AI reasoning for this mapping decision'),
});

/**
 * Schema for browser tool calls the AI decides to make
 */
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

/**
 * Schema for page analysis result
 */
export const PageAnalysisSchema = z.object({
	pageType: z.enum([
		'job_application_form',
		'login_page',
		'registration_page',
		'confirmation_page',
		'error_page',
		'captcha_page',
		'irrelevant_page',
		'multi_step_form',
		'homepage',
		'job_listing',
		'company_page',
		'unknown',
	]).describe('The type of page detected'),
	
	pageContext: z.object({
		title: z.string().describe('Page title'),
		url: z.string().describe('Current URL'),
		description: z.string().describe('Brief description of what the page contains'),
		hasApplicationForm: z.boolean().describe('Whether the page contains a job application form'),
		formSections: z.array(z.string()).optional().describe('Identified form sections (e.g., Personal Info, Work Experience)'),
	}),
	
	requiredActions: z.array(BrowserToolCallSchema).optional().default([]).describe('Ordered list of browser tool calls to make on this page'),
	
	fieldMappings: z.array(FieldMappingSchema).optional().default([]).describe('Mappings of form fields to profile data'),
	
	interventionRequired: z.object({
		needed: z.boolean().describe('Whether human intervention is required'),
		reason: z.string().optional().describe('Why intervention is needed'),
		type: z.enum(['captcha', 'login', 'confirmation', 'error', 'unclear']).optional(),
	}),
	
	confidence: z.object({
		overall: z.number().min(0).max(1).describe('Overall confidence in the analysis'),
		reasoning: z.string().describe('Explanation of confidence level'),
	}),
	
	nextSteps: z.object({
		expectsNavigation: z.boolean().describe('Whether actions will lead to page navigation'),
		expectedOutcome: z.string().describe('What should happen after executing actions'),
		alternativeStrategy: z.string().optional().describe('Backup plan if primary actions fail'),
	}),
});

/**
 * Schema for execution result
 */
export const ExecutionResultSchema = z.object({
	success: z.boolean(),
	actionsTaken: z.array(z.object({
		toolCall: BrowserToolCallSchema,
		result: z.enum(['success', 'failed', 'skipped']),
		error: z.string().optional(),
		duration: z.number().describe('Time taken in milliseconds'),
		snapshotDiff: z.object({
			urlChanged: z.boolean(),
			titleChanged: z.boolean(),
			domChanged: z.boolean(),
		}).optional(),
	})),
	pageChanged: z.boolean().describe('Whether the page navigated after actions'),
	newUrl: z.string().optional().describe('New URL if page changed'),
	requiresReanalysis: z.boolean().describe('Whether the page needs to be analyzed again'),
	humanInterventionNeeded: z.boolean(),
	completionStatus: z.enum([
		'completed',
		'partial',
		'failed',
		'awaiting_human',
		'needs_reanalysis',
	]),
});

// Type exports
export type FieldMapping = z.infer<typeof FieldMappingSchema>;
export type BrowserToolCall = z.infer<typeof BrowserToolCallSchema>;
export type PageAnalysis = z.infer<typeof PageAnalysisSchema>;
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;