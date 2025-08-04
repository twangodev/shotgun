import {EventEmitter} from 'events';
import {Page, BrowserContext} from 'playwright';
import {AgentSession, SessionStatus, Message} from './types';
import {SessionMessage} from '../feed/types';

export class ApplicationSession extends EventEmitter implements AgentSession {
	id: string;
	url: string;
	page: Page;
	context?: BrowserContext;
	metadata: {
		createdAt: Date;
		lastActivity: Date;
		status: SessionStatus;
		currentStep?: string;
		error?: string;
	};
	
	agentId?: string;
	conversationHistory: Message[] = [];
	sessionMessages: SessionMessage[] = [];
	private messageCounter = 0;
	
	constructor(params: {
		id: string;
		url: string;
		page: Page;
		context?: BrowserContext;
	}) {
		super();
		this.id = params.id;
		this.url = params.url;
		this.page = params.page;
		this.context = params.context;
		this.metadata = {
			createdAt: new Date(),
			lastActivity: new Date(),
			status: 'active',
		};
	}
	
	async pause(): Promise<void> {
		this.metadata.status = 'paused';
		this.updateActivity();
		this.emit('paused', this.id);
	}
	
	async resume(): Promise<void> {
		this.metadata.status = 'active';
		this.updateActivity();
		this.emit('resumed', this.id);
	}
	
	async close(): Promise<void> {
		this.metadata.status = 'completed';
		if (this.context) {
			await this.context.close();
		}
		this.emit('closed', this.id);
	}
	
	async sendMessage(message: string): Promise<void> {
		const msg: Message = {
			id: this.generateMessageId(),
			type: 'user',
			content: message,
			timestamp: new Date(),
		};
		this.conversationHistory.push(msg);
		this.updateActivity();
		this.emit('message', msg);
	}
	
	async waitForUserInput(prompt: string): Promise<string> {
		const message: SessionMessage = {
			id: this.generateMessageId(),
			type: 'question',
			content: prompt,
			timestamp: new Date(),
		};
		this.sessionMessages.push(message);
		this.metadata.status = 'waiting_for_user';
		this.updateActivity();
		this.emit('waiting_for_input', prompt);
		this.emit('messageAdded', message);
		
		// Return a promise that will be resolved when user sends a message
		return new Promise((resolve) => {
			const handler = (message: Message) => {
				if (message.type === 'user') {
					this.off('message', handler);
					this.metadata.status = 'active';
					resolve(message.content);
				}
			};
			this.on('message', handler);
		});
	}
	
	getRecentMessages(count: number = 5): SessionMessage[] {
		return this.sessionMessages.slice(-count);
	}
	
	private updateActivity() {
		this.metadata.lastActivity = new Date();
	}
	
	private generateMessageId(): string {
		return `${Date.now()}_${this.messageCounter++}`;
	}
	
	// Emit events for agent actions
	emitThought(thought: string) {
		const message: SessionMessage = {
			id: this.generateMessageId(),
			type: 'thought',
			content: thought,
			timestamp: new Date(),
		};
		this.sessionMessages.push(message);
		this.emit('thought', thought);
		this.emit('messageAdded', message);
		this.updateActivity();
	}
	
	emitAction(action: string) {
		const message: SessionMessage = {
			id: this.generateMessageId(),
			type: 'action',
			content: action,
			timestamp: new Date(),
		};
		this.sessionMessages.push(message);
		this.emit('action', action);
		this.emit('messageAdded', message);
		this.updateActivity();
	}
	
	emitError(error: string) {
		const message: SessionMessage = {
			id: this.generateMessageId(),
			type: 'error',
			content: error,
			timestamp: new Date(),
		};
		this.sessionMessages.push(message);
		this.metadata.error = error;
		this.metadata.status = 'error';
		this.emit('error', error);
		this.emit('messageAdded', message);
		this.updateActivity();
	}
}