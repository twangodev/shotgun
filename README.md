# shotgun-jobs

AI-powered job application automation tool that helps you fill out job applications automatically using Playwright.

## Features

- Interactive terminal interface similar to Claude Code and Google Gemini CLI
- Command-based interaction with natural language support
- Profile management for storing your job application information
- Automated job application form filling (coming soon)

## Installation

```bash
npm install
npm run build
```

## Usage

Run the application in your terminal:

```bash
node dist/cli.js
# or
npm start
```

### Available Commands

- `/help` - Show available commands and usage information
- `/profile` - Manage your job application profile
- `/profile setup` - Set up your profile (coming soon)
- `/profile edit` - Edit your profile (coming soon)
- `/apply <url>` - Apply to a job at the specified URL (coming soon)
- `/status` - Check the status of current applications
- `/history` - View your application history
- `/exit` or `/quit` - Exit the application

### Natural Language Support

You can also use natural language commands like:
- "Help me apply to this job: [URL]"
- "Show my profile"
- "What's my application status?"

### Tips

- Use arrow keys (↑/↓) to navigate through command history
- Press Ctrl+C to cancel current operation
- Your profile information is saved locally

## Development

```bash
# Watch mode for development
npm run dev

# Run tests
npm test
```

## Architecture

The project is structured with a clean separation of concerns:

- `source/cli/` - Terminal UI components built with Ink (React for CLI)
- `source/core/` - Business logic, command handlers, and Playwright automation
- Commands are modular and easy to extend
- State management using React hooks

## Coming Soon

- Playwright integration for automated form filling
- Profile wizard for easy setup
- Support for multiple job sites
- Application tracking and history
- Resume parsing and auto-fill
