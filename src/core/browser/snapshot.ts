/**
 * Copyright (c) Microsoft Corporation.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Portions adapted from playwright-mcp (https://github.com/microsoft/playwright-mcp)
 */

import {Page, FileChooser} from 'playwright';

/**
 * Extended Page type with Playwright's internal AI snapshot method
 */
type PageWithSnapshot = Page & {
	_snapshotForAI: () => Promise<string>;
};

/**
 * Page snapshot for AI consumption
 */
export interface PageSnapshot {
	url: string;
	title: string;
	ariaSnapshot: string; // YAML accessibility tree with ref attributes
	hasFileUpload: boolean; // Track if page has file upload capability
}

/**
 * Simplified snapshot manager - focused on just capturing snapshots
 */
export class SnapshotManager {
	private hasFileUpload = false;

	constructor(private page: Page) {
		// Track file choosers - indicates resume/document upload capability
		this.page.on('filechooser', (_: FileChooser) => {
			this.hasFileUpload = true;
		});
	}

	/**
	 * Create a page snapshot for AI consumption using Playwright's internal API
	 */
	async createFullSnapshot(): Promise<PageSnapshot> {
		const pageWithSnapshot = this.page as PageWithSnapshot;
		const ariaSnapshot = await pageWithSnapshot._snapshotForAI();

		const snapshot: PageSnapshot = {
			url: this.page.url(),
			title: await this.page.title(),
			ariaSnapshot,
			hasFileUpload: this.hasFileUpload,
		};

		return snapshot;
	}
}