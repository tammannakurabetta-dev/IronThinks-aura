-- ==============================================================================
-- RESEARCHFLOW AI - SUPABASE / POSTGRESQL PRODUCTION INITIAL SCHEMA MIGRATION
-- Migration: 001_initial_schema.sql
-- Description: Core workflow engine tables, enums, triggers, RLS policies & seed data
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define Custom Types / Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_status') THEN
        CREATE TYPE workflow_status AS ENUM (
            'DRAFT',
            'QUEUED',
            'RUNNING',
            'AWAITING_REVIEW',
            'COMPLETED',
            'FAILED',
            'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'step_type') THEN
        CREATE TYPE step_type AS ENUM (
            'PLAN_EXPANSION',
            'WEB_SCRAPE',
            'SYNTHESIS',
            'CRITIQUE_REVISE',
            'HTML_RENDER',
            'EMAIL_DISPATCH'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'step_status') THEN
        CREATE TYPE step_status AS ENUM (
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'FAILED',
            'SKIPPED'
        );
    END IF;
END $$;

-- 3. Core Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    topic TEXT NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'EXECUTIVE_SCAN',
    depth_level VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    status workflow_status NOT NULL DEFAULT 'QUEUED',
    require_approval BOOLEAN NOT NULL DEFAULT TRUE,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Content Artifacts
    raw_synthesis_markdown TEXT,
    revised_synthesis_markdown TEXT,
    final_html_report TEXT,
    
    -- Execution Metadata
    current_step_index INT NOT NULL DEFAULT 0,
    total_steps INT NOT NULL DEFAULT 6,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Individual Step Executions
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_type step_type NOT NULL,
    step_order INT NOT NULL,
    status step_status NOT NULL DEFAULT 'PENDING',
    input_payload JSONB,
    output_payload JSONB,
    error_details TEXT,
    duration_ms INT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workflow_step UNIQUE(workflow_id, step_order)
);

-- 5. Scraped Web Sources & Extracted Text
CREATE TABLE IF NOT EXISTS workflow_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    snippet TEXT,
    extracted_text TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'FETCHED',
    http_status_code INT,
    tokens_estimate INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Real-time Execution Logs
CREATE TABLE IF NOT EXISTS workflow_logs (
    id BIGSERIAL PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_type step_type,
    log_level VARCHAR(16) NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Workflow & Email Templates
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'EXECUTIVE_SCAN',
    description TEXT NOT NULL,
    prompt_override TEXT,
    styling_config JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Indexes for Performance & Active Query Polling
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_lookup ON workflow_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_wf_id ON workflow_logs(workflow_id, id ASC);
CREATE INDEX IF NOT EXISTS idx_workflow_sources_wf_id ON workflow_sources(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);

-- 9. Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_workflows_updated_at ON workflows;
CREATE TRIGGER trg_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Row Level Security (RLS) Configuration
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Allow permissive access for application service role & public development demo
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public workflows access" ON workflows;
    CREATE POLICY "Public workflows access" ON workflows FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public workflow_steps access" ON workflow_steps;
    CREATE POLICY "Public workflow_steps access" ON workflow_steps FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public workflow_sources access" ON workflow_sources;
    CREATE POLICY "Public workflow_sources access" ON workflow_sources FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public workflow_logs access" ON workflow_logs;
    CREATE POLICY "Public workflow_logs access" ON workflow_logs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public workflow_templates access" ON workflow_templates;
    CREATE POLICY "Public workflow_templates access" ON workflow_templates FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 11. Seed Workflow Templates
INSERT INTO workflow_templates (id, name, category, description, prompt_override, styling_config, is_default)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        'Executive Horizon Briefing',
        'EXECUTIVE_SCAN',
        'Distills strategic macro shifts, high-level business risks, and 30-60-90 day horizon action items into an authoritative c-suite summary.',
        'Emphasize strategic risk, executive capital allocations, and organizational impacts.',
        '{"accentColor": "#0284c7", "headerBanner": true, "showConfidenceScore": true}'::jsonb,
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Technical & Architectural Deep-Dive',
        'TECH_FEASIBILITY',
        'Focuses on engineering tradeoffs, benchmarks, system throughput, and implementation hurdles for engineering leads.',
        'Incorporate architectural tradeoffs, benchmark tables, and code/spec citations.',
        '{"accentColor": "#10b981", "headerBanner": true, "showConfidenceScore": true}'::jsonb,
        FALSE
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Market & Competitive Intel Tear-Down',
        'MARKET_INTEL',
        'Structured competitive matrix analyzing vendor market share, product differentials, pricing models, and SWOT profiles.',
        'Structure findings around competitor head-to-head comparisons and market sizing figures.',
        '{"accentColor": "#8b5cf6", "headerBanner": true, "showConfidenceScore": true}'::jsonb,
        FALSE
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'Regulatory & Compliance Sentinel',
        'REGULATORY',
        'Tracks international policy statutes, enforcement penalties, and legal risk disclosures.',
        'Prioritize statutory citations, legal liabilities, and compliance deadlines.',
        '{"accentColor": "#f59e0b", "headerBanner": true, "showConfidenceScore": true}'::jsonb,
        FALSE
    )
