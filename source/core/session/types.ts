import {Page, BrowserContext} from 'playwright';
import {EventEmitter} from 'events';

export type SessionStatus = 'active' | 'paused' | 'waiting_for_user' | 'completed' | 'error';

export interface SessionMetadata {
	createdAt: Date;
	lastActivity: Date;
	status: SessionStatus;
	currentStep?: string;
	error?: string;
}

export interface BrowserSession {
	id: string;
	url: string;
	page: Page;
	context?: BrowserContext;
	metadata: SessionMetadata;
	
	// Methods for session lifecycle
	pause?(): Promise<void>;
	resume?(): Promise<void>;
	close?(): Promise<void>;
}

// For future agent integration
export interface AgentSession extends BrowserSession, EventEmitter {
	agentId?: string;
	conversationHistory?: Message[];
	
	// For agent communication
	sendMessage?(message: string): Promise<void>;
	waitForUserInput?(prompt: string): Promise<string>;
}

export interface Message {
	id: string;
	type: 'user' | 'agent' | 'system';
	content: string;
	timestamp: Date;
}

export interface SessionInfo {
	id: string;
	url: string;
	status: SessionStatus;
	currentStep?: string;
	createdAt: Date;
	lastActivity: Date;
}