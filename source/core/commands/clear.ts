import {Command, CommandResult} from './commandTypes';

export const clearCommand: Command = {
	name: 'clear',
	description: 'Clear the message history',
	aliases: ['cls', 'c'],
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
