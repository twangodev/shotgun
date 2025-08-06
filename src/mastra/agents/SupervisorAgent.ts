import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { playwrightMcp } from '../mcp/playwright';

const instructions = `You are a browser automation agent with access to browser control tools.

Follow the user's instructions to interact with web pages. Provide clear feedback about actions taken and any issues encountered.`;

export const supervisorAgent = new Agent({
  name: 'supervisor',
  description: 'Browser automation agent with access to browser control tools',
  instructions,
  model: openai('gpt-4o'),
  tools: await playwrightMcp.getTools(),
});
