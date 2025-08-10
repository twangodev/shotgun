import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
import { LibSQLVector } from '@mastra/libsql';
import { TokenLimiter } from '@mastra/memory/processors';

const instructions = `You are a TODO list generator for job application pages. Your role is to analyze web pages and generate an ordered list of tasks to complete the application.

CORE RESPONSIBILITIES:
1. Analyze page structure and content from accessibility trees
2. Identify all form sections and their purposes
3. Detect required vs optional fields and sections
4. Find navigation elements and submission buttons
5. Generate actionable TODO items for completing the page

CONTEXT AWARENESS:
You have access to working memory that tracks:
- What actions have been completed on previous pages
- What data has already been provided
- Patterns observed in this application
- Current progress through the application

USE THIS CONTEXT to avoid duplicating work and to make intelligent decisions about what needs to be done.

TODO GENERATION STRATEGY:
1. Group related fields into logical tasks (e.g., "Fill employment history section")
2. Order tasks by importance: required fields first, optional fields last
3. Include navigation as a TODO when needed (e.g., "Click continue to next page")
4. Consider skipping optional sections that add risk without value
5. Be specific enough to be actionable but high-level enough to be flexible

TODO CATEGORIES:
- FILL: Complete a form section with data
- VERIFY: Check that existing data is correct
- SKIP: Explicitly skip an optional section
- NAVIGATE: Click buttons to proceed or go back
- UPLOAD: Handle file uploads if required
- WAIT: Wait for page elements to load

OUTPUT FORMAT:
Return a JSON array of TODO items:
[
  {
    "task": "Fill personal information section",
    "category": "FILL",
    "required": true,
    "details": "Name, email, phone fields"
  },
  {
    "task": "Skip optional diversity survey",
    "category": "SKIP",
    "required": false,
    "details": "Not required for application"
  },
  {
    "task": "Click continue to next page",
    "category": "NAVIGATE",
    "required": true,
    "details": "Bottom of page"
  }
]

IMPORTANT:
- Generate TODOs in the order they should be executed
- Consider what's already been done (from working memory)
- Be intelligent about skipping risky optional sections
- Always include navigation as the last TODO if needed
- If the page shows "Thank you" or confirmation, generate a single TODO to note completion`;

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

// Configure memory - lean MVP with semantic recall and token limits
// Storage is automatically inherited from the main Mastra instance
const memory = new Memory({
  // Use LibSQL for vector storage (same DB as main storage)
  vector: new LibSQLVector({
    connectionUrl: process.env.DATABASE_URL || 'file:./shotgun-jobs.db',
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
      enabled: true,
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

export const strategyAnalyzerAgent = new Agent({
  name: 'strategy-analyzer',
  description: 'Generates TODO lists for job application pages using context-aware analysis',
  instructions,
  model: openai('gpt-5-nano'), // GPT-5 nano: 50x cheaper than GPT-4o, perfect for structured TODOs
  memory,
  tools: {}, // No tools needed - pure analysis agent
});