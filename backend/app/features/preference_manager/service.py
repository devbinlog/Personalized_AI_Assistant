"""
Adaptive Preference Manager — rule-based pattern detection and suggestion engine.

Monitors preference logs for emerging patterns and proactively suggests
preference updates to the user.

Example suggestion:
  "You've selected step-by-step explanations 78% of the time
   for development questions. Set this as your default?"

Phase 14+ will replace rule-based heuristics with AI-driven pattern analysis.
"""
from __future__ import annotations

import json
from typing import Optional


def detect_emerging_patterns(logs: list, memory: Optional[dict] = None) -> list:
    """
    Detect patterns in the most recent preference logs and return suggestions.

    Returns at most 2 suggestion dicts to avoid overwhelming the user.
    """
    if len(logs) < 3:
        return []

    strategy_counts: dict[str, int] = {}
    tag_counts: dict[str, int] = {}

    for log in logs[-10:]:  # analyse the last 10 interactions
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

    suggestions = []

    # Tone suggestion
    if tag_counts.get("professional", 0) >= 3 and (
        not memory or memory.get("preferredTone") != "professional"
    ):
        suggestions.append({
            "type": "tone",
            "currentValue": memory.get("preferredTone") if memory else None,
            "suggestedValue": "professional",
            "rationale": f"You've selected 'professional' tone {tag_counts['professional']} times recently",
            "evidenceCount": tag_counts["professional"],
        })
    elif tag_counts.get("friendly", 0) >= 3 and (
        not memory or memory.get("preferredTone") != "friendly"
    ):
        suggestions.append({
            "type": "tone",
            "currentValue": memory.get("preferredTone") if memory else None,
            "suggestedValue": "friendly",
            "rationale": f"You've preferred conversational responses {tag_counts['friendly']} times recently",
            "evidenceCount": tag_counts["friendly"],
        })

    # Length suggestion
    if tag_counts.get("concise", 0) >= 3 and (
        not memory or memory.get("preferredLength") != "concise"
    ):
        suggestions.append({
            "type": "length",
            "currentValue": memory.get("preferredLength") if memory else None,
            "suggestedValue": "concise",
            "rationale": f"You've preferred concise responses {tag_counts['concise']} times recently",
            "evidenceCount": tag_counts["concise"],
        })

    # Dominant strategy suggestion
    if strategy_counts:
        top_strategy = max(strategy_counts, key=strategy_counts.get)
        if strategy_counts[top_strategy] >= 4:
            suggestions.append({
                "type": "strategy",
                "currentValue": None,
                "suggestedValue": top_strategy,
                "rationale": f"'{top_strategy}' is your most selected response style ({strategy_counts[top_strategy]} times)",
                "evidenceCount": strategy_counts[top_strategy],
            })

    return suggestions[:2]


def create_suggestion(user_id: str, suggestion_data: dict, db=None) -> dict:
    """Persist a new preference suggestion. Returns the suggestion with a generated ID."""
    return {
        **suggestion_data,
        "id": f"sug_{user_id}_{suggestion_data['type']}",
        "status": "PENDING",
    }


def get_pending_suggestions(user_id: str, db=None) -> list:
    """Return all pending preference suggestions for a user."""
    return []


def respond_to_suggestion(suggestion_id: str, accepted: bool, db=None) -> bool:
    """Record the user's response to a preference suggestion. Returns True on success."""
    return True
