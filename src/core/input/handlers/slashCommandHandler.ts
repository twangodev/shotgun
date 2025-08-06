import {InputHandler, InputContext, HandlerResult} from '../types';
import {commandRegistry} from '../../command-system';

export class SlashCommandHandler implements InputHandler {
	name = 'SlashCommandHandler';
	priority = 90; // High priority, but after URL handler

	canHandle(context: InputContext): boolean {
		return context.trimmed.startsWith('/');
	}

	async handle(context: InputContext): Promise<HandlerResult> {
		const parts = context.trimmed.slice(1).split(' ');
		const commandName = parts[0]?.toLowerCase();
		const args = parts.slice(1);

		if (!commandName) {
			return {
				handled: true,
				result: {
					success: false,
					message: 'Please enter a command name after the slash.',
				},
			};
		}

		// Use the centralized command registry
		const result = await commandRegistry.execute(commandName, args);

		// If command not found, provide helpful message
		if (!result.success && result.message.includes('Unknown command')) {
			return {
				handled: true,
				result: {
					success: false,
					message: `Unknown command: /${commandName}. Type /help for available commands.`,
				},
			};
		}

		return {
			handled: true,
			result,
		};
	}

	static getAvailableCommands() {
		return commandRegistry.getVisibleCommands();
	}
}
