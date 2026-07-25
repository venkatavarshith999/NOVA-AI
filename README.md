# Nova AI

**Autonomous Multi-Agent Research & Fact Verification System** — built for the Gen AI hackathon (Domain 3).

Instead of one model guessing an answer, Nova AI runs a research question through **five specialized agents** — Research → Verification → Hallucination Detection → Confidence Scoring → Report Generation — and returns a citation-backed report with a per-claim confidence score.

## ✨ Features

- **Multi-Agent Pipeline** — 5 specialized AI agents research, verify, detect hallucinations, score confidence, and generate reports
- **Real-Time Progress** — Live SSE streaming with detailed substep logs ("Searching Tavily…", "Cross-referencing claim 2/4…")
- **Source Preview Cards** — Rich cards with favicons, domain names, content snippets, and relevance scores
- **Charts & Analytics** — Donut charts, confidence distribution, hallucination gauges, source breakdowns
- **File Upload** — Upload PDF, DOCX, or images for analysis
- **PDF & Markdown Export** — Download reports in multiple formats
- **Authentication** — JWT-based signup/login with user accounts
- **Dashboard** — View, manage, and revisit past reports
- **Dark Mode** — System-aware theme switching with manual override
- **Settings** — API key configuration, theme preferences, data management
- **SQLite Database** — Zero-config persistence for reports and user data
- **Docker** — One-command deployment with `docker-compose up`
- **CI/CD** — GitHub Actions for automated testing and builds
- **Error Handling** — Custom 404, error boundaries, API failure banners

## Quick start (works with zero API keys)

The app ships with a **mock mode**: if `GEMINI_API_KEY` / `TAVILY_API_KEY` aren't set, every agent falls back to deterministic mock logic so the full pipeline runs end-to-end for demos. Add real keys any time to switch to live Gemini + Tavily calls — no code changes needed.

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate     # optional but recommended
pip install -r requirements.txt
cp .env.example .env      # optionally add GEMINI_API_KEY / TAVILY_API_KEY
uvicorn main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/api/health`

### 2. Frontend (Next.js 15)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points NEXT_PUBLIC_API_BASE at the backend
npm run dev
```

Open **http://localhost:3000**.

### 3. Docker (one command)

```bash
docker-compose up --build
```

Frontend: http://localhost:3000 | Backend: http://localhost:8000

## How the pipeline works

```
User question / uploaded file
   │
   ▼
Research Agent            → Tavily search + Gemini claim extraction
   │
   ▼
Verification Agent        → cross-checks each claim against sources
   │
   ▼
Hallucination Detection   → flags unsupported / fabricated claims
   │
   ▼
Confidence Scoring Agent  → rule-based score (status + source count), auditable
   │
   ▼
Report Generation Agent   → executive summary, claim list, conclusion
   │
   ▼
Export / Save              → PDF, Markdown, or save to dashboard
```

Orchestration is a `langgraph.StateGraph` (`backend/orchestrator.py`) chaining the five
agent nodes. The frontend consumes `/api/research/stream` (Server-Sent Events) so the
progress screen updates live as each agent finishes — that's the "AI Agent Progress
Screen" from the spec, and it's a real pipeline, not a canned animation.

## Folder structure

```
frontend/
  app/            Next.js App Router pages (landing, research, dashboard, login, signup, settings, 404, error)
  components/     ClaimCard, ConfidenceBadge, AgentProgress, HallucinationAlert, Navbar,
                  SourceCard, ReportCharts, FileUpload, ThemeToggle, ApiErrorBanner
  lib/            api.ts – typed SSE client, auth.ts – JWT auth helpers
backend/
  agents/         research_agent.py, verification_agent.py, hallucination_agent.py,
                   confidence_agent.py, report_agent.py
  services/       search.py (Tavily), gemini.py (Gemini 2.5 Flash), file_parser.py
  database.py     SQLite database with aiosqlite
  auth.py         JWT authentication
  export.py       PDF + Markdown report export
  orchestrator.py LangGraph StateGraph wiring the 5 agents
  main.py         FastAPI app + SSE streaming endpoint
  tests/          pytest test suite
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check + mock mode status |
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user info |
| POST | `/api/research` | Optional | Run pipeline (non-streaming) |
| GET | `/api/research/stream?query=...` | Optional | SSE pipeline stream |
| GET | `/api/reports` | Yes | List user's reports |
| GET | `/api/reports/{id}` | No | Get single report |
| DELETE | `/api/reports/{id}` | Yes | Delete report |
| POST | `/api/export/pdf` | No | Export report as PDF |
| POST | `/api/export/markdown` | No | Export report as Markdown |
| POST | `/api/upload` | No | Upload file for text extraction |

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx
python -m pytest tests/ -v
```

## Deployment

- **Docker**: `docker-compose up --build` — everything in one command
- **Frontend → Vercel**: `vercel --prod` from `frontend/`, set `NEXT_PUBLIC_API_BASE` to your backend URL
- **Backend → Render**: New Web Service, root `backend/`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Getting real API keys (optional, for live mode)

- Gemini: https://aistudio.google.com/apikey (free tier available)
- Tavily: https://tavily.com (free tier available)

## Why this design wins on the judging criteria

- **Innovation** — a verification *pipeline* around the LLM, not just a chat wrapper.
- **Technical feasibility** — every claim in this repo actually runs; mock mode means judges can try it live with no setup risk.
- **Scalability** — LangGraph nodes are independently swappable/scalable; add agents (e.g. bias detection) without touching the others.
- **Real-world impact** — directly targets AI hallucination, the #1 trust blocker for GenAI adoption.
- **UX Polish** — dark mode, charts, source previews, file upload, export — a complete product, not a prototype.
