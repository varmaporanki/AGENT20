"""
Agent 20 Backend — FastAPI Application Entrypoint.
Exposes deterministic research productivity analytics computed in PostgreSQL.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.db import init_db_pool, close_db_pool
from app.routers.health import router as health_router
from app.routers.faculty import router as faculty_router
from app.routers.rankings import router as rankings_router
from app.routers.departments import router as departments_router
from app.routers.ai import router as ai_router

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("agent20.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application lifecycle: initializes DB connection pool and closes on exit."""
    settings = get_settings()
    logger.info("Starting Agent 20 Analytics API...")
    logger.info(f"Target Database: {settings.sanitized_database_url()}")
    init_db_pool()
    yield
    logger.info("Shutting down Agent 20 Analytics API...")
    close_db_pool()


settings = get_settings()

app = FastAPI(
    title="Agent 20 — Research Productivity Analytics API",
    description=(
        "Production-grade backend API exposing deterministic, discipline-normalized, "
        "and workload-adjusted research productivity analytics computed directly in PostgreSQL 16."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handler (Sanitizes internal server errors)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Root API Version Endpoint
@app.get(
    "/api/v1",
    tags=["Root"],
    summary="API Root Information",
    description="Returns API service name, version, status, and link to documentation.",
)
def api_root():
    return {
        "name": "Agent 20 — Research Productivity Analytics API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
    }


# Mount Routers
app.include_router(health_router)
app.include_router(faculty_router)
app.include_router(rankings_router)
app.include_router(departments_router)
app.include_router(ai_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
