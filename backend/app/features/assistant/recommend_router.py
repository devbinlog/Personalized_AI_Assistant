from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, TypedDict
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


class RecommendRequest(BaseModel):
    goal_title: str
    milestone_title: Optional[str] = None
    step_title: Optional[str] = None
    last_user_message: str = ""
    last_ai_response: str = ""


class RecommendState(TypedDict):
    goal_title: str
    milestone_title: str
    step_title: str
    last_user_message: str
    last_ai_response: str
    recommendation: str
    rec_type: str


def recommendation_node(state: RecommendState) -> RecommendState:
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        openai_api_key=settings.openai_api_key,
    )

    is_first = not state["last_user_message"] and not state["last_ai_response"]
    step = state.get("step_title") or state.get("milestone_title") or "시작"

    if is_first:
        prompt = f"""당신은 목표 달성 코치입니다. 사용자가 현재 단계에서 구체적으로 행동하도록 유도하는 질문을 던지세요.
지시나 조언이 아니라 사용자의 생각/현황을 이끌어내는 질문 형태로 작성하세요.

목표: "{state['goal_title']}"
현재 단계: {step}

이 목표를 처음 시작하는 사용자에게 현재 상황을 파악하기 위한 첫 번째 질문을 하세요.
한국어로 1~2문장, 자연스럽고 따뜻한 말투로 작성하세요."""
    else:
        prompt = f"""당신은 목표 달성 코치입니다. 사용자가 현재 단계에서 더 깊이 생각하거나 행동하도록 유도하는 후속 질문을 하세요.
지시나 조언이 아니라 사용자의 생각/현황을 이끌어내는 질문 형태로 작성하세요.

목표: "{state['goal_title']}"
현재 마일스톤: {state.get('milestone_title') or '없음'}
현재 단계: {state.get('step_title') or '없음'}

방금 나눈 대화:
사용자: {state['last_user_message'][:300]}
AI: {state['last_ai_response'][:500]}

이 대화를 이어받아 현재 단계에서 사용자가 더 생각하거나 행동하도록 유도하는 질문을 하세요.
한국어로 1~2문장, 자연스럽고 따뜻한 말투로 작성하세요."""

    response = llm.invoke(prompt)
    return {**state, "recommendation": response.content, "rec_type": "NEXT_ACTION"}


def build_recommend_graph():
    builder: StateGraph = StateGraph(RecommendState)
    builder.add_node("recommend", recommendation_node)
    builder.set_entry_point("recommend")
    builder.add_edge("recommend", END)
    return builder.compile()


_graph = build_recommend_graph()


@router.post("/recommend")
async def recommend(req: RecommendRequest):
    state: RecommendState = {
        "goal_title": req.goal_title,
        "milestone_title": req.milestone_title or "",
        "step_title": req.step_title or "",
        "last_user_message": req.last_user_message,
        "last_ai_response": req.last_ai_response,
        "recommendation": "",
        "rec_type": "NEXT_ACTION",
    }
    result = await _graph.ainvoke(state)
    return {"content": result["recommendation"], "type": result["rec_type"]}
