"""Rankings API endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.rankings import RankingsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/rankings", tags=["Rankings"])
_service = AnalyticsService()


@router.get(
    "",
    response_model=RankingsResponse,
    summary="Get Research Productivity Rankings",
    description="Returns institution-wide or department-filtered research productivity rankings.",
)
def get_rankings(
    department: Optional[str] = Query(
        default=None, description="Optional department code filter (e.g. CSE, MECH)"
    ),
):
    try:
        return _service.get_rankings(department=department)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute research rankings",
        ) from exc
