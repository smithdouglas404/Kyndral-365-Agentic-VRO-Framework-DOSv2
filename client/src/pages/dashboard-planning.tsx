import { useState, useEffect } from 'react';
import { usePlanningMilestones, usePlanningRoadmap } from "@/hooks/useDashboardData";
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle2, Flag,
  ChevronRight, ChevronDown, BarChart3, Target, Bot,
  TrendingUp, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { AlertBubble } from '@/components/AlertBubble';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { useDivisions } from '@/hooks/useNexteraData';
import { useProjects } from '@/hooks/useDashboardData';
import { useAgentData } from '@/hooks/useAgentData';
import { 
  getCompanyMetrics,
  type DataMode,
  type TransformedMilestone,
  type TransformedDeadline
} from '@/lib/agentDataTransformers';
import { AIRecommendations } from "@/components/AIRecommendations";
import AgentActionQueue from "@/components/AgentActionQueue";

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

function MilestoneCard({ milestone, mode }: { milestone: TransformedMilestone, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'upcoming': return 'bg-purple-500';
      case 'at-risk': return 'bg-red-500';
      case 'planned': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const budgetVariance = milestone.budget.actual > 0 
    ? ((milestone.budget.actual - milestone.budget.planned) / milestone.budget.planned) * 100 
    : 0;

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`milestone-${milestone.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <div className={`w-3 h-3 rounded-full ${getStatusColor(milestone.status)}`} />
            <span className="font-semibold">{milestone.name}</span>
          </div>
          <Badge variant={
            milestone.status === 'complete' ? 'default' :
            milestone.status === 'in-progress' ? 'secondary' :
            milestone.status === 'at-risk' ? 'destructive' : 'outline'
          }>
            {milestone.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 ml-7 mb-2">
          <span>{milestone.startDate} → {milestone.endDate}</span>
          <span className="font-bold text-indigo-600">{milestone.progress}%</span>
        </div>
        <Progress value={milestone.progress} className="h-2 ml-7" />
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
                  {milestone.deliverables.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Planned Budget</p>
                  <p className="font-bold text-blue-600">${milestone.budget.planned}M</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Actual Spend</p>
                  <p className={`font-bold ${budgetVariance > 10 ? 'text-red-600' : budgetVariance < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                    ${milestone.budget.actual.toFixed(1)}M
                    {milestone.budget.actual > 0 && (
                      <span className="text-xs ml-1">
                        ({budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(0)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Reportable Segment</p>
                  <p className="font-bold text-gray-700">{milestone.division}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI Insight' : 'Status Update'}
                </h4>
                <p className="text-sm text-gray-700">{milestone.aiInsight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeadlineCard({ deadline, mode }: { deadline: TransformedDeadline, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`deadline-${deadline.task.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-medium text-sm">{deadline.task}</span>
          </div>
          <Badge variant={
            deadline.status === 'complete' ? 'default' :
            deadline.status === 'on-track' ? 'secondary' :
            deadline.status === 'at-risk' ? 'destructive' : 'outline'
          } className="text-[10px]">
            {deadline.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 ml-6 mt-1">
          <span>{deadline.date}</span>
          <span>{deadline.owner}</span>
        </div>
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
            <div className="p-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white p-2 rounded border">
                  <p className="text-xs text-gray-500">Reportable Segment</p>
                  <p className="font-medium text-sm">{deadline.division}</p>
                </div>
                <div className="bg-white p-2 rounded border">
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="font-medium text-sm">{deadline.owner}</p>
                </div>
              </div>
              <div className={`p-2 rounded border ${mode === 'VRO' ? 'bg-blue-50 border-blue-100' : 'bg-gray-100'}`}>
                <p className="text-xs text-gray-500">AI Prediction</p>
                <p className="font-medium text-sm">{deadline.aiPrediction}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlanningDashboard() {
  const [dataMode, setDataMode] = useState<'VRO' | 'PMO'>('VRO');
  const [viewMode, setViewMode] = useState<'realtime' | 'snapshot'>('realtime');
  const { setPageContext } = usePageContext();
  const liveData = useAgentData('planning');
  const { data: divisions = [] } = useDivisions();
  const { data: projectsData } = useProjects();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  // Update page context for Ask PM
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
  
  
  const completedPhases = milestones.filter(m => m.status === 'complete').length;
  const currentPhase = milestones.find(m => m.status === 'in-progress');
  const overallProgress = Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length);
  const totalBudget = milestones.reduce((sum, m) => sum + m.budget.planned, 0);
  const totalSpent = milestones.reduce((sum, m) => sum + m.budget.actual, 0);
  
  const onTrackDeadlines = deadlines.filter(d => d.status === 'on-track' || d.status === 'complete').length;
  const atRiskDeadlines = deadlines.filter(d => d.status === 'at-risk').length;

  const allProjects = projectsData?.projects || [];
  const inProgressProjects = allProjects.filter((p: any) => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar />
        
        <main className="flex-1 px-8 py-8">
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'planning-phase')} data-testid="metric-phase">
              {liveData.metrics.activeAlerts > 0 && (
                <AlertBubble count={liveData.metrics.activeAlerts} severity="warning" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Current Phase</p>
                    <p className="text-2xl font-bold text-indigo-600">{completedPhases + 1}/{milestones.length}</p>
                  </div>
                  <Flag className="h-8 w-8 text-indigo-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{currentPhase?.name.replace('Phase ', '').split(':')[1]?.trim() || 'Development'}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'planning-progress')} data-testid="metric-progress">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Overall Progress</p>
                    <p className="text-2xl font-bold text-green-600">{liveData.metrics.avgConfidence || overallProgress}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-200" />
                </div>
                <Progress value={liveData.metrics.avgConfidence || overallProgress} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'planning-budget')} data-testid="metric-budget">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Budget Status</p>
                    <p className="text-2xl font-bold text-blue-600">${liveData.metrics.realizedValue || totalSpent.toFixed(1)}M</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">of ${liveData.metrics.totalValue || totalBudget}M planned</p>
              </CardContent>
            </Card>
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'planning-deadlines')} data-testid="metric-deadlines">
              {(liveData.metrics.atRiskProjects > 0 || atRiskDeadlines > 0) && (
                <AlertBubble count={liveData.metrics.atRiskProjects || atRiskDeadlines} severity="critical" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Deadlines On Track</p>
                    <p className="text-2xl font-bold text-green-600">{onTrackDeadlines}/{deadlines.length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
                {(liveData.metrics.atRiskProjects || atRiskDeadlines) > 0 && (
                  <p className="text-xs text-red-600 mt-2">{liveData.metrics.atRiskProjects || atRiskDeadlines} at risk</p>
                )}
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'planning-projects')} data-testid="metric-projects">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active Projects</p>
                    <p className="text-2xl font-bold text-purple-600">{liveData.metrics.totalProjects || inProgressProjects}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">across group functions</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
          <div className="mb-8">
            <AgentActionQueue />
          </div>

            <AIRecommendations agentType="planning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Program Roadmap</span>
                  <Badge variant="outline" className="text-xs">From Segment Projects</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.map((milestone, i) => (
                    <MilestoneCard key={i} milestone={milestone} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Upcoming Deadlines</span>
                  <Badge variant="outline" className="text-xs">Click to expand</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadlines.map((deadline, i) => (
                    <DeadlineCard key={i} deadline={deadline} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Reportable Segments Projects Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {divisions.map((segment) => {
                  const segmentProjects = allProjects.filter((p: any) => p.businessUnitId === segment.id);
                  const activeProjects = segmentProjects.filter((p: any) => p.status === 'active');
                  const highPriProjects = segmentProjects.filter((p: any) => p.priority === 'high');

                  return (
                  <Link key={segment.id} href={`/segment/${segment.id}`}>
                    <div
                      className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                      style={{ borderLeftColor: segment.color || '#666', borderLeftWidth: '4px' }}
                    >
                      <p className="text-sm font-medium text-gray-500">{segment.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl font-bold" style={{ color: segment.color || '#333' }}>
                          {segmentProjects.length}
                        </span>
                        <span className="text-sm text-gray-500">projects</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {activeProjects.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {activeProjects.length} active
                          </Badge>
                        )}
                        {highPriProjects.length > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            {highPriProjects.length} high priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                )})}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Cross-Agent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CrossAgentActivityFeed maxItems={5} compact />
            </CardContent>
          </Card>

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
