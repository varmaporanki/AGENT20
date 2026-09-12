# Agent 20 — Backend Service & API Contract

Production-grade FastAPI backend service exposing the authoritative Agent 20 Research Productivity Scoring Engine for the Academic Agent Platform.

---

## 🏛️ Architecture & Principles

1. **Deterministic Analytics**: All numerical scores are computed directly via PostgreSQL 16 relational algebra in `app/sql/scoring_engine.sql`. Python handles routing, serialization, parameter validation, and formatting; **Python never computes scores**.
2. **Step 3B Preservation**: Implements the validated 5-pillar scoring model:
   - Publication Quality ($S_{\text{pub}}$)
   - Citation Impact & Momentum ($S_{\text{cit}}$)
   - Patents & IP Disclosures ($S_{\text{pat}}$)
   - Sponsored Funding Grants ($S_{\text{fund}}$)
   - PhD Scholar Guidance ($S_{\text{phd}}$)
   - Discipline-specific dynamic weights (e.g. HSS patent weight reallocation to 45% Pub / 30% Cit)
   - Career-stage equity factors ($1.00$ to $1.20$)
   - Instructional and administrative workload recognition multipliers ($1.00$ to $1.15$)
   - Global zero-variance fallback safeguards
   - Final score bounded to $0.0$–$100.0$
3. **Database Security & Pooling**: Powered by `psycopg3` connection pooling (`psycopg_pool.ConnectionPool`). Real database credentials exist only in `.env` (gitignored).

---

## 📂 Project Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entrypoint & middleware
│   ├── config.py                # Environment configuration settings
│   ├── db.py                    # psycopg3 connection pool & health probe
│   ├── sql/
│   │   └── scoring_engine.sql   # Step 3B authoritative PostgreSQL scoring CTE
│   ├── schemas/                 # Pydantic request & response models
│   │   ├── common.py
│   │   ├── faculty.py
│   │   ├── rankings.py
│   │   ├── department.py
│   │   └── ai.py                # Gemini AI response & evidence schemas
│   ├── repositories/            # SQL execution & row mapping
│   │   └── analytics_repository.py
│   ├── services/                # Business logic & response mapping
│   │   ├── analytics_service.py
│   │   └── gemini_service.py    # Gemini GenAI explanation & insight service
│   └── routers/                 # REST API endpoints
│       ├── health.py
│       ├── faculty.py
│       ├── rankings.py
│       ├── departments.py
│       └── ai.py                # POST /api/v1/ai/faculty/{id}/insight & explain-score
├── tests/
│   ├── conftest.py              # Test fixtures & mock datasets
│   ├── test_api.py              # Step 1 API test suite (12 tests)
│   └── test_ai.py               # Step 2 Gemini AI test suite (10 tests)
├── .env.example                 # Configuration template
├── requirements.txt             # Backend dependencies
└── README.md
```

---

## 🚀 Quickstart

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env to set your PostgreSQL connection string:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/acadagents
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Interactive API Documentation
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Running Automated Tests

```bash
pytest tests/test_api.py -v
```

Validates:
- Health check probes (`/health`, `/health/db`)
- Paginated faculty directory (`/api/v1/faculty`)
- Benchmark test cases:
  - `EMP0002` (Dr. Rajesh Kumar) -> `16.3`
  - `EMP0003` (Dr. Ananya Sharma) -> `57.1`
  - `EMP0007` (Dr. Vikramaditya Singh) -> `41.2`
  - `EMP0014` (Dr. Sneha Patel) -> `78.0`
- Institution and department rankings (`/api/v1/rankings`)
- Department summaries and benchmarks (`/api/v1/departments`, `/api/v1/departments/{code}`)
- Clean 404 responses for missing entities
