import type {AccessibilityNode} from 'playwright';
import {UserProfile} from '../profile';

/**
 * Format accessibility snapshot into YAML-like structure similar to Playwright MCP
 * This format is more readable and efficient for both humans and LLMs
 */
export function formatAccessibilitySnapshot(node: AccessibilityNode | null, indent = 0): string {
	if (!node) return '';
	
	const spaces = '  '.repeat(indent);
	let output = '';
	
	// Format the node
	if (node.role) {
		output += `${spaces}- ${node.role}`;
		
		// Add name if present
		if (node.name) {
			output += ` "${node.name}"`;
		}
		
		// Add properties in brackets
		const props: string[] = [];
		if (node.required) props.push('required');
		if (node.disabled) props.push('disabled');
		if (node.checked) props.push('checked');
		if (node.focused) props.push('focused');
		if (node.readonly) props.push('readonly');
		
		if (props.length > 0) {
			output += ` [${props.join('] [')}]`;
		}
		
		// Add value if present
		if (node.value !== undefined && node.value !== '') {
			output += `: ${node.value}`;
		}
		
		output += '\n';
	}
	
	// Format children
	if (node.children) {
		for (const child of node.children) {
			output += formatAccessibilitySnapshot(child, indent + 1);
		}
	}
	
	return output;
}

/**
 * Extract form fields from the formatted snapshot
 * Looks for patterns like:
 * - textbox "First Name" [required]
 * - combobox "Years of Experience"
 * - checkbox "I agree"
 */
export function extractFormFields(formattedSnapshot: string): FormField[] {
	const fields: FormField[] = [];
	const lines = formattedSnapshot.split('\n');
	
	for (const line of lines) {
		// Match form field patterns
		const textboxMatch = line.match(/^\s*-\s*(textbox|combobox|checkbox|radio)\s+"([^"]+)"(?:\s*\[([^\]]*)\])?/);
		if (textboxMatch) {
			const [, role, name, properties] = textboxMatch;
			const required = properties?.includes('required') || false;
			
			fields.push({
				role,
				name,
				required,
				profileMapping: mapFieldToProfile(name),
			});
		}
	}
	
	return fields;
}

/**
 * Simple heuristic mapping of field names to profile paths
 * Phase 3 will use AI for smarter mapping
 */
function mapFieldToProfile(fieldName: string): string | undefined {
	const normalized = fieldName.toLowerCase();
	
	// Personal mappings
	if (normalized === 'first name' || normalized.includes('first name')) {
		return 'personal.firstName';
	}
	if (normalized === 'last name' || normalized.includes('last name')) {
		return 'personal.lastName';
	}
	if (normalized === 'email' || normalized.includes('email')) {
		return 'personal.email';
	}
	if (normalized === 'phone' || normalized.includes('phone')) {
		return 'personal.phone';
	}
	if (normalized.includes('linkedin')) {
		return 'personal.linkedIn';
	}
	
	// Location mappings
	if (normalized === 'city' || normalized.includes('city')) {
		return 'personal.location.city';
	}
	if (normalized === 'state' || normalized.includes('state')) {
		return 'personal.location.state';
	}
	if (normalized === 'zip' || normalized.includes('zip') || normalized.includes('postal')) {
		return 'personal.location.zipCode';
	}
	
	// Professional mappings
	if (normalized.includes('current') && (normalized.includes('title') || normalized.includes('position'))) {
		return 'professional.currentTitle';
	}
	if (normalized.includes('years') && normalized.includes('experience')) {
		return 'professional.yearsExperience';
	}
	
	// For now, return undefined for complex/ambiguous fields
	// Phase 3 AI will handle these better
	return undefined;
}

/**
 * Get value from profile based on dot-notation path
 */
export function getValueFromProfile(profile: UserProfile, path: string): string {
	const parts = path.split('.');
	let value: any = profile;
	
	for (const part of parts) {
		value = value?.[part];
		if (value === undefined) break;
	}
	
	// Convert to string
	if (value === undefined || value === null) {
		return '';
	}
	if (typeof value === 'object') {
		// Handle salary range
		if ('min' in value && 'max' in value) {
			return value.min.toString();
		}
		return JSON.stringify(value);
	}
	return value.toString();
}

/**
 * Find submit button in formatted snapshot
 * Looks for patterns like:
 * - button "Submit application"
 * - button "Apply"
 * - button "Continue"
 */
export function findSubmitButton(formattedSnapshot: string): string | null {
	const lines = formattedSnapshot.split('\n');
	
	for (const line of lines) {
		const buttonMatch = line.match(/^\s*-\s*button\s+"([^"]+)"/);
		if (buttonMatch) {
			const buttonText = buttonMatch[1].toLowerCase();
			if (
				buttonText.includes('submit') ||
				buttonText.includes('apply') ||
				buttonText.includes('continue') ||
				buttonText.includes('next')
			) {
				return buttonMatch[1]; // Return the original button text
			}
		}
	}
	
	return null;
}

/**
 * Represents a form field extracted from accessibility tree
 */
export interface FormField {
	role: string;
	name: string;
	required: boolean;
	profileMapping?: string;
}