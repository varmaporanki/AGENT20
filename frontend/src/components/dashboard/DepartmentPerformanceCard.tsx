import React from 'react';
import type { DepartmentInfo } from '../../services/types';
import { ArrowUpRight, Scale, BookOpen, Lightbulb, IndianRupee, Database } from 'lucide-react';

interface DepartmentPerformanceCardProps {
  departments: DepartmentInfo[];
  loading?: boolean;
  onSelectDepartment: (code: string) => void;
}

export const DepartmentPerformanceCard: React.FC<DepartmentPerformanceCardProps> = ({
  departments,
  loading = false,
  onSelectDepartment
}) => {
  const getDeptColorClass = (code: string) => {
    switch (code.toUpperCase()) {
      case 'CSE': return 'dept-cse';
      case 'MECH': return 'dept-mech';
      case 'BIO': return 'dept-bio';
      case 'HSS': return 'dept-hss';
      default: return 'dept-cse';
    }
  };

  const getBorderColor = (code: string) => {
    switch (code.toUpperCase()) {
      case 'CSE': return '#2563eb';
      case 'MECH': return '#0d9488';
      case 'BIO': return '#16a34a';
      case 'HSS': return '#d97706';
      default: return '#2563eb';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              Discipline Benchmarking
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Discipline-aware weights strictly sum to 100%
            </span>
          </div>
          <h2 style={{ fontSize: 20, color: 'var(--text-primary)' }}>Department Performance</h2>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 12px', width: 8, height: 8 }} />
          <span>Fetching department performance data...</span>
        </div>
      ) : departments.length === 0 ? (
        <div
          style={{
            padding: 36,
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #cbd5e1'
          }}
        >
          <Database size={28} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            Department Performance Records Unavailable
          </div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
            Connect the research intelligence API service (<code style={{ fontFamily: 'var(--font-mono)' }}>GET /api/v1/departments</code>) to load department performance metrics.
          </div>
        </div>
      ) : (
        <div className="grid-4">
          {departments.map(dept => (
            <div
              key={dept.code}
              className="glass-panel glass-card-interactive"
              onClick={() => onSelectDepartment(dept.code)}
              style={{
                padding: 20,
                background: '#fff',
                borderTop: `4px solid ${getBorderColor(dept.code)}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span className={`dept-tag ${getDeptColorClass(dept.code)}`}>{dept.code}</span>
                  <h3 style={{ fontSize: 15, marginTop: 6, color: 'var(--text-primary)' }}>{dept.name}</h3>
                </div>
                <ArrowUpRight size={16} color="#64748b" />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {dept.mean_score !== null ? dept.mean_score : '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {dept.mean_score !== null ? 'mean score / 100' : 'Score unavailable'}
                </span>
              </div>

              {/* Score Progress Bar */}
              {dept.mean_score !== null && (
                <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, dept.mean_score))}%`,
                      height: '100%',
                      background: getBorderColor(dept.code),
                      borderRadius: 4
                    }}
                  />
                </div>
              )}

              {/* Pillar Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11.5, color: '#475569', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookOpen size={12} color="#64748b" />
                  <span>{dept.total_pubs !== null && dept.total_pubs !== undefined ? `${dept.total_pubs} Pubs` : 'Pubs: —'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IndianRupee size={12} color="#64748b" />
                  <span>{dept.total_funding_lakhs !== null && dept.total_funding_lakhs !== undefined ? `₹${dept.total_funding_lakhs}L` : 'Grants: —'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lightbulb size={12} color="#64748b" />
                  <span>{dept.patents_count !== null && dept.patents_count !== undefined ? `${dept.patents_count} Patents` : 'Patents: —'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Scale size={12} color="#64748b" />
                  <span>{dept.faculty_count !== null && dept.faculty_count !== undefined ? `${dept.faculty_count} Faculty` : 'Faculty: —'}</span>
                </div>
              </div>

              {/* Top Researcher */}
              {dept.top_researcher && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                  <span style={{ color: '#64748b' }}>Top: <strong style={{ color: '#0a192f' }}>{dept.top_researcher.name}</strong></span>
                  <span style={{ fontWeight: 700, color: getBorderColor(dept.code) }}>{dept.top_researcher.score ?? '—'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
