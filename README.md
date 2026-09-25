# ResearchFlow AI - Automated Multi-Step Research Workflow Manager

> **Production-grade, stateful, automated multi-step research workflow orchestration engine powered by Google Gemini 2.5 Pro & Flash (`@google/genai`), PostgreSQL FSM state machine with Supabase migrations, Cheerio SSRF-safe web ingestion, Juice responsive inline-CSS email compilation, and real-time Server-Sent Events (SSE) telemetry.**

---

## ⚡ Platform Architecture & Pipeline Stages

ResearchFlow AI transforms single high-level research questions into executive-grade, verified intelligence briefings dispatched via transactional email:

```
[ Research Prompt / Topic ]
           │
           ▼
Stage 1: PLAN_EXPANSION   ──► Deconstructs into 3–5 orthogonal search vectors via gemini-2.5-flash
           │
           ▼
Stage 2: WEB_SCRAPE       ──► SSRF-safe Cheerio web crawl, size & timeout caps, semantic extraction
           │
           ▼
Stage 3: SYNTHESIS        ──► Deep analytical briefing compilation via gemini-2.5-pro
           │
           ▼
Stage 4: CRITIQUE_REVISE  ──► Autonomous fact-checking, grounding critique, and revision
           │
           ▼
   [ HUMAN-IN-THE-LOOP ]  ──► Optional approval gate (AWAITING_REVIEW) for inline markdown edits
           │
           ▼
Stage 5: HTML_RENDER      ──► Semantic HTML conversion & Juice inline-CSS email compilation
           │
           ▼
Stage 6: EMAIL_DISPATCH   ──► Transactional dispatch via Resend / Nodemailer (verified Ethereal sandbox)
```

---

## 🚀 Key Features

1. **Stateful Finite-State Machine (FSM) Engine**:
   - Atomic state transitions: `QUEUED` ➔ `RUNNING` ➔ `AWAITING_REVIEW` ➔ `COMPLETED` / `FAILED` / `CANCELLED`.
   - Every stage duration, input payload, output payload, and error boundary is persisted in PostgreSQL.
2. **Dual-Model Gemini Intelligence**:
   - **gemini-2.5-flash**: Fast query expansion, search vector formulation, and priority entity ranking.
   - **gemini-2.5-pro**: Multi-page deep synthesis and autonomous self-critique with citation verification.
