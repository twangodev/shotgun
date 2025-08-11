import {CommandEvent} from '../../../core/events';

export interface Command {
	name: string;
	description: string;
	execute: (args: string[]) => AsyncGenerator<CommandEvent>;
}

export interface CommandMetadata {
	category?: string;
	hidden?: boolean;
	permissions?: string[];
	examples?: string[];
}

export interface RegisteredCommand extends Command {
	metadata?: CommandMetadata;
}

export interface CommandModule {
	default?: Command | RegisteredCommand;
	command?: Command | RegisteredCommand;
	[key: string]: any;
}
