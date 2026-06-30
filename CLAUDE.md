# Personalized AI Assistant — Claude Code Project Guide

This file gives Claude Code full context when resuming this project in a new session.

---

## What This Project Is

A **production-quality, full-stack Adaptive AI Personal Assistant** — a portfolio project demonstrating:
- LLM provider abstraction (OpenAI / Anthropic / Google / Mock)
- **Learning Mode**: generates 3 response candidates → user selects → preference logged
- **Preference Memory**: LLM synthesizes logs into evolving user profile
- **Normal Mode**: auto-ranks 3 candidates using memory → streams best response
- **XAI Panel**: "Why this answer?" shows how memory shaped the response
- **Adaptive Preference Manager**: AI proactively suggests preference updates
- **LangGraph multi-agent orchestration** in Python FastAPI backend (rule-based, ready for real AI)

---

## Monorepo Structure

```
/
├── frontend/          Next.js 15 App Router — main app + all AI logic via API routes
│   ├── src/
│   │   ├── app/               Pages + API routes
│   │   │   ├── api/chat/      Core orchestrator (analyze→search→build→generate→rank→stream)
│   │   │   ├── api/preferences/ Preference log save + memory trigger
│   │   │   ├── api/memory/    Memory CRUD
│   │   │   ├── api/analytics/ Dashboard stats
│   │   │   ├── api/explanation/ XAI panel data
│   │   │   ├── api/suggestions/ Phase 14 suggestion CRUD
│   │   │   └── api/prompt-versions/ Prompt Lab data
│   │   ├── features/
│   │   │   ├── assistant/     Chat UI, streaming hook, message components
│   │   │   ├── learning/      Candidate cards, tag selector
│   │   │   ├── xai/           Explanation panel ("Why this answer?")
│   │   │   ├── preference-manager/ Suggestion banner (Phase 14)
│   │   │   └── dashboard/     Charts, stats, memory card
│   │   ├── services/ai/
│   │   │   ├── provider/      LLMProvider interface + OpenAI/Anthropic/Google/Mock impls
│   │   │   ├── task-analyzer.ts   Classifies user queries into TaskType
│   │   │   ├── candidate-generator.ts  Generates 3 style-specific candidates
│   │   │   ├── evaluator.ts    Scores candidates on 8 dimensions
│   │   │   ├── ranker.ts       Ranks by score + memory preference bonus
│   │   │   ├── memory-generator.ts  LLM-based preference memory synthesis
│   │   │   ├── explainer.ts    XAI explanation generator
│   │   │   ├── prompt-builder.ts   Assembles + versions system prompts
│   │   │   └── preference-suggester.ts  Detects patterns, creates suggestions
│   │   ├── services/search/   Tavily web search integration
│   │   ├── stores/            Zustand (mode, sessionId, settings)
│   │   ├── types/index.ts     ALL domain types (single source of truth)
│   │   └── lib/               prisma, session, constants, utils
│   ├── prisma/
│   │   ├── schema.prisma      SQLite for local dev (switch to postgresql for prod)
│   │   └── dev.db             Local SQLite database
│   └── .env.local             DATABASE_URL + LLM_PROVIDER + API keys
└── backend/           FastAPI + LangGraph — multi-agent orchestration
    └── app/
        ├── main.py            FastAPI app, CORS, router registration
        ├── core/config.py     Settings via pydantic-settings
        ├── features/
        │   ├── assistant/
        │   │   ├── graph.py   12-node LangGraph graph (rule-based, ready for AI)
        │   │   └── router.py  POST /api/v1/assistant/chat
        │   ├── memory/service.py
        │   ├── xai/service.py
        │   └── preference_manager/service.py
        └── requirements.txt
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 15 App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Linear design system |
| State | Zustand (persisted) |
| Server state | TanStack Query |
| AI SDK | Vercel AI SDK v4 (`ai` package) |
| LLM providers | OpenAI / Anthropic / Google (via `@ai-sdk/*`) |
| Database ORM | Prisma 5 (SQLite local, PostgreSQL prod) |
| Charts | Recharts |
| Markdown | ReactMarkdown + react-syntax-highlighter |
| Animations | Framer Motion |
| Backend | FastAPI + Python 3.9 |
| Agent graph | LangGraph 0.2.x |
| Validation | zod v3 (v4 incompatible with AI SDK) |

---

## LLM Provider System

Controlled entirely by environment variables. **Zero code changes to switch providers.**

```bash
# In frontend/.env.local:
LLM_PROVIDER=mock      # Rule-based, no API key needed (DEFAULT)
LLM_PROVIDER=openai    # Requires OPENAI_API_KEY
LLM_PROVIDER=anthropic # Requires ANTHROPIC_API_KEY
LLM_PROVIDER=google    # Requires GOOGLE_API_KEY
```

- Provider singleton created in `src/services/ai/provider/index.ts`
- `getModel()` → used for complex tasks (candidate generation, memory, explanations)
- `getFastModel()` → used for quick tasks (task analysis, evaluation)

---

## Database Schema Key Points

**SQLite for local dev** — all `String[]` fields are stored as JSON strings.
When writing arrays to Prisma: `JSON.stringify(array)`
When reading arrays from Prisma: `JSON.parse(field as string)`

Fields stored as JSON strings:
- `PreferenceLog.selectedTags`
- `PreferenceMemory.preferredStrategies`, `avoidedPatterns`, `domainPreferences`, `strategyWeights`
- `ResponseExplanation.memoryInfluence`, `reasoningFactors`, `memorySnapshot`, `rankingDetails`
- `PreferenceSuggestion.triggerLogIds`
- `PreferenceMemoryVersion.snapshot`, `diff`
- `PromptVersion.components`

**Switch to PostgreSQL for production**: change `provider = "sqlite"` → `"postgresql"` in schema.prisma and update DATABASE_URL.

---

## Design System: Linear

The app uses the **Linear.app design system** (dark-mode native):

| Token | Value |
|-------|-------|
| Page bg | `#08090a` |
| Panel/sidebar | `#0f1011` |
| Card surface | `#191a1b` |
| Hover surface | `#28282c` |
| Primary text | `#f7f8f8` |
| Secondary text | `#d0d6e0` |
| Muted text | `#8a8f98` |
| Brand indigo | `#5e6ad2` |
| Accent violet | `#7170ff` |
| Border standard | `rgba(255,255,255,0.08)` |
| Success | `#10b981` |

Typography: Inter Variable with `font-feature-settings: "cv01", "ss03"`.

---

## Current Status

All 14 phases implemented:

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Architecture, types, schema, session | ✅ |
| 2 | AI core (streaming chat, task analyzer) | ✅ |
| 3 | Learning Mode (3 candidates) | ✅ |
| 4 | Preference Engine (log saving) | ✅ |
| 5 | Memory Engine (LLM synthesis) | ✅ |
| 6 | Prompt Builder (dynamic + versioned) | ✅ |
| 7 | Web Search (Tavily) | ✅ |
| 8 | Normal Mode (auto-rank + stream) | ✅ |
| 9 | Dashboard (charts + analytics) | ✅ |
| 10 | Prompt Lab (version inspector) | ✅ |
| 11 | Evaluation Engine (8-dimension scoring) | ✅ |
| 12 | Production Polish | ✅ |
| 13 | XAI — "Why this answer?" | ✅ |
| 14 | Adaptive Preference Manager | ✅ |

**LangGraph backend**: 12 nodes fully implemented with rule-based logic. Real AI calls to be wired in final production phase.

---

## Running Locally

```bash
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:3000

# Backend (optional — frontend works standalone)
cd backend
pip3 install fastapi uvicorn langgraph langchain-core httpx pydantic structlog
uvicorn app.main:app --reload   # http://localhost:8000
```

Database is SQLite — no setup needed. `prisma/dev.db` is created automatically.

---

## Known Issues / Next Steps

1. **Real AI integration**: Set `LLM_PROVIDER=openai` (or anthropic/google) in `.env.local` with a real API key
2. **Production DB**: Switch schema.prisma to `provider = "postgresql"`, set DATABASE_URL to a real Postgres connection string, run `prisma migrate deploy`
3. **Tavily search**: Set `TAVILY_API_KEY` for real web search
4. **LangGraph → Frontend bridge**: The FastAPI backend has working endpoints at `/api/v1/assistant/chat` but is not yet called from the Next.js frontend (frontend handles AI locally). Connect them in a future phase.
5. **MCP tools**: Toggle `mcp_github_enabled`, `mcp_google_calendar_enabled`, etc. in backend config once MCP servers are set up.

---

## Important Constraints

- **zod v3 only** — v4 is incompatible with Vercel AI SDK's `generateObject`
- **`LanguageModel` type** — use `as unknown as LanguageModel` when casting AI SDK provider returns
- **Prisma JSON writes** — use `as never` cast for JSON fields
- **Array fields in SQLite** — always `JSON.stringify()` before write, `JSON.parse()` after read
