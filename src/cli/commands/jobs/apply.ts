import {Command} from '../registry';
import {CommandEvent} from '../../../core/events';
import {JobApplicationAgent} from '../../../core/agents';
import {profileManager} from '../../../core/profile';

export const applyCommand: Command = {
	name: 'apply',
	description: 'Apply to a job posting',
	async *execute(args: string[]): AsyncGenerator<CommandEvent> {
		// Check if URL was provided
		if (args.length === 0) {
			yield {
				type: 'error',
				error: 'Please provide a job posting URL. Usage: /apply <url>',
			};
			return;
		}

		const url = args[0];

		// Load user profile
		let profile;
		try {
			profile = profileManager.loadProfile();
		} catch (error) {
			yield {
				type: 'error',
				error: `Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
			return;
		}

		// Create agent with default config
		const agent = new JobApplicationAgent(profile);

		// Stream the application process
		try {
			yield* agent.streamApplication(url);
		} catch (error) {
			yield {
				type: 'error',
				error: error instanceof Error ? error : new Error('Application failed'),
			};
		}
	},
};

export default applyCommand;