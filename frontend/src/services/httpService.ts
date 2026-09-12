// ============================================================================
// AGENT 20 — HTTP AUTHORITATIVE SERVICE LAYER
// Strictly connects to the verified FastAPI backend on main
// Base URL configured via import.meta.env.VITE_API_BASE_URL
//
// Verified backend endpoints:
// GET  /api/v1/faculty?page=1&page_size=20&department=<optional>
// GET  /api/v1/faculty/{employee_no}
// GET  /api/v1/rankings
// GET  /api/v1/departments
// GET  /api/v1/departments/{department_code}
// POST /api/v1/ai/faculty/{employee_no}/insight
// POST /api/v1/ai/faculty/{employee_no}/explain-score
// ============================================================================

import type {
  FacultyMember,
  DepartmentInfo,
  InstitutionOverview,
  AssistantQuery,
  AssistantResponse,
  FacultyFilterParams,
  DepartmentCode,
  AppliedWeights,
  RawMetrics,
  WorkloadContext,
  PillarComponents
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Request Failed [${response.status}] ${response.statusText}: ${errText}`);
  }

  return response.json();
}

// ----------------------------------------------------------------------------
// Model Mappers (FastAPI Pydantic Schemas -> Frontend Interfaces)
// ----------------------------------------------------------------------------

function mapAppliedWeights(raw?: any): AppliedWeights {
  const pub = raw?.publication_weight ?? raw?.publication ?? 0.35;
  const cit = raw?.citation_weight ?? raw?.citation ?? 0.25;
  const pat = raw?.patent_weight ?? raw?.patents ?? 0.15;
  const fund = raw?.funding_weight ?? raw?.funding ?? 0.15;
  const phd = raw?.phd_weight ?? raw?.phd ?? 0.10;
  const sum = raw?.weight_sum ?? (pub + cit + pat + fund + phd);

  return {
    publication: pub,
    citation: cit,
    patents: pat,
    funding: fund,
    phd: phd,
    weight_sum: sum,
    publication_weight: pub,
    citation_weight: cit,
    patent_weight: pat,
    funding_weight: fund,
    phd_weight: phd
  };
}

function mapRawMetrics(raw?: any): RawMetrics {
  if (!raw) {
    return {
      total_pubs: 0,
      q1_pubs: 0,
      q2_pubs: 0,
      q3_q4_pubs: 0,
      unindexed_pubs: 0,
      flagged_pubs: 0,
      cits_latest: 0,
      h_index: 0,
      i10_index: 0,
      cit_growth: 0,
      patent_count: 0,
      granted_patents: 0,
      total_sanctioned_lakhs: 0,
      pi_project_count: 0,
      copi_project_count: 0,
      total_scholars: 0,
      awarded_scholars: 0
    };
  }

  const sanctionedLakhs =
    raw.total_sanctioned_amount != null
      ? Math.round((raw.total_sanctioned_amount / 100000) * 10) / 10
      : (raw.total_sanctioned_lakhs ?? 0);

  return {
    total_pubs: raw.total_publications ?? raw.total_pubs ?? 0,
    q1_pubs: raw.q1_publications ?? raw.q1_pubs ?? 0,
    q2_pubs: raw.q2_publications ?? raw.q2_pubs ?? 0,
    q3_q4_pubs: raw.q3_q4_publications ?? raw.q3_q4_pubs ?? 0,
    unindexed_pubs: raw.unindexed_publications ?? raw.unindexed_pubs ?? 0,
    flagged_pubs: raw.flagged_publications ?? raw.flagged_pubs ?? 0,
    cits_latest: raw.cumulative_citations ?? raw.cits_latest ?? 0,
    h_index: raw.h_index ?? 0,
    i10_index: raw.i10_index ?? 0,
    cit_growth: raw.annual_citation_momentum ?? raw.cit_growth ?? 0,
    patent_count: raw.patent_count ?? 0,
    granted_patents: raw.granted_patents ?? 0,
    total_sanctioned_lakhs: sanctionedLakhs,
    pi_project_count: raw.pi_project_count ?? 0,
    copi_project_count: raw.copi_project_count ?? 0,
    total_scholars: raw.total_scholars ?? 0,
    awarded_scholars: raw.awarded_scholars ?? 0,

    // Aliases
    total_publications: raw.total_publications ?? raw.total_pubs ?? 0,
    q1_publications: raw.q1_publications ?? raw.q1_pubs ?? 0,
    cumulative_citations: raw.cumulative_citations ?? raw.cits_latest ?? 0,
    total_sanctioned_amount: raw.total_sanctioned_amount
  };
}

function mapWorkloadContext(raw?: any): WorkloadContext {
  if (!raw) {
    return {
      teaching_hours: 0,
      administrative_load: 0,
      workload_variance_pct: 0,
      workload_multiplier: 1.0,
      career_stage_multiplier: 1.0,
      combined_adjustment: 1.0
    };
  }

  return {
    teaching_hours: raw.teaching_hours ?? 0,
    administrative_load: raw.administrative_load ?? 0,
    workload_variance_pct: raw.workload_variance_pct ?? 0,
    workload_multiplier: raw.workload_multiplier ?? 1.0,
    career_stage_multiplier: raw.career_stage_multiplier ?? 1.0,
    combined_adjustment: raw.combined_adjustment ?? 1.0
  };
}

function mapFacultySummaryToMember(raw: any): FacultyMember {
  const context = mapWorkloadContext(raw.context);
  return {
    employee_no: raw.employee_no,
    name: raw.name,
    department: raw.department,
    designation: raw.designation,
    evaluation_date: raw.evaluation_date,
    experience_years: raw.experience_years,
    final_score: raw.final_score,
    department_rank: raw.department_rank,
    rank_within_department: raw.department_rank,
    institution_rank: raw.institution_rank,
    rank_institution: raw.institution_rank,
    components: raw.components || {
      publication_quality: null,
      citation_impact: null,
      patents: null,
      funding: null,
      phd_supervision: null
    },
    workload_context: context,
    context: context
  };
}

function mapFacultyDetailToMember(raw: any): FacultyMember {
  const context = mapWorkloadContext(raw.context);
  const weights = mapAppliedWeights(raw.applied_weights);
  const metrics = mapRawMetrics(raw.raw_metrics);

  return {
    faculty_id: raw.faculty_id,
    employee_no: raw.employee_no,
    name: raw.name,
    department: raw.department,
    department_name: raw.department_name,
    designation: raw.designation,
    evaluation_date: raw.evaluation_date,
    experience_years: raw.experience_years,
    base_score: raw.base_score,
    final_score: raw.final_score,
    department_rank: raw.department_rank,
    rank_within_department: raw.department_rank,
    institution_rank: raw.institution_rank,
    rank_institution: raw.institution_rank,
    applied_weights: weights,
    components: raw.components || {
      publication_quality: null,
      citation_impact: null,
      patents: null,
      funding: null,
      phd_supervision: null
    },
    raw_metrics: metrics,
    workload_context: context,
    context: context,
    evidence: raw.evidence || [],
    explanation_facts: raw.explanation_facts || [],
    publications: [],
    projects: [],
    citation_history: []
  };
}

function mapRankedFacultyItemToMember(raw: any): FacultyMember {
  const context = mapWorkloadContext(raw.context);
  const metrics = mapRawMetrics({
    total_publications: raw.total_publications,
    q1_publications: raw.q1_publications
  });

  return {
    employee_no: raw.employee_no,
    name: raw.name,
    department: raw.department,
    designation: raw.designation,
    final_score: raw.final_score,
    base_score: raw.base_score,
    institution_rank: raw.institution_rank,
    rank_institution: raw.institution_rank,
    department_rank: raw.department_rank,
    rank_within_department: raw.department_rank,
    experience_years: raw.experience_years,
    components: raw.components || {
      publication_quality: null,
      citation_impact: null,
      patents: null,
      funding: null,
      phd_supervision: null
    },
    raw_metrics: metrics,
    workload_context: context,
    context: context
  };
}

function mapDepartmentSummary(raw: any): DepartmentInfo {
  return {
    code: raw.department_code,
    name: raw.department_name,
    faculty_count: raw.faculty_count,
    mean_score: raw.average_score,
    top_score: raw.top_score,
    weights: mapAppliedWeights(raw.applied_weights),
    top_researcher: raw.top_performer
      ? {
          employee_no: raw.top_performer.employee_no,
          name: raw.top_performer.name,
          score: raw.top_performer.final_score
        }
      : null
  };
}

function mapDepartmentDetail(raw: any): DepartmentInfo {
  const facultyList = (raw.faculty || []).map(mapRankedFacultyItemToMember);
  const totalPubs = facultyList.reduce(
    (acc: number, f: FacultyMember) => acc + (f.raw_metrics?.total_pubs || 0),
    0
  );
  const totalQ1 = facultyList.reduce(
    (acc: number, f: FacultyMember) => acc + (f.raw_metrics?.q1_pubs || 0),
    0
  );
  const q1Pct = totalPubs > 0 ? Math.round((totalQ1 / totalPubs) * 100) : 0;

  let benchmarkPillars: PillarComponents | null = null;
  if (facultyList.length > 0) {
    const sumPillars = facultyList.reduce(
      (acc: any, f: FacultyMember) => {
        acc.pub += f.components?.publication_quality ?? 0;
        acc.cit += f.components?.citation_impact ?? 0;
        acc.pat += f.components?.patents ?? 0;
        acc.fund += f.components?.funding ?? 0;
        acc.phd += f.components?.phd_supervision ?? 0;
        return acc;
      },
      { pub: 0, cit: 0, pat: 0, fund: 0, phd: 0 }
    );
    const count = facultyList.length;
    benchmarkPillars = {
      publication_quality: Math.round((sumPillars.pub / count) * 10) / 10,
      citation_impact: Math.round((sumPillars.cit / count) * 10) / 10,
      patents: Math.round((sumPillars.pat / count) * 10) / 10,
      funding: Math.round((sumPillars.fund / count) * 10) / 10,
      phd_supervision: Math.round((sumPillars.phd / count) * 10) / 10
    };
  }

  return {
    code: raw.department_code,
    name: raw.department_name,
    faculty_count: raw.faculty_count,
    mean_score: raw.average_score,
    top_score: raw.top_score,
    total_pubs: totalPubs,
    q1_percentage: q1Pct,
    weights: mapAppliedWeights(raw.applied_weights),
    benchmark_pillars: benchmarkPillars,
    top_researcher:
      facultyList.length > 0
        ? {
            employee_no: facultyList[0].employee_no,
            name: facultyList[0].name,
            score: facultyList[0].final_score
          }
        : null
  };
}

// ----------------------------------------------------------------------------
// Department Service
// ----------------------------------------------------------------------------

export const httpDepartmentService = {
  async getDepartments(): Promise<DepartmentInfo[]> {
    const rawList = await fetchJson<any>('/departments');
    const items = Array.isArray(rawList) ? rawList : rawList?.value || [];
    return items.map(mapDepartmentSummary);
  },

  async getDepartmentByCode(code: DepartmentCode): Promise<DepartmentInfo | undefined> {
    const raw = await fetchJson<any>(`/departments/${encodeURIComponent(code)}`);
    return mapDepartmentDetail(raw);
  }
};

// ----------------------------------------------------------------------------
// Faculty Service
// ----------------------------------------------------------------------------

export const httpFacultyService = {
  async getFaculty(params?: FacultyFilterParams): Promise<{ faculty: FacultyMember[]; total: number }> {
    const query = new URLSearchParams();
    query.set('page', String(params?.page || 1));
    query.set('page_size', String(params?.page_size || 100));

    if (params?.department && params.department !== 'ALL') {
      query.set('department', params.department);
    }

    const response = await fetchJson<any>(`/faculty?${query.toString()}`);
    const rawItems: any[] = response?.items || response?.data || [];
    let faculty = rawItems.map(mapFacultySummaryToMember);

    // Client-side filtering
    if (params?.search) {
      const s = params.search.trim().toLowerCase();
      faculty = faculty.filter(
        (f) =>
          f.name.toLowerCase().includes(s) ||
          f.employee_no.toLowerCase().includes(s) ||
          f.department.toLowerCase().includes(s)
      );
    }

    if (params?.designation && params.designation !== 'ALL') {
      faculty = faculty.filter((f) => f.designation === params.designation);
    }

    // Client-side sorting
    if (params?.sortBy) {
      const order = params.sortOrder === 'asc' ? 1 : -1;
      const key = params.sortBy;
      faculty.sort((a, b) => {
        let valA: number = 0;
        let valB: number = 0;

        switch (key) {
          case 'final_score':
            valA = a.final_score ?? 0;
            valB = b.final_score ?? 0;
            break;
          case 'rank_institution':
            valA = a.institution_rank ?? 9999;
            valB = b.institution_rank ?? 9999;
            break;
          default:
            valA = a.final_score ?? 0;
            valB = b.final_score ?? 0;
        }
        return (valA - valB) * order;
      });
    }

    return {
      faculty,
      total: response?.total ?? faculty.length
    };
  },

  async getFacultyById(idOrEmpNo: string): Promise<FacultyMember | undefined> {
    const raw = await fetchJson<any>(`/faculty/${encodeURIComponent(idOrEmpNo)}`);
    return mapFacultyDetailToMember(raw);
  }
};

// ----------------------------------------------------------------------------
// Dashboard Overview Service
// Synthesizes institutional KPIs strictly from authoritative existing API endpoints
// ----------------------------------------------------------------------------

export const httpDashboardService = {
  async getOverview(): Promise<InstitutionOverview> {
    const [rankingsRes, departments] = await Promise.all([
      fetchJson<any>('/rankings'),
      httpDepartmentService.getDepartments()
    ]);

    const rankings: any[] = rankingsRes?.rankings || [];
    const totalFaculty = rankingsRes?.total_faculty ?? rankings.length;
    const evalDate = rankingsRes?.evaluation_date || '2024-12-31';

    const meanScore =
      rankings.length > 0
        ? Math.round(
            (rankings.reduce((sum, f) => sum + (f.final_score || 0), 0) / rankings.length) * 10
          ) / 10
        : null;

    const totalPubs = rankings.reduce((sum, f) => sum + (f.total_publications || 0), 0);
    const totalQ1 = rankings.reduce((sum, f) => sum + (f.q1_publications || 0), 0);
    const q1Pct = totalPubs > 0 ? Math.round((totalQ1 / totalPubs) * 100) : null;

    // Retrieve detailed records for top 5 researchers so cards have full metrics
    const topRanked = rankings.slice(0, 5);
    const topResearchers: FacultyMember[] = await Promise.all(
      topRanked.map(async (r) => {
        try {
          const detail = await httpFacultyService.getFacultyById(r.employee_no);
          return detail || mapRankedFacultyItemToMember(r);
        } catch {
          return mapRankedFacultyItemToMember(r);
        }
      })
    );

    return {
      institution_name: 'Indian Institute of Technology (Autonomous)',
      institution_code: 'IIT-AUTO',
      evaluation_date: evalDate,
      total_faculty: totalFaculty,
      mean_score: meanScore,
      total_publications: totalPubs,
      q1_publication_percentage: q1Pct,
      total_grant_funding_lakhs: null,
      active_patents: null,
      departments,
      top_researchers: topResearchers,
      annual_trends: []
    };
  }
};

// ----------------------------------------------------------------------------
// AI Assistant Service
// Adapts queries honestly to faculty-specific endpoints:
// POST /api/v1/ai/faculty/{employee_no}/insight
// POST /api/v1/ai/faculty/{employee_no}/explain-score
// ----------------------------------------------------------------------------

export const httpAssistantService = {
  async ask(query: AssistantQuery): Promise<AssistantResponse> {
    const q = query.question.trim();

    // 1. Detect target faculty employee number
    let targetEmpNo: string | null = query.contextFacultyId || null;
    if (!targetEmpNo) {
      const match = q.match(/\b(EMP\d{4})\b/i);
      if (match) {
        targetEmpNo = match[1].toUpperCase();
      }
    }

    // 2. If target faculty is specified, query authoritative AI endpoints
    if (targetEmpNo) {
      const isExplain = /\b(explain|why|breakdown|weight|weights|calculate|calculation|formula|rank)\b/i.test(q);

      if (isExplain) {
        try {
          const res = await fetchJson<any>(`/ai/faculty/${targetEmpNo}/explain-score`, {
            method: 'POST'
          });

          return {
            answer: `${res.score_band_summary}\n\n${res.workload_and_context_impact}\n\n${res.peer_comparison}`,
            keyFindings: [
              `Final Score: ${res.final_score?.toFixed(1)} (Dept Rank: #${res.department_rank}, Institution Rank: #${res.institution_rank})`,
              `Base Score: ${res.base_score?.toFixed(1)} | Combined Workload Adjustment: ${res.combined_adjustment?.toFixed(3)}x`,
              ...(res.strongest_pillars || []).map((p: string) => `Strength: ${p}`),
              ...(res.weakest_pillars || []).map((p: string) => `Growth Area: ${p}`)
            ],
            evidence: [
              `Publication Quality: ${res.publication_score?.toFixed(1)}/100`,
              `Citation Impact: ${res.citation_score?.toFixed(1)}/100`,
              `Patents: ${res.patent_score?.toFixed(1)}/100`,
              `Sponsored Funding: ${res.funding_score?.toFixed(1)}/100`,
              `PhD Supervision: ${res.phd_score?.toFixed(1)}/100`,
              `Workload Factor: ${res.workload_multiplier?.toFixed(3)}x | Career Factor: ${res.career_stage_multiplier?.toFixed(2)}x`
            ],
            relatedQuestions: [
              `What are recommendations for ${targetEmpNo}?`,
              `Show comprehensive research insights for ${targetEmpNo}`,
              `Explain score for top researcher EMP0008`
            ],
            supportingData: { employee_no: targetEmpNo },
            provider: 'gemini'
          };
        } catch (err: any) {
          const msg = err?.message || String(err);
          return {
            answer: `Score explanation for faculty ${targetEmpNo} could not be generated: ${msg.includes('503') ? 'Gemini AI service is not configured in backend (set GEMINI_API_KEY in backend/.env).' : msg}`,
            keyFindings: [
              `Target faculty: ${targetEmpNo}`,
              'Authoritative scores and ranks remain available directly in the Faculty Dossier.'
            ],
            supportingData: { employee_no: targetEmpNo },
            provider: 'database'
          };
        }
      } else {
        // Query /ai/faculty/{employee_no}/insight
        try {
          const res = await fetchJson<any>(`/ai/faculty/${targetEmpNo}/insight`, {
            method: 'POST'
          });

          return {
            answer: res.summary,
            keyFindings: [
              ...(res.strengths || []).map((s: string) => `Accomplishment: ${s}`),
              ...(res.areas_for_improvement || []).map((a: string) => `Growth Opportunity: ${a}`)
            ],
            evidence: (res.evidence || []).map(
              (e: any) => `${e.metric}: ${e.value} — ${e.interpretation}`
            ),
            relatedQuestions: res.recommendations || [
              `Explain score calculation for ${targetEmpNo}`,
              `How does ${targetEmpNo} compare to department peers?`
            ],
            supportingData: { employee_no: targetEmpNo },
            provider: 'gemini'
          };
        } catch (err: any) {
          const msg = err?.message || String(err);
          return {
            answer: `Research insight for faculty ${targetEmpNo} could not be generated: ${msg.includes('503') ? 'Gemini AI service is not configured in backend (set GEMINI_API_KEY in backend/.env).' : msg}`,
            keyFindings: [
              `Target faculty: ${targetEmpNo}`,
              'Deterministic scores, metrics, and evidence are available in the Faculty Dossier.'
            ],
            supportingData: { employee_no: targetEmpNo },
            provider: 'database'
          };
        }
      }
    }

    // 3. If no faculty member was identified in query, explain capabilities honestly
    return {
      answer: `The verified research intelligence AI engine operates strictly per-faculty to provide audit-verified, deterministic score explanations and productivity insights grounded in PostgreSQL data.\n\nPlease specify a faculty employee number (e.g., EMP0001 through EMP0024) or select a faculty member from the directory to analyze.`,
      keyFindings: [
        'Deterministic AI narrative endpoints: POST /api/v1/ai/faculty/{employee_no}/insight and explain-score',
        'Evaluated against point-in-time benchmark: 2024-12-31',
        'To analyze a researcher, try: "Explain score for EMP0001" or "What are recommendations for EMP0014?"'
      ],
      relatedQuestions: [
        'Explain score for EMP0001 (Dr. Arvind Ramanathan)',
        'Show insights and recommendations for EMP0014 (Dr. Sneha Patel)',
        'Explain score for EMP0008 (Dr. Ramesh Rao)',
        'Show insights for EMP0019 (Dr. Gayatri Mukherjee)'
      ],
      provider: 'database'
    };
  }
};
