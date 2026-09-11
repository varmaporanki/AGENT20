import { useState, useEffect } from 'react';
import { Header } from './components/header/Header';
import { Navbar } from './components/navigation/Navbar';
import type { NavTab } from './components/navigation/Navbar';
import { Dashboard } from './pages/Dashboard';
import { FacultyAnalytics } from './pages/FacultyAnalytics';
import { FacultyDetail } from './pages/FacultyDetail';
import { Departments } from './pages/Departments';
import { Assistant } from './pages/Assistant';
import { MethodologyModal } from './components/analytics/MethodologyModal';
import { AssistantChat } from './components/assistant/AssistantChat';
import { dashboardService } from './services/api';
import { X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedFacultyEmpNo, setSelectedFacultyEmpNo] = useState<string | null>(null);
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>('ALL');
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [assistantDrawerOpen, setAssistantDrawerOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [institutionName, setInstitutionName] = useState<string | null>(null);

  useEffect(() => {
    async function checkApiConnection() {
      try {
        const ov = await dashboardService.getOverview();
        if (ov) {
          setIsConnected(true);
          setInstitutionName(ov.institution_name || null);
        }
      } catch {
        setIsConnected(false);
      }
    }
    checkApiConnection();
  }, []);

  // Navigate to Faculty Detail dossier
  const handleSelectFaculty = (empNo: string) => {
    setSelectedFacultyEmpNo(empNo);
  };

  // Navigate to Department Benchmarking page with selected department
  const handleSelectDepartment = (code: string) => {
    setSelectedDeptCode(code);
    setActiveTab('departments');
    setSelectedFacultyEmpNo(null);
  };

  // Open Assistant with specific prompt
  const handleOpenAssistantWithPrompt = (prompt: string) => {
    setAssistantPrompt(prompt);
    setActiveTab('assistant');
    setSelectedFacultyEmpNo(null);
  };

  // Ask about a specific faculty member
  const handleAskAboutFaculty = (empNo: string, name: string) => {
    setAssistantPrompt(`Why is ${name} (${empNo}) evaluated at this rank and what are their component scores?`);
    setActiveTab('assistant');
    setSelectedFacultyEmpNo(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Top Institutional Header */}
      <Header
        institutionName={institutionName}
        isConnected={isConnected}
        onOpenAssistant={() => setAssistantDrawerOpen(true)}
      />


      {/* 2. Secondary Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedFacultyEmpNo(null);
        }}
        onOpenMethodology={() => setMethodologyOpen(true)}
      />

      {/* 3. Main Content View Router */}
      <main className="main-wrapper">
        {selectedFacultyEmpNo ? (
          <FacultyDetail
            employeeNo={selectedFacultyEmpNo}
            onBack={() => setSelectedFacultyEmpNo(null)}
            onAskAboutFaculty={handleAskAboutFaculty}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                onSelectFaculty={handleSelectFaculty}
                onSelectDepartment={handleSelectDepartment}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenAssistantWithPrompt={handleOpenAssistantWithPrompt}
              />
            )}

            {activeTab === 'faculty' && (
              <FacultyAnalytics
                onSelectFaculty={handleSelectFaculty}
                initialDept={selectedDeptCode as any}
              />
            )}

            {activeTab === 'departments' && (
              <Departments
                onSelectFaculty={handleSelectFaculty}
              />
            )}

            {activeTab === 'assistant' && (
              <Assistant
                initialPrompt={assistantPrompt}
                onSelectFaculty={handleSelectFaculty}
              />
            )}
          </>
        )}
      </main>

      {/* Methodology & Formula Modal */}
      <MethodologyModal
        isOpen={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
      />

      {/* Slide-Over Quick Assistant Drawer */}
      {assistantDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 25, 47, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 900,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setAssistantDrawerOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              height: '100%',
              background: '#fff',
              boxShadow: 'var(--shadow-float)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }}>
              <button
                onClick={() => setAssistantDrawerOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 6,
                  padding: 4,
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
            <AssistantChat
              onSelectFaculty={(empNo) => {
                setAssistantDrawerOpen(false);
                setSelectedFacultyEmpNo(empNo);
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          background: '#fff',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: 12,
          color: '#64748b'
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>AGENT 20</strong> — Research Productivity Intelligence Platform • Academic Agent Suite
          </div>
          <div>
            Grounded in PostgreSQL 16 • Continuous 0–100 Scale • Evaluation Parameter: <code>DATE '2024-12-31'</code>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
