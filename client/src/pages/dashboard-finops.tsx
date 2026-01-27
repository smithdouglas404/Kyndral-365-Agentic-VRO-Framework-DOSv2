import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { usePageContext } from "@/contexts/PageContext";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, DollarSign, TrendingUp, PieChart,
  BarChart3, ChevronDown, ChevronRight, Building2, Bot,
  ArrowUpRight, ArrowDownRight, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { CrossAgentActivityFeed } from '@/components/CrossAgentActivityFeed';
import { AlertBubble } from '@/components/AlertBubble';
import { DrillDownDrawer } from '@/components/DrillDownDrawer';
import AgentActionQueue from '@/components/AgentActionQueue';
import { useDivisions } from '@/hooks/useNexteraData';
import { formatMoney } from '@/lib/formatters';
import { useAgentData } from '@/hooks/useAgentData';
import {
  getCompanyMetrics,
  type DataMode
} from '@/lib/agentDataTransformers';
import { useCostCategories, useSavingsOpportunities, type CostCategory, type SavingsOpportunity } from '@/hooks/useFinOpsData';
import { AIRecommendations } from "@/components/AIRecommendations";
import { useFinancialInsights } from "@/hooks/useAgentInsights";

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

function CostCategoryCard({ category, mode }: { category: CostCategory, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);
  const isOverBudget = category.variance > 0;

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`cost-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-semibold">{category.name}</span>
          </div>
          <Badge variant={isOverBudget ? 'destructive' : 'default'}>
            {isOverBudget ? '+' : ''}{category.variance.toFixed(1)}%
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="font-bold">${category.budget}M</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">YTD Spend</p>
            <p className="font-bold">${category.spent}M</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Forecast</p>
            <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>${category.forecast}M</p>
          </div>
        </div>
        <Progress value={(category.spent / category.budget) * 100} className="h-1.5 mt-3" />
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
                  <p className="text-xs text-gray-500">Segment Owner</p>
                  <p className="font-semibold text-sm">{category.division}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Savings Identified</p>
                  <p className="font-bold text-green-600">${category.savings}M</p>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg border ${mode === 'VRO' ? 'bg-purple-50 border-purple-100' : 'bg-gray-100 border-gray-200'}`}>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${mode === 'VRO' ? 'text-purple-500' : 'text-gray-400'}`} />
                  {mode === 'VRO' ? 'AI-Driven Analysis' : 'Manual Analysis'}
                </h4>
                <p className="text-sm text-gray-700">{category.aiInsight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SavingsOpportunityCard({ opportunity, mode }: { opportunity: TransformedSavingsOpportunity, mode: DataMode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-all">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`savings-${opportunity.area.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-semibold text-sm">{opportunity.area}</span>
          </div>
          <Badge variant={
            opportunity.status === 'validated' ? 'default' :
            opportunity.status === 'in-progress' ? 'secondary' : 'outline'
          }>
            {opportunity.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-green-600">${opportunity.potential.toFixed(1)}M</p>
            <p className="text-xs text-gray-500">potential savings</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">{opportunity.confidence}%</p>
            <p className="text-xs text-gray-500">confidence</p>
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Reportable Segment</p>
                  <p className="font-semibold text-sm">{opportunity.division}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Payback Period</p>
                  <p className="font-semibold text-sm">{opportunity.paybackMonths} months</p>
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-purple-800">
                  <Bot className="h-4 w-4 text-purple-500" />
                  AI Insight
                </h4>
                <p className="text-sm text-gray-700">{opportunity.aiInsight}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-500">ROI</p>
                  <p className="font-bold text-blue-600">{opportunity.roi.toFixed(1)}x</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-500">Implementation</p>
                  <p className="font-bold text-green-600">{mode === 'VRO' ? 'Low Risk' : 'Medium Risk'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FinOpsDashboard() {
  const [dataMode, setDataMode] = useState<'VRO' | 'PMO'>('VRO');
  const [viewMode, setViewMode] = useState<'realtime' | 'snapshot'>('realtime');
  const { setPageContext } = usePageContext();
  const liveData = useAgentData('finops');
  const { data: divisions = [], isLoading: divisionsLoading } = useDivisions();
  const { data: financialInsights, isLoading: insightsLoading } = useFinancialInsights();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState({ type: '', id: '' });

  // Update page context for Ask PM
  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'finops',
      entityName: 'FinOps Intelligence Center',
      breadcrumb: ['Dashboard', 'FinOps']
    });
  }, [setPageContext]);

  const handleDrillDown = (entityType: string, entityId: string) => {
    setDrillDownEntity({ type: entityType, id: entityId });
    setDrillDownOpen(true);
  };
  
  const { data: costCategories = [], isLoading: costLoading } = useCostCategories();
  const { data: savingsOpportunities = [], isLoading: savingsLoading } = useSavingsOpportunities();
  const companyMetrics = getCompanyMetrics();

  // Use agent-calculated insights if available, fallback to static data
  const agentMetrics = financialInsights?.aggregated;
  const totalBudget = agentMetrics?.totalBAC || costCategories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = agentMetrics?.totalAC || costCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalEV = agentMetrics?.totalEV || 0;
  const totalPV = agentMetrics?.totalPV || 0;
  const totalForecast = agentMetrics?.totalEAC || costCategories.reduce((sum, c) => sum + c.forecast, 0);
  const avgCPI = agentMetrics?.avgCPI || 1.0;
  const avgSPI = agentMetrics?.avgSPI || 1.0;
  const portfolioHealth = agentMetrics?.portfolioHealth || 0;
  const totalSavings = savingsOpportunities.reduce((sum, s) => sum + s.potential, 0);
  const utilizationRate = Math.round((totalSpent / totalBudget) * 100);
  const forecastVariance = ((totalForecast - totalBudget) / totalBudget) * 100;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">FinOps Intelligence Center</h1>
                  <p className="text-muted-foreground">Cost Optimization & Financial Analytics</p>
                </div>
                <Badge className="ml-4 bg-green-100 text-green-700 gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
                <Badge variant="outline" className="ml-2">{dataMode} Mode</Badge>
                {financialInsights && (
                  <Badge variant="default" className="ml-2 bg-purple-600">
                    <Brain className="h-3 w-3 mr-1" />
                    Agent EVM
                  </Badge>
                )}
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
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'finops-budget')} data-testid="metric-budget">
              {liveData.metrics.activeAlerts > 0 && (
                <AlertBubble count={liveData.metrics.activeAlerts} severity="warning" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Budget</p>
                    <p className="text-2xl font-bold text-blue-600">${liveData.metrics.totalValue || totalBudget}M</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">FY 2025 allocation</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'finops-spend')} data-testid="metric-spend">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">YTD Spend</p>
                    <p className="text-2xl font-bold text-green-600">${liveData.metrics.realizedValue || totalSpent}M</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{utilizationRate}% utilized</p>
              </CardContent>
            </Card>
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'finops-forecast')} data-testid="metric-forecast">
              {forecastVariance > 5 && (
                <AlertBubble severity="warning" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Forecast</p>
                    <p className={`text-2xl font-bold ${forecastVariance > 0 ? 'text-amber-600' : 'text-green-600'}`}>${totalForecast}M</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-amber-200" />
                </div>
                <p className={`text-xs mt-2 ${forecastVariance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {forecastVariance > 0 ? '+' : ''}{forecastVariance.toFixed(1)}% vs budget
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'finops-savings')} data-testid="metric-savings">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Savings Identified</p>
                    <p className="text-2xl font-bold text-purple-600">${totalSavings.toFixed(1)}M</p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{liveData.metrics.totalProjects || savingsOpportunities.length} opportunities</p>
              </CardContent>
            </Card>
            <Card className="relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDrillDown('metric', 'finops-profit')} data-testid="metric-profit">
              {liveData.metrics.atRiskProjects > 0 && (
                <AlertBubble count={liveData.metrics.atRiskProjects} severity="critical" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Group Profit</p>
                    <p className="text-2xl font-bold text-blue-600">${companyMetrics.totalProfit}M</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">2024 actual</p>
              </CardContent>
            </Card>
          </div>

          {/* Agent-Calculated EVM Metrics */}
          {financialInsights && (
            <Card className="mb-8 border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Agent-Calculated EVM Metrics
                  <Badge variant="outline" className="ml-2 text-xs">
                    Real-time from FinancialCalculationEngine
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Cost Performance Index</p>
                    <p className={`text-2xl font-bold ${avgCPI >= 0.95 ? 'text-green-600' : avgCPI >= 0.85 ? 'text-amber-600' : 'text-red-600'}`}>
                      {avgCPI.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {avgCPI >= 1.0 ? 'Under budget' : avgCPI >= 0.85 ? 'Acceptable' : 'Over budget'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Schedule Performance Index</p>
                    <p className={`text-2xl font-bold ${avgSPI >= 0.95 ? 'text-green-600' : avgSPI >= 0.85 ? 'text-amber-600' : 'text-red-600'}`}>
                      {avgSPI.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {avgSPI >= 1.0 ? 'Ahead of schedule' : avgSPI >= 0.85 ? 'Acceptable' : 'Behind schedule'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Earned Value (EV)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${(totalEV / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Value of work completed
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Portfolio Health</p>
                    <p className={`text-2xl font-bold ${portfolioHealth >= 0.8 ? 'text-green-600' : portfolioHealth >= 0.6 ? 'text-amber-600' : 'text-red-600'}`}>
                      {(portfolioHealth * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Projects with CPI ≥ 0.95
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Total Projects Analyzed</p>
                      <p className="font-semibold">{agentMetrics?.totalProjects || 0} projects</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs mb-1">Data Source</p>
                      <p className="font-semibold text-purple-600">FinOps Agent Engine</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8">
            <AgentActionQueue />
          </div>

          <div className="mb-8">
            <AIRecommendations agentType="finops" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Reportable Segments Cost Performance</span>
                  <Badge variant="outline" className="text-xs">Click to expand</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costCategories.map((category, i) => (
                    <CostCategoryCard key={i} category={category} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Savings Opportunities</span>
                  <Badge variant="outline" className="text-xs">From Segment Projects</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savingsOpportunities.map((opportunity, i) => (
                    <SavingsOpportunityCard key={i} opportunity={opportunity} mode={dataMode} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Reportable Segments Financial Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {divisionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {divisions.map((segment) => (
                  <Link key={segment.id} href={`/segment/${segment.id}`}>
                    <div
                      className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                      style={{ borderLeftColor: segment.color || '#666', borderLeftWidth: '4px' }}
                    >
                      <p className="text-sm font-medium text-gray-500">{segment.name}</p>
                      <p className="text-2xl font-bold" style={{ color: segment.color || '#333' }}>{formatMoney(segment.profit2024 ?? 0)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {(segment.changePercent ?? 0) >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${(segment.changePercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(segment.changePercent ?? 0) >= 0 ? '+' : ''}{segment.changePercent ?? 0}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{segment.ceo ?? 'N/A'}</p>
                    </div>
                  </Link>
                ))}
              </div>
              )}
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
