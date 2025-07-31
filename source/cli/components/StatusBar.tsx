import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {VERSION} from '../../core/version.js';

interface StatusBarProps {
	status: string;
	isProcessing: boolean;
	browserSessions: number;
}

export function StatusBar({
	status,
	isProcessing,
	browserSessions,
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
				{browserSessions > 0 && (
					<>
						<Text color="gray"> | </Text>
						<Text color="green">{dotVisible ? '○' : ' '}</Text>
						<Text color="gray">
							{' '}
							{browserSessions} active{' '}
							{browserSessions === 1 ? 'session' : 'sessions'}
						</Text>
					</>
				)}
			</Box>
			<Text color="gray">shotgun.jobs v{VERSION}</Text>
		</Box>
	);
}
