import {commandRegistry} from './CommandRegistry';
import {SlashCommandHandler} from '../../input/handlers/slashCommandHandler';
import {HandlerRegistry} from '../../input/handlerRegistry';

// Import all commands
import helpCommand from '../system/help';
import clearCommand from '../system/clear';
import exitCommand from '../system/exit';
import applyCommand from '../jobs/apply';

// Export all types
export type {
	Command,
	CommandMetadata,
	RegisteredCommand,
	CommandModule,
} from './types';

// Export the registry
export {commandRegistry} from './CommandRegistry';

// Export parser
export {parseAndExecuteCommand} from './parser';

// Define all commands in a simple array
const allCommands = [
	{...helpCommand, metadata: {category: 'system'}},
	{...clearCommand, metadata: {category: 'system'}},
	{...exitCommand, metadata: {category: 'system'}},
	{...applyCommand, metadata: {category: 'jobs'}},
];

// Initialize the command system
let initialized = false;

export async function initializeCommandSystem(): Promise<void> {
	if (initialized) return;

	// Register all commands
	for (const command of allCommands) {
		commandRegistry.register(command);
	}

	// Register handlers
	HandlerRegistry.register(new SlashCommandHandler());

	initialized = true;
}

// For backward compatibility
export function getAvailableCommands() {
	return commandRegistry.getVisibleCommands();
}
