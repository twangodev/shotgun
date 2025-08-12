import {BrowserTool} from './types';
import {SnapshotTool} from './SnapshotTool';
import {FillFieldTool} from './FillFieldTool';
import {ClickTool} from './ClickTool';
import {SelectTool} from './SelectTool';
import {CheckboxTool} from './CheckboxTool';
import {WaitTool} from './WaitTool';
import {HumanInterventionTool} from './HumanInterventionTool';
import {UploadTool} from './UploadTool';

/**
 * Browser Tool Registry - Manages available browser tools
 * Similar to gemini-cli's tool registry
 */
export class BrowserToolRegistry {
	private tools: Map<string, BrowserTool> = new Map();
	
	constructor() {
		// Register default tools
		this.registerTool(new SnapshotTool());
		this.registerTool(new FillFieldTool());
		this.registerTool(new ClickTool());
		this.registerTool(new SelectTool());
		this.registerTool(new CheckboxTool());
		this.registerTool(new WaitTool());
		this.registerTool(new HumanInterventionTool());
		this.registerTool(new UploadTool());
	}
	
	/**
	 * Register a browser tool
	 */
	registerTool(tool: BrowserTool): void {
		this.tools.set(tool.name, tool);
	}
	
	/**
	 * Get a tool by name
	 */
	getTool(name: string): BrowserTool | undefined {
		return this.tools.get(name);
	}
	
	/**
	 * Get all available tools
	 */
	getAllTools(): BrowserTool[] {
		return Array.from(this.tools.values());
	}
	
	/**
	 * Get tool names and descriptions for AI
	 */
	getToolDescriptions(): Array<{name: string; description: string}> {
		return this.getAllTools().map(tool => ({
			name: tool.name,
			description: tool.description,
		}));
	}
	
	/**
	 * Check if a tool exists
	 */
	hasTool(name: string): boolean {
		return this.tools.has(name);
	}
}