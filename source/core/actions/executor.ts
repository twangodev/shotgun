import {CommandResult} from '../commands/commandTypes';
import {SessionManager} from '../../services/SessionManager';
import {
	Action,
	OpenBrowserPayload,
	ExecuteCommandPayload,
	ShowMessagePayload,
	AiIntentPayload,
} from './types';

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
		const sessionManager = SessionManager.getInstance();

		try {
			const session = await sessionManager.createSession(payload.url);

			return {
				success: true,
				message: `Created session ${session.id.slice(0, 8)} for ${payload.url}. Agent starting...`,
				data: {
					action: 'session_created',
					sessionId: session.id,
					sessionCount: sessionManager.getActiveSessionCount(),
				},
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
			message: `AI intent parsing coming soon!\nFor now, please enter just the URL to open it directly.`,
		};
	}
}
