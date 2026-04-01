import { useQuery } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import { DollarSign, RefreshCw, TrendingUp, ArrowRight, PieChart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

function ProgressBar({ value, max = 100, color = 'blue' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-${color}-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PortfolioInvestment() {
  const [activeTab, setActiveTab] = useState('categories');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['portfolio-investment'],
    queryFn: async () => { const r = await fetch('/api/portfolio-investment/analysis'); return r.json(); },
  });

  const categories = data?.investmentCategories || [];
  const recommendations = data?.rebalancingRecommendations || [];
  const projectROI = data?.projectROI || [];
  const frontier = data?.efficiencyFrontier || [];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Portfolio Investment Rebalancing</h1>
                <p className="text-muted-foreground text-sm">FinOps-driven investment allocation, ROI tracking, and rebalancing</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Portfolio Budget</div>
                  <div className="text-3xl font-bold">${((data?.totalBudget || 0) / 1000000).toFixed(1)}M</div>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                  <div className="text-3xl font-bold">${((data?.totalSpent || 0) / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground">{data?.budgetUtilization || 0}% utilized</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                  <div className="text-3xl font-bold">{data?.activeProjectsCount || 0}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Rebalancing Actions</div>
                  <div className="text-3xl font-bold text-blue-600">{recommendations.length}</div>
                  <p className="text-xs text-muted-foreground">AI recommendations</p>
                </CardContent></Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="categories" data-testid="tab-categories"><PieChart className="w-4 h-4 mr-2" /> Allocation</TabsTrigger>
                  <TabsTrigger value="rebalancing" data-testid="tab-rebalancing"><ArrowRight className="w-4 h-4 mr-2" /> Rebalancing</TabsTrigger>
                  <TabsTrigger value="roi" data-testid="tab-roi"><BarChart3 className="w-4 h-4 mr-2" /> Project ROI</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4">
                  {categories.map((cat: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-semibold text-lg">{cat.category}</span>
                            <span className="text-sm text-muted-foreground ml-3">{cat.projects} projects</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cat.risk === 'low' ? 'bg-green-100 text-green-800' : cat.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                              {cat.risk} risk
                            </Badge>
                            <span className="font-bold text-lg">${(cat.budgetAmount / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Allocation ({Math.round(cat.allocation * 100)}%)</div>
                            <ProgressBar value={cat.allocation * 100} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Value Score ({cat.valueScore}/100)</div>
                            <ProgressBar value={cat.valueScore} color={cat.valueScore >= 80 ? 'green' : cat.valueScore >= 60 ? 'yellow' : 'red'} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="rebalancing" className="space-y-4">
                  {recommendations.map((rec: any, i: number) => (
                    <Card key={i} className="border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className="bg-red-50 text-red-700">{rec.from}</Badge>
                          <ArrowRight className="w-4 h-4 text-blue-500" />
                          <Badge variant="outline" className="bg-green-50 text-green-700">{rec.to}</Badge>
                          <span className="font-bold text-lg ml-auto">${(rec.amount / 1000).toFixed(0)}K</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-blue-600">{rec.impact}</p>
                          <Badge variant="outline">{rec.confidence}% confidence</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="roi" className="space-y-3">
                  {projectROI.map((p: any) => (
                    <Card key={p.projectId} data-testid={`card-roi-${p.projectId}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{p.projectName}</span>
                            <Badge variant="outline" className="text-xs">{p.priority}</Badge>
                            <Badge className={p.recommendation === 'maintain' ? 'bg-green-100 text-green-800' : p.recommendation === 'monitor' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                              {p.recommendation}
                            </Badge>
                          </div>
                          <span className={`font-bold text-lg ${p.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>{p.roi > 0 ? '+' : ''}{p.roi}% ROI</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div><span className="text-muted-foreground">Budget:</span> <span className="font-mono">${(p.budget / 1000).toFixed(0)}K</span></div>
                          <div><span className="text-muted-foreground">Spent:</span> <span className="font-mono">${(p.spent / 1000).toFixed(0)}K</span></div>
                          <div><span className="text-muted-foreground">Progress:</span> <span className="font-mono">{p.progress}%</span></div>
                          <div><span className="text-muted-foreground">Efficiency:</span> <span className="font-mono">{p.efficiency}x</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
