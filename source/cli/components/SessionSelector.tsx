import React from 'react';
import {Box, Text, useInput} from 'ink';
import SelectInput from 'ink-select-input';
import {format} from 'timeago.js';
import {SessionInfo} from '../../core/session/types';

interface SessionSelectorProps {
	sessions: SessionInfo[];
	onSelect: (sessionId: string) => void;
	onCancel: () => void;
}

export function SessionSelector({sessions, onSelect, onCancel}: SessionSelectorProps) {
	// Handle ESC key for cancel
	useInput((_, key) => {
		if (key.escape) {
			onCancel();
		}
	});
	
	if (sessions.length === 0) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text bold color="yellow">No Active Sessions</Text>
				<Text color="gray">Start a session by entering a URL or using /apply</Text>
				<Box marginTop={1}>
					<Text color="gray">Press ESC to go back</Text>
				</Box>
			</Box>
		);
	}
	
	const items = sessions.map(session => ({
		label: formatSessionLabel(session),
		value: session.id,
	}));
	
	const handleSelect = (item: {label: string; value: string}) => {
		onSelect(item.value);
	};
	
	return (
		<Box flexDirection="column" height="100%">
			<Box borderStyle="double" borderColor="cyan" paddingX={1} marginBottom={1}>
				<Text bold>Select a Session</Text>
			</Box>
			<Box flexGrow={1} paddingX={2}>
				<SelectInput items={items} onSelect={handleSelect} />
			</Box>
			<Box paddingX={2} paddingY={1} borderStyle="single" borderColor="gray">
				<Text color="gray">↑↓ Navigate • Enter: Select • ESC: Cancel</Text>
			</Box>
		</Box>
	);
}

function formatSessionLabel(session: SessionInfo): string {
	const idShort = session.id.slice(0, 8);
	const timeSince = format(session.createdAt);
	
	// Extract domain from URL
	let domain: string;
	try {
		const url = new URL(session.url);
		domain = url.hostname;
	} catch {
		// Fallback if URL parsing fails
		domain = session.url;
	}
	
	// Format status badge
	const statusBadge = `[${session.status.toUpperCase()}]`.padEnd(20);
	
	// Build the label parts
	const parts = [
		statusBadge,
		domain,
		`(${idShort})`,
	];
	
	// Add step if present
	if (session.currentStep) {
		parts.push('-', session.currentStep);
	}
	
	// Add time
	parts.push('-', timeSince);
	
	return parts.join(' ');
}

