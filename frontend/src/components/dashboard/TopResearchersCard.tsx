import React from 'react';
import type { FacultyMember } from '../../services/types';
import { Award, ArrowRight, BookOpen, Quote, Lightbulb, Users } from 'lucide-react';

interface TopResearchersCardProps {
  topResearchers: FacultyMember[];
  loading?: boolean;
  onSelectFaculty: (empNo: string) => void;
  onViewAllFaculty: () => void;
}

export const TopResearchersCard: React.FC<TopResearchersCardProps> = ({
  topResearchers,
  loading = false,
  onSelectFaculty,
  onViewAllFaculty
}) => {
  const getRankBadgeClass = (rank: number | null) => {
    if (rank === 1) return 'rank-top1';
    if (rank === 2) return 'rank-top2';
    if (rank === 3) return 'rank-top3';
    return 'rank-other';
  };

  const getDeptColorClass = (code: string) => {
    switch (code.toUpperCase()) {
      case 'CSE': return 'dept-cse';
      case 'MECH': return 'dept-mech';
      case 'BIO': return 'dept-bio';
      case 'HSS': return 'dept-hss';
      default: return 'dept-cse';
    }
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score === null) return 'score-low';
    if (score >= 75) return 'score-high';
    if (score >= 45) return 'score-mid';
    return 'score-low';
  };

  return (
    <div className="glass-panel" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge-pill" style={{ background: '#ecfdf5', color: '#047857' }}>
              <Award size={12} />
              Institutional Leaderboard
            </span>
          </div>
          <h2 style={{ fontSize: 20, color: 'var(--text-primary)' }}>Top Research Faculty</h2>
        </div>
        {topResearchers.length > 0 && (
          <button
            onClick={onViewAllFaculty}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-blue)'
            }}
          >
            <span>View All Faculty</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 12px', width: 8, height: 8 }} />
          <span>Loading faculty rankings...</span>
        </div>
      ) : topResearchers.length === 0 ? (
        <div
          style={{
            padding: 36,
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #cbd5e1'
          }}
        >
          <Users size={28} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            Faculty Records Unavailable
          </div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
            Connect the research intelligence API (<code style={{ fontFamily: 'var(--font-mono)' }}>GET /api/v1/faculty</code>) to load faculty evaluation rankings.
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Rank</th>
                <th>Faculty Member</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Profile Summary</th>
                <th>Score Breakdown</th>
                <th style={{ textAlign: 'right' }}>Final Score</th>
              </tr>
            </thead>
            <tbody>
              {topResearchers.map((fac) => (
                <tr
                  key={fac.employee_no || fac.faculty_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectFaculty(fac.employee_no)}
                >
                  <td>
                    <span className={`rank-badge ${getRankBadgeClass(fac.rank_institution)}`}>
                      {fac.rank_institution ? `#${fac.rank_institution}` : '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fac.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>{fac.employee_no}</div>
                  </td>
                  <td>
                    <span className={`dept-tag ${getDeptColorClass(fac.department)}`}>
                      {fac.department}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      {fac.designation ? fac.designation.replace('_', ' ') : '—'}
                    </span>
                    {fac.experience_years !== null && fac.experience_years !== undefined && (
                      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                        {fac.experience_years} yrs exp
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: '#334155', maxWidth: 320 }}>
                      {fac.evidence && fac.evidence.length > 0 ? fac.evidence[0] : 'Research record active.'}
                    </div>
                    {fac.raw_metrics && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <BookOpen size={11} /> {fac.raw_metrics.total_pubs} pubs
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Quote size={11} /> {fac.raw_metrics.cits_latest} cits
                        </span>
                        {fac.raw_metrics.patent_count > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Lightbulb size={11} /> {fac.raw_metrics.patent_count} patents
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {fac.components ? (
                      <div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span title={`Pubs: ${fac.components.publication_quality ?? '—'}`} style={{ height: 16, width: 8, background: '#2563eb', borderRadius: 2, display: 'inline-block', opacity: (fac.components.publication_quality ?? 0) / 100 }} />
                          <span title={`Citations: ${fac.components.citation_impact ?? '—'}`} style={{ height: 16, width: 8, background: '#10b981', borderRadius: 2, display: 'inline-block', opacity: (fac.components.citation_impact ?? 0) / 100 }} />
                          <span title={`Patents: ${fac.components.patents ?? '—'}`} style={{ height: 16, width: 8, background: '#0ea5e9', borderRadius: 2, display: 'inline-block', opacity: (fac.components.patents ?? 0) / 100 }} />
                          <span title={`Funding: ${fac.components.funding ?? '—'}`} style={{ height: 16, width: 8, background: '#7c3aed', borderRadius: 2, display: 'inline-block', opacity: (fac.components.funding ?? 0) / 100 }} />
                          <span title={`PhD: ${fac.components.phd_supervision ?? '—'}`} style={{ height: 16, width: 8, background: '#f59e0b', borderRadius: 2, display: 'inline-block', opacity: (fac.components.phd_supervision ?? 0) / 100 }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Pillars 1–5</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`score-badge ${getScoreBadgeClass(fac.final_score)}`}>
                      {fac.final_score !== null ? fac.final_score : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
