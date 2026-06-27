# Adaptive AI Assistant

A personalized AI chat assistant that learns your response preferences over time. The more you use it, the better it understands how you like information presented — tone, structure, length, and style.

## What makes it different

Most AI assistants treat every user the same. This one builds a **Preference Memory** of how you like to receive answers. It observes which response styles you select, detects patterns, and gradually adapts without you having to configure anything.

Key capabilities:

- **Learning Mode** — presents 3 differently-styled responses to the same question and asks which you prefer
- **Preference Memory** — an LLM-generated profile that evolves as your selections accumulate
- **Adaptive Responses** — in Normal Mode, silently picks the style that best fits your profile
- **XAI Panel** — "Why this answer?" reveals exactly which memory factors shaped the response
- **Smart Web Search** — auto-decides when a query benefits from real-time information
- **Adaptive Preference Manager** — proactively suggests preference updates when patterns emerge

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI Design | Linear design system — dark-mode native |
| State | Zustand |
| AI SDK | Vercel AI SDK v4 |
| LLM Providers | OpenAI / Anthropic / Google (switchable via env) |
| Backend | FastAPI + Python 3.11 |
| AI Orchestration | LangGraph (12-node multi-agent graph) |
| Database | SQLite (dev) → PostgreSQL (prod) via Prisma ORM |
| MCP | Model Context Protocol servers for tool extension |

## Architecture

```
User Message
    │
    ▼
┌─────────────────────────────────────┐
│         LangGraph Agent Graph        │
│                                     │
│  task_analyzer → search_decision    │
│      → [web_search]                 │
│      → mcp_router                   │
│      → context_builder              │
│      → prompt_builder               │
│      → candidate_generator (×3)     │
│      → evaluation → ranking         │
│      → [explainability]             │
│      → preference_learner           │
│      → memory_manager               │
└─────────────────────────────────────┘
    │
    ▼
Preference Memory (versioned, diff-tracked)
```

## Project Structure

```
Adaptive_AI_Assistant/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/            # Routes: /, /dashboard, /insights, /settings, /prompt-lab
│   │   ├── features/       # assistant, learning, xai, dashboard, preference-manager
│   │   ├── services/ai/    # provider, ranker, evaluator, explainer, memory-generator
│   │   └── stores/         # Zustand app-store
│   └── prisma/             # SQLite schema + migrations
└── backend/                # FastAPI app
    └── app/features/
        ├── assistant/      # LangGraph graph + router
        ├── memory/         # Preference memory service
        ├── xai/            # Explainability service
        └── preference_manager/  # Pattern detection
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local — set LLM_PROVIDER and keys
npx prisma migrate dev
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Environment Variables

```env
# frontend/.env.local
DATABASE_URL="file:./prisma/dev.db"
LLM_PROVIDER="mock"           # mock | openai | anthropic | google

# For real providers:
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_GENERATIVE_AI_API_KEY="..."
```

`LLM_PROVIDER=mock` runs fully offline with deterministic rule-based responses — no API key needed.

## 14-Phase Roadmap

| # | Phase | Status |
|---|---|---|
| 1 | Project Setup + Base Chat | ✅ Done |
| 2 | Learning Mode (3-candidate selection) | ✅ Done |
| 3 | Preference Logging | ✅ Done |
| 4 | Preference Memory (LLM-generated) | ✅ Done |
| 5 | LLM Provider Abstraction | ✅ Done |
| 6 | Multi-candidate Pipeline (evaluate + rank) | ✅ Done |
| 7 | Web Search Integration | ✅ Done |
| 8 | XAI — Explainability Panel | ✅ Done |
| 9 | Adaptive Preference Manager | ✅ Done |
| 10 | Dashboard + Insights | ✅ Done |
| 11 | Prompt Lab | ✅ Done |
| 12 | LangGraph Multi-Agent Backend | ✅ Done |
| 13 | MCP Integration | 🔧 Scaffolded |
| 14 | Production Polish + Real LLM | 🔜 Planned |

## Design System

Built on the **Linear design language** — minimal dark-mode UI with purposeful color use.

- Background: `#08090a`
- Surface: `#0f1011` / `#191a1b`
- Accent: `#7170ff` (indigo) / `#5e6ad2` (primary)
- Border: `rgba(255,255,255,0.08)`
- Text primary: `#f7f8f8`
- Text muted: `#8a8f98`

## License

MIT
