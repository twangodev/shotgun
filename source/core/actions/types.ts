export type ActionType =
	| 'open_browser'
	| 'execute_command'
	| 'ai_intent'
	| 'show_message'
	| 'clear_messages';

export interface Action<T = any> {
	type: ActionType;
	payload: T;
}

// Specific action payloads
export interface OpenBrowserPayload {
	url: string;
}

export interface ExecuteCommandPayload {
	command: string;
	args: string[];
}

export interface ShowMessagePayload {
	message: string;
	type?: 'info' | 'error' | 'success';
}

export interface AiIntentPayload {
	input: string;
	detectedUrl?: string;
}
