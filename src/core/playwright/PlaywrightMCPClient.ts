/**
 * PlaywrightMCPClient - Lean wrapper for Playwright MCP
 *
 * MVP: Just navigation for now. Will add more as needed.
 */

import { MCPClient } from '@mastra/mcp';

export class PlaywrightMCPClient {
  private mcpClient: MCPClient;
  private allTools: Map<string, any> = new Map();
  private logger?: any;

  constructor(sessionId: string, logger?: any) {
    this.logger = logger;
    // Initialize MCP client with Playwright server configuration
    // Use sessionId as unique identifier to prevent multiple initialization errors
    this.mcpClient = new MCPClient({
      id: sessionId,
      servers: {
        playwright: {
          command: 'npx',
          args: [
            '@playwright/mcp@latest',
            '--isolated', // Keep browser profile in memory for this session
          ],
        },
      },
    });
  }

  /**
   * Connect to the MCP server and load available tools
   */
  async connect(): Promise<void> {
    try {
      this.logger?.info('Connecting to Playwright MCP server', { component: 'PlaywrightMCP' });

      // Get all available tools from the MCP server
      const tools = await this.mcpClient.getTools();

      // Tools is an object where keys are tool names (namespaced with server name)
      if (tools && typeof tools === 'object') {
        for (const [toolName, tool] of Object.entries(tools)) {
          this.allTools.set(toolName, tool);
        }
      }

      // Debug: List all available tools
      this.logger?.debug('Available tools', { 
        component: 'PlaywrightMCP', 
        tools: Array.from(this.allTools.keys()) 
      });
      this.logger?.info('Connected successfully', { 
        component: 'PlaywrightMCP', 
        toolCount: this.allTools.size 
      });
    } catch (error) {
      this.logger?.error('Failed to connect', { 
        component: 'PlaywrightMCP', 
        error 
      });
      throw new Error(`Failed to connect to Playwright MCP: ${error}`);
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    try {
      this.logger?.info('Disconnecting from server', { component: 'PlaywrightMCP' });
      
      // Actually disconnect from the MCP server - this closes the browser
      await this.mcpClient.disconnect();
      
      this.allTools.clear();
      this.logger?.info('Disconnected successfully', { component: 'PlaywrightMCP' });
    } catch (error) {
      this.logger?.error('Error during disconnect', { 
        component: 'PlaywrightMCP', 
        error 
      });
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<any> {
    const tool = this.getTool('playwright_browser_navigate');
    this.logger?.info('Navigating to URL', { 
      component: 'PlaywrightMCP', 
      url 
    });

    // The tool.execute expects { context: args, runtimeContext?: ... }
    // Context contains the actual arguments that get passed to the MCP tool
    const params = { context: { url } };

    try {
      const result = await tool.execute(params);
      this.logger?.info('Navigation complete', { component: 'PlaywrightMCP' });
      return result;
    } catch (error) {
      this.logger?.error('Tool execution error', { 
        component: 'PlaywrightMCP', 
        error 
      });
      throw error;
    }
  }

  /**
   * Get a snapshot of the current page's accessibility tree
   */
  async snapshot(): Promise<any> {
    const tool = this.getTool('playwright_browser_snapshot');
    this.logger?.info('Taking page snapshot', { component: 'PlaywrightMCP' });

    const params = { context: {} };

    try {
      const result = await tool.execute(params);
      // Log snapshot metadata only, not the full content
      const snapshotSize = JSON.stringify(result).length;
      this.logger?.info('Snapshot captured', { 
        component: 'PlaywrightMCP',
        snapshotSizeBytes: snapshotSize,
        estimatedTokens: Math.round(snapshotSize / 4)
      });
      return result;
    } catch (error) {
      this.logger?.error('Snapshot error', { 
        component: 'PlaywrightMCP', 
        error 
      });
      throw error;
    }
  }

  // TODO: Add these methods as needed:
  // - click(selector)
  // - type(selector, text)
  // - evaluate(script)

  /**
   * Get a specific tool by name (internal helper)
   */
  private getTool(name: string): any {
    if (this.allTools.size === 0) {
      throw new Error('No tools available. Call connect() first.');
    }

    const tool = this.allTools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return tool;
  }
}
