// ============================================================================
// AGENT 20 — RESEARCH PRODUCTIVITY INTELLIGENCE
// Frontend Core Data Models & Service Types
// Synchronized with PostgreSQL 16 `acadagents` & Authoritative FastAPI Backend
// ============================================================================

export type DepartmentCode = 'CSE' | 'MECH' | 'BIO' | 'HSS' | string;

export type Designation = 'PROFESSOR' | 'ASSOCIATE_PROFESSOR' | 'ASSISTANT_PROFESSOR' | string;

export interface PillarComponents {
  publication_quality: number | null; // 0.0 - 100.0 or null
  citation_impact: number | null;     // 0.0 - 100.0 or null
  patents: number | null;             // 0.0 - 100.0 or null
  funding: number | null;             // 0.0 - 100.0 or null
  phd_supervision: number | null;     // 0.0 - 100.0 or null
}

export interface AppliedWeights {
  publication: number;                // e.g. 0.35 (Eng/Sci) or 0.45 (HSS)
  citation: number;                   // e.g. 0.25 (Eng/Sci) or 0.30 (HSS)
  patents: number;                    // e.g. 0.15 (Eng/Sci) or 0.00 (HSS)
  funding: number;                    // e.g. 0.15
  phd: number;                        // e.g. 0.10
  weight_sum: number;                 // Strictly 1.000
  // Backend property aliases
  publication_weight?: number;
  citation_weight?: number;
  patent_weight?: number;
  funding_weight?: number;
  phd_weight?: number;
}

export interface RawMetrics {
  total_pubs: number;
  q1_pubs: number;
  q2_pubs: number;
  q3_q4_pubs: number;
  unindexed_pubs: number;
  flagged_pubs: number;
  cits_latest: number;
  h_index: number;
  i10_index: number;
  cit_growth: number;
  patent_count: number;
  granted_patents: number;
  total_sanctioned_lakhs: number;
  pi_project_count: number;
  copi_project_count: number;
  total_scholars: number;
  awarded_scholars: number;
  // Backend property aliases
  total_publications?: number;
  q1_publications?: number;
  q2_publications?: number;
  q3_q4_publications?: number;
  unindexed_publications?: number;
  flagged_publications?: number;
  cumulative_citations?: number;
  annual_citation_momentum?: number;
  total_sanctioned_amount?: number;
  raw_publication_score?: number;
  raw_citation_score?: number;
  raw_patent_score?: number;
  raw_funding_score?: number;
  raw_phd_score?: number;
}

export interface WorkloadContext {
  teaching_hours: number;
  administrative_load: number;
  workload_variance_pct: number;
  workload_multiplier: number;       // 1.000 - 1.150 (+15% max)
  career_stage_multiplier: number;   // 1.00 - 1.20
  combined_adjustment: number;       // min(1.30, stage * load)
}

export interface PublicationItem {
  id: string;
  title: string;
  venue: string;
  year: number;
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Unindexed' | 'Flagged' | string;
  citations: number;
  isCorresponding: boolean;
  authorOrder: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  agency: string;
  sanctionedLakhs: number;
  role: 'PI' | 'Co-PI' | string;
  status: string;
}

export interface CitationSnapshotItem {
  year: number;
  citations: number;
  hIndex: number;
}

export interface FacultyMember {
  faculty_id?: string;
  employee_no: string;
  name: string;
  department: DepartmentCode;
  department_name?: string;
  designation: Designation;
  evaluation_date?: string | null;
  experience_years?: number | null;
  base_score?: number | null;
  final_score: number | null;
  department_rank: number | null;
  rank_within_department: number | null;
  institution_rank: number | null;
  rank_institution: number | null;
  applied_weights?: AppliedWeights | null;
  components: PillarComponents;
  raw_metrics?: RawMetrics | null;
  workload_context?: WorkloadContext | null;
  context?: WorkloadContext | null;
  evidence?: string[];
  explanation_facts?: string[];
  publications?: PublicationItem[];
  projects?: ProjectItem[];
  citation_history?: CitationSnapshotItem[];
}

export interface DepartmentInfo {
  code: DepartmentCode;
  name: string;
  faculty_count: number | null;
  mean_score: number | null;
  median_score?: number | null;
  top_score?: number | null;
  total_pubs?: number | null;
  q1_percentage?: number | null;
  total_cits?: number | null;
  total_funding_lakhs?: number | null;
  patents_count?: number | null;
  phd_count?: number | null;
  weights?: AppliedWeights | null;
  benchmark_pillars?: PillarComponents | null;
  description?: string;

  top_researcher?: {
    employee_no: string;
    name: string;
    score: number | null;
  } | null;
}

export interface InstitutionOverview {
  institution_name: string;
  institution_code?: string;
  evaluation_date?: string;
  total_faculty: number | null;
  mean_score: number | null;
  total_publications: number | null;
  q1_publication_percentage: number | null;
  total_grant_funding_lakhs: number | null;
  active_patents: number | null;
  total_phd_scholars?: number | null;
  total_citations?: number | null;
  departments: DepartmentInfo[];
  top_researchers: FacultyMember[];
  annual_trends?: Array<{
    year: number;
    citations: number;
    publications: number;
    funding_lakhs: number;
  }>;
}

export interface AssistantEvidenceItem {
  metric: string;
  value: string | number;
  source: string;
}

export interface AssistantQuery {
  question: string;
  contextFacultyId?: string;
  contextDepartment?: DepartmentCode;
}

export interface AssistantResponse {
  query?: string;
  answer: string;
  evidence?: AssistantEvidenceItem[] | string[];
  related_faculty?: string[];
  related_departments?: string[];
  disclaimer?: string;
  keyFindings?: string[];
  supportingData?: Record<string, unknown>;
  relatedQuestions?: string[];
  provider?: string;
}

export interface FacultyFilterParams {
  search?: string;
  department?: DepartmentCode | 'ALL';
  designation?: Designation | 'ALL';
  sortBy?: 'final_score' | 'total_pubs' | 'cits_latest' | 'total_sanctioned_lakhs' | 'patent_count' | 'rank_institution';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
