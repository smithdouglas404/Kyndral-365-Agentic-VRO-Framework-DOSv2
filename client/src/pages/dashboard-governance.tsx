import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, Clock, AlertOctagon,
  Users, ChevronDown, ChevronRight, Bot,
  TrendingUp, TrendingDown, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { AlertBubble } from '@/components/AlertBubble';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import { riskData } from '@/lib/lgData';
import { useSimulation } from '@/contexts/SimulationContext';
import { useAgentData } from '@/hooks/useAgentData';
import { 
  getGovernanceItemsFromRiskData,
  getRiskMetricsFromDivisions,
  getCompanyMetrics,
  type DataMode,
  type TransformedGovernanceItem
} from '@/lib/agentDataTransformers';
import { AIRecommendations } from "@/components/AIRecommendations";

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[#005EB8] tracking-tight cursor-pointer whitespace-nowrap">NextEra Energy</div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[#005EB8]">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

function GovernanceItemCard({ item, mode }: { item: TransformedGovernanceItem, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'default';
      case 'in-review': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`governance-item-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-semibold">{item.title}</span>
          </div>
          <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 ml-6">
          <span className={`px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>{item.priority}</span>
          <span>Due: {item.dueDate}</span>
          <span>Owner: {item.owner}</span>
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-semibold text-sm capitalize">{item.type}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Completion Status</p>
                  <p className={`font-semibold text-sm ${item.completionTime.includes('ahead') ? 'text-green-600' : item.completionTime.includes('Delayed') ? 'text-red-600' : 'text-blue-600'}`}>
                    {item.completionTime}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border mb-4">
                <p className="text-xs text-gray-500">Related Risks</p>
                <p className="font-semibold text-sm">{item.relatedRisks} high-severity risks in category</p>
              </div>
              
              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI Assistance' : 'Manual Process'}
                </h4>
                <p className="text-sm text-gray-700">{item.aiStatus}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RiskCategoryCard({ category }: { category: typeof riskData.categories[0] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`risk-category-${category.id}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <Shield className="h-5 w-5" style={{ color: category.color }} />
            <span className="font-semibold">{category.name}</span>
          </div>
          <Badge variant="outline">{category.subRisks?.length || 0} sub-risks</Badge>
        </div>
        <p className="text-xs text-gray-500 ml-9">{category.subtitle}</p>
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
              <div className="space-y-3">
                {category.subRisks?.map((subRisk, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{subRisk.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          subRisk.severity === 'high' ? 'destructive' :
                          subRisk.severity === 'medium' ? 'secondary' : 'outline'
                        } className="text-[10px]">
                          {subRisk.severity}
                        </Badge>
                        {subRisk.trend === 'improving' ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : subRisk.trend === 'worsening' ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <span className="text-xs text-gray-400">stable</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{subRisk.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GovernanceDashboard() {
  const { dataMode, setDataMode, viewMode, setViewMode } = useSimulation();
  const { setPageContext } = usePageContext();
  const liveData = useAgentData('governance');
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  // Update page context for Ask PM
  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'governance',
      entityName: 'Risk & Governance Console',
      breadcrumb: ['Dashboard', 'Governance']
    });
  }, [setPageContext]);

  const handleDrillDown = (entityType: string, entityId: string) => {
    setDrillDownEntity({ type: entityType, id: entityId });
    setDrillDownOpen(true);
  };
  
  const governanceItems = getGovernanceItemsFromRiskData(dataMode);
  const riskMetrics = getRiskMetricsFromDivisions(dataMode);
  const companyMetrics = getCompanyMetrics();
  
  const completedCount = governanceItems.filter(i => i.status === 'complete').length;
  const pendingCount = governanceItems.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Risk & Governance Console</h1>
                  <p className="text-muted-foreground">Compliance, Risk & Decision Intelligence</p>
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
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'governance-decisions')} data-testid="metric-decisions">
              {liveData.metrics.activeAlerts > 0 && (
                <AlertBubble count={liveData.metrics.activeAlerts} severity="warning" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Decisions Complete</p>
                    <p className="text-2xl font-bold text-green-600">{completedCount}/{governanceItems.length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
                <Progress value={(completedCount / governanceItems.length) * 100} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'governance-pending')} data-testid="metric-pending">
              {(liveData.metrics.pendingActions > 0 || pendingCount > 0) && (
                <AlertBubble count={liveData.metrics.pendingActions || pendingCount} severity="warning" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Pending Actions</p>
                    <p className="text-2xl font-bold text-amber-600">{liveData.metrics.pendingActions || pendingCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{(liveData.metrics.pendingActions || pendingCount) > 0 ? 'Requires attention' : 'All clear'}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'governance-compliance')} data-testid="metric-compliance">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Compliance Score</p>
                    <p className="text-2xl font-bold text-green-600">{liveData.metrics.avgConfidence || riskMetrics.complianceScore}%</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">FCA aligned</p>
              </CardContent>
            </Card>
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'governance-high-risks')} data-testid="metric-high-risks">
              {(liveData.metrics.atRiskProjects > 0 || riskMetrics.high > 0) && (
                <AlertBubble count={liveData.metrics.atRiskProjects || riskMetrics.high} severity="critical" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">High Risks</p>
                    <p className="text-2xl font-bold text-red-600">{liveData.metrics.atRiskProjects || riskMetrics.high}</p>
                  </div>
                  <AlertOctagon className="h-8 w-8 text-red-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Actively monitored</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'governance-cro')} data-testid="metric-cro">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">CRO</p>
                    <p className="text-lg font-bold text-blue-600">{companyMetrics.cro}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Chief Risk Officer</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <AIRecommendations agentType="governance" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Governance Queue</span>
                  <Badge variant="outline" className="text-xs">Click to expand</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {governanceItems.map((item, i) => (
                    <GovernanceItemCard key={i} item={item} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Risk Categories</span>
                  <Badge variant="outline" className="text-xs">From NextEra Risk Framework</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskData.categories.slice(0, 5).map((category) => (
                    <RiskCategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Three Lines of Defence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {riskData.threeLines.map((line) => (
                  <div key={line.line} className="p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                        {line.line}
                      </div>
                      <h4 className="font-semibold">{line.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{line.role}</p>
                    <p className="text-xs text-gray-500">{line.accountable}</p>
                  </div>
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
