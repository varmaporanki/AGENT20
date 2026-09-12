"""Health check router."""

from fastapi import APIRouter, Response, status
from app.schemas.common import HealthResponse, DbHealthResponse
from app.db import check_db_health

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application Health Probe",
    description="Returns service availability status.",
)
def health_check():
    return HealthResponse(status="ok")


@router.get(
    "/health/db",
    response_model=DbHealthResponse,
    summary="Database Connectivity Probe",
    description="Executes a lightweight query against PostgreSQL to verify connectivity.",
)
def db_health_check(response: Response):
    health = check_db_health()
    if health["status"] != "connected":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return DbHealthResponse(**health)
