import {Command} from './commandTypes.js';

// TODO: This will be replaced with actual profile management
interface UserProfile {
	name?: string;
	email?: string;
	phone?: string;
	linkedIn?: string;
	resume?: string;
}

let currentProfile: UserProfile = {};

export const profileCommand: Command = {
	name: 'profile',
	description: 'Manage your job application profile',
	aliases: ['p'],
	execute: async (args: string[]) => {
		if (args.length === 0) {
			// Show current profile
			if (Object.keys(currentProfile).length === 0) {
				return {
					success: true,
					message:
						'No profile configured yet. Use /profile setup to get started.',
				};
			}

			const profileDisplay = Object.entries(currentProfile)
				.map(([key, value]) => `  ${key}: ${value || 'Not set'}`)
				.join('\n');

			return {
				success: true,
				message: `Current Profile:\n${profileDisplay}`,
			};
		}

		const subcommand = args[0]?.toLowerCase();

		if (subcommand === 'setup') {
			return {
				success: true,
				message:
					'Profile setup wizard coming soon! This will guide you through setting up your job application profile.',
			};
		}

		if (subcommand === 'edit') {
			return {
				success: true,
				message: 'Profile editing feature coming soon!',
			};
		}

		return {
			success: false,
			message: `Unknown profile subcommand: ${subcommand}. Try /profile, /profile setup, or /profile edit.`,
		};
	},
};
