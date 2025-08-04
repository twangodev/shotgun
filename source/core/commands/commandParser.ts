import {CommandResult} from './commandTypes';
import {createInputContext} from '../input/types';
import {HandlerRegistry} from '../input/handlerRegistry';
import {URLHandler} from '../input/handlers/urlHandler';
import {SlashCommandHandler} from '../input/handlers/slashCommandHandler';
import {NaturalLanguageHandler} from '../input/handlers/naturalLanguageHandler';

// Initialize handlers on first import
let initialized = false;

function initializeHandlers() {
	if (initialized) return;

	// Register handlers in order of priority
	HandlerRegistry.register(new URLHandler());
	HandlerRegistry.register(new SlashCommandHandler());
	HandlerRegistry.register(new NaturalLanguageHandler());

	initialized = true;
}

export async function parseAndExecuteCommand(
	input: string,
): Promise<CommandResult> {
	// Ensure handlers are initialized
	initializeHandlers();

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

// Export for compatibility with existing code
export function getAvailableCommands() {
	return SlashCommandHandler.getAvailableCommands();
}
