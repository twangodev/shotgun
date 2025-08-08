import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { UserData } from '../orchestrator';

/**
 * Field Matcher Utility
 * 
 * Uses cheap models (GPT-3.5-turbo) for simple field matching.
 * Maps form field labels to user data values.
 */

/**
 * Match a field to user data value (CHEAP)
 */
export async function matchFieldToValue(
  fieldLabel: string,
  fieldType: string,
  userData: UserData
): Promise<string | undefined> {
  // First try simple pattern matching
  const value = simpleMatch(fieldLabel, fieldType, userData);
  if (value) return value;

  // If no simple match, use GPT-3.5 for fuzzy matching
  const prompt = `Match this form field to user data.

Field: "${fieldLabel}" (type: ${fieldType})

User Data:
- Full Name: ${userData.fullName}
- Email: ${userData.email}
- Phone: ${userData.phone}
- Location: ${userData.location}
- Current Role: ${userData.currentRole}
- Years Experience: ${userData.yearsExperience}
- Education: ${userData.education}
${userData.linkedIn ? `- LinkedIn: ${userData.linkedIn}` : ''}
${userData.github ? `- GitHub: ${userData.github}` : ''}
${userData.salaryExpectation ? `- Salary: $${userData.salaryExpectation.min}-$${userData.salaryExpectation.max}` : ''}

Return ONLY the value to fill, or "SKIP" if no match.`;

  const result = await generateText({
    model: openai('gpt-3.5-turbo'),
    prompt,
    temperature: 0,
  });

  const matched = result.text.trim();
  return matched === 'SKIP' ? undefined : matched;
}

/**
 * Simple pattern matching without AI
 */
function simpleMatch(
  fieldLabel: string,
  fieldType: string,
  userData: UserData
): string | undefined {
  const label = fieldLabel.toLowerCase();
  
  // Name matching
  if (label.includes('first') && label.includes('name')) {
    return userData.fullName.split(' ')[0];
  }
  if (label.includes('last') && label.includes('name')) {
    return userData.fullName.split(' ').slice(1).join(' ');
  }
  if (label.includes('full') && label.includes('name')) {
    return userData.fullName;
  }
  if (label === 'name' || (label.includes('name') && !label.includes('company'))) {
    return userData.fullName;
  }
  
  // Contact matching
  if (fieldType === 'email' || label.includes('email')) {
    return userData.email;
  }
  if (fieldType === 'tel' || label.includes('phone') || label.includes('mobile')) {
    return userData.phone;
  }
  
  // Location matching
  if (label.includes('location') || label.includes('city') || label.includes('address')) {
    return userData.location;
  }
  
  // Professional matching
  if (label.includes('current') && (label.includes('role') || label.includes('position') || label.includes('title'))) {
    return userData.currentRole;
  }
  if (label.includes('experience') || label.includes('years')) {
    if (label.includes('year')) {
      return userData.yearsExperience.toString();
    }
  }
  
  // Education matching
  if (label.includes('education') || label.includes('degree') || label.includes('university')) {
    return userData.education;
  }
  
  // Links matching
  if (label.includes('linkedin')) {
    return userData.linkedIn;
  }
  if (label.includes('github')) {
    return userData.github;
  }
  
  // Salary matching
  if (label.includes('salary') || label.includes('compensation')) {
    if (userData.salaryExpectation) {
      if (label.includes('min')) {
        return userData.salaryExpectation.min.toString();
      }
      if (label.includes('max')) {
        return userData.salaryExpectation.max.toString();
      }
      return `${userData.salaryExpectation.min}-${userData.salaryExpectation.max}`;
    }
  }
  
  return undefined;
}

/**
 * Batch match multiple fields (CHEAP)
 */
export async function batchMatchFields(
  fields: Array<{ label: string; type: string }>,
  userData: UserData
): Promise<Map<string, string>> {
  const matches = new Map<string, string>();
  
  // Process in parallel for speed
  const promises = fields.map(async field => {
    const value = await matchFieldToValue(field.label, field.type, userData);
    if (value) {
      matches.set(field.label, value);
    }
  });
  
  await Promise.all(promises);
  return matches;
}

/**
 * Check if field type requires special handling
 */
export function needsSpecialHandling(fieldType: string): boolean {
  const specialTypes = ['file', 'checkbox', 'radio', 'select', 'date'];
  return specialTypes.includes(fieldType);
}

/**
 * Format value for specific field type
 */
export function formatValueForField(
  value: string,
  fieldType: string
): string {
  switch (fieldType) {
    case 'tel':
      // Ensure phone format
      return value.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    
    case 'email':
      // Ensure lowercase email
      return value.toLowerCase();
    
    case 'number':
      // Extract numbers only
      return value.replace(/[^\d]/g, '');
    
    case 'date':
      // Try to format as YYYY-MM-DD
      // This is simplified - in production would need better date parsing
      return value;
    
    default:
      return value;
  }
}