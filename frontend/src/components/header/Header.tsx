import React from 'react';
import { Database, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  institutionName?: string | null;
  isConnected?: boolean;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected = false,
  onOpenAssistant
}) => {
  return (
    <header className="header-container">
      <div className="header-grid">
        {/* ============================================================ */}
        {/* LEFT ZONE: Official Vignan's Institutional Identity & Logo   */}
        {/* ============================================================ */}
        <div className="header-left">
          {/* Official VIGNAN'S Institutional Logo */}
          <div className="vignans-logo-container" title="Vignan's Foundation for Science, Technology & Research">
            <img
              src="/vignans_logo.png"
              alt="Vignan's Foundation for Science, Technology & Research"
              className="vignans-header-logo"
            />
          </div>

          <div className="vignans-header-divider" />

          {/* Legitimate Institutional Project Descriptors */}
          <div className="vignans-descriptor-block">
            <div className="vignans-descriptor-title">
              Academic Research Intelligence
            </div>
            <div className="vignans-descriptor-office">
              OFFICE OF THE DEAN (RESEARCH & DEVELOPMENT)
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER ZONE: Viewport-Centered Event/Product Identity        */}
        {/* ============================================================ */}
        <div className="header-center">
          <div className="center-eyebrow">DEPARTMENT OF CSE PRESENTS</div>
          <div className="center-title-row">
            <h1 className="center-main-title">AGENT 20</h1>
            <span className="center-pill-badge">RESEARCH INTELLIGENCE</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT ZONE: Legitimate Platform & System Controls            */}
        {/* ============================================================ */}
        <div className="header-right">
          <div className="platform-status-cluster">
            {/* Deterministic Model Badge */}
            <span className="badge-pill" title="Deterministic PostgreSQL scoring model">
              <ShieldCheck size={13} color="#2563eb" />
              <span>Deterministic Model</span>
            </span>

            {/* PostgreSQL Engine Badge */}
            <span className="badge-pill" title="Deterministic PostgreSQL 16 acadagents engine">
              <Database size={13} color="#1e40af" />
              <span>PostgreSQL 16</span>
            </span>

            {/* Groq AI Engine Status */}
            <span
              className={`badge-pill ${isConnected ? 'active-mode' : ''}`}
              title={isConnected ? 'Connected to backend: Groq Primary + OpenAI Fallback' : 'Awaiting backend service at localhost:8000'}
            >
              <Activity size={13} color={isConnected ? '#059669' : '#d97706'} />
              <span style={{ fontWeight: 700 }}>
                {isConnected ? 'GROQ AI ONLINE' : 'API STANDBY'}
              </span>
            </span>

            {/* Ask AI Action Button */}
            {onOpenAssistant && (
              <button
                onClick={onOpenAssistant}
                className="header-action-btn"
                title="Launch Agent 20 Academic Research Assistant"
                aria-label="Ask Agent 20 AI"
              >
                <Sparkles size={13} color="#fff" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
