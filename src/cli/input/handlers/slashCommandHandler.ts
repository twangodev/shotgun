import {InputHandler, InputContext, HandlerResult} from '../types';
import {commandRegistry} from '../../commands/registry';
import {CommandEvent} from '../../../core/events';

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
			const errorStream = async function* (): AsyncGenerator<CommandEvent> {
				yield {
					type: 'error',
					error: 'Please enter a command name after the slash.',
				};
			};
			return {
				handled: true,
				stream: errorStream(),
			};
		}

		// Use the centralized command registry
		const stream = commandRegistry.execute(commandName, args);

		// If command not found, provide helpful message
		if (!stream) {
			const errorStream = async function* (): AsyncGenerator<CommandEvent> {
				yield {
					type: 'error',
					error: `Unknown command: /${commandName}. Type /help for available commands.`,
				};
			};
			return {
				handled: true,
				stream: errorStream(),
			};
		}

		return {
			handled: true,
			stream,
		};
	}

	static getAvailableCommands() {
		return commandRegistry.getVisibleCommands();
	}
}