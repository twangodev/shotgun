import {Command} from '../registry';
import {CommandEvent} from '../../../core/events';

export const exitCommand: Command = {
	name: 'exit',
	description: 'Exit the application',
	async *execute(): AsyncGenerator<CommandEvent> {
		yield {
			type: 'exit',
		};
	},
};

export default exitCommand;