import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {CommandItem} from '../../core/feed/types';

interface CommandDisplayProps {
	item: CommandItem;
}

export function CommandDisplay({item}: CommandDisplayProps) {
	const hasResult = item.result || item.error;
	
	return (
		<Box flexDirection="column">
			{/* Command Input */}
			<Box>
				<Text color="cyan">→ </Text>
				<Text>{item.input}</Text>
				{item.isExecuting && (
					<Text color="yellow">
						{' '}<Spinner type="dots" />
					</Text>
				)}
			</Box>
			
			{/* Command Result */}
			{hasResult && (
				<Box marginLeft={2}>
					<Text color={item.error ? 'red' : 'white'}>
						{item.error || item.result}
					</Text>
				</Box>
			)}
		</Box>
	);
}