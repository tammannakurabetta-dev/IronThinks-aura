import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { dbConfig } from './connection';
import {
  Workflow,
  WorkflowStep,
  WorkflowSource,
  WorkflowLog,
  WorkflowTemplate,
  WorkflowMetrics,
  WorkflowStatus,
  StepType,
  StepStatus,
  CreateWorkflowInput
} from '@shared/index';

// Initial pre-loaded seed templates
const initialTemplates: WorkflowTemplate[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Executive Horizon Briefing',
    category: 'EXECUTIVE_SCAN',
    description: 'Distills strategic macro shifts, high-level business risks, and 30-60-90 day horizon action items into an authoritative c-suite summary.',
    prompt_override: 'Emphasize strategic risk, executive capital allocations, and organizational impacts.',
    styling_config: { accentColor: '#0284c7', headerBanner: true, showConfidenceScore: true },
    is_default: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Technical & Architectural Deep-Dive',
    category: 'TECH_FEASIBILITY',
    description: 'Focuses on engineering tradeoffs, benchmarks, system throughput, and implementation hurdles for engineering leads.',
    prompt_override: 'Incorporate architectural tradeoffs, benchmark tables, and code/spec citations.',
    styling_config: { accentColor: '#10b981', headerBanner: true, showConfidenceScore: true },
    is_default: false,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Market & Competitive Intel Tear-Down',
    category: 'MARKET_INTEL',
    description: 'Structured competitive matrix analyzing vendor market share, product differentials, pricing models, and SWOT profiles.',
    prompt_override: 'Structure findings around competitor head-to-head comparisons and market sizing figures.',
    styling_config: { accentColor: '#8b5cf6', headerBanner: true, showConfidenceScore: true },
    is_default: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Regulatory & Compliance Sentinel',
    category: 'REGULATORY',
    description: 'Tracks international policy statutes, enforcement penalties, and legal risk disclosures.',
    prompt_override: 'Prioritize statutory citations, legal liabilities, and compliance deadlines.',
    styling_config: { accentColor: '#f59e0b', headerBanner: true, showConfidenceScore: true },
    is_default: false,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

// Initial pre-loaded seed workflows
const initialWorkflows: Workflow[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    title: 'Solid-State Battery Commercialization Q1 2026',
    topic: 'Commercial manufacturing milestones, energy density breakthroughs, and automotive OEM adoption timelines for all-solid-state lithium batteries in 2026.',
    category: 'MARKET_INTEL',
    depth_level: 'STANDARD',
    status: 'COMPLETED',
    require_approval: true,
    recipients: ['exec-intel@researchflow.ai', 'lead-analyst@energyventures.com'],
    configuration: { stylingTemplate: 'Executive Brief', accentColor: '#0284c7' },
    raw_synthesis_markdown: '# Solid-State Battery Commercialization: 2026 Outlook\n\n## Executive Summary\n* Multiple Tier-1 automakers are entering pilot line validation for all-solid-state cells (ASSBs).\n* Projected gravimetric densities now surpass 450 Wh/kg in test pouches.',
    revised_synthesis_markdown: `# Solid-State Battery Commercialization: Q1 2026 Executive Intelligence Brief

## Executive Summary
* **Pilot-Line Transition**: Tier-1 automotive partnerships (Toyota-Idemitsu, QuantumScape-VW PowerCo) have commenced pre-commercial pilot line operations in Q1 2026, targeting initial low-volume vehicle integration by late 2027.
* **Energy Density Benchmark**: Certified pouch-cell testing demonstrates gravimetric energy densities reaching 460 Wh/kg and volumetric density of 1,050 Wh/L, representing a 65% improvement over commercial NMC811 cells.
* **Thermal Safety Verification**: Non-flammable sulfide-based and oxide electrolytes show zero thermal runaway propagation under nail-penetration testing up to 180°C.
* **Manufacturing Bottlenecks**: Ceramic electrolyte separator brittleness and roll-to-roll continuous sintering yields remain the primary cost barriers, currently sustaining cell costs above $135/kWh.

## Strategic Context & Key Drivers
The global push toward high-range electric vehicles (EVs) and eVTOL urban air mobility has catalyzed capital concentration into solid-state battery (SSB) manufacturing. Traditional liquid-electrolyte lithium-ion systems are approaching their thermodynamic energy ceiling (~300 Wh/kg). SSB chemistry represents the critical paradigm shift to eliminate liquid volatile solvents while accommodating pure lithium-metal anodes.

## Deep-Dive Competitive Analysis

| Manufacturer | Electrolyte Chemistry | Gravimetric Density | Stated OEM Partner | Target Volume Production |
|---|---|---|---|---|
| **QuantumScape** | Anode-Free Sulfide / Ceramic | 450 Wh/kg | Volkswagen PowerCo | 2027-2028 |
| **Toyota / Idemitsu** | Sulfide-based Solid Electrolyte | 480 Wh/kg | Toyota Motor Corp | Late 2027 |
| **Solid Power** | Sulfide Solid Electrolyte | 390 Wh/kg | BMW / Ford | 2027 |
| **CATL** | Condensed / Semi-Solid | 500 Wh/kg | Internal / Global OEMs | 2026 Pilot |

## Critical Risks & Unresolved Questions
1. **Continuous Sintering Yields**: Defect rates during thin-film electrolyte sintering remain higher than liquid battery standards, risking cost parity targets.
2. **Lithium Dendrite Growth Under High C-Rates**: Fast-charging (>4C) at sub-zero temperatures still induces microscopic intergranular dendrite propagation in ceramic separators.
3. **Supply Chain Scarcity for High-Purity Lithium Sulfide**: Upstream chemical precursor capacity for Li2S is concentrated among fewer than 4 global processors.

## Strategic Recommendations & Action Items
* **30-Day**: Audit battery raw material procurement exposure to high-purity lithium sulfide suppliers.
* **60-Day**: Evaluate joint development agreements (JDAs) with cathode active material suppliers optimized for high-voltage solid electrolytes.
* **90-Day**: Establish benchmarking protocols for second-generation silicon-dominant vs. lithium-metal anode solid-state cells.

## Source Index & Confidence Assessment
* QuantumScape PowerCo Industrialization Filing (High Confidence)
* Toyota Motor Manufacturing Technology Bulletin Q1 2026 (High Confidence)
* US Department of Energy Battery500 Progress Report (Very High Confidence)`,
    final_html_report: `<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;"><div style="max-width: 680px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;"><div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px;"><span style="color: #38bdf8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">ResearchFlow AI Executive Briefing</span><h1 style="color: #f8fafc; font-size: 24px; margin-top: 8px; margin-bottom: 0;">Solid-State Battery Commercialization: Q1 2026</h1></div><div style="background-color: #0369a1; padding: 18px; border-radius: 8px; margin-bottom: 24px;"><h3 style="margin-top: 0; color: #ffffff; font-size: 16px;">Key Findings</h3><ul style="margin: 0; padding-left: 20px; color: #e0f2fe; font-size: 14px; line-height: 1.6;"><li>Tier-1 automakers entering pilot line validation for all-solid-state cells.</li><li>Projected gravimetric densities reach 460 Wh/kg with zero thermal runaway propagation.</li></ul></div><p style="color: #94a3b8; font-size: 13px; border-top: 1px solid #334155; padding-top: 16px;">Dispatched via ResearchFlow AI Automated Engine • Verified Grounded Intelligence</p></div></body></html>`,
    current_step_index: 6,
    total_steps: 6,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 6900000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 6900000).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    title: 'Agentic AI Orchestration Frameworks Comparison',
    topic: 'Comparative technical evaluation of AutoGen, LangGraph, and CrewAI for multi-agent enterprise automation in production environments.',
    category: 'TECH_FEASIBILITY',
    depth_level: 'COMPREHENSIVE',
    status: 'AWAITING_REVIEW',
    require_approval: true,
    recipients: ['lead-architect@ai-enterprise.io'],
    configuration: { stylingTemplate: 'Technical Deep-Dive', accentColor: '#10b981' },
    raw_synthesis_markdown: '# Multi-Agent Frameworks: Architectural Comparison\n\nDraft comparison of state management and concurrency across LangGraph and AutoGen...',
    revised_synthesis_markdown: `# Enterprise Agentic AI Frameworks: 2026 Production Architecture Briefing

## Executive Summary
* **State Graph Superiority**: LangGraph currently leads enterprise adoptions requiring deterministic cyclic state machines, checkpoints, and multi-actor human-in-the-loop (HITL) workflows.
* **Autonomous Group Dynamics**: Microsoft AutoGen excels at open-ended collaborative consensus dialogues, but introduces higher non-deterministic token consumption in production.
* **Orchestration Ergonomics**: CrewAI provides the steepest developer productivity curve for sequential/hierarchical role-playing teams, though with constrained lower-level network topology controls.

## Strategic Architecture Comparison

| Evaluation Vector | LangGraph (LangChain) | AutoGen (Microsoft) | CrewAI |
|---|---|---|---|
| **Core Execution Engine** | Stateful Directed Graph (Pregel-inspired) | Conversable Agent Actor Model | Hierarchical / Sequential Process |
| **State Persistence** | Native Postgres / SQLite Checkpointers | In-Memory / Custom Cache | In-Memory / Vector Storage |
| **Fault-Tolerance & Replay** | Atomic node rollbacks & time-travel | Conversation history replay | Step-level retry hooks |
| **Concurrency Pattern** | Async branch fork/join | Event-driven message bus | Worker thread pool |
| **Production Readiness** | High (Strict schema validation) | Moderate (Higher token overhead) | Moderate (Rapidly maturing) |

## Critical Implementation Vulnerabilities
1. **Unbounded Agent Loops**: Unchecked mutual feedback between agent nodes without strict iteration ceilings can result in 10x token bill spikes.
2. **State Serialization Bottlenecks**: Complex multi-megabyte shared memory context graphs degrade Postgres checkpointer throughput under high RPS.

## Recommendations (30-60-90 Days)
* **30-Day**: Standardize on LangGraph for stateful transactional pipelines requiring human sign-off gates.
* **60-Day**: Implement Redis-backed token circuit-breakers at the gateway layer for all autonomous agent execution nodes.
* **90-Day**: Deploy automated synthetic evaluations measuring task resolution rate vs. dollar cost per run.

## Source Index
* LangChain StateGraph Benchmarks
* Microsoft Research AutoGen Production Studies
* Enterprise AI Benchmark Consortium Report Q1 2026`,
    current_step_index: 4,
    total_steps: 6,
    started_at: new Date(Date.now() - 900000).toISOString(),
    created_at: new Date(Date.now() - 900000).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    title: 'EU AI Act Compliance & Governance Matrix for High-Risk Systems',
    topic: 'Statutory requirements, technical documentation standards, and enforcement deadlines for biometric and credit-scoring high-risk AI deployments under the EU AI Act in 2026.',
    category: 'REGULATORY',
    depth_level: 'STANDARD',
    status: 'QUEUED',
    require_approval: true,
    recipients: ['compliance-officer@fintech-global.eu'],
    configuration: { stylingTemplate: 'Regulatory & Compliance Sentinel', accentColor: '#f59e0b' },
    current_step_index: 0,
    total_steps: 6,
    created_at: new Date(Date.now() - 120000).toISOString(),
    updated_at: new Date(Date.now() - 120000).toISOString(),
  }
];

