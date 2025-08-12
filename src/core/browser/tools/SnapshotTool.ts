import {Page} from 'playwright';
import {BrowserTool, BrowserToolResult} from './types';
import {SnapshotManager, PageSnapshot} from '../snapshot';

/**
 * Snapshot Tool - Captures page state for AI analysis
 * Equivalent to gemini-cli's ReadFile tool
 */
export class SnapshotTool implements BrowserTool<{}, PageSnapshot & BrowserToolResult> {
	name = 'snapshot';
	description = 'Capture the current page state as a YAML accessibility tree';
	
	private snapshotManager: SnapshotManager | null = null;
	
	async execute(params: {}, page: Page): Promise<PageSnapshot & BrowserToolResult> {
		try {
			// Create or reuse snapshot manager
			if (!this.snapshotManager || this.snapshotManager['page'] !== page) {
				this.snapshotManager = new SnapshotManager(page);
			}
			
			// Capture full page snapshot
			const snapshot = await this.snapshotManager.createFullSnapshot();
			
			return {
				...snapshot,
				success: true,
				message: `Captured snapshot of ${snapshot.title}`,
				data: {
					elementCount: (snapshot.ariaSnapshot.match(/\[ref=/g) || []).length,
					hasFileUpload: snapshot.hasFileUpload,
				},
			};
		} catch (error) {
			return {
				url: page.url(),
				title: await page.title().catch(() => 'Unknown'),
				ariaSnapshot: '',
				hasFileUpload: false,
				success: false,
				message: `Failed to capture snapshot: ${error}`,
				error: {
					message: error instanceof Error ? error.message : String(error),
					recoverable: true,
				},
			};
		}
	}
	
	// Snapshots never require confirmation
	async shouldConfirmExecute(): Promise<boolean> {
		return false;
	}
}