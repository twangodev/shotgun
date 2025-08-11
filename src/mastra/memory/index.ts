import { Memory } from '@mastra/memory';
import { LibSQLVector } from '@mastra/libsql';
import { openai } from '@ai-sdk/openai';
import { TokenLimiter } from '@mastra/memory/processors';

// Working memory template for tracking application progress
const workingMemoryTemplate = `# Application Progress

## Completed Pages
- Page 1: [Summary of what was done]
- Page 2: [Summary of what was done]

## Data Provided So Far
- Personal Info: [Not provided / Provided]
- Contact: [Not provided / Provided]
- Employment History: [Not provided / Provided]
- Education: [Not provided / Provided]
- References: [Not provided / Provided]
- Documents: [Not provided / Provided]

## Current Page Info
- URL: [Current page URL]
- Page Number: [X of Y if known]
- Page Type: [Form / Review / Confirmation / etc.]

## Observed Patterns
- Required field markers: [* / required / etc.]
- Navigation style: [Next button / Save & Continue / etc.]
- Validation behavior: [Inline / On submit / etc.]
- Optional sections: [Can be skipped / Must be explicitly skipped]

## Decisions Made
- Skipped sections: [List of skipped sections and why]
- Navigation choices: [Saved as draft / Continued / etc.]`;

/**
 * Shared memory configuration for agents that need context-aware memory.
 * Storage is automatically inherited from the main Mastra instance.
 * This configuration includes:
 * - Vector storage for semantic recall (using same DB as main storage)
 * - OpenAI embeddings for semantic search
 * - Working memory for tracking application progress
 * - Token limiting to prevent context overflow
 */
export const agentMemory = new Memory({
  // Vector storage uses the same DB as main storage for consistency
  vector: new LibSQLVector({
    connectionUrl: process.env['DATABASE_URL'] || 'file:./shotgun-jobs-vec.db',
  }),
  // Use OpenAI for embeddings (simple, no extra deps)
  embedder: openai.embedding('text-embedding-3-small'),
  options: {
    workingMemory: {
      enabled: true,
      template: workingMemoryTemplate,
      scope: 'thread', // Per-application memory
    },
    semanticRecall: {
      topK: 2, // Reduced from 3 to save tokens
      messageRange: 1, // Reduced context to save tokens
      scope: 'resource', // Search across all applications for this user
    },
    lastMessages: 5, // Reduced from 10 to save tokens
  },
  // Add token limiter to prevent context overflow
  processors: [
    new TokenLimiter(30000), // Conservative limit - ~25% of GPT-4o's context
  ],
});

// Export the template separately if other agents need a different template
export { workingMemoryTemplate };
