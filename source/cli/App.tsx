import React, {useState, useEffect} from 'react';
import {Box, useApp} from 'ink';
import {CommandInput} from './components/CommandInput.js';
import {MessageList} from './components/MessageList.js';
import {StatusBar} from './components/StatusBar.js';
import {Logo} from './components/Logo.js';
import {parseAndExecuteCommand} from '../core/commands/commandParser.js';
import {BrowserManager} from '../core/browser/browserManager.js';

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
	const [messages, setMessages] = useState<Message[]>([]);
	const [status, setStatus] = useState('Ready');
	const [isProcessing, setIsProcessing] = useState(false);
	const [browserSessions, setBrowserSessions] = useState(0);

	// Set up browser session tracking
	useEffect(() => {
		const browserManager = BrowserManager.getInstance();
		browserManager.setOnSessionChange(count => {
			setBrowserSessions(count);
		});
	}, []);

	const handleCommand = async (input: string) => {
		// Check for exit commands
		if (
			input.trim().toLowerCase() === '/exit' ||
			input.trim().toLowerCase() === '/quit'
		) {
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

			// Update browser sessions if applicable
			if (result.data?.action === 'browser_opened') {
				setBrowserSessions(result.data.sessionCount);
			}

			// Check if this is a clear command
			if (result.message === 'CLEAR_MESSAGES') {
				setMessages([]);
			} else {
				const responseMessage: Message = {
					id: (Date.now() + 1).toString(),
					type: result.success ? 'system' : 'error',
					content: result.message,
					timestamp: new Date(),
				};
				setMessages(prev => [...prev, responseMessage]);
			}
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
			<Logo />
			<Box flexGrow={1} flexDirection="column">
				<MessageList messages={messages} />
			</Box>
			<StatusBar
				status={status}
				isProcessing={isProcessing}
				browserSessions={browserSessions}
			/>
			<CommandInput onSubmit={handleCommand} isProcessing={isProcessing} />
		</Box>
	);
}
