import {Page} from 'playwright';

/**
 * Browser Tool Interface - Base for all browser operations
 * Modeled after gemini-cli's tool system
 */
export interface BrowserTool<TParams = any, TResult = BrowserToolResult> {
	name: string;
	description: string;
	
	/**
	 * Execute the browser action
	 */
	execute(params: TParams, page: Page, signal?: AbortSignal): Promise<TResult>;
	
	/**
	 * Check if this action requires human confirmation
	 */
	shouldConfirmExecute?(params: TParams): Promise<boolean>;
	
	/**
	 * Validate parameters before execution
	 */
	validateParams?(params: TParams): string | null;
}

/**
 * Result from browser tool execution
 */
export interface BrowserToolResult {
	success: boolean;
	message: string;
	data?: any;
	error?: {
		message: string;
		recoverable: boolean;
		type?: BrowserToolErrorType;
	};
}

/**
 * Error types for browser tools
 */
export enum BrowserToolErrorType {
	ELEMENT_NOT_FOUND = 'element_not_found',
	TIMEOUT = 'timeout',
	NAVIGATION_FAILED = 'navigation_failed',
	CAPTCHA_DETECTED = 'captcha_detected',
	LOGIN_REQUIRED = 'login_required',
	NETWORK_ERROR = 'network_error',
	INVALID_PARAMS = 'invalid_params',
}

/**
 * Browser tool execution state
 */
export enum BrowserToolState {
	VALIDATING = 'validating',
	SCHEDULED = 'scheduled',
	AWAITING_APPROVAL = 'awaiting_approval',
	EXECUTING = 'executing',
	SUCCESS = 'success',
	ERROR = 'error',
	CANCELLED = 'cancelled',
}

/**
 * Browser action request from AI
 */
export interface BrowserActionRequest {
	id: string;
	toolName: string;
	params: Record<string, any>;
	reasoning?: string;
	confidence?: number;
}

/**
 * Tracked browser action with state
 */
export interface TrackedBrowserAction {
	id: string;
	request: BrowserActionRequest;
	state: BrowserToolState;
	startTime: number;
	endTime?: number;
	result?: BrowserToolResult;
	error?: Error;
}