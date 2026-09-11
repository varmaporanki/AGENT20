"""Test fixtures and mock datasets matching the validated Step 3B scoring prototype."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

# Canonical 4 test cases plus department representation from Step 3B specification
SAMPLE_FACULTY_ROWS = [
    {
        "faculty_id": "11111111-1111-1111-1111-111111111102",
        "employee_no": "EMP0002",
        "full_name": "Dr. Rajesh Kumar",
        "dept_code": "CSE",
        "dept_name": "Computer Science & Engineering",
        "designation": "ASSOCIATE_PROFESSOR",
        "eval_date": "2024-12-31",
        "exp_years": 8.4,
        "stage_factor": 1.05,
        "total_pubs": 10,
        "q1_pubs": 0,
        "q2_pubs": 0,
        "q3_q4_pubs": 6,
        "unindexed_pubs": 4,
        "flagged_pubs": 0,
        "raw_pub": 14.5,
        "cits_latest": 85,
        "h_index": 3,
        "i10_index": 1,
        "cit_growth": 15,
        "raw_cit": 36.6,
        "patent_count": 0,
        "granted_patents": 0,
        "raw_pat": 0.0,
        "pi_project_count": 0,
        "copi_project_count": 0,
        "total_sanctioned_amount": 0.0,
        "raw_fund": 0.0,
        "total_scholars": 0,
        "awarded_scholars": 0,
        "raw_phd": 0.0,
        "avg_teaching_hours": 14.0,
        "avg_admin_load": 2.0,
        "avg_total_load": 22.0,
        "avg_variance_pct": 22.2,
        "load_multiplier": 1.033,
        "has_patents": True,
        "w_pub": 0.35,
        "w_cit": 0.25,
        "w_pat": 0.15,
        "w_fund": 0.15,
        "w_phd": 0.10,
        "weight_sum": 1.000,
        "norm_pub": 20.7,
        "norm_cit": 31.2,
        "norm_pat": 0.0,
        "norm_fund": 0.0,
        "norm_phd": 0.0,
        "base_research_score": 15.0,
        "combined_context_factor": 1.085,
        "final_score": 16.3,
        "dept_rank": 6,
        "inst_rank": 19,
    },
    {
        "faculty_id": "11111111-1111-1111-1111-111111111103",
        "employee_no": "EMP0003",
        "full_name": "Dr. Ananya Sharma",
        "dept_code": "CSE",
        "dept_name": "Computer Science & Engineering",
        "designation": "ASSISTANT_PROFESSOR",
        "eval_date": "2024-12-31",
        "exp_years": 3.3,
        "stage_factor": 1.20,
        "total_pubs": 4,
        "q1_pubs": 4,
        "q2_pubs": 0,
        "q3_q4_pubs": 0,
        "unindexed_pubs": 0,
        "flagged_pubs": 0,
        "raw_pub": 40.0,
        "cits_latest": 320,
        "h_index": 4,
        "i10_index": 3,
        "cit_growth": 70,
        "raw_cit": 48.4,
        "patent_count": 0,
        "granted_patents": 0,
        "raw_pat": 0.0,
        "pi_project_count": 1,
        "copi_project_count": 0,
        "total_sanctioned_amount": 4800000.0,
        "raw_fund": 31.5,
        "total_scholars": 0,
        "awarded_scholars": 0,
        "raw_phd": 0.0,
        "avg_teaching_hours": 16.0,
        "avg_admin_load": 0.0,
        "avg_total_load": 24.0,
        "avg_variance_pct": 33.3,
        "load_multiplier": 1.050,
        "has_patents": True,
        "w_pub": 0.35,
        "w_cit": 0.25,
        "w_pat": 0.15,
        "w_fund": 0.15,
        "w_phd": 0.10,
        "weight_sum": 1.000,
        "norm_pub": 57.1,
        "norm_cit": 41.2,
        "norm_pat": 0.0,
        "norm_fund": 100.0,
        "norm_phd": 0.0,
        "base_research_score": 45.3,
        "combined_context_factor": 1.260,
        "final_score": 57.1,
        "dept_rank": 3,
        "inst_rank": 10,
    },
    {
        "faculty_id": "11111111-1111-1111-1111-111111111107",
        "employee_no": "EMP0007",
        "full_name": "Dr. Vikramaditya Singh",
        "dept_code": "MECH",
        "dept_name": "Mechanical Engineering",
        "designation": "PROFESSOR",
        "eval_date": "2024-12-31",
        "exp_years": 18.4,
        "stage_factor": 1.00,
        "total_pubs": 3,
        "q1_pubs": 2,
        "q2_pubs": 1,
        "q3_q4_pubs": 0,
        "unindexed_pubs": 0,
        "flagged_pubs": 0,
        "raw_pub": 23.0,
        "cits_latest": 250,
        "h_index": 5,
        "i10_index": 4,
        "cit_growth": 35,
        "raw_cit": 52.0,
        "patent_count": 1,
        "granted_patents": 0,
        "raw_pat": 5.0,
        "pi_project_count": 0,
        "copi_project_count": 1,
        "total_sanctioned_amount": 3500000.0,
        "raw_fund": 28.2,
        "total_scholars": 1,
        "awarded_scholars": 0,
        "raw_phd": 3.0,
        "avg_teaching_hours": 12.0,
        "avg_admin_load": 24.0,
        "avg_total_load": 36.0,
        "avg_variance_pct": 100.0,
        "load_multiplier": 1.150,
        "has_patents": True,
        "w_pub": 0.35,
        "w_cit": 0.25,
        "w_pat": 0.15,
        "w_fund": 0.15,
        "w_phd": 0.10,
        "weight_sum": 1.000,
        "norm_pub": 16.4,
        "norm_cit": 37.7,
        "norm_pat": 25.0,
        "norm_fund": 100.0,
        "norm_phd": 18.8,
        "base_research_score": 35.8,
        "combined_context_factor": 1.150,
        "final_score": 41.2,
        "dept_rank": 3,
        "inst_rank": 13,
    },
    {
        "faculty_id": "11111111-1111-1111-1111-111111111114",
        "employee_no": "EMP0014",
        "full_name": "Dr. Sneha Patel",
        "dept_code": "BIO",
        "dept_name": "Biotechnology",
        "designation": "ASSISTANT_PROFESSOR",
        "eval_date": "2024-12-31",
        "exp_years": 3.0,
        "stage_factor": 1.20,
        "total_pubs": 9,
        "q1_pubs": 4,
        "q2_pubs": 5,
        "q3_q4_pubs": 0,
        "unindexed_pubs": 0,
        "flagged_pubs": 0,
        "raw_pub": 70.0,
        "cits_latest": 410,
        "h_index": 6,
        "i10_index": 5,
        "cit_growth": 95,
        "raw_cit": 58.9,
        "patent_count": 0,
        "granted_patents": 0,
        "raw_pat": 0.0,
        "pi_project_count": 1,
        "copi_project_count": 0,
        "total_sanctioned_amount": 5500000.0,
        "raw_fund": 31.9,
        "total_scholars": 0,
        "awarded_scholars": 0,
        "raw_phd": 0.0,
        "avg_teaching_hours": 16.0,
        "avg_admin_load": 0.0,
        "avg_total_load": 24.0,
        "avg_variance_pct": 33.3,
        "load_multiplier": 1.050,
        "has_patents": True,
        "w_pub": 0.35,
        "w_cit": 0.25,
        "w_pat": 0.15,
        "w_fund": 0.15,
        "w_phd": 0.10,
        "weight_sum": 1.000,
        "norm_pub": 100.0,
        "norm_cit": 47.5,
        "norm_pat": 0.0,
        "norm_fund": 100.0,
        "norm_phd": 0.0,
        "base_research_score": 61.9,
        "combined_context_factor": 1.260,
        "final_score": 78.0,
        "dept_rank": 2,
        "inst_rank": 6,
    },
]


class MockAnalyticsRepository:
    """Mock repository providing exact Step 3B prototype data for fast offline unit tests."""

    def __init__(self, data=None):
        self.data = data or SAMPLE_FACULTY_ROWS

    def get_all_scored_faculty(self, eval_date: str):
        return list(self.data)

    def get_faculty_by_employee_no(self, employee_no: str, eval_date: str):
        for f in self.data:
            if f["employee_no"].upper() == employee_no.upper():
                return dict(f)
        return None

    def get_rankings(self, eval_date: str, department_code=None):
        rows = list(self.data)
        if department_code:
            rows = [r for r in rows if r["dept_code"].upper() == department_code.upper()]
            return sorted(rows, key=lambda x: (x["dept_rank"], -x["final_score"]))
        return sorted(rows, key=lambda x: (x["inst_rank"], -x["final_score"]))

    def get_departments_summary(self, eval_date: str):
        depts = {}
        for r in self.data:
            code = r["dept_code"]
            if code not in depts:
                depts[code] = {
                    "dept_code": code,
                    "dept_name": r["dept_name"],
                    "faculty_count": 0,
                    "scores": [],
                    "has_patents": r["has_patents"],
                    "w_pub": r["w_pub"],
                    "w_cit": r["w_cit"],
                    "w_pat": r["w_pat"],
                    "w_fund": r["w_fund"],
                    "w_phd": r["w_phd"],
                    "weight_sum": r["weight_sum"],
                }
            depts[code]["faculty_count"] += 1
            depts[code]["scores"].append(r["final_score"])

        summary = []
        for code, info in sorted(depts.items()):
            summary.append({
                "dept_code": code,
                "dept_name": info["dept_name"],
                "faculty_count": info["faculty_count"],
                "average_score": round(sum(info["scores"]) / len(info["scores"]), 1),
                "top_score": max(info["scores"]),
                "has_patents": info["has_patents"],
                "w_pub": info["w_pub"],
                "w_cit": info["w_cit"],
                "w_pat": info["w_pat"],
                "w_fund": info["w_fund"],
                "w_phd": info["w_phd"],
                "weight_sum": info["weight_sum"],
            })
        return summary

    def get_department_faculty_and_benchmarks(self, department_code: str, eval_date: str):
        dept_faculty = [r for r in self.data if r["dept_code"].upper() == department_code.upper()]
        if not dept_faculty:
            return None

        first = dept_faculty[0]
        return {
            "department_code": first["dept_code"],
            "department_name": first["dept_name"],
            "faculty_count": len(dept_faculty),
            "average_score": round(sum(f["final_score"] for f in dept_faculty) / len(dept_faculty), 1),
            "top_score": max(f["final_score"] for f in dept_faculty),
            "has_patents": first["has_patents"],
            "w_pub": first["w_pub"],
            "w_cit": first["w_cit"],
            "w_pat": first["w_pat"],
            "w_fund": first["w_fund"],
            "w_phd": first["w_phd"],
            "weight_sum": first["weight_sum"],
            "benchmarks": {
                "max_raw_publication": max(f["raw_pub"] for f in dept_faculty),
                "min_raw_publication": min(f["raw_pub"] for f in dept_faculty),
                "max_raw_citation": max(f["raw_cit"] for f in dept_faculty),
                "min_raw_citation": min(f["raw_cit"] for f in dept_faculty),
                "max_raw_patent": max(f["raw_pat"] for f in dept_faculty),
                "min_raw_patent": min(f["raw_pat"] for f in dept_faculty),
                "max_raw_funding": max(f["raw_fund"] for f in dept_faculty),
                "min_raw_funding": min(f["raw_fund"] for f in dept_faculty),
                "max_raw_phd": max(f["raw_phd"] for f in dept_faculty),
                "min_raw_phd": min(f["raw_phd"] for f in dept_faculty),
            },
            "faculty": dept_faculty,
        }


@pytest.fixture(scope="module")
def client(monkeypatch_module=None):
    """TestClient instance with mock repository fallback for contract validation."""
    from app.routers import faculty, rankings, departments
    from app.services.analytics_service import AnalyticsService
    import app.db as db_mod

    # Use mock repository for contract unit tests
    mock_repo = MockAnalyticsRepository()
    mock_service = AnalyticsService(repository=mock_repo)

    faculty._service = mock_service
    rankings._service = mock_service
    departments._service = mock_service

    # Prevent 5-second socket timeout on DB pool initialization during unit testing
    orig_init = db_mod.init_db_pool
    db_mod.init_db_pool = lambda: None

    with TestClient(app) as test_client:
        yield test_client

    db_mod.init_db_pool = orig_init
