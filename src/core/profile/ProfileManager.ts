import {readFileSync, existsSync} from 'fs';
import {join} from 'path';
import {UserProfile} from './types';

export class ProfileManager {
	private static instance: ProfileManager;
	private profile: UserProfile | null = null;
	private profilePath: string;

	private constructor() {
		// Try multiple paths to find profile.json
		const possiblePaths = [
			join(process.cwd(), 'config', 'profile.json'),
			join(process.cwd(), 'profile.json'),
			join(process.env.HOME || '', '.shotgun-jobs', 'profile.json'),
		];

		for (const path of possiblePaths) {
			if (existsSync(path)) {
				this.profilePath = path;
				break;
			}
		}

		if (!this.profilePath) {
			this.profilePath = possiblePaths[0]; // Default to first option
		}
	}

	static getInstance(): ProfileManager {
		if (!ProfileManager.instance) {
			ProfileManager.instance = new ProfileManager();
		}
		return ProfileManager.instance;
	}

	loadProfile(): UserProfile {
		if (this.profile) {
			return this.profile;
		}

		if (!existsSync(this.profilePath)) {
			throw new Error(
				`Profile not found at ${this.profilePath}. Please create a profile.json file.`,
			);
		}

		try {
			const content = readFileSync(this.profilePath, 'utf-8');
			this.profile = JSON.parse(content) as UserProfile;
			this.validateProfile(this.profile);
			return this.profile;
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new Error(`Invalid JSON in profile: ${error.message}`);
			}
			throw error;
		}
	}

	private validateProfile(profile: any): void {
		// Basic validation
		const required = [
			'personal.firstName',
			'personal.lastName',
			'personal.email',
			'professional.currentTitle',
			'professional.yearsExperience',
		];

		for (const path of required) {
			const parts = path.split('.');
			let value = profile;
			for (const part of parts) {
				value = value?.[part];
			}
			if (value === undefined || value === null || value === '') {
				throw new Error(`Missing required field: ${path}`);
			}
		}
	}

	getProfile(): UserProfile | null {
		return this.profile;
	}

	getProfilePath(): string {
		return this.profilePath;
	}

	// Helper methods for common profile data access
	getFullName(): string {
		const profile = this.getProfile();
		if (!profile) return '';
		return `${profile.personal.firstName} ${profile.personal.lastName}`;
	}

	getContactInfo(): {email: string; phone: string} {
		const profile = this.getProfile();
		if (!profile) return {email: '', phone: ''};
		return {
			email: profile.personal.email,
			phone: profile.personal.phone,
		};
	}

	getLocation(): string {
		const profile = this.getProfile();
		if (!profile) return '';
		const loc = profile.personal.location;
		return `${loc.city}, ${loc.state}`;
	}
}

export const profileManager = ProfileManager.getInstance();