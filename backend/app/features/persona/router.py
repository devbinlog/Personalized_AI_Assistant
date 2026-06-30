from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/personas", tags=["personas"])


@router.get("/")
async def list_personas():
    return {"message": "Persona management is handled by the Next.js frontend API at /api/personas"}


@router.get("/active")
async def get_active_persona():
    return {"active_persona": None, "message": "Query /api/personas for active persona"}
