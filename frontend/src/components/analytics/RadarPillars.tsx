import React from 'react';
import type { PillarComponents } from '../../services/types';

interface RadarPillarsProps {
  components?: PillarComponents | null;
  deptAverages?: PillarComponents | null;
  size?: number;
}

export const RadarPillars: React.FC<RadarPillarsProps> = ({
  components,
  deptAverages,
  size = 320
}) => {
  const center = size / 2;
  const radius = size * 0.38;

  const pillars = [
    { key: 'publication_quality', label: 'Publication Quality', value: components?.publication_quality ?? null, color: '#2563eb' },
    { key: 'citation_impact', label: 'Citation Impact', value: components?.citation_impact ?? null, color: '#10b981' },
    { key: 'patents', label: 'Patents & IP', value: components?.patents ?? null, color: '#0ea5e9' },
    { key: 'funding', label: 'Sponsored Funding', value: components?.funding ?? null, color: '#7c3aed' },
    { key: 'phd_supervision', label: 'PhD Guidance', value: components?.phd_supervision ?? null, color: '#f59e0b' }
  ] as const;

  const totalAxes = pillars.length;

  // Calculate coordinates for polygon at a given percentage (0.0 to 1.0)
  const getCoordinates = (index: number, valuePct: number) => {
    // Start at top (-PI / 2)
    const angle = (index * (2 * Math.PI / totalAxes)) - (Math.PI / 2);
    const r = radius * Math.max(0.05, Math.min(1.0, valuePct));
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate grid concentric polygons (at 20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const hasFacultyPoints = pillars.some(p => p.value !== null);
  const facultyPoints = hasFacultyPoints
    ? pillars
        .map((p, idx) => {
          const pct = p.value !== null ? p.value / 100.0 : 0.05;
          const coord = getCoordinates(idx, pct);
          return `${coord.x},${coord.y}`;
        })
        .join(' ')
    : null;

  const hasDeptPoints = deptAverages && Object.values(deptAverages).some(v => v !== null && v !== undefined);
  const deptPoints = hasDeptPoints
    ? pillars
        .map((p, idx) => {
          const val = deptAverages?.[p.key as keyof PillarComponents];
          const pct = val != null ? val / 100.0 : 0.05;
          const coord = getCoordinates(idx, pct);
          return `${coord.x},${coord.y}`;
        })
        .join(' ')
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Concentric Grid Pentagons */}
        {gridLevels.map((lvl) => {
          const pts = Array.from({ length: totalAxes })
            .map((_, i) => {
              const c = getCoordinates(i, lvl);
              return `${c.x},${c.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={lvl === 1.0 ? '1.5' : '1'}
              strokeDasharray={lvl === 1.0 ? 'none' : '2,3'}
            />
          );
        })}

        {/* Axis Lines from Center to Edges */}
        {pillars.map((_, i) => {
          const edge = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Department Benchmark Overlay (Dashed Slate) */}
        {deptPoints && (
          <polygon
            points={deptPoints}
            fill="rgba(148, 163, 184, 0.12)"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
        )}

        {/* Faculty Profile Polygon (Glowing Blue) */}
        {facultyPoints && (
          <polygon
            points={facultyPoints}
            fill="rgba(37, 99, 235, 0.22)"
            stroke="#2563eb"
            strokeWidth="2.5"
          />
        )}

        {/* Vertex Markers & Labels */}
        {pillars.map((p, idx) => {
          const pct = p.value !== null ? p.value / 100.0 : 0.05;
          const coord = getCoordinates(idx, pct);
          const labelCoord = getCoordinates(idx, 1.22);

          return (
            <g key={p.key}>
              <circle
                cx={coord.x}
                cy={coord.y}
                r="4.5"
                fill="#fff"
                stroke={p.color}
                strokeWidth="2.5"
              />
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#334155"
                fontSize="10.5"
                fontWeight="700"
                fontFamily="var(--font-sans)"
              >
                {p.label}
              </text>
              <text
                x={labelCoord.x}
                y={labelCoord.y + 12}
                textAnchor="middle"
                dominantBaseline="central"
                fill={p.color}
                fontSize="10"
                fontWeight="800"
                fontFamily="var(--font-mono)"
              >
                {p.value !== null ? p.value.toFixed(1) : '—'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 11, color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 3, background: '#2563eb', borderRadius: 2 }} />
          <span>Faculty Profile</span>
        </div>
        {deptPoints && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 2, background: '#94a3b8', borderTop: '1px dashed #64748b' }} />
            <span>Dept Benchmark</span>
          </div>
        )}
      </div>
    </div>
  );
};

