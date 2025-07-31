import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {AutoComplete} from './AutoComplete.js';
import {useAutocomplete} from '../hooks/useAutocomplete.js';

interface CommandInputProps {
	onSubmit: (input: string) => void;
	isProcessing: boolean;
}

export function CommandInput({onSubmit, isProcessing}: CommandInputProps) {
	const [input, setInput] = useState('');
	const [history, setHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [showAutocomplete, setShowAutocomplete] = useState(true);

	const {suggestions, showSuggestions} = useAutocomplete({
		history,
		currentInput: input,
	});

	useInput(
		(_, key) => {
			if (isProcessing) return;

			// Tab key accepts autocomplete suggestion
			if (key.tab && showSuggestions && suggestions.length > 0) {
				// This will be handled by the AutoComplete component
				return;
			}

			// Escape hides autocomplete
			if (key.escape) {
				setShowAutocomplete(false);
				return;
			}

			// Handle history navigation only when autocomplete is not shown
			if (!showSuggestions || !showAutocomplete) {
				if (key.upArrow && history.length > 0) {
					const newIndex =
						historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
					setHistoryIndex(newIndex);
					setInput(history[history.length - 1 - newIndex] || '');
				} else if (key.downArrow) {
					const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
					setHistoryIndex(newIndex);
					setInput(
						newIndex === -1 ? '' : history[history.length - 1 - newIndex] || '',
					);
				}
			}
		},
		{isActive: !isProcessing},
	);

	const handleSubmit = (value: string) => {
		// Don't submit if autocomplete is visible and would handle this
		if (showAutocomplete && showSuggestions && suggestions.length > 0) {
			return;
		}

		if (value.trim()) {
			// Add to history
			setHistory(prev => [...prev, value]);
			setHistoryIndex(-1);

			// Submit command
			onSubmit(value);
			setInput('');
			setShowAutocomplete(true);
		}
	};

	const handleAutocompleteSubmit = (item: {value: string}) => {
		// Add to history
		setHistory(prev => [...prev, item.value]);
		setHistoryIndex(-1);

		// Submit command directly
		onSubmit(item.value);
		setInput('');
		setShowAutocomplete(true);
	};

	const handleInputChange = (value: string) => {
		setInput(value);
		setShowAutocomplete(true);
		setHistoryIndex(-1);
	};

	return (
		<Box flexDirection="column">
			<Box borderStyle="round" paddingX={1}>
				<Text color={isProcessing ? 'gray' : 'green'}>{'> '}</Text>
				<TextInput
					value={input}
					onChange={handleInputChange}
					onSubmit={handleSubmit}
					placeholder={
						isProcessing ? 'Processing...' : 'Enter command, URL, or type /help'
					}
					showCursor={!isProcessing && (!showSuggestions || !showAutocomplete)}
				/>
			</Box>
			{showAutocomplete && showSuggestions && !isProcessing && (
				<AutoComplete
					items={suggestions}
					onSubmit={handleAutocompleteSubmit}
					isActive={true}
				/>
			)}
		</Box>
	);
}
