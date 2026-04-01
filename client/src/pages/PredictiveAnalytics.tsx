import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgentSidebar } from '@/components/AgentSidebar';
import {
  TrendingUp, TrendingDown, Minus, Activity, Target, BarChart3,
  AlertTriangle, Lightbulb, Shield, DollarSign, Clock, RefreshCw,
  ChevronDown, ChevronUp, Zap, ArrowUpRight, ArrowDownRight,
  Brain, Gauge, PieChart,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrendDataPoint {
  date: string;
  value: number;
  isProjected: boolean;
  confidence?: number;
}

interface TrendLine {
  metric: string;
  label: string;
  unit: string;
  current: number;
  projected: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'stable' | 'declining';
  historical: TrendDataPoint[];
  forecast: TrendDataPoint[];
}

interface ProactiveInsight {
  id: string;
  category: 'risk' | 'opportunity' | 'warning' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  predictedImpact: string;
  timeHorizon: string;
  confidence: number;
  affectedProjects: string[];
  suggestedAction: string;
  agent: string;
}

interface OKRTrajectory {
  objectiveId: string;
  objectiveName: string;
  currentProgress: number;
  projectedProgress: number;
  targetProgress: number;
  onTrack: boolean;
  trajectory: 'ahead' | 'on-track' | 'at-risk' | 'behind';
  projectedCompletionDate: string;
  keyResults: { name: string; current: number; target: number; projected: number; trend: string }[];
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-yellow-500" />;
}

function TrendBadge({ trend }: { trend: string }) {
  const colors = {
    improving: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    stable: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    declining: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return <Badge className={colors[trend as keyof typeof colors] || colors.stable}>{trend}</Badge>;
}

function TrajectoryBadge({ trajectory }: { trajectory: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    'ahead': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: ArrowUpRight },
    'on-track': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Minus },
    'at-risk': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertTriangle },
    'behind': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: ArrowDownRight },
  };
  const { color, icon: Icon } = config[trajectory] || config['on-track'];
  return <Badge className={color}><Icon className="w-3 h-3 mr-1" />{trajectory}</Badge>;
}

