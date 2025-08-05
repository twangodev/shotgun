import {CommandResult} from '../commands/commandTypes';
import {
	Action,
	ExecuteCommandPayload,
	ShowMessagePayload,
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
			case 'execute_command':
				return this.executeCommand(action.payload as ExecuteCommandPayload);

			case 'show_message':
				return this.showMessage(action.payload as ShowMessagePayload);

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

	private async executeCommand(
		payload: ExecuteCommandPayload,
	): Promise<CommandResult> {
		// Placeholder for command execution
		return {
			success: true,
			message: `Executed command: ${payload.command}`,
		};
	}

	private showMessage(payload: ShowMessagePayload): CommandResult {
		return {
			success: payload.type !== 'error',
			message: payload.message,
		};
	}
}
