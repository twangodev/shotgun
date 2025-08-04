import {Agent} from '@mastra/core/agent';
import {ApplicationSession} from '../core/session/ApplicationSession.js';

export class MastraAgentService {
	private static instance: MastraAgentService;
	
	static getInstance(): MastraAgentService {
		if (!MastraAgentService.instance) {
			MastraAgentService.instance = new MastraAgentService();
		}
		return MastraAgentService.instance;
	}
	
	async runAgent(agent: Agent, session: ApplicationSession, initialPrompt: string): Promise<void> {
		try {
			session.emitThought('Starting page analysis...');
			
			// Stream the agent's response
			const stream = await agent.stream([
				{ 
					role: 'user', 
					content: initialPrompt 
				}
			], {
				maxSteps: 5,
				onStepFinish: ({ toolCalls }) => {
					// Emit tool calls as actions
					if (toolCalls && toolCalls.length > 0) {
						toolCalls.forEach(call => {
							const args = call.args ? JSON.stringify(call.args) : '';
							session.emitAction(`Calling ${call.toolName}${args ? ` with ${args}` : ''}`);
						});
					}
				}
			});
			
			let currentThought = '';
			
			// Process the stream
			for await (const chunk of stream.fullStream) {
				switch (chunk.type) {
					case 'text-delta':
						// Accumulate text for thoughts
						currentThought += chunk.textDelta;
						// Emit complete sentences as thoughts
						if (currentThought.includes('.') || currentThought.includes('!') || currentThought.includes('?')) {
							const sentences = currentThought.match(/[^.!?]+[.!?]+/g) || [];
							sentences.forEach(sentence => {
								session.emitThought(sentence.trim());
							});
							// Keep any incomplete sentence
							currentThought = currentThought.replace(/.*[.!?]\s*/, '');
						}
						break;
						
					case 'tool-call':
						// Tool calls are already handled in onStepFinish
						break;
						
					case 'tool-result':
						// Emit tool results as thoughts
						if (chunk.result) {
							try {
								const resultStr = typeof chunk.result === 'string' 
									? chunk.result 
									: JSON.stringify(chunk.result);
								session.emitThought(`Tool result: ${resultStr.substring(0, 200)}${resultStr.length > 200 ? '...' : ''}`);
							} catch (e) {
								session.emitThought('Tool execution completed');
							}
						}
						break;
						
					case 'error':
						session.emitError(`Agent error: ${chunk.error}`);
						break;
				}
			}
			
			// Emit any remaining thought
			if (currentThought.trim()) {
				session.emitThought(currentThought.trim());
			}
			
			session.emitThought('Page analysis complete');
			
		} catch (error: any) {
			session.emitError(`Agent failed: ${error.message}`);
			throw error;
		}
	}
}