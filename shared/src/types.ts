import {
  CreateWorkflowInput,
  CritiqueResponse,
  DepthLevelEnum,
  QueryPlanningResponse,
  ResearchCategoryEnum,
  StepStatusEnum,
  StepTypeEnum,
  WorkflowStatusEnum
} from './schemas/workflow';
import { z } from 'zod';

export type WorkflowStatus = z.infer<typeof WorkflowStatusEnum>;
export type StepType = z.infer<typeof StepTypeEnum>;
export type StepStatus = z.infer<typeof StepStatusEnum>;
export type ResearchCategory = z.infer<typeof ResearchCategoryEnum>;
export type DepthLevel = z.infer<typeof DepthLevelEnum>;

export interface WorkflowConfiguration {
  customSearchQueries?: string[];
  excludedDomains?: string[];
  stylingTemplate?: string;
  accentColor?: string;
  immediateExecution?: boolean;
  maxSourcePages?: number;
  [key: string]: any;
}

export interface Workflow {
  id: string;
  user_id?: string | null;
  title: string;
  topic: string;
  category: ResearchCategory;
  depth_level: DepthLevel;
  status: WorkflowStatus;
  require_approval: boolean;
  recipients: string[];
  configuration: WorkflowConfiguration;
  raw_synthesis_markdown?: string | null;
  revised_synthesis_markdown?: string | null;
  final_html_report?: string | null;
  current_step_index: number;
  total_steps: number;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  steps?: WorkflowStep[];
  sources?: WorkflowSource[];
  logs?: WorkflowLog[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_type: StepType;
  step_order: number;
  status: StepStatus;
  input_payload?: any;
  output_payload?: any;
  error_details?: string | null;
  duration_ms?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface WorkflowSource {
  id: string;
  workflow_id: string;
  url: string;
  title?: string | null;
  snippet?: string | null;
  extracted_text?: string | null;
  status: 'FETCHED' | 'FAILED' | 'SKIPPED' | string;
  http_status_code?: number | null;
  tokens_estimate?: number | null;
  created_at: string;
}

export interface WorkflowLog {
  id: number | string;
  workflow_id: string;
  step_type?: StepType | null;
  log_level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: ResearchCategory;
  description: string;
  prompt_override?: string | null;
  styling_config?: Record<string, any>;
  is_default: boolean;
  created_at: string;
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  runningWorkflows: number;
  awaitingReviewWorkflows: number;
  successRate: number; // percentage 0 - 100
  averageDurationSeconds: number;
  activeScheduledJobs: number;
}

export type SSEEventType = 
  | 'CONNECTED'
  | 'HEARTBEAT'
  | 'STATUS_CHANGE'
  | 'STEP_START'
  | 'STEP_UPDATE'
  | 'STEP_COMPLETE'
  | 'STEP_FAILED'
  | 'LOG_APPEND'
  | 'DRAFT_UPDATED'
  | 'REPORT_RENDERED'
  | 'EMAIL_DISPATCHED'
  | 'WORKFLOW_COMPLETE'
  | 'WORKFLOW_FAILED'
  | 'WORKFLOW_CANCELLED';

export interface SSEMessagePayload {
  type: SSEEventType;
  workflowId: string;
  timestamp: string;
  data: any;
}

export interface KnowledgeEntity {
  title: string;
  description?: string;
  extract: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  source: 'wikipedia' | 'duckduckgo' | 'combined';
  relatedTopics?: Array<{ title: string; url?: string; snippet?: string }>;
  infobox?: Record<string, string>;
}
