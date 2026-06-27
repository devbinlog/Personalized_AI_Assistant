"""
XAI (Explainable AI) Service — Phase 13 implementation stub.

Generates human-readable explanations for why a specific
response was generated, without exposing LLM chain-of-thought.

Exposes:
  - selectedStrategy
  - confidence score
  - memoryInfluence factors
  - reasoningFactors
  - memorySnapshot
  - rankingDetails
"""
from __future__ import annotations


# Phase 13 will implement full XAI explanation generation
async def generate_explanation(
    message_id: str,
    selected_strategy: str,
    memory_snapshot: dict | None,
    ranking_details: list[dict],
    task_analysis: dict,
) -> dict:
    raise NotImplementedError("XAI Service will be implemented in Phase 13")


async def get_explanation(message_id: str) -> dict | None:
    raise NotImplementedError("XAI Service will be implemented in Phase 13")
