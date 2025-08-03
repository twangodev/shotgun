import React, {useState, useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import {CommandInput} from './components/CommandInput.js';
import {MainFeed} from './components/MainFeed.js';
import {StatusBar} from './components/StatusBar.js';
import {Logo} from './components/Logo.js';
import {SessionSelector} from './components/SessionSelector.js';
import {ApplicationSession} from '../core/session/ApplicationSession.js';
import {parseAndExecuteCommand} from '../core/commands/commandParser.js';
import {BrowserManager} from '../core/browser/browserManager.js';
import {SessionManager} from '../services/SessionManager.js';
import {MainFeedItem, CommandItem, SessionItem} from '../core/feed/types.js';

export interface AppState {
	status: string;
	isProcessing: boolean;
}


export function App() {
	const {exit} = useApp();
	const [feedItems, setFeedItems] = useState<MainFeedItem[]>([]);
	const [sessions, setSessions] = useState<Map<string, ApplicationSession>>(new Map());
	const [browserSessions, setBrowserSessions] = useState(0);
	const [activeSession, setActiveSession] = useState<ApplicationSession | null>(null);
	const [executingCommands, setExecutingCommands] = useState<Set<string>>(new Set());
	const [showingSessionSelector, setShowingSessionSelector] = useState(false);
	const [, forceUpdate] = useState({});
	const idCounterRef = React.useRef(0);

	// Set up browser session tracking
	useEffect(() => {
		const browserManager = BrowserManager.getInstance();
		browserManager.setOnSessionChange(count => {
			setBrowserSessions(count);
		});
		
		// Load existing sessions
		const sessionManager = SessionManager.getInstance();
		setSessions(sessionManager.getAllSessions());
	}, []);
	
	// Listen for session updates when attached
	useEffect(() => {
		if (!activeSession) return;
		
		// Force re-render when session gets new messages
		const handleMessageAdded = () => {
			forceUpdate({});
		};
		
		activeSession.on('messageAdded', handleMessageAdded);
		
		return () => {
			activeSession.off('messageAdded', handleMessageAdded);
		};
	}, [activeSession]);

	const handleCommand = async (input: string) => {
		// Check for exit commands
		if (
			input.trim().toLowerCase() === '/exit' ||
			input.trim().toLowerCase() === '/quit'
		) {
			exit();
			return;
		}

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
	
	const detachFromSession = () => {
		setActiveSession(null);
	};
	
	const handleSessionSelect = (sessionId: string) => {
		const sessionManager = SessionManager.getInstance();
		const session = sessionManager.getSession(sessionId);
		if (session) {
			setActiveSession(session);
		}
		setShowingSessionSelector(false);
	};
	
	const handleSessionSelectorCancel = () => {
		setShowingSessionSelector(false);
	};
	
	const processCommand = async (commandItem: CommandItem) => {
		try {
			const result = await parseAndExecuteCommand(commandItem.input);
			
			// Handle special commands
			if (result.data?.action === 'session_created') {
				// Create session item
				const sessionItem: SessionItem = {
					id: `${Date.now()}_${idCounterRef.current++}`,
					type: 'session',
					sessionId: result.data.sessionId,
					url: commandItem.input, // The URL that was entered
					timestamp: new Date(),
				};
				
				// Update sessions map
				const sessionManager = SessionManager.getInstance();
				const session = sessionManager.getSession(result.data.sessionId);
				if (session) {
					setSessions(prev => new Map(prev).set(session.id, session));
				}
				
				// Update command to show it created a session
				setFeedItems(prev => prev.map(item => 
					item.id === commandItem.id
						? {...item, result: `Session ${result.data.sessionId.slice(0, 8)} created`, isExecuting: false}
						: item
				));
				
				// Add session to feed
				setFeedItems(prev => [...prev, sessionItem]);
				setBrowserSessions(result.data.sessionCount);
			} else if (result.data?.action === 'show_session_selector') {
				setShowingSessionSelector(true);
				setFeedItems(prev => prev.map(item => 
					item.id === commandItem.id
						? {...item, result: result.message, isExecuting: false}
						: item
				));
			} else if (result.data?.action === 'detach_session') {
				detachFromSession();
				setFeedItems(prev => prev.map(item => 
					item.id === commandItem.id
						? {...item, result: result.message, isExecuting: false}
						: item
				));
			} else if (result.message === 'CLEAR_MESSAGES') {
				setFeedItems([]);
			} else {
				// Normal command result
				setFeedItems(prev => prev.map(item => 
					item.id === commandItem.id
						? {
							...item,
							result: result.success ? result.message : undefined,
							error: result.success ? undefined : result.message,
							isExecuting: false
						}
						: item
				));
			}
		} catch (error) {
			setFeedItems(prev => prev.map(item => 
				item.id === commandItem.id
					? {...item, error: error instanceof Error ? error.message : 'Unknown error', isExecuting: false}
					: item
			));
		} finally {
			setExecutingCommands(prev => {
				const newSet = new Set(prev);
				newSet.delete(commandItem.id);
				return newSet;
			});
		}
	};

	// Prepare feed items based on attachment state
	const displayFeedItems = React.useMemo(() => {
		if (activeSession) {
			// Convert session messages to feed items for display
			return activeSession.sessionMessages.map(msg => {
				// Format message with type prefix
				let formattedContent = msg.content;
				if (msg.type === 'thought') {
					formattedContent = `[THINKING] ${msg.content}`;
				} else if (msg.type === 'action') {
					formattedContent = `[ACTION] ${msg.content}`;
				} else if (msg.type === 'error') {
					formattedContent = `[ERROR] ${msg.content}`;
				} else if (msg.type === 'question') {
					formattedContent = `[QUESTION] ${msg.content}`;
				}
				
				return {
					id: msg.id,
					type: 'command' as const,
					input: formattedContent,
					timestamp: msg.timestamp,
					isExecuting: false,
				} as CommandItem;
			});
		} else {
			return feedItems;
		}
	}, [activeSession, feedItems, activeSession?.sessionMessages]);
	
	// Show session selector if active
	if (showingSessionSelector) {
		const sessionManager = SessionManager.getInstance();
		const sessionList = sessionManager.listSessions();
		return (
			<SessionSelector
				sessions={sessionList}
				onSelect={handleSessionSelect}
				onCancel={handleSessionSelectorCancel}
			/>
		);
	}
	
	// Single unified UI
	return (
		<Box flexDirection="column" height="100%">
			<Logo />
			{activeSession && (
				<Box borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
					<Text bold>Attached to Session: </Text>
					<Text>{activeSession.url}</Text>
					<Text color="gray"> ({activeSession.id.slice(0, 8)})</Text>
				</Box>
			)}
			<Box flexGrow={1} flexDirection="column">
				<MainFeed 
					feedItems={displayFeedItems} 
					sessions={activeSession ? new Map() : sessions} 
				/>
			</Box>
			<StatusBar
				status={executingCommands.size > 0 ? `${executingCommands.size} command(s) executing...` : 'Ready'}
				isProcessing={executingCommands.size > 0}
				browserSessions={browserSessions}
				activeSession={activeSession}
			/>
			<CommandInput onSubmit={handleCommand} isProcessing={false} />
		</Box>
	);
}
