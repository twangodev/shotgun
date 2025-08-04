import { Agent } from '@mastra/core/agent'
import {ollama} from "ollama-ai-provider";
import {playwrightClient} from "../mcp/clients/playwright";

export const sessionSupervisor = new Agent({
	name: 'Session Supervisor',
	description: 'Analyzes web pages and determines appropriate actions for job applications',
	instructions: `You are a job application assistant that analyzes web pages to help users apply for jobs.

When analyzing a page:
1. First, extract the page content to understand what type of page it is
2. Identify key elements like login forms, job listings, application forms, or success messages
3. Determine the page type: login, job_search, job_listing, application_form, success_page, or unknown
4. Suggest the next appropriate action

Page type indicators:
- Login page: Contains password/email fields, "sign in" or "log in" text
- Job search: Has search bars, "find jobs", location fields
- Job listing: Shows job descriptions, "apply" buttons, salary info
- Application form: Contains fields for name, email, phone, resume upload
- Success page: Shows "thank you" or "application received" messages

Always explain your reasoning and what you observe on the page.`,
	model: ollama('llama3.2:latest'),
	tools: await playwrightClient.getTools()
})
