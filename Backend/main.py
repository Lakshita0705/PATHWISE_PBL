"""
PathWise Backend: production-ready personalization engine, roadmap adaptation,
and job market recommendation system. FastAPI app with modular structure.
"""

import os
import sys

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api.routes import router as personalization_router

# Add Backend root to path for imports when running as script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB if configured. Shutdown: cleanup."""
    settings = get_settings()
    if settings.database_url:
        try:
            from models import db_models  # noqa: F401 - register tables
            from core.database import init_db
            await init_db()
        except Exception:
            pass  # DB optional for personalization-only usage
    yield
    # Shutdown: close pools etc. if needed
    pass


app = FastAPI(
    title="PathWise API",
    description="Personalization engine, roadmap generation, and job market recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personalization_router)


@app.get("/health")
def health():
    """Health check for load balancers and monitoring."""
    return {"status": "ok", "service": "pathwise-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=get_settings().debug,
    )
