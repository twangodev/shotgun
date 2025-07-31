import {CommandResult} from '../commands/commandTypes.js';
import {BrowserManager} from '../browser/browserManager.js';
import {
	Action,
	OpenBrowserPayload,
	ExecuteCommandPayload,
	ShowMessagePayload,
	AiIntentPayload,
} from './types.js';

export class ActionExecutor {
	private static instance: ActionExecutor;

	static getInstance(): ActionExecutor {
		if (!ActionExecutor.instance) {
			ActionExecutor.instance = new ActionExecutor();
		}
		return ActionExecutor.instance;
	}

	async execute(action: Action): Promise<CommandResult> {
		switch (action.type) {
			case 'open_browser':
				return this.openBrowser(action.payload as OpenBrowserPayload);

			case 'execute_command':
				return this.executeCommand(action.payload as ExecuteCommandPayload);

			case 'show_message':
				return this.showMessage(action.payload as ShowMessagePayload);

			case 'ai_intent':
				return this.handleAiIntent(action.payload as AiIntentPayload);

			case 'clear_messages':
				return {
					success: true,
					message: 'CLEAR_MESSAGES',
				};

			default:
				return {
					success: false,
					message: `Unknown action type: ${action.type}`,
				};
		}
	}

	private async openBrowser(
		payload: OpenBrowserPayload,
	): Promise<CommandResult> {
		const browserManager = BrowserManager.getInstance();

		try {
			await browserManager.openUrl(payload.url);

			return {
				success: true,
				message: `Opening ${payload.url} in browser...`,
				data: {
					action: 'browser_opened',
					sessionCount: browserManager.getActiveSessionCount(),
				},
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to open browser: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	private async executeCommand(
		_payload: ExecuteCommandPayload,
	): Promise<CommandResult> {
		// This will be implemented when we refactor command execution
		return {
			success: false,
			message: 'Command execution not yet implemented in new architecture',
		};
	}

	private showMessage(payload: ShowMessagePayload): CommandResult {
		return {
			success: payload.type !== 'error',
			message: payload.message,
		};
	}

	private async handleAiIntent(
		_payload: AiIntentPayload,
	): Promise<CommandResult> {
		return {
			success: true,
			message: `🤖 AI intent parsing coming soon!\nFor now, please enter just the URL to open it directly.`,
		};
	}
}