const initialSteps: WorkflowStep[] = [
  // Workflow 1 steps
  {
    id: '30000000-0000-0000-0000-000000000001',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'PLAN_EXPANSION',
    step_order: 1,
    status: 'COMPLETED',
    duration_ms: 1420,
    started_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 7140000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    input_payload: { topic: 'Solid-State Battery Commercialization Q1 2026' },
    output_payload: {
      searchQueries: [
        'solid-state battery pilot production 2026',
        'QuantumScape Volkswagen PowerCo validation data',
        'automotive all-solid-state battery Wh/kg benchmark',
        'sulfide electrolyte manufacturing bottleneck'
      ]
    }
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'WEB_SCRAPE',
    step_order: 2,
    status: 'COMPLETED',
    duration_ms: 3850,
    started_at: new Date(Date.now() - 7140000).toISOString(),
    completed_at: new Date(Date.now() - 7080000).toISOString(),
    created_at: new Date(Date.now() - 7140000).toISOString(),
    input_payload: { concurrency: 3 },
    output_payload: { pagesFetched: 4, totalTokens: 14200 }
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'SYNTHESIS',
    step_order: 3,
    status: 'COMPLETED',
    duration_ms: 6200,
    started_at: new Date(Date.now() - 7080000).toISOString(),
    completed_at: new Date(Date.now() - 7020000).toISOString(),
    created_at: new Date(Date.now() - 7080000).toISOString(),
    input_payload: { model: 'gemini-2.5-pro' },
    output_payload: { markdownLength: 2480 }
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'CRITIQUE_REVISE',
    step_order: 4,
    status: 'COMPLETED',
    duration_ms: 5100,
    started_at: new Date(Date.now() - 7020000).toISOString(),
    completed_at: new Date(Date.now() - 6960000).toISOString(),
    created_at: new Date(Date.now() - 7020000).toISOString(),
    input_payload: { model: 'gemini-2.5-pro' },
    output_payload: {
      factualAccuracyScore: 96,
      structuralIntegrityScore: 94,
      critiqueNotes: [
        'Verified energy density metric against official OEM filings',
        'Removed unverified pricing extrapolation'
      ]
    }
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'HTML_RENDER',
    step_order: 5,
    status: 'COMPLETED',
    duration_ms: 850,
    started_at: new Date(Date.now() - 6960000).toISOString(),
    completed_at: new Date(Date.now() - 6930000).toISOString(),
    created_at: new Date(Date.now() - 6960000).toISOString(),
    input_payload: { inliner: 'juice' },
    output_payload: { htmlBytes: 18450 }
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'EMAIL_DISPATCH',
    step_order: 6,
    status: 'COMPLETED',
    duration_ms: 1200,
    started_at: new Date(Date.now() - 6930000).toISOString(),
    completed_at: new Date(Date.now() - 6900000).toISOString(),
    created_at: new Date(Date.now() - 6930000).toISOString(),
    input_payload: { recipients: ['exec-intel@researchflow.ai'] },
    output_payload: { messageId: 'msg_sandbox_9942a', status: 'DELIVERED' }
  },

  // Workflow 2 steps
  {
    id: '30000000-0000-0000-0000-000000000011',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'PLAN_EXPANSION',
    step_order: 1,
    status: 'COMPLETED',
    duration_ms: 1350,
    started_at: new Date(Date.now() - 900000).toISOString(),
    completed_at: new Date(Date.now() - 840000).toISOString(),
    created_at: new Date(Date.now() - 900000).toISOString(),
    input_payload: { topic: 'Agentic AI Orchestration Frameworks' },
    output_payload: {
      searchQueries: [
        'LangGraph production architecture benchmarks',
        'AutoGen enterprise state machine tradeoffs',
        'CrewAI hierarchical execution limits'
      ]
    }
  },
  {
    id: '30000000-0000-0000-0000-000000000012',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'WEB_SCRAPE',
    step_order: 2,
    status: 'COMPLETED',
    duration_ms: 3400,
    started_at: new Date(Date.now() - 840000).toISOString(),
    completed_at: new Date(Date.now() - 780000).toISOString(),
    created_at: new Date(Date.now() - 840000).toISOString(),
    input_payload: { concurrency: 3 },
    output_payload: { pagesFetched: 5, totalTokens: 18900 }
  },
  {
    id: '30000000-0000-0000-0000-000000000013',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'SYNTHESIS',
    step_order: 3,
    status: 'COMPLETED',
    duration_ms: 7100,
    started_at: new Date(Date.now() - 780000).toISOString(),
    completed_at: new Date(Date.now() - 660000).toISOString(),
    created_at: new Date(Date.now() - 780000).toISOString(),
    input_payload: { model: 'gemini-2.5-pro' },
    output_payload: { markdownLength: 3200 }
  },
  {
    id: '30000000-0000-0000-0000-000000000014',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'CRITIQUE_REVISE',
    step_order: 4,
    status: 'COMPLETED',
    duration_ms: 5400,
    started_at: new Date(Date.now() - 660000).toISOString(),
    completed_at: new Date(Date.now() - 600000).toISOString(),
    created_at: new Date(Date.now() - 660000).toISOString(),
    input_payload: { model: 'gemini-2.5-pro' },
    output_payload: {
      factualAccuracyScore: 93,
      structuralIntegrityScore: 96,
      critiqueNotes: [
        'Refined state persistence comparison table',
        'Clarified token consumption risks'
      ]
    }
  },
  {
    id: '30000000-0000-0000-0000-000000000015',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'HTML_RENDER',
    step_order: 5,
    status: 'PENDING',
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: '30000000-0000-0000-0000-000000000016',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'EMAIL_DISPATCH',
    step_order: 6,
    status: 'PENDING',
    created_at: new Date(Date.now() - 900000).toISOString()
  }
];

