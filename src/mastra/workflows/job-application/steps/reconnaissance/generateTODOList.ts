import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * Generate TODO List Step
 * 
 * Analyzes the page and generates a TODO list of high-level tasks to accomplish.
 * Each TODO represents a logical grouping of actions (e.g., "Fill employment section").
 */
export const generateTODOListStep = createStep({
  id: 'generate-todo-list',
  description: 'Analyzes page and generates TODO list of high-level tasks to accomplish',
  execute: async ({ inputData }) => {
    console.log('[TODO-GEN] Generating TODO list for page...');
    
    // PLACEHOLDER: In real implementation:
    // 1. Get snapshot from session
    // 2. Analyze page content
    // 3. Generate ordered list of tasks
    
    // Simple ordered task list - order matters, not priority
    const mockTodos = [
      {
        id: 'todo-1',
        task: 'Fill employment history section',
        status: 'pending'
      },
      {
        id: 'todo-2', 
        task: 'Fill education section',
        status: 'pending'
      },
      {
        id: 'todo-3',
        task: 'Skip optional references section',
        status: 'pending'
      },
      {
        id: 'todo-4',
        task: 'Click continue to next page',
        status: 'pending'
      }
    ];
    
    console.log('[TODO-GEN] Generated TODOs (in order):');
    mockTodos.forEach((todo, index) => {
      console.log(`  ${index + 1}. ${todo.task}`);
    });
    
    return {
      sessionId: inputData.sessionId,
      todos: mockTodos,
      pageNumber: inputData.pageNumber || 1
    };
  }
});