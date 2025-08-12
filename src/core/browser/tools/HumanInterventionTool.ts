import {Page} from 'playwright';
import {BrowserTool, BrowserToolResult} from './types';

/**
 * Human Intervention Tool - Pauses automation for human action
 * Similar to gemini-cli's confirmation prompts
 */
export class HumanInterventionTool implements BrowserTool {
	name = 'human_intervention';
	description = 'Request human intervention for actions that cannot be automated';
	
	constructor(private page?: Page) {}
	
	async execute(params: any): Promise<BrowserToolResult> {
		const reason = params.reason || 'Human action required';
		const action = params.action || 'complete the required step';
		const waitTime = params.waitTimeMs || 10000; // Default 10 seconds
		
		console.log(`\n⚠️  Human Intervention Required`);
		console.log(`   Action needed: ${action}`);
		console.log(`   Reason: ${reason}`);
		console.log(`   Waiting ${waitTime / 1000} seconds for human to complete action...\n`);
		
		// In production, this would pause and wait for human confirmation
		// For now, just wait to give human time to act
		await this.delay(waitTime);
		
		return {
			success: true,
			message: `Human intervention point: ${action}`,
			data: {
				reason,
				action,
				waitTime,
			},
		};
	}
	
	shouldConfirmExecute(): boolean {
		return false; // Already is a human intervention point
	}
	
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}