const initialSources: WorkflowSource[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    url: 'https://energy-storage.org/reports/solid-state-battery-benchmarks-2026',
    title: 'Global Solid-State Battery Commercialization Outlook 2026',
    snippet: 'Comprehensive data on pilot manufacturing yields for sulfide and oxide electrolytes.',
    extracted_text: 'Automotive OEMs have invested over $12B into solid-state cell industrialization...',
    status: 'FETCHED',
    http_status_code: 200,
    tokens_estimate: 4200,
    created_at: new Date(Date.now() - 7140000).toISOString()
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    workflow_id: '20000000-0000-0000-0000-000000000001',
    url: 'https://automotive-tech-review.com/toyota-idemitsu-assb-timeline',
    title: 'Toyota & Idemitsu Announce Pre-Commercial Pilot Milestones',
    snippet: 'Technical update on sulfide solid electrolyte mass production facilities.',
    extracted_text: 'Idemitsu Kosan and Toyota confirmed pilot facility commissioning with 480 Wh/kg cell target...',
    status: 'FETCHED',
    http_status_code: 200,
    tokens_estimate: 3100,
    created_at: new Date(Date.now() - 7140000).toISOString()
  },
  {
    id: '40000000-0000-0000-0000-000000000011',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    url: 'https://arxiv.org/abs/2402.multi-agent-orchestration',
    title: 'Architectures of Multi-Agent AI Systems: Tradeoffs and Benchmarks',
    snippet: 'Evaluation of state-persistence models across contemporary agent frameworks.',
    extracted_text: 'State persistence models in LangGraph leverage Pregel-style directed acyclic and cyclic graphs...',
    status: 'FETCHED',
    http_status_code: 200,
    tokens_estimate: 6100,
    created_at: new Date(Date.now() - 840000).toISOString()
  },
  {
    id: '40000000-0000-0000-0000-000000000012',
    workflow_id: '20000000-0000-0000-0000-000000000002',
    url: 'https://github.com/langchain-ai/langgraph/discussions/production',
    title: 'LangGraph Enterprise Deployment Patterns',
    snippet: 'Discussion on checkpoint durability and PostgreSQL connection pools.',
    extracted_text: 'When deploying to high-throughput endpoints, connection pooling for Postgres checkpointer is paramount...',
    status: 'FETCHED',
    http_status_code: 200,
    tokens_estimate: 4800,
    created_at: new Date(Date.now() - 840000).toISOString()
  }
];

