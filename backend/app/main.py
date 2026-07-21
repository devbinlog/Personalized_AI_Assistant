from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.features.assistant.router import router as assistant_router
from app.features.assistant.recommend_router import router as recommend_router
from app.features.persona.router import router as persona_router
from app.features.flow.router import router as flow_router
from app.features.evaluation.router import router as evaluation_router
from app.features.global_memory.router import router as global_memory_router
from app.features.datasets.router import router as datasets_router
from app.features.experiments.router import router as experiments_router

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


# Assistant router — LangGraph rule-based pipeline
app.include_router(assistant_router, prefix="/api/v1")

# Recommendation router — LangGraph + LLM (실제 AI 연결)
app.include_router(recommend_router, prefix="/api/v1/assistant")

# Design Studio feature routers
app.include_router(persona_router)
app.include_router(flow_router)
app.include_router(evaluation_router)
app.include_router(global_memory_router)
app.include_router(datasets_router)
app.include_router(experiments_router)
