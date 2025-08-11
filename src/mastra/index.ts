import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import {LibSQLStore } from '@mastra/libsql';
import { strategyAnalyzerAgent } from './agents/StrategyAnalyzerAgent';
import { jobApplicationWorkflow } from './workflows';

// Initialize storage for Mastra
const storage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:./shotgun-jobs.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Initialize Mastra with agents and workflows
export const mastra = new Mastra({
  logger: new PinoLogger({
    name: 'shotgun-jobs.mastra',
    level: 'debug', // Debug level for development visibility
  }),
  storage,
  agents: {
    strategyAnalyzer: strategyAnalyzerAgent,
  },
  workflows: {
    jobApplicationWorkflow,
  },
});

// Export types for external use
export * from './types';
