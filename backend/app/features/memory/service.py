"""
Memory Engine — rule-based preference memory generation.

Analyzes historical preference logs to produce an evolving user preference
summary. Updates are triggered when log count crosses MEMORY_UPDATE_THRESHOLD.

Phase 5+ will replace rule-based logic with LLM-based memory generation.
"""
from __future__ import annotations

import json
from typing import Optional


def generate_memory(logs: list) -> dict:
    """Analyze preference logs and generate a memory summary dict."""
    if not logs:
        return {}

    strategy_counts: dict[str, int] = {}
    tag_counts: dict[str, int] = {}
    task_counts: dict[str, int] = {}

    for log in logs:
        strategy = log.get("selectedStrategy", "")
        if strategy:
            strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1

        tags = log.get("selectedTags", [])
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except Exception:
                tags = []
        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

        task_type = log.get("taskType", "")
        if task_type:
            task_counts[task_type] = task_counts.get(task_type, 0) + 1

    top_strategy = max(strategy_counts, key=strategy_counts.get) if strategy_counts else None
    top_tags = sorted(tag_counts, key=tag_counts.get, reverse=True)[:5]

    # Infer tone preference from tags
    tone: Optional[str] = None
    if "professional" in top_tags or "formal" in top_tags:
        tone = "professional"
    elif "friendly" in top_tags or "casual" in top_tags or "conversational" in top_tags:
        tone = "friendly"

    # Infer length preference from tags
    length: Optional[str] = None
    if "concise" in top_tags or "brief" in top_tags:
        length = "concise"
    elif "detailed" in top_tags or "comprehensive" in top_tags:
        length = "detailed"

    # Infer structure preference from top strategy
    structure: Optional[str] = None
    if top_strategy in ("STRUCTURED", "ANALYTICAL"):
        structure = "structured"
    elif top_strategy == "CONCISE":
        structure = "bullet"
    elif top_strategy == "PROFESSIONAL":
        structure = "paragraph"

    preferred_strategies = sorted(strategy_counts, key=strategy_counts.get, reverse=True)[:3]

    raw_summary = f"User prefers {top_strategy or 'varied'} response style"
    if tone:
        raw_summary += f", {tone} tone"
    if length:
        raw_summary += f", {length} length"
    raw_summary += (
        f". Top strategies: {', '.join(preferred_strategies[:2]) if preferred_strategies else 'building preference history'}."
    )

    return {
        "preferredTone": tone,
        "preferredLength": length,
        "preferredStructure": structure,
        "preferredStrategies": json.dumps(preferred_strategies),
        "avoidedPatterns": json.dumps([]),
        "strategyWeights": json.dumps(strategy_counts),
        "rawSummary": raw_summary,
        "logCount": len(logs),
    }


def get_memory(user_id: str, db=None) -> Optional[dict]:
    """
    Retrieve preference memory for a user.

    Returns None when no memory exists yet — the frontend handles the
    empty-memory case gracefully.
    """
    return None


def should_update_memory(log_count: int, last_log_count: int, threshold: int = 5) -> bool:
    """Return True when enough new logs have accumulated to warrant a memory update."""
    return (log_count - last_log_count) >= threshold