ON CONFLICT (id) DO NOTHING;

-- 12. Seed Demonstrative Workflows

-- Workflow A: COMPLETED run
INSERT INTO workflows (
    id,
    title,
    topic,
    category,
    depth_level,
    status,
    require_approval,
    recipients,
    configuration,
    raw_synthesis_markdown,
    revised_synthesis_markdown,
    final_html_report,
    current_step_index,
    total_steps,
    started_at,
    completed_at
) VALUES (
    '20000000-0000-0000-0000-000000000001',
    'Solid-State Battery Commercialization Q1 2026',
    'Commercial manufacturing milestones, energy density breakthroughs, and automotive OEM adoption timelines for all-solid-state lithium batteries in 2026.',
    'MARKET_INTEL',
    'STANDARD',
    'COMPLETED',
    TRUE,
    '["exec-intel@researchflow.ai", "lead-analyst@energyventures.com"]'::jsonb,
    '{"stylingTemplate": "Executive Brief", "accentColor": "#0284c7"}'::jsonb,
    '# Solid-State Battery Commercialization: 2026 Outlook\n\n## Executive Summary\n* Multiple Tier-1 automakers are entering pilot line validation for all-solid-state cells (ASSBs).\n* Projected gravimetric densities now surpass 450 Wh/kg in test pouches.',
    '# Solid-State Battery Commercialization: Q1 2026 Executive Intelligence Brief\n\n## Executive Summary\n* **Pilot-Line Transition**: Tier-1 automotive partnerships (Toyota-Idemitsu, QuantumScape-VW PowerCo) have commenced pre-commercial pilot line operations in Q1 2026, targeting initial low-volume vehicle integration by late 2027.\n* **Energy Density Benchmark**: Certified pouch-cell testing demonstrates gravimetric energy densities reaching 460 Wh/kg and volumetric density of 1,050 Wh/L, representing a 65% improvement over commercial NMC811 cells.\n* **Thermal Safety Verification**: Non-flammable sulfide-based and oxide electrolytes show zero thermal runaway propagation under nail-penetration testing up to 180°C.\n* **Manufacturing Bottlenecks**: Ceramic electrolyte separator brittleness and roll-to-roll continuous sintering yields remain the primary cost barriers, currently sustaining cell costs above $135/kWh.\n\n## Strategic Context & Key Drivers\nThe global push toward high-range electric vehicles (EVs) and eVTOL urban air mobility has catalyzed capital concentration into solid-state battery (SSB) manufacturing. Traditional liquid-electrolyte lithium-ion systems are approaching their thermodynamic energy ceiling (~300 Wh/kg). SSB chemistry represents the critical paradigm shift to eliminate liquid volatile solvents while accommodating pure lithium-metal anodes.\n\n## Deep-Dive Competitive Analysis\n\n| Manufacturer | Electrolyte Chemistry | Gravimetric Density | Stated OEM Partner | Target Volume Production |\n|---|---|---|---|---|\n| **QuantumScape** | Anode-Free Sulfide / Ceramic | 450 Wh/kg | Volkswagen PowerCo | 2027-2028 |\n| **Toyota / Idemitsu** | Sulfide-based Solid Electrolyte | 480 Wh/kg | Toyota Motor Corp | Late 2027 |\n| **Solid Power** | Sulfide Solid Electrolyte | 390 Wh/kg | BMW / Ford | 2027 |\n| **CATL** | Condensed / Semi-Solid | 500 Wh/kg | Internal / Global OEMs | 2026 Pilot |\n\n## Critical Risks & Unresolved Questions\n1. **Continuous Sintering Yields**: Defect rates during thin-film electrolyte sintering remain higher than liquid battery standards, risking cost parity targets.\n2. **Lithium Dendrite Growth Under High C-Rates**: Fast-charging (>4C) at sub-zero temperatures still induces microscopic intergranular dendrite propagation in ceramic separators.\n3. **Supply Chain Scarcity for High-Purity Lithium Sulfide**: Upstream chemical precursor capacity for Li2S is concentrated among fewer than 4 global processors.\n\n## Strategic Recommendations & Action Items\n* **30-Day**: Audit battery raw material procurement exposure to high-purity lithium sulfide suppliers.\n* **60-Day**: Evaluate joint development agreements (JDAs) with cathode active material suppliers optimized for high-voltage solid electrolytes.\n* **90-Day**: Establish benchmarking protocols for second-generation silicon-dominant vs. lithium-metal anode solid-state cells.\n\n## Source Index & Confidence Assessment\n* QuantumScape PowerCo Industrialization Filing (High Confidence)\n* Toyota Motor Manufacturing Technology Bulletin Q1 2026 (High Confidence)\n* US Department of Energy Battery500 Progress Report (Very High Confidence)',
    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;"><div style="max-width: 680px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;"><h1 style="color: #38bdf8; font-size: 24px; margin-bottom: 16px;">Solid-State Battery Commercialization: Q1 2026 Executive Intelligence Brief</h1><div style="background-color: #0369a1; padding: 16px; border-radius: 8px; margin-bottom: 24px;"><h3 style="margin-top: 0; color: #ffffff;">Executive Summary</h3><ul style="margin: 0; padding-left: 20px; color: #e0f2fe;"><li>Tier-1 automakers entering pilot line validation for all-solid-state cells.</li><li>Projected gravimetric densities reach 460 Wh/kg with 0% thermal runaway propagation.</li></ul></div><p style="color: #94a3b8; font-size: 14px;">Dispatched via ResearchFlow AI Automated Engine</p></div></body></html>',
    6,
    6,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 55 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Seed Steps for Workflow A
INSERT INTO workflow_steps (workflow_id, step_type, step_order, status, duration_ms, started_at, completed_at, input_payload, output_payload)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'PLAN_EXPANSION', 1, 'COMPLETED', 1420, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 59 minutes', '{"topic": "Solid-State Battery Commercialization Q1 2026"}'::jsonb, '{"searchQueries": ["solid-state battery pilot production 2026", "QuantumScape Volkswagen PowerCo validation data", "automotive all-solid-state battery Wh/kg benchmark", "sulfide electrolyte manufacturing bottleneck"]}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'WEB_SCRAPE', 2, 'COMPLETED', 3850, NOW() - INTERVAL '1 hour 59 minutes', NOW() - INTERVAL '1 hour 58 minutes', '{"concurrency": 3}'::jsonb, '{"pagesFetched": 4, "totalTokens": 14200}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'SYNTHESIS', 3, 'COMPLETED', 6200, NOW() - INTERVAL '1 hour 58 minutes', NOW() - INTERVAL '1 hour 57 minutes', '{"model": "gemini-2.5-pro"}'::jsonb, '{"markdownLength": 2480}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'CRITIQUE_REVISE', 4, 'COMPLETED', 5100, NOW() - INTERVAL '1 hour 57 minutes', NOW() - INTERVAL '1 hour 56 minutes', '{"model": "gemini-2.5-pro"}'::jsonb, '{"factualAccuracyScore": 96, "structuralIntegrityScore": 94, "critiqueNotes": ["Verified energy density metric against official OEM filings", "Removed unverified pricing extrapolation"]}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'HTML_RENDER', 5, 'COMPLETED', 850, NOW() - INTERVAL '1 hour 56 minutes', NOW() - INTERVAL '1 hour 55 minutes', '{"inliner": "juice"}'::jsonb, '{"htmlBytes": 18450}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'EMAIL_DISPATCH', 6, 'COMPLETED', 1200, NOW() - INTERVAL '1 hour 55 minutes', NOW() - INTERVAL '1 hour 55 minutes', '{"recipients": ["exec-intel@researchflow.ai"]}'::jsonb, '{"messageId": "msg_sandbox_9942a", "status": "DELIVERED"}'::jsonb)
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- Seed Sources for Workflow A
INSERT INTO workflow_sources (workflow_id, url, title, snippet, extracted_text, status, http_status_code, tokens_estimate)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'https://energy-storage.org/reports/solid-state-battery-benchmarks-2026', 'Global Solid-State Battery Commercialization Outlook 2026', 'Comprehensive data on pilot manufacturing yields for sulfide and oxide electrolytes.', 'Automotive OEMs have invested over $12B into solid-state cell industrialization...', 'FETCHED', 200, 4200),
    ('20000000-0000-0000-0000-000000000001', 'https://automotive-tech-review.com/toyota-idemitsu-assb-timeline', 'Toyota & Idemitsu Announce Pre-Commercial Pilot Milestones', 'Technical update on sulfide solid electrolyte mass production facilities.', 'Idemitsu Kosan and Toyota confirmed pilot facility commissioning with 480 Wh/kg cell target...', 'FETCHED', 200, 3100)
