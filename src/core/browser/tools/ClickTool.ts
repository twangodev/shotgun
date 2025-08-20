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

export interface ClickParams {
	ref?: string;           // Element ref from snapshot
	selector?: string;      // CSS selector fallback
	text?: string;          // Text content fallback
	role?: string;          // ARIA role (button, link, etc.)
	description?: string;   // Human-readable description
	element?: string;       // Human-readable element description (from AI)
	waitForNavigation?: boolean;  // Whether to wait for page navigation
	doubleClick?: boolean;  // Whether to perform double click
	button?: 'left' | 'right' | 'middle';  // Mouse button to use
}

/**
 * Click Tool - Clicks buttons, links, and other elements
 * Based on playwright-mcp's click implementation
 */
export class ClickTool implements BrowserTool<ClickParams, BrowserToolResult> {
	name = 'click';
	description = 'Click a button, link, or other element';
	
	async execute(params: ClickParams, page: Page): Promise<BrowserToolResult> {
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
			// Priority 3: Use role and text
			else if (params.role && params.text) {
				locator = page.getByRole(params.role as any, { name: params.text });
			}
			// Priority 4: Use text only
			else if (params.text) {
				locator = page.getByText(params.text);
			}
			else {
				throw new Error('No ref, selector, or text provided');
			}
			
			// Check if this is a file input - if so, don't click it
			const tagName = await locator.evaluate(el => el.tagName.toLowerCase()).catch(() => null);
			const inputType = tagName === 'input' ? 
				await locator.evaluate(el => (el as HTMLInputElement).type).catch(() => null) : 
				null;
			
			if (inputType === 'file') {
				// Don't click file inputs - they should use the upload tool instead
				// Try to click the parent label if it exists
				const labelLocator = locator.locator('xpath=ancestor::label[1]');
				const labelCount = await labelLocator.count();
				if (labelCount > 0) {
					// Click the label instead
					if (params.doubleClick) {
						await labelLocator.dblclick(params.button ? { button: params.button } : {});
					} else {
						await labelLocator.click(params.button ? { button: params.button } : {});
					}
					const elementDesc = params.element || params.description || 'file upload label';
					return {
						success: true,
						message: `Clicked ${elementDesc} (file upload label)`,
						data: {
							note: 'For file uploads, use the upload tool with setInputFiles instead'
						}
					};
				} else {
					// No label found, return guidance
					return {
						success: false,
						message: 'This is a file input. Use the upload tool instead of clicking.',
						error: {
							message: 'File inputs should use the upload tool with a file path',
							recoverable: true,
							type: BrowserToolErrorType.INVALID_PARAMS
						}
					};
				}
			}
			
			// Configure click options for normal elements
			const clickOptions: any = {};
			if (params.button) {
				clickOptions.button = params.button;
			}
			
			// Perform the click
			if (params.doubleClick) {
				await locator.dblclick(clickOptions);
			} else {
				await locator.click(clickOptions);
			}
			
			// Wait for navigation if requested
			if (params.waitForNavigation) {
				await page.waitForLoadState('networkidle');
			}
			
			const elementDesc = params.element || params.description || params.text || params.ref || 'element';
			return {
				success: true,
				message: `${params.doubleClick ? 'Double-clicked' : 'Clicked'} ${elementDesc}`
			};
			
		} catch (error) {
			return {
				success: false,
				message: `Failed to click element: ${error}`,
				error: {
					message: String(error),
					recoverable: true,
					type: BrowserToolErrorType.ELEMENT_NOT_FOUND
				}
			};
		}
	}
	
	validateParams(params: ClickParams): string | null {
		if (!params.ref && !params.selector && !params.text) {
			return 'At least one of ref, selector, or text is required';
		}
		return null;
	}
	
	async shouldConfirmExecute(params: ClickParams): Promise<boolean> {
		// Require confirmation for submit buttons or destructive actions
		const confirmKeywords = ['submit', 'delete', 'remove', 'confirm', 'apply', 'send'];
		const description = (params.description || params.text || '').toLowerCase();
		
		return confirmKeywords.some(keyword => description.includes(keyword));
	}
}