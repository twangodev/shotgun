import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

export class PlaywrightMCPService {
	private static instance: PlaywrightMCPService;
	private client?: Client;
	private isStarting = false;
	private isConnected = false;

	static getInstance(): PlaywrightMCPService {
		if (!PlaywrightMCPService.instance) {
			PlaywrightMCPService.instance = new PlaywrightMCPService();
		}
		return PlaywrightMCPService.instance;
	}

	async start(): Promise<void> {
		if (this.isConnected || this.isStarting) {
			return;
		}

		this.isStarting = true;

		try {
			// Create transport which will spawn the process
			const transport = new StdioClientTransport({
				command: 'npx',
				args: ['-y', '@playwright/mcp'],
				stderr: 'pipe', // Capture stderr for debugging
			});

			// Create client
			this.client = new Client(
				{
					name: 'shotgun-jobs',
					version: '1.0.0',
				},
				{
					capabilities: {},
				},
			);

			// Log stderr if available
			if (transport.stderr) {
				transport.stderr.on('data', (data: Buffer) => {
					console.error('MCP stderr:', data.toString());
				});
			}
			
			// Connect to the server (this automatically calls transport.start())
			await this.client.connect(transport);
			
			this.isConnected = true;
			console.log('MCP service connected successfully');
		} catch (error) {
			console.error('Failed to start MCP service:', error);
			this.cleanup();
			throw error;
		} finally {
			this.isStarting = false;
		}
	}

	private cleanup() {
		this.isConnected = false;
		this.client = undefined;
	}

	async stop(): Promise<void> {
		this.cleanup();
	}

	// Tool wrapper methods
	async navigate(url: string): Promise<any> {
		if (!this.client) {
			throw new Error('MCP client not connected');
		}

		const result = await this.client.callTool({
			name: 'navigate',
			arguments: {url},
		});

		return result;
	}

	async click(selector: string): Promise<any> {
		if (!this.client) {
			throw new Error('MCP client not connected');
		}

		const result = await this.client.callTool({
			name: 'click',
			arguments: {selector},
		});

		return result;
	}

	async fill(selector: string, text: string): Promise<any> {
		if (!this.client) {
			throw new Error('MCP client not connected');
		}

		const result = await this.client.callTool({
			name: 'fill',
			arguments: {selector, value: text},
		});

		return result;
	}

	async screenshot(): Promise<any> {
		if (!this.client) {
			throw new Error('MCP client not connected');
		}

		const result = await this.client.callTool({
			name: 'screenshot',
			arguments: {},
		});

		return result;
	}

	async extract(selector?: string): Promise<any> {
		if (!this.client) {
			throw new Error('MCP client not connected');
		}

		const result = await this.client.callTool({
			name: 'get_page_content',
			arguments: selector ? {selector} : {},
		});

		return result;
	}

	// Get available tools
	async listTools(): Promise<any> {
		if (!this.client) {
			throw new Error('MCP client not connected');
		}

		const response = await this.client.listTools();
		return response.tools;
	}
}