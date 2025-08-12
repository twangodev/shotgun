import {Page} from 'playwright';
import {BrowserTool, BrowserToolResult, BrowserToolErrorType} from './types';
import {RefResolver} from '../RefResolver';

export interface ClickParams {
	ref?: string;           // Element ref from snapshot
	selector?: string;      // CSS selector fallback
	text?: string;          // Text content fallback
	role?: string;          // ARIA role (button, link, etc.)
	description?: string;   // Human-readable description
	waitForNavigation?: boolean;  // Whether to wait for page navigation
}

/**
 * Click Tool - Clicks buttons, links, and other elements
 * Can cause DOM changes, so typically needs re-snapshot after
 */
export class ClickTool implements BrowserTool<ClickParams, BrowserToolResult> {
	name = 'click';
	description = 'Click a button, link, or other element';
	private refResolver?: RefResolver;
	
	async execute(params: ClickParams, page: Page): Promise<BrowserToolResult> {
		// PLACEHOLDER IMPLEMENTATION - Just log and return success
		console.log(`🕹️ [PLACEHOLDER] ClickTool executing:`, {
			ref: params.ref,
			text: params.text,
			role: params.role,
			description: params.description,
			waitForNavigation: params.waitForNavigation
		});
		
		// Simulate a small delay
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Always return success for now
		return {
			success: true,
			message: `[SIMULATED] Clicked "${params.description || params.text || params.ref}"`,
			data: {
				elementRef: params.ref,
				navigated: params.waitForNavigation,
				simulated: true
			},
		};
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
	
	setRefResolver(resolver: RefResolver): void {
		this.refResolver = resolver;
	}
}