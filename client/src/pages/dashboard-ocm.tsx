/**
 * OCM DASHBOARD
 *
 * Organizational Change Management console using CustomizableDashboard.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { Users, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AgentSidebar } from '@/components/AgentSidebar';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AIRecommendations } from '@/components/AIRecommendations';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { useOCMReadiness, useOCMStakeholders } from '@/hooks/useDashboardData';
import type { DataMode, TransformedReadinessMetric, TransformedStakeholderGroup } from '@/lib/agentDataTransformers';

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[#005EB8] tracking-tight cursor-pointer whitespace-nowrap">Enterprise</div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[#005EB8]">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

// Simple Change Readiness Widget
function ChangeReadinessWidget({ mode }: { mode: DataMode }) {
  const { data: readinessData = [] } = useOCMReadiness();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Change Readiness (ADKAR)</span>
          <Badge variant="outline" className="text-xs">Assessment</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(readinessData as TransformedReadinessMetric[]).map((metric, i) => (
            <div key={i} className="p-3 border rounded-lg bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{metric.category}</span>
                <span className="text-lg font-bold text-pink-600">{metric.score}%</span>
              </div>
              <Progress value={Math.min((metric.score / metric.target) * 100, 100)} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
            </div>
          ))}
          {readinessData.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No readiness data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Stakeholder Groups Widget
function StakeholderGroupsWidget({ mode }: { mode: DataMode }) {
  const { data: stakeholderData = [] } = useOCMStakeholders();

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-700';
      case 'neutral': return 'bg-gray-100 text-gray-700';
      case 'mixed': return 'bg-amber-100 text-amber-700';
      case 'negative': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Stakeholder Groups</span>
          <Badge variant="outline" className="text-xs">Engagement</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(stakeholderData as TransformedStakeholderGroup[]).map((group, i) => (
            <div key={i} className="p-3 border rounded-lg bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{group.name}</span>
                <Badge className={getSentimentColor(group.sentiment)}>{group.sentiment}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{group.count.toLocaleString()} people</span>
                <span className="font-bold text-blue-600">{group.engagement}% engaged</span>
              </div>
              <Progress value={group.engagement} className="h-1.5 mt-2" />
            </div>
          ))}
          {stakeholderData.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No stakeholder data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OCMDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>('VRO');
  const [viewMode, setViewMode] = useState<'realtime' | 'snapshot'>('realtime');
  const { setPageContext } = usePageContext();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'ocm',
      entityName: 'OCM Intelligence Console',
      breadcrumb: ['Dashboard', 'OCM']
    });
  }, [setPageContext]);

  const handleDrillDown = (entityType: string, entityId: string) => {
    setDrillDownEntity({ type: entityType, id: entityId });
    setDrillDownOpen(true);
  };

  // Map widget IDs to their components
  const widgetComponents = useMemo(() => ({
    'ocm-change-readiness': <ChangeReadinessWidget mode={dataMode} />,
    'ocm-stakeholder-groups': <StakeholderGroupsWidget mode={dataMode} />,
    'cross-agent-collaboration': <CrossAgentActivityFeed maxItems={5} compact />,
  }), [dataMode]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />

      <div className="flex">
        <AgentSidebar />

        <main className="flex-1 px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">OCM Intelligence Console</h1>
                  <p className="text-muted-foreground">OCM Intelligence & Adoption Operations</p>
                </div>
                <Badge className="ml-4 bg-green-100 text-green-700 gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
                <Badge variant="outline" className="ml-2">{dataMode} Mode</Badge>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('realtime')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'realtime' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}
                  data-testid="btn-realtime"
                >
                  Real-time
                </button>
                <button
                  onClick={() => setViewMode('snapshot')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'snapshot' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                  data-testid="btn-snapshot"
                >
                  30-Day Snapshot
                </button>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="mb-8">
            <AIRecommendations agentType="ocm" />
          </div>

          {/* Customizable Dashboard */}
          <CustomizableDashboard
            activeTab="ocm"
            dashboardType="ocm"
            widgetComponents={widgetComponents}
            onDrillDown={handleDrillDown}
          />

          {/* Cross-Agent Collaboration */}
          <CrossAgentCollaboration />
        </main>
      </div>

      <DrillDownDrawer
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        entityType={drillDownEntity.type}
        entityId={drillDownEntity.id}
      />
    </div>
  );
}
