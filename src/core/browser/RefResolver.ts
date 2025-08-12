import {Page} from 'playwright';

/**
 * RefResolver - Maps snapshot refs to actual DOM selectors
 * Fallback implementation when aria-ref selector isn't available
 */
export class RefResolver {
	private refToSelector = new Map<string, {selector: string; description: string}>();
	private currentSnapshot: string = '';
	
	/**
	 * Parse snapshot and build ref->selector mapping
	 */
	parseSnapshot(snapshot: string): void {
		this.refToSelector.clear();
		this.currentSnapshot = snapshot;
		
		const lines = snapshot.split('\n');
		
		for (const line of lines) {
			const refMatch = line.match(/\[ref=(e\d+)\]/);
			if (!refMatch) continue;
			
			const ref = refMatch[1];
			
			// Extract element type and properties
			if (line.includes('textbox "')) {
				const nameMatch = line.match(/textbox "([^"]+)"/);
				if (nameMatch) {
					const name = nameMatch[1];
					this.refToSelector.set(ref, {
						selector: `getByLabel('${name}')`,
						description: `${name} textbox`,
					});
				}
			} else if (line.includes('button "')) {
				const nameMatch = line.match(/button "([^"]+)"/);
				if (nameMatch) {
					const name = nameMatch[1];
					this.refToSelector.set(ref, {
						selector: `getByRole('button', {name: '${name}'})`,
						description: `${name} button`,
					});
				}
			} else if (line.includes('link "')) {
				const nameMatch = line.match(/link "([^"]+)"/);
				if (nameMatch) {
					const name = nameMatch[1];
					this.refToSelector.set(ref, {
						selector: `getByRole('link', {name: '${name}'})`,
						description: `${name} link`,
					});
				}
			} else if (line.includes('combobox "')) {
				const nameMatch = line.match(/combobox "([^"]+)"/);
				if (nameMatch) {
					const name = nameMatch[1];
					this.refToSelector.set(ref, {
						selector: `getByRole('combobox', {name: '${name}'})`,
						description: `${name} dropdown`,
					});
				}
			} else if (line.includes('checkbox "')) {
				const nameMatch = line.match(/checkbox "([^"]+)"/);
				if (nameMatch) {
					const name = nameMatch[1];
					this.refToSelector.set(ref, {
						selector: `getByRole('checkbox', {name: '${name}'})`,
						description: `${name} checkbox`,
					});
				}
			} else if (line.includes('radio "')) {
				const nameMatch = line.match(/radio "([^"]+)"/);
				if (nameMatch) {
					const name = nameMatch[1];
					this.refToSelector.set(ref, {
						selector: `getByRole('radio', {name: '${name}'})`,
						description: `${name} radio button`,
					});
				}
			}
			// Add more patterns as needed
		}
	}
	
	/**
	 * Get selector for a ref
	 */
	getSelectorForRef(ref: string): {selector: string; description: string} | null {
		return this.refToSelector.get(ref) || null;
	}
	
	/**
	 * Get locator for a ref
	 */
	async getLocatorForRef(page: Page, ref: string): Promise<any> {
		const mapping = this.refToSelector.get(ref);
		if (!mapping) {
			throw new Error(`No selector found for ref ${ref}`);
		}
		
		// Parse the selector type and create appropriate locator
		const {selector} = mapping;
		
		if (selector.startsWith('getByLabel')) {
			const label = selector.match(/getByLabel\('([^']+)'\)/)?.[1];
			if (label) return page.getByLabel(label);
		} else if (selector.startsWith('getByRole')) {
			const roleMatch = selector.match(/getByRole\('([^']+)',\s*\{name:\s*'([^']+)'\}\)/);
			if (roleMatch) {
				const [, role, name] = roleMatch;
				return page.getByRole(role as any, {name});
			}
		}
		
		// Fallback to text selector
		throw new Error(`Cannot parse selector: ${selector}`);
	}
	
	/**
	 * Check if a ref exists in current snapshot
	 */
	hasRef(ref: string): boolean {
		return this.refToSelector.has(ref);
	}
	
	/**
	 * Get all refs and their descriptions
	 */
	getAllRefs(): Array<{ref: string; description: string}> {
		return Array.from(this.refToSelector.entries()).map(([ref, mapping]) => ({
			ref,
			description: mapping.description,
		}));
	}
}