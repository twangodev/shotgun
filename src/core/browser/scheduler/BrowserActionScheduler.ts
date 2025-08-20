import {Page} from 'playwright';
import {
	BrowserTool,
	BrowserToolState,
	BrowserActionRequest,
	TrackedBrowserAction,
	BrowserToolResult,
} from '../tools/types';
import {BrowserToolRegistry} from '../tools/BrowserToolRegistry';
import {SnapshotManager} from '../snapshot';

/**
 * Browser Action Scheduler - Manages action queue and execution
 * Modeled after gemini-cli's CoreToolScheduler
 */
export class BrowserActionScheduler {
	private actions: Map<string, TrackedBrowserAction> = new Map();
	private snapshotManager: SnapshotManager;
	
	constructor(
		private page: Page,
		private toolRegistry: BrowserToolRegistry,
		private onActionUpdate?: (actions: TrackedBrowserAction[]) => void,
		private onActionComplete?: (action: TrackedBrowserAction) => void,
	) {
		this.snapshotManager = new SnapshotManager(page);
	}
	
	/**
	 * Schedule a browser action for execution
	 */
	async schedule(request: BrowserActionRequest): Promise<TrackedBrowserAction> {
		const tool = this.toolRegistry.getTool(request.toolName);
		if (!tool) {
			throw new Error(`Browser tool "${request.toolName}" not found`);
		}
		
		// Create tracked action
		const action: TrackedBrowserAction = {
			id: request.id,
			request,
			state: BrowserToolState.VALIDATING,
			startTime: Date.now(),
		};
		
		this.actions.set(action.id, action);
		this.notifyUpdate();
		
		// Validate parameters
		if (tool.validateParams) {
			const validationError = tool.validateParams(request.params);
			if (validationError) {
				this.updateState(action.id, BrowserToolState.ERROR, {
					success: false,
					message: validationError,
					error: {
						message: validationError,
						recoverable: false,
					},
				});
				return action;
			}
		}
		
		// Check if confirmation needed
		if (tool.shouldConfirmExecute) {
			const needsConfirmation = await tool.shouldConfirmExecute(request.params);
			if (needsConfirmation) {
				this.updateState(action.id, BrowserToolState.AWAITING_APPROVAL);
				return action;
			}
		}
		
		// Schedule for execution
		this.updateState(action.id, BrowserToolState.SCHEDULED);
		
		// Execute immediately (could add queue logic here)
		await this.executeAction(action, tool);
		
		return action;
	}
	
	/**
	 * Execute a browser action
	 */
	private async executeAction(action: TrackedBrowserAction, tool: BrowserTool): Promise<void> {
		this.updateState(action.id, BrowserToolState.EXECUTING);
		
		try {
			// Take snapshot before action (for verification)
			const beforeSnapshot = await this.snapshotManager.createFullSnapshot();
			
			// Execute the tool
			const result = await tool.execute(action.request.params, this.page);
			
			// Take snapshot after action (for verification)
			const afterSnapshot = await this.snapshotManager.createFullSnapshot();
			
			// Add snapshot diff to result
			const enhancedResult: BrowserToolResult = {
				...result,
				data: {
					...result.data,
					snapshotDiff: this.compareSnapshots(beforeSnapshot, afterSnapshot),
				},
			};
			
			// Update state based on result
			if (result.success) {
				this.updateState(action.id, BrowserToolState.SUCCESS, enhancedResult);
			} else {
				this.updateState(action.id, BrowserToolState.ERROR, enhancedResult);
			}
			
			// Notify completion
			if (this.onActionComplete) {
				this.onActionComplete(this.actions.get(action.id)!);
			}
		} catch (error) {
			const errorResult: BrowserToolResult = {
				success: false,
				message: `Execution failed: ${error}`,
				error: {
					message: error instanceof Error ? error.message : String(error),
					recoverable: true,
				},
			};
			
			this.updateState(action.id, BrowserToolState.ERROR, errorResult);
			
			if (this.onActionComplete) {
				this.onActionComplete(this.actions.get(action.id)!);
			}
		}
	}
	
	/**
	 * Compare two snapshots to detect changes
	 */
	private compareSnapshots(before: any, after: any): any {
		// Simple comparison for now - could be enhanced
		return {
			urlChanged: before.url !== after.url,
			titleChanged: before.title !== after.title,
			snapshotChanged: before.ariaSnapshot !== after.ariaSnapshot,
		};
	}
	
	/**
	 * Approve a pending action
	 */
	async approve(actionId: string): Promise<void> {
		const action = this.actions.get(actionId);
		if (!action || action.state !== BrowserToolState.AWAITING_APPROVAL) {
			throw new Error(`Action ${actionId} is not awaiting approval`);
		}
		
		const tool = this.toolRegistry.getTool(action.request.toolName);
		if (!tool) {
			throw new Error(`Tool ${action.request.toolName} not found`);
		}
		
		this.updateState(actionId, BrowserToolState.SCHEDULED);
		await this.executeAction(action, tool);
	}
	
	/**
	 * Cancel an action
	 */
	cancel(actionId: string): void {
		const action = this.actions.get(actionId);
		if (!action) {
			throw new Error(`Action ${actionId} not found`);
		}
		
		if (action.state === BrowserToolState.EXECUTING) {
			// Can't cancel executing action (could add abort signal support)
			throw new Error(`Cannot cancel executing action`);
		}
		
		this.updateState(actionId, BrowserToolState.CANCELLED);
	}
	
	/**
	 * Update action state
	 */
	private updateState(
		actionId: string,
		state: BrowserToolState,
		result?: BrowserToolResult,
	): void {
		const action = this.actions.get(actionId);
		if (!action) return;
		
		action.state = state;
		
		if (result) {
			action.result = result;
			if (!result.success && result.error) {
				action.error = new Error(result.error.message);
			}
		}
		
		if (state === BrowserToolState.SUCCESS || 
		    state === BrowserToolState.ERROR || 
		    state === BrowserToolState.CANCELLED) {
			action.endTime = Date.now();
		}
		
		this.notifyUpdate();
	}
	
	/**
	 * Notify listeners of state changes
	 */
	private notifyUpdate(): void {
		if (this.onActionUpdate) {
			this.onActionUpdate(Array.from(this.actions.values()));
		}
	}
	
	/**
	 * Get all actions
	 */
	getActions(): TrackedBrowserAction[] {
		return Array.from(this.actions.values());
	}
	
	/**
	 * Get action by ID
	 */
	getAction(id: string): TrackedBrowserAction | undefined {
		return this.actions.get(id);
	}
	
	/**
	 * Clear completed actions
	 */
	clearCompleted(): void {
		const completed = [
			BrowserToolState.SUCCESS,
			BrowserToolState.ERROR,
			BrowserToolState.CANCELLED,
		];
		
		for (const [id, action] of this.actions) {
			if (completed.includes(action.state)) {
				this.actions.delete(id);
			}
		}
		
		this.notifyUpdate();
	}
}