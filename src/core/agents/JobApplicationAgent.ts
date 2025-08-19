import {chromium, Browser, Page} from 'playwright';
import {UserProfile} from '../profile';
import {CommandEvent} from '../events';
import {SnapshotManager} from '../browser/snapshot';
import {BrowserToolRegistry, BrowserActionRequest} from '../browser/tools';
import {BrowserActionScheduler} from '../browser/scheduler/BrowserActionScheduler';
import {DecisionEngine, PageAnalysis, BrowserToolCall} from '../ai';

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
	'snapshot'         // Taking snapshots
]);

interface ExecutionBatch {
	actions: BrowserToolCall[];
	hasBarrier: boolean;
	barrierIndex?: number;
}

/**
 * Job Application Agent - Hybrid Batching Approach
 * Batches similar actions together, breaks at significant DOM changes
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

			// Main hybrid loop
			let completed = false;
			let turnCount = 0;
			let totalActionsExecuted = 0;
			const executionLog: Array<{turn: number; batch: string[]; success: boolean}> = [];

			while (!completed && turnCount < this.config.maxTurns) {
				turnCount++;
				
				// OBSERVE: Take snapshot
				this.log(`\n━━━ Turn ${turnCount} ━━━`);
				yield {type: 'progress', message: `🔍 Turn ${turnCount}: Analyzing page...`};
				const snapshot = await snapshotManager.createFullSnapshot();

				// ANALYZE: Get AI decision
				const analysis = await this.getAIAnalysis(
					snapshot, 
					turnCount, 
					executionLog
				);
				
				if (!analysis) {
					yield {type: 'error', error: 'AI analysis failed'};
					break;
				}

				// Show AI's plan
				yield {
					type: 'message',
					content: this.decisionEngine.formatAnalysisSummary(analysis)
				};

				// Check completion
				if (this.isComplete(analysis)) {
					completed = true;
					yield {
						type: 'completed',
						data: {
							url,
							title: snapshot.title,
							turnsRequired: turnCount,
							totalActions: totalActionsExecuted,
							confidence: analysis.confidence.overall
						}
					};
					break;
				}

				// Check for human intervention
				if (analysis.interventionRequired.needed) {
					yield {
						type: 'message',
						content: `⚠️ Human needed: ${analysis.interventionRequired.reason}`
					};
					break;
				}

				// EXECUTE: Process actions in smart batches
				const batch = this.createExecutionBatch(analysis.requiredActions);
				
				if (batch.actions.length === 0) {
					yield {type: 'message', content: '❓ No actions to execute'};
					break;
				}

				this.log(`📦 Batch: ${batch.actions.length} actions, barrier: ${batch.hasBarrier}`);
				
				// Execute the batch
				const batchResult = await this.executeBatch(
					batch,
					scheduler,
					analysis,
					page
				);

				// Track execution
				totalActionsExecuted += batchResult.executed;
				executionLog.push({
					turn: turnCount,
					batch: batchResult.actions,
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
				// Wait 30 seconds before closing to see the result
				console.log('⏳ Waiting 30 seconds before closing browser...');
				await this.delay(30000);
				await browser.close();
			}
		}
	}

	/**
	 * Create a smart batch of actions to execute
	 * Batches all actions up to and including the first barrier
	 */
	private createExecutionBatch(actions: BrowserToolCall[]): ExecutionBatch {
		const batch: ExecutionBatch = {
			actions: [],
			hasBarrier: false
		};

		for (let i = 0; i < actions.length; i++) {
			const action = actions[i];
			batch.actions.push(action);

			// If this is a barrier action, stop here
			if (BARRIER_ACTIONS.has(action.toolName)) {
				batch.hasBarrier = true;
				batch.barrierIndex = i;
				break;
			}

			// Continue batching if it's batchable
			if (!BATCHABLE_ACTIONS.has(action.toolName)) {
				this.log(`⚠️ Unknown action type: ${action.toolName}, treating as barrier`);
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
		analysis: PageAnalysis,
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
			this.log(`  🔧 Executing: ${action.toolName} - ${action.description}`);
			
			// Create request with enhanced params
			const request = this.createActionRequest(action, analysis);
			
			// Add progress update
			result.updates.push({
				type: 'progress',
				message: `⚡ ${action.description}`
			});

			// Execute
			const trackedAction = await scheduler.schedule(request);
			
			// Wait for completion
			while (trackedAction.state === 'executing' || trackedAction.state === 'scheduled') {
				await this.delay(50);
			}

			result.executed++;
			result.actions.push(action.toolName);

			// Check result
			if (trackedAction.state === 'error') {
				result.success = false;
				result.error = trackedAction.result?.message;
				
				// Determine if critical
				if (BARRIER_ACTIONS.has(action.toolName)) {
					result.critical = true;
					result.updates.push({
						type: 'message',
						content: `❌ Critical action failed: ${result.error}`
					});
					break;
				} else {
					result.updates.push({
						type: 'message',
						content: `⚠️ Non-critical failure: ${result.error}`
					});
					// Continue with other actions
				}
			} else {
				result.updates.push({
					type: 'progress',
					message: `✅ ${action.description}`
				});
			}

			// If this was a barrier action and it succeeded, we're done with this batch
			if (BARRIER_ACTIONS.has(action.toolName) && trackedAction.state === 'success') {
				this.log(`  🚧 Barrier action completed, breaking for re-evaluation`);
				break;
			}
		}

		return result;
	}

	/**
	 * Get AI analysis for current page state
	 */
	private async getAIAnalysis(
		snapshot: any,
		turnCount: number,
		executionLog: Array<any>
	): Promise<PageAnalysis | null> {
		try {
			// For first turn, do initial analysis
			if (turnCount === 1) {
				return await this.decisionEngine.analyzePage(snapshot);
			}

			// For subsequent turns, provide context
			const lastExecution = executionLog[executionLog.length - 1];
			const context = {
				success: lastExecution?.success ?? true,
				error: lastExecution?.error,
				actionsExecuted: lastExecution?.batch ?? []
			};

			// Re-analyze with context
			// Note: We're passing null for previousAnalysis since we don't store it
			// In production, you'd want to store and pass the previous analysis
			return await this.decisionEngine.analyzePage(snapshot);
			
		} catch (error) {
			console.error('AI analysis error:', error);
			return null;
		}
	}

	/**
	 * Create action request with enhanced parameters
	 */
	private createActionRequest(
		action: BrowserToolCall,
		analysis: PageAnalysis
	): BrowserActionRequest {
		const enhancedParams = {...action.params};
		
		// Enhance fill_field with label info
		if (action.toolName === 'fill_field' && analysis.fieldMappings) {
			const mapping = analysis.fieldMappings.find(m => m.ref === action.params.ref);
			if (mapping?.label) {
				enhancedParams.label = mapping.label;
			}
		}
		
		// Enhance upload action with file path from fieldMappings
		if (action.toolName === 'upload' && analysis.fieldMappings) {
			const mapping = analysis.fieldMappings.find(m => m.ref === action.params.ref);
			if (mapping?.value && !enhancedParams.filePath) {
				// Use the value from fieldMapping if filePath is not provided
				enhancedParams.filePath = mapping.value;
			}
			// Also ensure we have a default path if still missing
			if (!enhancedParams.filePath) {
				// Hardcoded path for testing - update this to your actual resume path
				enhancedParams.filePath = '/Users/jding/Documents/resume.pdf';
			}
		}

		return {
			id: `${Date.now()}-${Math.random()}`,
			toolName: action.toolName,
			params: enhancedParams,
			reasoning: action.reasoning,
			confidence: action.confidence
		};
	}

	/**
	 * Check if application is complete
	 */
	private isComplete(analysis: PageAnalysis): boolean {
		return (
			analysis.nextSteps.expectedOutcome.toLowerCase().includes('complete') ||
			analysis.nextSteps.expectedOutcome.toLowerCase().includes('submitted') ||
			analysis.pageType === 'confirmation_page' ||
			(analysis.requiredActions.length === 0 && analysis.confidence.overall > 0.8)
		);
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