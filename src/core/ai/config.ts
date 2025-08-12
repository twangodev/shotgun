import {openai} from '@ai-sdk/openai';

/**
 * Lean AI configuration - hardcoded for MVP
 */
export const AI_MODEL = openai('gpt-5-mini'); // Fast, cost-effective
export const AI_CONFIG = {
	temperature: 0.1,
	maxTokens: 2000,
};
