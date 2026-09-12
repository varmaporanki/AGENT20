"""Department analytics API endpoints."""

import re
from typing import List
from fastapi import APIRouter, HTTPException, Path, status
from app.schemas.department import DepartmentSummary, DepartmentDetail
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])
_service = AnalyticsService()
_DEPT_PATTERN = re.compile(r"^[A-Za-z0-9_-]{2,10}$")


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
def get_department(
    department_code: str = Path(..., description="Department discipline code (e.g. CSE, BIO)")
):
    clean_code = department_code.strip()
    if not _DEPT_PATTERN.match(clean_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid department code format: '{department_code}'. Must be 2-10 alphanumeric characters.",
        )

    try:
        dept = _service.get_department_detail(department_code=clean_code)
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
