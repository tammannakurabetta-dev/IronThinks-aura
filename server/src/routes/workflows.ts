import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateWorkflowSchema,
  UpdateDraftSchema,
  TestEmailSchema,
  RetryStepSchema,
  WorkflowStatusEnum
} from '@shared/index';
import { WorkflowRepository } from '../db/repository';
import { workflowEngine } from '../orchestrator/engine';
import { sseManager } from '../orchestrator/sseManager';
import { sendEmailReport } from '../lib/email';
import { renderMarkdownToEmailHtml } from '../lib/emailRenderer';

export const workflowRouter = Router();

// =========================================================================
// 1. GET /api/workflows/metrics - Dashboard Aggregate KPIs
// =========================================================================
workflowRouter.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await WorkflowRepository.getMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 2. POST /api/workflows - Create and kick off new research workflow
// =========================================================================
workflowRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = CreateWorkflowSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const input = parseResult.data;
    const workflow = await WorkflowRepository.createWorkflow(input);

    await WorkflowRepository.addLog(
      workflow.id,
      `Workflow "${workflow.title}" created with ${input.depthLevel} depth requirement.`,
      'INFO'
    );

    // Kick off asynchronous FSM execution if immediateExecution is true
    if (input.immediateExecution !== false) {
      workflowEngine.executeWorkflow(workflow.id);
    }

    return res.status(201).json(workflow);
  } catch (err: any) {
    console.error('Error creating workflow:', err);
    return res.status(500).json({ error: 'Failed to create research workflow: ' + err.message });
  }
});

// =========================================================================
// 3. GET /api/workflows - List workflows with filtering and pagination
// =========================================================================
workflowRouter.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string | undefined;
    const rawStatus = req.query.status as string | undefined;

    let status = undefined;
    if (rawStatus && WorkflowStatusEnum.safeParse(rawStatus).success) {
      status = rawStatus as any;
    }

    const result = await WorkflowRepository.getWorkflows({ page, limit, status, search });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 4. GET /api/workflows/:id/stream - Server-Sent Events (SSE) Live Feed
// =========================================================================
workflowRouter.get('/:id/stream', async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const workflow = await WorkflowRepository.getWorkflowById(id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable proxy buffering (Nginx)
  });

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const clientId = uuidv4();
  sseManager.registerClient(id, clientId, res);

  // Send current state immediately on connect
  res.write(`event: INITIAL_STATE\n`);
  res.write(`data: ${JSON.stringify({ workflow })}\n\n`);

  // Request keep-alive
  req.on('close', () => {
    sseManager.removeClient(id, clientId);
  });
});

// =========================================================================
// 5. GET /api/workflows/:id - Complete Detail Record
// =========================================================================
workflowRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const workflow = await WorkflowRepository.getWorkflowById(id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    return res.json(workflow);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 6. PATCH /api/workflows/:id - Update draft markdown or config
// =========================================================================
workflowRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await WorkflowRepository.getWorkflowById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const parseResult = UpdateDraftSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const { revisedMarkdown, recipients } = parseResult.data;

    // Re-render email HTML with revised markdown
    let regeneratedHtml: string | undefined = undefined;
    try {
      const sources = existing.sources || (await WorkflowRepository.getSources(id));
      regeneratedHtml = await renderMarkdownToEmailHtml(revisedMarkdown, {
        title: existing.title,
        category: existing.category,
        depthLevel: existing.depth_level,
        accentColor: existing.configuration?.accentColor || '#0284c7',
        sources: sources.map(s => ({ title: s.title, url: s.url })),
        showConfidenceScore: true,
        confidenceScore: 95
      });
    } catch (e: any) {
      console.warn(`[workflows] HTML re-render fallback:`, e.message);
    }

    const updated = await WorkflowRepository.updateWorkflow(id, {
      revised_synthesis_markdown: revisedMarkdown,
      recipients: recipients || existing.recipients,
      ...(regeneratedHtml ? { final_html_report: regeneratedHtml } : {})
    });

    await WorkflowRepository.addLog(
      id,
      'Draft briefing updated with human revisions via interactive editor.',
      'INFO'
    );

    sseManager.broadcast(id, 'DRAFT_UPDATED', {
      draft: revisedMarkdown,
      humanEdited: true,
      htmlReport: regeneratedHtml
    });

    if (regeneratedHtml) {
      sseManager.broadcast(id, 'REPORT_RENDERED', {
        htmlLength: regeneratedHtml.length
      });
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 7. POST /api/workflows/:id/start - Explicitly start or resume workflow execution
// =========================================================================
workflowRouter.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await WorkflowRepository.getWorkflowById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    workflowEngine.executeWorkflow(id);
    return res.json({ message: `Workflow ${id} execution started.` });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// 8. POST /api/workflows/:id/approve - Advance from AWAITING_REVIEW
// =========================================================================
workflowRouter.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await workflowEngine.approveWorkflow(id);
    return res.json({ message: 'Workflow approved. Advancing to render and delivery.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// 8. POST /api/workflows/:id/retry - Manual retry of a stage
// =========================================================================
workflowRouter.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parseResult = RetryStepSchema.safeParse(req.body);
    const stepOrder = parseResult.success ? parseResult.data.stepOrder : undefined;

    await workflowEngine.retryWorkflow(id, stepOrder);
    return res.json({ message: `Retry triggered for workflow ${id}` });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// 9. POST /api/workflows/:id/cancel - Abort active execution
// =========================================================================
workflowRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await workflowEngine.cancelWorkflow(id);
    return res.json({ message: `Workflow ${id} cancelled.` });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// 10. GET /api/workflows/:id/sources - Get ingested web sources
// =========================================================================
workflowRouter.get('/:id/sources', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const sources = await WorkflowRepository.getSources(id);
    return res.json(sources);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 11. POST /api/workflows/:id/test-email - Send a test email of current report
// =========================================================================
workflowRouter.post('/:id/test-email', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parseResult = TestEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors
      });
    }

    const { recipient } = parseResult.data;
    const wf = await WorkflowRepository.getWorkflowById(id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    // Ensure we have rendered HTML
    let html = wf.final_html_report;
    if (!html) {
      const markdown = wf.revised_synthesis_markdown || wf.raw_synthesis_markdown || 'No content synthesized yet.';
      const sources = wf.sources || (await WorkflowRepository.getSources(id));
      html = await renderMarkdownToEmailHtml(markdown, {
        title: wf.title,
        category: wf.category,
        depthLevel: wf.depth_level,
        accentColor: wf.configuration?.accentColor || '#0284c7',
        sources: sources.map(s => ({ title: s.title, url: s.url }))
      });
    }

    const result = await sendEmailReport({
      to: [recipient],
      subject: `[TEST PREVIEW] ${wf.title}`,
      html
    });

    await WorkflowRepository.addLog(
      id,
      `Sent test email preview to ${recipient} (Provider: ${result.provider}).`,
      'INFO'
    );

    return res.json({
      message: `Test email sent to ${recipient}`,
      result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
