import { useQuery } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import { Bot, RefreshCw, DollarSign, Zap, TrendingUp, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 95 ? 'bg-green-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AgentPerformance() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agent-performance'],
    queryFn: async () => { const r = await fetch('/api/agent-roi/performance'); return r.json(); },
    refetchInterval: 30000,
  });

  const agents = data?.agents || [];
  const totals = data?.totals || {};

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <Bot className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Agent Performance & ROI</h1>
                <p className="text-muted-foreground text-sm">Multi-agent system performance, cost tracking, and value delivery</p>
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
              <div className="grid gap-4 md:grid-cols-5 mb-6">
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Active Agents</div>
                  <div className="text-3xl font-bold">{totals.totalAgents || 11}</div>
                  <p className="text-xs text-green-600">{totals.tier0Percentage || 64}% zero-cost (Tier 0)</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Invocations</div>
                  <div className="text-3xl font-bold">{totals.totalCalls || 0}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Avg Success Rate</div>
                  <div className="text-3xl font-bold text-green-600">{totals.avgSuccessRate || 100}%</div>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Cost</div>
                  <div className="text-3xl font-bold">${totals.totalCost || '0.00'}</div>
                </CardContent></Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Est. Value Delivered</div>
                  <div className="text-3xl font-bold text-green-600">${((totals.totalValueSaved || 0) / 1000).toFixed(0)}K</div>
                  <p className="text-xs text-muted-foreground">ROI: {totals.overallROI || '∞'}x</p>
                </CardContent></Card>
              </div>

              <div className="space-y-3">
                {agents.map((agent: any) => (
                  <Card key={agent.agentKey} data-testid={`card-agent-${agent.agentKey}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-4 h-4 text-violet-500" />
                            <span className="font-semibold">{agent.agentName}</span>
                            <Badge variant="outline" className="text-xs">{agent.domain}</Badge>
                            <Badge className={agent.costTier === 'tier-0' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {agent.costTier}
                            </Badge>
                            <Badge className={agent.status === 'healthy' ? 'bg-green-100 text-green-800' : agent.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                              {agent.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-6 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Calls</span>
                              <div className="font-mono font-semibold">{agent.totalCalls}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Success</span>
                              <div className="font-mono font-semibold">{agent.successRate}%</div>
                              <ProgressBar value={agent.successRate} />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Latency</span>
                              <div className="font-mono font-semibold">{agent.avgLatencyMs}ms</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cost</span>
                              <div className="font-mono font-semibold">${agent.totalCost}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Insights</span>
                              <div className="font-mono font-semibold">{agent.insightsGenerated}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Value</span>
                              <div className="font-mono font-semibold text-green-600">${(agent.estimatedValueSaved / 1000).toFixed(0)}K</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
