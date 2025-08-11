/**
 * Unified event system for all commands
 * All commands are streams - some just emit one event and complete
 */

export type CommandEvent =
	| { type: 'message'; content: string }
	| { type: 'error'; error: string | Error }
	| { type: 'clear' }
	| { type: 'exit' }
	| { type: 'progress'; message: string }
	| { type: 'completed'; data?: any };

/**
 * Helper function to create a single-event stream
 */
export async function* singleEvent(
	event: CommandEvent,
): AsyncGenerator<CommandEvent> {
	yield event;
}

/**
 * Helper function to create a message event stream
 */
export async function* messageEvent(
	content: string,
): AsyncGenerator<CommandEvent> {
	yield { type: 'message', content };
}

/**
 * Helper function to create an error event stream
 */
export async function* errorEvent(
	error: string | Error,
): AsyncGenerator<CommandEvent> {
	yield { type: 'error', error };
}