import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, TrendingUp, Filter, Search, User, Target, Link as LinkIcon, FileText, ArrowRight, RefreshCw, Play, Pause, Download, TrendingDown, Brain, BarChart3, Building2, AlertCircle, Briefcase, AlertOctagon, PieChart, FileCode, Zap, Settings, Network, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { usePageContext } from "@/contexts/PageContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScenarioChartsGrid } from "@/components/ScenarioCharts";
import { AIExecutiveInsights } from "@/components/AIExecutiveInsights";
import { UnifiedMetricsSection } from "@/components/UnifiedMetricsSection";
import { startScenarioSimulation, stopScenarioSimulation } from "@/lib/scenarioSimulator";
import { useValueInsights } from "@/hooks/useAgentInsights";
import { AIAlertTicker } from "@/components/AIAlertTicker";
import { VROMetricsTable } from "@/components/VROMetricsTable";
import { KPIAttributionPanel } from "@/components/KPIAttributionPanel";
import { AutonomousRiskAgent } from "@/components/AutonomousRiskAgent";
import { MultiAgentDiscussion } from "@/components/MultiAgentDiscussion";
import { AgentCommandCenter } from "@/components/AgentCommandCenter";
import { AgentSidebar } from "@/components/AgentSidebar";
import { CrossAgentCollaboration } from "@/components/CrossAgentCollaboration";
import AgentActionQueue from "@/components/AgentActionQueue";
import { useDivisions } from "@/hooks/useNexteraData";
import { useVroMetrics, usePmoMetrics } from "@/hooks/useVroMetrics";
import { useDemoMode, useToggleDemoMode } from "@/hooks/useAppConfig";
import { useCompanyName, useCompanyProfile } from "@/contexts/CompanyProfileContext";
import { formatMoney } from "@/lib/formatters";
import { colors } from "@/lib/designTokens";
import { Leaf, Shield, Sparkles, Building, ChevronRight, Bot } from "lucide-react";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { VROMetricsGrid } from "@/components/VROMetricCard";
import { Switch } from "@/components/ui/switch";
import { GitBranch, BookOpen, Compass } from "lucide-react";
import { startBackgroundMonitor, stopBackgroundMonitor, setActionNotificationCallback } from "@/lib/backgroundAgentMonitor";
import { startOrchestrator, stopOrchestrator } from "@/lib/agentOrchestrator";
import { toast } from "sonner";
import { ProjectLifecycleCommandCenter } from "@/components/ProjectLifecycleCommandCenter";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { HelpMenu } from "@/components/HelpMenu";

// Enterprise Design System Colors (Enterprise Transformation Team 2026)
const NEE = {
  blue: colors.brand.blue,      // #0072CE - Primary actions, links, navigation
  teal: colors.brand.teal,      // #00A651 - Positive trends, success states
  red: colors.brand.red,        // #D50032 - Alerts, errors, negative trends
  yellow: colors.brand.yellow,  // #FFD700 - Subtle highlights
  grey500: colors.neutral.grey500, // #757575 - Secondary text
  grey700: colors.neutral.grey700, // #424242 - Icons
};


// VRO_METRICS_DATA is now loaded from database via useVroMetrics hook

