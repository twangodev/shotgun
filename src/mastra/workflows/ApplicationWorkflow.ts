import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { 
  analyzeFormStructure, 
  fillFormFields, 
  validateBeforeSubmission
} from '../agents/SupervisorAgent';
import { SessionManager } from '../session/SessionManager';
import { SessionStatus } from '../types';

// Input schema for the workflow
const ApplicationWorkflowInput = z.object({
  sessionId: z.string(),
  jobUrl: z.string(),
});

// Output schema for the workflow
const ApplicationWorkflowOutput = z.object({
  success: z.boolean(),
  message: z.string(),
  formAnalysis: z.any().optional(),
  errors: z.array(z.string()).optional(),
});

// Step 1: Analyze job application form
const analyzeStep = createStep({
  id: 'analyze-form',
  inputSchema: z.object({
    sessionId: z.string(),
    jobUrl: z.string(),
  }),
  outputSchema: z.object({
    formAnalysis: z.any(),
    confidence: z.number(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { sessionId, jobUrl } = inputData;
    
    const sessionManager = (mastra as any).sessionManager as SessionManager;
    const mcpClient = sessionManager.getMCPClient(sessionId);
    const session = sessionManager.getSession(sessionId);
    
    if (!mcpClient || !session) {
      throw new Error(`Session ${sessionId} not properly initialized`);
    }
    
    // Get MCP toolsets for the agent to use
    const toolsets = await mcpClient.getToolsets();
    
    // Create runtime context with MCP tools
    const runtimeContext = sessionManager.createRuntimeContext(sessionId);
    runtimeContext.set('mcpTools', await mcpClient.getTools());
    
    // Let the supervisor agent navigate and analyze the form
    const formAnalysis = await analyzeFormStructure(
      jobUrl,
      runtimeContext,
      toolsets
    );
    
    // Update session with analysis
    sessionManager.updateSession(sessionId, {
      formAnalysis: formAnalysis as any,
      progress: {
        currentPhase: 'analysis_complete',
        completedSteps: ['analyze'],
        errors: [],
      },
    });
    
    return {
      formAnalysis,
      confidence: formAnalysis.confidence,
    };
  },
});

// Step 2: Fill form fields
const fillFormStep = createStep({
  id: 'fill-form',
  inputSchema: z.object({
    sessionId: z.string(),
    formAnalysis: z.any(),
  }),
  outputSchema: z.object({
    fieldMappings: z.any(),
    missingRequired: z.array(z.string()),
  }),
  execute: async ({ inputData, mastra }) => {
    const { sessionId, formAnalysis } = inputData;
    
    const sessionManager = (mastra as any).sessionManager as SessionManager;
    const mcpClient = sessionManager.getMCPClient(sessionId);
    
    if (!mcpClient) {
      throw new Error(`No MCP client found for session ${sessionId}`);
    }
    
    // Get MCP toolsets for the agent
    const toolsets = await mcpClient.getToolsets();
    
    // Create runtime context
    const runtimeContext = sessionManager.createRuntimeContext(sessionId);
    runtimeContext.set('mcpTools', await mcpClient.getTools());
    
    // Let the supervisor agent fill the form
    const fieldMappings = await fillFormFields(
      formAnalysis,
      runtimeContext,
      toolsets
    );
    
    // Update session with mappings
    sessionManager.updateSession(sessionId, {
      fieldMappings: fieldMappings.mappings as any,
      progress: {
        currentPhase: 'filling_complete',
        completedSteps: ['analyze', 'fill'],
        errors: [],
      },
    });
    
    return {
      fieldMappings: fieldMappings.mappings,
      missingRequired: fieldMappings.missingRequired,
    };
  },
});

// Step 3: Validate before submission
const validateStep = createStep({
  id: 'validate-form',
  inputSchema: z.object({
    sessionId: z.string(),
  }),
  outputSchema: z.object({
    decision: z.string(),
    reasoning: z.string(),
    requiresHumanInput: z.boolean(),
    issues: z.array(z.string()).optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { sessionId } = inputData;
    
    const sessionManager = (mastra as any).sessionManager as SessionManager;
    const mcpClient = sessionManager.getMCPClient(sessionId);
    
    if (!mcpClient) {
      throw new Error(`No MCP client found for session ${sessionId}`);
    }
    
    // Get MCP toolsets for the agent
    const toolsets = await mcpClient.getToolsets();
    
    // Create runtime context
    const runtimeContext = sessionManager.createRuntimeContext(sessionId);
    runtimeContext.set('mcpTools', await mcpClient.getTools());
    
    // Let the supervisor agent validate the form
    const validation = await validateBeforeSubmission(
      runtimeContext,
      toolsets
    );
    
    sessionManager.updateSession(sessionId, {
      validationResult: {
        isValid: validation.action === 'proceed',
        errors: validation.details?.issues?.map(issue => ({
          fieldId: 'unknown',
          message: issue,
          severity: 'error' as const,
        })) || [],
        warnings: [],
        completeness: validation.action === 'proceed' ? 1 : 0.5,
      },
      progress: {
        currentPhase: 'validation_complete',
        completedSteps: ['analyze', 'fill', 'validate'],
        errors: validation.details?.issues || [],
      },
    });
    
    return {
      decision: validation.action,
      reasoning: validation.reasoning,
      requiresHumanInput: validation.requiresHumanInput,
      issues: validation.details?.issues,
    };
  },
});

// Step 4: Human review (if needed)
const reviewStep = createStep({
  id: 'human-review',
  inputSchema: z.object({
    sessionId: z.string(),
    requiresHumanInput: z.boolean(),
    decision: z.string(),
    issues: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    modifications: z.any().optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { sessionId, requiresHumanInput, decision, issues } = inputData;
    
    if (!requiresHumanInput && decision === 'proceed') {
      return {
        approved: true,
        modifications: {},
      };
    }
    
    const sessionManager = (mastra as any).sessionManager as SessionManager;
    
    // Suspend session for human review
    await sessionManager.suspendSession(sessionId);
    
    // In a real implementation, this would wait for human input
    // For now, we'll just return that review is needed
    return {
      approved: false,
      modifications: {
        note: 'Human review required',
        issues,
        decision,
      },
    };
  },
});

// Create the workflow
export const applicationWorkflow = createWorkflow({
  id: 'job-application-workflow',
  inputSchema: ApplicationWorkflowInput,
  outputSchema: ApplicationWorkflowOutput,
});

// Define the workflow execution flow
applicationWorkflow
  .then(analyzeStep)
  .then(fillFormStep)
  .then(validateStep)
  .then(reviewStep)
  .commit();

// Export a function to execute the workflow
export async function runApplicationWorkflow(
  sessionId: string,
  jobUrl: string,
  mastra: any
) {
  try {
    const result = await applicationWorkflow.execute({
      inputData: { sessionId, jobUrl },
      mastra,
    });
    
    const finalStep = result.steps[result.steps.length - 1];
    const approved = finalStep?.output?.approved ?? false;
    
    return {
      success: approved,
      message: approved 
        ? 'Application ready for submission' 
        : 'Application requires human review',
      formAnalysis: result.steps[0]?.output?.formAnalysis,
      errors: finalStep?.output?.modifications?.issues,
    };
  } catch (error) {
    return {
      success: false,
      message: `Workflow failed: ${error}`,
      errors: [String(error)],
    };
  }
}