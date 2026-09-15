import React, { useState, useRef, useEffect } from 'react';
import { assistantService } from '../../services/api';
import type { AssistantResponse, AssistantEvidenceItem } from '../../services/api';
import { BotMessageSquare, Send, Sparkles, User, FileText, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  keyFindings?: string[];
  evidence?: (AssistantEvidenceItem | string)[];
  relatedFaculty?: string[];
  relatedDepartments?: string[];
  disclaimer?: string;
  supportingData?: Record<string, unknown>;
  relatedQuestions?: string[];
  provider?: string;
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
      text: 'Welcome to Agent 20 Research Intelligence. I am your academic analytics assistant, strictly grounded in our deterministic PostgreSQL evaluation engine. Ask me about institution-wide department comparisons, faculty rankings, scoring methodology, or specific researcher profiles.',
      keyFindings: [
        'Deterministic calculations derived from 21-schema PostgreSQL database',
        'Evaluation baseline date: 2024-12-31',
        'Zero hallucinated metrics: narrative interpretations synthesize audit-verified database evidence'
      ],
      relatedQuestions: [
        'Compare the performance between CSE and BIO departments',
        'Who are the top 5 faculty members?',
        'Explain the score for EMP0002',
        'What are the strongest research areas in CSE?',
        'Why does HSS use different research weights?'
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
        relatedFaculty: response.related_faculty,
        relatedDepartments: response.related_departments,
        disclaimer: response.disclaimer,
        supportingData: response.supportingData,
        relatedQuestions: response.relatedQuestions,
        provider: response.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        sender: 'assistant',
        text: `Unable to synthesize research intelligence: ${err?.message || 'Server error'}.\n\nPlease ensure the backend service is online and GROQ_API_KEY is configured.`,
        disclaimer: 'Deterministic institutional metrics remain fully available across Faculty and Department dashboards.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  return (
    <div className="assistant-card glass-panel-heavy" style={{ height: '100%', minHeight: 600 }}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <div className="message-avatar ai-avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}>Agent 20 Academic Research Assistant</div>
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
                <div style={{ marginTop: 14, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} color="#059669" />
                    <span>Key Analytical Takeaways</span>
                  </div>
                  <ul style={{ paddingLeft: 18, fontSize: 12.5, color: '#334155', lineHeight: 1.6 }}>
                    {msg.keyFindings.map((kf, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{kf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Relational Evidence Block */}
              {msg.evidence && msg.evidence.length > 0 && (
                <div style={{ marginTop: 12, background: '#eff6ff', padding: 12, borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FileText size={12} color="#2563eb" />
                    <span>Authoritative Deterministic Evidence</span>
                  </div>
                  {msg.evidence.map((ev, i) => {
                    const isObj = typeof ev === 'object' && ev !== null;
                    const metric = isObj ? (ev as any).metric : 'Metric';
                    const value = isObj ? (ev as any).value : ev;
                    const source = isObj ? (ev as any).source : null;
                    return (
                      <div key={i} style={{ fontSize: 11.5, color: '#1e3a8a', lineHeight: 1.6, marginBottom: 3 }}>
                        • <strong>{metric}:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{String(value)}</span> {source && <span style={{ color: '#64748b', fontSize: 10.5 }}>({source})</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Related Departments & Faculty Entities */}
              {((msg.relatedDepartments && msg.relatedDepartments.length > 0) || (msg.relatedFaculty && msg.relatedFaculty.length > 0)) && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {msg.relatedDepartments?.map((dept) => (
                    <span
                      key={dept}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1'
                      }}
                    >
                      🏛️ Dept: {dept}
                    </span>
                  ))}
                  {msg.relatedFaculty?.map((empNo) => (
                    <button
                      key={empNo}
                      onClick={() => onSelectFaculty && onSelectFaculty(empNo)}
                      className="chip-btn"
                      style={{
                        background: '#fff',
                        borderColor: '#2563eb',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: 11,
                        padding: '3px 10px'
                      }}
                      title={`Open dossier for ${empNo}`}
                    >
                      👤 {empNo} Dossier →
                    </button>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              {msg.disclaimer && (
                <div style={{ marginTop: 8, fontSize: 10.5, color: '#64748b', fontStyle: 'italic' }}>
                  ⚖️ {msg.disclaimer}
                </div>
              )}

              {/* Message Footer: Provider Badge + Timestamp */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  {msg.provider && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: msg.provider === 'groq' ? 'rgba(249, 115, 22, 0.08)' : msg.provider === 'openai' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                        color: msg.provider === 'groq' ? '#ea580c' : msg.provider === 'openai' ? '#059669' : '#64748b',
                        border: `1px solid ${msg.provider === 'groq' ? 'rgba(249, 115, 22, 0.2)' : msg.provider === 'openai' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(100, 116, 139, 0.2)'}`
                      }}
                    >
                      ⚡ {msg.provider === 'groq' ? 'Groq' : msg.provider === 'openai' ? 'OpenAI Fallback' : 'Database Direct'}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10.5, color: '#94a3b8' }}>{msg.timestamp}</span>
              </div>

              {/* Related Questions Chips */}
              {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Follow-up inquiries:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {msg.relatedQuestions.map((rq, i) => (
                      <button
                        key={i}
                        className="chip-btn"
                        style={{ fontSize: 11, padding: '5px 12px' }}
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
            <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b' }}>
              <span className="pulse-dot" style={{ width: 8, height: 8 }} />
              <span style={{ fontSize: 13 }}>Synthesizing evidence-grounded explanation...</span>
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
          style={{ display: 'flex', gap: 12, alignItems: 'center' }}
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
            className="chat-send-btn btn-sweep"
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
