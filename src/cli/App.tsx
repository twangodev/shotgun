import React, {useState} from 'react';
import {Box, useApp} from 'ink';
import {CommandInput} from './components/CommandInput';
import {MainFeed} from './components/MainFeed';
import {StatusBar} from './components/StatusBar';
import {Logo} from './components/Logo';
import {parseAndExecuteCommand} from './commands/registry';
import {MainFeedItem, CommandItem} from '../core/feed/types';

export interface AppState {
	status: string;
	isProcessing: boolean;
}

export function App() {
	const {exit} = useApp();
	const [feedItems, setFeedItems] = useState<MainFeedItem[]>([]);
	const [executingCommands, setExecutingCommands] = useState<Set<string>>(
		new Set(),
	);
	const idCounterRef = React.useRef(0);

	const handleCommand = async (input: string) => {
		// Create command item
		const commandId = `${Date.now()}_${idCounterRef.current++}`;
		const commandItem: CommandItem = {
			id: commandId,
			type: 'command',
			input,
			timestamp: new Date(),
			isExecuting: true,
		};
		setFeedItems(prev => [...prev, commandItem]);
		setExecutingCommands(prev => new Set(prev).add(commandId));

		// Process command asynchronously
		processCommand(commandItem);
	};

	const processCommand = async (commandItem: CommandItem) => {
		try {
			const result = await parseAndExecuteCommand(commandItem.input);

			// Handle special commands
			if (result.message === 'CLEAR_MESSAGES') {
				setFeedItems([]);
			} else if (result.message === 'EXIT_APPLICATION') {
				exit();
			} else {
				// Normal command result
				setFeedItems(prev =>
					prev.map(item =>
						item.id === commandItem.id
							? {
									...item,
									result: result.success ? result.message : undefined,
									error: result.success ? undefined : result.message,
									isExecuting: false,
								}
							: item,
					),
				);
			}
		} catch (error) {
			setFeedItems(prev =>
				prev.map(item =>
					item.id === commandItem.id
						? {
								...item,
								error: error instanceof Error ? error.message : 'Unknown error',
								isExecuting: false,
							}
						: item,
				),
			);
		} finally {
			setExecutingCommands(prev => {
				const newSet = new Set(prev);
				newSet.delete(commandItem.id);
				return newSet;
			});
		}
	};

	// Single unified UI
	return (
		<Box flexDirection="column" height="100%">
			<Logo />
			<Box flexGrow={1} flexDirection="column">
				<MainFeed feedItems={feedItems} />
			</Box>
			<StatusBar
				status={
					executingCommands.size > 0
						? `${executingCommands.size} command(s) executing...`
						: 'Ready'
				}
				isProcessing={executingCommands.size > 0}
			/>
			<CommandInput onSubmit={handleCommand} isProcessing={false} />
		</Box>
	);
}
