"""
Assistant Router — FastAPI endpoints for the LangGraph assistant pipeline.

Exposes:
  POST /assistant/chat   — run the full graph, return candidates + best response
  GET  /assistant/health — graph health check
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from .graph import build_graph

router = APIRouter(prefix="/assistant", tags=["assistant"])

_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


# ── Request / Response schemas ────────────────────────────────

class ChatRequest(BaseModel):
    user_message: str
    mode: str = "NORMAL"
    user_id: str = "anonymous"
    session_id: str = "default"
    conversation_history: list = []
    memory: dict = {}


class ChatResponse(BaseModel):
    mode: str
    candidates: list
    best_candidate: Optional[dict] = None
    explanation: Optional[dict] = None
    task_analysis: dict
    system_prompt: str


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Run the full LangGraph assistant pipeline for a single user message.

    In NORMAL mode  — returns best_candidate + explanation.
    In LEARNING mode — returns all 3 candidates for user selection.
    """
    graph = get_graph()

    initial_state = {
        "user_message": req.user_message,
        "conversation_history": req.conversation_history,
        "mode": req.mode,
        "user_id": req.user_id,
        "session_id": req.session_id,
        "task_analysis": {},
        "needs_search": False,
        "search_results": [],
        "mcp_tools_needed": [],
        "context": "",
        "system_prompt": "",
        "candidates": [],
        "evaluations": [],
        "ranked_candidates": [],
        "best_candidate": {},
        "explanation": {},
        "memory": req.memory,
        "prompt_version": 0,
    }

    result = graph.invoke(initial_state)

    return ChatResponse(
        mode=req.mode,
        candidates=result.get("candidates", []),
        best_candidate=result.get("best_candidate"),
        explanation=result.get("explanation"),
        task_analysis=result.get("task_analysis", {}),
        system_prompt=result.get("system_prompt", ""),
    )


@router.get("/health")
async def health():
    """Return graph health status."""
    return {"status": "ok", "graph": "rule-based"}
