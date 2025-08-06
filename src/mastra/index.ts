import { Mastra } from '@mastra/core';
import { supervisorAgent } from './agents/SupervisorAgent';
import { universalATSWorkflow } from './workflows/universal-ats-workflow';

// Initialize Mastra with the supervisor agent and workflow
export const mastra = new Mastra({
  agents: {
    supervisor: supervisorAgent,
  },
  workflows: {
    universalATSWorkflow,
  },
});

// Export types and agent for external use
export * from './types';
export { supervisorAgent } from './agents/SupervisorAgent';
