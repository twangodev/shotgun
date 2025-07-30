export interface JobSitePattern {
	name: string;
	domains: string[];
	patterns: RegExp[];
	example: string;
}

export const jobSitePatterns: JobSitePattern[] = [
	{
		name: 'LinkedIn',
		domains: ['linkedin.com', 'www.linkedin.com'],
		patterns: [
			/linkedin\.com\/jobs\/view\/\d+/i,
			/linkedin\.com\/jobs\/collections/i,
		],
		example: 'https://www.linkedin.com/jobs/view/1234567890',
	},
	{
		name: 'Indeed',
		domains: ['indeed.com', 'www.indeed.com'],
		patterns: [
			/indeed\.com\/viewjob\?jk=[\w]+/i,
			/indeed\.com\/rc\/clk\?jk=[\w]+/i,
		],
		example: 'https://www.indeed.com/viewjob?jk=abc123',
	},
	{
		name: 'Greenhouse',
		domains: ['greenhouse.io', 'boards.greenhouse.io'],
		patterns: [
			/boards\.greenhouse\.io\/[\w-]+\/jobs\/\d+/i,
			/job\.greenhouse\.io\/[\w-]+\/\d+/i,
		],
		example: 'https://boards.greenhouse.io/company/jobs/1234567',
	},
	{
		name: 'Lever',
		domains: ['lever.co', 'jobs.lever.co', 'jobs.eu.lever.co'],
		patterns: [
			/jobs\.(eu\.)?lever\.co\/[\w-]+\/[\w-]+/i,
		],
		example: 'https://jobs.lever.co/company/abc-123-def',
	},
	{
		name: 'Workday',
		domains: ['myworkdayjobs.com'],
		patterns: [
			/\.myworkdayjobs\.com\/.+\/job\/.+\/[\w-]+/i,
		],
		example: 'https://company.wd1.myworkdayjobs.com/en-US/careers/job/location/Job-Title_R-123456',
	},
	{
		name: 'AngelList',
		domains: ['angel.co', 'wellfound.com'],
		patterns: [
			/angel\.co\/company\/[\w-]+\/jobs\/\d+/i,
			/wellfound\.com\/company\/[\w-]+\/jobs\/\d+/i,
		],
		example: 'https://wellfound.com/company/startup/jobs/1234567',
	},
	{
		name: 'SmartRecruiters',
		domains: ['smartrecruiters.com', 'jobs.smartrecruiters.com'],
		patterns: [
			/jobs\.smartrecruiters\.com\/[\w-]+\/\d+/i,
		],
		example: 'https://jobs.smartrecruiters.com/Company/123456789',
	},
];

export function detectJobSite(url: string): JobSitePattern | null {
	const normalizedUrl = url.toLowerCase();
	
	for (const site of jobSitePatterns) {
		// Check if URL contains any of the site's domains
		const matchesDomain = site.domains.some(domain => 
			normalizedUrl.includes(domain)
		);
		
		if (matchesDomain) {
			// Check if URL matches any of the site's patterns
			const matchesPattern = site.patterns.some(pattern =>
				pattern.test(normalizedUrl)
			);
			
			if (matchesPattern) {
				return site;
			}
		}
	}
	
	return null;
}

export function isKnownJobSite(url: string): boolean {
	return detectJobSite(url) !== null;
}

export function getJobSiteInfo(url: string): string {
	const site = detectJobSite(url);
	if (site) {
		return `Detected ${site.name} job posting`;
	}
	return 'Unknown job site';
}