const initialLogs: WorkflowLog[] = [
  {
    id: 1,
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'PLAN_EXPANSION',
    log_level: 'INFO',
    message: 'Deconstructing topic into 4 orthogonal search vectors using gemini-2.5-flash.',
    metadata: { tokens: 320 },
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 2,
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'WEB_SCRAPE',
    log_level: 'INFO',
    message: 'SSRF-safe web scraper fetched 4 high-authority source documents.',
    metadata: { pages: 4 },
    created_at: new Date(Date.now() - 7140000).toISOString()
  },
  {
    id: 3,
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'SYNTHESIS',
    log_level: 'INFO',
    message: 'gemini-2.5-pro generated comprehensive 2,480-word executive briefing.',
    metadata: { status: 'OK' },
    created_at: new Date(Date.now() - 7080000).toISOString()
  },
  {
    id: 4,
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'CRITIQUE_REVISE',
    log_level: 'INFO',
    message: 'Self-critique pass completed: 96% factual accuracy score. Corrections applied.',
    metadata: { score: 96 },
    created_at: new Date(Date.now() - 7020000).toISOString()
  },
  {
    id: 5,
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'HTML_RENDER',
    log_level: 'INFO',
    message: 'Juice CSS inliner generated responsive, email-compliant HTML report.',
    metadata: { size: '18.4KB' },
    created_at: new Date(Date.now() - 6960000).toISOString()
  },
  {
    id: 6,
    workflow_id: '20000000-0000-0000-0000-000000000001',
    step_type: 'EMAIL_DISPATCH',
    log_level: 'INFO',
    message: 'Transactional email successfully dispatched to 2 recipients.',
    metadata: { recipients: 2 },
    created_at: new Date(Date.now() - 6900000).toISOString()
  },

  // Workflow 2 logs
  {
    id: 11,
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'PLAN_EXPANSION',
    log_level: 'INFO',
    message: 'Generated 3 high-precision search queries targeting architecture tradeoffs.',
    metadata: { queries: 3 },
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 12,
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'WEB_SCRAPE',
    log_level: 'INFO',
    message: 'Extracted 18,900 tokens of verified technical documentation.',
    metadata: { tokens: 18900 },
    created_at: new Date(Date.now() - 840000).toISOString()
  },
  {
    id: 13,
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'SYNTHESIS',
    log_level: 'INFO',
    message: 'Synthesized architectural matrix comparing LangGraph, AutoGen, and CrewAI.',
    metadata: { model: 'gemini-2.5-pro' },
    created_at: new Date(Date.now() - 780000).toISOString()
  },
  {
    id: 14,
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'CRITIQUE_REVISE',
    log_level: 'INFO',
    message: 'Critique agent validated state persistence and concurrency claims (Score: 93/100).',
    metadata: { score: 93 },
    created_at: new Date(Date.now() - 660000).toISOString()
  },
  {
    id: 15,
    workflow_id: '20000000-0000-0000-0000-000000000002',
    step_type: 'CRITIQUE_REVISE',
    log_level: 'WARN',
    message: 'Approval gate active: Pausing execution for human inspection before email dispatch.',
    metadata: { status: 'AWAITING_REVIEW' },
    created_at: new Date(Date.now() - 600000).toISOString()
  }
];

