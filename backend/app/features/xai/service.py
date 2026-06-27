"""
XAI (Explainable AI) Service — rule-based explanation generation.

Generates human-readable explanations for why a specific response was
chosen, without exposing LLM chain-of-thought.

Exposes:
  - selectedStrategy
  - confidence score
  - memoryInfluence factors
  - reasoningFactors
  - rankingDetails

Phase 13+ will replace rule-based logic with richer AI-generated explanations.
"""
from __future__ import annotations

import json
from typing import Optional


def generate_explanation(
    best_candidate: dict,
    ranked_candidates: list,
    memory: Optional[dict],
    task_analysis: dict,
) -> dict:
    """Generate an XAI explanation dict for the selected response."""

    memory_influence: list[str] = []
    if memory:
        if memory.get("preferredTone"):
            memory_influence.append(
                f"Tone preference '{memory['preferredTone']}' influenced writing style"
            )
        if memory.get("preferredLength"):
            memory_influence.append(
                f"Length preference '{memory['preferredLength']}' shaped response depth"
            )
        try:
            strategies = json.loads(memory.get("preferredStrategies", "[]"))
            if best_candidate.get("strategy") in strategies:
                memory_influence.append(
                    f"'{best_candidate['strategy']}' matches your top preferred strategy"
                )
        except Exception:
            pass

    if not memory_influence:
        memory_influence = [
            "Building your preference profile — make more selections to personalize responses"
        ]

    reasoning_factors = [
        f"Task type '{task_analysis.get('taskType', 'GENERAL')}' matched '{best_candidate.get('strategy', 'STRUCTURED')}' strategy",
        f"Scored {best_candidate.get('score', 0.75):.0%} on preference alignment",
        f"Evaluated {len(ranked_candidates)} candidate responses",
        f"Domain: {task_analysis.get('domain', 'general')}",
    ]

    return {
        "selectedStrategy": best_candidate.get("strategy", "STRUCTURED"),
        "confidence": best_candidate.get("score", 0.75),
        "memoryInfluence": memory_influence,
        "reasoningFactors": reasoning_factors,
        "rankingDetails": [
            {"strategy": c.get("strategy"), "score": c.get("score", 0.7)}
            for c in ranked_candidates
        ],
    }


def get_explanation(message_id: str, db=None) -> Optional[dict]:
    """Retrieve a stored explanation by message ID. Returns None until persistence is wired up."""
    return None
