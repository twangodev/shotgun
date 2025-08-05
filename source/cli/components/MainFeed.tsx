import React from 'react';
import {Box} from 'ink';
import {MainFeedItem} from '../../core/feed/types';
import {CommandDisplay} from './CommandDisplay';

interface MainFeedProps {
	feedItems: MainFeedItem[];
}

export function MainFeed({feedItems}: MainFeedProps) {
	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			{feedItems.map(item => (
				<Box key={item.id} marginBottom={1}>
					<CommandDisplay item={item} />
				</Box>
			))}
		</Box>
	);
}