"""Rankings API schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.faculty import PillarComponents, ContextAdjustment


class RankedFacultyItem(BaseModel):
    employee_no: str
    name: str
    department: str
    designation: str
    final_score: float
    base_score: float
    institution_rank: int
    department_rank: int
    experience_years: float
    total_publications: int
    q1_publications: int
    components: PillarComponents
    context: ContextAdjustment


class RankingsResponse(BaseModel):
    total_faculty: int
    evaluation_date: str
    department_filter: Optional[str] = None
    rankings: List[RankedFacultyItem]
