// Feed item types for the main chronological display

export interface FeedItem {
	id: string;
	timestamp: Date;
}

export interface CommandItem extends FeedItem {
	type: 'command';
	input: string;
	result?: string;
	error?: string;
	isExecuting?: boolean;
}

export interface SessionItem extends FeedItem {
	type: 'session';
	sessionId: string;
	url: string;
}

export type MainFeedItem = CommandItem | SessionItem;

// Session-specific message types
export interface SessionMessage {
	id: string;
	type: 'thought' | 'action' | 'error' | 'question' | 'info';
	content: string;
	timestamp: Date;
}

export type SessionStatus = 'active' | 'paused' | 'waiting_for_user' | 'completed' | 'error';

export interface SessionState {
	id: string;
	url: string;
	status: SessionStatus;
	messages: SessionMessage[];
	createdAt: Date;
	lastActivity: Date;
	currentStep?: string;
}