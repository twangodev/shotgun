import {chromium, Browser, Page} from 'playwright';
import {UserProfile} from '../profile';
import {CommandEvent} from '../events';
import {SnapshotManager} from '../browser/snapshot';
import {BrowserToolRegistry, BrowserActionRequest} from '../browser/tools';
import {BrowserActionScheduler} from '../browser/scheduler/BrowserActionScheduler';
import {DecisionEngine, PageAnalysis, BrowserAction} from '../ai';

/**
 * Barrier actions that require re-evaluation after execution
 * These actions typically cause significant DOM changes or navigation
 */
const BARRIER_ACTIONS = new Set([
	'click',           // Might navigate or show/hide elements
	'submit',          // Form submission
	'navigate',        // Direct navigation
	'upload',          // File uploads change form state
	'human_intervention' // Requires human action
]);

/**
 * Actions that can be safely batched together
 * These typically don't cause major DOM changes
 */
const BATCHABLE_ACTIONS = new Set([
	'fill_field',      // Text input
	'select',          // Dropdown selection
	'checkbox',        // Checkbox toggle
	'radio',           // Radio button selection
	'scroll',          // Scrolling
	'wait',            // Waiting
]);

interface ExecutionBatch {
	actions: BrowserAction[];
	hasBarrier: boolean;
	barrierIndex?: number;
}

/**
 * Job Application Agent - Simplified with action-only approach
 * Just executes actions until none left or human intervention needed
 */
export class JobApplicationAgent {
	private decisionEngine: DecisionEngine;
	
	constructor(
		private profile: UserProfile,
		private config = {
			headless: false,
			timeout: 30000,
			maxTurns: 30,
			debugMode: true
		}
	) {
		this.decisionEngine = new DecisionEngine(profile);
	}

