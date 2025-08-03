import React from 'react';
import {Box, Text} from 'ink';
import {Message} from '../../core/types/message.js';

interface MessageListProps {
	messages: Message[];
}

export function MessageList({messages}: MessageListProps) {
	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			{messages.map(message => (
				<Box key={message.id} marginBottom={1}>
					<MessageItem message={message} />
				</Box>
			))}
		</Box>
	);
}

function MessageItem({message}: {message: Message}) {
	const getColor = () => {
		switch (message.type) {
			case 'user':
				return 'cyan';
			case 'error':
				return 'red';
			case 'thought':
				return 'gray';
			case 'action':
				return 'cyan';
			case 'question':
				return 'yellow';
			case 'system':
			default:
				return 'white';
		}
	};

	const getPrefix = () => {
		switch (message.type) {
			case 'user':
				return '→ ';
			case 'error':
				return '● ';
			case 'thought':
			case 'action':
			case 'question':
			case 'system':
			default:
				return '  ';
		}
	};

	return (
		<Box>
			<Text color={getColor()}>
				{getPrefix()}
				{message.content}
			</Text>
		</Box>
	);
}
