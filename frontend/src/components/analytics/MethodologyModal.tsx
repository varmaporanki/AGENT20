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
        background: 'rgba(10, 25, 47, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          padding: 32,
          position: 'relative'
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
            borderRadius: 8,
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="institution-crest" style={{ width: 32, height: 32, fontSize: 13 }}>
            A20
          </div>
          <span className="badge-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            Mathematical Scoring Specifications
          </span>
        </div>

        <h2 style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 12 }}>
          Agent 20 Evaluation & Normalization Engine
        </h2>
        <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
          This deterministic model evaluates academic research performance on a continuous 0.0–100.0 scale. Computed strictly via PostgreSQL 16 relational algebra in <code style={{ fontFamily: 'var(--font-mono)', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>acadagents</code>.
        </p>

        {/* Master Formula Block */}
        <div style={{ background: '#0a192f', color: '#fff', padding: 20, borderRadius: 14, marginBottom: 24, fontFamily: 'var(--font-mono)' }}>
          <div style={{ color: '#93c5fd', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Final Continuous Score Formula
          </div>
          <div style={{ fontSize: 15, color: '#60a5fa' }}>
            FinalScore = min(100.0, max(0.0, ROUND(S_base × C_adj, 1)))
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8 }}>
            Where C_adj = min(1.30, StageFactor × WorkloadMultiplier)
          </div>
        </div>

        {/* Dynamic Weights Table */}
        <h3 style={{ fontSize: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <h3 style={{ fontSize: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={16} color="#2563eb" />
          Publication Quality & Journal Indexing
        </h3>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4 }}>Q1 & Q2 Indexed Venues</div>
            <div>• <strong>Q1 Journal</strong>: 10.0 points (Top 25% subdiscipline impact)</div>
            <div>• <strong>Q2 Journal</strong>: 6.0 points (High impact peer review)</div>
            <div>• Authorship: Sole/Corresponding (1.00), First (0.85), Co-author (0.50)</div>
          </div>

          <div style={{ background: '#fef2f2', padding: 14, borderRadius: 10, border: '1px solid #fecaca', fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Anti-Gaming & Predatory Penalties</div>
            <div>• <strong>Q3 / Q4 Journals</strong>: 3.0 / 1.5 points</div>
            <div>• <strong>Unindexed Venues</strong>: 0.5 points nominal credit</div>
            <div>• <strong>Flagged / Predatory Venues</strong>: <strong style={{ color: '#dc2626' }}>0.0 points (Zero credit)</strong></div>
          </div>
        </div>

        {/* Context Adjustments */}
        <h3 style={{ fontSize: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={16} color="#2563eb" />
          Career-Stage & Workload Equity Adjustments
        </h3>
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 6 }}>
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
