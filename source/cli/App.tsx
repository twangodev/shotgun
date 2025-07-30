import React, {useState} from 'react';
import {Box, useApp} from 'ink';
import {CommandInput} from './components/CommandInput.js';
import {MessageList} from './components/MessageList.js';
import {StatusBar} from './components/StatusBar.js';
import {Logo} from './components/Logo.js';
import {parseAndExecuteCommand} from '../core/commands/commandParser.js';

export interface Message {
	id: string;
	type: 'user' | 'system' | 'error';
	content: string;
	timestamp: Date;
}

export interface AppState {
	messages: Message[];
	status: string;
	isProcessing: boolean;
}

export function App() {
	const {exit} = useApp();
	const [showLogo, setShowLogo] = useState(true);
	const [messages, setMessages] = useState<Message[]>([]);
	const [status, setStatus] = useState('Ready');
	const [isProcessing, setIsProcessing] = useState(false);

	const handleCommand = async (input: string) => {
		// Hide logo on first command
		if (showLogo) {
			setShowLogo(false);
		}
		
		// Check for exit commands
		if (input.trim().toLowerCase() === '/exit' || input.trim().toLowerCase() === '/quit') {
			exit();
			return;
		}

		// Add user message
		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: input,
			timestamp: new Date(),
		};
		setMessages(prev => [...prev, userMessage]);

		// Process command
		setIsProcessing(true);
		setStatus('Processing command...');

		try {
			const result = await parseAndExecuteCommand(input);
			
			const responseMessage: Message = {
				id: (Date.now() + 1).toString(),
				type: result.success ? 'system' : 'error',
				content: result.message,
				timestamp: new Date(),
			};
			setMessages(prev => [...prev, responseMessage]);
		} catch (error) {
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				type: 'error',
				content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date(),
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsProcessing(false);
			setStatus('Ready');
		}
	};

	return (
		<Box flexDirection="column" height="100%">
			<Box flexGrow={1} flexDirection="column">
				{showLogo ? <Logo /> : <MessageList messages={messages} />}
			</Box>
			<StatusBar status={status} isProcessing={isProcessing} />
			<CommandInput onSubmit={handleCommand} isProcessing={isProcessing} />
		</Box>
	);
}