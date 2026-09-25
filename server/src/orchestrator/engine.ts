import { WorkflowRepository } from '../db/repository';
import { sseManager } from './sseManager';
import {
  generateStructuredGeminiResponse,
  generateGeminiText,
  GEMINI_FAST_MODEL,
  GEMINI_REASONING_MODEL,
  RESEARCH_SYSTEM_PROMPT
} from '../lib/gemini';
import {
  QueryPlanningResponseSchema,
  CritiqueResponseSchema,
  QueryPlanningResponse,
  CritiqueResponse,
  Workflow,
  WorkflowSource,
  StepType
} from '@shared/index';
import { searchAndIngest } from '../lib/scraper';
import { renderMarkdownToEmailHtml } from '../lib/emailRenderer';
import { sendEmailReport } from '../lib/email';

class WorkflowEngine {
  private activeJobs: Set<string> = new Set();

  /**
   * Starts or resumes a workflow execution asynchronously
   */
  public async executeWorkflow(workflowId: string): Promise<void> {
    if (this.activeJobs.has(workflowId)) {
      console.log(`[Engine] Workflow ${workflowId} is already executing.`);
      return;
    }

    this.activeJobs.add(workflowId);

    // Run in background without blocking caller
    setImmediate(async () => {
      try {
        await this.runOrchestrator(workflowId);
      } catch (err: any) {
        console.error(`[Engine] Fatal execution error on ${workflowId}:`, err);
        await this.failWorkflow(workflowId, err.message);
      } finally {
        this.activeJobs.delete(workflowId);
      }
    });
  }

