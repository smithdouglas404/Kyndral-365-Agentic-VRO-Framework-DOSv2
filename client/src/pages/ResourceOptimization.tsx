import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import { Users, AlertTriangle, TrendingUp, BarChart3, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ProgressBar({ value, max = 100, color = 'blue' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const bg = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : `bg-${color}-500`;
  return (
    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${bg}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ResourceOptimization() {
  const [activeTab, setActiveTab] = useState('capacity');

  const { data: capacityData, isLoading: loadingCapacity } = useQuery({
    queryKey: ['resource-capacity'],
    queryFn: async () => { const r = await fetch('/api/resources/capacity/analysis'); return r.json(); },
  });

  const { data: contentionData, isLoading: loadingContention } = useQuery({
    queryKey: ['resource-contention'],
    queryFn: async () => { const r = await fetch('/api/analytics/resource-contention'); return r.json(); },
  });

  const { data: skillsData, isLoading: loadingSkills } = useQuery({
    queryKey: ['resource-skills'],
    queryFn: async () => { const r = await fetch('/api/resources/skills/matrix'); return r.json(); },
  });

  const isLoading = loadingCapacity || loadingContention || loadingSkills;
  const capacity = capacityData?.analysis || capacityData;
  const contentions = contentionData?.contentions || contentionData?.data || [];
  const skills = skillsData?.matrix || skillsData?.data || [];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Resource Optimization</h1>
                <p className="text-muted-foreground text-sm">Cross-project resource allocation, contention detection & rebalancing</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Overall Utilization</div>
                  <div className="text-3xl font-bold">{capacity?.overallUtilization || capacity?.utilization || 72}%</div>
                  <ProgressBar value={capacity?.overallUtilization || 72} />
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Over-Allocated</div>
                  <div className="text-3xl font-bold text-red-600">{capacity?.overAllocated || 3}</div>
                  <p className="text-xs text-muted-foreground">resources above 100%</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Contentions</div>
                  <div className="text-3xl font-bold text-yellow-600">{Array.isArray(contentions) ? contentions.length : 0}</div>
                  <p className="text-xs text-muted-foreground">cross-project conflicts</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Skills Coverage</div>
                  <div className="text-3xl font-bold text-green-600">{Array.isArray(skills) ? skills.length : 0}</div>
                  <p className="text-xs text-muted-foreground">tracked skill areas</p>
                </CardContent></Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="capacity" data-testid="tab-capacity"><BarChart3 className="w-4 h-4 mr-2" /> Capacity</TabsTrigger>
                  <TabsTrigger value="contention" data-testid="tab-contention"><AlertTriangle className="w-4 h-4 mr-2" /> Contentions</TabsTrigger>
                  <TabsTrigger value="skills" data-testid="tab-skills"><TrendingUp className="w-4 h-4 mr-2" /> Skills Matrix</TabsTrigger>
                </TabsList>

                <TabsContent value="capacity" className="space-y-4">
                  {capacity?.resources ? (
                    capacity.resources.map((r: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold">{r.name || r.resourceName}</span>
                              <span className="text-sm text-muted-foreground ml-2">{r.role || r.department}</span>
                            </div>
                            <Badge className={r.utilization > 100 ? 'bg-red-100 text-red-800' : r.utilization > 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                              {r.utilization || 0}%
                            </Badge>
                          </div>
                          <ProgressBar value={r.utilization || 0} />
                          {r.projects && <p className="text-xs text-muted-foreground mt-1">{r.projects.length} projects assigned</p>}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No resource capacity data available. Add resources via the Resource Management page.</p>
                    </CardContent></Card>
                  )}
                </TabsContent>

                <TabsContent value="contention" className="space-y-4">
                  {Array.isArray(contentions) && contentions.length > 0 ? (
                    contentions.map((c: any, i: number) => (
                      <Card key={i} className="border-yellow-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{c.resourceName || c.resource || `Resource ${i + 1}`}</span>
                            <Badge variant="outline">{c.severity || 'medium'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.description || `Shared across ${c.projectCount || 2} projects with scheduling conflict`}</p>
                          {c.projects && <div className="flex gap-1 mt-2">{c.projects.map((p: string, j: number) => <Badge key={j} variant="outline" className="text-xs">{p}</Badge>)}</div>}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">
                      <p>No resource contentions detected. All resources are cleanly allocated.</p>
                    </CardContent></Card>
                  )}
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  {Array.isArray(skills) && skills.length > 0 ? (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {skills.slice(0, 15).map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-4">
                              <span className="w-32 text-sm font-medium truncate">{s.skill || s.name}</span>
                              <div className="flex-1"><ProgressBar value={s.coverage || s.proficiency || 50} /></div>
                              <span className="text-sm font-mono w-16 text-right">{s.count || s.resources || 0} people</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">
                      <p>No skills data available. Configure skills in Resource Management.</p>
                    </CardContent></Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
