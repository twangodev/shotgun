import {InputHandler, InputContext, HandlerResult} from '../types';
import {isValidURL, normalizeURL, looksLikeURL} from '../../url/urlDetector';
import {ActionExecutor} from '../../actions/executor';

export class URLHandler implements InputHandler {
	name = 'URLHandler';
	priority = 100; // High priority to catch URLs early

	canHandle(context: InputContext): boolean {
		// Check if it's a URL or looks like one
		return looksLikeURL(context.trimmed);
	}

	async handle(context: InputContext): Promise<HandlerResult> {
		// Check if input is ONLY a URL (no other text)
		const isOnlyURL = context.tokens.length === 1;

		if (isOnlyURL) {
			const normalizedUrl = normalizeURL(context.trimmed);

			if (isValidURL(normalizedUrl)) {
				// Direct browser launch
				const executor = ActionExecutor.getInstance();
				const result = await executor.execute({
					type: 'open_browser',
					payload: {url: normalizedUrl},
				});

				return {
					handled: true,
					result,
				};
			}
		}

		// Check for URL with other text (future AI feature)
		const urlMatch = context.trimmed.match(/https?:\/\/[^\s]+/);
		const hasUrlWithText =
			urlMatch || (looksLikeURL(context.trimmed) && context.tokens.length > 1);

		if (hasUrlWithText) {
			const executor = ActionExecutor.getInstance();
			const result = await executor.execute({
				type: 'ai_intent',
				payload: {
					input: context.trimmed,
					detectedUrl: urlMatch ? urlMatch[0] : undefined,
				},
			});

			return {
				handled: true,
				result,
			};
		}

		return {
			handled: false,
		};
	}
}
