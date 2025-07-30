#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {App} from './cli/App.js';

meow(
	`
	Usage
	  $ shotgun-jobs

	Description
	  AI-powered job application automation tool

	Examples
	  $ shotgun-jobs
	  Starts the interactive CLI

	Commands (available in interactive mode):
	  /help       Show available commands
	  /profile    Manage your profile
	  /apply      Apply to a job with URL
	  /status     Check application status
	  /history    View past applications
`,
	{
		importMeta: import.meta,
		flags: {},
	},
);

// Render the interactive CLI
const app = render(<App />);

// Handle graceful exit
process.on('exit', () => {
	app.unmount();
});
