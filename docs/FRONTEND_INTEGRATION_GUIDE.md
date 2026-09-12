# Agent 20 — Frontend Integration Guide & Developer Reference

This document is the official, complete integration manual created specifically for **Teammate-2 (Frontend Developer)** to build and run the Agent 20 frontend application entirely against the FastAPI backend.

---

## 🏛️ Architectural Guardrails & Division of Responsibility

To preserve system security, auditability, and deterministic consistency across the system:

1. **Frontend Communicates ONLY With FastAPI**:
   - The frontend **NEVER** connects to PostgreSQL directly.
   - The frontend **NEVER** executes SQL queries or views.
   - The frontend **NEVER** requires or uses `DATABASE_URL`, `psycopg`, or database credentials.
2. **Deterministic Scores & Ranks are Backend-Owned**:
   - All scores (`final_score`, `base_score`, pillar components, context multipliers, and official ranks) are computed authoritatively in PostgreSQL.
   - The frontend **MUST NOT** recalculate, modify, or visually override official scores or rankings.
3. **AI Layer is Narrative-Only**:
   - Gemini produces explanations and strategic recommendations based strictly on authoritative PostgreSQL facts.
   - The frontend **NEVER** calls the Google Gemini API directly and **NEVER** stores `GEMINI_API_KEY`.
   - The frontend sends only the faculty identifier in the URL path (`POST /api/v1/ai/faculty/{employee_no}/insight`); no numerical parameters or score overrides are accepted.

---

## 🚀 1. Backend Startup & Local Setup

### Prerequisites
- Python 3.11+
- Virtual environment (recommended)

### Starting the Backend Server
From the repository root (`AGENT20`):

```bash
# 1. Activate virtual environment (if using venv)
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# 2. Navigate to backend directory and start server
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

When the server starts successfully, verify with:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Database Health**: [http://localhost:8000/health/db](http://localhost:8000/health/db)

---

## 🌐 2. Base URL & Environment Configuration

### Frontend Environment Variable
In your frontend project root (e.g. Vite or Next.js), configure your environment file:

#### For Vite (`.env.local` / `.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

#### For Next.js (`.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Development API Client Example
```typescript
// src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    const error = new Error(errorBody.detail || `Request failed with status ${response.status}`);
    (error as any).status = response.status;
    (error as any).body = errorBody;
    throw error;
  }

  return response.json();
}
```

---

## 🛡️ 3. CORS Configuration

The backend CORS policy is pre-configured to allow local frontend development servers.
Configured origins include:
- `http://localhost:3000` (React / Next.js default)
- `http://localhost:5173` (Vite dev default)
- `http://localhost:4173` (Vite preview default)
- `http://localhost:8080` (Webpack / Vue default)
- `http://127.0.0.1:3000`, `http://127.0.0.1:5173`, `http://127.0.0.1:4173`, `http://127.0.0.1:8080`

If your frontend runs on a different port (e.g., `http://localhost:5000`), update `ALLOWED_ORIGINS` in `backend/.env`:
```env
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5173,http://localhost:3000
```
> [!NOTE]
> `allow_origins=["*"]` is deliberately not used because credential support (`allow_credentials=True`) is enabled for secure cookie/header propagation.

---

## 🧭 4. Endpoint Specifications & Code Examples

### 4.1 Faculty Roster (`GET /api/v1/faculty`)
Retrieves a paginated roster of faculty members with final scores, department/institutional ranks, and pillar breakdowns.

#### Query Parameters:
- `page` (number, default: `1`, min: `1`)
- `page_size` (number, default: `20`, min: `1`, max: `100`)
- `department` (string, optional: `CSE`, `MECH`, `BIO`, `HSS`)

