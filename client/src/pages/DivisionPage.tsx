import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb, Users, ChevronRight, Link2, ArrowRight, Filter, GitBranch, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { divisions, aiAlerts, industryBenchmarks } from "@/lib/lgData";
import { enrichedProjects, getSafeStages, getStageLabel, type EnrichedProject } from "@/lib/projects";
import { safeProjects, getProjectsByBU } from "@/lib/safeProjectData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { usePageContext } from "@/contexts/PageContext";

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
  'capital': ['Corporate Investments'],
  'insurance': ['Risk & Compliance'],
  'fintech': ['Group Functions'],
  'risk-center': ['Risk & Compliance'],
  'climate': ['Group Functions', 'Corporate Investments'],
  'group-functions': ['Group Functions'],
  'technology': ['Group Functions'],
  'default': ['Institutional Retirement', 'Asset Management', 'Retail', 'Corporate Investments', 'Risk & Compliance', 'Group Functions']
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
    // Navigate to SAFe project detail page if it's a known SAFe project
    const safeProject = safeProjects.find(p => p.id === id);
    if (type === 'project' && safeProject) {
      setLocation(`/project/${id}`);
      return;
    }
    setSelectedEntity({ type, id });
  };
  
  if (!division) {
    return (
      <div className="min-h-screen bg-[#F6F6F6] flex items-center justify-center">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-[#C50B30]">Division not found</h1>
          <Link href="/dashboard">
            <Button className="mt-4" onClick={() => setLocation('/dashboard')} data-testid="link-back-dashboard">Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const divisionAlerts = aiAlerts.filter(a => a.division === division.name);
  
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
            <TabsTrigger value="kpis" data-testid="tab-kpis">KPIs & Metrics</TabsTrigger>
            <TabsTrigger value="okrs" data-testid="tab-okrs">OKRs</TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
            <TabsTrigger value="risks" data-testid="tab-risks">Risks</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">AI Alerts ({divisionAlerts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Group Function Overview</CardTitle>
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

          <TabsContent value="kpis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>KPI Performance 2023 vs 2024 vs Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={kpiChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="2023" fill="#94a3b8" name="2023" />
                      <Bar dataKey="2024" fill={division.color} name="2024" />
                      <Bar dataKey="Target" fill="#10b981" name="2025 Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto">
                    {division.kpis.map((kpi, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{kpi.name}</span>
                          <Badge variant={kpi.status === "on-track" ? "default" : kpi.status === "at-risk" ? "secondary" : "destructive"}>
                            {kpi.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">2023:</span> {kpi.value2023}{kpi.unit}
                          </div>
                          <div>
                            <span className="text-gray-500">2024:</span> <span className="font-medium">{kpi.value2024}{kpi.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Target:</span> {kpi.target2025}{kpi.unit}
                          </div>
                        </div>
                        {typeof kpi.value2024 === "number" && typeof kpi.target2025 === "number" && (
                          <Progress 
                            value={Math.min(100, (kpi.value2024 / kpi.target2025) * 100)} 
                            className="mt-2 h-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="okrs" className="space-y-6">
            {division.okrs.map((okr, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" style={{ color: division.color }} />
                        {okr.objective}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Owner: {okr.owner} | Due: {okr.dueDate}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {okr.keyResults.map((kr, j) => (
                      <div key={j} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{kr.result}</span>
                          <span className="text-sm font-medium" style={{ color: division.color }}>
                            {kr.progress} / {kr.target} {kr.unit}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (kr.progress / kr.target) * 100)} 
                          className="h-3"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {Math.round((kr.progress / kr.target) * 100)}% complete
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  >
                    <CardHeader>
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
                    <CardContent>
                      <p className="text-gray-700 mb-4">{project.description}</p>
                      
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
                            {project.dependencies.map((dep, depIdx) => (
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
                                  {dep.description && (
                                    <p className="text-xs text-gray-500 truncate">{dep.description}</p>
                                  )}
                                  {dep.impactIfDelayed && (
                                    <p className="text-xs text-amber-600 truncate">Impact: {dep.impactIfDelayed}</p>
                                  )}
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
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          style={{ backgroundColor: division.color }}
                          onClick={() => handleDrillDown('project', project.id)}
                          data-testid={`view-project-${project.id}`}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDrillDown('start-project', project.id)}
                          data-testid={`start-project-${project.id}`}
                        >
                          Start Project
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
