import {Page} from 'playwright';
import {BrowserTool, BrowserToolResult, BrowserToolErrorType} from './types';
import {RefResolver} from '../RefResolver';

export interface FillFieldParams {
	ref?: string;           // Element ref from snapshot
	selector?: string;      // CSS selector fallback
	label?: string;         // Label text fallback
	value: string;          // Value to fill
	description?: string;   // Human-readable description
}

/**
 * Fill Field Tool - Fills form fields with values
 * Equivalent to gemini-cli's Edit tool
 */
export class FillFieldTool implements BrowserTool<FillFieldParams, BrowserToolResult> {
	name = 'fill_field';
	description = 'Fill a form field with a value';
	private refResolver?: RefResolver;
	
	async execute(params: FillFieldParams, page: Page): Promise<BrowserToolResult> {
		// PLACEHOLDER IMPLEMENTATION - Just log and return success
		console.log(`📝 [PLACEHOLDER] FillFieldTool executing:`, {
			ref: params.ref,
			label: params.label,
			value: params.value,
			description: params.description
		});
		
		// Simulate a small delay
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Always return success for now
		return {
			success: true,
			message: `[SIMULATED] Filled field "${params.description || params.label || params.ref}" with "${params.value}"`,
			data: {
				fieldRef: params.ref,
				value: params.value,
				simulated: true
			},
		};
	}
	
	validateParams(params: FillFieldParams): string | null {
		if (!params.value) {
			return 'Value is required';
		}
		if (!params.ref && !params.selector && !params.label) {
			return 'At least one of ref, selector, or label is required';
		}
		return null;
	}
	
	async shouldConfirmExecute(params: FillFieldParams): Promise<boolean> {
		// Don't require confirmation for basic field fills
		// Could add logic here for sensitive fields (SSN, password, etc.)
		return false;
	}
	
	setRefResolver(resolver: RefResolver): void {
		this.refResolver = resolver;
	}
}