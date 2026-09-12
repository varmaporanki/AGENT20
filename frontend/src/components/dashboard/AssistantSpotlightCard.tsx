import React from 'react';
import { BotMessageSquare, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { useCardTilt } from '../../utils/useCardTilt';

interface AssistantSpotlightCardProps {
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  onOpenAssistant: () => void;
}

export const AssistantSpotlightCard: React.FC<AssistantSpotlightCardProps> = ({
  onOpenAssistantWithPrompt,
  onOpenAssistant
}) => {
  const cardRef = useCardTilt<HTMLDivElement>({ maxTilt: 1.5, lift: -6, scale: 1.015 });

  const suggestedQuestions = [
    'Who are the top researchers across the institution?',
    'How does discipline-aware normalization account for HSS versus engineering?',
    'Explain how early-career research weighting protects assistant professors.',
    'How do extramural grants and patents influence faculty ranking?',
    'Which department shows the highest research velocity?'
  ];

  return (
    <div
      ref={cardRef}
      className="glass-panel glass-panel-heavy tilt-card"
      style={{
        padding: 32,
        marginTop: 24,
        background: 'radial-gradient(ellipse at 85% 20%, rgba(219, 234, 254, 0.65) 0%, rgba(255, 255, 255, 0.85) 60%)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="specular-overlay" />
      <div className="card-content-elevated">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, background: 'rgba(239, 246, 255, 0.9)', borderColor: '#bfdbfe' }} className="badge-pill">
              <Sparkles size={13} color="#2563eb" />
              <span style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em' }}>
                AI RESEARCH ASSISTANT (GEMINI INTEGRATION)
              </span>
            </div>
            <h2 style={{ fontSize: 23, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              Ask natural-language questions about faculty productivity & institutional policy
            </h2>
            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.62 }}>
              Our conversational assistant is strictly grounded in the deterministic PostgreSQL scoring engine. It never invents metrics — it explains calculated rankings, interprets quartile rigor, highlights early-career startup velocity, and generates actionable administrative recommendations.
            </p>
          </div>

          <button
            onClick={onOpenAssistant}
            className="btn-sweep"
            style={{
              background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
              color: '#fff',
              padding: '13px 24px',
              borderRadius: 13,
              fontWeight: 700,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              boxShadow: '0 4px 16px rgba(10, 25, 47, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              transition: 'all 0.2s var(--ease-spring)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(10, 25, 47, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(10, 25, 47, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.25)';
            }}
          >
            <BotMessageSquare size={16} color="#60a5fa" />
            <span>Launch AI Assistant</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <HelpCircle size={13} color="#2563eb" />
            <span>Suggested Executive Inquiries (Click to Ask)</span>
          </div>
          <div className="suggested-chips">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                className="chip-btn"
                onClick={() => onOpenAssistantWithPrompt ? onOpenAssistantWithPrompt(q) : onOpenAssistant()}
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
