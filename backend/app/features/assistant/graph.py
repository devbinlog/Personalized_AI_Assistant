"""
Adaptive AI Graph — LangGraph multi-agent orchestration.

This is the central orchestrator for the entire AI pipeline.
Each node has a single responsibility and is independently testable.

Graph Flow:
  User Input
    → Task Analyzer Agent
    → Search Decision Agent
    → (optional) Search Agent
    → MCP Router Agent
    → Context Builder Agent
    → Prompt Builder Agent
    → Candidate Generator Agent
    → Evaluation Agent
    → Candidate Ranking Agent
    → (Learning Mode) Return all 3 candidates
    → (Normal Mode) Explainability Agent → Return best candidate
    → (on feedback) Preference Learning Agent
    → Memory Manager Agent (when threshold reached)
"""
from __future__ import annotations

import json
from typing import TypedDict, Literal, Optional

from langgraph.graph import StateGraph, END


# ── Graph State ──────────────────────────────────────────────

class AssistantState(TypedDict):
    # Input
    user_message: str
    conversation_history: list
    mode: str  # "NORMAL" or "LEARNING"
    user_id: str
    session_id: str

    # Task Analysis
    task_analysis: dict

    # Search
    needs_search: bool
    search_results: list

    # MCP
    mcp_tools_needed: list

    # Context & Prompt
    context: str
    system_prompt: str
    prompt_version: int

    # Candidates
    candidates: list          # [{strategy, content, index}]
    evaluations: list         # [{index, scores, overall}]
    ranked_candidates: list
    best_candidate: dict

    # Output
    explanation: dict

    # Memory
    memory: dict


# ── Helper functions ─────────────────────────────────────────

def _pick_strategies(task_type: str) -> list:
    strategy_map = {
        "CODING": ["STRUCTURED", "ANALYTICAL", "ACTIONABLE"],
        "WRITING": ["PROFESSIONAL", "FRIENDLY", "STRUCTURED"],
        "RESEARCH": ["ANALYTICAL", "STRUCTURED", "CONCISE"],
        "PLANNING": ["ACTIONABLE", "STRUCTURED", "PROFESSIONAL"],
        "ANALYSIS": ["ANALYTICAL", "PROFESSIONAL", "STRUCTURED"],
        "BRAINSTORMING": ["FRIENDLY", "CREATIVE", "STRUCTURED"],
        "CONVERSATION": ["FRIENDLY", "CONCISE", "PROFESSIONAL"],
        "TRANSLATION": ["STRUCTURED", "PROFESSIONAL", "CONCISE"],
        "MATH": ["STRUCTURED", "ANALYTICAL", "ACTIONABLE"],
    }
    return strategy_map.get(task_type, ["STRUCTURED", "CONCISE", "PROFESSIONAL"])


def _generate_content(msg: str, topic: str, strategy: str, context: str) -> str:
    ctx_note = f"\n\n*Context applied: {context[:80]}...*" if context and len(context) > 20 else ""

    templates = {
        "STRUCTURED": f"""Here is a structured overview of "{topic}":

## Key Points

1. **Core Concept** — The fundamental idea here is well-defined and worth examining carefully.
2. **Important Context** — Several factors shape how we should approach this topic.
3. **Practical Steps**
   - Step 1: Understand the core requirements
   - Step 2: Break down into manageable components
   - Step 3: Execute with clear criteria

## Summary

A structured approach to "{topic}" ensures thorough and reliable results.{ctx_note}""",

        "CONCISE": f"""**Short answer on "{topic}":**

The key points are: clarity, action, and iteration. Start with the most important thing and build from there. Keep it simple.{ctx_note}""",

        "PROFESSIONAL": f"""From a professional perspective, "{topic}" warrants careful consideration.

**Assessment:** This requires systematic evaluation across multiple dimensions. Primary considerations include scope, feasibility, and impact.

**Recommendation:** Proceed with a structured framework that accounts for key variables. Establish clear objectives before executing.{ctx_note}""",

        "ANALYTICAL": f"""**Analysis of "{topic}":**

**Key Factors:**
- Primary driver: foundational understanding of the domain
- Secondary factor: contextual variables and constraints
- Tertiary consideration: long-term implications

**Tradeoff Matrix:**
| Approach A | Approach B |
|---|---|
| Faster execution | More thorough |
| Lower overhead | Higher quality |

**Conclusion:** Optimal path depends on priorities — speed favors A, quality favors B.{ctx_note}""",

        "ACTIONABLE": f"""**Next steps for "{topic}":**

→ **Immediately:** Identify the single highest-impact action.
→ **Today:** Set up a simple tracking mechanism.
→ **This week:** Review progress and adjust approach.
→ **Next step:** Evaluate outcomes and iterate.

**Start with step one.** Everything else follows from there.{ctx_note}""",

        "FRIENDLY": f"""Great question about "{topic}"!

Here's the thing — this is more approachable than it seems. Think of it like explaining to a friend: the basics matter more than advanced theory. Start small, be consistent, and don't overthink. You've got this!{ctx_note}""",

        "CREATIVE": f"""**Fresh perspective on "{topic}":**

What if we approached this from a completely different angle? Instead of the standard approach, consider:

- **Reframe the problem**: What's the underlying need?
- **Explore edges**: What would an unusual solution look like?
- **Combine ideas**: What from other domains applies here?

The most interesting solutions often come from unexpected places.{ctx_note}""",
    }
    return templates.get(strategy, templates["STRUCTURED"])


