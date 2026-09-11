import React, { useState, useRef, useEffect } from 'react';
import { assistantService } from '../../services/api';
import type { AssistantResponse } from '../../services/api';
import { BotMessageSquare, Send, Sparkles, User, FileText, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  keyFindings?: string[];
  evidence?: string[];
  supportingData?: Record<string, unknown>;
  relatedQuestions?: string[];
  timestamp: string;
}

interface AssistantChatProps {
  initialPrompt?: string;
  contextFacultyId?: string;
  contextDepartment?: string;
  onSelectFaculty?: (empNo: string) => void;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  initialPrompt,
  contextFacultyId,
  contextDepartment,
  onSelectFaculty
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Welcome to Agent 20 Research Intelligence. I am your academic analytics assistant, strictly grounded in our deterministic PostgreSQL evaluation engine. Ask me about faculty performance, discipline reweighting, publication rigor, or targeted faculty development recommendations.',
      keyFindings: [
        'Deterministic calculations derived from 21-schema PostgreSQL database',
        'Reproducible evaluation parameter: DATE \'2024-12-31\'',
        'Zero hallucinated metrics: narratives synthesize audit-verified SQL evidence'
      ],
      relatedQuestions: [
        'Who are the top researchers across the institution?',
        'How does discipline-aware normalization account for HSS versus engineering?',
        'Explain the publication quality formula and quartile tiers',
        'How do extramural grants and patents affect departmental ranking?'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response: AssistantResponse = await assistantService.ask({
        question: q,
        contextFacultyId,
        contextDepartment: contextDepartment as any
      });

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: response.answer,
        keyFindings: response.keyFindings,
        evidence: response.evidence,
        supportingData: response.supportingData,
        relatedQuestions: response.relatedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        sender: 'assistant',
        text: 'AI Research Assistant is awaiting backend connection. Please ensure the backend service at http://localhost:8000/api/v1 is online to query grounded research intelligence.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="assistant-card" style={{ height: '100%', minHeight: 600 }}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <div className="message-avatar ai-avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Agent 20 Academic Research Assistant</div>
            <div style={{ fontSize: 11.5, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              <span>Grounded in PostgreSQL 16 `acadagents` • Evaluated 2024-12-31</span>
            </div>
          </div>
        </div>

        {contextFacultyId && (
          <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
            Context: {contextFacultyId}
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender}`}>
            <div className={`message-avatar ${msg.sender === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
              {msg.sender === 'user' ? <User size={16} /> : <BotMessageSquare size={16} />}
            </div>

            <div className="message-bubble">
              <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

              {/* Key Findings Card */}
              {msg.keyFindings && msg.keyFindings.length > 0 && (
                <div style={{ marginTop: 14, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} color="#059669" />
                    Key Analytical Takeaways
                  </div>
                  <ul style={{ paddingLeft: 16, fontSize: 12, color: '#334155' }}>
                    {msg.keyFindings.map((kf, i) => (
                      <li key={i} style={{ marginBottom: 3 }}>{kf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Relational Evidence Block */}
              {msg.evidence && msg.evidence.length > 0 && (
                <div style={{ marginTop: 10, background: '#eff6ff', padding: 10, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileText size={11} color="#2563eb" />
                    SQL Calculation Evidence
                  </div>
                  {msg.evidence.map((ev, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#1e3a8a', fontFamily: 'var(--font-mono)' }}>
                      • {ev}
                    </div>
                  ))}
                </div>
              )}

              {/* Supporting Data Link */}
              {msg.supportingData && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {typeof msg.supportingData.employee_no === 'string' && onSelectFaculty && (
                    <button
                      onClick={() => onSelectFaculty(msg.supportingData?.employee_no as string)}
                      className="chip-btn"
                      style={{ background: '#fff', borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}
                    >
                      Open {msg.supportingData.employee_no} Dossier →
                    </button>
                  )}
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{msg.timestamp}</span>
                </div>
              )}

              {/* Related Questions Chips */}
              {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                  <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 6 }}>Follow-up inquiries:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {msg.relatedQuestions.map((rq, i) => (
                      <button
                        key={i}
                        className="chip-btn"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => handleSend(rq)}
                      >
                        {rq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="message-avatar ai-avatar">
              <Sparkles size={16} />
            </div>
            <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
              <span className="pulse-dot" style={{ width: 8, height: 8 }} />
              <span style={{ fontSize: 12.5 }}>Synthesizing evidence-grounded explanation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          style={{ display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <div className="chat-input-box" style={{ flex: 1 }}>
            <input
              type="text"
              className="chat-input"
              placeholder="Ask a question (e.g. 'How does discipline reweighting work for HSS?')..."
              value={input}

              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="chat-send-btn"
            disabled={loading || !input.trim()}
            style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
