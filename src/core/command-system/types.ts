export interface CommandResult {
	success: boolean;
	message: string;
	data?: any;
}

export interface Command {
	name: string;
	description: string;
	execute: (args: string[]) => Promise<CommandResult>;
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
