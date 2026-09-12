import React, { useEffect, useState } from 'react';
import { dashboardService, facultyService, departmentService } from '../services/api';
import type { InstitutionOverview, FacultyMember, DepartmentInfo } from '../services/types';
import { HeroEcosystem } from '../components/webgl/HeroEcosystem';
import { FloatingKpiCards } from '../components/dashboard/FloatingKpiCards';
import { DepartmentPerformanceCard } from '../components/dashboard/DepartmentPerformanceCard';
import { TopResearchersCard } from '../components/dashboard/TopResearchersCard';
import { ResearchTrendsCard } from '../components/dashboard/ResearchTrendsCard';
import { AssistantSpotlightCard } from '../components/dashboard/AssistantSpotlightCard';
import { WifiOff } from 'lucide-react';

interface DashboardProps {
  onSelectFaculty: (empNo: string) => void;
  onSelectDepartment: (code: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectFaculty,
  onSelectDepartment,
  onNavigateTab,
  onOpenAssistantWithPrompt
}) => {
  const [overview, setOverview] = useState<InstitutionOverview | null>(null);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, fac, dept] = await Promise.all([
          dashboardService.getOverview(),
          facultyService.getFaculty(),
          departmentService.getDepartments()
        ]);
        setOverview(ov);
        setFacultyList(fac?.faculty || []);
        setDepartments(dept || []);
        setApiError(false);
      } catch (err) {
        console.warn('Backend API connection unavailable, displaying empty/unconnected state:', err);
        setApiError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
        <div className="pulse-dot" style={{ margin: '0 auto 16px', width: 12, height: 12 }} />
        <span>Connecting to Academic Research Intelligence Engine...</span>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* API Unconnected Notice Banner */}
      {apiError && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            color: '#92400e'
          }}
        >
          <WifiOff size={16} color="#d97706" />
          <div>
            <strong>Research data service unavailable.</strong> Platform is in real-data mode awaiting Teammate-1 API connection at <code>http://localhost:8000/api/v1</code>. No fabricated records are displayed.
          </div>
        </div>
      )}

      {/* 1. Hero Section with Interactive Three.js WebGL Ecosystem */}
      <div className="reveal-on-scroll revealed">
        <HeroEcosystem
          facultyList={facultyList}
          departments={departments}
          onSelectFaculty={onSelectFaculty}
          onSelectDepartment={onSelectDepartment}
        />
      </div>

      {/* 2. Floating Institutional KPI Summary Cards */}
      <div className="reveal-on-scroll revealed">
        <FloatingKpiCards overview={overview} />
      </div>

      {/* 3. Department Performance & Discipline Equity Grid */}
      <div className="reveal-on-scroll">
        <DepartmentPerformanceCard
          departments={departments}
          onSelectDepartment={onSelectDepartment}
        />
      </div>

      {/* 4. Top Researchers Leaderboard */}
      <div className="reveal-on-scroll">
        <TopResearchersCard
          topResearchers={overview?.top_researchers || []}
          onSelectFaculty={onSelectFaculty}
          onViewAllFaculty={() => onNavigateTab('faculty')}
        />
      </div>

      {/* 5. 5-Year Research Trends */}
      <div className="reveal-on-scroll">
        <ResearchTrendsCard trends={overview?.annual_trends || []} />
      </div>

      {/* 6. AI Research Assistant Spotlight Card */}
      <div className="reveal-on-scroll">
        <AssistantSpotlightCard
          onOpenAssistant={() => onNavigateTab('assistant')}
          onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
        />
      </div>
    </div>
  );
};

