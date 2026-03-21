/**
 * TMO DASHBOARD
 *
 * AI Operations Hub using CustomizableDashboard.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { Repeat, Users, ChevronDown, ChevronRight, Bot, Target, Calendar, Shield, Brain, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentSidebar } from '@/components/AgentSidebar';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { CustomizableDashboard } from '@/components/CustomizableDashboard';
import { AIRecommendations } from '@/components/AIRecommendations';
import AgentActionQueue from '@/components/AgentActionQueue';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { useOntologyProjects, useDashboardMetrics } from '@/hooks/usePalantirOntology';
import { useTMOAdoptionMetrics, useTMOInitiatives } from '@/hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import { formatValueInMillions } from '@/lib/formatters';
import { getCompanyMetrics, type DataMode } from '@/lib/agentDataTransformers';

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

// Adoption Metrics Widget
function AdoptionMetricsWidget({ mode }: { mode: DataMode }) {
  const { data: adoptionMetrics = [] } = useTMOAdoptionMetrics();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Segment Adoption Rates</span>
          <Badge variant="outline" className="text-xs">From Enterprise Business Units</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(adoptionMetrics as any[]).map((metric, i) => {
            const progressPercent = (metric.adoption / metric.target) * 100;
            return (
              <div key={i} className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {expandedIdx === i ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }} />
                      <span className="font-medium text-sm">{metric.division}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-teal-600">{metric.adoption}%</span>
                      <span className="text-xs text-gray-400">/ {metric.target}%</span>
                    </div>
                  </div>
                  <Progress value={progressPercent > 100 ? 100 : progressPercent} className="h-1.5" />
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{metric.users?.toLocaleString() || 0} users</span>
                    <span className={metric.trend?.startsWith('+') ? 'text-green-600 font-medium' : 'text-red-600'}>{metric.trend}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-3 bg-gray-50">
                        <div className={`p-2 rounded border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                            <span className="text-xs font-medium">{mode === 'VRO' ? 'AI Insight' : 'Status'}</span>
                          </div>
                          <p className="text-xs text-gray-700">{metric.aiInsight || 'No insight available.'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {adoptionMetrics.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No adoption metrics available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Change Initiatives Widget
function ChangeInitiativesWidget({ mode }: { mode: DataMode }) {
  const { data: initiatives = [] } = useTMOInitiatives();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Active Change Initiatives</span>
          <Badge variant="outline" className="text-xs">From Segment Projects</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {(initiatives as any[]).map((initiative) => (
            <div key={initiative.id} className="border rounded-lg bg-white overflow-hidden transition-all hover:shadow-md">
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === initiative.id ? null : initiative.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {expandedId === initiative.id ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                    <span className="font-semibold text-base">{initiative.name}</span>
                  </div>
                  <Badge variant={
                    initiative.status === 'complete' ? 'default' :
                    initiative.status === 'at-risk' ? 'destructive' : 'secondary'
                  }>{initiative.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
                  <span>Phase: {initiative.phase}</span>
                  <span>{initiative.impactedUsers?.toLocaleString() || 0} users</span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {initiative.okrMappings?.length || 0} OKRs linked
                  </span>
                </div>
                <Progress value={initiative.progress} className="h-1.5 mt-3 ml-8" />
              </div>

              <AnimatePresence>
                {expandedId === initiative.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-4">{initiative.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500 mb-1">Cost Savings</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatValueInMillions(initiative.valueImpact?.costSavings || 0)}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500 mb-1">Revenue Impact</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatValueInMillions(initiative.valueImpact?.revenueImpact || 0)}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-gray-500 mb-1">Efficiency Gain</p>
                          <p className="text-lg font-bold text-purple-600">
                            {initiative.valueImpact?.efficiencyGain || 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {initiatives.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No initiatives available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TMODashboard() {
  const [dataMode, setDataMode] = useState<DataMode>('VRO');
  const [viewMode, setViewMode] = useState<'realtime' | 'snapshot'>('realtime');
  const { setPageContext } = usePageContext();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'tmo',
      entityName: 'AI Operations Hub',
      breadcrumb: ['Dashboard', 'TMO']
    });
  }, [setPageContext]);

  const handleDrillDown = (entityType: string, entityId: string) => {
    setDrillDownEntity({ type: entityType, id: entityId });
    setDrillDownOpen(true);
  };

  // Map widget IDs to their components
  const widgetComponents = useMemo(() => ({
    'tmo-adoption-metrics': <AdoptionMetricsWidget mode={dataMode} />,
    'tmo-change-initiatives': <ChangeInitiativesWidget mode={dataMode} />,
    'agent-action-queue': <AgentActionQueue />,
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
                <div className="p-2 bg-teal-500 rounded-lg">
                  <Repeat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">AI Operations Hub</h1>
                  <p className="text-muted-foreground">Change Management & Adoption Intelligence</p>
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
            <AgentActionQueue />
          </div>

          <div className="mb-8">
            <AIRecommendations agentType="tmo" />
          </div>

          {/* Customizable Dashboard */}
          <CustomizableDashboard
            activeTab="tmo"
            dashboardType="tmo"
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