class MemoryStore {
  workflows: Map<string, Workflow> = new Map();
  steps: Map<string, WorkflowStep[]> = new Map();
  sources: Map<string, WorkflowSource[]> = new Map();
  logs: Map<string, WorkflowLog[]> = new Map();
  templates: Map<string, WorkflowTemplate> = new Map();
  logCounter: number = 100;
  private storePath: string;

  constructor() {
    this.storePath = path.resolve(__dirname, '../../../.data/store.json');
    this.load();
  }

  load() {
    // Seed initial templates and mock records
    initialTemplates.forEach(t => this.templates.set(t.id, t));
    initialWorkflows.forEach(w => this.workflows.set(w.id, { ...w }));
    
    initialSteps.forEach(s => {
      const existing = this.steps.get(s.workflow_id) || [];
      if (!existing.some(e => e.id === s.id)) {
        existing.push({ ...s });
        this.steps.set(s.workflow_id, existing);
      }
    });

    initialSources.forEach(src => {
      const existing = this.sources.get(src.workflow_id) || [];
      if (!existing.some(e => e.id === src.id)) {
        existing.push({ ...src });
        this.sources.set(src.workflow_id, existing);
      }
    });

    initialLogs.forEach(l => {
      const existing = this.logs.get(l.workflow_id) || [];
      if (!existing.some(e => e.id === l.id)) {
        existing.push({ ...l });
        this.logs.set(l.workflow_id, existing);
      }
    });

    // Restore saved persistent records from disk if present
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.workflows)) {
          for (const [id, wf] of data.workflows) {
            this.workflows.set(id, wf);
          }
        }
        if (Array.isArray(data.steps)) {
          for (const [id, st] of data.steps) {
            this.steps.set(id, st);
          }
        }
        if (Array.isArray(data.sources)) {
          for (const [id, src] of data.sources) {
            this.sources.set(id, src);
          }
        }
        if (Array.isArray(data.logs)) {
          for (const [id, lg] of data.logs) {
            this.logs.set(id, lg);
          }
        }
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          for (const [id, tm] of data.templates) {
            this.templates.set(id, tm);
          }
        }
        if (typeof data.logCounter === 'number' && data.logCounter > this.logCounter) {
          this.logCounter = data.logCounter;
        }
        console.log(`[MemoryStore] Successfully restored ${this.workflows.size} workflows from persistent disk cache.`);
      }
    } catch (err: any) {
      console.warn('[MemoryStore] Failed to load persistent store from disk:', err.message);
    }
  }

  save() {
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        workflows: Array.from(this.workflows.entries()),
        steps: Array.from(this.steps.entries()),
        sources: Array.from(this.sources.entries()),
        logs: Array.from(this.logs.entries()),
        templates: Array.from(this.templates.entries()),
        logCounter: this.logCounter
      };
      fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn('[MemoryStore] Failed to save state to disk:', err.message);
    }
  }
}

