import { z } from 'zod';

export enum SessionStatus {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PHONE = 'phone',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  TEXTAREA = 'textarea',
  FILE = 'file'
}

export interface FormField {
  id: string;
  name: string;
  type: FieldType;
  label?: string;
  required: boolean;
  value?: any;
  options?: string[];
  placeholder?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface FormAnalysis {
  url: string;
  title: string;
  fields: FormField[];
  isMultiStep: boolean;
  currentStep?: number;
  totalSteps?: number;
  submitButton?: {
    selector: string;
    text: string;
  };
  confidence: number;
}

export interface FieldMapping {
  fieldId: string;
  profileKey: string;
  value: any;
  confidence: number;
  transformations?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    fieldId: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
  completeness: number;
}

export interface UserProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: {
      city: string;
      state: string;
      country: string;
    };
  };
  professional: {
    currentTitle: string;
    yearsExperience: number;
    company: string;
    skills: string[];
    education: Array<{
      degree: string;
      field: string;
      institution: string;
      year: number;
    }>;
  };
  documents: {
    resumeUrl?: string;
    coverLetterUrl?: string;
    portfolioUrl?: string;
  };
  preferences: {
    desiredSalary?: number;
    workAuthorization: string;
    availableStartDate?: string;
  };
}

export interface SessionState {
  id: string;
  status: SessionStatus;
  jobUrl: string;
  userProfile: UserProfile;
  formAnalysis?: FormAnalysis;
  fieldMappings?: FieldMapping[];
  validationResult?: ValidationResult;
  browserContext?: {
    tabId: string;
    currentUrl: string;
  };
  progress: {
    currentPhase: string;
    completedSteps: string[];
    errors: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibilityNode {
  role: string;
  name?: string;
  value?: string;
  description?: string;
  children?: AccessibilityNode[];
  attributes?: Record<string, any>;
}

// Zod schemas for agent inputs/outputs

export const AnalyzerInputSchema = z.object({
  accessibilityTree: z.string().describe('JSON string of accessibility tree'),
  url: z.string().url(),
  pageTitle: z.string().optional()
});

export const AnalyzerOutputSchema = z.object({
  fields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['text', 'email', 'phone', 'number', 'date', 'select', 'checkbox', 'radio', 'textarea', 'file']),
    label: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    placeholder: z.string().optional()
  })),
  isMultiStep: z.boolean(),
  currentStep: z.number().optional(),
  totalSteps: z.number().optional(),
  submitButton: z.object({
    selector: z.string(),
    text: z.string()
  }).optional(),
  confidence: z.number().min(0).max(1)
});

export const MapperInputSchema = z.object({
  formFields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    label: z.string().optional(),
    required: z.boolean()
  })),
  userProfile: z.object({
    personalInfo: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      phone: z.string()
    }).passthrough(),
    professional: z.object({
      currentTitle: z.string(),
      yearsExperience: z.number(),
      skills: z.array(z.string())
    }).passthrough()
  }).passthrough()
});

export const MapperOutputSchema = z.object({
  mappings: z.array(z.object({
    fieldId: z.string(),
    profileKey: z.string(),
    value: z.any(),
    confidence: z.number().min(0).max(1),
    transformations: z.array(z.string()).optional()
  })),
  unmappedFields: z.array(z.string()),
  suggestedValues: z.record(z.string(), z.any()).optional()
});

export const FillerInputSchema = z.object({
  field: z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    options: z.array(z.string()).optional()
  }),
  value: z.any(),
  context: z.object({
    jobTitle: z.string().optional(),
    company: z.string().optional()
  }).optional()
});

export const FillerOutputSchema = z.object({
  formattedValue: z.any(),
  fillStrategy: z.enum(['type', 'select', 'click', 'upload']),
  confidence: z.number().min(0).max(1),
  explanation: z.string().optional()
});

export const ValidatorInputSchema = z.object({
  formData: z.record(z.string(), z.any()),
  formFields: z.array(z.object({
    id: z.string(),
    required: z.boolean(),
    type: z.string(),
    validation: z.object({
      pattern: z.string().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional()
    }).optional()
  }))
});

export const ValidatorOutputSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    fieldId: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning'])
  })),
  completeness: z.number().min(0).max(1),
  suggestions: z.array(z.string()).optional()
});

export const SupervisorInputSchema = z.object({
  issue: z.string(),
  context: z.object({
    sessionId: z.string(),
    currentPhase: z.string(),
    previousErrors: z.array(z.string()).optional()
  }),
  options: z.array(z.string()).optional()
});

export const SupervisorOutputSchema = z.object({
  decision: z.enum(['retry', 'skip', 'escalate', 'abort', 'alternative']),
  action: z.string(),
  reasoning: z.string(),
  requiresHumanApproval: z.boolean()
});