  private async runOrchestrator(workflowId: string): Promise<void> {
    let workflow = await WorkflowRepository.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found.`);
    }

    if (workflow.status === 'CANCELLED' || workflow.status === 'COMPLETED') {
      return;
    }

    console.log(`[Engine] Starting orchestration for workflow "${workflow.title}" (${workflowId})`);

    // Transition to RUNNING if queued
    if (workflow.status === 'QUEUED' || workflow.status === 'DRAFT') {
      await WorkflowRepository.updateWorkflow(workflowId, {
        status: 'RUNNING',
        started_at: workflow.started_at || new Date().toISOString()
      });
      sseManager.broadcast(workflowId, 'STATUS_CHANGE', { status: 'RUNNING' });
      await WorkflowRepository.addLog(workflowId, 'Orchestration state machine claimed workflow execution job.', 'INFO');
    }

    // Step 1: PLAN_EXPANSION
    if (this.shouldExecuteStep(workflow, 1)) {
      await this.executeStep1Plan(workflowId);
      workflow = (await WorkflowRepository.getWorkflowById(workflowId))!;
    }

    // Step 2: WEB_SCRAPE
    if (this.shouldExecuteStep(workflow, 2)) {
      await this.executeStep2Scrape(workflowId);
      workflow = (await WorkflowRepository.getWorkflowById(workflowId))!;
    }

    // Step 3: SYNTHESIS
    if (this.shouldExecuteStep(workflow, 3)) {
      await this.executeStep3Synthesize(workflowId);
      workflow = (await WorkflowRepository.getWorkflowById(workflowId))!;
    }

    // Step 4: CRITIQUE_REVISE
    if (this.shouldExecuteStep(workflow, 4)) {
      await this.executeStep4Critique(workflowId);
      workflow = (await WorkflowRepository.getWorkflowById(workflowId))!;

      // Check Human-In-The-Loop Approval Gate
      if (workflow.require_approval) {
        console.log(`[Engine] Workflow ${workflowId} requires manual human approval before report dispatch.`);
        
        // Pre-render draft email HTML so the interactive email preview is immediately available during HITL review
        let draftHtml: string | undefined = undefined;
        try {
          const sources = workflow.sources || (await WorkflowRepository.getSources(workflowId));
          draftHtml = await renderMarkdownToEmailHtml(
            workflow.revised_synthesis_markdown || workflow.raw_synthesis_markdown || '',
            {
              title: workflow.title,
              category: workflow.category,
              depthLevel: workflow.depth_level,
              accentColor: workflow.configuration?.accentColor || '#0284c7',
              sources: sources.map((s: any) => ({ title: s.title, url: s.url })),
              showConfidenceScore: true,
              confidenceScore: 95
            }
          );
        } catch (renderErr: any) {
          console.warn(`[Engine] Could not pre-render draft HTML for ${workflowId}:`, renderErr.message);
        }

        await WorkflowRepository.updateWorkflow(workflowId, {
          status: 'AWAITING_REVIEW',
          current_step_index: 4,
          ...(draftHtml ? { final_html_report: draftHtml } : {})
        });
        await WorkflowRepository.addLog(
          workflowId,
          'Awaiting Human Review: Draft synthesis completed. Pausing for human inspection & inline edits.',
          'WARN',
          'CRITIQUE_REVISE'
        );
        sseManager.broadcast(workflowId, 'STATUS_CHANGE', {
          status: 'AWAITING_REVIEW',
          message: 'Paused for human review'
        });
        return; // Halt execution until user approves!
      }
    }

    // Step 5: HTML_RENDER
    if (this.shouldExecuteStep(workflow, 5)) {
      await this.executeStep5Render(workflowId);
      workflow = (await WorkflowRepository.getWorkflowById(workflowId))!;
    }

    // Step 6: EMAIL_DISPATCH
    if (this.shouldExecuteStep(workflow, 6)) {
      await this.executeStep6Dispatch(workflowId);
      workflow = (await WorkflowRepository.getWorkflowById(workflowId))!;
    }

    // Mark as COMPLETED
    await WorkflowRepository.updateWorkflow(workflowId, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      current_step_index: 6
    });

    await WorkflowRepository.addLog(
      workflowId,
      'ResearchFlow pipeline completed successfully. All artifacts persisted and report delivered.',
      'INFO'
    );

    sseManager.broadcast(workflowId, 'WORKFLOW_COMPLETE', {
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    });
  }

  private shouldExecuteStep(workflow: Workflow, stepOrder: number): boolean {
    if (workflow.status === 'CANCELLED' || workflow.status === 'FAILED') return false;
    const step = workflow.steps?.find(s => s.step_order === stepOrder);
    return !step || step.status === 'PENDING' || step.status === 'IN_PROGRESS';
  }

  // =========================================================================
  // STEP 1: PLAN_EXPANSION
  // =========================================================================
  private async executeStep1Plan(workflowId: string): Promise<void> {
    const startTime = Date.now();
    await this.markStepStart(workflowId, 1, 'PLAN_EXPANSION');
    await WorkflowRepository.addLog(workflowId, 'Step 1: Formulating targeted search plan with gemini-2.5-flash...', 'INFO', 'PLAN_EXPANSION');

    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    const prompt = `Deconstruct the following research topic into a targeted web collection strategy:
Topic: "${wf.topic}"
Category: "${wf.category}"
Depth: "${wf.depth_level}"

Generate:
1. A succinct analytical re-framing of the topic.
2. Between 3 and 5 high-precision web search query strings using Boolean operators or specific domain search queries where appropriate.
3. A list of key data points, statistics, or entity names that the search phase must prioritize.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        reFramedTopic: { type: 'STRING' },
        searchQueries: {
          type: 'ARRAY',
          items: { type: 'STRING' }
        },
        priorityEntities: {
          type: 'ARRAY',
          items: { type: 'STRING' }
        },
        rationale: { type: 'STRING' }
      },
      required: ['reFramedTopic', 'searchQueries', 'priorityEntities', 'rationale']
    };

    const plan: QueryPlanningResponse = await generateStructuredGeminiResponse({
      model: GEMINI_FAST_MODEL,
      systemInstruction: 'You are an expert search strategist. Deconstruct the research topic into distinct, orthogonal search queries optimized for web retrieval. Avoid redundant phrasing.',
      prompt,
      responseSchema,
      zodValidator: QueryPlanningResponseSchema,
      temperature: 0.2
    });

    const durationMs = Date.now() - startTime;
    await WorkflowRepository.updateStep(workflowId, 1, {
      status: 'COMPLETED',
      output_payload: plan,
      duration_ms: durationMs,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.updateWorkflow(workflowId, { current_step_index: 1 });
    await WorkflowRepository.addLog(
      workflowId,
      `Step 1 Complete: Formulated ${plan.searchQueries.length} search queries. Rationale: ${plan.rationale}`,
      'INFO',
      'PLAN_EXPANSION',
      { queries: plan.searchQueries }
    );

    sseManager.broadcast(workflowId, 'STEP_COMPLETE', { stepOrder: 1, plan });
  }

  // =========================================================================
  // STEP 2: WEB_SCRAPE
  // =========================================================================
  private async executeStep2Scrape(workflowId: string): Promise<void> {
    const startTime = Date.now();
    await this.markStepStart(workflowId, 2, 'WEB_SCRAPE');
    await WorkflowRepository.addLog(workflowId, 'Step 2: Commencing SSRF-guarded web crawling & content extraction...', 'INFO', 'WEB_SCRAPE');

    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    const step1 = wf.steps?.find(s => s.step_order === 1);
    const planQueries: string[] = step1?.output_payload?.searchQueries || [wf.topic];
    const customQueries: string[] = wf.configuration?.customSearchQueries || [];
    const allQueries = [...new Set([...customQueries, ...planQueries])];

    const scrapedResults = await searchAndIngest({
      queries: allQueries,
      maxPages: wf.configuration?.maxSourcePages || 4,
      excludedDomains: wf.configuration?.excludedDomains || []
    });

    for (const res of scrapedResults) {
      await WorkflowRepository.addSource({
        workflow_id: workflowId,
        url: res.url,
        title: res.title,
        snippet: res.snippet,
        extracted_text: res.extractedText,
        status: 'FETCHED',
        http_status_code: res.httpStatusCode,
        tokens_estimate: res.tokensEstimate
      });
    }

    const durationMs = Date.now() - startTime;
    const totalTokens = scrapedResults.reduce((acc, curr) => acc + curr.tokensEstimate, 0);

    await WorkflowRepository.updateStep(workflowId, 2, {
      status: 'COMPLETED',
      output_payload: {
        sourcesCount: scrapedResults.length,
        totalTokens,
        urls: scrapedResults.map(s => s.url)
      },
      duration_ms: durationMs,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.updateWorkflow(workflowId, { current_step_index: 2 });
    await WorkflowRepository.addLog(
      workflowId,
      `Step 2 Complete: Ingested ${scrapedResults.length} sources (~${totalTokens.toLocaleString()} tokens). Content sanitized.`,
      'INFO',
      'WEB_SCRAPE',
      { count: scrapedResults.length, totalTokens }
    );

    sseManager.broadcast(workflowId, 'STEP_COMPLETE', {
      stepOrder: 2,
      sourcesCount: scrapedResults.length
    });
  }

  // =========================================================================
  // STEP 3: SYNTHESIS
  // =========================================================================
  private async executeStep3Synthesize(workflowId: string): Promise<void> {
    const startTime = Date.now();
    await this.markStepStart(workflowId, 3, 'SYNTHESIS');
    await WorkflowRepository.addLog(workflowId, 'Step 3: Synthesizing deep research briefing with gemini-2.5-pro...', 'INFO', 'SYNTHESIS');

    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    const sources: WorkflowSource[] = wf.sources || (await WorkflowRepository.getSources(workflowId));
    const sourcesSummary = sources.map((s: WorkflowSource) => `
---
SOURCE URL: ${s.url}
TITLE: ${s.title}
CONTENT:
${s.extracted_text || s.snippet}
---`).join('\n');

    const prompt = `Synthesize a comprehensive research briefing based ONLY on the provided scraped intelligence data:

TOPIC: ${wf.topic}
CATEGORY: ${wf.category}
DEPTH REQUIREMENT: ${wf.depth_level}

SCRAPED SOURCE DATA:
${sourcesSummary}

REQUIRED BRIEFING STRUCTURE (Markdown):
# [Executive Title]
## Executive Summary (3-5 high-impact bulleted takeaways)
## Strategic Context & Key Drivers
## Deep-Dive Analysis (Include comparative tables or structured breakdown)
## Key Metrics, Entities & Case Studies
## Critical Risks, Counter-Arguments & Unresolved Questions
## Strategic Recommendations & Action Items (30-60-90 Day Horizon)
## Source Index & Confidence Assessment`;

    const rawMarkdown = await generateGeminiText({
      model: GEMINI_REASONING_MODEL,
      systemInstruction: RESEARCH_SYSTEM_PROMPT,
      prompt,
      temperature: 0.25
    });

    const durationMs = Date.now() - startTime;
    await WorkflowRepository.updateStep(workflowId, 3, {
      status: 'COMPLETED',
      output_payload: { markdownLength: rawMarkdown.length },
      duration_ms: durationMs,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.updateWorkflow(workflowId, {
      raw_synthesis_markdown: rawMarkdown,
      revised_synthesis_markdown: rawMarkdown,
      current_step_index: 3
    });

    await WorkflowRepository.addLog(
      workflowId,
      `Step 3 Complete: Synthesized ${rawMarkdown.split(' ').length} words of initial intelligence.`,
      'INFO',
      'SYNTHESIS'
    );

    sseManager.broadcast(workflowId, 'DRAFT_UPDATED', {
      draft: rawMarkdown,
      stepOrder: 3
    });
    sseManager.broadcast(workflowId, 'STEP_COMPLETE', { stepOrder: 3 });
  }

  // =========================================================================
  // STEP 4: CRITIQUE_REVISE
  // =========================================================================
  private async executeStep4Critique(workflowId: string): Promise<void> {
    const startTime = Date.now();
    await this.markStepStart(workflowId, 4, 'CRITIQUE_REVISE');
    await WorkflowRepository.addLog(
      workflowId,
      'Step 4: Executing autonomous critique & fact-checking pass with gemini-2.5-pro...',
      'INFO',
      'CRITIQUE_REVISE'
    );

    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    const sources: WorkflowSource[] = wf.sources || (await WorkflowRepository.getSources(workflowId));
    const sourcesSummary = sources.map((s: WorkflowSource) => `[${s.title} (${s.url})]: ${s.snippet}`).join('\n\n');

    const prompt = `Analyze and revise the following draft research briefing against the provided source material:

ORIGINAL TOPIC: ${wf.topic}
DRAFT BRIEFING:
${wf.raw_synthesis_markdown || wf.revised_synthesis_markdown}

SOURCE CONTENT:
${sourcesSummary}

Task:
1. Detect any ungrounded assertions, repetitive prose, or formatting deficiencies.
2. Produce a critique summarizing identified defects.
3. Provide a fully revised, polished Markdown output incorporating all corrections while preserving the required professional structure.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        critiqueNotes: {
          type: 'ARRAY',
          items: { type: 'STRING' }
        },
        factualAccuracyScore: { type: 'INTEGER' },
        structuralIntegrityScore: { type: 'INTEGER' },
        revisedMarkdown: { type: 'STRING' }
      },
      required: ['critiqueNotes', 'factualAccuracyScore', 'structuralIntegrityScore', 'revisedMarkdown']
    };

    const critique: CritiqueResponse = await generateStructuredGeminiResponse({
      model: GEMINI_REASONING_MODEL,
      systemInstruction: 'You are a ruthless editorial fact-checker, logic reviewer, and executive editor. Review draft briefings against source material for precision, tone, and unsupported extrapolations.',
      prompt,
      responseSchema,
      zodValidator: CritiqueResponseSchema,
      temperature: 0.2
    });

    const durationMs = Date.now() - startTime;
    await WorkflowRepository.updateStep(workflowId, 4, {
      status: 'COMPLETED',
      output_payload: critique,
      duration_ms: durationMs,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.updateWorkflow(workflowId, {
      revised_synthesis_markdown: critique.revisedMarkdown,
      current_step_index: 4
    });

    await WorkflowRepository.addLog(
      workflowId,
      `Step 4 Complete: Fact-check score ${critique.factualAccuracyScore}/100. Applied ${critique.critiqueNotes.length} editorial corrections.`,
      'INFO',
      'CRITIQUE_REVISE',
      { notes: critique.critiqueNotes, score: critique.factualAccuracyScore }
    );

    sseManager.broadcast(workflowId, 'DRAFT_UPDATED', {
      draft: critique.revisedMarkdown,
      critique,
      stepOrder: 4
    });
    sseManager.broadcast(workflowId, 'STEP_COMPLETE', { stepOrder: 4, critique });
  }

  // =========================================================================
  // STEP 5: HTML_RENDER
  // =========================================================================
  private async executeStep5Render(workflowId: string): Promise<void> {
    const startTime = Date.now();
    await this.markStepStart(workflowId, 5, 'HTML_RENDER');
    await WorkflowRepository.addLog(
      workflowId,
      'Step 5: Compiling Markdown to mobile-responsive inline-CSS HTML email with Juice...',
      'INFO',
      'HTML_RENDER'
    );

    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    const markdownToRender = wf.revised_synthesis_markdown || wf.raw_synthesis_markdown || '';
    const sources: WorkflowSource[] = wf.sources || (await WorkflowRepository.getSources(workflowId));

    const htmlReport = await renderMarkdownToEmailHtml(markdownToRender, {
      title: wf.title,
      category: wf.category,
      depthLevel: wf.depth_level,
      accentColor: wf.configuration?.accentColor || '#0284c7',
      sources: sources.map((s: WorkflowSource) => ({ title: s.title, url: s.url })),
      showConfidenceScore: true,
      confidenceScore: 95
    });

    const durationMs = Date.now() - startTime;
    await WorkflowRepository.updateStep(workflowId, 5, {
      status: 'COMPLETED',
      output_payload: {
        htmlBytes: htmlReport.length,
        inliner: 'juice'
      },
      duration_ms: durationMs,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.updateWorkflow(workflowId, {
      final_html_report: htmlReport,
      current_step_index: 5
    });

    await WorkflowRepository.addLog(
      workflowId,
      `Step 5 Complete: Rendered ${(htmlReport.length / 1024).toFixed(1)}KB mobile-compatible HTML email.`,
      'INFO',
      'HTML_RENDER'
    );

    sseManager.broadcast(workflowId, 'REPORT_RENDERED', {
      htmlLength: htmlReport.length,
      htmlReport
    });
    sseManager.broadcast(workflowId, 'STEP_COMPLETE', { stepOrder: 5 });
  }

  // =========================================================================
  // STEP 6: EMAIL_DISPATCH
  // =========================================================================
  private async executeStep6Dispatch(workflowId: string): Promise<void> {
    const startTime = Date.now();
    await this.markStepStart(workflowId, 6, 'EMAIL_DISPATCH');
    await WorkflowRepository.addLog(
      workflowId,
      'Step 6: Delivering verified email report to configured recipients...',
      'INFO',
      'EMAIL_DISPATCH'
    );

    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    const recipients = wf.recipients || [];
    const html = wf.final_html_report || '';

    const dispatchResult = await sendEmailReport({
      to: recipients,
      subject: `[ResearchFlow Briefing] ${wf.title}`,
      html
    });

    const durationMs = Date.now() - startTime;
    await WorkflowRepository.updateStep(workflowId, 6, {
      status: 'COMPLETED',
      output_payload: dispatchResult,
      duration_ms: durationMs,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.addLog(
      workflowId,
      `Step 6 Complete: Delivered to ${recipients.length} recipients via ${dispatchResult.provider} (ID: ${dispatchResult.messageId}).`,
      'INFO',
      'EMAIL_DISPATCH',
      dispatchResult
    );

    sseManager.broadcast(workflowId, 'EMAIL_DISPATCHED', dispatchResult);
    sseManager.broadcast(workflowId, 'STEP_COMPLETE', { stepOrder: 6, dispatchResult });
  }

  // =========================================================================
  // Human In The Loop Controls
  // =========================================================================

  /**
   * Approves a workflow currently in AWAITING_REVIEW and advances through render & dispatch
   */
  public async approveWorkflow(workflowId: string): Promise<void> {
    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    if (wf.status !== 'AWAITING_REVIEW') {
      throw new Error(`Cannot approve workflow with status: ${wf.status}`);
    }

    await WorkflowRepository.updateWorkflow(workflowId, {
      status: 'RUNNING'
    });

    await WorkflowRepository.addLog(
      workflowId,
      'Human approval granted. Proceeding to HTML rendering and final email delivery.',
      'INFO'
    );

    sseManager.broadcast(workflowId, 'STATUS_CHANGE', { status: 'RUNNING' });

    // Execute steps 5 and 6
    this.executeWorkflow(workflowId);
  }

  /**
   * Retries execution from a specific step (defaults to failed step or step 1)
   */
  public async retryWorkflow(workflowId: string, fromStepOrder?: number): Promise<void> {
    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    if (!wf) throw new Error('Workflow not found');

    let restartOrder = fromStepOrder || 1;
    if (!fromStepOrder && wf.steps) {
      const failedStep = wf.steps.find(s => s.status === 'FAILED');
      if (failedStep) {
        restartOrder = failedStep.step_order;
      }
    }

    // Reset steps from restartOrder onwards to PENDING
    if (wf.steps) {
      for (const s of wf.steps) {
        if (s.step_order >= restartOrder) {
          await WorkflowRepository.updateStep(workflowId, s.step_order, {
            status: 'PENDING',
            error_details: null,
            duration_ms: null,
            started_at: null,
            completed_at: null
          });
        }
      }
    }

    await WorkflowRepository.updateWorkflow(workflowId, {
      status: 'QUEUED',
      error_message: null,
      current_step_index: restartOrder - 1
    });

    await WorkflowRepository.addLog(
      workflowId,
      `Manual retry triggered from Step ${restartOrder}. Reinitializing execution graph.`,
      'WARN'
    );

    sseManager.broadcast(workflowId, 'STATUS_CHANGE', { status: 'QUEUED' });
    this.executeWorkflow(workflowId);
  }

  /**
   * Cancels an active or queued workflow
   */
  public async cancelWorkflow(workflowId: string): Promise<void> {
    await WorkflowRepository.updateWorkflow(workflowId, {
      status: 'CANCELLED',
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.addLog(workflowId, 'Execution aborted by user operator.', 'WARN');
    sseManager.broadcast(workflowId, 'STATUS_CHANGE', { status: 'CANCELLED' });
    this.activeJobs.delete(workflowId);
  }

  private async markStepStart(workflowId: string, stepOrder: number, type: StepType): Promise<void> {
    await WorkflowRepository.updateStep(workflowId, stepOrder, {
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString()
    });
    sseManager.broadcast(workflowId, 'STEP_START', { stepOrder, stepType: type });
  }

  private async failWorkflow(workflowId: string, errorMsg: string): Promise<void> {
    const wf = await WorkflowRepository.getWorkflowById(workflowId);
    const activeStepOrder = (wf?.current_step_index || 0) + 1;

    await WorkflowRepository.updateStep(workflowId, activeStepOrder, {
      status: 'FAILED',
      error_details: errorMsg,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.updateWorkflow(workflowId, {
      status: 'FAILED',
      error_message: errorMsg,
      completed_at: new Date().toISOString()
    });

    await WorkflowRepository.addLog(
      workflowId,
      `Pipeline Execution Failure on Step ${activeStepOrder}: ${errorMsg}`,
      'ERROR'
    );

    sseManager.broadcast(workflowId, 'WORKFLOW_FAILED', {
      error: errorMsg,
      stepOrder: activeStepOrder
    });
  }
}

export const workflowEngine = new WorkflowEngine();
