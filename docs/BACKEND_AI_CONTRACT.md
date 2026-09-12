# Agent 20 — Backend AI Contract & Integration Guide

This document establishes the official REST API contract for the **Gemini AI Insight & Explanation Layer** in **Agent 20 (Research Productivity Agent)** to support frontend integration by **Teammate-2**.

---

## 🏛️ Core Principles & Division of Responsibility

> [!IMPORTANT]
> **Strict Determinism vs. AI Interpretation**:
> Final scores, pillar scores, rankings, weights, normalization, career-stage adjustment, and workload adjustment originate exclusively from the deterministic PostgreSQL analytics engine (`data/step3b_scoring_prototype.sql`). **Gemini only interprets and explains those supplied results.**
> 
> The client cannot pass or override scores, multipliers, or metrics. All numerical values are retrieved authoritatively by the backend from PostgreSQL before being passed to Gemini for narrative synthesis.

---

## 🌐 Server & Configuration

- **Base URL**: `http://localhost:8000`
- **Interactive Documentation**: `http://localhost:8000/docs`
- **Default Content-Type**: `application/json`
- **Supported Gemini Model**: `gemini-2.0-flash` (configurable via `GEMINI_MODEL` in `.env`)
- **API Key Handling**: Configured exclusively on the backend (`GEMINI_API_KEY`). The Gemini API key is **never** sent to or exposed by the frontend.

---

## 🧭 Endpoint Summary

| Method | Path | Summary | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/faculty/{employee_no}/insight` | Comprehensive Faculty Insight | Synthesizes an executive narrative report with verified strengths, areas for improvement, recommendations, and evidence items. |
| `POST` | `/api/v1/ai/faculty/{employee_no}/explain-score` | Deterministic Score Explanation | Merges authoritative PostgreSQL scores and ranks with AI narrative explaining score drivers, strongest/weakest pillars, and context multipliers. |

---

## 1. Comprehensive Faculty Research Insight

### `POST /api/v1/ai/faculty/{employee_no}/insight`

Grounded strictly in the faculty member's deterministic institutional records.

#### Path Parameters:
| Parameter | Type | Example | Description |
| :--- | :---: | :---: | :--- |
| `employee_no` | string | `EMP0014` | Faculty employee identifier (3-20 alphanumeric characters) |

#### Request Body:
*None required*. The backend retrieves all authoritative evaluation data directly from the PostgreSQL scoring engine.

#### Response `200 OK`:
```json
{
  "employee_no": "EMP0014",
  "evaluation_date": "2024-12-31",
  "summary": "Dr. Sneha Patel demonstrates exceptional early-career research momentum in Biotechnology, combining high publication quality with significant external grant mobilization.",
  "strengths": [
    "100% placement of publications in Q1 and Q2 indexed venues (9 total papers: 4 Q1, 5 Q2).",
    "Secured 55.0 Lakhs INR in competitive external grant funding as Principal Investigator from DBT.",
    "Strong citation momentum with 95 citations gained in the past 12 months."
  ],
  "areas_for_improvement": [
    "No intellectual property disclosures or filed patents in the portfolio.",
    "Doctoral scholar guidance has not yet commenced."
  ],
  "recommendations": [
    "Translate high-impact bioprocess research findings into provisional patent disclosures.",
    "Enroll doctoral scholars to establish an active doctoral research group."
  ],
  "evidence": [
    {
      "metric": "Final Score",
      "value": 78.0,
      "interpretation": "High overall deterministic research productivity score placing 2nd in department and 6th in institution."
    },
    {
      "metric": "Publication Quality",
      "value": 100.0,
      "interpretation": "Perfect normalized publication score within Biotechnology."
    },
    {
      "metric": "Sponsored Grants",
      "value": 55.0,
      "interpretation": "55.0 Lakhs INR sanctioned grant under DBT."
    }
  ],
  "disclaimer": "AI-generated interpretation of deterministic institutional analytics."
}
```

---

## 2. Deterministic Score & Ranking Explanation

### `POST /api/v1/ai/faculty/{employee_no}/explain-score`

Combines authoritative PostgreSQL numbers with validated Gemini narrative explanations.

#### Path Parameters:
| Parameter | Type | Example | Description |
| :--- | :---: | :---: | :--- |
| `employee_no` | string | `EMP0003` | Faculty employee identifier (3-20 alphanumeric characters) |

#### Response `200 OK` (Example for Dr. Ananya Sharma `EMP0003`):
```json
{
  "employee_no": "EMP0003",
  "evaluation_date": "2024-12-31",
  "department_code": "CSE",
  "final_score": 57.1,
  "base_score": 45.3,
  "department_rank": 3,
  "institution_rank": 10,
  "publication_score": 57.1,
  "citation_score": 41.2,
  "patent_score": 0.0,
  "funding_score": 100.0,
  "phd_score": 0.0,
  "workload_multiplier": 1.05,
  "career_stage_multiplier": 1.2,
  "combined_adjustment": 1.26,
  "score_band_summary": "Dr. Ananya Sharma achieved a final score of 57.1/100, ranking 3rd in Computer Science & Engineering and 10th institution-wide, driven by pristine publication selectivity and top-tier funding.",
  "strongest_pillars": [
    "External grant funding achieved a maximum score of 100.0/100 through a competitive 48.0 Lakhs INR SERB grant as PI.",
    "Publication quality scored 57.1/100 with 100% placement in Q1 international venues."
  ],
  "weakest_pillars": [
    "Zero patent disclosures (0.0/100) and zero doctoral scholars guided (0.0/100)."
  ],
  "workload_and_context_impact": "An Assistant Professor startup equity factor of 1.20x was applied (3.3 years experience), combined with a 1.05x workload recognition multiplier for above-average instructional contact (16 scheduled hours), yielding a 1.26x composite adjustment.",
  "peer_comparison": "Ranks 3rd of 6 faculty in Computer Science & Engineering, outperforming senior colleagues with higher raw publication volume due to quality weighting and funding capture.",
  "recommendations": [
    "Expand doctoral scholar intake to activate the PhD guidance pillar (10% weight).",
    "Identify algorithmic or software implementations eligible for patent or copyright filing."
  ],
  "disclaimer": "AI-generated interpretation of deterministic institutional analytics."
}
```

---

## 3. Error Handling Standard

The AI layer returns standard RFC-compliant JSON errors:

```json
{
  "detail": "Error description"
}
```

| HTTP Code | Condition | Detail Message Example |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid `employee_no` format | `"Invalid employee number format: 'E!'. Must be 3-20 alphanumeric characters."` |
| `404 Not Found` | Faculty does not exist | `"Faculty EMP9999 not found"` |
| `502 Bad Gateway` | Upstream AI returned malformed output | `"Upstream AI service returned an invalid insight structure."` |
| `503 Service Unavailable` | Missing API key / Gemini timeout / rate limit | `"Gemini AI service is not configured. Please set a valid GEMINI_API_KEY in the environment."` |
| `500 Internal Server Error` | Unexpected backend failure | Generic internal message; stack traces and credentials stripped |

---

## 4. Security & Privacy Guarantees

1. **Prompt Injection Defense**: All database-derived text (names, titles, abstracts) is treated as untrusted data in the Gemini system prompt. It cannot override system instructions.
2. **Data Minimization**: The backend strictly transmits only evaluated research counts, normalized scores, and context multipliers to Gemini. Database credentials, connection URLs, internal IDs, and raw SQL queries are **never** transmitted to Gemini.
3. **Secret Redaction**: API keys and database passwords are sanitized from all client-facing responses, logging, and exception messages.
