import {Command} from '../registry';
import {CommandEvent} from '../../../core/events';

export const clearCommand: Command = {
	name: 'clear',
	description: 'Clear the message history',
	async *execute(): AsyncGenerator<CommandEvent> {
		yield {
			type: 'clear',
		};
	},
};

export default clearCommand;