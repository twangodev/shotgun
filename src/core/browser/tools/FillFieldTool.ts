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

export interface FillFieldParams {
	ref?: string;           // Element ref from snapshot
	selector?: string;      // CSS selector fallback
	label?: string;         // Label text fallback
	value: string;          // Value to fill
	description?: string;   // Human-readable description
	element?: string;       // Human-readable element description (from AI)
}

/**
 * Fill Field Tool - Fills form fields with values
 * Based on playwright-mcp's type/fill implementation
 */
export class FillFieldTool implements BrowserTool<FillFieldParams, BrowserToolResult> {
	name = 'fill_field';
	description = 'Fill a form field with a value';
	
	async execute(params: FillFieldParams, page: Page): Promise<BrowserToolResult> {
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
			
			// Fill the field
			await locator.fill(params.value);
			
			const elementDesc = params.element || params.description || params.label || params.ref || 'field';
			return {
				success: true,
				message: `Filled ${elementDesc} with: ${params.value.substring(0, 50)}${params.value.length > 50 ? '...' : ''}`
			};
			
		} catch (error) {
			return {
				success: false,
				message: `Failed to fill field: ${error}`,
				error: {
					message: String(error),
					recoverable: true,
					type: BrowserToolErrorType.ELEMENT_NOT_FOUND
				}
			};
		}
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
}