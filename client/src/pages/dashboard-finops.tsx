import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, DollarSign, TrendingUp, TrendingDown, PieChart,
  BarChart3, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  ChevronDown, ChevronRight, Building2, Target, Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';
import { divisions, lgCompanyOverview } from '@/lib/lgData';

type DataMode = "VRO" | "PMO";

const vroCostCategories = [
  { name: 'Technology & Digital', budget: 150, spent: 142, forecast: 148, variance: -1.3, division: 'Group Technology', savings: 12 },
  { name: 'People & Training', budget: 45, spent: 38, forecast: 43, variance: -4.4, division: 'HR', savings: 4.2 },
  { name: 'Infrastructure', budget: 32, spent: 29, forecast: 30, variance: -6.3, division: 'Operations', savings: 3.8 },
  { name: 'External Services', budget: 28, spent: 24, forecast: 26, variance: -7.1, division: 'Procurement', savings: 5.5 },
  { name: 'Operations', budget: 25, spent: 21, forecast: 23, variance: -8.0, division: 'Operations', savings: 6.0 }
];

const pmoCostCategories = [
  { name: 'Technology & Digital', budget: 150, spent: 142, forecast: 168, variance: 12.0, division: 'Group Technology', savings: 2 },
  { name: 'People & Training', budget: 45, spent: 38, forecast: 52, variance: 15.6, division: 'HR', savings: 0 },
  { name: 'Infrastructure', budget: 32, spent: 29, forecast: 38, variance: 18.8, division: 'Operations', savings: 1.2 },
  { name: 'External Services', budget: 28, spent: 31, forecast: 42, variance: 50.0, division: 'Procurement', savings: 0 },
  { name: 'Operations', budget: 25, spent: 22, forecast: 28, variance: 12.0, division: 'Operations', savings: 0.8 }
];

const vroSavingsOpportunities = [
  { area: 'Cloud Optimization', potential: 8.5, confidence: 92, status: 'validated', aiInsight: 'ML analysis identified 23% unused compute capacity', division: 'Technology' },
  { area: 'License Consolidation', potential: 4.2, confidence: 88, status: 'validated', aiInsight: 'Duplicate licenses across 12 products identified', division: 'Procurement' },
  { area: 'Process Automation', potential: 12.0, confidence: 85, status: 'in-progress', aiInsight: 'RPA can automate 340 manual workflows', division: 'Operations' },
  { area: 'Vendor Renegotiation', potential: 6.8, confidence: 90, status: 'validated', aiInsight: 'Market benchmarking shows 15% below-market opportunity', division: 'Procurement' }
];

const pmoSavingsOpportunities = [
  { area: 'Cloud Optimization', potential: 3.2, confidence: 45, status: 'pending', aiInsight: 'Manual review needed', division: 'Technology' },
  { area: 'License Consolidation', potential: 1.5, confidence: 38, status: 'pending', aiInsight: 'Spreadsheet tracking required', division: 'Procurement' },
  { area: 'Process Automation', potential: 4.0, confidence: 42, status: 'proposed', aiInsight: 'Business case under development', division: 'Operations' },
  { area: 'Vendor Renegotiation', potential: 2.0, confidence: 55, status: 'pending', aiInsight: 'Contract review scheduled', division: 'Procurement' }
];

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

