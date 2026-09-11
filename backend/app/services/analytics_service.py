"""
Analytics service orchestrating data retrieval from the PostgreSQL scoring engine
and packaging outputs into standardized API response models.
Strictly preserves the deterministic calculations computed in SQL.
"""

import math
from typing import Dict, List, Optional, Any
from app.config import get_settings
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.common import PaginationMetadata, PaginatedResponse
from app.schemas.faculty import (
    PillarComponents,
    AppliedWeights,
    ContextAdjustment,
    RawMetrics,
    FacultySummary,
    FacultyDetail,
)
from app.schemas.rankings import RankedFacultyItem, RankingsResponse
from app.schemas.department import (
    DepartmentSummary,
    DepartmentTopPerformer,
    DepartmentBenchmarks,
    DepartmentDetail,
)


class AnalyticsService:
    """Service layer for research analytics and scoring."""

    def __init__(self, repository: Optional[AnalyticsRepository] = None):
        self.repository = repository or AnalyticsRepository()
        self.settings = get_settings()

    def get_faculty_list(
        self,
        page: int = 1,
        page_size: int = 20,
        department: Optional[str] = None,
        eval_date: Optional[str] = None,
    ) -> PaginatedResponse[FacultySummary]:
        """
        Retrieves paginated faculty records with computed scores and components.
        """
        evaluation_date = eval_date or self.settings.EVALUATION_DATE
        all_faculty = self.repository.get_all_scored_faculty(evaluation_date)

        # Filter by department if specified
        if department:
            dept_filter = department.strip().upper()
            all_faculty = [f for f in all_faculty if f["dept_code"].upper() == dept_filter]

        total_items = len(all_faculty)
        total_pages = max(1, math.ceil(total_items / page_size))
        page = max(1, min(page, total_pages))

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_items = all_faculty[start_idx:end_idx]

        summaries = [self._map_to_summary(f) for f in page_items]

        pagination = PaginationMetadata(
            total_items=total_items,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

        return PaginatedResponse[FacultySummary](data=summaries, pagination=pagination)

    def get_faculty_detail(
        self, employee_no: str, eval_date: Optional[str] = None
    ) -> Optional[FacultyDetail]:
        """
        Retrieves the complete profile and explainability breakdown for a single faculty member.
        """
        evaluation_date = eval_date or self.settings.EVALUATION_DATE
        row = self.repository.get_faculty_by_employee_no(employee_no, evaluation_date)
        if not row:
            return None

        return self._map_to_detail(row)

    def get_rankings(
        self, department: Optional[str] = None, eval_date: Optional[str] = None
    ) -> RankingsResponse:
        """
        Retrieves institution-wide or department-level rankings.
        """
        evaluation_date = eval_date or self.settings.EVALUATION_DATE
        dept_code = department.strip().upper() if department else None
        ranked_rows = self.repository.get_rankings(evaluation_date, dept_code)

        items = [self._map_to_ranked_item(r) for r in ranked_rows]

        return RankingsResponse(
            total_faculty=len(items),
            evaluation_date=evaluation_date,
            department_filter=dept_code,
            rankings=items,
        )

    def get_departments_summary(
        self, eval_date: Optional[str] = None
    ) -> List[DepartmentSummary]:
        """
        Returns high-level research summaries for all departments.
        """
        evaluation_date = eval_date or self.settings.EVALUATION_DATE
        dept_rows = self.repository.get_departments_summary(evaluation_date)
        all_faculty = self.repository.get_all_scored_faculty(evaluation_date)

        summaries = []
        for d in dept_rows:
            dept_code = d["dept_code"]
            # Find top performer in this department
            dept_fac = [f for f in all_faculty if f["dept_code"] == dept_code]
            top_performer = None
            if dept_fac:
                top_fac = max(dept_fac, key=lambda x: (x["final_score"], x["total_pubs"]))
                top_performer = DepartmentTopPerformer(
                    employee_no=top_fac["employee_no"],
                    name=top_fac["full_name"],
                    final_score=float(top_fac["final_score"]),
                    designation=top_fac["designation"],
                )

            weights = AppliedWeights(
                publication_weight=float(d["w_pub"]),
                citation_weight=float(d["w_cit"]),
                patent_weight=float(d["w_pat"]),
                funding_weight=float(d["w_fund"]),
                phd_weight=float(d["w_phd"]),
                weight_sum=float(d["weight_sum"]),
            )

            summaries.append(
                DepartmentSummary(
                    department_code=dept_code,
                    department_name=d["dept_name"],
                    faculty_count=int(d["faculty_count"]),
                    average_score=float(d["average_score"]),
                    top_score=float(d["top_score"]),
                    has_patents=bool(d["has_patents"]),
                    applied_weights=weights,
                    top_performer=top_performer,
                )
            )

        return summaries

    def get_department_detail(
        self, department_code: str, eval_date: Optional[str] = None
    ) -> Optional[DepartmentDetail]:
        """
        Returns in-depth analytics, benchmarks, and faculty roster for a single department.
        """
        evaluation_date = eval_date or self.settings.EVALUATION_DATE
        dept_data = self.repository.get_department_faculty_and_benchmarks(
            department_code, evaluation_date
        )
        if not dept_data:
            return None

        weights = AppliedWeights(
            publication_weight=float(dept_data["w_pub"]),
            citation_weight=float(dept_data["w_cit"]),
            patent_weight=float(dept_data["w_pat"]),
            funding_weight=float(dept_data["w_fund"]),
            phd_weight=float(dept_data["w_phd"]),
            weight_sum=float(dept_data["weight_sum"]),
        )

        benchmarks = DepartmentBenchmarks(**dept_data["benchmarks"])
        faculty_items = [self._map_to_ranked_item(r) for r in dept_data["faculty"]]

        return DepartmentDetail(
            department_code=dept_data["department_code"],
            department_name=dept_data["department_name"],
            faculty_count=dept_data["faculty_count"],
            average_score=dept_data["average_score"],
            top_score=dept_data["top_score"],
            has_patents=dept_data["has_patents"],
            applied_weights=weights,
            benchmarks=benchmarks,
            faculty=faculty_items,
        )

    # -------------------------------------------------------------------------
    # Internal Mapping Helpers (Convert SQL columns into structured models)
    # -------------------------------------------------------------------------

    @staticmethod
    def _map_to_components(row: Dict[str, Any]) -> PillarComponents:
        return PillarComponents(
            publication_quality=float(row["norm_pub"]),
            citation_impact=float(row["norm_cit"]),
            patents=float(row["norm_pat"]),
            funding=float(row["norm_fund"]),
            phd_supervision=float(row["norm_phd"]),
        )

    @staticmethod
    def _map_to_context(row: Dict[str, Any]) -> ContextAdjustment:
        return ContextAdjustment(
            teaching_hours=float(row["avg_teaching_hours"]),
            administrative_load=float(row["avg_admin_load"]),
            workload_variance_pct=float(row["avg_variance_pct"]),
            workload_multiplier=float(row["load_multiplier"]),
            career_stage_multiplier=float(row["stage_factor"]),
            combined_adjustment=round(float(row["combined_context_factor"]), 3),
        )

    @staticmethod
    def _map_to_weights(row: Dict[str, Any]) -> AppliedWeights:
        return AppliedWeights(
            publication_weight=float(row["w_pub"]),
            citation_weight=float(row["w_cit"]),
            patent_weight=float(row["w_pat"]),
            funding_weight=float(row["w_fund"]),
            phd_weight=float(row["w_phd"]),
            weight_sum=float(row["weight_sum"]),
        )

    @staticmethod
    def _map_to_raw_metrics(row: Dict[str, Any]) -> RawMetrics:
        return RawMetrics(
            raw_publication_score=float(row["raw_pub"]),
            total_publications=int(row["total_pubs"]),
            q1_publications=int(row["q1_pubs"]),
            q2_publications=int(row["q2_pubs"]),
            q3_q4_publications=int(row["q3_q4_pubs"]),
            unindexed_publications=int(row["unindexed_pubs"]),
            flagged_publications=int(row["flagged_pubs"]),
            raw_citation_score=float(row["raw_cit"]),
            cumulative_citations=int(row["cits_latest"]),
            h_index=int(row["h_index"]),
            i10_index=int(row["i10_index"]),
            annual_citation_momentum=int(row["cit_growth"]),
            raw_patent_score=float(row["raw_pat"]),
            patent_count=int(row["patent_count"]),
            granted_patents=int(row["granted_patents"]),
            raw_funding_score=float(row["raw_fund"]),
            pi_project_count=int(row["pi_project_count"]),
            copi_project_count=int(row["copi_project_count"]),
            total_sanctioned_amount=float(row["total_sanctioned_amount"]),
            raw_phd_score=float(row["raw_phd"]),
            total_scholars=int(row["total_scholars"]),
            awarded_scholars=int(row["awarded_scholars"]),
        )

    def _map_to_summary(self, row: Dict[str, Any]) -> FacultySummary:
        return FacultySummary(
            employee_no=row["employee_no"],
            name=row["full_name"],
            department=row["dept_code"],
            designation=row["designation"],
            evaluation_date=str(row["eval_date"]),
            experience_years=float(row["exp_years"]),
            final_score=float(row["final_score"]),
            department_rank=int(row["dept_rank"]),
            institution_rank=int(row["inst_rank"]),
            components=self._map_to_components(row),
            context=self._map_to_context(row),
        )

    def _map_to_ranked_item(self, row: Dict[str, Any]) -> RankedFacultyItem:
        return RankedFacultyItem(
            employee_no=row["employee_no"],
            name=row["full_name"],
            department=row["dept_code"],
            designation=row["designation"],
            final_score=float(row["final_score"]),
            base_score=round(float(row["base_research_score"]), 1),
            institution_rank=int(row["inst_rank"]),
            department_rank=int(row["dept_rank"]),
            experience_years=float(row["exp_years"]),
            total_publications=int(row["total_pubs"]),
            q1_publications=int(row["q1_pubs"]),
            components=self._map_to_components(row),
            context=self._map_to_context(row),
        )

    def _map_to_detail(self, row: Dict[str, Any]) -> FacultyDetail:
        # Construct evidence statements dynamically from database calculation columns
        evidence = [
            f"{row['total_pubs']} total publications authored ({row['q1_pubs'] + row['q2_pubs']} in Q1/Q2, {row['unindexed_pubs']} unindexed/predatory)",
            f"Principal Investigator on {row['pi_project_count']} grant(s) with {round(row['total_sanctioned_amount'] / 100000.0, 1)} Lakhs INR sanctioned",
            f"Career stage factor: {row['stage_factor']} for {row['designation']} with {row['exp_years']} years experience as of {row['eval_date']}",
        ]
        if row.get("patent_count", 0) > 0:
            evidence.append(
                f"Inventor on {row['patent_count']} patent(s) ({row['granted_patents']} granted)"
            )
        if row.get("total_scholars", 0) > 0:
            evidence.append(
                f"Doctoral supervisor for {row['total_scholars']} scholar(s) ({row['awarded_scholars']} awarded)"
            )

        # Construct explanation facts dynamically from SQL metrics
        explanation_facts = [
            f"Quality-weighted publication score ({row['norm_pub']}/100) reflects placement in peer-reviewed venues",
            f"Captured funding score ({row['norm_fund']}/100) through competitive sanctioned research grants",
            f"Workload recognition adjustment: {row['load_multiplier']}x based on {row['avg_variance_pct']}% load variance",
            f"Earned {row['final_score']} final score with department rank {row['dept_rank']} and institution rank {row['inst_rank']}",
        ]

        return FacultyDetail(
            faculty_id=str(row["faculty_id"]),
            employee_no=row["employee_no"],
            name=row["full_name"],
            department=row["dept_code"],
            department_name=row["dept_name"],
            designation=row["designation"],
            evaluation_date=str(row["eval_date"]),
            experience_years=float(row["exp_years"]),
            base_score=round(float(row["base_research_score"]), 1),
            final_score=float(row["final_score"]),
            department_rank=int(row["dept_rank"]),
            institution_rank=int(row["inst_rank"]),
            applied_weights=self._map_to_weights(row),
            components=self._map_to_components(row),
            context=self._map_to_context(row),
            raw_metrics=self._map_to_raw_metrics(row),
            evidence=evidence,
            explanation_facts=explanation_facts,
        )
