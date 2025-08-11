import React from 'react';
import {Box, Text} from 'ink';
import {EventItem} from '../../core/feed/types';

interface EventDisplayProps {
	item: EventItem;
}

export function EventDisplay({item}: EventDisplayProps) {
	// Different colors for different event types
	const getEventColor = (eventType: string) => {
		switch (eventType) {
			case 'progress':
				return 'yellow';
			case 'success':
				return 'green';
			case 'error':
				return 'red';
			case 'info':
			default:
				return 'gray';
		}
	};

	return (
		<Box marginLeft={2}>
			<Text color={getEventColor(item.eventType)}>
				{'  '}• {item.message}
			</Text>
		</Box>
	);
}