function CostCategoryCard({ category, mode }: { category: typeof vroCostCategories[0], mode: DataMode }) {
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
            <p className="font-bold">£{category.budget}M</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">YTD Spend</p>
            <p className="font-bold">£{category.spent}M</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Forecast</p>
            <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>£{category.forecast}M</p>
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
                  <p className="text-xs text-gray-500">Division Owner</p>
                  <p className="font-semibold text-sm">{category.division}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Savings Identified</p>
                  <p className="font-bold text-green-600">£{category.savings}M</p>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-500" />
                  {mode === 'VRO' ? 'AI-Driven Analysis' : 'Manual Analysis'}
                </h4>
                {mode === 'VRO' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Spend pattern anomalies detected</span>
                      <Badge variant="outline" className="text-[10px]">3 findings</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Optimization opportunities</span>
                      <span className="font-bold text-green-600">£{(category.savings * 0.4).toFixed(1)}M additional</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Forecast confidence</span>
                      <span className="font-bold text-blue-600">94%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Manual quarterly review pending. Last analysis: 3 months ago.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SavingsOpportunityCard({ opportunity, mode }: { opportunity: typeof vroSavingsOpportunities[0], mode: DataMode }) {
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
            <span className="font-semibold">{opportunity.area}</span>
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
            <p className="text-2xl font-bold text-green-600">£{opportunity.potential}M</p>
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
                  <p className="text-xs text-gray-500">Division</p>
                  <p className="font-semibold text-sm">{opportunity.division}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-xs text-gray-500">Realization Timeline</p>
                  <p className="font-semibold text-sm">{mode === 'VRO' ? '3-6 months' : '12-18 months'}</p>
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-purple-800">
                  <Bot className="h-4 w-4 text-purple-500" />
                  AI Insight
                </h4>
                <p className="text-sm text-gray-700">{opportunity.aiInsight}</p>
              </div>

              {mode === 'VRO' && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded border text-center">
                    <p className="text-xs text-gray-500">Implementation</p>
                    <p className="font-bold text-green-600">Low Risk</p>
                  </div>
                  <div className="bg-white p-2 rounded border text-center">
                    <p className="text-xs text-gray-500">ROI</p>
                    <p className="font-bold text-blue-600">4.2x</p>
                  </div>
                  <div className="bg-white p-2 rounded border text-center">
                    <p className="text-xs text-gray-500">Payback</p>
                    <p className="font-bold text-purple-600">8 months</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FinOpsDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");
  
  const costCategories = dataMode === 'VRO' ? vroCostCategories : pmoCostCategories;
  const savingsOpportunities = dataMode === 'VRO' ? vroSavingsOpportunities : pmoSavingsOpportunities;

  const totalBudget = costCategories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = costCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalForecast = costCategories.reduce((sum, c) => sum + c.forecast, 0);
  const totalSavings = savingsOpportunities.reduce((sum, s) => sum + s.potential, 0);
  const utilizationRate = Math.round((totalSpent / totalBudget) * 100);
  const forecastVariance = ((totalForecast - totalBudget) / totalBudget) * 100;

  const totalProfit = divisions.reduce((sum, d) => sum + d.profit2024, 0);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />
      
      <div className="flex">
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">FinOps Agent</h1>
                <p className="text-muted-foreground">Cost Optimization & Financial Analytics</p>
              </div>
              <Badge className="ml-4 bg-green-100 text-green-700">Active</Badge>
              <Badge variant="outline" className="ml-2">{dataMode} Mode</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Budget</p>
                    <p className="text-2xl font-bold text-blue-600">£{totalBudget}M</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">FY 2025 allocation</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">YTD Spend</p>
                    <p className="text-2xl font-bold text-green-600">£{totalSpent}M</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{utilizationRate}% utilized</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Forecast</p>
                    <p className={`text-2xl font-bold ${forecastVariance > 0 ? 'text-amber-600' : 'text-green-600'}`}>£{totalForecast}M</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-amber-200" />
                </div>
                <p className={`text-xs mt-2 ${forecastVariance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {forecastVariance > 0 ? '+' : ''}{forecastVariance.toFixed(1)}% vs budget
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Savings Identified</p>
                    <p className="text-2xl font-bold text-purple-600">£{totalSavings.toFixed(1)}M</p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{savingsOpportunities.length} opportunities</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Group Profit</p>
                    <p className="text-2xl font-bold text-blue-600">£{totalProfit}M</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">2024 actual</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Cost Categories</span>
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
                  <Badge variant="outline" className="text-xs">Click to expand</Badge>
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
              <CardTitle className="text-lg">Division Financial Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {divisions.map((division) => (
                  <Link key={division.id} href={`/division/${division.id}`}>
                    <div 
                      className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                      style={{ borderLeftColor: division.color, borderLeftWidth: '4px' }}
                    >
                      <p className="text-sm font-medium text-gray-500">{division.name}</p>
                      <p className="text-2xl font-bold" style={{ color: division.color }}>£{division.profit2024}M</p>
                      <div className="flex items-center gap-1 mt-1">
                        {division.changePercent >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${division.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {division.changePercent >= 0 ? '+' : ''}{division.changePercent}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{division.ceo}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <CrossAgentCollaboration />
        </main>
      </div>
    </div>
  );
}
