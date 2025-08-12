import {Page, FileChooser} from 'playwright';

/**
 * Extended Page type with Playwright's internal AI snapshot method
 */
type PageWithSnapshot = Page & {
	_snapshotForAI: () => Promise<string>;
};

/**
 * Page snapshot for AI consumption
 */
export interface PageSnapshot {
	url: string;
	title: string;
	ariaSnapshot: string; // YAML accessibility tree with ref attributes
	hasFileUpload: boolean; // Track if page has file upload capability
}

/**
 * Manages page snapshot capture and element targeting
 */
export class SnapshotManager {
	private hasFileUpload = false;
	private currentSnapshot: PageSnapshot | null = null;

	constructor(private page: Page) {
		this.setupEventListeners();
	}

	/**
	 * Set up event listeners to track file upload capability
	 */
	private setupEventListeners(): void {
		// Track file choosers - indicates resume/document upload capability
		this.page.on('filechooser', (_: FileChooser) => {
			this.hasFileUpload = true;
		});
	}

	/**
	 * Capture the accessibility snapshot using Playwright's internal API
	 */
	async captureAriaSnapshot(): Promise<string> {
		try {
			const pageWithSnapshot = this.page as PageWithSnapshot;
			return await pageWithSnapshot._snapshotForAI();
		} catch (error) {
			console.warn('Failed to capture accessibility snapshot:', error);
			// Fallback to basic accessibility tree if internal API fails
			return await this.fallbackSnapshot();
		}
	}

	/**
	 * Fallback method if _snapshotForAI is not available
	 */
	private async fallbackSnapshot(): Promise<string> {
		const snapshot = await this.page.accessibility.snapshot();
		if (!snapshot) {
			return 'Snapshot unavailable - page may be in unstable state';
		}
		// Format the standard accessibility tree as YAML-like structure
		return this.formatAccessibilityNode(snapshot);
	}

	/**
	 * Format accessibility node as YAML (fallback method)
	 */
	private formatAccessibilityNode(node: any, indent = 0): string {
		const spaces = '  '.repeat(indent);
		let output = '';

		if (node.role) {
			output += `${spaces}- ${node.role}`;
			if (node.name) {
				output += ` "${node.name}"`;
			}
			// Add properties in brackets
			const props: string[] = [];
			if (node.required) props.push('required');
			if (node.disabled) props.push('disabled');
			if (node.checked) props.push('checked');
			if (node.focused) props.push('focused');
			
			if (props.length > 0) {
				output += ` [${props.join('] [')}]`;
			}
			
			if (node.value) {
				output += `: ${node.value}`;
			}
			output += '\n';
		}

		if (node.children) {
			for (const child of node.children) {
				output += this.formatAccessibilityNode(child, indent + 1);
			}
		}

		return output;
	}

	/**
	 * Create a page snapshot for AI consumption
	 */
	async createFullSnapshot(): Promise<PageSnapshot> {
		const ariaSnapshot = await this.captureAriaSnapshot();

		const snapshot: PageSnapshot = {
			url: this.page.url(),
			title: await this.page.title(),
			ariaSnapshot,
			hasFileUpload: this.hasFileUpload,
		};

		this.currentSnapshot = snapshot;
		return snapshot;
	}

	/**
	 * Clear state (useful between page navigations)
	 */
	clearState(): void {
		this.hasFileUpload = false;
		this.currentSnapshot = null;
	}

	/**
	 * Get the current snapshot (if available)
	 */
	getCurrentSnapshot(): PageSnapshot | null {
		return this.currentSnapshot;
	}

	/**
	 * Validate if a ref exists in the current snapshot
	 */
	validateRef(ref: string): boolean {
		if (!this.currentSnapshot) return false;
		return this.currentSnapshot.ariaSnapshot.includes(`[ref=${ref}]`);
	}

	/**
	 * Click an element by its ref attribute from the snapshot
	 */
	async clickElementByRef(ref: string, description: string): Promise<void> {
		if (!this.validateRef(ref)) {
			throw new Error(`Ref ${ref} not found in current snapshot`);
		}
		
		const locator = this.page.locator(`[aria-ref="${ref}"]`);
		// Add description for better debugging
		await locator.click({
			timeout: 10000,
		});
	}

	/**
	 * Fill a field by its ref attribute
	 */
	async fillFieldByRef(ref: string, value: string, description: string): Promise<void> {
		if (!this.validateRef(ref)) {
			throw new Error(`Ref ${ref} not found in current snapshot`);
		}
		
		const locator = this.page.locator(`[aria-ref="${ref}"]`);
		await locator.fill(value, {
			timeout: 10000,
		});
	}

	/**
	 * Format snapshot for display/logging
	 */
	formatSnapshotForDisplay(): string {
		if (!this.currentSnapshot) {
			return 'No snapshot available';
		}

		const { url, title, ariaSnapshot, hasFileUpload } = this.currentSnapshot;

		let output = `### Page State\n`;
		output += `- URL: ${url}\n`;
		output += `- Title: ${title}\n`;
		
		if (hasFileUpload) {
			output += `- File Upload: Available\n`;
		}
		
		output += `\n### Accessibility Tree\n`;
		output += '```yaml\n';
		output += ariaSnapshot;
		output += '\n```';

		return output;
	}
}