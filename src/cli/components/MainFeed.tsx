import React from 'react';
import {Box} from 'ink';
import {MainFeedItem} from '../../core/feed/types';
import {CommandDisplay} from './CommandDisplay';
import {EventDisplay} from './EventDisplay';

interface MainFeedProps {
	feedItems: MainFeedItem[];
}

export function MainFeed({feedItems}: MainFeedProps) {
	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			{feedItems.map(item => (
				<Box key={item.id} marginBottom={item.type === 'event' ? 0 : 1}>
					{item.type === 'command' ? (
						<CommandDisplay item={item} />
					) : (
						<EventDisplay item={item} />
					)}
				</Box>
			))}
		</Box>
	);
}