import React, {useState, useEffect} from 'react';
import {Text} from 'ink';

interface StatusIndicatorProps {
	status: string;
}

export function StatusIndicator({status}: StatusIndicatorProps) {
	const [visible, setVisible] = useState(true);
	const [opacity, setOpacity] = useState(1);

	useEffect(() => {
		let interval: NodeJS.Timeout;

		switch (status) {
			case 'paused':
				// Slow blink (1s interval)
				interval = setInterval(() => {
					setVisible(v => !v);
				}, 1000);
				break;

			case 'waiting_for_user':
				// Pulsing effect
				let increasing = false;
				interval = setInterval(() => {
					setOpacity(prev => {
						if (prev <= 0.3) increasing = true;
						if (prev >= 1) increasing = false;
						return increasing ? prev + 0.1 : prev - 0.1;
					});
				}, 100);
				break;

			case 'error':
				// Rapid blink (500ms interval)
				interval = setInterval(() => {
					setVisible(v => !v);
				}, 500);
				break;

			default:
				// No animation for active, completed, and default states
				break;
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [status]);

	const getColor = () => {
		switch (status) {
			case 'active':
			case 'completed':
				return 'green';
			case 'paused':
			case 'waiting_for_user':
				return 'yellow';
			case 'error':
				return 'red';
			default:
				return 'gray';
		}
	};

	// For pulsing effect
	if (status === 'waiting_for_user') {
		return <Text color={getColor()} dimColor={opacity < 0.5}>●</Text>;
	}

	// For blinking effects
	if (!visible && (status === 'paused' || status === 'error')) {
		return <Text> </Text>; // Maintain spacing
	}

	return <Text color={getColor()}>●</Text>;
}