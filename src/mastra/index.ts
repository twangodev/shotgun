import { Mastra } from '@mastra/core';
import { supervisorAgent } from './agents/SupervisorAgent';

// Initialize Mastra with the supervisor agent and MCP server
export const mastra = new Mastra({
  agents: {
    supervisor: supervisorAgent,
  }
});

// Export types and agent for external use
export * from './types';
export { supervisorAgent } from './agents/SupervisorAgent';
