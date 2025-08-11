export interface UserProfile {
	personal: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		location: {
			city: string;
			state: string;
			country: string;
			zipCode: string;
		};
		linkedIn?: string;
		github?: string;
		portfolio?: string;
	};
	professional: {
		currentTitle: string;
		yearsExperience: number;
		desiredRole?: string;
		workAuthorization: string;
		willingToRelocate: boolean;
		remotePreference: 'onsite' | 'hybrid' | 'remote';
		expectedSalary?: {
			min: number;
			max: number;
			currency: string;
		};
		skills: string[];
		resumePath?: string;
		coverLetterPath?: string;
	};
	education: {
		degree: string;
		field: string;
		school: string;
		graduationYear: number;
	};
	preferences: {
		companySize: ('startup' | 'midsize' | 'enterprise')[];
		industries: string[];
		avoidCompanies: string[];
	};
}