#### Response Structure:
The response provides both top-level convenience fields (`items`, `page`, `page_size`, `total`, `total_pages`) and legacy nested blocks (`data`, `pagination`):
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
  "total_pages": 2
}
```

#### TypeScript / Fetch Example:
```typescript
export async function getFacultyList(page = 1, pageSize = 20, department?: string) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (department) {
    params.append("department", department);
  }
  return apiClient<{ items: FacultySummary[]; total: number; total_pages: number }>(
    `/faculty?${params.toString()}`
  );
}
```

---

### 4.2 Faculty Detail Profile (`GET /api/v1/faculty/{employee_no}`)
Retrieves the complete profile for a single faculty member including raw metrics, discipline-specific weights, context multipliers, and audit evidence.

#### Path Parameters:
- `employee_no` (string, e.g. `EMP0003`)

#### Response Highlights:
- **Identity**: `employee_no`, `name`, `department`, `designation`, `experience_years`
- **Scores**: `final_score`, `base_score`, `department_rank`, `institution_rank`
- **Pillars**: `publication_quality`, `citation_impact`, `patents`, `funding`, `phd_supervision`
- **Weights**: `publication_weight`, `citation_weight`, `patent_weight`, `funding_weight`, `phd_weight`
- **Context Adjustment**: `teaching_hours`, `administrative_load`, `workload_multiplier`, `career_stage_multiplier`, `combined_adjustment`
- **Raw Metrics**: Publication counts by quartile, citations, h-index, granted patents, sanctioned grant amounts, PhD scholars
- **Evidence & Facts**: Structured human-readable audit explanations

#### TypeScript / Fetch Example:
```typescript
export async function getFacultyDetail(employeeNo: string) {
  return apiClient<FacultyDetail>(`/faculty/${encodeURIComponent(employeeNo)}`);
}
```

---

### 4.3 Research Productivity Rankings (`GET /api/v1/rankings`)
Retrieves official deterministic rankings. Pre-sorted by `final_score DESC` and official rank.

#### Query Parameters:
- `department` (string, optional: e.g. `CSE`, `BIO`)

#### Response Structure:
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
      "components": { ... },
      "context": { ... }
    }
  ]
}
```

#### TypeScript / Fetch Example:
```typescript
export async function getRankings(department?: string) {
  const query = department ? `?department=${encodeURIComponent(department)}` : "";
  return apiClient<RankingsResponse>(`/rankings${query}`);
}
```

---

### 4.4 Department Overview & Analytics (`GET /api/v1/departments`)
Retrieves high-level summary cards for all 4 seeded departments (`CSE`, `MECH`, `BIO`, `HSS`).

