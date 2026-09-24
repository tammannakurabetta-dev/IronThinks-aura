# Agri-Genome OS: AI-Powered Agriculture Crop Advisory Assistant

> **Production-grade, resilient, data-driven agricultural intelligence platform powered by Gemini 2.5 Pro via `@google/genai` with strict multi-tenant Supabase PostgreSQL Row Level Security (RLS).**

---

## 🌾 Platform Highlights

- **Hyper-Local Field Parameters**: Ingestion of soil nutrient profiles (N-P-K, pH, Organic Carbon), growth phenology stages, microclimate/weather factors, and visual leaf/symptom image uploads.
- **Strictly Typed AI Inference Engine**: Backend-isolated LLM execution using Google Gen AI SDK (`@google/genai`) targeting `gemini-2.5-pro` with rigid structured JSON schemas (`cropAdvisoryGeminiSchema`). Zero hallucination guarantee.
- **Multi-Tenant Supabase Architecture**: Multi-tier isolation for Profiles, Farms, Plots, Advisories, and Action Items protected by comprehensive PostgreSQL Row Level Security (RLS) policies and storage buckets.
- **Dynamic Agronomic Visualizations**:
  - **NPKGaugeChart**: Visual stoichiometric meter representing target vs. actual Nitrogen, Phosphorus, Potassium levels with prescribed additions in kg/ha.
  - **MoistureTimeline**: Area chart tracking evapotranspiration (ET mm/day) against soil moisture deficit with optimal watering cycles.
  - **3-Tier Integrated Pest Management (IPM)**: Cultural, biological, and chemical interventions specifying active ingredients, dosage rates, Pre-Harvest Intervals (PHI), and mandatory PPE.
  - **ActionItemTracker**: Interactive execution checklist where farmers mark chemical sprays or irrigation tasks as completed (`PENDING` / `DONE`).
  - **AdvisoryPdfExportButton**: Client-side document renderer generating branded, printable agronomic dossiers.
- **Offline-First Resilient Form Handling**: Client-side draft persistence with local storage syncing when connection drops.

---

## 🏛️ System Architecture

```
Crop Pilot AI (agri-genome-os)/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql     # Full DDL: tables, enums, triggers, RLS & seed data
│   ├── apply-migrations.js            # Node migration runner with health & schema checks
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/                    # Gemini Gen AI SDK & Supabase Client with sandbox fallback
│   │   ├── controllers/               # Advisory (Gemini 2.5 Pro), Farm, Plot, Action Item handlers
│   │   ├── middleware/                # Supabase JWT Auth, Rate Limiter (10 req/15min), Error Handler
│   │   ├── routes/                    # /api/v1/advisory, /api/v1/farms, /api/v1/plots
│   │   └── server.ts                  # Express bootstrapping with Helmet, CORS & Health endpoint
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/                       # API client injecting Supabase Bearer JWTs
│   │   ├── components/
│   │   │   ├── charts/                # NPKGaugeChart, MoistureTimeline
│   │   │   ├── common/                # RiskBadge, StatCard, ActionItemTracker, AdvisoryPdfExportButton
│   │   │   ├── forms/                 # SymptomPhotoUploader (client canvas compression + storage)
│   │   │   └── layout/                # Navbar, Sidebar, AppLayout
│   │   ├── context/                   # AuthContext with multi-role switching (Farmer, Agronomist, Admin)
│   │   ├── pages/                     # Dashboard, Plots, AdvisoryWizard, AdvisoryView, History, Settings, Login, Register
│   │   └── index.css                  # Tailored Agritech styling, glassmorphism & print formatting
│   ├── .env.example
│   └── package.json
└── shared/
    └── src/
        ├── constants.ts               # CROP_TYPES, SOIL_TYPES, GROWTH_STAGES, IRRIGATION_TYPES, DOMAINS
        ├── validators.ts              # Zod validation schemas across client & server boundaries
        └── types.ts                   # Domain contracts & Gemini 2.5 Pro JSON Schema types
```

---

## 🗄️ Database & PostgreSQL Migrations

The database migration is located in `supabase/migrations/001_initial_schema.sql`. It defines:
- **Custom ENUM Types**: `user_role` (`farmer`, `agronomist`, `admin`), `risk_level` (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), and `advisory_domain` (`SOIL_AND_NUTRIENT`, `PEST_AND_PATHOGEN`, `IRRIGATION_AND_WATER`, `CULTIVAR_AND_HARVEST`).
- **5 Core Tables**: `profiles`, `farms`, `plots`, `advisories`, and `advisory_action_items`.
- **Automatic Auth Trigger**: `handle_new_user()` populates a `profiles` row upon Supabase Auth signup.
- **Row Level Security**: Complete multi-tenant isolation ensuring users cannot query or mutate data from other accounts.
- **Storage Bucket**: `crop-symptoms` for high-resolution visual diagnosis imagery.
- **Demonstration Seed Data**: Pre-configured farm, 3 distinct plots (Wheat, Tomato, Corn), and realistic agronomic advisory records.

### Applying Migrations to Supabase

#### Option 1: Supabase Dashboard SQL Editor (Recommended)
1. Navigate to your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** tab from the left sidebar.
3. Copy the entire contents of [`supabase/migrations/001_initial_schema.sql`](file:///c:/Users/Tammanna/OneDrive/Desktop/Crop%20Pilot%20AI/supabase/migrations/001_initial_schema.sql) and paste into the editor.
4. Click **Run**.

#### Option 2: Automated Migration Script
1. In `server/.env`, set `DATABASE_URL` with your Supabase direct connection string (from **Project Settings** -> **Database** -> **Connection string**):
   ```ini
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
2. Run the migration script:
   ```bash
   node supabase/apply-migrations.js
   ```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```ini
PORT=5000
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Google Gemini API Key (from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Security
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`client/.env`)
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Backend & Frontend in Development Mode
In separate terminal windows:
```bash
# Terminal 1: Backend Express Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Vite React App (Port 5173)
npm run dev:client
```

### 3. Open in Browser
Visit **`http://localhost:5173`** to access the dashboard.
- **Instant Demo Login**: Click "Farmer", "Agronomist", or "Admin" on `/login` to access the sandbox directly without configuring third-party accounts first.
- **AI Diagnostics**: Head to `/advisory/new`, select a plot, review the metrics across the 4 steps, and click **Execute Gemini 2.5 Pro Inference**.
- **Action Tracking & PDF Export**: Check off tasks in the Action Item checklist or click **Export Official PDF** to print or save the advisory dossier.
