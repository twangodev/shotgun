import React from 'react';
import {Box, Text} from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';

export function Logo() {
	return (
		<Box flexDirection="column" paddingY={1} alignItems="center">
			{/* Filled ASCII Logo with gradient */}
			<Gradient name="fruit">
				<BigText text="SHOTGUN" font="block" />
			</Gradient>
			<Box marginTop={-2}>
				<Text bold>
					<Gradient name="cristal">{'J O B S'}</Gradient>
				</Text>
			</Box>

			{/* Tagline and version */}
			<Box marginTop={1} flexDirection="column" alignItems="center">
				<Text color="gray">Job applications, automated.</Text>
			</Box>

			{/* Welcome message */}
			<Box marginTop={1}>
				<Text color="gray">Type </Text>
				<Text color="green" bold>
					/help
				</Text>
				<Text color="gray"> for available commands</Text>
			</Box>
		</Box>
	);
}
