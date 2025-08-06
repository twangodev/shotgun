import { MCPClient } from '@mastra/mcp';

// Create MCP client with Playwright server configuration
export const playwrightMcp = new MCPClient({
  servers: {
    playwright: {
      command: 'npx',
      args: [
        '@playwright/mcp@latest',
        '--isolated', // Keep browser profile in memory
      ],
    },
  },
});