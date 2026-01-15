import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, CheckCircle2, TrendingUp, AlertTriangle,
  ChevronRight, ChevronDown, Bot, DollarSign,
  Building2, Repeat, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { AlertBubble } from '@/components/AlertBubble';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { divisions } from '@/lib/lgData';
import { useSimulation } from '@/contexts/SimulationContext';
import { useAgentData } from '@/hooks/useAgentData';
import { 
  getObjectivesFromDivisions,
  getCompanyMetrics,
  type DataMode,
  type TransformedObjective
} from '@/lib/agentDataTransformers';
import { AIRecommendations } from "@/components/AIRecommendations";

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[#005EB8] tracking-tight cursor-pointer whitespace-nowrap">Legal & General</div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[#005EB8]">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

function ObjectiveCard({ objective, mode }: { objective: TransformedObjective, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden" data-testid={`objective-card-${objective.id}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid={`objective-toggle-${objective.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              objective.status === 'ahead' ? 'bg-green-500' :
              objective.status === 'on-track' ? 'bg-blue-500' : 'bg-amber-500'
            }`}>
              {objective.progress}%
            </div>
            <div>
              <h3 className="font-semibold text-base">{objective.title}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {objective.division}
                </span>
                <span>{objective.owner}</span>
                <span className="flex items-center gap-1 text-green-600">
                  <DollarSign className="h-3 w-3" />
                  ${objective.totalValueImpact.costSavings + objective.totalValueImpact.revenueImpact}M value
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={
              objective.status === 'ahead' ? 'default' :
              objective.status === 'on-track' ? 'secondary' : 'destructive'
            }>
              {objective.status}
            </Badge>
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
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
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-white p-3 rounded-lg border flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Cost Savings</p>
                    <p className="font-bold text-green-600">${objective.totalValueImpact.costSavings}M</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Revenue Impact</p>
                    <p className="font-bold text-blue-600">${objective.totalValueImpact.revenueImpact}M</p>
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-sm mb-3">Key Results & Linked Initiatives</h4>
              <div className="space-y-4">
                {objective.keyResults.map((kr, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{kr.title}</span>
                      <span className="text-sm font-bold text-orange-600">{kr.progress}%</span>
                    </div>
                    <Progress value={kr.progress} className="h-1.5 mb-2" />
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Current: {kr.current}</span>
                      <span>Target: {kr.target}</span>
                    </div>
                    
                    {kr.linkedInitiatives.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          Contributing Initiatives
                        </p>
                        <div className="space-y-2">
                          {kr.linkedInitiatives.map((init, j) => (
                            <div key={j} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-100">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-orange-800">{init.name}</span>
                                  <Badge variant={
                                    init.status === 'complete' ? 'default' :
                                    init.status === 'at-risk' ? 'destructive' : 'secondary'
                                  } className="text-[10px]">
                                    {init.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                  <span>{init.division}</span>
                                  <span>Phase: {init.phase}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-orange-600">+{init.contribution}%</span>
                                <p className="text-[10px] text-green-600">{init.valueImpact}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {kr.linkedInitiatives.length === 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 italic">No initiatives linked to this key result</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-500" />
                  Collaborating Agents
                </h4>
                <div className="flex flex-wrap gap-2">
                  {objective.collaboratingAgents.map((agent, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                      <div className={`w-2 h-2 rounded-full ${mode === 'VRO' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="font-medium text-sm text-purple-800">{agent.agentName}</span>
                      <span className="text-xs text-gray-500">{agent.lastSync}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function OKRDashboard() {
  const { dataMode, setDataMode, viewMode, setViewMode } = useSimulation();
  const { setPageContext } = usePageContext();
  const liveData = useAgentData('okr');
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  // Update page context for Ask PM
  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'okr',
      entityName: 'Strategy Alignment Console',
      breadcrumb: ['Dashboard', 'OKR']
    });
  }, [setPageContext]);

  const handleDrillDown = (entityType: string, entityId: string) => {
    setDrillDownEntity({ type: entityType, id: entityId });
    setDrillDownOpen(true);
  };
  
  const objectives = getObjectivesFromDivisions(dataMode);

  const avgProgress = Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length);
  const totalValue = objectives.reduce((sum, o) => sum + o.totalValueImpact.costSavings + o.totalValueImpact.revenueImpact, 0);
  const totalInitiatives = objectives.reduce((sum, o) => 
    sum + o.keyResults.reduce((s, kr) => s + kr.linkedInitiatives.length, 0), 0);
  
  const aheadCount = objectives.filter(o => o.status === 'ahead').length;
  const onTrackCount = objectives.filter(o => o.status === 'on-track').length;
  const atRiskCount = objectives.filter(o => o.status === 'at-risk').length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Strategy Alignment Console</h1>
                  <p className="text-muted-foreground">OKR Command & Strategic Intelligence</p>
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

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'okr-progress')} data-testid="metric-progress">
              {liveData.metrics.activeAlerts > 0 && (
                <AlertBubble count={liveData.metrics.activeAlerts} severity="warning" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Overall Progress</p>
                    <p className="text-2xl font-bold text-orange-600">{liveData.metrics.avgConfidence || avgProgress}%</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-200" />
                </div>
                <Progress value={liveData.metrics.avgConfidence || avgProgress} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'okr-value')} data-testid="metric-value">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">${liveData.metrics.totalValue || totalValue}M</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">across all OKRs</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'okr-ahead')} data-testid="metric-ahead">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Ahead</p>
                    <p className="text-2xl font-bold text-green-600">{aheadCount}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">exceeding targets</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'okr-on-track')} data-testid="metric-on-track">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">On Track</p>
                    <p className="text-2xl font-bold text-blue-600">{onTrackCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">meeting targets</p>
              </CardContent>
            </Card>
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'okr-at-risk')} data-testid="metric-at-risk">
              {(liveData.metrics.atRiskProjects > 0 || atRiskCount > 0) && (
                <AlertBubble count={liveData.metrics.atRiskProjects || atRiskCount} severity="critical" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">At Risk</p>
                    <p className="text-2xl font-bold text-amber-600">{liveData.metrics.atRiskProjects || atRiskCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">needs attention</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'okr-initiatives')} data-testid="metric-initiatives">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Linked Initiatives</p>
                    <p className="text-2xl font-bold text-purple-600">{liveData.metrics.totalProjects || totalInitiatives}</p>
                  </div>
                  <Repeat className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">contributing</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <AIRecommendations agentType="okr" />
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Strategic Objectives from L&G Group Functions</h2>
              <Badge variant="outline" className="text-xs">Click to expand for initiative details</Badge>
            </div>
            {objectives.map((objective) => (
              <ObjectiveCard key={objective.id} objective={objective} mode={dataMode} />
            ))}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Group Function OKRs Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {divisions.slice(0, 4).map((division) => (
                  <Link key={division.id} href={`/division/${division.id}`}>
                    <div 
                      className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                      style={{ borderLeftColor: division.color, borderLeftWidth: '4px' }}
                    >
                      <p className="text-sm font-medium text-gray-500">{division.name}</p>
                      <div className="mt-2 space-y-2">
                        {division.okrs.slice(0, 2).map((okr, i) => (
                          <div key={i} className="text-xs">
                            <p className="font-medium text-gray-700">{okr.objective}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-gray-500">{okr.keyResults.length} KRs</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">Due: {okr.dueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
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
