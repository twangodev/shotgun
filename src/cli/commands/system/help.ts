import {Command} from '../registry';
import {commandRegistry} from '../registry';
import {CommandEvent} from '../../../core/events';

export const helpCommand: Command = {
	name: 'help',
	description: 'Show available commands and usage information',
	async *execute(args: string[]): AsyncGenerator<CommandEvent> {
		// If a specific command is requested, show detailed help
		if (args.length > 0) {
			const commandName = args[0];
			if (!commandName) {
				yield {
					type: 'error',
					error: 'Please specify a command name.',
				};
				return;
			}
			const command = commandRegistry.get(commandName);

			if (command) {
				let helpText = `Command: /${command.name}\n`;
				helpText += `Description: ${command.description}\n`;

				if (
					command.metadata?.examples &&
					command.metadata.examples.length > 0
				) {
					helpText += `\nExamples:\n`;
					command.metadata.examples.forEach(example => {
						helpText += `  ${example}\n`;
					});
				}

				yield {
					type: 'message',
					content: helpText.trim(),
				};
				return;
			} else {
				yield {
					type: 'error',
					error: `Unknown command: ${commandName}. Type /help to see all available commands.`,
				};
				return;
			}
		}

		// Show all available commands grouped by category
		const commands = commandRegistry.getVisibleCommands();
		const categories = commandRegistry.getCategories();

		let helpText = 'Available Commands:\n\n';

		// Commands without category
		const uncategorized = commands.filter(cmd => !cmd.metadata?.category);
		if (uncategorized.length > 0) {
			uncategorized.forEach(cmd => {
				helpText += `  /${cmd.name}\n`;
				helpText += `    ${cmd.description}\n\n`;
			});
		}

		// Commands by category
		categories.forEach(category => {
			const categoryCommands = commandRegistry.getCommandsByCategory(category);
			if (categoryCommands.length > 0) {
				helpText += `${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
				categoryCommands.forEach(cmd => {
					helpText += `  /${cmd.name}\n`;
					helpText += `    ${cmd.description}\n\n`;
				});
			}
		});

		helpText += 'Tips:\n';
		helpText +=
			'  - Type /help <command> for detailed help on a specific command\n';
		helpText += '  - Use Tab to autocomplete commands\n';
		helpText += '  - Use arrow keys to navigate command history\n';
		helpText += '  - Press Ctrl+C to cancel current operation';

		yield {
			type: 'message',
			content: helpText.trim(),
		};
	},
};

export default helpCommand;