import React, { useEffect, useState } from 'react';
import { departmentService, facultyService } from '../services/api';
import type { DepartmentInfo, FacultyMember, DepartmentCode } from '../services/types';
import { Building2, Scale } from 'lucide-react';

interface DepartmentsProps {
  onSelectFaculty: (empNo: string) => void;
}

export const Departments: React.FC<DepartmentsProps> = ({ onSelectFaculty }) => {
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentCode>('HSS');
  const [deptFaculty, setDeptFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const depts = await departmentService.getDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadFaculty() {
      const res = await facultyService.getFaculty({ department: selectedDept });
      setDeptFaculty(res.faculty);
    }
    loadFaculty();
  }, [selectedDept]);

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
        <span>Loading Department Benchmarking Matrix...</span>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: 48, maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2563eb' }}>
            <Building2 size={22} />
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>Department Benchmarking Unavailable</h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
            Connect the research intelligence API to load department benchmarking matrices, discipline weights, and faculty rosters from the PostgreSQL scoring database.
          </p>
        </div>
      </div>
    );
  }

  const activeDeptInfo = departments.find(d => d.code === selectedDept) || departments[0];

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, background: '#eff6ff', borderColor: '#bfdbfe' }} className="badge-pill">
          <Building2 size={12} color="#2563eb" />
          <span style={{ color: '#2563eb', fontWeight: 700 }}>INSTITUTIONAL BENCHMARKING</span>
        </div>
        <h1 style={{ fontSize: 27, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Department Analytics & Discipline Equity
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 820, lineHeight: 1.6 }}>
          Rigorous discipline-aware benchmarking across Computer Science, Mechanical Engineering, Biotechnology, and Humanities & Social Sciences. The engine dynamically reallocates weights for non-applicable pillars (e.g. patents in HSS) to guarantee an auditable 100% composite scale for every department.
        </p>
      </div>

      {/* Department Selector Tabs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {departments.map(d => {
          const isSelected = selectedDept === d.code;
          const color = getBorderColor(d.code);
          return (
            <button
              key={d.code}
              onClick={() => setSelectedDept(d.code)}
              className="glass-panel"
              style={{
                padding: '16px 22px',
                flex: 1,
                minWidth: 200,
                background: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                borderColor: isSelected ? color : 'var(--border-light)',
                boxShadow: isSelected ? `0 8px 24px ${color}20` : 'var(--shadow-sm)',
                borderTop: isSelected ? `4px solid ${color}` : '1px solid var(--border-light)',
                textAlign: 'left',
                transition: 'all 0.2s var(--ease-spring)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className={`dept-tag dept-${(d.code || '').toLowerCase()}`}>{d.code}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#0a192f', fontFamily: 'var(--font-display)' }}>
                  {d.mean_score != null ? d.mean_score.toFixed(1) : '—'}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{d.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Top: {d.top_researcher ? `${d.top_researcher.name} (${d.top_researcher.score ?? '—'})` : '—'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Department Deep-Dive & Discipline Weight Callout */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Left: Department Profile & Metrics */}
        <div className="glass-panel" style={{ padding: 26, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className={`dept-tag dept-${(activeDeptInfo.code || '').toLowerCase()}`}>{activeDeptInfo.code}</span>
            <h2 style={{ fontSize: 19, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{activeDeptInfo.name}</h2>
          </div>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
            {activeDeptInfo.description || 'Department evaluation profile grounded in PostgreSQL research schema.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Publication Volume</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0a192f', marginTop: 2 }}>
                {activeDeptInfo.total_pubs != null ? `${activeDeptInfo.total_pubs} papers` : '—'}
              </div>
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>
                {activeDeptInfo.q1_percentage != null ? `${activeDeptInfo.q1_percentage}% in Q1 journals` : 'Q1 share pending'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Grant Mobilization</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed', marginTop: 2 }}>
                {activeDeptInfo.total_funding_lakhs != null ? `₹${activeDeptInfo.total_funding_lakhs}L` : '—'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>National funding bodies</div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cumulative Citations</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0a192f', marginTop: 2 }}>
                {activeDeptInfo.total_cits != null ? activeDeptInfo.total_cits.toLocaleString() : '—'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Point-in-time snapshot</div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patents / IP Disclosures</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706', marginTop: 2 }}>
                {activeDeptInfo.patents_count != null ? activeDeptInfo.patents_count : '—'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{activeDeptInfo.code === 'HSS' ? 'Not structurally applicable' : 'Active IP portfolio'}</div>
            </div>
          </div>
        </div>

        {/* Right: Discipline-Aware Weights & Equity Guarantee */}
        <div
          className="glass-panel"
          style={{
            padding: 26,
            background: activeDeptInfo.code === 'HSS' ? 'linear-gradient(135deg, #fffbeb 0%, #fff 100%)' : '#fff',
            borderColor: activeDeptInfo.code === 'HSS' ? '#fde68a' : 'var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Scale size={16} color={activeDeptInfo.code === 'HSS' ? '#b45309' : '#2563eb'} />
            <h3 style={{ fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {activeDeptInfo.code === 'HSS' ? 'Discipline Equity in Action (HSS Reweighting)' : 'Applied Pillar Weights Matrix'}
            </h3>
          </div>

          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.62, marginBottom: 18 }}>
            {activeDeptInfo.code === 'HSS'
              ? 'Humanities & Social Sciences do not produce industrial patents. Instead of imposing an automatic 15% handicap, the engine reallocates this weight to Publications (+10%) and Citations (+5%), ensuring HSS faculty compete on a full 100% composite scale.'
              : 'Standard Science & Engineering weight distribution reflecting balanced laboratory research, patent disclosures, competitive grant mobilization, and doctoral supervision.'}
          </p>

          {activeDeptInfo.weights ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Publication Quality</span>
                  <strong>{activeDeptInfo.weights.publication * 100}%</strong>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${activeDeptInfo.weights.publication * 100}%`, height: '100%', background: '#2563eb', borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Citation Impact</span>
                  <strong>{activeDeptInfo.weights.citation * 100}%</strong>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${activeDeptInfo.weights.citation * 100}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Patents & IP</span>
                  <strong>{activeDeptInfo.weights.patents * 100}%</strong>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${activeDeptInfo.weights.patents * 100}%`, height: '100%', background: '#0ea5e9', borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Sponsored Funding</span>
                  <strong>{activeDeptInfo.weights.funding * 100}%</strong>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${activeDeptInfo.weights.funding * 100}%`, height: '100%', background: '#7c3aed', borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>PhD Guidance</span>
                  <strong>{activeDeptInfo.weights.phd * 100}%</strong>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${activeDeptInfo.weights.phd * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
                </div>
              </div>

              <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>Total Verified Weight Sum:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>
                  {(activeDeptInfo.weights.weight_sum * 100).toFixed(0)}% (1.000)
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#64748b' }}>Weight matrix configuration pending API response.</div>
          )}
        </div>
      </div>

      {/* Department Faculty Table */}
      <div className="glass-panel" style={{ padding: 26, background: '#fff' }}>
        <h3 style={{ fontSize: 18, marginBottom: 18, letterSpacing: '-0.01em' }}>
          Faculty Roster for {activeDeptInfo.name} ({deptFaculty.length} Members)
        </h3>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dept Rank</th>
                <th>Inst Rank</th>
                <th>Faculty Name</th>
                <th>Designation</th>
                <th>Pubs (Q1/Q2)</th>
                <th>Citations</th>
                <th>Grants</th>
                <th style={{ textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {deptFaculty.length > 0 ? (
                deptFaculty.map(fac => (
                  <tr
                    key={fac.employee_no}
                    onClick={() => onSelectFaculty(fac.employee_no)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td><strong>{fac.rank_within_department != null ? `#${fac.rank_within_department}` : '—'}</strong></td>
                    <td>{fac.rank_institution != null ? `#${fac.rank_institution}` : '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0a192f' }}>{fac.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>{fac.employee_no}</div>
                    </td>
                    <td>{fac.designation ? fac.designation.replace('_', ' ') : '—'}</td>
                    <td>
                      {fac.raw_metrics?.total_pubs != null
                        ? `${fac.raw_metrics.total_pubs} (${(fac.raw_metrics.q1_pubs ?? 0) + (fac.raw_metrics.q2_pubs ?? 0)} Q1/Q2)`
                        : '—'}
                    </td>
                    <td>{fac.raw_metrics?.cits_latest != null ? fac.raw_metrics.cits_latest.toLocaleString() : '—'}</td>
                    <td>{fac.raw_metrics?.total_sanctioned_lakhs != null ? `₹${fac.raw_metrics.total_sanctioned_lakhs}L` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="score-badge score-mid">
                        {fac.final_score != null ? fac.final_score.toFixed(1) : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                    No faculty records found for this department. Connect the API to load records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
