import {Command} from './commandTypes';

export const helpCommand: Command = {
	name: 'help',
	description: 'Show available commands and usage information',
	aliases: ['h', '?'],
	execute: async () => {
		const helpText = `
Available Commands:

  /help, /h, /?       Show this help message
  /clear              Clear the message history
  /exit, /quit        Exit the application

Tips:
  - Use arrow keys to navigate command history
  - Press Ctrl+C to cancel current operation
  - This is a barebones CLI framework ready for customization`;

		return {
			success: true,
			message: helpText.trim(),
		};
	},
};