# ── Node implementations ─────────────────────────────────────

def task_analyzer_node(state: AssistantState) -> dict:
    """Classify task type, complexity, domain, and search need via rule-based keywords."""
    msg = state["user_message"].lower()

    # Detect task type by keywords
    if any(w in msg for w in ["code", "function", "bug", "error", "implement", "debug", "python", "javascript", "typescript"]):
        task_type = "CODING"
    elif any(w in msg for w in ["write", "draft", "essay", "blog", "email", "letter", "article"]):
        task_type = "WRITING"
    elif any(w in msg for w in ["research", "what is", "explain", "how does", "why", "history"]):
        task_type = "RESEARCH"
    elif any(w in msg for w in ["plan", "schedule", "organize", "strategy", "steps", "roadmap"]):
        task_type = "PLANNING"
    elif any(w in msg for w in ["analyze", "compare", "evaluate", "assess", "review", "pros and cons"]):
        task_type = "ANALYSIS"
    elif any(w in msg for w in ["translate", "korean", "english", "japanese", "french"]):
        task_type = "TRANSLATION"
    elif any(w in msg for w in ["math", "calculate", "solve", "equation", "formula"]):
        task_type = "MATH"
    elif any(w in msg for w in ["brainstorm", "ideas", "creative", "suggest", "generate ideas"]):
        task_type = "BRAINSTORMING"
    else:
        task_type = "CONVERSATION"

    # Complexity
    if len(msg) > 300 or any(w in msg for w in ["complex", "detailed", "comprehensive", "thorough"]):
        complexity = "HIGH"
    elif len(msg) > 100:
        complexity = "MEDIUM"
    else:
        complexity = "LOW"

    # Domain detection
    if any(w in msg for w in ["code", "software", "tech", "api", "database", "algorithm"]):
        domain = "technology"
    elif any(w in msg for w in ["business", "market", "revenue", "startup", "product"]):
        domain = "business"
    elif any(w in msg for w in ["science", "research", "study", "experiment"]):
        domain = "science"
    else:
        domain = "general"

    # Search need
    needs_search = any(w in msg for w in ["latest", "recent", "today", "news", "current", "2024", "2025", "2026"])

    return {
        "task_analysis": {
            "taskType": task_type,
            "complexity": complexity,
            "domain": domain,
            "needsWebSearch": needs_search,
            "expectedOutput": "text",
            "preferredStyle": "adaptive",
        }
    }


def search_decision_node(state: AssistantState) -> dict:
    """Decide whether web search is required based on task analysis."""
    return {"needs_search": state["task_analysis"].get("needsWebSearch", False)}


def search_node(state: AssistantState) -> dict:
    """Return rule-based mock search results."""
    query = state["user_message"][:50]
    return {
        "search_results": [
            {
                "title": f"Result for: {query}",
                "url": "https://example.com",
                "snippet": f"Information about {query}...",
            },
            {
                "title": f"Related: {query}",
                "url": "https://example.com/2",
                "snippet": f"More details about {query}...",
            },
        ]
    }


