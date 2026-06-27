from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 {settings.app_name} v{settings.app_version}")
    print(f"   Environment: {settings.environment}")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Adaptive AI Personal Assistant — AI engine",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }


# Phase 2: AI assistant router
# from app.api.v1.chat import router as chat_router
# app.include_router(chat_router, prefix="/api/v1")

# Phase 4: Preference engine router
# from app.api.v1.preferences import router as pref_router
# app.include_router(pref_router, prefix="/api/v1")

# Phase 5: Memory engine router
# from app.api.v1.memory import router as memory_router
# app.include_router(memory_router, prefix="/api/v1")
