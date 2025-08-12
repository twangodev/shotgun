import {Page} from 'playwright';
import {BrowserTool, BrowserToolResult, BrowserToolErrorType} from './types';

export interface SelectParams {
	ref?: string;           // Element ref from snapshot
	selector?: string;      // CSS selector fallback
	label?: string;         // Label text fallback
	value?: string;         // Option value to select
	text?: string;          // Option text to select
	index?: number;         // Option index to select
	description?: string;   // Human-readable description
}

/**
 * Select Tool - Selects options in dropdown/select elements
 * Can reveal new fields, so typically needs re-snapshot after
 */
export class SelectTool implements BrowserTool<SelectParams, BrowserToolResult> {
	name = 'select';
	description = 'Select an option in a dropdown';
	
	async execute(params: SelectParams, page: Page): Promise<BrowserToolResult> {
		try {
			// Try multiple strategies to find the element
			let element;
			
			// Strategy 1: Try ref attribute (from snapshot)
			if (params.ref) {
				element = page.locator(`[aria-ref="${params.ref}"]`);
				const count = await element.count();
				if (count === 0) {
					element = null;
				}
			}
			
			// Strategy 2: Try label
			if (!element && params.label) {
				element = page.getByLabel(params.label);
				const count = await element.count();
				if (count === 0) {
					element = null;
				}
			}
			
			// Strategy 3: Try CSS selector
			if (!element && params.selector) {
				element = page.locator(params.selector);
				const count = await element.count();
				if (count === 0) {
					element = null;
				}
			}
			
			if (!element) {
				return {
					success: false,
					message: `Could not find select element: ${params.description || params.label || params.ref}`,
					error: {
						message: 'Select element not found with any strategy',
						recoverable: true,
						type: BrowserToolErrorType.ELEMENT_NOT_FOUND,
					},
				};
			}
			
			// Select the option
			if (params.value) {
				await element.selectOption({value: params.value});
			} else if (params.text) {
				await element.selectOption({label: params.text});
			} else if (params.index !== undefined) {
				await element.selectOption({index: params.index});
			} else {
				return {
					success: false,
					message: 'No selection criteria provided',
					error: {
						message: 'Must provide value, text, or index',
						recoverable: false,
						type: BrowserToolErrorType.INVALID_PARAMS,
					},
				};
			}
			
			// Verify the selection
			const selectedValue = await element.inputValue();
			
			return {
				success: true,
				message: `Selected "${params.text || params.value}" in ${params.description || params.label}`,
				data: {
					elementRef: params.ref,
					selectedValue,
				},
			};
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			
			return {
				success: false,
				message: `Failed to select option: ${params.description || params.label}`,
				error: {
					message: errorMsg,
					recoverable: true,
					type: BrowserToolErrorType.ELEMENT_NOT_FOUND,
				},
			};
		}
	}
	
	validateParams(params: SelectParams): string | null {
		if (!params.ref && !params.selector && !params.label) {
			return 'At least one of ref, selector, or label is required';
		}
		if (!params.value && !params.text && params.index === undefined) {
			return 'Must provide value, text, or index to select';
		}
		return null;
	}
	
	async shouldConfirmExecute(): Promise<boolean> {
		// Selections can change form structure, but are generally safe
		return false;
	}
}