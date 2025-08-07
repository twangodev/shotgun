import { Mastra } from '@mastra/core';
import { supervisorAgent } from './agents/SupervisorAgent';
import { universalATSWorkflow } from './workflows/universal-ats-workflow';
import { jobApplicationWorkflow } from './workflows/job-application';

// Initialize Mastra with the supervisor agent and workflow
export const mastra = new Mastra({
  agents: {
    supervisor: supervisorAgent,
  },
  workflows: {
    universalATSWorkflow,
    jobApplicationWorkflow,
  },
});

// Export types and agent for external use
export * from './types';
export { supervisorAgent } from './agents/SupervisorAgent';
