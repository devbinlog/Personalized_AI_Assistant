from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/experiments", tags=["experiments"])


@router.get("/")
async def list_experiments():
    return {"message": "Experiments available at /api/prompt-experiments on the Next.js frontend"}
