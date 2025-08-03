import {Command} from './commandTypes.js';

export const helpCommand: Command = {
	name: 'help',
	description: 'Show available commands and usage information',
	aliases: ['h', '?'],
	execute: async () => {
		const helpText = `
Available Commands:

  /help, /h, /?       Show this help message
  /profile            Manage your job application profile
  /apply <url>        Apply to a job at the specified URL
  /sessions, /ls      Open interactive session selector
  /detach, /d         Detach from the current session view
  /clear              Clear the message history
  /status             Check the status of current applications
  /history            View your application history
  /exit, /quit        Exit the application

Natural Language:
  You can also use natural language commands like:
  - "Help me apply to this job: [URL]"
  - "Show my profile"
  - "What's my application status?"

Tips:
  - Use arrow keys to navigate command history
  - Press Ctrl+C to cancel current operation
  - Your profile information is saved locally`;

		return {
			success: true,
			message: helpText.trim(),
		};
	},
};
