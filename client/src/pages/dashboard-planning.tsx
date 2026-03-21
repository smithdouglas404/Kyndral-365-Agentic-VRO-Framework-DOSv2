/**
 * PLANNING DASHBOARD
 *
 * Strategic Planning console using CustomizableDashboard.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { Calendar, Bot, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentSidebar } from '@/components/AgentSidebar';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { AIRecommendations } from '@/components/AIRecommendations';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { useOntologyProjects, useDashboardMetrics } from '@/hooks/usePalantirOntology';
import { usePlanningMilestones, usePlanningRoadmap } from '@/hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import type { DataMode, TransformedMilestone, TransformedDeadline } from '@/lib/agentDataTransformers';

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

// Milestone Card Component
function MilestoneCard({ milestone, mode }: { milestone: TransformedMilestone; mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'upcoming': return 'bg-purple-500';
      case 'at-risk': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <div className={`w-3 h-3 rounded-full ${getStatusColor(milestone.status)}`} />
            <span className="font-semibold">{milestone.name || milestone.milestone}</span>
          </div>
          <Badge variant={
            milestone.status === 'complete' ? 'default' :
            milestone.status === 'in-progress' ? 'secondary' :
            milestone.status === 'at-risk' ? 'destructive' : 'outline'
          }>{milestone.status}</Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 ml-7 mb-2">
          <span>{milestone.startDate || 'TBD'} → {milestone.endDate || 'TBD'}</span>
          <span className="font-bold text-indigo-600">{milestone.progress || 0}%</span>
        </div>
        <Progress value={milestone.progress || 0} className="h-2 ml-7" />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50">
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">Deliverables</h4>
                <div className="flex flex-wrap gap-2">
                  {(milestone.deliverables || []).map((d: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI Insight' : 'Status Update'}
                </h4>
                <p className="text-sm text-gray-700">{milestone.aiInsight || 'No AI insight available.'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Milestones Widget
function MilestonesWidget({ mode }: { mode: DataMode }) {
  const { data: milestonesData = [] } = usePlanningMilestones();

  const milestones: TransformedMilestone[] = (milestonesData as any[]).map((m: any, i: number) => ({
    ...m,
    name: m.name || m.milestone || `Phase ${i + 1}`,
    startDate: m.startDate || new Date().toISOString().split('T')[0],
    endDate: m.endDate || m.dueDate?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: m.progress ?? (m.status === 'complete' ? 100 : m.status === 'in-progress' ? 50 : 0),
    budget: m.budget || { planned: 5 + i * 2, actual: 4 + i * 1.5 },
    deliverables: m.deliverables || ['Requirements', 'Documentation', 'Testing'],
    division: m.division || m.project || 'General',
    aiInsight: m.aiInsight || 'AI analysis pending for this milestone.',
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Program Roadmap</span>
          <Badge variant="outline" className="text-xs">From Segment Projects</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {milestones.map((milestone, i) => (
            <MilestoneCard key={i} milestone={milestone} mode={mode} />
          ))}
          {milestones.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No milestones available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Resource Allocation Widget
function ResourceAllocationWidget({ mode }: { mode: DataMode }) {
  const { data: palantirMetrics } = useDashboardMetrics();
  const { data: projects = [] } = useOntologyProjects();

  return (
    <Card className="h-full border-purple-200 bg-gradient-to-r from-purple-50/30 to-indigo-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Resource Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {palantirMetrics ? (
          <div className="grid grid-cols-5 gap-3">
            <div className="text-center p-2 bg-white rounded border">
              <p className="text-lg font-bold text-indigo-600">{palantirMetrics.totalProjects}</p>
              <p className="text-[10px] text-gray-500">Total Projects</p>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <p className="text-lg font-bold text-green-600">{palantirMetrics.onTrackProjects}</p>
              <p className="text-[10px] text-gray-500">On Track</p>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <p className="text-lg font-bold text-amber-600">{palantirMetrics.atRiskProjects}</p>
              <p className="text-[10px] text-gray-500">At Risk</p>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <p className="text-lg font-bold text-red-600">{palantirMetrics.delayedProjects}</p>
              <p className="text-[10px] text-gray-500">Delayed</p>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <p className="text-lg font-bold text-purple-600">{Math.round(palantirMetrics.avgProgress)}%</p>
              <p className="text-[10px] text-gray-500">Avg Progress</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No metrics available</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlanningDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>('VRO');
  const [viewMode, setViewMode] = useState<'realtime' | 'snapshot'>('realtime');
  const { setPageContext } = usePageContext();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'planning',
      entityName: 'Strategic Planning Console',
      breadcrumb: ['Dashboard', 'Planning']
    });
  }, [setPageContext]);

  const handleDrillDown = (entityType: string, entityId: string) => {
    setDrillDownEntity({ type: entityType, id: entityId });
    setDrillDownOpen(true);
  };

  // Map widget IDs to their components
  const widgetComponents = useMemo(() => ({
    'planning-milestones': <MilestonesWidget mode={dataMode} />,
    'planning-resource-allocation': <ResourceAllocationWidget mode={dataMode} />,
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
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Strategic Planning Console</h1>
                  <p className="text-muted-foreground">Capacity Command & Planning Intelligence</p>
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
            <AIRecommendations agentType="planning" />
          </div>

          {/* Customizable Dashboard */}
          <CustomizableDashboard
            activeTab="planning"
            dashboardType="planning"
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