#### Response Structure:
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
  }
]
```

#### Department Detail (`GET /api/v1/departments/{department_code}`):
Provides departmental min/max benchmarks across all 5 research pillars alongside the ranked faculty roster.

---

### 4.5 AI Research Insight (`POST /api/v1/ai/faculty/{employee_no}/insight`)
Triggers Gemini synthesis of executive research insights, verified strengths, growth areas, and actionable recommendations.

> [!IMPORTANT]
> - Use HTTP `POST`.
> - Do **NOT** provide a request body with scores or numbers.
> - The backend retrieves verified data from PostgreSQL.

#### TypeScript / Fetch Example:
```typescript
export async function getFacultyAIInsight(employeeNo: string) {
  return apiClient<AIInsightResponse>(
    `/ai/faculty/${encodeURIComponent(employeeNo)}/insight`,
    { method: "POST" }
  );
}
```

#### Response Structure:
```json
{
  "employee_no": "EMP0014",
  "evaluation_date": "2024-12-31",
  "summary": "Dr. Sneha Patel demonstrates exceptional early-career momentum in Biotechnology...",
  "strengths": [
    "100% placement of publications in Q1 and Q2 indexed venues (9 total papers: 4 Q1, 5 Q2).",
    "Secured 55.0 Lakhs INR in competitive external grant funding as Principal Investigator from DBT."
  ],
  "areas_for_improvement": [
    "No intellectual property disclosures or filed patents in the portfolio.",
    "Doctoral scholar guidance has not yet commenced."
  ],
  "recommendations": [
    "Translate high-impact bioprocess research findings into provisional patent disclosures."
  ],
  "evidence": [
    {
      "metric": "Final Score",
      "value": 78.0,
      "interpretation": "High overall deterministic research productivity score placing 2nd in department."
    }
  ],
  "disclaimer": "AI-generated interpretation of deterministic institutional analytics."
}
```

---

### 4.6 AI Score Explanation (`POST /api/v1/ai/faculty/{employee_no}/explain-score`)
Explains the exact mathematical score drivers, context adjustments, and peer comparisons.

#### TypeScript / Fetch Example:
```typescript
export async function explainFacultyScore(employeeNo: string) {
  return apiClient<ScoreExplanationResponse>(
    `/ai/faculty/${encodeURIComponent(employeeNo)}/explain-score`,
    { method: "POST" }
  );
}
```

---

## 🧪 5. Seeded Benchmark Verification Cases

To test and visually verify your components, use these 4 canonical benchmark faculty members:

| Case | Employee No | Name | Dept | Designation | Final Score | Dept Rank | Visual / Narrative Highlight |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **A** | `EMP0002` | Dr. Rajesh Kumar | CSE | Associate Professor | **16.3** | **6 / 6** | 10 publications, but zero Q1/Q2; predatory volume penalty. |
| **B** | `EMP0003` | Dr. Ananya Sharma | CSE | Assistant Professor | **57.1** | **3 / 6** | 4 Q1 papers; 48L SERB grant; 1.20x career startup multiplier. |
| **C** | `EMP0007` | Dr. Vikramaditya Singh | MECH | Professor | **41.2** | **3 / 6** | 36 hrs/wk Dean+HOD load; maximum +15% workload multiplier applied. |
| **D** | `EMP0014` | Dr. Sneha Patel | BIO | Assistant Professor | **78.0** | **2 / 6** | 9 Q1/Q2 papers; 55L DBT grant; high early-career research momentum. |

---

## ⚠️ 6. Error Handling & Demo Fallback Behavior

All API errors return a standard JSON shape:
```json
{
  "detail": "Description of the error"
}
```

### Standard Status Codes:
- `400 Bad Request`: Malformed entity ID (e.g. employee number with special characters).
- `404 Not Found`: Faculty or department does not exist.
- `422 Unprocessable Entity`: Invalid query parameters (e.g. `page=0` or `page_size=500`).
- `502 Bad Gateway`: Upstream AI returned malformed output.
- `503 Service Unavailable`: PostgreSQL connection offline or Gemini service not configured.

### Recommended UI States:

#### 1. AI Service Unavailable (Status 503 / 502)
When Gemini API key is unconfigured or rate-limited, display a graceful notification instead of crashing:
```tsx
// Example React component snippet
if (error?.status === 503 || error?.status === 502) {
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
      <p className="font-semibold">AI Insights Temporarily Unavailable</p>
      <p className="text-sm">Deterministic scores and institutional data remain fully operational.</p>
    </div>
  );
}
```

#### 2. Faculty Not Found (Status 404)
Display a clear empty state: "Faculty record EMPXXXX was not found in the institution database."

#### 3. Database Offline (Status 503 on `/health/db`)
Display an institutional connectivity warning: "Database connection unavailable. Please ensure the local PostgreSQL service is running."

#### 4. Loading States & Skeleton Screens
AI endpoints typically take 1.5 - 3.5 seconds when calling live Gemini. Render a pulsating skeleton loader or progress indicator during `POST /api/v1/ai/...` requests.

---

## 📋 7. Frontend Checklist for Teammate-2

- [ ] Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` in frontend `.env`
- [ ] Implement Dashboard overview fetching `/faculty`, `/rankings`, and `/departments`
- [ ] Implement Faculty List page using pagination parameters (`page`, `page_size`, `department`)
- [ ] Implement Faculty Detail page displaying radar/bar charts of the 5 pillar scores
- [ ] Implement Context Adjustment card showing teaching hours, admin load, and multipliers
- [ ] Implement Department Cards displaying top score and applied weights
- [ ] Implement "Generate AI Insight" button calling `POST /api/v1/ai/faculty/{employee_no}/insight`
- [ ] Add graceful fallback banner when AI returns 503
- [ ] Confirm benchmark scores: EMP0002 (16.3), EMP0003 (57.1), EMP0007 (41.2), EMP0014 (78.0)
