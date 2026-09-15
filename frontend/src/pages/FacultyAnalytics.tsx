import React, { useEffect, useState } from 'react';
import { facultyService, departmentService } from '../services/api';
import type { FacultyMember, DepartmentInfo, DepartmentCode } from '../services/types';
import { FacultyTable } from '../components/faculty/FacultyTable';
import { Users, WifiOff } from 'lucide-react';
import { API_BASE } from '../services/httpService';

interface FacultyAnalyticsProps {
  onSelectFaculty: (empNo: string) => void;
  initialDept?: DepartmentCode | 'ALL';
}

export const FacultyAnalytics: React.FC<FacultyAnalyticsProps> = ({
  onSelectFaculty,
  initialDept = 'ALL'
}) => {
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [facRes, deptRes] = await Promise.all([
          facultyService.getFaculty(),
          departmentService.getDepartments()
        ]);
        setFacultyList(facRes?.faculty || []);
        setDepartments(deptRes || []);
        setApiError(false);
      } catch (err) {
        console.warn('Failed to load faculty analytics from backend API:', err);
        setApiError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getBorderColor = (code: string) => {
    switch (code.toUpperCase()) {
      case 'CSE': return '#2563eb';
      case 'MECH': return '#0d9488';
      case 'BIO': return '#16a34a';
      case 'HSS': return '#d97706';
      default: return '#2563eb';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
        <div className="pulse-dot" style={{ margin: '0 auto 16px', width: 10, height: 10 }} />
        <span>Loading Faculty Analytics & Leaderboard...</span>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* API Unconnected Notice Banner */}
      {apiError && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            color: '#92400e',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <WifiOff size={16} color="#d97706" />
          <div>
            <strong>Research data service unavailable.</strong> Showing empty state. Connect API at <code>{API_BASE}</code> to load live faculty records.
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, background: '#eff6ff', borderColor: '#bfdbfe' }} className="badge-pill">
          <Users size={12} color="#2563eb" />
          <span style={{ color: '#2563eb', fontWeight: 700 }}>INSTITUTIONAL DIRECTORY</span>
        </div>
        <h1 style={{ fontSize: 27, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Faculty Productivity & Benchmarking
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 800, lineHeight: 1.6 }}>
          Multi-attribute performance tracking across departments. Filter by department, designation, or rank to evaluate research velocity and journal quality metrics directly from verified PostgreSQL scoring.
        </p>
      </div>

      {/* Visual Summary Cards by Department */}
      {departments.length > 0 && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {departments.map((dept) => {
            const deptFaculty = facultyList.filter(f => f.department === dept.code);
            const topInDept = deptFaculty[0];
            const facultyCount = dept.faculty_count ?? deptFaculty.length;

            return (
              <div
                key={dept.code}
                className="glass-panel"
                style={{
                  padding: 18,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderTop: `3px solid ${getBorderColor(dept.code)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`dept-tag dept-${dept.code.toLowerCase()}`}>{dept.code}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {facultyCount > 0 ? `${facultyCount} Active Faculty` : 'Faculty pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0a192f', fontFamily: 'var(--font-display)' }}>
                    {dept.mean_score != null ? dept.mean_score.toFixed(1) : '—'}
                  </span>
                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                    Top: {dept.top_score != null ? dept.top_score.toFixed(1) : '—'}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                  Leader: <strong style={{ color: '#0a192f' }}>{topInDept ? topInDept.name : (dept.top_researcher?.name || '—')}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Interactive Faculty Table */}
      <FacultyTable
        facultyList={facultyList}
        onSelectFaculty={onSelectFaculty}
        initialDept={initialDept}
      />
    </div>
  );
};
