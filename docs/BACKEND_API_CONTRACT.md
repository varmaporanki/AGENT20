# Agent 20 — Backend API Contract & Integration Guide

This document establishes the official REST API contract for **Agent 20 (Research Productivity Agent)** to support frontend integration by **Teammate-2**.

---

## 🌐 Server & Base URL Configuration

- **Default Local Base URL**: `http://localhost:8000`
- **Interactive Documentation**: `http://localhost:8000/docs` (OpenAPI / Swagger)
- **Alternative Documentation**: `http://localhost:8000/redoc` (ReDoc)
- **Default Content-Type**: `application/json`
- **CORS Allowed Origins**: Configured via `ALLOWED_ORIGINS` in `.env` (defaults: `http://localhost:3000`, `http://localhost:5173`, `http://localhost:4173`, `http://localhost:8080`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`, `http://127.0.0.1:4173`, `http://127.0.0.1:8080`)


---

## 🧭 Endpoint Summary

| Method | Path | Summary | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server health probe | None |
| `GET` | `/health/db` | Database connectivity probe | None |
| `GET` | `/api/v1` | API version & metadata | None |
| `GET` | `/api/v1/faculty` | Paginated faculty list | `page`, `page_size`, `department` |
| `GET` | `/api/v1/faculty/{employee_no}` | Single faculty full profile | None |
| `GET` | `/api/v1/rankings` | Institution & department rankings | `department` |
| `GET` | `/api/v1/departments` | All department summaries | None |
| `GET` | `/api/v1/departments/{department_code}`| Department detail & benchmarks | None |

---

## 1. Health Checks

### `GET /health`
Verifies backend process availability.

**Response `200 OK`**:
```json
{
  "status": "ok"
}
```

### `GET /health/db`
Probes PostgreSQL database connectivity.

**Response `200 OK` (Connected)**:
```json
{
  "status": "connected",
  "database": "acadagents",
  "message": "PostgreSQL connection healthy"
}
```

**Response `503 Service Unavailable` (Disconnected)**:
```json
{
  "status": "disconnected",
  "database": "acadagents",
  "message": "Unable to connect to PostgreSQL database"
}
```

### `GET /api/v1`
Returns API metadata, version, and documentation link.

**Response `200 OK`**:
```json
{
  "name": "Agent 20 — Research Productivity Analytics API",
  "version": "1.0.0",
  "status": "active",
  "docs": "/docs"
}
```

---

## 2. Faculty Analytics

### `GET /api/v1/faculty`
Returns a paginated list of faculty members with calculated research scores.

#### Query Parameters:
| Parameter | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `page` | integer | `1` | Page number (1-indexed) |
| `page_size` | integer | `20` | Number of records per page (max `100`) |
| `department` | string | `null` | Filter by department code (`CSE`, `MECH`, `BIO`, `HSS`) |

#### Response `200 OK`:
```json
{
  "items": [
    {
      "employee_no": "EMP0014",
      "name": "Dr. Sneha Patel",
      "department": "BIO",
      "designation": "ASSISTANT_PROFESSOR",
      "evaluation_date": "2024-12-31",
      "experience_years": 3.0,
      "final_score": 78.0,
      "department_rank": 2,
      "institution_rank": 6,
      "components": {
        "publication_quality": 100.0,
        "citation_impact": 47.5,
        "patents": 0.0,
        "funding": 100.0,
        "phd_supervision": 0.0
      },
      "context": {
        "teaching_hours": 16.0,
        "administrative_load": 0.0,
        "workload_variance_pct": 33.3,
        "workload_multiplier": 1.05,
        "career_stage_multiplier": 1.20,
        "combined_adjustment": 1.26
      }
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 24,
  "total_pages": 2,
  "data": [
    {
      "employee_no": "EMP0014",
      "name": "Dr. Sneha Patel",
      "department": "BIO",
      "designation": "ASSISTANT_PROFESSOR",
      "evaluation_date": "2024-12-31",
      "experience_years": 3.0,
      "final_score": 78.0,
      "department_rank": 2,
      "institution_rank": 6,
      "components": {
        "publication_quality": 100.0,
        "citation_impact": 47.5,
        "patents": 0.0,
        "funding": 100.0,
        "phd_supervision": 0.0
      },
      "context": {
        "teaching_hours": 16.0,
        "administrative_load": 0.0,
        "workload_variance_pct": 33.3,
        "workload_multiplier": 1.05,
        "career_stage_multiplier": 1.20,
        "combined_adjustment": 1.26
      }
    }
  ],
  "pagination": {
    "total_items": 24,
    "page": 1,
    "page_size": 20,
    "total_pages": 2,
    "has_next": true,
    "has_prev": false
  }
}
```
> [!TIP]
> The pagination response exposes convenience fields (`items`, `page`, `page_size`, `total`, `total_pages`) directly at the root, while preserving the legacy nested `data` and `pagination` blocks for maximum frontend flexibility.


---

### `GET /api/v1/faculty/{employee_no}`
Retrieves the complete profile, raw metrics, applied dynamic weights, and explainability evidence for one faculty member.

#### Path Parameters:
- `employee_no` (string, e.g. `EMP0003`)

#### Response `200 OK` (Example for Dr. Ananya Sharma `EMP0003`):
```json
{
  "faculty_id": "11111111-1111-1111-1111-111111111103",
  "employee_no": "EMP0003",
  "name": "Dr. Ananya Sharma",
  "department": "CSE",
  "department_name": "Computer Science & Engineering",
  "designation": "ASSISTANT_PROFESSOR",
  "evaluation_date": "2024-12-31",
  "experience_years": 3.3,
  "base_score": 45.3,
  "final_score": 57.1,
  "department_rank": 3,
  "institution_rank": 10,
  "applied_weights": {
    "publication_weight": 0.35,
    "citation_weight": 0.25,
    "patent_weight": 0.15,
    "funding_weight": 0.15,
    "phd_weight": 0.10,
    "weight_sum": 1.0
  },
  "components": {
    "publication_quality": 57.1,
    "citation_impact": 41.2,
    "patents": 0.0,
    "funding": 100.0,
    "phd_supervision": 0.0
  },
  "context": {
    "teaching_hours": 16.0,
    "administrative_load": 0.0,
    "workload_variance_pct": 33.3,
    "workload_multiplier": 1.05,
    "career_stage_multiplier": 1.20,
    "combined_adjustment": 1.26
  },
  "raw_metrics": {
    "raw_publication_score": 40.0,
    "total_publications": 4,
    "q1_publications": 4,
    "q2_publications": 0,
    "q3_q4_publications": 0,
    "unindexed_publications": 0,
    "flagged_publications": 0,
    "raw_citation_score": 48.4,
    "cumulative_citations": 320,
    "h_index": 4,
    "i10_index": 3,
    "annual_citation_momentum": 70,
    "raw_patent_score": 0.0,
    "patent_count": 0,
    "granted_patents": 0,
    "raw_funding_score": 31.5,
    "pi_project_count": 1,
    "copi_project_count": 0,
    "total_sanctioned_amount": 4800000.0,
    "raw_phd_score": 0.0,
    "total_scholars": 0,
    "awarded_scholars": 0
  },
  "evidence": [
    "4 total publications authored (4 in Q1/Q2, 0 unindexed/predatory)",
    "Principal Investigator on 1 grant(s) with 48.0 Lakhs INR sanctioned",
    "Career stage factor: 1.20 for ASSISTANT_PROFESSOR with 3.3 years experience as of 2024-12-31"
  ],
  "explanation_facts": [
    "Quality-weighted publication score (57.1/100) reflects placement in peer-reviewed venues",
    "Captured funding score (100.0/100) through competitive sanctioned research grants",
    "Workload recognition adjustment: 1.05x based on 33.3% load variance",
    "Earned 57.1 final score with department rank 3 and institution rank 10"
  ]
}
```

#### Response `404 Not Found`:
```json
{
  "detail": "Faculty EMP9999 not found"
}
```

---

## 3. Rankings

### `GET /api/v1/rankings`
Retrieves research rankings across all faculty or within a specific department.

#### Query Parameters:
| Parameter | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `department` | string | `null` | Optional department filter (e.g. `CSE`) |

#### Response `200 OK`:
```json
{
  "total_faculty": 24,
  "evaluation_date": "2024-12-31",
  "department_filter": null,
  "rankings": [
    {
      "employee_no": "EMP0014",
      "name": "Dr. Sneha Patel",
      "department": "BIO",
      "designation": "ASSISTANT_PROFESSOR",
      "final_score": 78.0,
      "base_score": 61.9,
      "institution_rank": 6,
      "department_rank": 2,
      "experience_years": 3.0,
      "total_publications": 9,
      "q1_publications": 4,
      "components": {
        "publication_quality": 100.0,
        "citation_impact": 47.5,
        "patents": 0.0,
        "funding": 100.0,
        "phd_supervision": 0.0
      },
      "context": {
        "teaching_hours": 16.0,
        "administrative_load": 0.0,
        "workload_variance_pct": 33.3,
        "workload_multiplier": 1.05,
        "career_stage_multiplier": 1.20,
        "combined_adjustment": 1.26
      }
    }
  ]
}
```

---

## 4. Departments

### `GET /api/v1/departments`
Returns high-level research summaries and dynamic weight allocations for all departments.

#### Response `200 OK`:
```json
[
  {
    "department_code": "BIO",
    "department_name": "Biotechnology",
    "faculty_count": 6,
    "average_score": 48.2,
    "top_score": 82.5,
    "has_patents": true,
    "applied_weights": {
      "publication_weight": 0.35,
      "citation_weight": 0.25,
      "patent_weight": 0.15,
      "funding_weight": 0.15,
      "phd_weight": 0.10,
      "weight_sum": 1.0
    },
    "top_performer": {
      "employee_no": "EMP0015",
      "name": "Dr. Kavita Rao",
      "final_score": 82.5,
      "designation": "PROFESSOR"
    }
  },
  {
    "department_code": "HSS",
    "department_name": "Humanities & Social Sciences",
    "faculty_count": 6,
    "average_score": 42.1,
    "top_score": 71.0,
    "has_patents": false,
    "applied_weights": {
      "publication_weight": 0.45,
      "citation_weight": 0.30,
      "patent_weight": 0.00,
      "funding_weight": 0.15,
      "phd_weight": 0.10,
      "weight_sum": 1.0
    },
    "top_performer": {
      "employee_no": "EMP0021",
      "name": "Dr. Meenakshi Sundaram",
      "final_score": 71.0,
      "designation": "PROFESSOR"
    }
  }
]
```

---

### `GET /api/v1/departments/{department_code}`
Returns exhaustive departmental analytics, dynamic benchmarks for each pillar, and the ranked faculty roster.

#### Path Parameters:
- `department_code` (string, e.g. `CSE`, `MECH`, `BIO`, `HSS`)

#### Response `200 OK`:
```json
{
  "department_code": "CSE",
  "department_name": "Computer Science & Engineering",
  "faculty_count": 6,
  "average_score": 44.5,
  "top_score": 68.4,
  "has_patents": true,
  "applied_weights": {
    "publication_weight": 0.35,
    "citation_weight": 0.25,
    "patent_weight": 0.15,
    "funding_weight": 0.15,
    "phd_weight": 0.10,
    "weight_sum": 1.0
  },
  "benchmarks": {
    "max_raw_publication": 70.0,
    "min_raw_publication": 14.5,
    "max_raw_citation": 117.5,
    "min_raw_citation": 36.6,
    "max_raw_patent": 20.0,
    "min_raw_patent": 0.0,
    "max_raw_funding": 31.5,
    "min_raw_funding": 0.0,
    "max_raw_phd": 16.0,
    "min_raw_phd": 0.0
  },
  "faculty": [
    {
      "employee_no": "EMP0003",
      "name": "Dr. Ananya Sharma",
      "department": "CSE",
      "designation": "ASSISTANT_PROFESSOR",
      "final_score": 57.1,
      "base_score": 45.3,
      "institution_rank": 10,
      "department_rank": 3,
      "experience_years": 3.3,
      "total_publications": 4,
      "q1_publications": 4,
      "components": {
        "publication_quality": 57.1,
        "citation_impact": 41.2,
        "patents": 0.0,
        "funding": 100.0,
        "phd_supervision": 0.0
      },
      "context": {
        "teaching_hours": 16.0,
        "administrative_load": 0.0,
        "workload_variance_pct": 33.3,
        "workload_multiplier": 1.05,
        "career_stage_multiplier": 1.20,
        "combined_adjustment": 1.26
      }
    }
  ]
}
```

#### Response `404 Not Found`:
```json
{
  "detail": "Department INVALID not found"
}
```

---

## 5. Verified Benchmark Test Cases

For end-to-end integration and visual verification, teammate-2 can verify against these four canonical test cases:

| Case | Employee No | Name | Department | Designation | Final Score | Dept Rank | Key Visual Insight |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **A** | `EMP0002` | Dr. Rajesh Kumar | CSE | Associate Professor | **16.3** | **6 / 6** | 10 publications, but zero Q1/Q2 papers; predatory volume penalty. |
| **B** | `EMP0003` | Dr. Ananya Sharma | CSE | Assistant Professor | **57.1** | **3 / 6** | 4 Q1 papers; competitive 48L SERB grant; 1.20x career startup multiplier. |
| **C** | `EMP0007` | Dr. Vikramaditya Singh | MECH | Professor | **41.2** | **3 / 6** | Heavy Dean+HOD load (36 hrs/wk); max +15% workload recognition applied. |
| **D** | `EMP0014` | Dr. Sneha Patel | BIO | Assistant Professor | **78.0** | **2 / 6** | 9 Q1/Q2 publications; 55L DBT grant; high research acceleration. |

---

## 6. Error Handling Standard

All API errors return RFC-compliant JSON objects:

```json
{
  "detail": "Descriptive message without database or security leakages"
}
```

- `400 Bad Request`: Validation failure on input parameters.
- `404 Not Found`: Target entity (`faculty`, `department`) does not exist.
- `422 Unprocessable Entity`: Schema validation failure (FastAPI Pydantic).
- `500 Internal Server Error`: Generic internal failure; credentials and SQL traces are stripped.
- `503 Service Unavailable`: PostgreSQL connection offline.
