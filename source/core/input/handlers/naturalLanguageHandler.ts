import {InputHandler, InputContext, HandlerResult} from '../types';
import {helpCommand} from '../../commands/help';
import {profileCommand} from '../../commands/profile';
import {ActionExecutor} from '../../actions/executor';

interface Pattern {
	match: (input: string) => boolean;
	action: (context: InputContext) => Promise<HandlerResult>;
}

export class NaturalLanguageHandler implements InputHandler {
	name = 'NaturalLanguageHandler';
	priority = 10; // Lower priority - runs after specific handlers

	private patterns: Pattern[] = [
		{
			match: (input: string) => {
				const lower = input.toLowerCase();
				return lower.includes('help') || lower.includes('what can you do');
			},
			action: async () => {
				const result = await helpCommand.execute([]);
				return {handled: true, result};
			},
		},
		{
			match: (input: string) => input.toLowerCase().includes('profile'),
			action: async () => {
				const result = await profileCommand.execute([]);
				return {handled: true, result};
			},
		},
		{
			match: (input: string) => input.toLowerCase().includes('apply'),
			action: async () => ({
				handled: true,
				result: {
					success: false,
					message:
						'Please provide a job URL. You can paste it directly or say "apply to [URL]"',
				},
			}),
		},
	];

	canHandle(_context: InputContext): boolean {
		// Natural language handler can potentially handle anything
		// but only if other handlers haven't claimed it
		return true;
	}

	async handle(context: InputContext): Promise<HandlerResult> {
		// Check patterns
		for (const pattern of this.patterns) {
			if (pattern.match(context.trimmed)) {
				return await pattern.action(context);
			}
		}

		// Default fallback
		const executor = ActionExecutor.getInstance();
		const result = await executor.execute({
			type: 'show_message',
			payload: {
				message: `I understand: "${context.trimmed}". For now, please use slash commands like /help, /profile, or paste a job URL directly.`,
				type: 'info',
			},
		});

		return {
			handled: true,
			result,
		};
	}

	// Method to add custom patterns (for future extensibility)
	addPattern(pattern: Pattern): void {
		this.patterns.push(pattern);
	}
}
