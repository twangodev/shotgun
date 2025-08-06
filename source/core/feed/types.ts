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

export type MainFeedItem = CommandItem;