function InsightIcon({ category }: { category: string }) {
  if (category === 'risk') return <Shield className="w-4 h-4 text-red-500" />;
  if (category === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  if (category === 'opportunity') return <Lightbulb className="w-4 h-4 text-green-500" />;
  return <Zap className="w-4 h-4 text-blue-500" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  return <Badge className={colors[severity] || colors.low}>{severity}</Badge>;
}

function MiniSparkline({ data, className = '' }: { data: TrendDataPoint[]; className?: string }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 160;
  const height = 40;
  const padding = 4;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const historicalCount = data.filter(d => !d.isProjected).length;
  const historicalPoints = points.split(' ').slice(0, historicalCount).join(' ');
  const forecastPoints = points.split(' ').slice(Math.max(0, historicalCount - 1)).join(' ');

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      {historicalPoints && <polyline points={historicalPoints} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500" />}
      {forecastPoints && <polyline points={forecastPoints} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" className="text-blue-400 opacity-60" />}
    </svg>
  );
}

function ProgressBar({ value, target, projected, className = '' }: { value: number; target: number; projected?: number; className?: string }) {
  const pct = Math.min(100, (value / target) * 100);
  const projPct = projected ? Math.min(100, (projected / target) * 100) : undefined;
  return (
    <div className={`relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div className="absolute h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      {projPct !== undefined && (
        <div className="absolute h-full bg-blue-300 opacity-40 rounded-full" style={{ width: `${projPct}%` }} />
      )}
    </div>
  );
}

function ScoreGauge({ score, label, projected, trend }: { score: number; label: string; projected?: number; trend?: string }) {
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-blue-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';
  const bgColor = score >= 80 ? 'from-green-500/10' : score >= 60 ? 'from-blue-500/10' : score >= 40 ? 'from-yellow-500/10' : 'from-red-500/10';

  return (
    <div className={`relative p-6 rounded-xl bg-gradient-to-br ${bgColor} to-transparent border`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        {trend && <TrendBadge trend={trend} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${color}`} data-testid={`score-${label.toLowerCase().replace(/\s/g, '-')}`}>{score}</span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
      {projected !== undefined && projected !== score && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Projected:</span>
          <span className={`font-semibold ${projected > score ? 'text-green-600' : projected < score ? 'text-red-600' : ''}`}>
            {projected}
          </span>
          {projected !== score && (
            <span className={`text-xs ${projected > score ? 'text-green-600' : 'text-red-600'}`}>
              ({projected > score ? '+' : ''}{projected - score})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function PredictiveAnalytics() {
  const [horizon, setHorizon] = useState('90d');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const { data: combined, isLoading, refetch } = useQuery({
    queryKey: ['trend-forecast-combined', horizon],
    queryFn: async () => {
      const res = await fetch(`/api/trend-forecast/combined?horizon=${horizon}`);
      if (!res.ok) throw new Error('Failed to fetch forecast');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const vro = combined?.vro;
  const pmo = combined?.pmo;
  const insights: ProactiveInsight[] = combined?.proactiveInsights || [];
  const summary = combined?.summary;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex">
        <AgentSidebar />
        <main className="flex-1 px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Predictive Analytics</h1>
                <p className="text-muted-foreground text-sm">
                  VRO/PMO trend forecasting with proactive insights powered by multi-agent analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger className="w-36" data-testid="select-horizon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="60d">60 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Generating forecasts...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <ScoreGauge score={summary.portfolioValueScore} label="Value Score" projected={summary.projectedValueScore} trend={summary.valueTrend} />
                  <ScoreGauge score={summary.portfolioHealthScore} label="Health Score" projected={summary.projectedHealthScore} trend={summary.healthTrend} />
                  <Card data-testid="card-insight-summary">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground font-medium">Proactive Insights</span>
                        <Lightbulb className="w-5 h-5 text-yellow-500 opacity-50" />
                      </div>
                      <div className="text-3xl font-bold">{summary.totalInsights}</div>
                      <div className="flex gap-2 mt-2">
                        {summary.criticalInsights > 0 && <Badge variant="destructive">{summary.criticalInsights} critical</Badge>}
                        {summary.highInsights > 0 && <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{summary.highInsights} high</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-forecast-generated">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground font-medium">Forecast Horizon</span>
                        <Clock className="w-5 h-5 text-purple-500 opacity-50" />
                      </div>
                      <div className="text-3xl font-bold">{horizon === '30d' ? '30' : horizon === '60d' ? '60' : '90'}<span className="text-lg font-normal text-muted-foreground ml-1">days</span></div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Generated {combined?.generatedAt ? new Date(combined.generatedAt).toLocaleTimeString() : 'now'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" data-testid="tab-overview">
                    <BarChart3 className="w-4 h-4 mr-2" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="vro" data-testid="tab-vro">
                    <Target className="w-4 h-4 mr-2" /> VRO Trends
                  </TabsTrigger>
                  <TabsTrigger value="pmo" data-testid="tab-pmo">
                    <Activity className="w-4 h-4 mr-2" /> PMO Trends
                  </TabsTrigger>
                  <TabsTrigger value="okr" data-testid="tab-okr">
                    <Gauge className="w-4 h-4 mr-2" /> OKR Trajectory
                  </TabsTrigger>
                  <TabsTrigger value="insights" data-testid="tab-insights">
                    <Lightbulb className="w-4 h-4 mr-2" /> Insights ({insights.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {vro?.trendLines?.map((line: TrendLine) => (
                      <TrendCard key={line.metric} line={line} />
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pmo?.trendLines?.map((line: TrendLine) => (
                      <TrendCard key={line.metric} line={line} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="vro" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {vro?.trendLines?.map((line: TrendLine) => (
                      <TrendCard key={line.metric} line={line} expanded />
                    ))}
                  </div>

                  {vro?.benefitsForecast && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          Benefits Realization Forecast
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3 mb-6">
                          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="text-sm text-muted-foreground">Planned Benefits</div>
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">${(vro.benefitsForecast.totalPlannedBenefits / 1000000).toFixed(1)}M</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-sm text-muted-foreground">Realized</div>
                            <div className="text-2xl font-bold text-green-600">${(vro.benefitsForecast.realizedBenefits / 1000000).toFixed(1)}M</div>
                            <div className="text-xs text-muted-foreground">{vro.benefitsForecast.realizationRate}%</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-sm text-muted-foreground">Projected</div>
                            <div className="text-2xl font-bold text-blue-600">${(vro.benefitsForecast.projectedBenefits / 1000000).toFixed(1)}M</div>
                            <div className="text-xs text-muted-foreground">{vro.benefitsForecast.projectedRealizationRate}%</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {vro.benefitsForecast.byCategory?.map((cat: any) => (
                            <div key={cat.category} className="flex items-center gap-4">
                              <span className="w-32 text-sm font-medium">{cat.category}</span>
                              <div className="flex-1">
                                <ProgressBar value={cat.realized} target={cat.planned} projected={cat.projected} />
                              </div>
                              <span className="text-xs text-muted-foreground w-24 text-right">
                                ${(cat.realized / 1000000).toFixed(1)}M / ${(cat.planned / 1000000).toFixed(1)}M
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="pmo" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {pmo?.trendLines?.map((line: TrendLine) => (
                      <TrendCard key={line.metric} line={line} expanded />
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {pmo?.velocityForecast && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" /> Velocity Forecast
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Current</div>
                              <div className="text-2xl font-bold">{pmo.velocityForecast.currentVelocity}</div>
                            </div>
                            <TrendIcon trend={pmo.velocityForecast.trend} />
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Projected</div>
                              <div className="text-2xl font-bold text-blue-600">{pmo.velocityForecast.projectedVelocity}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {pmo.velocityForecast.byTeam?.map((team: any) => (
                              <div key={team.teamName} className="flex items-center justify-between text-sm">
                                <span>{team.teamName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{team.current}</span>
                                  <TrendIcon trend={team.trend} />
                                  <span className="font-mono text-blue-600">{team.projected}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {pmo?.capacityForecast && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-purple-500" /> Capacity Forecast
                          </CardTitle>
                          <CardDescription>
                            Overallocation risk: <SeverityBadge severity={pmo.capacityForecast.overallocationRisk === 'none' ? 'low' : pmo.capacityForecast.overallocationRisk} />
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {pmo.capacityForecast.byMonth?.map((month: any) => (
                              <div key={month.month}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="font-medium">{month.month}</span>
                                  <span className={`font-mono ${month.utilization > 90 ? 'text-red-600' : month.utilization > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {month.utilization}%
                                  </span>
                                </div>
                                <ProgressBar value={month.demand} target={month.capacity} />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="okr" className="space-y-4">
                  {vro?.okrTrajectory?.map((okr: OKRTrajectory) => (
                    <Card key={okr.objectiveId} data-testid={`card-okr-${okr.objectiveId}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{okr.objectiveName}</CardTitle>
                            <CardDescription>
                              Target completion: {okr.projectedCompletionDate}
                            </CardDescription>
                          </div>
                          <TrajectoryBadge trajectory={okr.trajectory} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress: {okr.currentProgress}% → <span className="text-blue-600">{okr.projectedProgress}%</span> (target: {okr.targetProgress}%)</span>
                            <span className={okr.onTrack ? 'text-green-600' : 'text-red-600'}>{okr.onTrack ? 'On Track' : 'At Risk'}</span>
                          </div>
                          <ProgressBar value={okr.currentProgress} target={okr.targetProgress} projected={okr.projectedProgress} />
                        </div>
                        <div className="space-y-2">
                          {okr.keyResults?.map((kr, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm bg-slate-50 dark:bg-slate-800 rounded p-2">
                              <TrendIcon trend={kr.trend} />
                              <span className="flex-1">{kr.name}</span>
                              <span className="font-mono">{kr.current}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-mono text-blue-600">{kr.projected}</span>
                              <span className="text-muted-foreground">/ {kr.target}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="insights" className="space-y-3">
                  {insights.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No proactive insights at this time.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    insights.map((insight) => (
                      <Card key={insight.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)} data-testid={`card-insight-${insight.id}`}>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start gap-3">
                            <InsightIcon category={insight.category} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{insight.title}</span>
                                <SeverityBadge severity={insight.severity} />
                                <Badge variant="outline" className="text-xs">{insight.agent}</Badge>
                                <Badge variant="outline" className="text-xs">{insight.confidence}% confidence</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.description}</p>

                              {expandedInsight === insight.id && (
                                <div className="mt-3 pt-3 border-t space-y-2">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground font-medium">Predicted Impact:</span>
                                      <p>{insight.predictedImpact}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground font-medium">Time Horizon:</span>
                                      <p>{insight.timeHorizon}</p>
                                    </div>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground font-medium">Suggested Action:</span>
                                    <p className="text-blue-600">{insight.suggestedAction}</p>
                                  </div>
                                  {insight.affectedProjects.length > 0 && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground font-medium">Affected Projects:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {insight.affectedProjects.map((p, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {expandedInsight === insight.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TrendCard({ line, expanded = false }: { line: TrendLine; expanded?: boolean }) {
  const allData = [...(line.historical || []), ...(line.forecast || [])];
  const changeIcon = line.changePercent > 0
    ? <ArrowUpRight className="w-4 h-4 text-green-500" />
    : line.changePercent < 0
    ? <ArrowDownRight className="w-4 h-4 text-red-500" />
    : <Minus className="w-4 h-4 text-yellow-500" />;

  return (
    <Card data-testid={`card-trend-${line.metric}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{line.label}</CardTitle>
          <TrendBadge trend={line.trend} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold">{line.current}</span>
            <span className="text-sm text-muted-foreground ml-1">{line.unit}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {changeIcon}
            <span className={line.changePercent > 0 ? 'text-green-600' : line.changePercent < 0 ? 'text-red-600' : ''}>
              {line.changePercent > 0 ? '+' : ''}{line.changePercent}%
            </span>
            <span className="text-muted-foreground ml-1">→ {line.projected} {line.unit}</span>
          </div>
        </div>
        <MiniSparkline data={allData} />
        {expanded && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Historical ({line.historical?.length || 0} points)</span>
              <span>Forecast ({line.forecast?.length || 0} points)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 rounded p-2">
                <span className="text-muted-foreground">Current:</span> <span className="font-mono font-semibold">{line.current} {line.unit}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                <span className="text-muted-foreground">Projected:</span> <span className="font-mono font-semibold text-blue-600">{line.projected} {line.unit}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
