import {CommandResult} from '../commands/commandTypes.js';

export interface InputContext {
	raw: string;
	trimmed: string;
	tokens: string[];
}

export interface HandlerResult {
	handled: boolean;
	result?: CommandResult;
	continue?: boolean; // Allow chaining handlers
}

export interface InputHandler {
	name: string;
	priority: number; // Higher priority handlers run first
	canHandle(context: InputContext): boolean;
	handle(context: InputContext): Promise<HandlerResult>;
}

export function createInputContext(input: string): InputContext {
	const trimmed = input.trim();
	return {
		raw: input,
		trimmed,
		tokens: trimmed.split(' ').filter(t => t.length > 0),
	};
}
