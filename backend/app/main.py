"""AnalystFlow — FastAPI Application Entry Point

Main application server that serves:
- API routes under /api/v1/
- Frontend static files (when built)
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from app.config import settings
from app.api import sql_generation, data_cleaning, visualization, database
from app.core.database import init_local_database, ensure_default_workspace


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: initialize local database on startup."""
    init_local_database()
    ensure_default_workspace()
    yield


app = FastAPI(lifespan=lifespan,
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


# Register API routers
app.include_router(sql_generation.router)
app.include_router(data_cleaning.router)
app.include_router(visualization.router)
app.include_router(database.router)


# Mount frontend static files if the build exists
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")