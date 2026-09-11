import React from 'react';
import { LayoutDashboard, Users, Building2, BotMessageSquare, Sparkles, BookOpen } from 'lucide-react';

export type NavTab = 'dashboard' | 'faculty' | 'departments' | 'assistant';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMethodology?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenMethodology
}) => {
  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
            aria-label="Navigate to Executive Dashboard"
          >
            <LayoutDashboard size={16} />
            <span>Executive Dashboard</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'faculty' ? 'active' : ''}`}
            onClick={() => onSelectTab('faculty')}
            aria-label="Navigate to Faculty Analytics"
          >
            <Users size={16} />
            <span>Faculty Analytics & Leaderboard</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => onSelectTab('departments')}
            aria-label="Navigate to Department Benchmarking"
          >
            <Building2 size={16} />
            <span>Department Benchmarking</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => onSelectTab('assistant')}
            aria-label="Navigate to AI Assistant"
          >
            <BotMessageSquare size={16} />
            <span>AI Research Assistant</span>
            <Sparkles size={12} color="#2563eb" style={{ marginLeft: 2 }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onOpenMethodology && (
            <button
              onClick={onOpenMethodology}
              className="chip-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#fff',
                borderColor: '#cbd5e1',
                fontSize: 11.5
              }}
              title="View deterministic scoring formulas and weight rules"
            >
              <BookOpen size={13} color="#2563eb" />
              <span>Scoring Methodology</span>
            </button>
          )}
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            EVAL: 2024-12-31
          </span>
        </div>
      </div>
    </nav>
  );
};
