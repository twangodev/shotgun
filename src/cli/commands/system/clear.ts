import {Command, CommandResult} from '../registry';

export const clearCommand: Command = {
	name: 'clear',
	description: 'Clear the message history',
	execute: async (): Promise<CommandResult> => {
		return {
			success: true,
			message: 'CLEAR_MESSAGES',
			data: {
				action: 'clear',
			},
		};
	},
};

export default clearCommand;