const memoryStore = new MemoryStore();

export const WorkflowRepository = {
  async getTemplates(): Promise<WorkflowTemplate[]> {
    if (dbConfig.pool) {
      try {
        const res = await dbConfig.pool.query(
          'SELECT * FROM workflow_templates ORDER BY is_default DESC, name ASC'
        );
        if (res.rows.length > 0) return res.rows;
      } catch (err: any) {
        console.warn('DB template query failed, using cache:', err.message);
      }
    }
    return Array.from(memoryStore.templates.values());
  },

  async getTemplateById(id: string): Promise<WorkflowTemplate | null> {
    if (dbConfig.pool) {
      try {
        const res = await dbConfig.pool.query('SELECT * FROM workflow_templates WHERE id = $1', [id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (err: any) {
        console.warn('DB getTemplateById failed, using cache:', err.message);
      }
    }
    return memoryStore.templates.get(id) || null;
  },

  async createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const workflow: Workflow = {
      id,
      title: input.title,
      topic: input.topic,
      category: input.category,
      depth_level: input.depthLevel,
      status: 'QUEUED',
      require_approval: input.requireApproval,
      recipients: input.recipients,
      configuration: {
        customSearchQueries: input.customSearchQueries || [],
        excludedDomains: input.excludedDomains || [],
        stylingTemplate: input.stylingTemplate || 'Executive Brief',
        accentColor: input.accentColor || '#0284c7',
        immediateExecution: input.immediateExecution !== false
      },
      current_step_index: 0,
      total_steps: 6,
      created_at: now,
      updated_at: now
    };

    // Initialize 6 sequential step execution records
    const stepTypes: StepType[] = [
      'PLAN_EXPANSION',
      'WEB_SCRAPE',
      'SYNTHESIS',
      'CRITIQUE_REVISE',
      'HTML_RENDER',
      'EMAIL_DISPATCH'
    ];

    const steps: WorkflowStep[] = stepTypes.map((type, idx) => ({
      id: uuidv4(),
      workflow_id: id,
      step_type: type,
      step_order: idx + 1,
      status: 'PENDING',
      created_at: now
    }));

    if (dbConfig.pool) {
      try {
        const client = await dbConfig.pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `INSERT INTO workflows (
              id, title, topic, category, depth_level, status, require_approval,
              recipients, configuration, current_step_index, total_steps, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              workflow.id,
              workflow.title,
              workflow.topic,
              workflow.category,
              workflow.depth_level,
              workflow.status,
              workflow.require_approval,
              JSON.stringify(workflow.recipients),
              JSON.stringify(workflow.configuration),
              workflow.current_step_index,
              workflow.total_steps,
              workflow.created_at,
              workflow.updated_at
            ]
          );

          for (const s of steps) {
            await client.query(
              `INSERT INTO workflow_steps (
                id, workflow_id, step_type, step_order, status, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [s.id, s.workflow_id, s.step_type, s.step_order, s.status, s.created_at]
            );
          }

          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.warn('PostgreSQL workflow write failed, persisting to in-memory store:', err.message);
      }
    }

    memoryStore.workflows.set(id, workflow);
    memoryStore.steps.set(id, steps);
    memoryStore.sources.set(id, []);
    memoryStore.logs.set(id, []);
    memoryStore.save();

    return { ...workflow, steps };
  },

  async getWorkflows(params?: {
    page?: number;
    limit?: number;
    status?: WorkflowStatus;
    search?: string;
  }): Promise<{ workflows: Workflow[]; total: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const status = params?.status;
    const search = params?.search?.toLowerCase();

    if (dbConfig.pool) {
      try {
        let whereClauses: string[] = [];
        let queryParams: any[] = [];
        let paramIdx = 1;

        if (status) {
          whereClauses.push(`status = $${paramIdx++}`);
          queryParams.push(status);
        }

        if (search) {
          whereClauses.push(`(LOWER(title) LIKE $${paramIdx} OR LOWER(topic) LIKE $${paramIdx})`);
          queryParams.push(`%${search}%`);
          paramIdx++;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const countRes = await dbConfig.pool.query(
          `SELECT COUNT(*) FROM workflows ${whereSql}`,
          queryParams
        );
        const total = parseInt(countRes.rows[0].count, 10);

        const offset = (page - 1) * limit;
        queryParams.push(limit, offset);
        const rowsRes = await dbConfig.pool.query(
          `SELECT * FROM workflows ${whereSql} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
          queryParams
        );

        return { workflows: rowsRes.rows, total };
      } catch (err: any) {
        console.warn('DB getWorkflows failed, falling back to cache:', err.message);
      }
    }

    let items = Array.from(memoryStore.workflows.values());
    if (status) {
      items = items.filter(w => w.status === status);
    }
    if (search) {
      items = items.filter(
        w => w.title.toLowerCase().includes(search) || w.topic.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);

    return { workflows: paginated, total };
  },

  async getWorkflowById(id: string): Promise<Workflow | null> {
    let workflow: Workflow | null = null;
    let steps: WorkflowStep[] = [];
    let sources: WorkflowSource[] = [];
    let logs: WorkflowLog[] = [];

    if (dbConfig.pool) {
      try {
        const wfRes = await dbConfig.pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
        if (wfRes.rows.length > 0) {
          workflow = wfRes.rows[0];
          const [stepsRes, sourcesRes, logsRes] = await Promise.all([
            dbConfig.pool.query('SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC', [id]),
            dbConfig.pool.query('SELECT * FROM workflow_sources WHERE workflow_id = $1 ORDER BY created_at ASC', [id]),
            dbConfig.pool.query('SELECT * FROM workflow_logs WHERE workflow_id = $1 ORDER BY id ASC', [id]),
          ]);
          steps = stepsRes.rows;
          sources = sourcesRes.rows;
          logs = logsRes.rows;

          return { ...workflow!, steps, sources, logs };
        }
      } catch (err: any) {
        console.warn('DB getWorkflowById query failed, using cache:', err.message);
      }
    }

    workflow = memoryStore.workflows.get(id) || null;
    if (!workflow) return null;

    steps = memoryStore.steps.get(id) || [];
    sources = memoryStore.sources.get(id) || [];
    logs = memoryStore.logs.get(id) || [];

    return { ...workflow, steps, sources, logs };
  },

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const existing = await this.getWorkflowById(id);
    if (!existing) return null;

    const updated: Workflow = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (dbConfig.pool) {
      try {
        const setCols: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.status !== undefined) {
          setCols.push(`status = $${idx++}`);
          values.push(updates.status);
        }
        if (updates.raw_synthesis_markdown !== undefined) {
          setCols.push(`raw_synthesis_markdown = $${idx++}`);
          values.push(updates.raw_synthesis_markdown);
        }
        if (updates.revised_synthesis_markdown !== undefined) {
          setCols.push(`revised_synthesis_markdown = $${idx++}`);
          values.push(updates.revised_synthesis_markdown);
        }
        if (updates.final_html_report !== undefined) {
          setCols.push(`final_html_report = $${idx++}`);
          values.push(updates.final_html_report);
        }
        if (updates.current_step_index !== undefined) {
          setCols.push(`current_step_index = $${idx++}`);
          values.push(updates.current_step_index);
        }
        if (updates.error_message !== undefined) {
          setCols.push(`error_message = $${idx++}`);
          values.push(updates.error_message);
        }
        if (updates.started_at !== undefined) {
          setCols.push(`started_at = $${idx++}`);
          values.push(updates.started_at);
        }
        if (updates.completed_at !== undefined) {
          setCols.push(`completed_at = $${idx++}`);
          values.push(updates.completed_at);
        }
        if (updates.recipients !== undefined) {
          setCols.push(`recipients = $${idx++}`);
          values.push(JSON.stringify(updates.recipients));
        }

        setCols.push(`updated_at = NOW()`);
        values.push(id);

        if (setCols.length > 1) {
          await dbConfig.pool.query(
            `UPDATE workflows SET ${setCols.join(', ')} WHERE id = $${idx}`,
            values
          );
        }
      } catch (err: any) {
        console.warn('DB updateWorkflow failed, caching locally:', err.message);
      }
    }

    memoryStore.workflows.set(id, updated);
    memoryStore.save();
    return updated;
  },

  async updateStep(
    workflowId: string,
    stepOrder: number,
    updates: Partial<WorkflowStep>
  ): Promise<WorkflowStep | null> {
    const existingSteps = memoryStore.steps.get(workflowId) || [];
    const stepIdx = existingSteps.findIndex(s => s.step_order === stepOrder);

    let updatedStep: WorkflowStep;
    if (stepIdx >= 0) {
      updatedStep = { ...existingSteps[stepIdx], ...updates };
      existingSteps[stepIdx] = updatedStep;
      memoryStore.steps.set(workflowId, existingSteps);
    } else {
      updatedStep = {
        id: uuidv4(),
        workflow_id: workflowId,
        step_type: 'PLAN_EXPANSION',
        step_order: stepOrder,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        ...updates
      };
      existingSteps.push(updatedStep);
      memoryStore.steps.set(workflowId, existingSteps);
    }
    memoryStore.save();

    if (dbConfig.pool) {
      try {
        await dbConfig.pool.query(
          `UPDATE workflow_steps 
           SET status = COALESCE($1, status),
               input_payload = COALESCE($2, input_payload),
               output_payload = COALESCE($3, output_payload),
               error_details = $4,
               duration_ms = COALESCE($5, duration_ms),
               started_at = COALESCE($6, started_at),
               completed_at = COALESCE($7, completed_at)
           WHERE workflow_id = $8 AND step_order = $9`,
          [
            updates.status,
            updates.input_payload ? JSON.stringify(updates.input_payload) : null,
            updates.output_payload ? JSON.stringify(updates.output_payload) : null,
            updates.error_details,
            updates.duration_ms,
            updates.started_at,
            updates.completed_at,
            workflowId,
            stepOrder
          ]
        );
      } catch (err: any) {
        console.warn('DB updateStep failed, using cached step:', err.message);
      }
    }

    return updatedStep;
  },

  async getSources(workflowId: string): Promise<WorkflowSource[]> {
    if (dbConfig.pool) {
      try {
        const res = await dbConfig.pool.query(
          'SELECT * FROM workflow_sources WHERE workflow_id = $1 ORDER BY created_at ASC',
          [workflowId]
        );
        return res.rows;
      } catch (err: any) {
        console.warn('DB getSources failed, using memory:', err.message);
      }
    }
    return memoryStore.sources.get(workflowId) || [];
  },

  async addSource(source: Omit<WorkflowSource, 'id' | 'created_at'>): Promise<WorkflowSource> {
    const newSource: WorkflowSource = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      ...source
    };

    if (dbConfig.pool) {
      try {
        await dbConfig.pool.query(
          `INSERT INTO workflow_sources (
            id, workflow_id, url, title, snippet, extracted_text, status, http_status_code, tokens_estimate, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            newSource.id,
            newSource.workflow_id,
            newSource.url,
            newSource.title,
            newSource.snippet,
            newSource.extracted_text,
            newSource.status,
            newSource.http_status_code,
            newSource.tokens_estimate,
            newSource.created_at
          ]
        );
      } catch (err: any) {
        console.warn('DB addSource failed, stored in-memory:', err.message);
      }
    }

    const list = memoryStore.sources.get(source.workflow_id) || [];
    list.push(newSource);
    memoryStore.sources.set(source.workflow_id, list);
    memoryStore.save();

    return newSource;
  },

  async addLog(
    workflowId: string,
    message: string,
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO',
    stepType?: StepType | null,
    metadata?: Record<string, any>
  ): Promise<WorkflowLog> {
    memoryStore.logCounter++;
    const log: WorkflowLog = {
      id: memoryStore.logCounter,
      workflow_id: workflowId,
      step_type: stepType || null,
      log_level: level,
      message,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    if (dbConfig.pool) {
      try {
        const res = await dbConfig.pool.query(
          `INSERT INTO workflow_logs (
            workflow_id, step_type, log_level, message, metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [log.workflow_id, log.step_type, log.log_level, log.message, JSON.stringify(log.metadata), log.created_at]
        );
        if (res.rows.length > 0) log.id = res.rows[0].id;
      } catch (err: any) {
        // Fallback to memory
      }
    }

    const list = memoryStore.logs.get(workflowId) || [];
    list.push(log);
    memoryStore.logs.set(workflowId, list);
    memoryStore.save();

    return log;
  },

  async getMetrics(): Promise<WorkflowMetrics> {
    const workflows = Array.from(memoryStore.workflows.values());
    const total = workflows.length;
    const completed = workflows.filter(w => w.status === 'COMPLETED').length;
    const failed = workflows.filter(w => w.status === 'FAILED').length;
    const running = workflows.filter(w => w.status === 'RUNNING').length;
    const awaiting = workflows.filter(w => w.status === 'AWAITING_REVIEW').length;

    let totalDurationSeconds = 0;
    let durationCount = 0;

    workflows.forEach(w => {
      if (w.started_at && w.completed_at) {
        const start = new Date(w.started_at).getTime();
        const end = new Date(w.completed_at).getTime();
        if (end > start) {
          totalDurationSeconds += (end - start) / 1000;
          durationCount++;
        }
      }
    });

    const averageDurationSeconds = durationCount > 0 ? Math.round(totalDurationSeconds / durationCount) : 180;
    const successRate = total > 0 ? Math.round((completed / (completed + failed || 1)) * 100) : 100;

    return {
      totalWorkflows: total,
      completedWorkflows: completed,
      failedWorkflows: failed,
      runningWorkflows: running,
      awaitingReviewWorkflows: awaiting,
      successRate,
      averageDurationSeconds,
      activeScheduledJobs: 2 // default monitoring jobs
    };
  }
};
