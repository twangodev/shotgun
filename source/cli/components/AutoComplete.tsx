import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

export interface AutoCompleteItem {
	label: string;
	value: string;
	description?: string;
}

interface AutoCompleteProps {
	items: AutoCompleteItem[];
	onSubmit: (item: AutoCompleteItem) => void;
	isActive?: boolean;
}

export function AutoComplete({
	items,
	onSubmit,
	isActive = true,
}: AutoCompleteProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Items are already filtered by the hook, so use them directly
	const filteredItems = items;

	useEffect(() => {
		// Reset selection when items change
		setSelectedIndex(0);
	}, [filteredItems.length]);

	useInput(
		(_, key) => {
			if (!isActive || filteredItems.length === 0) return;

			if (key.upArrow) {
				setSelectedIndex(prev =>
					prev > 0 ? prev - 1 : filteredItems.length - 1,
				);
			} else if (key.downArrow) {
				setSelectedIndex(prev =>
					prev < filteredItems.length - 1 ? prev + 1 : 0,
				);
			} else if (key.tab || key.return) {
				if (filteredItems[selectedIndex]) {
					onSubmit(filteredItems[selectedIndex]);
				}
			}
		},
		{isActive},
	);

	if (!isActive || filteredItems.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column" marginTop={1} marginLeft={2}>
			<Text color="gray" dimColor>
				↑↓ navigate • tab/enter select • esc cancel
			</Text>
			{filteredItems.slice(0, 10).map((item, index) => (
				<Box key={`${item.value}-${index}`} marginTop={index === 0 ? 1 : 0}>
					<Text color={index === selectedIndex ? 'green' : 'white'}>
						{index === selectedIndex ? '▶ ' : '  '}
						{item.label}
						{item.description && (
							<Text color="gray"> - {item.description}</Text>
						)}
					</Text>
				</Box>
			))}
		</Box>
	);
}
