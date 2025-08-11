import {UserProfile} from '../profile';

export type ApplicationEvent =
	| {type: 'started'; url: string}
	| {type: 'navigating'; url: string}
	| {type: 'analyzing_page'; pageNumber: number}
	| {type: 'filling_field'; field: string; value: string}
	| {type: 'clicking_button'; label: string}
	| {type: 'page_completed'; pageNumber: number}
	| {type: 'captcha_detected'; message: string}
	| {type: 'error'; error: Error}
	| {type: 'completed'; confirmationNumber?: string};

export interface AgentConfig {
	headless: boolean;
	timeout: number;
	retryAttempts: number;
	screenshotOnError: boolean;
}