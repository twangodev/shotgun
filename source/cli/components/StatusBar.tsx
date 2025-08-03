import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {VERSION} from '../../core/version.js';
import {ApplicationSession} from '../../core/session/ApplicationSession.js';
import {StatusIndicator} from './StatusIndicator.js';

interface StatusBarProps {
	status: string;
	isProcessing: boolean;
	browserSessions: number;
	activeSession?: ApplicationSession | null;
}

export function StatusBar({
	status,
	isProcessing,
	browserSessions,
	activeSession,
}: StatusBarProps) {
	const [dotVisible, setDotVisible] = useState(true);

	// Blink the dot when there are active sessions
	useEffect(() => {
		if (browserSessions > 0) {
			const interval = setInterval(() => {
				setDotVisible(v => !v);
			}, 500); // Blink every 500ms

			return () => clearInterval(interval);
		} else {
			setDotVisible(false);
			return undefined;
		}
	}, [browserSessions]);

	return (
		<Box
			borderStyle="single"
			borderTop={false}
			borderBottom={false}
			borderLeft={false}
			borderRight={false}
			paddingX={1}
			justifyContent="space-between"
		>
			<Box>
				{isProcessing && (
					<Text color="yellow">
						<Spinner type="dots" />{' '}
					</Text>
				)}
				<Text color={isProcessing ? 'yellow' : 'green'}>{status}</Text>
				{activeSession ? (
					<>
						<Text color="gray"> | </Text>
						<Text color="cyan">Session: </Text>
						<Text>{activeSession.url.slice(0, 40)}{activeSession.url.length > 40 ? '...' : ''}</Text>
						<Text color="gray"> ({activeSession.id.slice(0, 8)}) </Text>
						<StatusIndicator status={activeSession.metadata.status} />
					</>
				) : (
					browserSessions > 0 && (
						<>
							<Text color="gray"> | </Text>
							<Text color="green">{dotVisible ? '○' : ' '}</Text>
							<Text color="gray">
								{' '}
								{browserSessions} active{' '}
								{browserSessions === 1 ? 'session' : 'sessions'}
							</Text>
						</>
					)
				)}
			</Box>
			<Text color="gray">shotgun.jobs v{VERSION}</Text>
		</Box>
	);
}
