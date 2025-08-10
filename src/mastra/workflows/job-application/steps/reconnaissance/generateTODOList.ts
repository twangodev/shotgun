import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { sessionStore } from '../../../../../core/session';
import { strategyAnalyzerAgent } from '../../../../agents/StrategyAnalyzerAgent';

/**
 * Generate TODO List Step (MVP)
 * 
 * Simple implementation that uses the StrategyAnalyzerAgent to generate TODOs.
 * The agent has memory for context but we keep the implementation minimal.
 */
export const generateTODOListStep = createStep({
  id: 'generate-todo-list',
  description: 'Uses AI agent to generate TODO list for the current page',
  execute: async ({ inputData, mastra }) => {
    const { sessionId } = inputData;
    const logger = mastra.getLogger();
    
    // Get snapshot from session
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const currentPageData = session.getCurrentPageData();
    if (!currentPageData?.baselineSnapshot) {
      throw new Error(`No snapshot found for session ${sessionId}`);
    }
    
    // Stringify the accessibility tree
    const treeString = JSON.stringify(currentPageData.baselineSnapshot.accessibilityTree, null, 2);
    
    // Simple token estimation (rough: 1 token ≈ 4 chars)
    const estimatedTokens = treeString.length / 4;
    if (estimatedTokens > 50000) {
      // Tree is too large, truncate or summarize
      logger.warn(`[TODO-GEN] Large accessibility tree detected: ~${Math.round(estimatedTokens)} tokens`);
      // For MVP, just truncate - in production, we'd intelligently filter
      const truncated = treeString.substring(0, 200000); // ~50K tokens
      const prompt = `Analyze this page and generate a TODO list.

Accessibility Tree (truncated due to size):
${truncated}...

Return ONLY a JSON array.`;
    } else {
      // Normal size, proceed as usual
      var prompt = `Analyze this page and generate a TODO list.

Accessibility Tree:
${treeString}

Return ONLY a JSON array.`;
    }
    
    // Call agent (it has memory for context)
    const response = await strategyAnalyzerAgent.generate(prompt, {
      threadId: `app-${sessionId}`,
      resourceId: 'user',
    });
    
    // Extract JSON from response
    const jsonMatch = response.text.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('No JSON array in response');
    }
    
    // Parse and add status field
    const todos = JSON.parse(jsonMatch[0]).map((todo: any) => ({
      ...todo,
      status: 'pending'
    }));
    
    logger.info(`[TODO-GEN] Generated ${todos.length} TODOs`);
    
    return {
      sessionId,
      todos,
      pageNumber: inputData.pageNumber || 1
    };
  }
});