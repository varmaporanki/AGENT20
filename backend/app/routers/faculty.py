"""Faculty research analytics API endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.common import PaginatedResponse
from app.schemas.faculty import FacultySummary, FacultyDetail
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/faculty", tags=["Faculty"])
_service = AnalyticsService()


@router.get(
    "",
    response_model=PaginatedResponse[FacultySummary],
    summary="List Faculty Research Productivity Profiles",
    description="Returns a paginated roster of faculty with computed scores, pillar components, and workload context.",
)
def list_faculty(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    department: Optional[str] = Query(
        default=None, description="Filter faculty by department code (e.g., CSE, BIO)"
    ),
):
    try:
        return _service.get_faculty_list(
            page=page, page_size=page_size, department=department
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve faculty analytics",
        ) from exc


@router.get(
    "/{employee_no}",
    response_model=FacultyDetail,
    summary="Get Single Faculty Research Profile",
    description="Returns an exhaustive, explainable research productivity profile for one faculty member.",
)
def get_faculty(employee_no: str):
    try:
        faculty = _service.get_faculty_detail(employee_no=employee_no)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error querying faculty analytics",
        ) from exc

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty {employee_no} not found",
        )
    return faculty
