import {chromium, Browser, Page} from 'playwright';

export class BrowserManager {
	private static instance: BrowserManager;
	private browser: Browser | null = null;
	private pages: Map<string, Page> = new Map();
	private onSessionChangeCallback?: (count: number) => void;

	static getInstance(): BrowserManager {
		if (!BrowserManager.instance) {
			BrowserManager.instance = new BrowserManager();
		}
		return BrowserManager.instance;
	}

	setOnSessionChange(callback: (count: number) => void) {
		this.onSessionChangeCallback = callback;
	}

	private notifySessionChange() {
		if (this.onSessionChangeCallback) {
			this.onSessionChangeCallback(this.pages.size);
		}
	}

	async ensureBrowserLaunched(): Promise<void> {
		if (!this.browser) {
			this.browser = await chromium.launch({
				headless: false,
				args: ['--remote-debugging-port=9222'], // For future MCP connection
			});

			// Track when browser is closed
			this.browser.on('disconnected', () => {
				this.pages.clear();
				this.browser = null;
				this.notifySessionChange();
			});
		}
	}

	async openUrl(url: string): Promise<void> {
		await this.ensureBrowserLaunched();
		const page = await this.browser!.newPage();

		// Track when individual pages are closed
		page.on('close', () => {
			this.pages.delete(url);
			this.notifySessionChange();
		});

		await page.goto(url);
		this.pages.set(url, page);
		this.notifySessionChange();
	}

	getActiveSessionCount(): number {
		return this.pages.size;
	}

	hasActiveSessions(): boolean {
		return this.pages.size > 0;
	}

	async cleanup(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
			this.pages.clear();
			this.notifySessionChange();
		}
	}
}
