export function isValidURL(input: string): boolean {
	try {
		const url = new URL(input);
		// Only allow http and https protocols
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		// Try adding https:// if it looks like a URL without protocol
		if (input.includes('.') && !input.includes(' ')) {
			try {
				new URL(`https://${input}`);
				return true;
			} catch {
				return false;
			}
		}
		return false;
	}
}

export function normalizeURL(input: string): string {
	// If already valid URL, return as is
	if (isValidURL(input)) {
		return input;
	}

	// Try adding https:// if it looks like a URL without protocol
	if (input.includes('.') && !input.includes(' ')) {
		const withProtocol = `https://${input}`;
		if (isValidURL(withProtocol)) {
			return withProtocol;
		}
	}

	return input;
}

export function extractDomain(url: string): string {
	try {
		const urlObj = new URL(normalizeURL(url));
		return urlObj.hostname;
	} catch {
		return 'unknown';
	}
}

export function looksLikeURL(input: string): boolean {
	// Check if input looks like it could be a URL
	const urlPatterns = [
		/^https?:\/\//i, // Starts with http:// or https://
		/^www\./i, // Starts with www.
		/\.(com|org|net|io|co|dev|app|ai|jobs|careers)/i, // Contains common TLDs
		/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/, // Domain pattern
	];

	return urlPatterns.some(pattern => pattern.test(input));
}
