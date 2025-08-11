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

export interface EventItem extends FeedItem {
	type: 'event';
	eventType: string;
	message: string;
	parentCommandId?: string;
	metadata?: any;
}

export type MainFeedItem = CommandItem | EventItem;
