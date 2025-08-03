import React from 'react';
import {Box} from 'ink';
import {MainFeedItem} from '../../core/feed/types.js';
import {CommandDisplay} from './CommandDisplay.js';
import {SessionCard} from './SessionCard.js';
import {ApplicationSession} from '../../core/session/ApplicationSession.js';

interface MainFeedProps {
	feedItems: MainFeedItem[];
	sessions: Map<string, ApplicationSession>;
}

export function MainFeed({feedItems, sessions}: MainFeedProps) {
	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			{feedItems.map(item => (
				<Box key={item.id} marginBottom={1}>
					{item.type === 'command' ? (
						<CommandDisplay item={item} />
					) : (
						sessions.has(item.sessionId) && (
							<SessionCard session={sessions.get(item.sessionId)!} />
						)
					)}
				</Box>
			))}
		</Box>
	);
}