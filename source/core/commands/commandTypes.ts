export interface Command {
	name: string;
	description: string;
	aliases?: string[];
	execute: (args: string[]) => Promise<CommandResult>;
}

export interface CommandResult {
	success: boolean;
	message: string;
	data?: any;
}

export interface CommandRegistry {
	[key: string]: Command;
}