ON CONFLICT DO NOTHING;

-- Seed Logs for Workflow A
INSERT INTO workflow_logs (workflow_id, step_type, log_level, message, metadata)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'PLAN_EXPANSION', 'INFO', 'Deconstructing topic into 4 orthogonal search vectors using gemini-2.5-flash.', '{"tokens": 320}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'WEB_SCRAPE', 'INFO', 'SSRF-safe web scraper fetched 4 high-authority source documents.', '{"pages": 4}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'SYNTHESIS', 'INFO', 'gemini-2.5-pro generated comprehensive 2,480-word executive briefing.', '{"status": "OK"}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'CRITIQUE_REVISE', 'INFO', 'Self-critique pass completed: 96% factual accuracy score. Corrections applied.', '{"score": 96}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'HTML_RENDER', 'INFO', 'Juice CSS inliner generated responsive, email-compliant HTML report.', '{"size": "18.4KB"}'::jsonb),
    ('20000000-0000-0000-0000-000000000001', 'EMAIL_DISPATCH', 'INFO', 'Transactional email successfully dispatched to 2 recipients.', '{"recipients": 2}'::jsonb);

-- Workflow B: AWAITING_REVIEW run (Ready for human approval & inline edits!)
INSERT INTO workflows (
    id,
    title,
    topic,
    category,
    depth_level,
    status,
    require_approval,
    recipients,
    configuration,
    raw_synthesis_markdown,
    revised_synthesis_markdown,
    current_step_index,
    total_steps,
    started_at
) VALUES (
    '20000000-0000-0000-0000-000000000002',
    'Agentic AI Orchestration Frameworks Comparison',
    'Comparative technical evaluation of AutoGen, LangGraph, and CrewAI for multi-agent enterprise automation in production environments.',
    'TECH_FEASIBILITY',
    'COMPREHENSIVE',
    'AWAITING_REVIEW',
    TRUE,
    '["lead-architect@ai-enterprise.io"]'::jsonb,
    '{"stylingTemplate": "Technical Deep-Dive", "accentColor": "#10b981"}'::jsonb,
    '# Multi-Agent Frameworks: Architectural Comparison\n\nDraft comparison of state management and concurrency across LangGraph and AutoGen...',
    '# Enterprise Agentic AI Frameworks: 2026 Production Architecture Briefing\n\n## Executive Summary\n* **State Graph Superiority**: LangGraph currently leads enterprise adoptions requiring deterministic cyclic state machines, checkpoints, and multi-actor human-in-the-loop (HITL) workflows.\n* **Autonomous Group Dynamics**: Microsoft AutoGen excels at open-ended collaborative consensus dialogues, but introduces higher non-deterministic token consumption in production.\n* **Orchestration Ergonomics**: CrewAI provides the steepest developer productivity curve for sequential/hierarchical role-playing teams, though with constrained lower-level network topology controls.\n\n## Strategic Architecture Comparison\n\n| Evaluation Vector | LangGraph (LangChain) | AutoGen (Microsoft) | CrewAI |\n|---|---|---|---|\n| **Core Execution Engine** | Stateful Directed Graph (Pregel-inspired) | Conversable Agent Actor Model | Hierarchical / Sequential Process |\n| **State Persistence** | Native Postgres / SQLite Checkpointers | In-Memory / Custom Cache | In-Memory / Vector Storage |\n| **Fault-Tolerance & Replay** | Atomic node rollbacks & time-travel | Conversation history replay | Step-level retry hooks |\n| **Concurrency Pattern** | Async branch fork/join | Event-driven message bus | Worker thread pool |\n| **Production Readiness** | High (Strict schema validation) | Moderate (Higher token overhead) | Moderate (Rapidly maturing) |\n\n## Critical Implementation Vulnerabilities\n1. **Unbounded Agent Loops**: Unchecked mutual feedback between agent nodes without strict iteration ceilings can result in 10x token bill spikes.\n2. **State Serialization Bottlenecks**: Complex multi-megabyte shared memory context graphs degrade Postgres checkpointer throughput under high RPS.\n\n## Recommendations (30-60-90 Days)\n* **30-Day**: Standardize on LangGraph for stateful transactional pipelines requiring human sign-off gates.\n* **60-Day**: Implement Redis-backed token circuit-breakers at the gateway layer for all autonomous agent execution nodes.\n* **90-Day**: Deploy automated synthetic evaluations measuring task resolution rate vs. dollar cost per run.\n\n## Source Index\n* LangChain StateGraph Benchmarks\n* Microsoft Research AutoGen Production Studies\n* Enterprise AI Benchmark Consortium Report Q1 2026',
    4,
    6,
    NOW() - INTERVAL '15 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Seed Steps for Workflow B
INSERT INTO workflow_steps (workflow_id, step_type, step_order, status, duration_ms, started_at, completed_at, input_payload, output_payload)
VALUES
    ('20000000-0000-0000-0000-000000000002', 'PLAN_EXPANSION', 1, 'COMPLETED', 1350, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '14 minutes', '{"topic": "Agentic AI Orchestration Frameworks"}'::jsonb, '{"searchQueries": ["LangGraph production architecture benchmarks", "AutoGen enterprise state machine tradeoffs", "CrewAI hierarchical execution limits"]}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'WEB_SCRAPE', 2, 'COMPLETED', 3400, NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '13 minutes', '{"concurrency": 3}'::jsonb, '{"pagesFetched": 5, "totalTokens": 18900}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'SYNTHESIS', 3, 'COMPLETED', 7100, NOW() - INTERVAL '13 minutes', NOW() - INTERVAL '11 minutes', '{"model": "gemini-2.5-pro"}'::jsonb, '{"markdownLength": 3200}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'CRITIQUE_REVISE', 4, 'COMPLETED', 5400, NOW() - INTERVAL '11 minutes', NOW() - INTERVAL '10 minutes', '{"model": "gemini-2.5-pro"}'::jsonb, '{"factualAccuracyScore": 93, "structuralIntegrityScore": 96, "critiqueNotes": ["Refined state persistence comparison table", "Clarified token consumption risks"]}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'HTML_RENDER', 5, 'PENDING', NULL, NULL, NULL, NULL, NULL),
    ('20000000-0000-0000-0000-000000000002', 'EMAIL_DISPATCH', 6, 'PENDING', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- Seed Sources for Workflow B
INSERT INTO workflow_sources (workflow_id, url, title, snippet, extracted_text, status, http_status_code, tokens_estimate)
VALUES
    ('20000000-0000-0000-0000-000000000002', 'https://arxiv.org/abs/2402.multi-agent-orchestration', 'Architectures of Multi-Agent AI Systems: Tradeoffs and Benchmarks', 'Evaluation of state-persistence models across contemporary agent frameworks.', 'State persistence models in LangGraph leverage Pregel-style directed acyclic and cyclic graphs...', 'FETCHED', 200, 6100),
    ('20000000-0000-0000-0000-000000000002', 'https://github.com/langchain-ai/langgraph/discussions/production', 'LangGraph Enterprise Deployment Patterns', 'Discussion on checkpoint durability and PostgreSQL connection pools.', 'When deploying to high-throughput endpoints, connection pooling for Postgres checkpointer is paramount...', 'FETCHED', 200, 4800)
ON CONFLICT DO NOTHING;

-- Seed Logs for Workflow B
INSERT INTO workflow_logs (workflow_id, step_type, log_level, message, metadata)
VALUES
    ('20000000-0000-0000-0000-000000000002', 'PLAN_EXPANSION', 'INFO', 'Generated 3 high-precision search queries targeting architecture tradeoffs.', '{"queries": 3}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'WEB_SCRAPE', 'INFO', 'Extracted 18,900 tokens of verified technical documentation.', '{"tokens": 18900}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'SYNTHESIS', 'INFO', 'Synthesized architectural matrix comparing LangGraph, AutoGen, and CrewAI.', '{"model": "gemini-2.5-pro"}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'CRITIQUE_REVISE', 'INFO', 'Critique agent validated state persistence and concurrency claims (Score: 93/100).', '{"score": 93}'::jsonb),
    ('20000000-0000-0000-0000-000000000002', 'CRITIQUE_REVISE', 'WARN', 'Approval gate active: Pausing execution for human inspection before email dispatch.', '{"status": "AWAITING_REVIEW"}'::jsonb);
