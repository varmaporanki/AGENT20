"""Faculty research productivity schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field


class PillarComponents(BaseModel):
    publication_quality: float = Field(description="Normalized publication score (0-100)")
    citation_impact: float = Field(description="Normalized citation impact score (0-100)")
    patents: float = Field(description="Normalized patent portfolio score (0-100)")
    funding: float = Field(description="Normalized sponsored grants score (0-100)")
    phd_supervision: float = Field(description="Normalized PhD guidance score (0-100)")


class AppliedWeights(BaseModel):
    publication_weight: float
    citation_weight: float
    patent_weight: float
    funding_weight: float
    phd_weight: float
    weight_sum: float


class ContextAdjustment(BaseModel):
    teaching_hours: float
    administrative_load: float
    workload_variance_pct: float
    workload_multiplier: float
    career_stage_multiplier: float
    combined_adjustment: float


class RawMetrics(BaseModel):
    raw_publication_score: float
    total_publications: int
    q1_publications: int
    q2_publications: int
    q3_q4_publications: int
    unindexed_publications: int
    flagged_publications: int
    raw_citation_score: float
    cumulative_citations: int
    h_index: int
    i10_index: int
    annual_citation_momentum: int
    raw_patent_score: float
    patent_count: int
    granted_patents: int
    raw_funding_score: float
    pi_project_count: int
    copi_project_count: int
    total_sanctioned_amount: float
    raw_phd_score: float
    total_scholars: int
    awarded_scholars: int


class FacultySummary(BaseModel):
    employee_no: str
    name: str
    department: str
    designation: str
    evaluation_date: str
    experience_years: float
    final_score: float
    department_rank: int
    institution_rank: int
    components: PillarComponents
    context: ContextAdjustment


class FacultyDetail(BaseModel):
    faculty_id: str
    employee_no: str
    name: str
    department: str
    department_name: str
    designation: str
    evaluation_date: str
    experience_years: float
    base_score: float
    final_score: float
    department_rank: int
    institution_rank: int
    applied_weights: AppliedWeights
    components: PillarComponents
    context: ContextAdjustment
    raw_metrics: RawMetrics
    evidence: List[str]
    explanation_facts: List[str]
