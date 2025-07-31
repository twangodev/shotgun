import {Command, CommandRegistry, CommandResult} from './commandTypes.js';
import {helpCommand} from './help.js';
import {profileCommand} from './profile.js';
import {applyCommand} from './apply.js';
import {clearCommand} from './clear.js';
import {isValidURL, normalizeURL, extractDomain, looksLikeURL} from '../url/urlDetector.js';
import {getJobSiteInfo} from '../url/jobSitePatterns.js';

// Initialize command registry
const commands: CommandRegistry = {
	help: helpCommand,
	profile: profileCommand,
	apply: applyCommand,
	clear: clearCommand,
};

export async function parseAndExecuteCommand(input: string): Promise<CommandResult> {
	const trimmedInput = input.trim();
	
	// First, check if the input is a URL
	if (looksLikeURL(trimmedInput)) {
		const normalizedUrl = normalizeURL(trimmedInput);
		if (isValidURL(normalizedUrl)) {
			return await handleURLInput(normalizedUrl);
		}
	}
	
	// Check if it's a slash command
	if (trimmedInput.startsWith('/')) {
		const parts = trimmedInput.slice(1).split(' ');
		const commandName = parts[0]?.toLowerCase();
		const args = parts.slice(1);
		
		if (!commandName) {
			return {
				success: false,
				message: 'Please enter a command name after the slash.',
			};
		}
		
		// Find command
		const command = commands[commandName];
		if (command) {
			return await command.execute(args);
		}
		
		// Check aliases
		for (const cmd of Object.values(commands)) {
			if (cmd.aliases?.includes(commandName)) {
				return await cmd.execute(args);
			}
		}
		
		return {
			success: false,
			message: `Unknown command: /${commandName}. Type /help for available commands.`,
		};
	}
	
	// Handle natural language commands
	return await handleNaturalLanguage(trimmedInput);
}

async function handleURLInput(url: string): Promise<CommandResult> {
	const domain = extractDomain(url);
	const jobSiteInfo = getJobSiteInfo(url);
	
	return {
		success: true,
		message: `${jobSiteInfo}\n\nReady to apply to job at ${domain}\nURL: ${url}\n\nThis feature will:\n1. Launch a browser with Playwright\n2. Navigate to the job posting\n3. Analyze the application form\n4. Fill out the form using your profile data\n5. Submit the application\n\n(Implementation coming soon!)`,
		data: {
			url,
			domain,
			action: 'apply',
		},
	};
}

async function handleNaturalLanguage(input: string): Promise<CommandResult> {
	const lowerInput = input.toLowerCase();
	
	// Simple pattern matching for now
	if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
		const helpCmd = commands['help'];
		if (helpCmd) {
			return await helpCmd.execute([]);
		}
	}
	
	if (lowerInput.includes('profile')) {
		const profileCmd = commands['profile'];
		if (profileCmd) {
			return await profileCmd.execute([]);
		}
	}
	
	// Check for URLs in natural language
	const urlMatch = input.match(/https?:\/\/[^\s]+/i) || input.match(/www\.[^\s]+/i) || input.match(/[a-zA-Z0-9-]+\.(com|org|net|io|co|dev|app|ai|jobs|careers)[^\s]*/i);
	if (urlMatch) {
		const normalizedUrl = normalizeURL(urlMatch[0]);
		if (isValidURL(normalizedUrl)) {
			return await handleURLInput(normalizedUrl);
		}
	}
	
	if (lowerInput.includes('apply')) {
		return {
			success: false,
			message: 'Please provide a job URL. You can paste it directly or say "apply to [URL]"',
		};
	}
	
	return {
		success: true,
		message: `I understand: "${input}". For now, please use slash commands like /help, /profile, or /apply <url>`,
	};
}

export function getAvailableCommands(): Command[] {
	return Object.values(commands);
}