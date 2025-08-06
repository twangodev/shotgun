import { Mastra } from '@mastra/core';
import { supervisorAgent } from './agents/SupervisorAgent';
import { applicationWorkflow, runApplicationWorkflow } from './workflows/ApplicationWorkflow';
import { SessionManager } from './session/SessionManager';
import { UserProfile } from './types';

// Create session manager instance
const sessionManager = new SessionManager();

// Initialize Mastra with agents and workflows
export const mastra = new Mastra({
  agents: {
    supervisor: supervisorAgent,
  },
  workflows: {
    jobApplication: applicationWorkflow,
  },
});

// Extend Mastra instance with session manager
(mastra as any).sessionManager = sessionManager;

// Export convenience functions for using the system

/**
 * Start a new job application session
 */
export async function startJobApplication(
  jobUrl: string,
  userProfile: UserProfile
): Promise<{
  sessionId: string;
  status: string;
  message: string;
}> {
  try {
    // Create a new session
    const sessionId = await sessionManager.createSession(jobUrl, userProfile);
    
    // Start the application workflow
    const result = await runApplicationWorkflow(sessionId, jobUrl, mastra);
    
    return {
      sessionId,
      status: result.success ? 'success' : 'needs_review',
      message: result.message,
    };
  } catch (error) {
    return {
      sessionId: '',
      status: 'error',
      message: `Failed to start application: ${error}`,
    };
  }
}

/**
 * Resume a suspended session
 */
export async function resumeSession(sessionId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await sessionManager.resumeSession(sessionId);
    
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Continue workflow from where it left off
    const result = await runApplicationWorkflow(
      sessionId,
      session.jobUrl,
      mastra
    );
    
    return {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to resume session: ${error}`,
    };
  }
}

/**
 * Get status of a session
 */
export function getSessionStatus(sessionId: string) {
  const session = sessionManager.getSession(sessionId);
  
  if (!session) {
    return {
      found: false,
      message: 'Session not found',
    };
  }
  
  return {
    found: true,
    status: session.status,
    progress: session.progress,
    jobUrl: session.jobUrl,
    formAnalysis: session.formAnalysis,
    validationResult: session.validationResult,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Get all active sessions
 */
export function getAllSessions() {
  return sessionManager.getAllSessions().map(session => ({
    id: session.id,
    status: session.status,
    jobUrl: session.jobUrl,
    progress: session.progress.currentPhase,
    createdAt: session.createdAt,
  }));
}

/**
 * Clean up a session
 */
export async function endSession(sessionId: string): Promise<void> {
  await sessionManager.destroySession(sessionId);
}

/**
 * Clean up all sessions (for shutdown)
 */
export async function cleanup(): Promise<void> {
  await sessionManager.cleanup();
}

// Example user profile for testing
export const exampleUserProfile: UserProfile = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
    },
  },
  professional: {
    currentTitle: 'Senior Software Engineer',
    yearsExperience: 5,
    company: 'TechCorp',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'Stanford University',
        year: 2018,
      },
    ],
  },
  documents: {
    resumeUrl: '/path/to/resume.pdf',
    coverLetterUrl: '/path/to/cover.pdf',
    portfolioUrl: 'https://johndoe.dev',
  },
  preferences: {
    desiredSalary: 150000,
    workAuthorization: 'US Citizen',
    availableStartDate: '2024-02-01',
  },
};

// Export types for external use
export * from './types';
export { SessionManager } from './session/SessionManager';
export { supervisorAgent } from './agents/SupervisorAgent';

console.log('=� Shotgun Jobs - Job Application Automation System');
console.log('=� Mastra instance initialized with:');
console.log('  - Supervisor Agent');
console.log('  - Application Workflow');
console.log('  - Multi-session support via MCP Playwright');
console.log('');
console.log('Usage:');
console.log('  const { sessionId } = await startJobApplication(jobUrl, userProfile);');
console.log('  const status = getSessionStatus(sessionId);');
console.log('');