def mcp_router_node(state: AssistantState) -> dict:
    """Determine which MCP tool servers are needed based on message keywords."""
    msg = state["user_message"].lower()
    tools = []
    if any(w in msg for w in ["calendar", "schedule", "meeting", "event"]):
        tools.append("google-calendar")
    if any(w in msg for w in ["github", "repository", "commit", "pull request", "pr"]):
        tools.append("github")
    if any(w in msg for w in ["notion", "page", "database"]):
        tools.append("notion")
    if any(w in msg for w in ["email", "gmail", "send", "inbox"]):
        tools.append("gmail")
    return {"mcp_tools_needed": tools}


def context_builder_node(state: AssistantState) -> dict:
    """Merge task analysis, search results, and memory into a context string."""
    context_parts = []

    ta = state["task_analysis"]
    context_parts.append(
        f"Task: {ta['taskType']} | Complexity: {ta['complexity']} | Domain: {ta['domain']}"
    )

    if state.get("search_results"):
        snippets = [r["snippet"] for r in state["search_results"][:2]]
        context_parts.append("Search context: " + " | ".join(snippets))

    memory = state.get("memory", {})
    if memory:
        if memory.get("preferredTone"):
            context_parts.append(f"User prefers {memory['preferredTone']} tone")
        if memory.get("preferredLength"):
            context_parts.append(f"User prefers {memory['preferredLength']} responses")

    return {"context": "\n".join(context_parts)}


def prompt_builder_node(state: AssistantState) -> dict:
    """Dynamically assemble the system prompt from context and memory."""
    base = "You are an Adaptive AI Personal Assistant. Be direct, accurate, and genuinely helpful."

    context = state.get("context", "")
    memory = state.get("memory", {})

    prompt_parts = [base]
    if context:
        prompt_parts.append(f"\nContext:\n{context}")
    if memory.get("rawSummary"):
        prompt_parts.append(f"\nUser preferences:\n{memory['rawSummary']}")

    return {
        "system_prompt": "\n".join(prompt_parts),
        "prompt_version": state.get("prompt_version", 0) + 1,
    }


def candidate_generator_node(state: AssistantState) -> dict:
    """Generate 3 response candidates with different strategies using rule-based templates."""
    msg = state["user_message"]
    topic = msg[:60]
    task_type = state["task_analysis"]["taskType"]

    strategies = _pick_strategies(task_type)
    candidates = []

    for i, strategy in enumerate(strategies[:3]):
        content = _generate_content(msg, topic, strategy, state.get("context", ""))
        candidates.append({"strategy": strategy, "content": content, "index": i})

    return {"candidates": candidates}


def evaluation_node(state: AssistantState) -> dict:
    """Score each candidate on multiple quality dimensions using rule-based heuristics."""
    evaluations = []
    for c in state.get("candidates", []):
        content = c["content"]
        strategy = c["strategy"]

        word_count = len(content.split())
        has_structure = "##" in content or "1." in content or "→" in content
        has_table = "|" in content and "---" in content

        scores = {
            "structure": 0.9 if has_structure else 0.5,
            "readability": min(1.0, 0.6 + (word_count / 300) * 0.3),
            "specificity": 0.85 if has_table else 0.7,
            "completeness": min(1.0, word_count / 150),
            "professionalism": 0.9 if strategy == "PROFESSIONAL" else 0.75,
            "formatting": 0.9 if has_structure else 0.6,
            "preferenceMatch": 0.75,
            "taskMatch": 0.8,
        }
        avg = sum(scores.values()) / len(scores)

        evaluations.append({
            "index": c["index"],
            "strategy": strategy,
            "scores": scores,
            "overall": round(avg, 3),
        })

    return {"evaluations": evaluations}


