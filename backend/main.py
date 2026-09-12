"""
FastAPI Backend Application for AGENT 20
Connects to PostgreSQL acadagents and exposes authoritative Step 3B scoring metrics.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from .services import (
    get_institution_overview,
    get_department_benchmarks,
    get_all_faculty,
    get_faculty_by_id_or_code
)
from .assistant import handle_assistant_query

app = FastAPI(
    title="Agent 20 Research Productivity Intelligence API",
    version="1.0.0",
    description="Authoritative REST API serving deterministic analytics from PostgreSQL 16 acadagents"
)

# CORS Middleware allowing the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AssistantQueryRequest(BaseModel):
    question: str
    contextFacultyId: Optional[str] = None
    contextDepartment: Optional[str] = None

from .ai_provider import ai_service

# Health check
@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "service": "Agent 20 Backend API",
        "database": "acadagents",
        "ai": ai_service.get_status()
    }

# Safe AI Provider Observability (No secrets, no live token burn)
@app.get("/ai/status")
@app.get("/api/v1/ai/status")
def api_ai_status():
    return ai_service.get_status()

# 1. Institution Overview
@app.get("/institution/overview")
@app.get("/api/v1/institution/overview")
def api_institution_overview():
    try:
        return get_institution_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. Departments
@app.get("/departments")
@app.get("/api/v1/departments")
def api_departments():
    try:
        return get_department_benchmarks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/departments/{code}")
@app.get("/api/v1/departments/{code}")
def api_department_by_code(code: str):
    try:
        depts = get_department_benchmarks(dept_code=code.upper())
        if not depts:
            raise HTTPException(status_code=404, detail=f"Department '{code}' not found")
        return depts[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Faculty Roster
@app.get("/faculty")
@app.get("/api/v1/faculty")
def api_faculty(
    search: Optional[str] = Query(None),
    dept: Optional[str] = Query(None),
    designation: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    order: Optional[str] = Query("asc")
):
    try:
        return get_all_faculty(
            search=search,
            dept=dept,
            designation=designation,
            sort_by=sort_by,
            order=order
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. Faculty Dossier
@app.get("/faculty/{id_or_emp}")
@app.get("/api/v1/faculty/{id_or_emp}")
def api_faculty_detail(id_or_emp: str):
    try:
        faculty = get_faculty_by_id_or_code(id_or_emp)
        if not faculty:
            raise HTTPException(status_code=404, detail=f"Faculty '{id_or_emp}' not found")
        return faculty
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. AI Assistant Query
@app.post("/assistant/query")
@app.post("/api/v1/assistant/query")
def api_assistant_query(req: AssistantQueryRequest):
    try:
        return handle_assistant_query(
            question=req.question,
            context_faculty_id=req.contextFacultyId,
            context_department=req.contextDepartment
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
