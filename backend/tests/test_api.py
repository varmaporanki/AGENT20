"""
Backend API test suite for Agent 20.
Validates all health probes, faculty analytics, department metrics, rankings,
and exact deterministic scores for the four seeded benchmark faculty.
"""

import pytest
from fastapi.testclient import TestClient


def test_01_health(client: TestClient):
    """Verify application health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_02_health_db(client: TestClient):
    """Verify database health endpoint."""
    response = client.get("/health/db")
    # Status code will be 200 (connected) or 503 (disconnected if no live local DB)
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert data["database"] == "acadagents"


def test_03_list_faculty(client: TestClient):
    """Verify GET /api/v1/faculty returns paginated structure and components."""
    response = client.get("/api/v1/faculty?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert len(data["data"]) > 0
    first = data["data"][0]
    assert "employee_no" in first
    assert "final_score" in first
    assert "components" in first
    assert "context" in first


def test_04_faculty_case_a_emp0002(client: TestClient):
    """Case A: EMP0002 — Dr. Rajesh Kumar (High volume, low tier -> 16.3)."""
    response = client.get("/api/v1/faculty/EMP0002")
    assert response.status_code == 200
    data = response.json()
    assert data["employee_no"] == "EMP0002"
    assert data["department"] == "CSE"
    assert round(data["final_score"], 1) == 16.3
    assert data["department_rank"] == 6
    assert data["institution_rank"] == 19
    assert data["components"]["publication_quality"] == 20.7
    assert data["components"]["citation_impact"] == 31.2
    assert data["context"]["workload_multiplier"] == 1.033
    assert data["context"]["career_stage_multiplier"] == 1.05


def test_05_faculty_case_b_emp0003(client: TestClient):
    """Case B: EMP0003 — Dr. Ananya Sharma (Low volume, high tier -> 57.1)."""
    response = client.get("/api/v1/faculty/EMP0003")
    assert response.status_code == 200
    data = response.json()
    assert data["employee_no"] == "EMP0003"
    assert data["department"] == "CSE"
    assert round(data["final_score"], 1) == 57.1
    assert data["department_rank"] == 3
    assert data["institution_rank"] == 10
    assert data["components"]["publication_quality"] == 57.1
    assert data["components"]["funding"] == 100.0
    assert data["context"]["career_stage_multiplier"] == 1.20
    assert data["context"]["combined_adjustment"] == 1.26


def test_06_faculty_case_c_emp0007(client: TestClient):
    """Case C: EMP0007 — Dr. Vikramaditya Singh (Severe admin load -> 41.2)."""
    response = client.get("/api/v1/faculty/EMP0007")
    assert response.status_code == 200
    data = response.json()
    assert data["employee_no"] == "EMP0007"
    assert data["department"] == "MECH"
    assert round(data["final_score"], 1) == 41.2
    assert data["department_rank"] == 3
    assert data["institution_rank"] == 13
    assert data["components"]["patents"] == 25.0
    assert data["context"]["workload_variance_pct"] == 100.0
    assert data["context"]["workload_multiplier"] == 1.15


def test_07_faculty_case_d_emp0014(client: TestClient):
    """Case D: EMP0014 — Dr. Sneha Patel (Early career acceleration -> 78.0)."""
    response = client.get("/api/v1/faculty/EMP0014")
    assert response.status_code == 200
    data = response.json()
    assert data["employee_no"] == "EMP0014"
    assert data["department"] == "BIO"
    assert round(data["final_score"], 1) == 78.0
    assert data["department_rank"] == 2
    assert data["institution_rank"] == 6
    assert data["components"]["publication_quality"] == 100.0
    assert data["components"]["citation_impact"] == 47.5
    assert data["context"]["career_stage_multiplier"] == 1.20
    assert data["context"]["combined_adjustment"] == 1.26


def test_08_faculty_not_found(client: TestClient):
    """Verify 404 for nonexistent faculty."""
    response = client.get("/api/v1/faculty/EMP9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_09_rankings(client: TestClient):
    """Verify GET /api/v1/rankings returns ordered records."""
    response = client.get("/api/v1/rankings")
    assert response.status_code == 200
    data = response.json()
    assert "rankings" in data
    assert data["total_faculty"] > 0
    scores = [r["final_score"] for r in data["rankings"]]
    # Verify rankings are sorted descending by final score
    assert scores == sorted(scores, reverse=True)


def test_10_departments_summary(client: TestClient):
    """Verify GET /api/v1/departments returns department summaries."""
    response = client.get("/api/v1/departments")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "department_code" in first
    assert "faculty_count" in first
    assert "applied_weights" in first
    assert first["applied_weights"]["weight_sum"] == 1.0


def test_11_department_detail_cse(client: TestClient):
    """Verify GET /api/v1/departments/CSE returns department analytics and benchmarks."""
    response = client.get("/api/v1/departments/CSE")
    assert response.status_code == 200
    data = response.json()
    assert data["department_code"] == "CSE"
    assert "benchmarks" in data
    assert "faculty" in data
    assert data["benchmarks"]["max_raw_publication"] > 0


def test_12_department_not_found(client: TestClient):
    """Verify 404 for invalid department code."""
    response = client.get("/api/v1/departments/NONEXISTENT_DEPT")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
