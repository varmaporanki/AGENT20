import React from 'react';
import type { InstitutionOverview } from '../../services/types';
import { Users, BarChart3, BookCheck, IndianRupee, Lightbulb } from 'lucide-react';
import { useCardTilt } from '../../utils/useCardTilt';

interface FloatingKpiCardsProps {
  overview?: InstitutionOverview | null;
  loading?: boolean;
}

interface SingleKpiProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  subtext: string;
  valueColor?: string;
}

const SingleKpiCard: React.FC<SingleKpiProps> = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  subtext,
  valueColor
}) => {
  const cardRef = useCardTilt<HTMLDivElement>({ maxTilt: 1.5, lift: -6, scale: 1.015 });

  return (
    <div ref={cardRef} className="kpi-card tilt-card">
      <div className="specular-overlay" />
      <div className="card-content-elevated">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div className="kpi-icon-pill" style={{ background: iconBg, color: iconColor }}>
            {icon}
          </div>
          <span className="kpi-label">{label}</span>
        </div>
        <span className="kpi-value" style={{ color: valueColor }}>
          {value}
        </span>
        <div className="kpi-subtext">
          {subtext}
        </div>
      </div>
    </div>
  );
};

export const FloatingKpiCards: React.FC<FloatingKpiCardsProps> = ({ overview, loading = false }) => {
  const formatValue = (val: number | null | undefined, suffix = '', prefix = '') => {
    if (loading) return '...';
    if (val === null || val === undefined) return '—';
    return `${prefix}${val.toLocaleString()}${suffix}`;
  };

  return (
    <div className="floating-kpi-container">
      {/* 1. Active Faculty */}
      <SingleKpiCard
        icon={<Users size={13} />}
        iconBg="#eff6ff"
        iconColor="#2563eb"
        label="Active Faculty"
        value={formatValue(overview?.total_faculty)}
        subtext={
          overview?.total_faculty !== null && overview?.total_faculty !== undefined
            ? 'Verified department roster'
            : 'Awaiting API connection'
        }
      />

      {/* 2. Institutional Mean */}
      <SingleKpiCard
        icon={<BarChart3 size={13} />}
        iconBg="#ecfdf5"
        iconColor="#059669"
        label="Institutional Mean"
        value={formatValue(overview?.mean_score)}
        valueColor={overview?.mean_score ? '#059669' : undefined}
        subtext={
          overview?.mean_score !== null && overview?.mean_score !== undefined
            ? 'Normalized 0–100 Scale'
            : 'Awaiting API connection'
        }
      />

      {/* 3. Publications */}
      <SingleKpiCard
        icon={<BookCheck size={13} />}
        iconBg="#eff6ff"
        iconColor="#2563eb"
        label="Publications"
        value={formatValue(overview?.total_publications)}
        subtext={
          overview?.q1_publication_percentage !== null && overview?.q1_publication_percentage !== undefined
            ? `${overview.q1_publication_percentage}% in Top Q1 Venues`
            : 'Awaiting API connection'
        }
      />

      {/* 4. Sponsored Grants */}
      <SingleKpiCard
        icon={<IndianRupee size={13} />}
        iconBg="#f5f3ff"
        iconColor="#7c3aed"
        label="Sponsored Grants"
        value={
          overview?.total_grant_funding_lakhs !== null && overview?.total_grant_funding_lakhs !== undefined
            ? `₹${overview.total_grant_funding_lakhs}L`
            : '—'
        }
        valueColor={overview?.total_grant_funding_lakhs ? '#7c3aed' : undefined}
        subtext={
          overview?.total_grant_funding_lakhs !== null && overview?.total_grant_funding_lakhs !== undefined
            ? 'Competitive national grants'
            : 'Awaiting API connection'
        }
      />

      {/* 5. Patents & IP */}
      <SingleKpiCard
        icon={<Lightbulb size={13} />}
        iconBg="#fffbeb"
        iconColor="#d97706"
        label="Patents & IP"
        value={formatValue(overview?.active_patents)}
        valueColor={overview?.active_patents ? '#d97706' : undefined}
        subtext={
          overview?.active_patents !== null && overview?.active_patents !== undefined
            ? 'Disclosed & granted IP'
            : 'Awaiting API connection'
        }
      />
    </div>
  );
};
