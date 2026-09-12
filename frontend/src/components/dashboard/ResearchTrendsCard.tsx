import React, { useState } from 'react';
import { TrendingUp, Quote, BookOpen, IndianRupee, BarChart2 } from 'lucide-react';
import { useCardTilt } from '../../utils/useCardTilt';

interface TrendItem {
  year: number;
  citations: number;
  publications: number;
  funding_lakhs: number;
}

interface ResearchTrendsCardProps {
  trends?: TrendItem[] | null;
}

export const ResearchTrendsCard: React.FC<ResearchTrendsCardProps> = ({ trends }) => {
  const [activeMetric, setActiveMetric] = useState<'citations' | 'publications' | 'funding'>('citations');
  const cardRef = useCardTilt<HTMLDivElement>({ maxTilt: 1.2, lift: -5, scale: 1.012 });

  const hasTrends = Boolean(trends && trends.length > 0);
  const trendList = trends || [];

  const maxVal = hasTrends
    ? Math.max(
        ...trendList.map(t =>
          activeMetric === 'citations' ? (t.citations || 0) :
          activeMetric === 'publications' ? (t.publications || 0) : (t.funding_lakhs || 0)
        ),
        1
      )
    : 1;

  return (
    <div ref={cardRef} className="glass-panel tilt-card" style={{ padding: 26, marginTop: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="specular-overlay" />
      <div className="card-content-elevated">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="badge-pill" style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}>
              <TrendingUp size={12} />
              <span>5-Year Velocity</span>
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Point-in-time annual progression
            </span>
          </div>
          <h2 style={{ fontSize: 21, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Institutional Research Momentum
          </h2>
        </div>

        {/* Metric Selector Tabs */}
        {hasTrends && (
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setActiveMetric('citations')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: activeMetric === 'citations' ? '#fff' : 'transparent',
                color: activeMetric === 'citations' ? '#2563eb' : '#64748b',
                boxShadow: activeMetric === 'citations' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.18s ease'
              }}
            >
              <Quote size={12} />
              <span>Citations</span>
            </button>

            <button
              onClick={() => setActiveMetric('publications')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: activeMetric === 'publications' ? '#fff' : 'transparent',
                color: activeMetric === 'publications' ? '#2563eb' : '#64748b',
                boxShadow: activeMetric === 'publications' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.18s ease'
              }}
            >
              <BookOpen size={12} />
              <span>Publications</span>
            </button>

            <button
              onClick={() => setActiveMetric('funding')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: activeMetric === 'funding' ? '#fff' : 'transparent',
                color: activeMetric === 'funding' ? '#2563eb' : '#64748b',
                boxShadow: activeMetric === 'funding' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.18s ease'
              }}
            >
              <IndianRupee size={12} />
              <span>Grants (₹L)</span>
            </button>
          </div>
        )}
      </div>

      {/* Chart or Empty State */}
      {hasTrends ? (
        <div style={{ position: 'relative', height: 230, display: 'flex', alignItems: 'flex-end', gap: 24, padding: '24px 14px 12px' }}>
          {trendList.map(item => {
            const rawVal =
              activeMetric === 'citations' ? (item.citations ?? 0) :
              activeMetric === 'publications' ? (item.publications ?? 0) : (item.funding_lakhs ?? 0);
            const heightPct = Math.round((rawVal / maxVal) * 100);

            return (
              <div
                key={item.year}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0a192f', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                  {activeMetric === 'funding' ? `₹${rawVal}L` : rawVal.toLocaleString()}
                </div>
                <div
                  style={{
                    width: '68%',
                    height: `${Math.max(heightPct, 5)}%`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '8px 8px 3px 3px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.22)',
                    transition: 'height 0.4s var(--ease-spring), transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scaleY(1.03)';
                    e.currentTarget.style.background = 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scaleY(1)';
                    e.currentTarget.style.background = 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)';
                  }}
                />
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                  {item.year}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state-panel">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#64748b' }}>
            <BarChart2 size={22} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
            Historical Research Trends Unavailable
          </div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
            Connect the research data service to load longitudinal progression across citations, publications, and sponsored funding.
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
