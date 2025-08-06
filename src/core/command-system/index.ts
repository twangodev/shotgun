import {commandRegistry} from './CommandRegistry';
import {SlashCommandHandler} from '../input/handlers/slashCommandHandler';
import {HandlerRegistry} from '../input/handlerRegistry';

// Import all commands
import helpCommand from '../../commands/system/help';
import clearCommand from '../../commands/system/clear';
import exitCommand from '../../commands/system/exit';

// Export all types
export type {
	Command,
	CommandResult,
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
	// Add new commands here
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
