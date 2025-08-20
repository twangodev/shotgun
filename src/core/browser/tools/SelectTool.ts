/**
 * Copyright 2025 (Apache License 2.0 - derived from playwright-mcp)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
	element?: string;       // Human-readable element description (from AI)
}

/**
 * Select Tool - Selects options in dropdown/select elements
 * Based on playwright-mcp's select implementation
 */
export class SelectTool implements BrowserTool<SelectParams, BrowserToolResult> {
	name = 'select';
	description = 'Select an option in a dropdown';
	
	async execute(params: SelectParams, page: Page): Promise<BrowserToolResult> {
		try {
			let locator;
			
			// Priority 1: Use aria-ref selector if ref is provided
			if (params.ref) {
				// Use the aria-ref selector (from playwright-mcp)
				locator = page.locator(`aria-ref=${params.ref}`);
			}
			// Priority 2: Use CSS selector
			else if (params.selector) {
				locator = page.locator(params.selector);
			}
			// Priority 3: Use label text
			else if (params.label) {
				locator = page.getByLabel(params.label);
			}
			else {
				throw new Error('No ref, selector, or label provided');
			}
			
			// Select the option
			if (params.value) {
				await locator.selectOption({value: params.value});
			} else if (params.text) {
				await locator.selectOption({label: params.text});
			} else if (params.index !== undefined) {
				await locator.selectOption({index: params.index});
			} else {
				throw new Error('Must provide value, text, or index to select');
			}
			
			// Verify the selection
			const selectedValue = await locator.inputValue();
			const elementDesc = params.element || params.description || params.label || params.ref || 'dropdown';
			
			return {
				success: true,
				message: `Selected "${params.text || params.value || `index ${params.index}`}" in ${elementDesc}`,
				data: {
					elementRef: params.ref,
					selectedValue,
				},
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to select option: ${error}`,
				error: {
					message: String(error),
					recoverable: true,
					type: BrowserToolErrorType.ELEMENT_NOT_FOUND
				}
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