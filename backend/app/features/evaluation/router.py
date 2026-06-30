from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/evaluation", tags=["evaluation"])


@router.get("/metrics")
async def get_metrics():
    return {"message": "Evaluation metrics available at /api/evaluation on the Next.js frontend"}