	/**
	 * Main entry point for job applications
	 */
	async *applyToJob(url: string): AsyncGenerator<CommandEvent> {
		if (!this.isValidUrl(url)) {
			yield {type: 'error', error: 'Invalid URL provided'};
			return;
		}

		let browser: Browser | null = null;
		let page: Page | null = null;

		try {
			// Setup browser
			yield {type: 'progress', message: '🚀 Launching browser...'};
			browser = await chromium.launch({headless: this.config.headless});
			page = await browser.newPage();
			page.setDefaultTimeout(this.config.timeout);

			// Initialize components
			const snapshotManager = new SnapshotManager(page);
			const toolRegistry = new BrowserToolRegistry();
			const scheduler = new BrowserActionScheduler(page, toolRegistry);

			// Navigate
			yield {type: 'progress', message: `📍 Navigating to ${url}...`};
			await page.goto(url, {waitUntil: 'networkidle'});

			// Main loop - just execute actions until done
			let completed = false;
			let turnCount = 0;
			let totalActionsExecuted = 0;
			const executionLog: Array<{turn: number; actions: string[]; success: boolean}> = [];

			while (!completed && turnCount < this.config.maxTurns) {
				turnCount++;
				
				// Take snapshot
				this.log(`\n━━━ Turn ${turnCount} ━━━`);
				yield {type: 'progress', message: `🔍 Turn ${turnCount}: Analyzing page...`};
				const snapshot = await snapshotManager.createFullSnapshot();

				// Get actions from AI
				const analysis = await this.getAIAnalysis(snapshot);
				
				if (!analysis) {
					yield {type: 'error', error: 'AI analysis failed'};
					break;
				}
				
				// Log what AI decided
				this.log(`📝 AI generated ${analysis.actions.length} actions`);
				if (analysis.actions.length > 0) {
					this.log('Actions:', analysis.actions.map(a => `${a.tool}(${a.params.ref || ''})`).join(', '));
				}

				// Check if complete (empty actions array)
				if (analysis.actions.length === 0) {
					completed = true;
					yield {
						type: 'completed',
						data: {
							url,
							title: snapshot.title,
							turnsRequired: turnCount,
							totalActions: totalActionsExecuted
						}
					};
					yield {
						type: 'message',
						content: '🎉 Application completed! Browser will remain open for debugging.'
					};
					break;
				}

				// Check for human intervention
				const needsHuman = analysis.actions.find(a => a.tool === 'human_intervention');
				if (needsHuman) {
					this.log('🚫 AI requested human intervention:', needsHuman.params.reason);
					yield {
						type: 'message',
						content: `⚠️ Human needed: ${needsHuman.params.reason || 'Manual intervention required'}`
					};
					break;
				}

				// Show what we're doing
				yield {
					type: 'message',
					content: `📋 ${analysis.actions.length} actions to execute`
				};

				// Execute actions in batches
				const batch = this.createExecutionBatch(analysis.actions);
				
				this.log(`📦 Batch: ${batch.actions.length} actions, barrier: ${batch.hasBarrier}`);
				
				// Execute the batch
				const batchResult = await this.executeBatch(
					batch,
					scheduler,
					page
				);

				// Track execution
				totalActionsExecuted += batchResult.executed;
				executionLog.push({
					turn: turnCount,
					actions: batchResult.actions,
					success: batchResult.success
				});

				// Yield progress updates
				for (const update of batchResult.updates) {
					yield update;
				}

				// If batch failed critically, stop
				if (!batchResult.success && batchResult.critical) {
					yield {
						type: 'error',
						error: `Critical failure: ${batchResult.error}`
					};
					break;
				}

				// Small delay before next turn
				await this.delay(300);
			}

			// Final summary
			this.log(`\n━━━ Session Complete ━━━`);
			this.log(`Turns: ${turnCount}`);
			this.log(`Actions: ${totalActionsExecuted}`);
			this.log(`Execution log:`, executionLog);

			if (!completed && turnCount >= this.config.maxTurns) {
				yield {
					type: 'message',
					content: `⏱️ Max turns (${this.config.maxTurns}) reached`
				};
			}

		} catch (error) {
			console.error('Fatal error:', error);
			yield {
				type: 'error',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		} finally {
			if (browser) {
				// Keep browser open for debugging
				console.log('🔍 Browser remains open for debugging. Close manually when done.');
				// await browser.close(); // Commented out for debugging
			}
		}
	}

	/**
	 * Create a smart batch of actions to execute
	 * Batches all actions up to and including the first barrier
	 */
	private createExecutionBatch(actions: BrowserAction[]): ExecutionBatch {
		const batch: ExecutionBatch = {
			actions: [],
			hasBarrier: false
		};

		for (let i = 0; i < actions.length; i++) {
			const action = actions[i];
			batch.actions.push(action);

			// If this is a barrier action, stop here
			if (BARRIER_ACTIONS.has(action.tool)) {
				batch.hasBarrier = true;
				batch.barrierIndex = i;
				break;
			}

			// Continue batching if it's batchable
			if (!BATCHABLE_ACTIONS.has(action.tool)) {
				this.log(`⚠️ Unknown action type: ${action.tool}, treating as barrier`);
				batch.hasBarrier = true;
				batch.barrierIndex = i;
				break;
			}
		}

		return batch;
	}

	/**
	 * Execute a batch of actions
	 */
	private async executeBatch(
		batch: ExecutionBatch,
		scheduler: BrowserActionScheduler,
		page: Page
	): Promise<{
		executed: number;
		success: boolean;
		critical: boolean;
		error?: string;
		actions: string[];
		updates: CommandEvent[];
	}> {
		const result = {
			executed: 0,
			success: true,
			critical: false,
			error: undefined as string | undefined,
			actions: [] as string[],
			updates: [] as CommandEvent[]
		};

		for (const action of batch.actions) {
			this.log(`  🔧 Executing: ${action.tool} - ${JSON.stringify(action.params)}`);
			
			// Convert to legacy format for compatibility
			const request: BrowserActionRequest = {
				id: `${Date.now()}-${Math.random()}`,
				toolName: action.tool,
				params: action.params
			};
			
			// Add progress update
			result.updates.push({
				type: 'progress',
				message: `⚡ ${action.tool}: ${this.getActionDescription(action)}`
			});

			// Execute
			const trackedAction = await scheduler.schedule(request);
			
			// Wait for completion
			while (trackedAction.state === 'executing' || trackedAction.state === 'scheduled') {
				await this.delay(50);
			}

			result.executed++;
			result.actions.push(action.tool);

			// Check result
			if (trackedAction.state === 'error') {
				result.success = false;
				result.error = trackedAction.result?.message;
				
				// Log the error details for debugging
				this.log(`  ❌ Action failed: ${action.tool} on ${action.params.ref}`);
				this.log(`     Error: ${result.error}`);
				this.log(`     Params:`, action.params);
				
				// Determine if critical
				if (BARRIER_ACTIONS.has(action.tool)) {
					result.critical = true;
					result.updates.push({
						type: 'message',
						content: `❌ Critical action failed: ${result.error}`
					});
					break;
				} else {
					result.updates.push({
						type: 'message',
						content: `⚠️ Non-critical failure on ${action.params.ref}: ${result.error}`
					});
					// Continue with other actions
				}
			} else {
				result.updates.push({
					type: 'progress',
					message: `✅ ${action.tool} completed`
				});
			}

			// If this was a barrier action and it succeeded, we're done with this batch
			if (BARRIER_ACTIONS.has(action.tool) && trackedAction.state === 'success') {
				this.log(`  🚧 Barrier action completed, breaking for re-evaluation`);
				break;
			}
		}

		return result;
	}

	/**
	 * Get AI analysis for current page state
	 */
	private async getAIAnalysis(snapshot: any): Promise<PageAnalysis | null> {
		try {
			return await this.decisionEngine.analyzePage(snapshot);
		} catch (error) {
			console.error('AI analysis error:', error);
			return null;
		}
	}

	/**
	 * Get human-readable description for an action
	 */
	private getActionDescription(action: BrowserAction): string {
		switch (action.tool) {
			case 'fill_field':
				return `Fill ${action.params.ref} with "${action.params.value?.substring(0, 20)}..."`;
			case 'click':
				return `Click ${action.params.ref}`;
			case 'select':
				return `Select "${action.params.value}" in ${action.params.ref}`;
			case 'checkbox':
				return `${action.params.checked ? 'Check' : 'Uncheck'} ${action.params.ref}`;
			case 'upload':
				return `Upload file to ${action.params.ref}`;
			default:
				return JSON.stringify(action.params);
		}
	}

	/**
	 * Utility functions
	 */
	private isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private log(...args: any[]): void {
		if (this.config.debugMode) {
			console.log(...args);
		}
	}

	/**
	 * Streaming wrapper for compatibility
	 */
	async *streamApplication(url: string): AsyncGenerator<CommandEvent> {
		yield* this.applyToJob(url);
	}
}