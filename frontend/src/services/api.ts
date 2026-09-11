// ============================================================================
// AGENT 20 — UNIFIED API EXPORT
// Single authoritative frontend service layer connecting directly to HTTP backend.
// Zero fabricated/mock data providers.
// ============================================================================

import {
  httpDashboardService,
  httpDepartmentService,
  httpFacultyService,
  httpAssistantService
} from './httpService';

export const dashboardService = httpDashboardService;
export const departmentService = httpDepartmentService;
export const facultyService = httpFacultyService;
export const assistantService = httpAssistantService;

export * from './types';
