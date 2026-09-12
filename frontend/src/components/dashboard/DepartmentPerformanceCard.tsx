import React from 'react';
import type { DepartmentInfo } from '../../services/types';
import { ArrowUpRight, Scale, BookOpen, Lightbulb, IndianRupee, Database, Building2 } from 'lucide-react';
import { useCardTilt } from '../../utils/useCardTilt';

interface DepartmentPerformanceCardProps {
  departments: DepartmentInfo[];
  loading?: boolean;
  onSelectDepartment: (code: string) => void;
}

interface SingleDeptCardProps {
  dept: DepartmentInfo;
  onSelectDepartment: (code: string) => void;
  getDeptColorClass: (code: string) => string;
  getBorderColor: (code: string) => string;
}

const SingleDeptCard: React.FC<SingleDeptCardProps> = ({
  dept,
  onSelectDepartment,
  getDeptColorClass,
  getBorderColor
}) => {
  const cardRef = useCardTilt<HTMLDivElement>({ maxTilt: 1.5, lift: -6, scale: 1.015 });
  const borderColor = getBorderColor(dept.code);

  return (
    <div
      ref={cardRef}
      className="glass-panel tilt-card glass-card-interactive"
      onClick={() => onSelectDepartment(dept.code)}
      style={{
        padding: 22,
        borderTop: `4px solid ${borderColor}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="specular-overlay" />
      <div className="card-content-elevated">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <span className={`dept-tag ${getDeptColorClass(dept.code)}`}>{dept.code}</span>
            <h3 style={{ fontSize: 15.5, marginTop: 8, color: 'var(--text-primary)', fontWeight: 700 }}>
              {dept.name}
            </h3>
          </div>
          <div
            style={{
              padding: 5,
              borderRadius: 8,
              background: 'rgba(248, 250, 252, 0.85)',
              color: '#64748b',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              transition: 'transform 0.2s ease, color 0.2s ease'
            }}
          >
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 29, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {dept.mean_score !== null ? dept.mean_score : '—'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {dept.mean_score !== null ? 'mean score / 100' : 'Score unavailable'}
          </span>
        </div>

        {/* Score Progress Bar with Luminous Fill */}
        {dept.mean_score !== null && (
          <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, dept.mean_score))}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${borderColor}, ${borderColor}dd)`,
                borderRadius: 4,
                boxShadow: `0 1px 6px ${borderColor}50`,
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        )}

        {/* Pillar Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11.5, color: '#475569', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248, 250, 252, 0.8)', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <BookOpen size={12} color="#64748b" />
            <span>{dept.total_pubs !== null && dept.total_pubs !== undefined ? `${dept.total_pubs} Pubs` : 'Pubs: —'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248, 250, 252, 0.8)', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <IndianRupee size={12} color="#64748b" />
            <span>{dept.total_funding_lakhs !== null && dept.total_funding_lakhs !== undefined ? `₹${dept.total_funding_lakhs}L` : 'Grants: —'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248, 250, 252, 0.8)', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Lightbulb size={12} color="#64748b" />
            <span>{dept.patents_count !== null && dept.patents_count !== undefined ? `${dept.patents_count} Patents` : 'Patents: —'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248, 250, 252, 0.8)', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Scale size={12} color="#64748b" />
            <span>{dept.faculty_count !== null && dept.faculty_count !== undefined ? `${dept.faculty_count} Faculty` : 'Faculty: —'}</span>
          </div>
        </div>

        {/* Top Researcher */}
        {dept.top_researcher && (
          <div style={{ borderTop: '1px solid rgba(241, 245, 249, 0.85)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: '#64748b' }}>Top: <strong style={{ color: '#0a192f' }}>{dept.top_researcher.name}</strong></span>
            <span style={{ fontWeight: 800, color: borderColor, fontFamily: 'var(--font-display)', fontSize: 12 }}>
              {dept.top_researcher.score ?? '—'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

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
    <div className="glass-panel" style={{ padding: 26, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
              <Building2 size={12} />
              <span>Discipline Benchmarking</span>
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Discipline-aware weights strictly sum to 100%
            </span>
          </div>
          <h2 style={{ fontSize: 21, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Department Performance
          </h2>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 12px', width: 9, height: 9 }} />
          <span>Fetching department performance data...</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="empty-state-panel">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#2563eb' }}>
            <Database size={22} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            Department Performance Records Unavailable
          </div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
            Connect the research intelligence API service (<code style={{ fontFamily: 'var(--font-mono)', background: '#fff', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>GET /api/v1/departments</code>) to load department performance metrics.
          </div>
        </div>
      ) : (
        <div className="grid-4">
          {departments.map(dept => (
            <SingleDeptCard
              key={dept.code}
              dept={dept}
              onSelectDepartment={onSelectDepartment}
              getDeptColorClass={getDeptColorClass}
              getBorderColor={getBorderColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};
