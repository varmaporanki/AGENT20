import React from 'react';
import { BotMessageSquare, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

interface AssistantSpotlightCardProps {
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  onOpenAssistant: () => void;
}

export const AssistantSpotlightCard: React.FC<AssistantSpotlightCardProps> = ({
  onOpenAssistantWithPrompt,
  onOpenAssistant
}) => {
  const suggestedQuestions = [
    'Who are the top researchers across the institution?',
    'How does discipline-aware normalization account for HSS versus engineering?',
    'Explain how early-career research weighting protects assistant professors.',
    'How do extramural grants and patents influence faculty ranking?',
    'Which department shows the highest research velocity?'
  ];


  return (
    <div
      className="glass-panel"
      style={{
        padding: 28,
        marginTop: 24,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 247, 255, 0.95) 100%)',
        border: '1px solid rgba(191, 219, 254, 0.9)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }} className="badge-pill">
            <Sparkles size={13} color="#2563eb" />
            <span style={{ color: '#2563eb', fontWeight: 700 }}>AI RESEARCH ASSISTANT (GEMINI INTEGRATION)</span>
          </div>
          <h2 style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>
            Ask natural-language questions about faculty productivity & institutional policy
          </h2>
          <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
            Our conversational assistant is strictly grounded in the deterministic PostgreSQL scoring engine. It never invents metrics — it explains calculated rankings, interprets quartile rigor, highlights early-career startup velocity, and generates actionable administrative recommendations.
          </p>
        </div>

        <button
          onClick={onOpenAssistant}
          style={{
            background: 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(10, 25, 47, 0.2)'
          }}
        >
          <BotMessageSquare size={16} color="#60a5fa" />
          <span>Launch AI Assistant</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <HelpCircle size={13} />
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
  );
};
