import { openai } from '@ai-sdk/openai';
import { RuntimeContext } from '@mastra/core/di';

export const getBaseModelConfig = (complexity: 'simple' | 'complex' = 'simple') => {
  return complexity === 'complex'
    ? openai('gpt-4o')
    : openai('gpt-4o-mini');
};

export const getBaseInstructions = (role: string, capabilities: string[]) => {
  return `You are a specialized agent in the job application automation system.

Role: ${role}

Capabilities:
${capabilities.map(c => `- ${c}`).join('\n')}

Guidelines:
- Be precise and accurate in your analysis
- Provide confidence scores for your decisions
- Flag any ambiguities or issues for review
- Optimize for accuracy over speed
- Consider edge cases and variations

Output your results in the specified JSON schema format.`;
};

export const createAgentWithContext = (
  name: string,
  instructions: string | ((ctx: { runtimeContext: RuntimeContext }) => string),
  modelComplexity: 'simple' | 'complex' = 'simple'
) => {
  return {
    name,
    instructions,
    model: getBaseModelConfig(modelComplexity),
  };
};
