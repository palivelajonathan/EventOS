# EventOS Production Deployment & Operations Guide

## 1. Prerequisites & Services

1. **Supabase Account**: PostgreSQL 15+ database with Realtime extension enabled.
2. **Hosting**: Vercel, Railway, AWS ECS, or Docker container.
3. **LLM Provider**: Google AI Studio API key (`GEMINI_API_KEY`).

---

## 2. Environment Variables Configuration

Create `.env.production` (or inject into your hosting provider dashboard):

```bash
# ------------------------------------------------------------------------------
# SUPABASE CONFIGURATION
# ------------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ------------------------------------------------------------------------------
# APP CONFIGURATION
# ------------------------------------------------------------------------------
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://eventos.sh
EVENTOS_SECRET_KEY=generate_a_64_character_hex_random_key

# ------------------------------------------------------------------------------
# AI INTELLIGENCE
# ------------------------------------------------------------------------------
GEMINI_API_KEY=AIzaSy...

# ------------------------------------------------------------------------------
# AUTOMATION & WEBHOOKS (Optional)
# ------------------------------------------------------------------------------
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/eventos
```

---

## 3. Database Migration Sequence

Run the migrations in sequential order against your Supabase SQL editor or via Supabase CLI (`supabase db push`):

1. **`supabase/migrations/001_initial_schema.sql`**:
   - Creates all tables (`organizations`, `events`, `tiers`, `participants`, `check_ins`, `sessions`, `certificates`, `gates`, `webhooks`).
   - Configures foreign keys and cascading deletion rules.
   - Creates performance indexes.
   - Deploys the atomic `process_check_in` stored procedure with row-level locks.
   - Configures Supabase Realtime publication on `check_ins`.
   - Enables Row-Level Security (RLS) on all tables.

2. **`supabase/migrations/002_seed_demo_data.sql`** *(OPTIONAL — DEVELOPMENT ONLY)*:
   - Contains seed data for the Dynamite 2026 showcase.
   - **DO NOT run in production**. Production environments should start with empty organization and event tables.

---

## 4. Production Fail-Loud Policy

EventOS enforces a strict fail-loud policy:

- In `NODE_ENV === 'production'`, if `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing or invalid, the API and data service **refuse to fall back to mock data**.
- Instead, the application throws an explicit error:
  `[CRITICAL PRODUCTION ERROR] Supabase is not configured or unreachable.`
- API endpoints return `HTTP 503 (DATABASE_UNAVAILABLE)` rather than misleading organizers with synthetic telemetry.

---

## 5. Build & Health Check

```bash
# Install dependencies
npm ci

# Production build
npm run build

# Start production server
npm start
```

### Health Verification
- Confirm `GET /api/participants` returns `401 Unauthorized` without credentials (proves auth guard is active).
- Confirm `GET /api/certificates/pdf/CERT-DYN-2026-88912` returns `200 OK` with `Content-Type: application/pdf`.
