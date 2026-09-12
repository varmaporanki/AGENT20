"""Department analytics schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.faculty import AppliedWeights
from app.schemas.rankings import RankedFacultyItem


class DepartmentTopPerformer(BaseModel):
    employee_no: str
    name: str
    final_score: float
    designation: str


class DepartmentSummary(BaseModel):
    department_code: str
    department_name: str
    faculty_count: int
    average_score: float
    top_score: float
    has_patents: bool
    applied_weights: AppliedWeights
    top_performer: Optional[DepartmentTopPerformer] = None


class DepartmentBenchmarks(BaseModel):
    max_raw_publication: float
    min_raw_publication: float
    max_raw_citation: float
    min_raw_citation: float
    max_raw_patent: float
    min_raw_patent: float
    max_raw_funding: float
    min_raw_funding: float
    max_raw_phd: float
    min_raw_phd: float


class DepartmentDetail(BaseModel):
    department_code: str
    department_name: str
    faculty_count: int
    average_score: float
    top_score: float
    has_patents: bool
    applied_weights: AppliedWeights
    benchmarks: DepartmentBenchmarks
    faculty: List[RankedFacultyItem]
