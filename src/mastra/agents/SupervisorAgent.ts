import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { RuntimeContext } from '@mastra/core/di';
import { createTool } from '@mastra/core/tools';

const instructions = ({ runtimeContext }: { runtimeContext: RuntimeContext }) => {
  const sessionId = runtimeContext.get('sessionId');
  const userProfile = runtimeContext.get('userProfile');
  
  return `You are the Supervisor Agent for an intelligent job application automation system.
  
Session ID: ${sessionId}

Your responsibilities:
1. Analyze job application forms to understand their structure
2. Map form fields to user profile data
3. Determine the correct values and formats for each field
4. Validate data before submission
5. Handle exceptions and make strategic decisions

User Profile Available:
${userProfile ? JSON.stringify(userProfile, null, 2) : 'No profile loaded'}

Decision-Making Guidelines:
- Prioritize accuracy over speed
- Flag ambiguous situations for human review
- Provide clear reasoning for your decisions
- Consider edge cases and platform-specific quirks
- Always validate data completeness before submission

When analyzing forms:
- Identify all interactive elements (inputs, selects, buttons)
- Detect multi-step workflows
- Recognize common ATS patterns (Workday, Greenhouse, Lever, etc.)
- Extract field requirements and validation rules

When filling forms:
- Match fields semantically, not just by exact names
- Format data appropriately (dates, phones, etc.)
- Handle conditional fields intelligently
- Suggest values for missing information

Error Handling:
- If a field cannot be mapped: suggest alternatives or flag for manual input
- If validation fails: provide specific error details
- If page structure is unclear: request human assistance
- If critical data is missing: escalate to user

Output clear, actionable decisions with confidence scores.`;
};

// Agent with dynamic tools based on runtime context
export const supervisorAgent = new Agent({
  name: 'supervisor',
  description: 'Main agent that coordinates job application automation with browser control',
  instructions,
  model: openai('gpt-4o'),
  tools: async ({ runtimeContext }: { runtimeContext: RuntimeContext }) => {
    // Get MCP tools from runtime context if available
    const mcpTools = runtimeContext?.get('mcpTools') || {};
    return mcpTools;
  },
});

// Schema for form analysis
export const FormAnalysisSchema = z.object({
  fields: z.array(z.object({
    selector: z.string().describe('CSS selector or identifier for the field'),
    name: z.string().describe('Field name or label'),
    type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'radio', 'textarea', 'file', 'date', 'number']),
    required: z.boolean(),
    value: z.any().optional(),
    options: z.array(z.string()).optional(),
  })),
  isMultiStep: z.boolean(),
  submitButton: z.object({
    selector: z.string(),
    text: z.string()
  }).optional(),
  confidence: z.number().min(0).max(1)
});

// Schema for field mapping decisions
export const FieldMappingSchema = z.object({
  mappings: z.array(z.object({
    fieldSelector: z.string(),
    profileValue: z.any(),
    transformation: z.string().optional().describe('How to transform the value'),
    confidence: z.number().min(0).max(1)
  })),
  missingRequired: z.array(z.string()).describe('Required fields with no data'),
  suggestions: z.record(z.string(), z.any()).optional()
});

// Schema for strategic decisions
export const StrategicDecisionSchema = z.object({
  action: z.enum(['proceed', 'review', 'abort', 'retry', 'escalate']),
  reasoning: z.string(),
  details: z.object({
    issues: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
    nextSteps: z.array(z.string()).optional()
  }).optional(),
  requiresHumanInput: z.boolean()
});

// Helper functions for specific tasks

export async function analyzeFormStructure(
  url: string,
  runtimeContext: RuntimeContext,
  toolsets?: any
) {
  const result = await supervisorAgent.generate(
    `Navigate to ${url} and analyze the job application form structure.
    
Steps:
1. Use browser_navigate to go to the URL
2. Use browser_snapshot to get the accessibility tree
3. Analyze the form structure and identify all fields
4. Return structured analysis

Identify all fields, their types, and requirements.`,
    {
      experimental_output: FormAnalysisSchema,
      runtimeContext,
      toolsets
    }
  );
  
  return result.object;
}

export async function fillFormFields(
  formAnalysis: any,
  runtimeContext: RuntimeContext,
  toolsets?: any
) {
  const userProfile = runtimeContext.get('userProfile');
  
  const result = await supervisorAgent.generate(
    `Fill the form fields with the user profile data.
    
Steps:
1. Map each form field to the appropriate user profile data
2. Use browser_type for text fields
3. Use browser_select_option for dropdowns
4. Use browser_click for checkboxes/radio buttons
5. Format data appropriately (dates, phones, etc.)
    
Form Fields:
${JSON.stringify(formAnalysis, null, 2)}

User Profile:
${JSON.stringify(userProfile, null, 2)}

Fill each field with the appropriate value and return the mapping decisions.`,
    {
      experimental_output: FieldMappingSchema,
      runtimeContext,
      toolsets
    }
  );
  
  return result.object;
}

export async function makeStrategicDecision(
  situation: string,
  context: any,
  runtimeContext: RuntimeContext
) {
  const result = await supervisorAgent.generate(
    `Make a strategic decision for this situation:
    
Situation: ${situation}

Context:
${JSON.stringify(context, null, 2)}

Consider all factors and provide a clear decision with reasoning.`,
    {
      experimental_output: StrategicDecisionSchema,
      runtimeContext
    }
  );
  
  return result.object;
}

export async function validateBeforeSubmission(
  runtimeContext: RuntimeContext,
  toolsets?: any
) {
  const result = await supervisorAgent.generate(
    `Validate the current form before submission.
    
Steps:
1. Use browser_snapshot to get current form state
2. Check all required fields are filled
3. Validate data formats and completeness
4. Take a screenshot for review

Provide a decision on whether to proceed with submission or what issues need to be addressed.`,
    {
      experimental_output: StrategicDecisionSchema,
      runtimeContext,
      toolsets
    }
  );
  
  return result.object;
}