def ranking_node(state: AssistantState) -> dict:
    """Rank candidates using evaluation scores and apply memory preference boost."""
    candidates = state.get("candidates", [])
    evaluations = state.get("evaluations", [])
    memory = state.get("memory", {})

    eval_map = {e["index"]: e for e in evaluations}

    preferred = []
    try:
        pref_str = memory.get("preferredStrategies", "[]")
        preferred = json.loads(pref_str) if isinstance(pref_str, str) else (pref_str or [])
    except Exception:
        pass

    ranked = []
    for c in candidates:
        ev = eval_map.get(c["index"], {})
        base_score = ev.get("overall", 0.7)
        memory_bonus = 0.1 if c["strategy"] in preferred else 0.0
        final_score = min(1.0, base_score + memory_bonus)

        ranked.append({
            **c,
            "score": final_score,
            "reasons": [
                f"Strategy '{c['strategy']}' scores {base_score:.2f}",
                "Memory preference bonus applied" if memory_bonus > 0 else "No memory preference match",
            ],
        })

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return {
        "ranked_candidates": ranked,
        "best_candidate": ranked[0] if ranked else {},
    }


def explainability_node(state: AssistantState) -> dict:
    """Generate a human-readable explanation for why the best response was selected."""
    best = state.get("best_candidate", {})
    memory = state.get("memory", {})
    ranked = state.get("ranked_candidates", [])

    memory_influence = []
    if memory.get("preferredTone"):
        memory_influence.append(f"Tone preference '{memory['preferredTone']}' guided the writing style")
    if memory.get("preferredLength"):
        memory_influence.append(f"Length preference '{memory['preferredLength']}' shaped response depth")
    if memory.get("preferredStrategies"):
        memory_influence.append("Past selections influenced strategy ranking")
    if not memory_influence:
        memory_influence = ["No preference memory yet — building your profile as you interact"]

    reasoning = [
        f"Selected '{best.get('strategy', 'default')}' strategy for this task type",
        f"Score: {best.get('score', 0.7):.0%} preference alignment",
        f"Evaluated {len(ranked)} candidate responses",
    ]

    return {
        "explanation": {
            "selectedStrategy": best.get("strategy", "STRUCTURED"),
            "confidence": best.get("score", 0.7),
            "memoryInfluence": memory_influence,
            "reasoningFactors": reasoning,
            "rankingDetails": [
                {"strategy": c["strategy"], "score": c["score"]} for c in ranked
            ],
        }
    }


def preference_learner_node(state: AssistantState) -> dict:
    """Process user feedback after candidate selection in LEARNING mode. Pass-through for now."""
    return {}


def memory_manager_node(state: AssistantState) -> dict:
    """Trigger memory regeneration when preference log threshold is reached. Pass-through for now."""
    return {}


# ── Graph construction ───────────────────────────────────────

def build_graph():
    """
    Build and compile the full LangGraph agent workflow with conditional edges.
    All nodes use rule-based deterministic logic — no real AI calls.
    """
    graph = StateGraph(AssistantState)

    # Register nodes
    graph.add_node("task_analyzer", task_analyzer_node)
    graph.add_node("search_decision", search_decision_node)
    graph.add_node("search", search_node)
    graph.add_node("mcp_router", mcp_router_node)
    graph.add_node("context_builder", context_builder_node)
    graph.add_node("prompt_builder", prompt_builder_node)
    graph.add_node("candidate_generator", candidate_generator_node)
    graph.add_node("evaluation", evaluation_node)
    graph.add_node("ranking", ranking_node)
    graph.add_node("explainability", explainability_node)
    graph.add_node("preference_learner", preference_learner_node)
    graph.add_node("memory_manager", memory_manager_node)

    # Entry point
    graph.set_entry_point("task_analyzer")

    # Linear edges
    graph.add_edge("task_analyzer", "search_decision")

    # Conditional: search or skip directly to mcp_router
    graph.add_conditional_edges(
        "search_decision",
        lambda s: "search" if s.get("needs_search") else "mcp_router",
        {"search": "search", "mcp_router": "mcp_router"},
    )
    graph.add_edge("search", "mcp_router")
    graph.add_edge("mcp_router", "context_builder")
    graph.add_edge("context_builder", "prompt_builder")
    graph.add_edge("prompt_builder", "candidate_generator")
    graph.add_edge("candidate_generator", "evaluation")
    graph.add_edge("evaluation", "ranking")

    # Conditional: learning mode returns all candidates, normal mode explains best
    graph.add_conditional_edges(
        "ranking",
        lambda s: "end_learning" if s.get("mode") == "LEARNING" else "explainability",
        {"end_learning": END, "explainability": "explainability"},
    )
    graph.add_edge("explainability", END)

    return graph.compile()


# Module-level compiled graph — used by API routes
adaptive_ai_graph = build_graph()
