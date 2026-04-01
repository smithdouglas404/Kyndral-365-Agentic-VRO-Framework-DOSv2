import { useQuery } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import { Users, RefreshCw, Heart, TrendingUp, AlertTriangle, GraduationCap, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

function SentimentBar({ value, label }: { value: number; label?: string }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 55 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-mono">{value}%</span></div>}
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default function StakeholderSentiment() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stakeholder-sentiment'],
    queryFn: async () => { const r = await fetch('/api/stakeholder-sentiment/overview'); return r.json(); },
  });

  const groups = data?.stakeholderGroups || [];
  const readiness = data?.changeReadiness || {};
  const hotspots = data?.resistanceHotspots || [];
  const training = data?.trainingStatus || {};
  const adoption = data?.adoptionCurve || [];
  const timeline = data?.sentimentTimeline || [];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Stakeholder Sentiment Tracker</h1>
                <p className="text-muted-foreground text-sm">Change adoption, readiness assessment, and resistance monitoring</p>
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
                <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Overall Sentiment</div>
                    <div className={`text-4xl font-bold ${(data?.overallSentiment || 0) >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>{data?.overallSentiment || 0}%</div>
                    <SentimentBar value={data?.overallSentiment || 0} />
                  </CardContent>
                </Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Adoption Rate</div>
                  <div className="text-3xl font-bold">{data?.overallAdoption || 0}%</div>
                  <SentimentBar value={data?.overallAdoption || 0} />
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Stakeholders</div>
                  <div className="text-3xl font-bold">{data?.totalStakeholders || 0}</div>
                  <p className="text-xs text-muted-foreground">{groups.length} groups tracked</p>
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Training Completion</div>
                  <div className="text-3xl font-bold">{training.averageCompletion || 0}%</div>
                  <p className="text-xs text-muted-foreground">{training.certifiedUsers || 0}/{training.totalUsers || 0} certified</p>
                </CardContent></Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" data-testid="tab-overview"><Users className="w-4 h-4 mr-2" /> Groups</TabsTrigger>
                  <TabsTrigger value="readiness" data-testid="tab-readiness"><BarChart3 className="w-4 h-4 mr-2" /> ADKAR Readiness</TabsTrigger>
                  <TabsTrigger value="resistance" data-testid="tab-resistance"><AlertTriangle className="w-4 h-4 mr-2" /> Resistance ({hotspots.length})</TabsTrigger>
                  <TabsTrigger value="training" data-testid="tab-training"><GraduationCap className="w-4 h-4 mr-2" /> Training</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-3">
                  {groups.map((g: any, i: number) => (
                    <Card key={i} data-testid={`card-group-${i}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-semibold">{g.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({g.size} people)</span>
                          </div>
                          <Badge className={g.sentiment >= 75 ? 'bg-green-100 text-green-800' : g.sentiment >= 55 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                            {g.sentiment}% sentiment
                          </Badge>
                        </div>
                        <div className="grid gap-2">
                          <SentimentBar value={g.sentiment} label="Sentiment" />
                          <SentimentBar value={g.adoption} label="Adoption" />
                          <SentimentBar value={g.engagement} label="Engagement" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="readiness" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>ADKAR Change Readiness Model</CardTitle>
                      <CardDescription>Prosci ADKAR framework assessment across the organization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(readiness).map(([key, value]) => (
                        <div key={key}>
                          <SentimentBar value={value as number} label={key.charAt(0).toUpperCase() + key.slice(1)} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Adoption Curve</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {adoption.map((point: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="w-16 text-muted-foreground">{point.month}</span>
                            <div className="flex-1">
                              <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute h-full bg-blue-500 rounded-full" style={{ width: `${point.adoption}%` }} />
                                <div className="absolute h-full border-r-2 border-dashed border-green-500" style={{ left: `${point.target}%` }} />
                              </div>
                            </div>
                            <span className="w-16 text-right font-mono">{point.adoption}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resistance" className="space-y-3">
                  {hotspots.map((h: any, i: number) => (
                    <Card key={i} className={h.severity === 'high' ? 'border-red-200' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${h.severity === 'high' ? 'text-red-500' : h.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                            <span className="font-semibold">{h.area}</span>
                            <Badge className={h.severity === 'high' ? 'bg-red-100 text-red-800' : h.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>{h.severity}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{h.stakeholders} stakeholders</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2"><strong>Root Cause:</strong> {h.reason}</p>
                        <p className="text-sm text-blue-600"><strong>Mitigation:</strong> {h.mitigation}</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="training" className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>Training Progress</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{training.completedModules}</div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{training.inProgressModules}</div>
                          <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="text-2xl font-bold">{training.notStartedModules}</div>
                          <div className="text-xs text-muted-foreground">Not Started</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{training.certifiedUsers}/{training.totalUsers}</div>
                          <div className="text-xs text-muted-foreground">Certified</div>
                        </div>
                      </div>
                      <SentimentBar value={training.averageCompletion || 0} label="Overall Completion" />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
