"""
FastAPI router for AI research insight and score explanation endpoints.
Enforces that deterministic numerical analytics are retrieved strictly from PostgreSQL.
"""

import re
import logging
from fastapi import APIRouter, HTTPException, Path, status
from app.schemas.ai import AIInsightResponse, ScoreExplanationResponse
from app.services.analytics_service import AnalyticsService
from app.services.groq_service import (
    GroqService,
    GroqServiceUnavailableError,
    GroqBadResponseError,
)

logger = logging.getLogger("agent20.router.ai")

router = APIRouter(prefix="/api/v1/ai", tags=["AI Insights"])

_analytics_service = AnalyticsService()
_groq_service = GroqService()

_EMPLOYEE_NO_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,20}$")


def _validate_employee_no(employee_no: str) -> str:
    """Validates employee_no format to prevent injection or malformed requests."""
    clean_no = employee_no.strip()
    if not _EMPLOYEE_NO_PATTERN.match(clean_no):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid employee number format: '{employee_no}'. Must be 3-20 alphanumeric characters.",
        )
    return clean_no


@router.post(
    "/faculty/{employee_no}/insight",
    response_model=AIInsightResponse,
    summary="Generate Comprehensive Faculty Research Insight",
    description=(
        "Synthesizes an executive research productivity insight report grounded strictly "
        "in authoritative deterministic data retrieved from PostgreSQL. "
        "Client cannot pass or override scores."
    ),
)
def get_faculty_insight(
    employee_no: str = Path(..., description="Unique employee identifier (e.g. EMP0014)")
):
    clean_emp_no = _validate_employee_no(employee_no)

    # 1. Retrieve authoritative deterministic analytics from database/analytics service
    try:
        faculty = _analytics_service.get_faculty_detail(clean_emp_no)
    except Exception as exc:
        logger.error(f"Failed to query faculty analytics for {clean_emp_no}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving institutional analytics.",
        ) from exc

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty {clean_emp_no} not found",
        )

    # 2. Generate structured AI explanation grounded strictly in the retrieved facts
    try:
        return _groq_service.generate_faculty_insight(faculty)
    except GroqServiceUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except GroqBadResponseError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Unexpected error generating AI insight for {clean_emp_no}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while generating research insights.",
        ) from exc


@router.post(
    "/faculty/{employee_no}/explain-score",
    response_model=ScoreExplanationResponse,
    summary="Explain Deterministic Score and Ranking",
    description=(
        "Combines authoritative PostgreSQL scores and ranks with AI-generated narrative "
        "explaining strongest/weakest pillars, context multipliers, and institutional standing."
    ),
)
def explain_faculty_score(
    employee_no: str = Path(..., description="Unique employee identifier (e.g. EMP0003)")
):
    clean_emp_no = _validate_employee_no(employee_no)

    # 1. Retrieve authoritative deterministic analytics
    try:
        faculty = _analytics_service.get_faculty_detail(clean_emp_no)
    except Exception as exc:
        logger.error(f"Failed to query faculty analytics for {clean_emp_no}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving institutional analytics.",
        ) from exc

    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty {clean_emp_no} not found",
        )

    # 2. Generate narrative explanation and merge with authoritative numerical fields
    try:
        return _groq_service.explain_faculty_score(faculty)
    except GroqServiceUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except GroqBadResponseError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Unexpected error explaining score for {clean_emp_no}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while explaining research scores.",
        ) from exc
