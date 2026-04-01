import { useQuery } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import { Network, RefreshCw, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

function HealthBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-green-500' : value >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'healthy') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'at-risk') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

export default function DependencyHealth() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dependency-health'],
    queryFn: async () => { const r = await fetch('/api/dependency-health/overview'); return r.json(); },
  });

  const deps = data?.dependencies || [];
  const alerts = data?.riskAlerts || [];
  const chains = data?.criticalChains || [];
  const projectCounts = data?.projectDependencyCounts || [];
  const typeDistribution = data?.typeDistribution || [];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Network className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Dependency Health Monitor</h1>
                <p className="text-muted-foreground text-sm">Cross-project dependency tracking with automated risk flagging</p>
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
                <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Overall Health</div>
                    <div className={`text-4xl font-bold ${(data?.overallHealth || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{data?.overallHealth || 0}%</div>
                    <HealthBar value={data?.overallHealth || 0} />
                  </CardContent>
                </Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Dependencies</div>
                  <div className="text-3xl font-bold">{data?.totalDependencies || 0}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Healthy</div>
                  <div className="text-3xl font-bold text-green-600">{data?.healthyCount || 0}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> At Risk</div>
                  <div className="text-3xl font-bold text-yellow-600">{data?.atRiskCount || 0}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Blocked</div>
                  <div className="text-3xl font-bold text-red-600">{data?.blockedCount || 0}</div>
                </CardContent></Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" data-testid="tab-overview"><Network className="w-4 h-4 mr-2" /> All Dependencies</TabsTrigger>
                  <TabsTrigger value="critical" data-testid="tab-critical"><AlertTriangle className="w-4 h-4 mr-2" /> Critical Chains</TabsTrigger>
                  <TabsTrigger value="alerts" data-testid="tab-alerts">Risk Alerts ({alerts.length})</TabsTrigger>
                  <TabsTrigger value="projects" data-testid="tab-projects">By Project</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-3">
                  {deps.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">
                      <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No dependencies tracked yet. Dependencies are auto-detected from Palantir Foundry.</p>
                    </CardContent></Card>
                  ) : (
                    deps.map((dep: any) => (
                      <Card key={dep.id} className={dep.status === 'blocked' ? 'border-red-200' : dep.status === 'at-risk' ? 'border-yellow-200' : ''}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <StatusIcon status={dep.status} />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-medium text-sm truncate">{dep.sourceProjectName}</span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm truncate">{dep.targetProjectName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">{dep.dependencyType}</Badge>
                            <Badge className={dep.criticality === 'critical' ? 'bg-red-100 text-red-800' : dep.criticality === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                              {dep.criticality}
                            </Badge>
                            <span className={`font-mono text-sm ${dep.healthScore >= 80 ? 'text-green-600' : dep.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {dep.healthScore}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="critical" className="space-y-3">
                  {chains.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">
                      <p>No critical dependency chains detected.</p>
                    </CardContent></Card>
                  ) : (
                    chains.map((dep: any) => (
                      <Card key={dep.id} className="border-red-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="font-semibold">{dep.sourceProjectName} → {dep.targetProjectName}</span>
                            </div>
                            <Badge className="bg-red-100 text-red-800">{dep.criticality}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{dep.impactIfDelayed}</p>
                          <div className="mt-2">
                            <HealthBar value={dep.healthScore} />
                            <p className="text-xs text-muted-foreground mt-1">Health: {dep.healthScore}%</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="alerts" className="space-y-3">
                  {alerts.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-30" />
                      <p>No dependency risk alerts. All dependencies are healthy.</p>
                    </CardContent></Card>
                  ) : (
                    alerts.map((alert: any, i: number) => (
                      <Card key={i} className="border-red-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="font-semibold">{alert.title}</span>
                            <Badge className={alert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}>{alert.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          <p className="text-sm text-blue-600">{alert.suggestedAction}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="projects" className="space-y-3">
                  {projectCounts.map((p: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{p.projectName}</span>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">In: <span className="font-mono font-semibold">{p.incoming}</span></span>
                            <span className="text-muted-foreground">Out: <span className="font-mono font-semibold">{p.outgoing}</span></span>
                            <span className="text-muted-foreground">Total: <span className="font-mono font-semibold">{p.total}</span></span>
                            {p.criticalDeps > 0 && <Badge className="bg-red-100 text-red-800">{p.criticalDeps} critical</Badge>}
                          </div>
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
