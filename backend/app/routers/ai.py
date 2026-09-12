"""
FastAPI router for AI research insight, score explanation, and generic assistant endpoints.
Enforces that deterministic numerical analytics are retrieved strictly from PostgreSQL.
"""

import re
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Path, status
from app.schemas.ai import (
    AIInsightResponse,
    ScoreExplanationResponse,
    GenericAssistantResponse,
    AssistantQueryRequest,
    AssistantEvidenceItem,
)
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


@router.post(
    "/assistant",
    response_model=GenericAssistantResponse,
    summary="Grounded Generic Research Intelligence Assistant",
    description=(
        "Processes natural-language institutional queries (department comparisons, rankings, "
        "methodology, faculty performance) by gathering verified deterministic facts from PostgreSQL "
        "and invoking Groq for evidence-grounded analytical narrative synthesis."
    ),
)
def ask_assistant(request: AssistantQueryRequest):
    q = request.query.strip()
    if not q:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty.",
        )

    # -------------------------------------------------------------------------
    # 1. Entity and Intent Extraction from Query
    # -------------------------------------------------------------------------
    q_lower = q.lower()

    # Detect Faculty IDs
    found_faculty_ids: List[str] = []
    if request.faculty_employee_no:
        found_faculty_ids.append(request.faculty_employee_no.strip().upper())
    for match in re.findall(r"\b(EMP\d{4})\b", q, re.IGNORECASE):
        upper_id = match.upper()
        if upper_id not in found_faculty_ids:
            found_faculty_ids.append(upper_id)

    # Detect Departments
    target_depts: List[str] = []
    if request.department_code:
        target_depts.append(request.department_code.strip().upper())

    dept_keywords = {
        "CSE": ["cse", "computer science"],
        "BIO": ["bio", "biotechnology", "bioinformatics", "biotech"],
        "MECH": ["mech", "mechanical"],
        "HSS": ["hss", "humanities", "social science", "social sciences"],
    }
    for code, keywords in dept_keywords.items():
        for kw in keywords:
            if re.search(rf"\b{re.escape(kw)}\b", q_lower):
                if code not in target_depts:
                    target_depts.append(code)
                break

    # Detect Intent Indicators
    is_ranking = any(
        re.search(rf"\b{word}\b", q_lower)
        for word in ["top", "rank", "ranking", "rankings", "leader", "leaders", "best", "highest", "lowest", "standings"]
    )
    is_comparison = (len(target_depts) >= 2) or any(
        re.search(rf"\b{word}\b", q_lower)
        for word in ["compare", "comparison", "versus", "vs", "difference", "differ", "between"]
    )
    is_methodology = any(
        re.search(rf"\b{word}\b", q_lower)
        for word in ["methodology", "formula", "weight", "weights", "calculate", "calculated", "scoring", "workload", "startup", "equity", "how is"]
    )

    # -------------------------------------------------------------------------
    # 2. Gather Authoritative Deterministic Analytics
    # -------------------------------------------------------------------------
    facts_payload: Dict[str, Any] = {}
    evidence_items: List[AssistantEvidenceItem] = []
    seed_faculty: List[str] = []
    seed_departments: List[str] = []

    # A. Faculty Context (if specific faculty mentioned)
    for emp_no in found_faculty_ids[:3]:
        try:
            fac = _analytics_service.get_faculty_detail(emp_no)
            if fac:
                seed_faculty.append(emp_no)
                seed_departments.append(fac.department)
                facts_payload[f"faculty_{emp_no}"] = {
                    "employee_no": fac.employee_no,
                    "name": fac.name,
                    "department": fac.department,
                    "designation": fac.designation,
                    "final_score": fac.final_score,
                    "base_score": fac.base_score,
                    "department_rank": fac.department_rank,
                    "institution_rank": fac.institution_rank,
                    "components": fac.components.model_dump(),
                    "context": fac.context.model_dump(),
                    "applied_weights": fac.applied_weights.model_dump(),
                    "raw_metrics": {
                        "total_publications": fac.raw_metrics.total_publications,
                        "q1_publications": fac.raw_metrics.q1_publications,
                        "q2_publications": fac.raw_metrics.q2_publications,
                        "cumulative_citations": fac.raw_metrics.cumulative_citations,
                        "patent_count": fac.raw_metrics.patent_count,
                        "total_sanctioned_amount": fac.raw_metrics.total_sanctioned_amount,
                        "total_scholars": fac.raw_metrics.total_scholars,
                    },
                    "evidence": fac.evidence,
                }
                evidence_items.append(AssistantEvidenceItem(
                    metric=f"{fac.name} Final Score",
                    value=fac.final_score,
                    source=f"Faculty {emp_no} Dossier",
                ))
                evidence_items.append(AssistantEvidenceItem(
                    metric=f"{fac.name} Institution Rank",
                    value=f"#{fac.institution_rank}",
                    source="Institutional Leaderboard",
                ))
        except Exception as exc:
            logger.warning(f"Failed to load context for faculty {emp_no}: {exc}")

    # B. Department Context (if departments mentioned, or comparison requested)
    all_dept_summaries = _analytics_service.get_departments_summary()
    depts_to_fetch = target_depts if target_depts else ([d.department_code for d in all_dept_summaries] if (is_comparison or "department" in q_lower) else [])

    if depts_to_fetch:
        dept_data_map = {}
        for code in depts_to_fetch:
            summary = next((d for d in all_dept_summaries if d.department_code == code), None)
            if not summary:
                continue

            seed_departments.append(code)
            evidence_items.append(AssistantEvidenceItem(
                metric=f"{code} Average Score",
                value=summary.average_score,
                source=f"Department {code} Summary",
            ))
            evidence_items.append(AssistantEvidenceItem(
                metric=f"{code} Top Score",
                value=summary.top_score,
                source=f"Department {code} Summary",
            ))
            if summary.top_performer:
                seed_faculty.append(summary.top_performer.employee_no)
                evidence_items.append(AssistantEvidenceItem(
                    metric=f"{code} Top Performer",
                    value=f"{summary.top_performer.name} (Score: {summary.top_performer.final_score})",
                    source=f"Department {code} Leaderboard",
                ))

            dept_detail = _analytics_service.get_department_detail(code)
            dept_dict = {
                "department_code": summary.department_code,
                "department_name": summary.department_name,
                "faculty_count": summary.faculty_count,
                "average_score": summary.average_score,
                "top_score": summary.top_score,
                "has_patents": summary.has_patents,
                "applied_weights": summary.applied_weights.model_dump(),
                "top_performer": summary.top_performer.model_dump() if summary.top_performer else None,
            }
            if dept_detail:
                dept_dict["benchmarks"] = dept_detail.benchmarks.model_dump()
                dept_dict["top_faculty"] = [
                    {
                        "employee_no": f.employee_no,
                        "name": f.name,
                        "final_score": f.final_score,
                        "department_rank": f.department_rank,
                        "total_publications": f.total_publications,
                        "q1_publications": f.q1_publications,
                        "components": f.components.model_dump(),
                    }
                    for f in dept_detail.faculty[:3]
                ]
                total_dept_pubs = sum(f.total_publications for f in dept_detail.faculty)
                total_dept_q1 = sum(f.q1_publications for f in dept_detail.faculty)
                dept_dict["aggregate_research_metrics"] = {
                    "total_publications": total_dept_pubs,
                    "total_q1_publications": total_dept_q1,
                }
                evidence_items.append(AssistantEvidenceItem(
                    metric=f"{code} Total Publications",
                    value=total_dept_pubs,
                    source=f"Department {code} Faculty Aggregation",
                ))
                evidence_items.append(AssistantEvidenceItem(
                    metric=f"{code} Total Q1 Publications",
                    value=total_dept_q1,
                    source=f"Department {code} Faculty Aggregation",
                ))
            dept_data_map[code] = dept_dict

        facts_payload["departments"] = dept_data_map

    # C. Rankings Context (if rankings or top performers requested)
    if is_ranking or not facts_payload:
        try:
            rankings = _analytics_service.get_rankings()
            top_ranked = rankings.rankings[:5]
            facts_payload["institutional_top_rankings"] = [
                {
                    "institution_rank": r.institution_rank,
                    "employee_no": r.employee_no,
                    "name": r.name,
                    "department": r.department,
                    "designation": r.designation,
                    "final_score": r.final_score,
                    "total_publications": r.total_publications,
                    "q1_publications": r.q1_publications,
                }
                for r in top_ranked
            ]
            for r in top_ranked:
                seed_faculty.append(r.employee_no)
                seed_departments.append(r.department)
                evidence_items.append(AssistantEvidenceItem(
                    metric=f"Rank #{r.institution_rank}: {r.name} ({r.employee_no})",
                    value=f"Score {r.final_score} ({r.department})",
                    source="Institutional Leaderboard",
                ))
        except Exception as exc:
            logger.warning(f"Failed to load rankings context: {exc}")

    # D. Methodology Context (if formula / weights requested)
    if is_methodology:
        facts_payload["scoring_methodology"] = {
            "evaluation_date": "2024-12-31",
            "scale": "Continuous 0.0 to 100.0 scale normalized against active institutional peers",
            "pillars": [
                "Publication Quality (0-100 normalized, weighted heavily towards Scopus Q1/Q2 journal venues)",
                "Citation Impact (0-100 normalized, evaluated via cumulative citations, h-index, and momentum)",
                "Patents & Intellectual Property (0-100 normalized, evaluating disclosures and granted patents)",
                "Sponsored Grant Funding (0-100 normalized, evaluating PI and Co-PI extramural competitive grants)",
                "PhD Supervision (0-100 normalized, guidance of active and completed doctoral scholars)",
            ],
            "discipline_equity_weights": {
                "engineering_and_science_weights": "Publication 35%, Citation 25%, Patents 15%, Funding 15%, PhD 10% (Sum: 100%)",
                "humanities_and_social_sciences_weights": "Publication 45%, Citation 30%, Patents 0%, Funding 15%, PhD 10% (Sum: 100%). Industrial patent weight is intentionally reallocated to publications (+10%) and citations (+5%) because HSS disciplines do not produce industrial patents, ensuring equitable evaluation.",
            },
            "workload_adjustment": "1.0 + (teaching/admin variance_pct / 100 * 0.15), capped at 1.15 (+15% max lift)",
            "career_stage_equity": "Assistant Professor: 1.20x (+20% startup equity), Associate Professor: 1.05x (+5%), Professor: 1.00x",
            "combined_context_adjustment": "min(1.30, stage * load), max 30% combined equity lift",
        }
        evidence_items.append(AssistantEvidenceItem(
            metric="Discipline Weight Policy (HSS)",
            value="45% Pub, 30% Cit, 0% Pat, 15% Fund, 10% PhD",
            source="Scoring Engine Discipline Equity Matrix",
        ))
        evidence_items.append(AssistantEvidenceItem(
            metric="Context Adjustment Ceiling",
            value="Max 1.30x (30% total lift)",
            source="Scoring Model Specification",
        ))

    # E. Baseline Institutional Overview if still unpopulated
    if "departments" not in facts_payload and "institutional_top_rankings" not in facts_payload:
        facts_payload["department_summaries"] = [d.model_dump() for d in all_dept_summaries]
        for d in all_dept_summaries:
            seed_departments.append(d.department_code)

    # -------------------------------------------------------------------------
    # 3. Call Groq for Grounded Narrative Synthesis
    # -------------------------------------------------------------------------
    try:
        return _groq_service.generate_assistant_response(
            query=q,
            facts_payload=facts_payload,
            evidence_items=evidence_items,
            seed_faculty=seed_faculty,
            seed_departments=seed_departments,
        )
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
        logger.error(f"Unexpected error in assistant endpoint: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while generating the assistant response.",
        ) from exc
