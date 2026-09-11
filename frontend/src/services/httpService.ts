// ============================================================================
// AGENT 20 — HTTP AUTHORITATIVE SERVICE LAYER
// Connects to Teammate-1 Backend API
// Base URL configured via import.meta.env.VITE_API_BASE_URL
//
// Planned routes:
// GET  /institution/overview
// GET  /departments
// GET  /departments/:code
// GET  /faculty?search=&dept=&designation=&sort_by=&order=
// GET  /faculty/:id
// POST /assistant/query
// ============================================================================

import type {
  FacultyMember,
  DepartmentInfo,
  InstitutionOverview,
  AssistantQuery,
  AssistantResponse,
  FacultyFilterParams,
  DepartmentCode
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
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

export const httpDashboardService = {
  async getOverview(): Promise<InstitutionOverview> {
    return fetchJson<InstitutionOverview>('/institution/overview');
  }
};

export const httpDepartmentService = {
  async getDepartments(): Promise<DepartmentInfo[]> {
    return fetchJson<DepartmentInfo[]>('/departments');
  },

  async getDepartmentByCode(code: DepartmentCode): Promise<DepartmentInfo | undefined> {
    return fetchJson<DepartmentInfo>(`/departments/${code}`);
  }
};

export const httpFacultyService = {
  async getFaculty(params?: FacultyFilterParams): Promise<{ faculty: FacultyMember[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.department && params.department !== 'ALL') query.set('dept', params.department);
    if (params?.designation && params.designation !== 'ALL') query.set('designation', params.designation);
    if (params?.sortBy) query.set('sort_by', params.sortBy);
    if (params?.sortOrder) query.set('order', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ faculty: FacultyMember[]; total: number }>(`/faculty${queryString}`);
  },

  async getFacultyById(idOrEmpNo: string): Promise<FacultyMember | undefined> {
    return fetchJson<FacultyMember>(`/faculty/${idOrEmpNo}`);
  }
};

export const httpAssistantService = {
  async ask(query: AssistantQuery): Promise<AssistantResponse> {
    return fetchJson<AssistantResponse>('/assistant/query', {
      method: 'POST',
      body: JSON.stringify(query)
    });
  }
};

