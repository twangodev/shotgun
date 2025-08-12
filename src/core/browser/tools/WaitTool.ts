import {Page} from 'playwright';
import {BrowserTool} from './types';

/**
 * Wait tool - pauses execution for a specified time
 */
export class WaitTool implements BrowserTool {
	name = 'wait';
	description = 'Wait for a specified number of milliseconds';
	
	constructor(private page?: Page) {}
	
	async execute(params: any): Promise<{success: boolean; message?: string}> {
		// PLACEHOLDER IMPLEMENTATION - Just log and return success immediately
		const ms = params.timeout_ms || (params.timeoutSeconds ? params.timeoutSeconds * 1000 : 3000);
		console.log(`⏱️ [PLACEHOLDER] WaitTool: simulating ${ms}ms wait`);
		
		// Very short delay instead of full wait
		await this.delay(50);
		
		return {
			success: true,
			message: `[SIMULATED] Waited for ${ms}ms`,
		};
	}
	
	shouldConfirmExecute(): boolean {
		return false; // No confirmation needed for wait
	}
	
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}