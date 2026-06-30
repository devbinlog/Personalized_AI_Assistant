from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/flows", tags=["flows"])


@router.get("/")
async def list_flows():
    return {"message": "Flow management is handled by the Next.js frontend API at /api/flows"}


@router.post("/simulate")
async def simulate_flow(body: dict):
    return {"message": "Use /api/flows/simulate on the Next.js frontend"}
