import React from 'react';
import type { InstitutionOverview } from '../../services/types';
import { Users, BarChart3, BookCheck, IndianRupee, Lightbulb } from 'lucide-react';

interface FloatingKpiCardsProps {
  overview?: InstitutionOverview | null;
  loading?: boolean;
}

export const FloatingKpiCards: React.FC<FloatingKpiCardsProps> = ({ overview, loading = false }) => {
  const formatValue = (val: number | null | undefined, suffix = '', prefix = '') => {
    if (loading) return '...';
    if (val === null || val === undefined) return '—';
    return `${prefix}${val.toLocaleString()}${suffix}`;
  };

  return (
    <div className="floating-kpi-container">
      {/* 1. Active Faculty */}
      <div className="kpi-card">
        <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} color="#2563eb" />
          Active Faculty
        </span>
        <span className="kpi-value">
          {formatValue(overview?.total_faculty)}
        </span>
        <span className="kpi-subtext">
          {overview?.total_faculty !== null && overview?.total_faculty !== undefined
            ? `Verified department roster`
            : 'Awaiting API connection'}
        </span>
      </div>

      {/* 2. Institutional Mean */}
      <div className="kpi-card">
        <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BarChart3 size={12} color="#059669" />
          Institutional Mean
        </span>
        <span className="kpi-value" style={{ color: overview?.mean_score ? '#059669' : undefined }}>
          {formatValue(overview?.mean_score)}
        </span>
        <span className="kpi-subtext">
          {overview?.mean_score !== null && overview?.mean_score !== undefined
            ? 'Normalized 0–100 Scale'
            : 'Awaiting API connection'}
        </span>
      </div>

      {/* 3. Publications */}
      <div className="kpi-card">
        <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BookCheck size={12} color="#2563eb" />
          Publications
        </span>
        <span className="kpi-value">
          {formatValue(overview?.total_publications)}
        </span>
        <span className="kpi-subtext">
          {overview?.q1_publication_percentage !== null && overview?.q1_publication_percentage !== undefined
            ? `${overview.q1_publication_percentage}% in Top Q1 Venues`
            : 'Awaiting API connection'}
        </span>
      </div>

      {/* 4. Sponsored Grants */}
      <div className="kpi-card">
        <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IndianRupee size={12} color="#7c3aed" />
          Sponsored Grants
        </span>
        <span className="kpi-value" style={{ color: overview?.total_grant_funding_lakhs ? '#7c3aed' : undefined }}>
          {overview?.total_grant_funding_lakhs !== null && overview?.total_grant_funding_lakhs !== undefined
            ? `₹${overview.total_grant_funding_lakhs}L`
            : '—'}
        </span>
        <span className="kpi-subtext">
          {overview?.total_grant_funding_lakhs !== null && overview?.total_grant_funding_lakhs !== undefined
            ? 'Competitive national grants'
            : 'Awaiting API connection'}
        </span>
      </div>

      {/* 5. Patents & IP */}
      <div className="kpi-card">
        <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Lightbulb size={12} color="#d97706" />
          Patents & IP
        </span>
        <span className="kpi-value" style={{ color: overview?.active_patents ? '#d97706' : undefined }}>
          {formatValue(overview?.active_patents)}
        </span>
        <span className="kpi-subtext">
          {overview?.active_patents !== null && overview?.active_patents !== undefined
            ? 'Disclosed & granted IP'
            : 'Awaiting API connection'}
        </span>
      </div>
    </div>
  );
};
