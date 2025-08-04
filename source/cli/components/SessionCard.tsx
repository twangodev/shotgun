import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {ApplicationSession} from '../../core/session/ApplicationSession';
import {SessionMessage} from '../../core/feed/types';
import {StatusIndicator} from './StatusIndicator';

interface SessionCardProps {
	session: ApplicationSession;
}

export function SessionCard({session}: SessionCardProps) {
	const [recentMessages, setRecentMessages] = useState<SessionMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		// Initial load of recent messages
		setRecentMessages(session.getRecentMessages());
		setIsLoading(session.metadata.status === 'active');

		// Listen for new messages
		const handleMessageAdded = () => {
			setRecentMessages(session.getRecentMessages());
		};

		const handleStatusChange = () => {
			setIsLoading(session.metadata.status === 'active');
		};

		session.on('messageAdded', handleMessageAdded);
		session.on('paused', handleStatusChange);
		session.on('resumed', handleStatusChange);
		session.on('closed', handleStatusChange);
		session.on('error', handleStatusChange);

		return () => {
			session.off('messageAdded', handleMessageAdded);
			session.off('paused', handleStatusChange);
			session.off('resumed', handleStatusChange);
			session.off('closed', handleStatusChange);
			session.off('error', handleStatusChange);
		};
	}, [session]);

	const shortId = session.id.slice(0, 8);

	return (
		<Box flexDirection="column" marginLeft={2}>
			{/* Session Header */}
			<Box>
				{isLoading ? (
					<Text color="yellow">
						<Spinner type="dots" /> 
					</Text>
				) : (
					<StatusIndicator status={session.metadata.status} />
				)}
				<Text> </Text>
				<Text bold>Session {shortId}</Text>
				<Text color="gray"> - </Text>
				<Text>{session.url}</Text>
				<Text color="gray"> [{session.metadata.status}]</Text>
			</Box>

			{/* Recent Messages */}
			{recentMessages.length > 0 && (
				<Box flexDirection="column" marginLeft={2}>
					{recentMessages.map(msg => (
						<Box key={msg.id}>
							<Text color="gray">│ </Text>
							<Text color={getMessageColor(msg.type)}>
								{msg.content}
							</Text>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}

function getMessageColor(type: SessionMessage['type']): string {
	switch (type) {
		case 'thought':
			return 'gray';
		case 'action':
			return 'cyan';
		case 'error':
			return 'red';
		case 'question':
			return 'yellow';
		case 'info':
		default:
			return 'white';
	}
}