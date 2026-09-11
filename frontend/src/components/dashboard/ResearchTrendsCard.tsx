import React, { useState } from 'react';
import { TrendingUp, Quote, BookOpen, IndianRupee, BarChart2 } from 'lucide-react';

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
    <div className="glass-panel" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge-pill" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
              <TrendingUp size={12} />
              5-Year Velocity
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Point-in-time annual progression
            </span>
          </div>
          <h2 style={{ fontSize: 20, color: 'var(--text-primary)' }}>Institutional Research Momentum</h2>
        </div>

        {/* Metric Selector Tabs */}
        {hasTrends && (
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
            <button
              onClick={() => setActiveMetric('citations')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: activeMetric === 'citations' ? '#fff' : 'transparent',
                color: activeMetric === 'citations' ? '#2563eb' : '#64748b',
                boxShadow: activeMetric === 'citations' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4
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
                boxShadow: activeMetric === 'publications' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4
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
                boxShadow: activeMetric === 'funding' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4
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
        <div style={{ position: 'relative', height: 220, display: 'flex', alignItems: 'flex-end', gap: 24, padding: '20px 10px 10px' }}>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0a192f', marginBottom: 6 }}>
                  {activeMetric === 'funding' ? `₹${rawVal}L` : rawVal.toLocaleString()}
                </div>
                <div
                  style={{
                    width: '70%',
                    height: `${Math.max(heightPct, 4)}%`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '8px 8px 3px 3px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    transition: 'height 0.4s ease, background 0.3s ease'
                  }}
                />
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  {item.year}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            height: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(248, 250, 252, 0.7)',
            borderRadius: 12,
            border: '1px dashed #cbd5e1',
            color: '#64748b',
            gap: 8,
            padding: 24,
            textAlign: 'center'
          }}
        >
          <BarChart2 size={28} color="#94a3b8" />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
            Historical Research Trends Unavailable
          </div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 440 }}>
            Connect the research data service to load longitudinal progression across citations, publications, and sponsored funding.
          </div>
        </div>
      )}
    </div>
  );
};

