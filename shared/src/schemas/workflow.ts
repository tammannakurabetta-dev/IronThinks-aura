import { z } from 'zod';

export const WorkflowStatusEnum = z.enum([
  'DRAFT',
  'QUEUED',
  'RUNNING',
  'AWAITING_REVIEW',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

export const StepTypeEnum = z.enum([
  'PLAN_EXPANSION',
  'WEB_SCRAPE',
  'SYNTHESIS',
  'CRITIQUE_REVISE',
  'HTML_RENDER',
  'EMAIL_DISPATCH'
]);

export const StepStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'SKIPPED'
]);

export const ResearchCategoryEnum = z.enum([
  'MARKET_INTEL',
  'TECH_FEASIBILITY',
  'REGULATORY',
  'EXECUTIVE_SCAN'
]);

export const DepthLevelEnum = z.enum([
  'BRIEF',
  'STANDARD',
  'COMPREHENSIVE'
]);

export const CreateWorkflowSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  topic: z.string().min(10, "Please describe your research objective in at least 10 characters").max(1000),
  category: ResearchCategoryEnum.default('EXECUTIVE_SCAN'),
  depthLevel: DepthLevelEnum.default('STANDARD'),
  recipients: z.array(z.string().email("Invalid recipient email address")).min(1, "At least one recipient is required").max(10),
  requireApproval: z.boolean().default(true),
  customSearchQueries: z.array(z.string()).optional(),
  excludedDomains: z.array(z.string()).optional(),
  stylingTemplate: z.string().optional().default('Executive Brief'),
  accentColor: z.string().optional().default('#0284c7'),
  immediateExecution: z.boolean().optional().default(true)
});

export const QueryPlanningResponseSchema = z.object({
  reFramedTopic: z.string(),
  searchQueries: z.array(z.string()).min(1).max(5),
  priorityEntities: z.array(z.string()),
  rationale: z.string()
});

export const CritiqueResponseSchema = z.object({
  critiqueNotes: z.array(z.string()),
  factualAccuracyScore: z.number().int().min(1).max(100),
  structuralIntegrityScore: z.number().int().min(1).max(100),
  revisedMarkdown: z.string().min(50)
});

export const UpdateDraftSchema = z.object({
  revisedMarkdown: z.string().min(20, "Draft content cannot be empty."),
  recipients: z.array(z.string().email()).optional()
});

export const TestEmailSchema = z.object({
  recipient: z.string().email("Invalid test recipient email address")
});

export const RetryStepSchema = z.object({
  stepOrder: z.number().int().min(1).max(6).optional(),
  parameterOverrides: z.record(z.any()).optional()
});

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
export type QueryPlanningResponse = z.infer<typeof QueryPlanningResponseSchema>;
export type CritiqueResponse = z.infer<typeof CritiqueResponseSchema>;
export type UpdateDraftInput = z.infer<typeof UpdateDraftSchema>;
export type TestEmailInput = z.infer<typeof TestEmailSchema>;
export type RetryStepInput = z.infer<typeof RetryStepSchema>;
