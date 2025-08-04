import {Command, CommandResult} from './commandTypes';
import {SessionManager} from '../../services/SessionManager';

export const sessionsCommand: Command = {
	name: 'sessions',
	description: 'Show interactive session selector',
	aliases: ['ls'],
	execute: async (): Promise<CommandResult> => {
		const sessionManager = SessionManager.getInstance();
		const sessions = sessionManager.listSessions();

		if (sessions.length === 0) {
			return {
				success: true,
				message: 'No active sessions. Start a session by entering a URL or using /apply.',
			};
		}

		// Return special data to trigger session selector in App.tsx
		return {
			success: true,
			message: 'Opening session selector...',
			data: {
				action: 'show_session_selector',
			},
		};
	},
};

export const detachCommand: Command = {
	name: 'detach',
	description: 'Detach from the current session view',
	aliases: ['d'],
	execute: async (): Promise<CommandResult> => {
		return {
			success: true,
			message: 'Detaching from session...',
			data: {
				action: 'detach_session',
			},
		};
	},
};

