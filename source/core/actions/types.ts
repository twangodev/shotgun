export type ActionType = 'execute_command' | 'show_message' | 'clear_messages';

export interface Action<T = any> {
	type: ActionType;
	payload: T;
}

// Specific action payloads
export interface ExecuteCommandPayload {
	command: string;
	args: string[];
}

export interface ShowMessagePayload {
	message: string;
	type?: 'info' | 'error' | 'success';
}
