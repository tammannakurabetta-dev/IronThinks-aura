import { useEffect, useRef } from 'react';
import {
  Workflow,
  WorkflowMetrics,
  WorkflowTemplate,
  WorkflowSource,
  CreateWorkflowInput,
  SSEMessagePayload,
  KnowledgeEntity
} from '@shared/index';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const workflowApi = {
  async getMetrics(): Promise<WorkflowMetrics> {
    const res = await fetch(`${API_BASE}/workflows/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getWorkflows(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ workflows: Workflow[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/workflows?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  async getWorkflowById(id: string): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/workflows/${id}`);
    if (!res.ok) throw new Error(`Workflow ${id} not found`);
    return res.json();
  },

  async createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to launch research workflow');
    }
    return res.json();
  },

  async updateDraft(id: string, data: { revisedMarkdown: string; recipients?: string[] }): Promise<Workflow> {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update draft');
    return res.json();
  },

  async startWorkflow(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/workflows/${id}/start`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start workflow');
    }
    return res.json();
  },

  async approveWorkflow(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/workflows/${id}/approve`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to approve workflow');
    }
    return res.json();
  },

  async retryWorkflow(id: string, stepOrder?: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/workflows/${id}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepOrder })
    });
    if (!res.ok) throw new Error('Failed to retry workflow');
    return res.json();
  },

  async cancelWorkflow(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/workflows/${id}/cancel`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to cancel workflow');
    return res.json();
  },

  async getSources(id: string): Promise<WorkflowSource[]> {
    const res = await fetch(`${API_BASE}/workflows/${id}/sources`);
    if (!res.ok) throw new Error('Failed to fetch sources');
    return res.json();
  },

  async sendTestEmail(id: string, recipient: string): Promise<{ message: string; result: any }> {
    const res = await fetch(`${API_BASE}/workflows/${id}/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send test email');
    }
    return res.json();
  },

  async getTemplates(): Promise<WorkflowTemplate[]> {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async verifyGemini(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings/verify-gemini`, {
      method: 'POST'
    });
    return res.json();
  },

  async verifyEmail(email: string): Promise<any> {
    const res = await fetch(`${API_BASE}/settings/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async searchKnowledge(query: string): Promise<KnowledgeEntity | null> {
    const clean = query.trim();
    if (!clean) return null;
    const res = await fetch(`${API_BASE}/knowledge/lookup?q=${encodeURIComponent(clean)}`);
    if (!res.ok) throw new Error('Failed to lookup knowledge entity');
    const data = await res.json();
    return data.entity || null;
  }
};

/**
 * Custom React Hook managing real-time Server-Sent Events (SSE) for a workflow
 */
export function useWorkflowSSE(
  workflowId: string | undefined,
  onEvent: (payload: SSEMessagePayload) => void
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!workflowId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      eventSource = new EventSource(`${API_BASE}/workflows/${workflowId}/stream`);

      const eventTypes = [
        'CONNECTED',
        'INITIAL_STATE',
        'STATUS_CHANGE',
        'STEP_START',
        'STEP_UPDATE',
        'STEP_COMPLETE',
        'STEP_FAILED',
        'LOG_APPEND',
        'DRAFT_UPDATED',
        'REPORT_RENDERED',
        'EMAIL_DISPATCHED',
        'WORKFLOW_COMPLETE',
        'WORKFLOW_FAILED',
        'WORKFLOW_CANCELLED'
      ];

      eventTypes.forEach(eventType => {
        eventSource?.addEventListener(eventType, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            onEventRef.current({
              type: eventType as any,
              workflowId: workflowId as string,
              timestamp: new Date().toISOString(),
              data
            });
          } catch (err) {
            console.error('Failed to parse SSE event data:', err);
          }
        });
      });

      eventSource.onerror = (err) => {
        console.warn('[SSE] Stream disconnected. Scheduling reconnect in 3s...', err);
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [workflowId]);
}
