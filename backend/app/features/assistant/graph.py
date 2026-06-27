"""
Adaptive AI Graph — LangGraph multi-agent orchestration.

This is the central orchestrator for the entire AI pipeline.
Each node has a single responsibility and is independently testable.

Graph Flow:
  User Input
    → Task Analyzer Agent
    → Search Decision Agent
    → (optional) Search Agent
    → Context Builder Agent
    → Prompt Builder Agent
    → Candidate Generator Agent
    → Evaluation Agent
    → Candidate Ranking Agent
    → (Learning Mode) Return all 3 candidates
    → (Normal Mode) Return ranked best candidate
    → Preference Learning Agent (after user feedback)
    → Memory Manager Agent (when threshold reached)
    → Explainability Agent
"""
from __future__ import annotations

from typing import Annotated, TypedDict, Literal
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages


# ── Graph State ──────────────────────────────────────────────

class AssistantState(TypedDict):
    # Input
    user_id: str
    conversation_id: str
    user_message: str
    conversation_history: list[dict]
    mode: Literal["NORMAL", "LEARNING"]

    # Task Analysis
    task_analysis: dict | None

    # Search
    needs_search: bool
    search_query: str | None
    search_results: list[dict]

    # Context & Prompt
    built_context: str | None
    built_prompt: str | None
    prompt_version: int

    # Candidates
    candidates: list[dict]
    evaluated_candidates: list[dict]
    ranked_candidates: list[dict]
    selected_candidate: dict | None

    # Memory
    preference_memory: dict | None

    # Output
    final_response: str | None
    explanation: dict | None

    # MCP Tool results
    mcp_tool_results: list[dict]


# ── Node stubs — Phase 2+ will implement each ───────────────

async def task_analyzer_node(state: AssistantState) -> AssistantState:
    """Phase 2: Classify task type, complexity, domain, search need."""
    raise NotImplementedError("Task Analyzer will be implemented in Phase 2")


async def search_decision_node(state: AssistantState) -> Literal["search", "build_context"]:
    """Phase 7: Decide whether web search is required."""
    raise NotImplementedError("Search Decision will be implemented in Phase 7")


async def search_node(state: AssistantState) -> AssistantState:
    """Phase 7: Execute web search via Tavily."""
    raise NotImplementedError("Search Agent will be implemented in Phase 7")


async def mcp_router_node(state: AssistantState) -> AssistantState:
    """
    Phase 7+: Route to appropriate MCP tool servers.

    Supported MCP servers:
    - google-calendar: calendar queries and scheduling
    - github: repository info, PR summaries
    - notion: page creation and retrieval
    - gmail: email reading and drafting
    - web-search: Tavily-powered search
    """
    raise NotImplementedError("MCP Router will be implemented in Phase 7")


async def context_builder_node(state: AssistantState) -> AssistantState:
    """Phase 2: Merge user input + search results + history + memory."""
    raise NotImplementedError("Context Builder will be implemented in Phase 2")


async def prompt_builder_node(state: AssistantState) -> AssistantState:
    """Phase 6: Dynamically assemble system prompt from all context."""
    raise NotImplementedError("Prompt Builder will be implemented in Phase 6")


async def candidate_generator_node(state: AssistantState) -> AssistantState:
    """Phase 3: Generate 3 response candidates with different strategies."""
    raise NotImplementedError("Candidate Generator will be implemented in Phase 3")


async def evaluation_node(state: AssistantState) -> AssistantState:
    """Phase 11: Score each candidate on multiple quality dimensions."""
    raise NotImplementedError("Evaluation Agent will be implemented in Phase 11")


async def ranking_node(state: AssistantState) -> AssistantState:
    """Phase 8: Rank candidates using preference memory + evaluation scores."""
    raise NotImplementedError("Candidate Ranker will be implemented in Phase 8")


async def explainability_node(state: AssistantState) -> AssistantState:
    """Phase 13: Generate human-readable explanation for selected response."""
    raise NotImplementedError("Explainability Agent will be implemented in Phase 13")


# ── Graph construction ───────────────────────────────────────

def build_graph() -> StateGraph:
    """
    Build the full LangGraph agent workflow.
    Nodes are registered here; implementations added per phase.
    """
    graph = StateGraph(AssistantState)

    # Register nodes
    graph.add_node("task_analyzer", task_analyzer_node)
    graph.add_node("search_decision", search_decision_node)
    graph.add_node("mcp_router", mcp_router_node)
    graph.add_node("search", search_node)
    graph.add_node("context_builder", context_builder_node)
    graph.add_node("prompt_builder", prompt_builder_node)
    graph.add_node("candidate_generator", candidate_generator_node)
    graph.add_node("evaluation", evaluation_node)
    graph.add_node("ranking", ranking_node)
    graph.add_node("explainability", explainability_node)

    # Entry point
    graph.set_entry_point("task_analyzer")

    # Edges
    graph.add_edge("task_analyzer", "search_decision")
    graph.add_conditional_edges(
        "search_decision",
        lambda state: "mcp_router" if state.get("needs_search") else "context_builder",
        {"mcp_router": "mcp_router", "context_builder": "context_builder"},
    )
    graph.add_edge("mcp_router", "search")
    graph.add_edge("search", "context_builder")
    graph.add_edge("context_builder", "prompt_builder")
    graph.add_edge("prompt_builder", "candidate_generator")
    graph.add_edge("candidate_generator", "evaluation")
    graph.add_edge("evaluation", "ranking")
    graph.add_edge("ranking", "explainability")
    graph.add_edge("explainability", END)

    return graph


# Compiled graph — used by API routes
adaptive_ai_graph = build_graph().compile()
