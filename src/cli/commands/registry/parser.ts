import {CommandEvent, errorEvent} from '../../../core/events';
import {createInputContext} from '../../input/types';
import {HandlerRegistry} from '../../input/handlerRegistry';

/**
 * Parse and execute commands through the handler system
 */
export async function* parseAndExecuteCommand(
	input: string,
): AsyncGenerator<CommandEvent> {
	const context = createInputContext(input);
	const handlers = HandlerRegistry.getHandlers();

	// Process through handlers in priority order
	for (const handler of handlers) {
		if (handler.canHandle(context)) {
			const result = await handler.handle(context);

			if (result.handled && !result.continue) {
				// Handler should return a stream
				if (result.stream) {
					yield* result.stream;
					return;
				}
			}
		}
	}

	// No handler could process the input
	yield {
		type: 'error',
		error: `Unable to process: "${input}". Type /help for available commands.`,
	};
}