import React from 'react';
import { AssistantChat } from '../components/assistant/AssistantChat';
import { BotMessageSquare } from 'lucide-react';

interface AssistantProps {
  initialPrompt?: string;
  contextFacultyId?: string;
  contextDepartment?: string;
  onSelectFaculty?: (empNo: string) => void;
}

export const Assistant: React.FC<AssistantProps> = ({
  initialPrompt,
  contextFacultyId,
  contextDepartment,
  onSelectFaculty
}) => {
  return (
    <div style={{ paddingBottom: 64 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }} className="badge-pill">
          <BotMessageSquare size={13} color="#2563eb" />
          <span>INSTITUTIONAL AI AGENT</span>
        </div>
        <h1 style={{ fontSize: 26, color: 'var(--text-primary)', marginBottom: 6 }}>
          AI Research Intelligence Assistant
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 840 }}>
          An evidence-grounded AI copilot for University Directors, Deans, and Department Chairs. Ask questions in natural language to analyze research velocity, examine explainability payloads, understand discipline weight shifts, and explore targeted faculty support policies.
        </p>
      </div>

      <div style={{ height: 680 }}>
        <AssistantChat
          initialPrompt={initialPrompt}
          contextFacultyId={contextFacultyId}
          contextDepartment={contextDepartment}
          onSelectFaculty={onSelectFaculty}
        />
      </div>
    </div>
  );
};
