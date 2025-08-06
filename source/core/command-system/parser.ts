import {CommandResult} from './types';
import {createInputContext} from '../input/types';
import {HandlerRegistry} from '../input/handlerRegistry';

/**
 * Parse and execute commands through the handler system
 */
export async function parseAndExecuteCommand(
	input: string,
): Promise<CommandResult> {
	const context = createInputContext(input);
	const handlers = HandlerRegistry.getHandlers();

	// Process through handlers in priority order
	for (const handler of handlers) {
		if (handler.canHandle(context)) {
			const result = await handler.handle(context);

			if (result.handled && !result.continue) {
				return (
					result.result || {
						success: true,
						message: 'Command processed successfully',
					}
				);
			}
		}
	}

	// No handler could process the input
	return {
		success: false,
		message: `Unable to process: "${input}". Type /help for available commands.`,
	};
}