// VRO Metrics Summary - Simulation removed
// TODO: Wire to real VRO metrics from backend
function VROMetricsSummaryLive() {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#0072CE]" />
          <span className="text-sm font-medium text-gray-600">VRO Stats (PMO Rolls Up)</span>
        </div>
        <span className="text-xs text-gray-400">No metrics available</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[].map((metric: any, i) => {
          const isPulsing = false;
          const isOnTarget = metric.currentValue >= metric.targetValue * 0.9;
          
          return (
            <motion.div
              key={metric.id}
              animate={isPulsing ? { scale: [1, 1.02, 1], backgroundColor: ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)'] } : {}}
              transition={{ duration: 0.5 }}
              className={cn(
                "bg-blue-50 border border-blue-200 rounded-[4px] p-3 flex flex-col transition-all",
                isPulsing && "ring-2 ring-blue-400 ring-opacity-50"
              )}
              data-testid={`vro-stat-${metric.id}`}
            >
              <span className="text-xs font-medium text-gray-500 mb-1 truncate">{metric.name}</span>
              <div className="flex items-baseline gap-1">
                <motion.span 
                  className={cn("text-xl font-bold", isOnTarget ? "text-green-600" : "text-amber-600")}
                  animate={isPulsing ? { scale: [1, 1.1, 1] } : {}}
                >
                  {metric.currentValue}
                </motion.span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>
              <Progress 
                value={Math.min(100, (metric.currentValue / metric.targetValue) * 100)} 
                className="h-1 mt-2"
              />
              <div className="mt-1 text-[10px] text-gray-400">
                Target: {metric.targetValue}{metric.unit}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Database-driven VRO Metrics Summary (fallback for static mode)
function VROMetricsSummary() {
  const { data: vroMetrics, isLoading } = useVroMetrics();
  
  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#0072CE]" />
          <span className="text-sm font-medium text-gray-600">VRO Stats (PMO Rolls Up)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-blue-50 border border-blue-200 rounded-[4px] p-4 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }
  
  const metricsToDisplay = vroMetrics || [];
  
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[#0072CE]" />
        <span className="text-sm font-medium text-gray-600">VRO Stats (PMO Rolls Up)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricsToDisplay.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-blue-50 border border-blue-200 rounded-[4px] p-4 flex flex-col"
            data-testid={`vro-stat-${kpi.metricKey}`}
          >
            <span className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold", kpi.color || "text-[#0072CE]")}>{kpi.value}</span>
              <span className="text-sm text-gray-500">{kpi.unit}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-[10px] font-semibold text-[#0072CE]">{kpi.source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveIndicatorButton({ isLive, onToggle }: { isLive: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={cn(
        "gap-2 transition-all",
        isLive ? "border-[#00A651] text-[#00A651] bg-[#00A651]/10" : "border-gray-300"
      )}
      data-testid="button-live-toggle"
    >
      {isLive ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          LIVE
          <Pause size={14} />
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-gray-400"></span>
          PAUSED
          <Play size={14} />
        </>
      )}
    </Button>
  );
}

function LGReportStats({ mode, onDrillDown }: { mode: "VRO" | "PMO"; onDrillDown?: (type: string, id: string) => void }) {
  // Fetch metrics from API based on mode
  const { data: vroMetrics, isLoading: vroLoading } = useVroMetrics();
  const { data: pmoMetrics, isLoading: pmoLoading } = usePmoMetrics();

  const isLoading = mode === "VRO" ? vroLoading : pmoLoading;
  const apiMetrics = mode === "VRO" ? vroMetrics : pmoMetrics;

  // Map icon names to icon components
  const iconMap: Record<string, any> = {
    Clock,
    Activity,
    TrendingUp,
    Target,
    TrendingDown,
  };

  // Transform API metrics to component format
  const stats = apiMetrics?.map(metric => ({
    id: metric.metricKey,
    label: metric.label,
    value: metric.value,
    unit: metric.unit || "",
    icon: iconMap[metric.metricKey.includes('time') ? 'Clock' :
                    metric.metricKey.includes('efficiency') ? 'Activity' :
                    metric.metricKey.includes('throughput') || metric.metricKey.includes('roi') ? 'TrendingUp' :
                    'Target'],
    color: metric.color || "text-[#0072CE]",
    source: metric.source || "",
    progress: 75,
    baseline: "",
    target: "",
    delta: "",
  })) || [];

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            className="bg-white border border-border rounded-[4px] p-6 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow duration-150 cursor-pointer"
            data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onDrillDown?.("metric", stat.id)}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <Icon className={stat.color} size={20} strokeWidth={1.5} />
            </div>
            <div className="flex items-baseline gap-1 w-full">
              <motion.span 
                key={`${mode}-${stat.label}`}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-foreground tracking-tight"
              >
                {stat.value}
              </motion.span>
              <span className="text-lg text-muted-foreground">{stat.unit}</span>
            </div>
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">2024: {stat.baseline}</span>
                <span className="font-medium text-[#00A651]">2026: {stat.target}</span>
              </div>
              <Progress value={stat.progress} className="h-2" />
              <div className="text-xs text-right mt-1 font-medium" style={{ color: mode === "VRO" ? "#00A651" : "#757575" }}>
                {stat.progress}% to target
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-[#0072CE]">{stat.source}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

import nexteraLogo from "@assets/nextera_logo.png";

function NavBar() {
  const companyName = useCompanyName();

  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <img src={nexteraLogo} alt={companyName} className="h-10 cursor-pointer" data-testid="link-home" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search dashboard..." 
            className="pl-9 h-9 bg-background border-border rounded-[4px]" 
            data-testid="input-search"
          />
        </div>
        <NotificationsDropdown />
        <HelpMenu />
        <Button size="icon" variant="ghost" className="rounded-full" data-testid="button-user" onClick={() => alert('User Profile\n\nAccount settings, preferences, and logout options would appear here.')}>
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}

function DashboardContent() {
  const [location, navigate] = useLocation();
  const { setPageContext } = usePageContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState<{type: string; id: string} | null>(null);

  const companyName = useCompanyName();
  const { profile } = useCompanyProfile();

  // Fetch divisions from API (DB-backed)
  const { data: divisions = [], isLoading: divisionsLoading } = useDivisions();

  // Fetch agent-calculated value insights
  const { data: valueInsights, isLoading: valueInsightsLoading } = useValueInsights();

  // Update page context for Ask PM
  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'integrated-management',
      entityName: 'Value Realization',
      breadcrumb: ['Dashboard']
    });
  }, [setPageContext]);

  // Read tab from URL query parameter on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      // Clean up the URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Always redirect to VRO dashboard on initial load
  useEffect(() => {
    if (location === '/dashboard/pmo') {
      navigate('/dashboard', { replace: true });
    }
  }, []);
  
  // Start background agent monitor, orchestrator, and scenario simulation with toast notifications
  // Only show toast notifications for critical agent messages
  useEffect(() => {
    setActionNotificationCallback((agentName, action, target, severity) => {
      if (severity === 'critical') {
        toast.error(`🚨 ${agentName} ${action} ${target}`, {
          description: "Critical agent action - immediate attention required",
          duration: 8000,
        });
      }
    });
    startBackgroundMonitor(15000);
    startOrchestrator(5000, 45000);
    const stopScenarios = startScenarioSimulation(240000);
    return () => {
      stopBackgroundMonitor();
      stopOrchestrator();
      stopScenarios();
    };
  }, []);
  
  const handleDrillDown = (type: string, id: string) => {
    if (type === 'division' || type === 'segment') {
      navigate(`/segment/${id}?fromTab=${activeTab}`);
      return;
    }
    if (type === 'sustainability' && id === 'sustainability-overview') {
      navigate('/sustainability');
      return;
    }
    if (type === 'risk' && id === 'risk-overview') {
      navigate('/risk');
      return;
    }
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };




  
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />

      <div className="flex">
        <AgentSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 px-8 py-8 max-w-[1400px]">
        {/* Title section - Only show on Overview tab */}
        {activeTab === "overview" && (
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-[48px] font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
                Value Realization
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                AI-powered Insights supporting the Value Realization and Project Execution Process
              </p>
              <div className="mt-4 w-full max-w-5xl">
                <AIAlertTicker />
              </div>
            </motion.div>
          </div>
        )}



        {/* Tab Content - Navigation handled by sidebar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* AI Executive Intelligence - Portfolio-level insights and recommendations */}
            <AIExecutiveInsights />

            {/* Agent Action Queue - HITL Dashboard for Agent Recommendations */}
            <AgentActionQueue />

            {/* Agent-Calculated Value Realization Metrics */}
            {valueInsights && (
              <Card className="border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Agent-Calculated Value Realization Metrics
                    <Badge variant="outline" className="ml-2 text-xs">
                      Real-time from Value Realization Agent
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Total Planned Value</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(valueInsights.aggregated.totalPlannedValue / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Across {valueInsights.aggregated.totalProjects} projects
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Total Actual Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(valueInsights.aggregated.totalActualValue / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Benefits realized to date
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Value Leakage</p>
                      <p className={`text-2xl font-bold ${valueInsights.aggregated.totalValueLeakage > 1000000 ? 'text-red-600' : 'text-amber-600'}`}>
                        ${(valueInsights.aggregated.totalValueLeakage / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((valueInsights.aggregated.totalValueLeakage / valueInsights.aggregated.totalPlannedValue) * 100).toFixed(1)}% of planned value
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Avg Realization Rate</p>
                      <p className={`text-2xl font-bold ${valueInsights.aggregated.avgRealizationRate >= 0.9 ? 'text-green-600' : valueInsights.aggregated.avgRealizationRate >= 0.75 ? 'text-amber-600' : 'text-red-600'}`}>
                        {(valueInsights.aggregated.avgRealizationRate * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {valueInsights.aggregated.avgRealizationRate >= 0.9 ? 'Excellent' : valueInsights.aggregated.avgRealizationRate >= 0.75 ? 'Acceptable' : 'Needs attention'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">On Track</p>
                      <p className="text-2xl font-bold text-green-600">
                        {valueInsights.aggregated.projectsOnTrack}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((valueInsights.aggregated.projectsOnTrack / valueInsights.aggregated.totalProjects) * 100).toFixed(0)}% of portfolio
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-amber-200">
                      <p className="text-xs text-gray-500 mb-1">At Risk</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {valueInsights.aggregated.projectsAtRisk}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((valueInsights.aggregated.projectsAtRisk / valueInsights.aggregated.totalProjects) * 100).toFixed(0)}% of portfolio
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-red-200">
                      <p className="text-xs text-gray-500 mb-1">High Risk</p>
                      <p className="text-2xl font-bold text-red-600">
                        {valueInsights.aggregated.projectsHighRisk}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((valueInsights.aggregated.projectsHighRisk / valueInsights.aggregated.totalProjects) * 100).toFixed(0)}% of portfolio
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unified Metrics Section - VRO and PMO side by side */}
            <UnifiedMetricsSection onDrillDown={handleDrillDown} />

          </TabsContent>

          {/* Portfolios Tab - BU Programs */}
          <TabsContent value="portfolios" className="space-y-6">
            {/* AI Executive Intelligence - Portfolio-level insights */}
            <AIExecutiveInsights />

            {/* Reportable Segments & Corporate Functions Overview */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Reportable Segments & Corporate Functions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Click any segment to view detailed projects and metrics
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {divisionsLoading ? (
                  <div className="col-span-3 flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : divisions.map((segment) => (
                <div 
                  key={segment.id}
                  className="p-3 rounded-lg border bg-white hover:shadow-md transition-all cursor-pointer group"
                  style={{ borderLeftColor: segment.color || '#666', borderLeftWidth: '4px' }}
                  data-testid={`card-segment-${segment.id}`}
                  onClick={() => handleDrillDown("segment", segment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{segment.name}</p>
                      <p className="text-lg font-bold" style={{ color: segment.color || '#333' }}>{formatMoney(segment.profit2024 ?? 0)}</p>
                      <Badge variant={(segment.changePercent ?? 0) >= 0 ? "default" : "destructive"} className="text-xs mt-1">
                        {(segment.changePercent ?? 0) >= 0 ? "+" : ""}{segment.changePercent ?? 0}%
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              ))}
              
              <div 
                className="p-3 rounded-lg border border-green-200 bg-green-50 hover:shadow-md transition-all cursor-pointer group" 
                data-testid="card-sustainability"
                onClick={() => handleDrillDown("sustainability", "sustainability-overview")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <p className="text-xs text-green-700 font-medium">Sustainability</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">-60%</p>
                    <p className="text-xs text-green-600">emissions</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-green-400 group-hover:text-green-600 transition-colors" />
                </div>
              </div>
              
              <div 
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:shadow-md transition-all cursor-pointer group" 
                data-testid="card-risk"
                onClick={() => handleDrillDown("risk", "risk-overview")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-slate-600" />
                      <p className="text-xs text-slate-700 font-medium">Risk Center</p>
                    </div>
                    <p className="text-lg font-bold text-slate-600">5 Categories</p>
                    <p className="text-xs text-slate-500">3 Lines</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
              </div>
            </div>

            {/* Autonomous Risk Mitigation */}
            <AutonomousRiskAgent onNavigateToProject={(id) => navigate(`/project/${id}`)} />

            {/* Multi-Agent Discussion */}
            <MultiAgentDiscussion />

            {/* Cross-Agent Collaboration */}
            <CrossAgentCollaboration />

          </TabsContent>

          {/* KPI Tracking Tab */}
          <TabsContent value="kpi-tracking">
            <KPIAttributionPanel />
          </TabsContent>

          {/* Project Lifecycle Command Center - VRO Only */}
          <TabsContent value="lifecycle">
            <ProjectLifecycleCommandCenter onDrillDown={handleDrillDown} />
          </TabsContent>

          {/* Agent Command Center Tab */}
          <TabsContent value="agent-command" className="space-y-6">
            <AgentCommandCenter onNavigateToProject={(id) => navigate(`/project/${id}`)} />
          </TabsContent>

        </Tabs>
      </main>
      </div>
      
      <footer className="mt-12 py-8 border-t border-border bg-white px-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Data Sources & Citations</p>
              <div className="text-xs text-muted-foreground space-y-1">
                {profile?.company && profile.meta?.extractedAt ? (
                  <>
                    <p>† Data extracted from {companyName} Annual Report</p>
                    <p>† Metrics and objectives from company strategic plan</p>
                    <p>† Organizational structure from SEC filings</p>
                    <p>† Governance rules from corporate policies</p>
                    <p>† Extracted: {new Date(profile.meta.extractedAt).toLocaleDateString()}</p>
                  </>
                ) : (
                  <>
                    <p>† Revenue target ($28bn): Enterprise Annual Report 2024</p>
                    <p>† Clean Energy Capacity (75GW): Enterprise 10-K 2024</p>
                    <p>† Cost efficiency target: Enterprise Annual Report 2024</p>
                    <p>† Operational risk: Enterprise Annual Report 2024, Risk Factors</p>
                    <p>† Capital investment: Enterprise Annual Report 2024</p>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Data updates from database
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border pt-4">
            <p>© 2026 {companyName}. Internal Use Only.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <DrillDownDrawer
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        entityType={drillDownEntity?.type || ""}
        entityId={drillDownEntity?.id || ""}
        dataMode="VRO"
        onNavigate={(type, id) => {
          setDrillDownEntity({ type, id });
        }}
      />
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
