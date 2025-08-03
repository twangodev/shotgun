// Legacy message types - to be removed after full refactor
export interface Message {
	id: string;
	type: 'user' | 'system' | 'error' | 'thought' | 'action' | 'question';
	content: string;
	timestamp: Date;
}