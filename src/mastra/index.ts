import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import {LibSQLStore } from '@mastra/libsql';
import { supervisorAgent } from './agents/SupervisorAgent';
import { strategyAnalyzerAgent } from './agents/StrategyAnalyzerAgent';
import { universalATSWorkflow } from './workflows/universal-ats-workflow';
import { jobApplicationWorkflow } from './workflows';

// Initialize storage for Mastra
const storage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:./shotgun-jobs.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Initialize Mastra with the supervisor agent and workflow
export const mastra = new Mastra({
  logger: new PinoLogger({
    name: 'shotgun-jobs.mastra',
    level: 'debug', // Debug level for development visibility
  }),
  storage,
  agents: {
    supervisor: supervisorAgent,
    strategyAnalyzer: strategyAnalyzerAgent,
  },
  workflows: {
    universalATSWorkflow,
    jobApplicationWorkflow,
  },
});

// Export types and agent for external use
export * from './types';
export { supervisorAgent } from './agents/SupervisorAgent';
