import React, { useEffect, useState } from 'react';
import { facultyService, departmentService } from '../services/api';
import type { FacultyMember, DepartmentInfo } from '../services/types';
import { RadarPillars } from '../components/analytics/RadarPillars';
import {
  ArrowLeft,
  BookOpen,
  Lightbulb,
  IndianRupee,
  Sparkles,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FacultyDetailProps {
  employeeNo: string;
  onBack: () => void;
  onAskAboutFaculty: (empNo: string, name: string) => void;
}

export const FacultyDetail: React.FC<FacultyDetailProps> = ({
  employeeNo,
  onBack,
  onAskAboutFaculty
}) => {
  const [faculty, setFaculty] = useState<FacultyMember | null>(null);
  const [deptInfo, setDeptInfo] = useState<DepartmentInfo | null>(null);
  const [showFullEvidence, setShowFullEvidence] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const fac = await facultyService.getFacultyById(employeeNo);
        if (fac) {
          setFaculty(fac);
          const dept = await departmentService.getDepartmentByCode(fac.department);
          if (dept) setDeptInfo(dept);
        }
      } catch (err) {
        console.error('Failed to load faculty dossier:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeNo]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
        <div className="pulse-dot" style={{ margin: '0 auto 16px', width: 10, height: 10 }} />
        <span>Loading Academic Dossier for {employeeNo}...</span>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: 48, maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>Faculty Dossier Unavailable</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            No verified record found for employee #{employeeNo}. Please connect to the research intelligence API to query authoritative faculty profiles from the PostgreSQL scoring database.
          </p>
          <button onClick={onBack} className="chip-btn" style={{ padding: '8px 20px', color: '#2563eb', borderColor: '#2563eb', fontWeight: 600 }}>
            ← Back to Faculty Directory
          </button>
        </div>
      </div>
    );
  }

  const getQuartileBadge = (quartile: string) => {
    switch (quartile) {
      case 'Q1': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'Q2': return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'Q3': return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'Q4': return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      case 'Flagged': return { bg: '#450a0a', color: '#fca5a5', border: '#7f1d1d' };
      default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ paddingBottom: 64 }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-blue)',
          marginBottom: 16
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Faculty Directory</span>
      </button>

      {/* Faculty Dossier Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: 32,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 247, 255, 0.9) 100%)',
          border: '1px solid rgba(191, 219, 254, 0.8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 24
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className={`dept-tag dept-${(faculty.department || '').toLowerCase()}`}>
              {faculty.department}
            </span>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              {faculty.employee_no}
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>•</span>
            <span style={{ fontSize: 12, color: '#475569' }}>
              {faculty.department_name}
            </span>
          </div>

          <h1 style={{ fontSize: 30, color: 'var(--text-primary)', marginBottom: 6 }}>
            {faculty.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#475569', flexWrap: 'wrap' }}>
            <span>
              <strong>Designation:</strong> {faculty.designation ? faculty.designation.replace('_', ' ') : '—'}
            </span>
            <span>
              <strong>Active Service:</strong> {faculty.experience_years != null ? `${faculty.experience_years} years` : '—'}
            </span>
            <span>
              <strong>Teaching Load:</strong> {faculty.workload_context?.teaching_hours != null ? `${faculty.workload_context.teaching_hours} hrs/wk` : '—'}
            </span>
          </div>
        </div>

        {/* Hero Score Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Final Continuous Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {faculty.final_score != null ? faculty.final_score.toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>/ 100</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <span className="badge-pill" style={{ fontSize: 11 }}>
                Inst Rank: {faculty.rank_institution != null ? `#${faculty.rank_institution}` : '—'}
              </span>
              <span className="badge-pill" style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8' }}>
                Dept Rank: {faculty.rank_within_department != null ? `#${faculty.rank_within_department}` : '—'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onAskAboutFaculty(faculty.employee_no, faculty.name)}
            className="badge-pill"
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}
            title="Ask AI Assistant about this faculty profile"
          >
            <Sparkles size={16} color="#60a5fa" />
            <span style={{ fontSize: 11, fontWeight: 700 }}>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Grid: 5-Pillar Radar vs Context & Workload Adjustments */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* 1. Radar Chart of the 5 Research Pillars */}
        <div className="glass-panel" style={{ padding: 24, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                Multi-Pillar Decomposition
              </span>
              <h3 style={{ fontSize: 17, marginTop: 4 }}>Pillar Competency Radar</h3>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Normalized 0–100 Scale</span>
          </div>

          <RadarPillars
            components={faculty.components}
            deptAverages={deptInfo?.benchmark_pillars || null}
          />

        </div>

        {/* 2. Mathematical Adjustments & Applied Weights Card */}
        <div className="glass-panel" style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="badge-pill" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
              Equity & Normalization Matrix
            </span>
            <h3 style={{ fontSize: 17, marginTop: 4, marginBottom: 16 }}>Scoring Formula Breakdown</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 18 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Discipline Base Score</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0a192f' }}>
                  {faculty.base_score != null ? faculty.base_score.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Sum(w_k * S_k)</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Combined Factor (C_adj)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>
                  {faculty.workload_context?.combined_adjustment != null
                    ? `${faculty.workload_context.combined_adjustment.toFixed(3)}x`
                    : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>min(1.30, Stage * Load)</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Career Stage Multiplier</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                  {faculty.workload_context?.career_stage_multiplier != null
                    ? `${faculty.workload_context.career_stage_multiplier}x`
                    : '—'}
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>
                  {faculty.workload_context && faculty.workload_context.career_stage_multiplier > 1.0
                    ? 'Early-career startup lag'
                    : 'Standard tenure baseline'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Workload Multiplier</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>
                  {faculty.workload_context?.workload_multiplier != null
                    ? `${faculty.workload_context.workload_multiplier.toFixed(3)}x`
                    : '—'}
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>
                  {faculty.workload_context ? `+${faculty.workload_context.workload_variance_pct}% load variance` : '—'}
                </div>
              </div>
            </div>

            {/* Applied Weights Bar */}
            {faculty.applied_weights ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Department Applied Weights (Sum = {faculty.applied_weights.weight_sum.toFixed(2)}):
                </div>
                <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                  <div title={`Pub: ${faculty.applied_weights.publication * 100}%`} style={{ width: `${faculty.applied_weights.publication * 100}%`, background: '#2563eb' }} />
                  <div title={`Cit: ${faculty.applied_weights.citation * 100}%`} style={{ width: `${faculty.applied_weights.citation * 100}%`, background: '#10b981' }} />
                  <div title={`Pat: ${faculty.applied_weights.patents * 100}%`} style={{ width: `${faculty.applied_weights.patents * 100}%`, background: '#0ea5e9' }} />
                  <div title={`Fund: ${faculty.applied_weights.funding * 100}%`} style={{ width: `${faculty.applied_weights.funding * 100}%`, background: '#7c3aed' }} />
                  <div title={`PhD: ${faculty.applied_weights.phd * 100}%`} style={{ width: `${faculty.applied_weights.phd * 100}%`, background: '#f59e0b' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#64748b' }}>
                  <span>Pub: {faculty.applied_weights.publication * 100}%</span>
                  <span>Cit: {faculty.applied_weights.citation * 100}%</span>
                  <span>Pat: {faculty.applied_weights.patents * 100}%</span>
                  <span>Fund: {faculty.applied_weights.funding * 100}%</span>
                  <span>PhD: {faculty.applied_weights.phd * 100}%</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#64748b' }}>Applied weights pending API response.</div>
            )}
          </div>
        </div>
      </div>

      {/* "Why this score?" Explainability Evidence Panel */}
      <div className="glass-panel" style={{ padding: 24, background: '#fff', marginBottom: 24 }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowFullEvidence(!showFullEvidence)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="message-avatar ai-avatar" style={{ width: 28, height: 28 }}>
              <Sparkles size={15} />
            </div>
            <h3 style={{ fontSize: 17, color: 'var(--text-primary)' }}>
              Why this score? Explainability & Calculation Evidence
            </h3>
          </div>
          <button style={{ color: '#64748b' }}>
            {showFullEvidence ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {showFullEvidence && (
          <div style={{ marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            {/* Direct evidence bullets from SQL Engine */}
            <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #bfdbfe', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} color="#2563eb" />
                Audit-Verified SQL Calculation Evidence
              </div>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
                {faculty.evidence && faculty.evidence.length > 0 ? (
                  faculty.evidence.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                  ))
                ) : (
                  <li>SQL calculation evidence will populate upon API evaluation.</li>
                )}
              </ul>
            </div>

            {/* Diagnostic facts */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} color="#475569" />
                Department Benchmarking Observations
              </div>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                {faculty.explanation_facts && faculty.explanation_facts.length > 0 ? (
                  faculty.explanation_facts.map((fact, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{fact}</li>
                  ))
                ) : (
                  <li>Department benchmarking observations pending API evaluation.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Supporting Data: Publications & Projects */}
      <div className="grid-2">
        {/* Publication Portfolio */}
        <div className="glass-panel" style={{ padding: 24, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} color="#2563eb" />
              Publications ({faculty.raw_metrics?.total_pubs ?? 0})
            </h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {faculty.raw_metrics?.q1_pubs ?? 0} Q1 • {faculty.raw_metrics?.q2_pubs ?? 0} Q2
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
            {faculty.publications && faculty.publications.length > 0 ? (
              faculty.publications.map((p) => {
                const badge = getQuartileBadge(p.quartile);
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0a192f' }}>
                        {p.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          flexShrink: 0
                        }}
                      >
                        {p.quartile}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{p.venue} ({p.year})</span>
                      <span>{p.citations} citations</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                No publications recorded.
              </div>
            )}
          </div>
        </div>

        {/* Sponsored Research Projects & IP */}
        <div className="glass-panel" style={{ padding: 24, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IndianRupee size={16} color="#7c3aed" />
              Grants & Patents
            </h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              ₹{faculty.raw_metrics?.total_sanctioned_lakhs ?? 0}L Funding • {faculty.raw_metrics?.patent_count ?? 0} Patents
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faculty.projects && faculty.projects.length > 0 ? (
              faculty.projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    padding: 12,
                    background: '#f5f3ff',
                    borderRadius: 10,
                    border: '1px solid #ddd6fe'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4c1d95' }}>
                      {proj.title}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>
                      ₹{proj.sanctionedLakhs} Lakhs
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#6d28d9', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{proj.agency}</span>
                    <span>Role: <strong>{proj.role}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
                Zero active sponsored research grants recorded.
              </div>
            )}

            {/* Patent Disclosures */}
            <div style={{ marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lightbulb size={13} color="#d97706" />
                <span>Patent Portfolio Status</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#475569' }}>
                <span>Granted: <strong>{faculty.raw_metrics?.granted_patents ?? 0}</strong></span>
                <span>Published: <strong>{Math.max(0, (faculty.raw_metrics?.patent_count ?? 0) - (faculty.raw_metrics?.granted_patents ?? 0))}</strong></span>
                <span>Doctoral Scholars: <strong>{faculty.raw_metrics?.total_scholars ?? 0}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

