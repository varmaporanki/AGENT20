import React from 'react';
import { Database, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  institutionName?: string | null;
  isConnected?: boolean;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  institutionName,
  isConnected = false,
  onOpenAssistant
}) => {
  return (
    <header className="header-container">
      <div className="header-content">
        {/* LEFT: Institutional Branding */}
        <div className="header-left">
          <div className="institution-crest" title="Agent 20 Intelligence Platform">
            <span>A20</span>
          </div>
          <div className="institution-details">
            <div className="institution-name">
              {institutionName || 'Academic Research Intelligence'}
            </div>
            <div className="institution-subtext">Office of the Dean (Research & Development)</div>
          </div>
        </div>

        {/* CENTER: CSE Presents & Product Title */}
        <div className="header-center">
          <span className="header-tagline-small">Department of CSE Presents</span>
          <div className="header-title-main">
            AGENT 20
            <span className="header-badge">RESEARCH INTELLIGENCE</span>
          </div>
        </div>

        {/* RIGHT: Accreditation & Operational Badges */}
        <div className="header-right">
          <div className="header-accreditation">
            <span className="badge-pill" title="Deterministic 0-100 Mathematical Engine">
              <ShieldCheck size={13} color="#2563eb" />
              <span>Deterministic Model</span>
            </span>

            <span className="badge-pill" title="Underlying Relational Database Architecture">
              <Database size={13} color="#475569" />
              <span>PostgreSQL 16 Engine</span>
            </span>

            <span
              className={`badge-pill ${isConnected ? 'active-mode' : ''}`}
              title={isConnected ? 'Connected to backend service' : 'Backend API connection required'}
            >
              <Activity size={13} color={isConnected ? '#059669' : '#d97706'} />
              <span>{isConnected ? 'CONNECTED' : 'AWAITING BACKEND'}</span>
            </span>
          </div>

          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="badge-pill"
              style={{
                background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '6px 14px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(10, 25, 47, 0.2)',
                transition: 'all 0.18s var(--ease-spring)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 25, 47, 0.28)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 25, 47, 0.2)';
              }}
              title="Open AI Research Assistant"
            >
              <Sparkles size={13} color="#60a5fa" />
              <span style={{ fontWeight: 700 }}>Ask AI</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
