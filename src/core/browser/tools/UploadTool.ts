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

export interface UploadParams {
	ref?: string;           // Element ref from snapshot
	selector?: string;      // CSS selector fallback
	filePath: string;       // Path to file to upload
	description?: string;   // Human-readable description
	element?: string;       // Human-readable element description (from AI)
}

/**
 * Upload Tool - Handles file uploads
 * Based on playwright-mcp's file upload approach
 * Uses setInputFiles() to directly set files without opening dialogs
 */
export class UploadTool implements BrowserTool<UploadParams, BrowserToolResult> {
	name = 'upload';
	description = 'Upload a file to a file input element (uses setInputFiles, no dialog needed)';
	
	async execute(params: UploadParams, page: Page): Promise<BrowserToolResult> {
		try {
			let fileInput;
			
			// Strategy 1: Try the ref directly (might be the file input itself)
			if (params.ref) {
				// Validate ref exists in current snapshot
				const snapshot = await this.getPageSnapshot(page);
				if (snapshot && !snapshot.includes(`[ref=${params.ref}]`)) {
					throw new Error(
						`Ref ${params.ref} not found in current page snapshot. ` +
						`Element may have been removed or page changed.`
					);
				}
				
				const refLocator = page.locator(`aria-ref=${params.ref}`);
				const tagName = await refLocator.evaluate(el => el.tagName.toLowerCase()).catch(() => null);
				
				if (tagName === 'input') {
					// It's an input, check if it's a file input
					const inputType = await refLocator.evaluate(el => (el as HTMLInputElement).type).catch(() => null);
					if (inputType === 'file') {
						fileInput = refLocator;
					}
				}
				
				// Strategy 2: Look for file input as child of the ref element
				if (!fileInput) {
					const childInput = refLocator.locator('input[type="file"]');
					const childCount = await childInput.count();
					if (childCount > 0) {
						fileInput = childInput.first();
					}
				}
				
				// Strategy 3: Look for file input with matching ID (button might have for="fileInputId")
				if (!fileInput) {
					const forAttr = await refLocator.getAttribute('for').catch(() => null);
					if (forAttr) {
						fileInput = page.locator(`#${forAttr}`);
						const inputType = await fileInput.evaluate(el => (el as HTMLInputElement).type).catch(() => null);
						if (inputType !== 'file') {
							fileInput = null;
						}
					}
				}
			}
			
			// Strategy 4: Use CSS selector if provided
			if (!fileInput && params.selector) {
				fileInput = page.locator(params.selector);
			}
			
			// Strategy 5: Find any file input on the page (last resort)
			if (!fileInput) {
				fileInput = page.locator('input[type="file"]').first();
				const count = await fileInput.count();
				if (count === 0) {
					throw new Error(
						'No file input found. The upload button may require clicking to reveal the file input, ' +
						'or the page uses a custom upload implementation.'
					);
				}
			}
			
			// Upload the file
			await fileInput.setInputFiles(params.filePath);
			
			const elementDesc = params.element || params.description || params.ref || 'file input';
			return {
				success: true,
				message: `Uploaded ${params.filePath} to ${elementDesc}`,
				data: {
					ref: params.ref,
					filePath: params.filePath,
				},
			};
		} catch (error: any) {
			// If the error is about element not being an input, provide helpful message
			if (error.message?.includes('setInputFiles') || error.message?.includes('input')) {
				return {
					success: false,
					message: `The element at ref=${params.ref} is not a file input. It may be a button that triggers a file dialog.`,
					error: {
						message: 'Element is not a file input. Try finding the actual input[type="file"] element.',
						recoverable: true,
						type: BrowserToolErrorType.INVALID_PARAMS
					}
				};
			}
			
			return {
				success: false,
				message: `Failed to upload file: ${error.message || error}`,
				error: {
					message: String(error.message || error),
					recoverable: true,
					type: BrowserToolErrorType.ELEMENT_NOT_FOUND
				}
			};
		}
	}
	
	private async getPageSnapshot(page: Page): Promise<string> {
		try {
			// Use Playwright's internal snapshot method
			const pageEx = page as any;
			if (pageEx._snapshotForAI) {
				return await pageEx._snapshotForAI();
			}
			// Fallback to accessibility snapshot
			const snapshot = await page.accessibility.snapshot();
			return JSON.stringify(snapshot);
		} catch (error) {
			console.warn('Could not get page snapshot for validation:', error);
			return '';
		}
	}
	
	validateParams(params: UploadParams): string | null {
		if (!params.filePath) {
			return 'File path is required';
		}
		return null;
	}
	
	async shouldConfirmExecute(): Promise<boolean> {
		// File uploads might be sensitive, but generally safe
		return false;
	}
}