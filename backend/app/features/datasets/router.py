from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/datasets", tags=["datasets"])


@router.get("/")
async def list_exports():
    return {"message": "Dataset exports available at /api/datasets on the Next.js frontend"}
