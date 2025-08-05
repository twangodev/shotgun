import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {VERSION} from '../../core/version';

interface StatusBarProps {
	status: string;
	isProcessing: boolean;
}

export function StatusBar({
	status,
	isProcessing,
}: StatusBarProps) {
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
			</Box>
			<Text color="gray">v{VERSION}</Text>
		</Box>
	);
}
