'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { OverviewView } from '../components/OverviewView';
import { SiteAuditView } from '../components/SiteAuditView';
import { KeywordResearchView } from '../components/KeywordResearchView';
import { RankTrackingView } from '../components/RankTrackingView';
import { CompetitorsView } from '../components/CompetitorsView';
import { BacklinksView } from '../components/BacklinksView';
import { AIAssistantView } from '../components/AIAssistantView';
import { HumanizerStudioView } from '../components/HumanizerStudioView';
import { ReportsView } from '../components/ReportsView';
import { SettingsView } from '../components/SettingsView';
import { SEOAuditOrchestrator } from '../lib/seo-engine';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentDomain, setCurrentDomain] = useState<string>('acme-saas.com');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<any>(null);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const orchestrator = new SEOAuditOrchestrator();
      const report = await orchestrator.runFullAudit(currentDomain, 10);
      setAuditReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView report={auditReport} onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'site-audit':
        return <SiteAuditView report={auditReport} />;
      case 'keyword-research':
        return <KeywordResearchView />;
      case 'rank-tracking':
        return <RankTrackingView />;
      case 'competitors':
        return <CompetitorsView />;
      case 'backlinks':
        return <BacklinksView />;
      case 'ai-assistant':
        return <AIAssistantView auditReport={auditReport} />;
      case 'humanizer':
        return <HumanizerStudioView />;
      case 'reports':
        return <ReportsView report={auditReport} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView report={auditReport} onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentDomain={currentDomain} onRunAudit={handleRunAudit} isAuditing={isAuditing} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {renderActiveTabContent()}
        </main>
      </div>
    </div>
  );
}
