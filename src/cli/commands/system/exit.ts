import {Command, CommandResult} from '../registry';

export const exitCommand: Command = {
	name: 'exit',
	description: 'Exit the application',
	execute: async (): Promise<CommandResult> => {
		return {
			success: true,
			message: 'EXIT_APPLICATION',
			data: {
				action: 'exit',
			},
		};
	},
};

export default exitCommand;
