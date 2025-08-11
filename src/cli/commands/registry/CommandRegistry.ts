import {RegisteredCommand} from './types';
import {CommandEvent} from '../../../core/events';

/**
 * Unified command registry that handles registration, loading, and execution
 */
export class CommandRegistry {
	private static instance: CommandRegistry;
	private commands: Map<string, RegisteredCommand> = new Map();

	private constructor() {}

	static getInstance(): CommandRegistry {
		if (!CommandRegistry.instance) {
			CommandRegistry.instance = new CommandRegistry();
		}
		return CommandRegistry.instance;
	}

	/**
	 * Register a command
	 */
	register(command: RegisteredCommand): void {
		if (this.commands.has(command.name)) {
			throw new Error(`Command "${command.name}" is already registered`);
		}

		this.commands.set(command.name, command);
	}

	/**
	 * Unregister a command
	 */
	unregister(commandName: string): void {
		this.commands.delete(commandName);
	}

	/**
	 * Get a command by name
	 */
	get(commandName: string): RegisteredCommand | undefined {
		return this.commands.get(commandName);
	}

	/**
	 * Execute a command
	 */
	execute(commandName: string, args: string[]): AsyncGenerator<CommandEvent> | null {
		const command = this.get(commandName);

		if (!command) {
			return null;
		}

		return command.execute(args);
	}


	/**
	 * Get all commands
	 */
	getAllCommands(): RegisteredCommand[] {
		return Array.from(this.commands.values());
	}

	/**
	 * Get visible commands (not hidden)
	 */
	getVisibleCommands(): RegisteredCommand[] {
		return this.getAllCommands().filter(cmd => !cmd.metadata?.hidden);
	}

	/**
	 * Get commands by category
	 */
	getCommandsByCategory(category: string): RegisteredCommand[] {
		return this.getAllCommands().filter(
			cmd => cmd.metadata?.category === category,
		);
	}

	/**
	 * Get all categories
	 */
	getCategories(): string[] {
		const categories = new Set<string>();
		for (const command of this.commands.values()) {
			if (command.metadata?.category) {
				categories.add(command.metadata.category);
			}
		}
		return Array.from(categories).sort();
	}

	/**
	 * Search commands
	 */
	search(query: string): RegisteredCommand[] {
		const lowerQuery = query.toLowerCase();
		return this.getAllCommands().filter(cmd => {
			// Search in name
			if (cmd.name.toLowerCase().includes(lowerQuery)) return true;

			// Search in description
			if (cmd.description.toLowerCase().includes(lowerQuery)) return true;

			return false;
		});
	}

	/**
	 * Clear all commands
	 */
	clear(): void {
		this.commands.clear();
	}
}

// Export singleton instance
export const commandRegistry = CommandRegistry.getInstance();
