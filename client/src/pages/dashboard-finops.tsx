import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Calculator, DollarSign, TrendingUp, TrendingDown, PieChart,
  BarChart3, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AgentSidebar } from '@/components/AgentSidebar';
import { CrossAgentCollaboration } from '@/components/CrossAgentCollaboration';

type DataMode = "VRO" | "PMO";

const costCategories = [
  { name: 'Technology & Digital', budget: 150, spent: 142, forecast: 158, variance: 5.3 },
  { name: 'People & Training', budget: 45, spent: 38, forecast: 44, variance: -2.2 },
  { name: 'Infrastructure', budget: 32, spent: 29, forecast: 31, variance: -3.1 },
  { name: 'External Services', budget: 28, spent: 31, forecast: 35, variance: 25.0 },
  { name: 'Operations', budget: 25, spent: 22, forecast: 24, variance: -4.0 }
];

const savingsOpportunities = [
  { area: 'Cloud Optimization', potential: 8.5, confidence: 92, status: 'validated' },
  { area: 'License Consolidation', potential: 4.2, confidence: 88, status: 'in-review' },
  { area: 'Process Automation', potential: 12.0, confidence: 78, status: 'validated' },
  { area: 'Vendor Renegotiation', potential: 6.8, confidence: 85, status: 'pending' }
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

export default function FinOpsDashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("VRO");

  const totalBudget = costCategories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = costCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalForecast = costCategories.reduce((sum, c) => sum + c.forecast, 0);
  const utilizationRate = Math.round((totalSpent / totalBudget) * 100);

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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                    <p className="text-2xl font-bold text-amber-600">£{totalForecast}M</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-xs text-amber-600 mt-2">+{Math.round(((totalForecast - totalBudget) / totalBudget) * 100)}% over budget</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Savings Identified</p>
                    <p className="text-2xl font-bold text-purple-600">£31.5M</p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-gray-500 mt-2">4 opportunities</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costCategories.map((category, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{category.name}</span>
                        <div className="flex items-center gap-1">
                          {category.variance > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`text-sm font-bold ${category.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {category.variance > 0 ? '+' : ''}{category.variance}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>Budget: £{category.budget}M</span>
                        <span>Spent: £{category.spent}M</span>
                        <span>Forecast: £{category.forecast}M</span>
                      </div>
                      <Progress value={(category.spent / category.budget) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Savings Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {savingsOpportunities.map((opp, i) => (
                    <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{opp.area}</span>
                        <Badge variant={
                          opp.status === 'validated' ? 'default' :
                          opp.status === 'in-review' ? 'secondary' : 'outline'
                        }>
                          {opp.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">£{opp.potential}M</span>
                        <span className="text-xs text-gray-500">{opp.confidence}% confidence</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <CrossAgentCollaboration />
        </main>
      </div>
    </div>
  );
}
