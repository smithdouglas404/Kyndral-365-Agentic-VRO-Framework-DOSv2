import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb, Users, ChevronRight, Link2, ArrowRight, Filter, GitBranch, Sparkles, Zap, Activity, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions, aiAlerts, industryBenchmarks } from "@/lib/lgData";
import { enrichedProjects, getSafeStages, getStageLabel, type EnrichedProject, getProjectFeatureCount, getProjectStoryCount, getProjectTaskCount } from "@/lib/projects";
import { safeProjects, getProjectsByBU } from "@/lib/safeProjectData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { usePageContext } from "@/contexts/PageContext";
import { buPortfolios, type BUPortfolio } from "@/lib/buPrograms";
import { Brain } from "lucide-react";

// Legacy slug mapping for backward compatibility
const legacySlugs: Record<string, string> = {
  'lgim': 'asset-management',
  'lgc': 'capital',
  'lgri': 'institutional-retirement',
  'lgr': 'retail',
  'lgf': 'fintech',
  'lgi': 'insurance'
};

// BU name mapping for filtering enriched projects (covers all division IDs)
const buNameMapping: Record<string, string[]> = {
  'institutional-retirement': ['Institutional Retirement'],
  'asset-management': ['Asset Management'],
  'retail': ['Retail'],
  'corporate-investments': ['Corporate Investments'],
  'corporate': ['Corporate Investments'],
  'capital': ['Corporate Investments'],
  'insurance': ['Risk & Compliance'],
  'fintech': ['Group Functions'],
  'risk-center': ['Risk & Compliance'],
  'climate': ['Group Functions', 'Corporate Investments'],
  'group-functions': ['Group Functions'],
  'technology': ['Group Functions'],
  'default': ['Institutional Retirement', 'Asset Management', 'Retail', 'Corporate Investments', 'Risk & Compliance', 'Group Functions']
};

// Division ID to Portfolio ID mapping for VRO/PMO metrics
const divisionToPortfolioMapping: Record<string, string> = {
  'institutional-retirement': 'portfolio-ir',
  'asset-management': 'portfolio-am',
  'retail': 'portfolio-retail',
  'corporate': 'portfolio-ci',
  'corporate-investments': 'portfolio-ci',
  'capital': 'portfolio-ci',
  'insurance': 'portfolio-rc',
  'risk-center': 'portfolio-rc',
};

