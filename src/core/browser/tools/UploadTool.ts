import {Page} from 'playwright';
import {BrowserTool, BrowserToolResult} from './types';
import {RefResolver} from '../RefResolver';

/**
 * Upload Tool - Handles file uploads
 * Note: This tool can only trigger the file selector, actual file selection requires human intervention
 */
export class UploadTool implements BrowserTool {
	name = 'upload';
	description = 'Handle file upload interactions';
	private refResolver?: RefResolver;
	
	constructor(private page?: Page) {}
	
	async execute(params: any, page: Page): Promise<BrowserToolResult> {
		const ref = params.ref;
		const filePath = params.value || params.filePath || params.path;
		
		if (!ref) {
			return {
				success: false,
				message: 'Upload failed: ref parameter is required',
			};
		}
		
		if (!filePath) {
			return {
				success: false,
				message: 'Upload failed: file path is required',
			};
		}
		
		try {
			// Find the file input element using Playwright's aria-ref selector
			let fileInput;
			try {
				fileInput = await page.locator(`aria-ref=${ref}`);
				const count = await fileInput.count();
				if (count === 0) {
					throw new Error('Element not found');
				}
			} catch (e) {
				// Try RefResolver fallback
				if (this.refResolver && this.refResolver.hasRef(ref)) {
					fileInput = await this.refResolver.getLocatorForRef(page, ref);
				} else {
					throw new Error(`Cannot find element with ref ${ref}`);
				}
			}
			
			// Use Playwright's setInputFiles to upload the file
			// This works even if the input is hidden
			await fileInput.setInputFiles(filePath);
			
			console.log(`✅ File uploaded: ${filePath} to [ref=${ref}]`);
			
			return {
				success: true,
				message: `Successfully uploaded ${filePath}`,
				data: {
					ref,
					filePath,
				},
			};
		} catch (error) {
			console.error(`❌ Upload failed:`, error);
			return {
				success: false,
				message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}
	
	shouldConfirmExecute(): boolean {
		return false;
	}
	
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	setRefResolver(resolver: RefResolver): void {
		this.refResolver = resolver;
	}
}