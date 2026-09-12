import React from 'react';
import { X, BookOpen, Scale, Award } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 25, 47, 0.62)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel glass-panel-heavy modal-surface"
        style={{
          width: '100%',
          maxWidth: 840,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 250, 255, 0.92) 100%)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          padding: 34,
          position: 'relative',
          boxShadow: '0 32px 80px -12px rgba(10, 25, 47, 0.42), 0 0 0 1px rgba(147, 197, 253, 0.5), inset 0 2px 2px #fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            color: '#64748b',
            background: '#f1f5f9',
            borderRadius: 10,
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            transition: 'all 0.2s var(--ease-spring)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0a192f';
            e.currentTarget.style.transform = 'scale(1.08) rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="institution-crest" style={{ width: 34, height: 34, fontSize: 13 }}>
            A20
          </div>
          <span className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
            Mathematical Scoring Specifications
          </span>
        </div>

        <h2 style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' }}>
          Agent 20 Evaluation & Normalization Engine
        </h2>
        <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, marginBottom: 22 }}>
          This deterministic model evaluates academic research performance on a continuous 0.0–100.0 scale. Computed strictly via PostgreSQL 16 relational algebra in <code style={{ fontFamily: 'var(--font-mono)', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>acadagents</code>.
        </p>

        {/* Master Formula Block */}
        <div style={{ background: '#0a192f', color: '#fff', padding: 22, borderRadius: 14, marginBottom: 24, fontFamily: 'var(--font-mono)', boxShadow: '0 4px 16px rgba(10, 25, 47, 0.2)' }}>
          <div style={{ color: '#93c5fd', fontSize: 11.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Final Continuous Score Formula
          </div>
          <div style={{ fontSize: 16, color: '#60a5fa', fontWeight: 600 }}>
            FinalScore = min(100.0, max(0.0, ROUND(S_base × C_adj, 1)))
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
            Where C_adj = min(1.30, StageFactor × WorkloadMultiplier)
          </div>
        </div>

        {/* Dynamic Weights Table */}
        <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <Scale size={16} color="#2563eb" />
          Discipline-Aware Dynamic Weights
        </h3>
        <div className="data-table-wrapper" style={{ marginBottom: 24 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Discipline / Department</th>
                <th>Publications</th>
                <th>Citations</th>
                <th>Patents</th>
                <th>Grants</th>
                <th>PhD Supervision</th>
                <th>Weight Sum</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Engineering & Science</strong> (CSE, MECH, BIO)</td>
                <td>35%</td>
                <td>25%</td>
                <td>15%</td>
                <td>15%</td>
                <td>10%</td>
                <td><strong style={{ color: '#059669' }}>100% (1.00)</strong></td>
              </tr>
              <tr style={{ background: '#fffbeb' }}>
                <td><strong>Humanities & Social Sciences</strong> (HSS)</td>
                <td><strong>45%</strong> (+10%)</td>
                <td><strong>30%</strong> (+5%)</td>
                <td><strong style={{ color: '#b45309' }}>0%</strong> (N/A)</td>
                <td>15%</td>
                <td>10%</td>
                <td><strong style={{ color: '#059669' }}>100% (1.00)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Publication Quality Tiers */}
        <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <BookOpen size={16} color="#2563eb" />
          Publication Quality & Journal Indexing
        </h3>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12.5, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#059669', marginBottom: 6, fontSize: 13 }}>Q1 & Q2 Indexed Venues</div>
            <div>• <strong>Q1 Journal</strong>: 10.0 points (Top 25% subdiscipline impact)</div>
            <div>• <strong>Q2 Journal</strong>: 6.0 points (High impact peer review)</div>
            <div>• Authorship: Sole/Corresponding (1.00), First (0.85), Co-author (0.50)</div>
          </div>

          <div style={{ background: '#fef2f2', padding: 16, borderRadius: 12, border: '1px solid #fecaca', fontSize: 12.5, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6, fontSize: 13 }}>Anti-Gaming & Predatory Penalties</div>
            <div>• <strong>Q3 / Q4 Journals</strong>: 3.0 / 1.5 points</div>
            <div>• <strong>Unindexed Venues</strong>: 0.5 points nominal credit</div>
            <div>• <strong>Flagged / Predatory Venues</strong>: <strong style={{ color: '#dc2626' }}>0.0 points (Zero credit)</strong></div>
          </div>
        </div>

        {/* Context Adjustments */}
        <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <Award size={16} color="#2563eb" />
          Career-Stage & Workload Equity Adjustments
        </h3>
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65 }}>
          <p style={{ marginBottom: 8 }}>
            • <strong>Early-Career Startup Factor (StageFactor)</strong>: Assistant Professors with ≤ 5.0 years service receive a <strong>1.20x velocity multiplier</strong> to compensate for laboratory setup lag.
          </p>
          <p style={{ marginBottom: 6 }}>
            • <strong>Instructional & Admin Workload (LoadMultiplier)</strong>: Continuous linear ramp from 1.00 to <strong>1.15 (+15% max cap)</strong> recognizing research achieved under heavy contact hours and executive administrative burdens (HOD, Dean, Warden).
          </p>
        </div>
      </div>
    </div>
  );
};
