import React, { useState, useMemo } from 'react';
import type { FacultyMember, DepartmentCode, Designation } from '../../services/types';
import { Search, Filter, ArrowUpDown, ChevronRight } from 'lucide-react';

interface FacultyTableProps {
  facultyList: FacultyMember[];
  onSelectFaculty: (empNo: string) => void;
  initialDept?: DepartmentCode | 'ALL';
}

export const FacultyTable: React.FC<FacultyTableProps> = ({
  facultyList,
  onSelectFaculty,
  initialDept = 'ALL'
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<DepartmentCode | 'ALL'>(initialDept);
  const [designationFilter, setDesignationFilter] = useState<Designation | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'final_score' | 'total_pubs' | 'cits_latest' | 'total_sanctioned_lakhs' | 'patent_count' | 'rank_institution'>('final_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredData = useMemo(() => {
    let result = [...facultyList];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.employee_no.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.designation.toLowerCase().includes(q)
      );
    }

    if (deptFilter !== 'ALL') {
      result = result.filter(f => f.department === deptFilter);
    }

    if (designationFilter !== 'ALL') {
      result = result.filter(f => f.designation === designationFilter);
    }

    result.sort((a, b) => {
      let valA: number;
      let valB: number;
      const defaultLow = sortOrder === 'desc' ? -Infinity : Infinity;

      switch (sortBy) {
        case 'final_score':
          valA = a.final_score ?? defaultLow;
          valB = b.final_score ?? defaultLow;
          break;
        case 'total_pubs':
          valA = a.raw_metrics?.total_pubs ?? defaultLow;
          valB = b.raw_metrics?.total_pubs ?? defaultLow;
          break;
        case 'cits_latest':
          valA = a.raw_metrics?.cits_latest ?? defaultLow;
          valB = b.raw_metrics?.cits_latest ?? defaultLow;
          break;
        case 'total_sanctioned_lakhs':
          valA = a.raw_metrics?.total_sanctioned_lakhs ?? defaultLow;
          valB = b.raw_metrics?.total_sanctioned_lakhs ?? defaultLow;
          break;
        case 'patent_count':
          valA = a.raw_metrics?.patent_count ?? defaultLow;
          valB = b.raw_metrics?.patent_count ?? defaultLow;
          break;
        case 'rank_institution':
          valA = a.rank_institution ?? Infinity;
          valB = b.rank_institution ?? Infinity;
          return (valA - valB) * (sortOrder === 'desc' ? -1 : 1);
        default:
          valA = a.final_score ?? defaultLow;
          valB = b.final_score ?? defaultLow;
      }
      return (valA - valB) * (sortOrder === 'desc' ? -1 : 1);
    });

    return result;
  }, [facultyList, search, deptFilter, designationFilter, sortBy, sortOrder]);

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getRankBadgeClass = (rank: number | null) => {
    if (rank === 1) return 'rank-top1';
    if (rank === 2) return 'rank-top2';
    if (rank === 3) return 'rank-top3';
    return 'rank-other';
  };

  const getDeptColorClass = (code: string) => {
    switch (code) {
      case 'CSE': return 'dept-cse';
      case 'MECH': return 'dept-mech';
      case 'BIO': return 'dept-bio';
      case 'HSS': return 'dept-hss';
      default: return 'dept-cse';
    }
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score == null) return 'score-low';
    if (score >= 75) return 'score-high';
    if (score >= 45) return 'score-mid';
    return 'score-low';
  };

  if (facultyList.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2563eb' }}>
            <Filter size={22} />
          </div>
          <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
            Faculty Data Unavailable
          </h3>
          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>
            Connect the research intelligence API to load faculty records and performance rankings from the PostgreSQL scoring engine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: 24 }}>
      {/* Controls: Search, Filters, Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Search Box */}
          <div className="chat-input-box" style={{ width: 340 }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              className="chat-input"
              placeholder="Search faculty name, EMP ID, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ fontSize: 11, color: '#94a3b8' }}>Clear</button>
            )}
          </div>

          {/* Department Filter Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
            {(['ALL', 'CSE', 'MECH', 'BIO', 'HSS'] as const).map((dept) => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: deptFilter === dept ? 700 : 500,
                  background: deptFilter === dept ? '#fff' : 'transparent',
                  color: deptFilter === dept ? '#2563eb' : '#64748b',
                  boxShadow: deptFilter === dept ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Designation Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="#64748b" />
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value as Designation | 'ALL')}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#fff',
                fontSize: 12.5,
                color: '#334155',
                outline: 'none'
              }}
            >
              <option value="ALL">All Designations</option>
              <option value="PROFESSOR">Professor</option>
              <option value="ASSOCIATE_PROFESSOR">Associate Professor</option>
              <option value="ASSISTANT_PROFESSOR">Assistant Professor</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
          <span>Showing <strong>{filteredData.length}</strong> of {facultyList.length} faculty profiles</span>
          <span>Click any row to open the complete academic dossier & explainability breakdown</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('rank_institution')} style={{ cursor: 'pointer', width: 70 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Rank</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th>Faculty Member</th>
              <th>Dept</th>
              <th>Designation & Exp</th>
              <th onClick={() => toggleSort('total_pubs')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Pubs (Q1/Q2)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th onClick={() => toggleSort('cits_latest')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Citations (H-Idx)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th onClick={() => toggleSort('total_sanctioned_lakhs')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Grants (₹ Lakhs)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th onClick={() => toggleSort('patent_count')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Patents</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th>Workload / Context</th>
              <th onClick={() => toggleSort('final_score')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <span>Final Score</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((fac) => (
                <tr
                  key={fac.employee_no}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectFaculty(fac.employee_no)}
                >
                  <td>
                    <span className={`rank-badge ${getRankBadgeClass(fac.rank_institution)}`}>
                      {fac.rank_institution != null ? `#${fac.rank_institution}` : '—'}
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
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                      Dept {fac.rank_within_department != null ? `#${fac.rank_within_department}` : '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, color: '#334155' }}>
                      {fac.designation === 'ASSISTANT_PROFESSOR' ? 'Assistant Prof' :
                       fac.designation === 'ASSOCIATE_PROFESSOR' ? 'Associate Prof' : 'Professor'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {fac.experience_years != null ? `${fac.experience_years} yrs service` : 'Service pending'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {fac.raw_metrics?.total_pubs != null ? `${fac.raw_metrics.total_pubs} papers` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: ((fac.raw_metrics?.q1_pubs ?? 0) + (fac.raw_metrics?.q2_pubs ?? 0)) > 0 ? '#059669' : '#dc2626' }}>
                      {fac.raw_metrics ? `${fac.raw_metrics.q1_pubs + fac.raw_metrics.q2_pubs} in Q1/Q2` : '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {fac.raw_metrics?.cits_latest != null ? fac.raw_metrics.cits_latest.toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      H-Index: {fac.raw_metrics?.h_index ?? '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#7c3aed' }}>
                      {fac.raw_metrics?.total_sanctioned_lakhs != null ? `₹${fac.raw_metrics.total_sanctioned_lakhs}L` : '—'}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                      {fac.raw_metrics?.pi_project_count != null ? (fac.raw_metrics.pi_project_count > 0 ? `${fac.raw_metrics.pi_project_count} PI project` : '0 PI grants') : '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {fac.raw_metrics?.patent_count != null ? fac.raw_metrics.patent_count : '—'}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>
                      {fac.raw_metrics?.granted_patents != null ? `${fac.raw_metrics.granted_patents} granted` : '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>
                      {fac.workload_context?.teaching_hours != null ? `${fac.workload_context.teaching_hours}h/wk teaching` : '—'}
                    </div>
                    {fac.workload_context && fac.workload_context.workload_variance_pct > 20 && (
                      <span style={{ fontSize: 10, background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: 4 }}>
                        +{fac.workload_context.workload_variance_pct}% load
                      </span>
                    )}
                    {fac.workload_context && fac.workload_context.career_stage_multiplier > 1.0 && (
                      <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>
                        {fac.workload_context.career_stage_multiplier}x startup
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`score-badge ${getScoreBadgeClass(fac.final_score)}`}>
                      {fac.final_score != null ? fac.final_score.toFixed(1) : '—'}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', textAlign: 'center' }}>
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                  No faculty records match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

