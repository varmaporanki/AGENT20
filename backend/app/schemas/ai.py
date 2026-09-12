"""
Pydantic schemas for Gemini AI research insight and score explanation responses.
Guarantees strict separation between deterministic numerical analytics and AI narratives.
"""

from typing import List, Union
from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    """Constrained evidence metric mapping with deterministic scalar values."""

    metric: str = Field(
        description="Name of the deterministic metric evaluated (e.g., 'Q1 Publications', 'Sanctioned Grants')",
        examples=["Q1 Publications"],
    )
    value: Union[str, int, float] = Field(
        description="Deterministic scalar value from the database",
        examples=[4],
    )
    interpretation: str = Field(
        description="Analytical interpretation grounded strictly in the evaluated data",
        examples=["Demonstrates top-tier research quality with 100% placement in indexed venues."],
    )


class AIInsightResponse(BaseModel):
    """Comprehensive AI-generated research productivity insights and recommendations."""

    employee_no: str = Field(description="Unique faculty employee identifier", examples=["EMP0014"])
    evaluation_date: str = Field(description="Point-in-time evaluation date", examples=["2024-12-31"])
    summary: str = Field(description="High-level executive summary of research performance")
    strengths: List[str] = Field(description="Key verified research accomplishments and high-performing pillars")
    areas_for_improvement: List[str] = Field(description="Pillars or outputs with growth potential")
    recommendations: List[str] = Field(description="Actionable, evidence-grounded recommendations for faculty development")
    evidence: List[EvidenceItem] = Field(description="Key deterministic metrics supporting the narrative")
    disclaimer: str = Field(
        default="AI-generated interpretation of deterministic institutional analytics.",
        description="Mandatory compliance disclaimer",
    )


class ScoreExplanationResponse(BaseModel):
    """
    Detailed analytical breakdown explaining how the deterministic research score was attained.
    Authoritative numerical fields originate from PostgreSQL / Step 3B;
    narrative explanation fields originate from Gemini.
    """

    # --- Authoritative Deterministic Numerical Fields (From PostgreSQL / Step 3B) ---
    employee_no: str = Field(description="Unique faculty employee identifier")
    evaluation_date: str = Field(description="Point-in-time evaluation date")
    department_code: str = Field(description="Department discipline code")
    final_score: float = Field(description="Authoritative final score on 0-100 scale (from PostgreSQL)")
    base_score: float = Field(description="Base research score before context adjustments (from PostgreSQL)")
    department_rank: int = Field(description="Deterministic department rank (from PostgreSQL)")
    institution_rank: int = Field(description="Deterministic institutional rank (from PostgreSQL)")
    publication_score: float = Field(description="Normalized publication quality score (0-100)")
    citation_score: float = Field(description="Normalized citation impact score (0-100)")
    patent_score: float = Field(description="Normalized patent portfolio score (0-100)")
    funding_score: float = Field(description="Normalized external grant funding score (0-100)")
    phd_score: float = Field(description="Normalized doctoral guidance score (0-100)")
    workload_multiplier: float = Field(description="Workload recognition factor (1.00 - 1.15)")
    career_stage_multiplier: float = Field(description="Career-stage startup equity factor (1.00 - 1.20)")
    combined_adjustment: float = Field(description="Combined context factor clamped to max 1.30")

    # --- Validated AI Narrative Fields (From Gemini) ---
    score_band_summary: str = Field(description="Narrative explaining the performance tier and score context")
    strongest_pillars: List[str] = Field(description="Narrative explanation of the highest performing pillars")
    weakest_pillars: List[str] = Field(description="Narrative explanation of the lowest performing or inactive pillars")
    workload_and_context_impact: str = Field(description="Explanation of how teaching/admin load and career stage impacted the final score")
    peer_comparison: str = Field(description="Contextual comparison relative to department and institution peers")
    recommendations: List[str] = Field(description="Targeted suggestions to improve future research productivity")
    disclaimer: str = Field(
        default="AI-generated interpretation of deterministic institutional analytics.",
        description="Mandatory compliance disclaimer",
    )


# -----------------------------------------------------------------------------
# Internal Pydantic Schemas for Validating Raw Gemini Output
# -----------------------------------------------------------------------------

class GeminiInsightPayload(BaseModel):
    """Internal validation model for Gemini insight JSON output."""

    summary: str
    strengths: List[str]
    areas_for_improvement: List[str]
    recommendations: List[str]
    evidence: List[EvidenceItem]


class GeminiScoreExplanationPayload(BaseModel):
    """Internal validation model for Gemini score explanation JSON output."""

    score_band_summary: str
    strongest_pillars: List[str]
    weakest_pillars: List[str]
    workload_and_context_impact: str
    peer_comparison: str
    recommendations: List[str]