export default function DivisionPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { setPageContext } = usePageContext();
  const [stageFilter, setStageFilter] = useState<string>("all");
  
  // Get the fromTab query parameter to know where to navigate back
  const searchParams = new URLSearchParams(window.location.search);
  const fromTab = searchParams.get('fromTab') || 'portfolios';
  
  // Resolve legacy slugs to new IDs
  const resolvedId = legacySlugs[params.id || ''] || params.id;
  const division = divisions.find(d => d.id === resolvedId);
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string } | null>(null);
  
  // Update page context for Ask PM
  useEffect(() => {
    if (division) {
      setPageContext({
        pageType: 'division',
        entityId: division.id,
        entityName: division.name,
        breadcrumb: ['Dashboard', division.name]
      });
    }
  }, [division, setPageContext]);
  
  // Get enriched projects for this business unit (supports multiple BU mappings)
  const buNames = buNameMapping[resolvedId || ''] || buNameMapping['default'] || [];
  const divisionProjects = useMemo(() => {
    if (buNames.length === 0) return enrichedProjects;
    return enrichedProjects.filter(p => buNames.includes(p.bu));
  }, [buNames]);
  
  // Apply stage filter
  const filteredProjects = useMemo(() => {
    if (stageFilter === "all") return divisionProjects;
    return divisionProjects.filter(p => p.safeStage === stageFilter);
  }, [divisionProjects, stageFilter]);
  
  const handleDrillDown = (type: string, id: string) => {
    // Always navigate to full project detail page for projects
    if (type === 'project') {
      setLocation(`/project/${id}`);
      return;
    }
    setSelectedEntity({ type, id });
  };
  
  if (!division) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] flex items-center justify-center">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-[#C50B30]">Group Function not found</h1>
          <Link href="/dashboard">
            <Button className="mt-4" onClick={() => setLocation('/dashboard')} data-testid="link-back-dashboard">Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const divisionAlerts = aiAlerts.filter(a => a.division === division.name);
  
  // Get portfolio data for VRO/PMO metrics
  const portfolioId = divisionToPortfolioMapping[resolvedId || ''];
  const portfolioData = portfolioId ? buPortfolios.find(p => p.id === portfolioId) : undefined;
  
  const kpiChartData = division.kpis.slice(0, 4).map(kpi => ({
    name: kpi.name.length > 15 ? kpi.name.slice(0, 15) + "..." : kpi.name,
    "2023": typeof kpi.value2023 === "number" ? kpi.value2023 : 0,
    "2024": typeof kpi.value2024 === "number" ? kpi.value2024 : 0,
    "Target": typeof kpi.target2025 === "number" ? kpi.target2025 : 0
  }));

  const profitTrend = [
    { year: "2023", profit: division.profit2023 },
    { year: "2024", profit: division.profit2024 },
    { year: "2025 (Proj)", profit: Math.round(division.profit2024 * (1 + (division.changePercent > 0 ? 0.08 : 0.05))) }
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <header className="bg-white shadow-sm border-b-4" style={{ borderColor: division.color }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation(`/dashboard?tab=${fromTab}`)} 
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: division.color }} data-testid="text-division-name">
                  {division.name}
                </h1>
                <Badge 
                  variant={division.changePercent >= 0 ? "default" : "destructive"}
                  className="text-sm"
                  data-testid="badge-change-percent"
                >
                  {division.changePercent >= 0 ? "+" : ""}{division.changePercent}% YoY
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">CEO: {division.ceo}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Operating Profit 2024</p>
              <p className="text-3xl font-bold" style={{ color: division.color }} data-testid="text-profit">
                £{division.profit2024}m
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="outcomes" data-testid="tab-outcomes">Outcomes & Alignment</TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">Projects ({divisionProjects.length})</TabsTrigger>
            <TabsTrigger value="risks" data-testid="tab-risks">Risks</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">AI Alerts ({divisionAlerts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Operating Segments & Group Function Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-6" data-testid="text-description">{division.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {division.kpis.slice(0, 4).map((kpi, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">{kpi.name}</p>
                        <p className="text-2xl font-bold" style={{ color: division.color }}>
                          {kpi.value2024}{kpi.unit}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {kpi.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : kpi.trend === "down" ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : null}
                          <span className={`text-xs ${kpi.status === "on-track" ? "text-green-600" : kpi.status === "at-risk" ? "text-amber-600" : "text-red-600"}`}>
                            {kpi.status.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" style={{ color: division.color }} />
                    Profit Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={profitTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`£${value}m`, "Profit"]} />
                      <Line type="monotone" dataKey="profit" stroke={division.color} strokeWidth={3} dot={{ fill: division.color, strokeWidth: 2, r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* VRO VALUE + PMO DELIVERY Dual-Lane Metrics */}
            {portfolioData && (
              <div className="space-y-4" data-testid="division-vro-pmo-section">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* VRO VALUE section (teal) - uses actual project data */}
                  <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-teal-500" />
                        <span className="text-sm font-bold text-teal-700">VRO VALUE</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-teal-600">Realized</span>
                          <span className="text-xl font-bold text-teal-700">£{portfolioData.valueRealized}m</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-teal-600">Programs</span>
                          <span className="text-xl font-bold text-teal-700">{divisionProjects.length}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-teal-600">Value Score</span>
                          <span className="text-xl font-bold text-teal-700">{portfolioData.healthScore}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* PMO DELIVERY section (blue) - uses actual project data */}
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-bold text-blue-700">PMO DELIVERY</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-blue-600">Projects</span>
                          <span className="text-xl font-bold text-blue-700">{divisionProjects.length}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-blue-600">On-Time</span>
                          <span className="text-xl font-bold text-blue-700">{portfolioData.predictability}%</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-blue-600">Features</span>
                          <span className="text-xl font-bold text-blue-700">{divisionProjects.reduce((sum, p) => sum + (p.features?.length || 0), 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SAFe 6.0 Metrics */}
                  <Card className="border-gray-200 bg-white">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">{portfolioData.velocity}</p>
                          <p className="text-xs text-gray-500">Velocity</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">{portfolioData.predictability}%</p>
                          <p className="text-xs text-gray-500">Predict.</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{portfolioData.currentPI}</p>
                          <p className="text-xs text-gray-500">Current PI</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* OKRs */}
                {portfolioData.okrs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {portfolioData.okrs.map((okr, idx) => (
                      <Card key={idx} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-800">{okr.objective}</span>
                            <Badge 
                              variant="outline" 
                              className={
                                okr.status === 'on-track' ? 'bg-green-100 text-green-700 border-green-300' :
                                okr.status === 'at-risk' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                'bg-red-100 text-red-700 border-red-300'
                              }
                            >
                              {okr.status}
                            </Badge>
                          </div>
                          <Progress value={okr.progress} className="h-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* AI Signal */}
                {portfolioData.topAISignal && (
                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                        <p className="text-sm text-purple-800">{portfolioData.topAISignal.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {divisionAlerts.length > 0 && (
              <Card className="border-l-4" style={{ borderLeftColor: division.color }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    AI Insights for {division.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {divisionAlerts.slice(0, 2).map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === "critical" ? "text-red-500" : alert.severity === "warning" ? "text-amber-500" : "text-blue-500"}`} />
                        <div className="flex-1">
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          <div className="flex gap-2 mt-2">
                            {alert.actions.map((action, i) => (
                              <Button 
                                key={i} 
                                size="sm" 
                                variant={action.type === "primary" ? "default" : "outline"} 
                                style={action.type === "primary" ? { backgroundColor: division.color } : {}}
                                onClick={() => handleDrillDown('alert-action', `${alert.id}-${action.label}`)}
                                data-testid={`alert-action-${alert.id}-${i}`}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Badge variant="outline">{alert.confidence}% confidence</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="outcomes" className="space-y-6">
            {/* Color Legend for OKR-KPI Mapping */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">OKR to KPI Mapping:</span>
                    {division.okrs.map((okr, i) => {
                      const okrColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: okrColors[i % okrColors.length] }}
                          />
                          <span className="text-xs text-slate-600">OKR {i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate-500">Hover over an OKR or KPI to highlight connections</span>
                </div>
              </CardContent>
            </Card>

            {/* Two-pane layout: OKR hierarchy on left, linked KPIs on right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Pane: OKR Hierarchy with Status */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Target className="h-5 w-5 text-blue-600" />
                      Strategic Objectives (OKRs)
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      {division.okrs.length} objectives driving {division.kpis.length} measurable KPIs
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                {division.okrs.map((okr, i) => {
                  const okrColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
                  const okrColor = okrColors[i % okrColors.length];
                  const overallProgress = Math.round(
                    okr.keyResults.reduce((sum, kr) => sum + (kr.progress / kr.target) * 100, 0) / okr.keyResults.length
                  );
                  const linkedKpiCount = division.kpis.filter((_, ki) => ki % division.okrs.length === i).length;
                  
                  return (
                    <Card 
                      key={i} 
                      className="border-l-4 hover:shadow-lg transition-all cursor-pointer group"
                      style={{ borderLeftColor: okrColor }}
                      data-testid={`okr-card-${i}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Badge 
                                className="text-[10px] px-1.5" 
                                style={{ backgroundColor: okrColor, color: 'white' }}
                              >
                                OKR {i + 1}
                              </Badge>
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                overallProgress >= 80 ? 'bg-green-500' : 
                                overallProgress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              <span className="group-hover:text-blue-700 transition-colors">{okr.objective}</span>
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs flex items-center gap-3">
                              <span>Owner: {okr.owner}</span>
                              <span>Due: {okr.dueDate}</span>
                              <span className="flex items-center gap-1" style={{ color: okrColor }}>
                                <ArrowRight className="h-3 w-3" />
                                Drives {linkedKpiCount} KPI{linkedKpiCount !== 1 ? 's' : ''}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: okrColor }}>
                              {overallProgress}%
                            </div>
                            <span className="text-xs text-gray-500">overall</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {okr.keyResults.map((kr, j) => {
                            const krProgress = Math.round((kr.progress / kr.target) * 100);
                            return (
                              <div key={j} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium">{kr.result}</span>
                                  <Badge 
                                    variant={krProgress >= 80 ? "default" : krProgress >= 50 ? "secondary" : "destructive"}
                                    className="text-xs"
                                  >
                                    {kr.progress}/{kr.target} {kr.unit}
                                  </Badge>
                                </div>
                                <Progress value={Math.min(100, krProgress)} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Right Pane: Linked KPIs with Analytics */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-emerald-900">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Key Performance Indicators (KPIs)
                    </CardTitle>
                    <CardDescription className="text-emerald-700">
                      {division.kpis.length} metrics measuring progress against 2025 targets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={kpiChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="2023" fill="#94a3b8" name="2023" />
                        <Bar dataKey="2024" fill="#059669" name="2024" />
                        <Bar dataKey="Target" fill="#10b981" name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* KPI Cards with OKR Linkage - Color Coded */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {division.kpis.map((kpi, i) => {
                    const okrColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
                    const linkedOkrIndex = i % division.okrs.length;
                    const linkedOkr = division.okrs[linkedOkrIndex];
                    const okrColor = okrColors[linkedOkrIndex % okrColors.length];
                    
                    const progressPercent = typeof kpi.value2024 === "number" && typeof kpi.target2025 === "number"
                      ? Math.round((kpi.value2024 / kpi.target2025) * 100)
                      : 0;
                    const variance = typeof kpi.value2024 === "number" && typeof kpi.value2023 === "number"
                      ? Math.round(((kpi.value2024 - kpi.value2023) / kpi.value2023) * 100)
                      : 0;
                    
                    return (
                      <Card 
                        key={i} 
                        className="border-l-4 hover:shadow-lg transition-all cursor-pointer"
                        style={{ borderLeftColor: okrColor }}
                        data-testid={`kpi-card-${i}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{kpi.name}</span>
                                <Badge 
                                  variant={kpi.status === "on-track" ? "default" : kpi.status === "at-risk" ? "secondary" : "destructive"}
                                  className="text-[10px]"
                                >
                                  {kpi.status}
                                </Badge>
                              </div>
                              {linkedOkr && (
                                <div 
                                  className="flex items-center gap-1.5 mt-2 p-1.5 rounded-md"
                                  style={{ backgroundColor: `${okrColor}15` }}
                                >
                                  <Badge 
                                    className="text-[9px] px-1" 
                                    style={{ backgroundColor: okrColor, color: 'white' }}
                                  >
                                    OKR {linkedOkrIndex + 1}
                                  </Badge>
                                  <span className="text-[11px] font-medium" style={{ color: okrColor }}>
                                    {linkedOkr.objective.length > 35 
                                      ? linkedOkr.objective.substring(0, 35) + '...' 
                                      : linkedOkr.objective}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold" style={{ color: okrColor }}>
                                {kpi.value2024}{kpi.unit}
                              </div>
                              <div className="flex items-center gap-1 justify-end">
                                {variance >= 0 ? (
                                  <TrendingUp className="h-3 w-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-red-600" />
                                )}
                                <span className={`text-xs ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {variance >= 0 ? '+' : ''}{variance}% YoY
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress gauge */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Progress to 2025 Target</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="relative">
                              <Progress value={Math.min(100, progressPercent)} className="h-2" />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400">
                              <span>Current: {kpi.value2024}{kpi.unit}</span>
                              <span>Target: {kpi.target2025}{kpi.unit}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary Insight Card */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900">AI-Generated Alignment Summary</h4>
                    <p className="text-sm text-purple-800 mt-1">
                      {division.okrs.length} strategic objectives are driving {division.kpis.filter(k => k.status === 'on-track').length} of {division.kpis.length} KPIs on track. 
                      {division.kpis.filter(k => k.status === 'at-risk').length > 0 && (
                        <span className="text-amber-700"> {division.kpis.filter(k => k.status === 'at-risk').length} KPIs require attention to meet 2025 targets.</span>
                      )}
                      {division.kpis.filter(k => k.status === 'off-track').length > 0 && (
                        <span className="text-red-700"> {division.kpis.filter(k => k.status === 'off-track').length} KPIs are off-track and may impact objective completion.</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {/* Stage Filter Bar */}
            <Card className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Filter by Stage</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={stageFilter === "all" ? "default" : "outline"}
                    onClick={() => setStageFilter("all")}
                    data-testid="filter-all-stages"
                  >
                    All Stages ({divisionProjects.length})
                  </Button>
                  {getSafeStages().map(stage => {
                    const count = divisionProjects.filter(p => p.safeStage === stage).length;
                    return (
                      <Button
                        key={stage}
                        size="sm"
                        variant={stageFilter === stage ? "default" : "outline"}
                        onClick={() => setStageFilter(stage)}
                        className={stageFilter === stage ? "" : "hover:bg-gray-100"}
                        data-testid={`filter-stage-${stage}`}
                      >
                        {getStageLabel(stage)} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card>
            
            {/* Projects Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="text-2xl font-bold text-green-700">{divisionProjects.filter(p => p.status === 'green').length}</div>
                <div className="text-sm text-green-600">On Track</div>
              </Card>
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="text-2xl font-bold text-amber-700">{divisionProjects.filter(p => p.status === 'amber').length}</div>
                <div className="text-sm text-amber-600">At Risk</div>
              </Card>
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="text-2xl font-bold text-red-700">{divisionProjects.filter(p => p.status === 'red').length}</div>
                <div className="text-sm text-red-600">Critical</div>
              </Card>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-2xl font-bold text-blue-700">£{divisionProjects.reduce((sum, p) => sum + p.roiValue, 0)}m</div>
                <div className="text-sm text-blue-600">Total Expected ROI</div>
              </Card>
            </div>

            {filteredProjects.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No projects match the selected filter</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProjects.map((project, i) => (
                  <Card 
                    key={project.id} 
                    className={`border-l-4 ${
                      project.priority === "critical" ? "border-l-red-600" :
                      project.priority === "high" ? "border-l-red-500" : 
                      project.priority === "medium" ? "border-l-amber-500" : 
                      "border-l-gray-300"
                    }`}
                    data-testid={`project-card-${project.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant={project.priority === "critical" || project.priority === "high" ? "destructive" : "secondary"}>
                              {project.priority} priority
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={
                                project.status === 'green' ? 'border-green-500 text-green-700 bg-green-50' :
                                project.status === 'amber' ? 'border-amber-500 text-amber-700 bg-amber-50' :
                                'border-red-500 text-red-700 bg-red-50'
                              }
                            >
                              {project.status === 'green' ? 'On Track' : project.status === 'amber' ? 'At Risk' : 'Critical'}
                            </Badge>
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              <GitBranch className="h-3 w-3 mr-1" />
                              {getStageLabel(project.safeStage)}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-green-600">{project.expectedROI}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-gray-700 text-sm mb-4">{project.description}</p>
                      
                      {/* VRO VALUE + PMO DELIVERY Dual-Lane Metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* VRO VALUE (teal) */}
                        <div className="p-3 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-teal-500" />
                            <span className="text-xs font-bold text-teal-700">VRO VALUE</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-teal-600 block">Expected</span>
                              <span className="text-sm font-bold text-teal-700">{project.expectedROI}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-teal-600 block">Epic</span>
                              <span className="text-sm font-bold text-teal-700">{project.safe.epicProgress}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* PMO DELIVERY (blue) */}
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-bold text-blue-700">PMO DELIVERY</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-blue-600 block">On-Time</span>
                              <span className="text-sm font-bold text-blue-700">{project.safe.predictability}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-blue-600 block">Deliverables</span>
                              <span className="text-sm font-bold text-blue-700">{project.deliverables.completed}/{project.deliverables.total}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SAFe Metrics Row */}
                      <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <span className="text-lg font-bold text-amber-600">{project.safe.velocity}</span>
                          <span className="text-[10px] text-gray-500 block">Velocity</span>
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-bold text-amber-600">{project.safe.predictability}%</span>
                          <span className="text-[10px] text-gray-500 block">Predict.</span>
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-bold text-purple-600">{project.safe.flowEfficiency}%</span>
                          <span className="text-[10px] text-gray-500 block">Flow Eff.</span>
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-bold text-purple-600">{project.safe.currentPI}</span>
                          <span className="text-[10px] text-gray-500 block">PI</span>
                        </div>
                      </div>
                      
                      {/* Budget & Timeline Progress */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Budget</span>
                            <span className="font-medium">{project.budget.spent}/{project.budget.total} {project.budget.unit}</span>
                          </div>
                          <Progress value={(project.budget.spent / project.budget.total) * 100} className="h-2" />
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Timeline</span>
                            <span className="font-medium">{project.timeline.elapsed}/{project.timeline.total} {project.timeline.unit}</span>
                          </div>
                          <Progress value={(project.timeline.elapsed / project.timeline.total) * 100} className="h-2" />
                        </div>
                      </div>

                      {/* OKR Progress */}
                      {project.safe.okr && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-medium text-purple-800">OKR: {project.safe.okr.objective}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700 bg-purple-100">
                              {project.safe.okr.progress}%
                            </Badge>
                          </div>
                          <Progress value={project.safe.okr.progress} className="h-1.5" />
                          <p className="text-[10px] text-purple-600 mt-1">Key Result: {project.safe.okr.keyResult}</p>
                        </div>
                      )}

                      {/* AI Signals */}
                      {project.aiSignals && project.aiSignals.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {project.aiSignals.slice(0, 2).map((signal, idx) => (
                            <div 
                              key={idx}
                              className={`p-2 rounded-lg border text-xs ${
                                signal.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                signal.type === 'opportunity' ? 'bg-green-50 border-green-200 text-green-800' :
                                signal.type === 'prediction' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                                'bg-gray-50 border-gray-200 text-gray-800'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Activity className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="font-medium">{signal.message}</span>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] opacity-70">
                                    <span>{signal.confidence}% confidence</span>
                                    <span>•</span>
                                    <span>{signal.dataSource}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Proactive Actions */}
                      {project.proactiveActions && project.proactiveActions.length > 0 && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-bold text-amber-700">Proactive Actions ({project.proactiveActions.length})</span>
                          </div>
                          <div className="space-y-1.5">
                            {project.proactiveActions.slice(0, 2).map((action, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-amber-100">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-gray-800">{action.action}</p>
                                  <p className="text-[10px] text-amber-600">Impact: {action.impact}</p>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] ${
                                    action.urgency === 'immediate' ? 'border-red-300 text-red-600 bg-red-50' :
                                    action.urgency === 'this-week' ? 'border-amber-300 text-amber-600 bg-amber-50' :
                                    'border-gray-300 text-gray-600 bg-gray-50'
                                  }`}
                                >
                                  {action.urgency}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {project.aiRecommendation && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                          <div className="flex items-start gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">AI Recommendation</p>
                              <p className="text-sm text-blue-700 mt-1">{project.aiRecommendation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {project.dependencies && project.dependencies.length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Link2 className="h-4 w-4 text-gray-600" />
                            <p className="text-sm font-medium text-gray-700">Cross-Project Dependencies ({project.dependencies.length})</p>
                          </div>
                          <div className="space-y-2">
                            {project.dependencies.slice(0, 2).map((dep, depIdx) => (
                              <div 
                                key={depIdx} 
                                className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => handleDrillDown('project', dep.projectId)}
                                data-testid={`dependency-${project.id}-${depIdx}`}
                              >
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                  dep.health === 'green' ? 'bg-green-500' : 
                                  dep.health === 'yellow' ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500 uppercase">
                                      {dep.type === 'blocks' ? 'Blocks' : dep.type === 'blocked-by' ? 'Blocked by' : 'Related to'}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-800 truncate">{dep.projectName}</span>
                                  </div>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] flex-shrink-0 ${
                                    dep.health === 'green' ? 'border-green-500 text-green-700 bg-green-50' :
                                    dep.health === 'yellow' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                    'border-red-500 text-red-700 bg-red-50'
                                  }`}
                                >
                                  {dep.health === 'green' ? 'Healthy' : dep.health === 'yellow' ? 'At Risk' : 'Blocked'}
                                </Badge>
                              </div>
                            ))}
                            {project.dependencies.length > 2 && (
                              <p className="text-xs text-gray-500 text-center">+{project.dependencies.length - 2} more dependencies</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedEntity({ type: 'project', id: project.id })}
                          data-testid={`flyout-project-${project.id}`}
                        >
                          Quick View
                        </Button>
                        <Button 
                          size="sm" 
                          style={{ backgroundColor: division.color }}
                          onClick={() => setLocation(`/project/${project.id}`)}
                          data-testid={`view-project-${project.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Full Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {division.risks.map((risk, i) => (
                <Card key={i} className={`border-t-4 ${risk.level === "high" ? "border-t-red-500" : risk.level === "medium" ? "border-t-amber-500" : "border-t-green-500"}`}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{risk.type}</CardTitle>
                      <Badge variant={risk.level === "high" ? "destructive" : risk.level === "medium" ? "secondary" : "default"}>
                        {risk.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-3">{risk.description}</p>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Mitigation</p>
                      <p className="text-sm">{risk.mitigation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {divisionAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No active AI alerts for this division</p>
                </CardContent>
              </Card>
            ) : (
              divisionAlerts.map(alert => (
                <Card key={alert.id} className={`border-l-4 ${alert.severity === "critical" ? "border-l-red-500" : alert.severity === "warning" ? "border-l-amber-500" : alert.severity === "success" ? "border-l-green-500" : "border-l-blue-500"}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${alert.severity === "critical" ? "bg-red-100" : alert.severity === "warning" ? "bg-amber-100" : alert.severity === "success" ? "bg-green-100" : "bg-blue-100"}`}>
                        <AlertTriangle className={`h-5 w-5 ${alert.severity === "critical" ? "text-red-600" : alert.severity === "warning" ? "text-amber-600" : alert.severity === "success" ? "text-green-600" : "text-blue-600"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge variant="outline">{alert.type}</Badge>
                        </div>
                        <p className="text-gray-700">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Target: {alert.targetPersona}</span>
                          <span>Confidence: {alert.confidence}%</span>
                          <span>Source: {alert.source}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg mt-3">
                          <p className="text-sm font-medium">AI Recommendation:</p>
                          <p className="text-sm text-gray-700">{alert.recommendation}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {alert.actions.map((action, i) => (
                            <Button 
                              key={i} 
                              size="sm" 
                              variant={action.type === "primary" ? "default" : "outline"} 
                              style={action.type === "primary" ? { backgroundColor: division.color } : {}}
                              onClick={() => handleDrillDown('alert-action', `${alert.id}-${action.label}`)}
                              data-testid={`alert-btn-${alert.id}-${i}`}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <DrillDownDrawer
        isOpen={!!selectedEntity}
        onClose={() => setSelectedEntity(null)}
        entityType={selectedEntity?.type || 'entity'}
        entityId={selectedEntity?.id || ''}
      />
    </div>
  );
}
