"""Department analytics API endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.department import DepartmentSummary, DepartmentDetail
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])
_service = AnalyticsService()


@router.get(
    "",
    response_model=List[DepartmentSummary],
    summary="List All Department Summaries",
    description="Returns high-level research productivity aggregates and applied weights for all departments.",
)
def list_departments():
    try:
        return _service.get_departments_summary()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve department summaries",
        ) from exc


@router.get(
    "/{department_code}",
    response_model=DepartmentDetail,
    summary="Get Detailed Department Analytics",
    description="Returns comprehensive research metrics, pillar benchmarks, and ranked faculty for a department.",
)
def get_department(department_code: str):
    try:
        dept = _service.get_department_detail(department_code=department_code)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error querying department analytics",
        ) from exc

    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department {department_code} not found",
        )
    return dept
