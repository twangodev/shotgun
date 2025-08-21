import {Page} from 'playwright';
import {BrowserTool, BrowserToolResult, BrowserToolErrorType} from './types';

export interface CheckboxParams {
	ref?: string;           // Element ref from snapshot
	selector?: string;      // CSS selector fallback
	label?: string;         // Label text fallback
	checked: boolean;       // Whether to check or uncheck
	description?: string;   // Human-readable description
}

/**
 * Checkbox Tool - Checks or unchecks checkboxes
 * Can reveal/hide form sections, so typically needs re-snapshot after
 */
export class CheckboxTool implements BrowserTool<CheckboxParams, BrowserToolResult> {
	name = 'checkbox';
	description = 'Check or uncheck a checkbox';
	
	async execute(params: CheckboxParams, page: Page): Promise<BrowserToolResult> {
		try {
			// Try multiple strategies to find the element
			let element;
			
			// Strategy 1: Try ref attribute (from snapshot)
			if (params.ref) {
				element = page.locator(`aria-ref=${params.ref}`);
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
					message: `Could not find checkbox: ${params.description || params.label || params.ref}`,
					error: {
						message: 'Checkbox not found with any strategy',
						recoverable: true,
						type: BrowserToolErrorType.ELEMENT_NOT_FOUND,
					},
				};
			}
			
			// Check current state
			const isChecked = await element.isChecked();
			
			// Only click if state needs to change
			if (isChecked !== params.checked) {
				await element.click();
				
				// Verify the state changed
				const newState = await element.isChecked();
				if (newState !== params.checked) {
					return {
						success: false,
						message: `Failed to ${params.checked ? 'check' : 'uncheck'} checkbox`,
						error: {
							message: 'Checkbox state did not change as expected',
							recoverable: true,
						},
					};
				}
			}
			
			return {
				success: true,
				message: `${params.checked ? 'Checked' : 'Unchecked'} "${params.description || params.label}"`,
				data: {
					elementRef: params.ref,
					checked: params.checked,
					stateChanged: isChecked !== params.checked,
				},
			};
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			
			return {
				success: false,
				message: `Failed to modify checkbox: ${params.description || params.label}`,
				error: {
					message: errorMsg,
					recoverable: true,
					type: BrowserToolErrorType.ELEMENT_NOT_FOUND,
				},
			};
		}
	}
	
	validateParams(params: CheckboxParams): string | null {
		if (!params.ref && !params.selector && !params.label) {
			return 'At least one of ref, selector, or label is required';
		}
		if (params.checked === undefined) {
			return 'checked parameter is required';
		}
		return null;
	}
	
	async shouldConfirmExecute(): Promise<boolean> {
		// Checkboxes can reveal/hide sections but are generally safe
		return false;
	}
}