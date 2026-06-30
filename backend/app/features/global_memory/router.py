from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/global-memory", tags=["global-memory"])


@router.get("/")
async def get_global_memory():
    return {"message": "Global memory available at /api/global-memory on the Next.js frontend"}
