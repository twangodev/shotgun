import {InputHandler} from './types.js';

export class HandlerRegistry {
	private static handlers: InputHandler[] = [];

	static register(handler: InputHandler): void {
		this.handlers.push(handler);
		// Sort by priority (higher priority first)
		this.handlers.sort((a, b) => b.priority - a.priority);
	}

	static unregister(handlerName: string): void {
		this.handlers = this.handlers.filter(h => h.name !== handlerName);
	}

	static getHandlers(): InputHandler[] {
		return [...this.handlers];
	}

	static clear(): void {
		this.handlers = [];
	}
}