3. **SSRF-Guarded Web Ingestion**:
   - Enforces IP blacklisting (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`, cloud metadata endpoints).
   - 8-second request timeout caps with 2MB payload ceilings and Cheerio DOM noise stripping.
4. **Human-in-the-Loop (HITL) Review Gate**:
   - Halts at `AWAITING_REVIEW` prior to final dispatch.
   - Interactive split-screen Markdown / HTML editor allows users to edit synthesized content inline.
   - Single-click "Approve & Send Report" with celebratory confetti and automated retry on failed stages.
5. **Mobile-Responsive Inlined Email Generator**:
   - Juice inlines all CSS rules into email client-compliant tables (tested on Gmail, Apple Mail, Outlook).
   - Live Desktop (680px) and Mobile (375px) iframe previewers with "Send Test Email" utility.
6. **Real-time Server-Sent Events (SSE)**:
   - Live streaming terminal log viewer with color-coded levels (`INFO`, `WARN`, `ERROR`, `DEBUG`).
   - Autoscroll toggle, keyword filtering, and clipboard export.

---

## 🗄️ Database & Supabase Migrations

The database is built on PostgreSQL with Row Level Security (RLS) policies and triggers.

### Schema File
- `supabase/migrations/001_initial_schema.sql` (24.5 KB):
  - Enums: `workflow_status`, `step_type`, `step_status`
  - Tables: `workflows`, `workflow_steps`, `workflow_sources`, `workflow_logs`, `workflow_templates`
  - Indexes & `update_updated_at_column` trigger
  - Pre-seeded with 4 default templates and 3 realistic research workflows.

### Running Migrations Against Supabase
1. **Option A (Automated Runner)**:
   Add your database URI in `server/.env`:
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
   Then run:
   ```bash
   npm run migrate
   ```
2. **Option B (Supabase Dashboard SQL Editor)**:
   Copy the contents of `supabase/migrations/001_initial_schema.sql` and run directly in your Supabase SQL Editor.

---

## 🛠️ Project Structure

```
researchflow/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql       # PostgreSQL DDL, RLS policies & seed data
│   ├── apply-migrations.js              # Migration execution & health verification script
│   └── package.json
├── shared/
│   └── src/
│       ├── schemas/workflow.ts          # Zod validation schemas (bidirectional contracts)
│       ├── types.ts                     # TypeScript interfaces & SSE message types
│       └── index.ts
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts            # PG pool, Supabase client & in-memory fallback
│   │   │   └── repository.ts            # Transactional workflow data access layer
│   │   ├── lib/
│   │   │   ├── gemini.ts                # @google/genai caller (gemini-2.5-pro / flash)
│   │   │   ├── scraper.ts               # SSRF-guarded Cheerio web ingestion
│   │   │   ├── emailRenderer.ts         # Markdown -> HTML + Juice CSS inliner
│   │   │   └── email.ts                 # Resend API & Nodemailer sandbox delivery
│   │   ├── orchestrator/
│   │   │   ├── engine.ts                # 6-stage FSM state machine runner
│   │   │   └── sseManager.ts            # SSE event bus & heartbeat management
│   │   ├── routes/
│   │   │   ├── workflows.ts             # REST & SSE streaming controllers
│   │   │   ├── templates.ts             # Template presets controller
│   │   │   └── settings.ts              # System health & API diagnostics
│   │   └── server.ts                    # Express bootstrap, CORS, Helmet & rate-limiting
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/workflowClient.ts        # TanStack Query client & SSE subscription hook
│   │   ├── components/
│   │   │   ├── layout/AppLayout.tsx     # Navigation sidebar & engine status badge
│   │   │   ├── workflow/
│   │   │   │   ├── WorkflowPipelineGraph.tsx # 6-stage interactive visualizer
│   │   │   │   ├── LiveLogViewer.tsx    # Terminal log console with filters & autoscroll
│   │   │   │   ├── SourcesGrid.tsx      # Ingested sources cards & text inspector
│   │   │   │   └── ApprovalActionBar.tsx # HITL sign-off bar with confetti
│   │   │   ├── preview/
│   │   │   │   ├── MarkdownEditorPanel.tsx # Split-screen editor & live renderer
│   │   │   │   └── EmailIframePreview.tsx  # Responsive desktop/mobile email preview
│   │   │   └── common/StatusBadge.tsx   # Universal status badge component
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # KPI metrics & recent workflows table
│   │   │   ├── CreateWorkflow.tsx       # 4-stage pipeline configuration wizard
│   │   │   ├── WorkflowDetail.tsx       # Live execution command center
│   │   │   ├── Templates.tsx            # Report architecture preset browser
│   │   │   └── Settings.tsx             # Live API verification & diagnostics
│   │   ├── App.tsx                      # Client routing & layout wrapper
│   │   └── index.css                    # Tailwind CSS tokens & custom scrollbars
│   ├── index.html
│   └── package.json
└── package.json
```

---

## ⚙️ Environment Variables

Configure `server/.env` (see `server/.env.example`):

```ini
# Application Configuration
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Database (PostgreSQL / Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API (@google/genai)
GEMINI_API_KEY=your-gemini-api-key

# Email Dispatcher (resend | nodemailer | test)
EMAIL_PROVIDER=nodemailer
RESEND_API_KEY=re_your_resend_api_key_here
SYSTEM_FROM_EMAIL=reports@researchflow.ai

# Web Scraping Limits & Safeguards
MAX_CONCURRENT_SCRAPES=3
SCRAPER_TIMEOUT_MS=8000
MAX_SOURCE_PAGES=5
```

---

## 🏃 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migration
```bash
npm run migrate
```

### 3. Start Development Servers
Start both backend API and frontend client concurrently:

```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:client
```

Open your browser at **`http://localhost:5173`** to access the ResearchFlow AI dashboard.
