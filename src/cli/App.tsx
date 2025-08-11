import React, {useState} from 'react';
import {Box, useApp} from 'ink';
import {CommandInput} from './components/CommandInput';
import {MainFeed} from './components/MainFeed';
import {StatusBar} from './components/StatusBar';
import {Logo} from './components/Logo';
import {parseAndExecuteCommand} from './commands/registry';
import {MainFeedItem, CommandItem, EventItem} from '../core/feed/types';
import {CommandEvent} from '../core/events';

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
			const eventStream = parseAndExecuteCommand(commandItem.input);
			let hasContent = false;
			let resultMessages: string[] = [];
			
			// Consume the event stream
			for await (const event of eventStream) {
				// Handle special events
				if (event.type === 'clear') {
					setFeedItems([]);
					hasContent = true;
				} else if (event.type === 'exit') {
					exit();
				} else if (event.type === 'message') {
					// Collect messages
					resultMessages.push(event.content);
					hasContent = true;
				} else if (event.type === 'error') {
					// Handle errors
					const errorMessage = typeof event.error === 'string' 
						? event.error 
						: event.error instanceof Error 
							? event.error.message 
							: 'Unknown error';
					
					setFeedItems(prev =>
						prev.map(item =>
							item.id === commandItem.id
								? {
										...item,
										error: errorMessage,
										isExecuting: false,
									}
								: item,
						),
					);
					hasContent = true;
				} else if (event.type === 'progress') {
					// Add progress events as separate feed items
					const eventItem: EventItem = {
						id: `${commandItem.id}_event_${idCounterRef.current++}`,
						type: 'event',
						timestamp: new Date(),
						eventType: 'progress',
						message: event.message,
						parentCommandId: commandItem.id,
					};
					setFeedItems(prev => [...prev, eventItem]);
					hasContent = true;
				} else if (event.type === 'completed') {
					// Mark command as completed
					if (event.data) {
						resultMessages.push(`Completed: ${JSON.stringify(event.data)}`);
					}
					hasContent = true;
				}
			}
			
			// Update command item with accumulated results
			if (hasContent && resultMessages.length > 0) {
				setFeedItems(prev =>
					prev.map(item =>
						item.id === commandItem.id
							? {
									...item,
									result: resultMessages.join('\n'),
									isExecuting: false,
								}
							: item,
					),
				);
			} else if (hasContent) {
				// Just mark as not executing if we handled special events
				setFeedItems(prev =>
					prev.map(item =>
						item.id === commandItem.id
							? {
									...item,
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