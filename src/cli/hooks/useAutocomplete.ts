import {useState, useEffect} from 'react';
import Fuse from 'fuse.js';
import {AutoCompleteItem} from '../components/AutoComplete';
import {commandRegistry} from '../../core/command-system';

interface UseAutocompleteOptions {
	history: string[];
	currentInput: string;
}

export function useAutocomplete({
	history,
	currentInput,
}: UseAutocompleteOptions) {
	const [suggestions, setSuggestions] = useState<AutoCompleteItem[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	useEffect(() => {
		// Only show command suggestions when input starts with /
		if (!currentInput.startsWith('/')) {
			setSuggestions([]);
			setShowSuggestions(false);
			return;
		}

		const commands = commandRegistry.getVisibleCommands();
		const inputCmd = currentInput.slice(1);

		// Build list of all command options
		const allCommandOptions: AutoCompleteItem[] = [];

		commands.forEach(cmd => {
			allCommandOptions.push({
				label: `/${cmd.name}`,
				value: `/${cmd.name}`,
				description: cmd.description,
			});
		});

		// Use fuzzy search if there's input after /
		if (inputCmd.length > 0) {
			const fuse = new Fuse(allCommandOptions, {
				keys: ['label'],
				threshold: 0.4,
				shouldSort: true,
			});

			const results = fuse.search(inputCmd);
			const fuzzyMatches = results.map(result => result.item);

			setSuggestions(fuzzyMatches.slice(0, 10));
			setShowSuggestions(fuzzyMatches.length > 0);
		} else {
			// Show all commands when only / is typed
			const sortedOptions = allCommandOptions.sort((a, b) => {
				return a.label.localeCompare(b.label);
			});

			setSuggestions(sortedOptions.slice(0, 10));
			setShowSuggestions(true);
		}
	}, [currentInput, history]);

	return {
		suggestions,
		showSuggestions,
		hideSuggestions: () => setShowSuggestions(false),
	};
}
