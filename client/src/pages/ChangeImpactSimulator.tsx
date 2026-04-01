import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import { Zap, Play, AlertTriangle, ArrowRight, RefreshCw, Shield, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-600 text-white', high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800', low: 'bg-blue-100 text-blue-800',
  };
  return <Badge className={colors[severity] || colors.low}>{severity}</Badge>;
}

export default function ChangeImpactSimulator() {
  const [selectedProject, setSelectedProject] = useState('');
  const [changeType, setChangeType] = useState('schedule-delay');
  const [delayDays, setDelayDays] = useState('14');
  const [budgetImpact, setBudgetImpact] = useState('100000');

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => { const r = await fetch('/api/projects'); return r.json(); },
  });

  const projects = (projectsData?.projects || projectsData || []).filter((p: any) =>
    !p.name?.startsWith('[') && p.status !== 'completed' && p.status !== 'cancelled'
  );

  const simulationMutation = useMutation({
    mutationFn: async (params: any) => {
      const r = await fetch('/api/cross-project/what-if-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return r.json();
    },
  });

  const cascadeMutation = useMutation({
    mutationFn: async (params: any) => {
      const r = await fetch('/api/cross-project/cascade-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return r.json();
    },
  });

  const handleSimulate = () => {
    if (!selectedProject) return;
    const params = {
      projectId: selectedProject,
      changeType,
      delayDays: changeType === 'schedule-delay' ? parseInt(delayDays) : undefined,
      budgetImpact: changeType === 'budget-overrun' ? parseInt(budgetImpact) : undefined,
      description: `What-if: ${changeType} on ${projects.find((p: any) => p.id === selectedProject)?.name}`,
    };
    simulationMutation.mutate(params);
    cascadeMutation.mutate(params);
  };

  const result = simulationMutation.data;
  const cascade = cascadeMutation.data;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Change Impact Simulator</h1>
              <p className="text-muted-foreground text-sm">Model what-if scenarios and predict cascade effects across the portfolio</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Scenario Configuration</CardTitle>
                <CardDescription>Select a project and model a change</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger data-testid="select-project"><SelectValue placeholder="Select project..." /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Change Type</Label>
                  <Select value={changeType} onValueChange={setChangeType}>
                    <SelectTrigger data-testid="select-change-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule-delay">Schedule Delay</SelectItem>
                      <SelectItem value="budget-overrun">Budget Overrun</SelectItem>
                      <SelectItem value="scope-change">Scope Change</SelectItem>
                      <SelectItem value="resource-unavailable">Resource Loss</SelectItem>
                      <SelectItem value="cancellation">Project Cancellation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {changeType === 'schedule-delay' && (
                  <div>
                    <Label>Delay (days)</Label>
                    <Input type="number" value={delayDays} onChange={e => setDelayDays(e.target.value)} data-testid="input-delay" />
                  </div>
                )}
                {changeType === 'budget-overrun' && (
                  <div>
                    <Label>Budget Impact ($)</Label>
                    <Input type="number" value={budgetImpact} onChange={e => setBudgetImpact(e.target.value)} data-testid="input-budget" />
                  </div>
                )}
                <Button onClick={handleSimulate} disabled={!selectedProject || simulationMutation.isPending} className="w-full" data-testid="button-simulate">
                  {simulationMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Run Simulation
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {!result && !cascade && (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Configure a scenario and click "Run Simulation" to see cascade impacts.</p>
                  </CardContent>
                </Card>
              )}

              {(result || cascade) && (
                <>
                  {cascade?.portfolioImpact && (
                    <Card className="border-orange-200">
                      <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> Portfolio Impact Summary</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="text-sm text-muted-foreground">Projects Affected</div>
                            <div className="text-2xl font-bold">{cascade.portfolioImpact.totalProjectsAffected}</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Total Delay</div>
                            <div className="text-2xl font-bold text-red-600">{cascade.portfolioImpact.totalDelayDays}d</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" /> Cost Impact</div>
                            <div className="text-2xl font-bold text-yellow-600">${(cascade.portfolioImpact.totalCostImpact / 1000).toFixed(0)}K</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-sm text-muted-foreground">Risk Increase</div>
                            <div className="text-2xl font-bold text-orange-600">+{cascade.portfolioImpact.portfolioRiskIncrease}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {cascade?.directImpacts?.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Direct Impacts (1st Order)</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {cascade.directImpacts.map((impact: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <ArrowRight className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{impact.projectName}</span>
                                <SeverityBadge severity={impact.severity} />
                                <Badge variant="outline" className="text-xs">{impact.impactType}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{impact.description}</p>
                              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                {impact.scheduleDelayDays && <span>+{impact.scheduleDelayDays} days delay</span>}
                                {impact.budgetImpact && <span>${(impact.budgetImpact / 1000).toFixed(0)}K cost</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {cascade?.cascadeImpacts?.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Cascade Impacts (2nd+ Order)</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {cascade.cascadeImpacts.map((impact: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                            <ArrowRight className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{impact.projectName}</span>
                                <SeverityBadge severity={impact.severity} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{impact.description}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {cascade?.recommendations?.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4 text-blue-500" /> AI Recommendations</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {cascade.recommendations.map((rec: any, i: number) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{rec.title || rec.action}</span>
                              <Badge variant="outline" className="text-xs">{rec.priority || rec.impact}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.description || rec.rationale}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {result && !cascade?.directImpacts && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Simulation Result</CardTitle></CardHeader>
                      <CardContent>
                        <pre className="text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-lg overflow-auto max-h-96">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
