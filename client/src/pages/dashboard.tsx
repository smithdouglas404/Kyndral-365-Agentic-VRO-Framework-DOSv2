import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, TrendingUp, Filter, Search, User, Target, Link as LinkIcon, FileText, ArrowRight, RefreshCw, Play, Pause, Download, TrendingDown, Brain, BarChart3, Building2, AlertCircle, Briefcase, AlertOctagon, PieChart, FileCode, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenarioChartsGrid } from "@/components/ScenarioCharts";
import { IndustryBenchmarksSection } from "@/components/IndustryBenchmarks";
import { BusinessPerformanceSection } from "@/components/BusinessPerformance";
import { AIProactiveInsightsSection } from "@/components/AIProactiveInsights";
import { AICommandCenter } from "@/components/AICommandCenter";
import { BUProgramsSection } from "@/components/BUProgramsSection";
import { AIAlertTicker } from "@/components/AIAlertTicker";
import { ExecutiveCommandCenter } from "@/components/ExecutiveCommandCenter";
import { VROMetricsTable } from "@/components/VROMetricsTable";
import { BusinessCaseAssessment } from "@/components/BusinessCaseAssessment";
import { EarlyWarningDashboard } from "@/components/EarlyWarningDashboard";
import { KPIAttributionPanel } from "@/components/KPIAttributionPanel";
import { AgentSidebar } from "@/components/AgentSidebar";
import { CrossAgentCollaboration } from "@/components/CrossAgentCollaboration";
import { AIRecommendations } from "@/components/AIRecommendations";
import { RiskConfidenceMetrics } from "@/components/RiskConfidenceMetrics";
import { Scenario, scenarios, lgAnnualReportData } from "@/lib/scenarios";
import { divisions, lgCompanyOverview, aiAlerts } from "@/lib/lgData";
import { colors } from "@/lib/designTokens";
import { Leaf, Shield, Sparkles, Building, ChevronRight, Bot } from "lucide-react";
import { PageAgentWizard } from "@/components/PageAgentWizard";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { PMOPipeline } from "@/components/PMOPipeline";
import { PMOGuidance } from "@/components/PMOGuidance";
import { PMOProjectWorkspace } from "@/components/PMOProjectWorkspace";
import { PMOCoPilotWorkspace } from "@/components/PMOCoPilotWorkspace";
import { SimulationProvider } from "@/components/SimulationProvider";
import { VROMetricsGrid } from "@/components/VROMetricCard";
import { useSimulation } from "@/lib/liveSimulationEngine";
import { Switch } from "@/components/ui/switch";
import { GitBranch, BookOpen, Compass } from "lucide-react";
import { getPMOOverviewMetrics } from "@/lib/unifiedMetrics";
import { AgentActivityPanel } from "@/components/AgentActivityPanel";
import { startBackgroundMonitor, stopBackgroundMonitor, setActionNotificationCallback } from "@/lib/backgroundAgentMonitor";
import { startOrchestrator, stopOrchestrator } from "@/lib/agentOrchestrator";
import { toast } from "sonner";
import { ActionAuditTimeline } from "@/components/ActionAuditTimeline";

// L&G Design System Colors (Enterprise Transformation Team 2026)
const LG = {
  blue: colors.brand.blue,      // #005EB8 - Primary actions, links, navigation
  teal: colors.brand.teal,      // #00843D - Positive trends, success states
  red: colors.brand.red,        // #D50032 - Alerts, errors, negative trends
  yellow: colors.brand.yellow,  // #FFD700 - Subtle highlights
  grey500: colors.neutral.grey500, // #757575 - Secondary text
  grey700: colors.neutral.grey700, // #424242 - Icons
};

type DataMode = "VRO" | "PMO";

// Shared VRO metrics data - Used by both VRO and PMO views (PMO rolls up to VRO)
const VRO_METRICS_DATA = [
  { 
    id: "current-roi",
    label: "Current ROI", 
    value: "64",
    unit: "%",
    color: "text-[#D50032]",
    source: "VRO Financial Analysis"
  },
  { 
    id: "net-present-value",
    label: "Net Present Value", 
    value: "$36.25",
    unit: "M",
    color: "text-[#005EB8]",
    source: "5-year projection"
  },
  { 
    id: "timeline-progress",
    label: "Timeline Progress", 
    value: "69",
    unit: "%",
    color: "text-[#00843D]",
    source: "Value Stream Mapping"
  },
  { 
    id: "budget-utilization",
    label: "Budget Utilization", 
    value: "94",
    unit: "%",
    color: "text-[#FFD700]",
    source: "FinOps Tracking"
  },
];

// VRO Metrics Summary - Shown in PMO view to show PMO rolls up to VRO (Uses live simulation data)
function VROMetricsSummaryLive() {
  const { state } = useSimulation();
  const metrics = state.vroMetrics;
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#005EB8]" />
          <span className="text-sm font-medium text-gray-600">VRO Stats (PMO Rolls Up)</span>
          {state.isLive && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </motion.div>
          )}
        </div>
        <span className="text-xs text-gray-400">Updated: {state.lastUpdate.toLocaleTimeString()}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map((metric, i) => {
          const isPulsing = state.pulsingMetrics.includes(`vro-${metric.id}`);
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

// Original static VRO Metrics Summary (fallback)
function VROMetricsSummary() {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[#005EB8]" />
        <span className="text-sm font-medium text-gray-600">VRO Stats (PMO Rolls Up)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {VRO_METRICS_DATA.map((kpi, i) => (
          <div
            key={kpi.id}
            className="bg-blue-50 border border-blue-200 rounded-[4px] p-4 flex flex-col"
            data-testid={`vro-stat-${kpi.id}`}
          >
            <span className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</span>
              <span className="text-sm text-gray-500">{kpi.unit}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-[10px] font-semibold text-[#005EB8]">{kpi.source}</p>
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
        isLive ? "border-[#00843D] text-[#00843D] bg-[#00843D]/10" : "border-gray-300"
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

function LGReportStats({ mode, onDrillDown }: { mode: DataMode; onDrillDown?: (type: string, id: string) => void }) {
  // VRO shows value-focused metrics (ROI, NPV, Benefits Realization)
  const vroStats = [
    { 
      id: "current-roi",
      label: "Current ROI", 
      value: "64",
      unit: "%",
      baseline: "0%",
      target: "85%",
      icon: TrendingUp, 
      color: "text-[#D50032]",
      source: "VRO Financial Analysis",
      progress: 75,
      delta: "-74% vs baseline"
    },
    { 
      id: "net-present-value",
      label: "Net Present Value", 
      value: "$36.25",
      unit: "M",
      baseline: "$0",
      target: "$50M",
      icon: Activity, 
      color: "text-[#005EB8]",
      source: "5-year projection",
      progress: 73,
      delta: "+$60K"
    },
    { 
      id: "timeline-progress",
      label: "Timeline Progress", 
      value: "69",
      unit: "%",
      baseline: "Phase 1",
      target: "Phase 4",
      icon: Clock, 
      color: "text-[#00843D]",
      source: "Value Stream Mapping",
      progress: 69,
      delta: "Phase 2 of 4, -6%"
    },
    { 
      id: "budget-utilization",
      label: "Budget Utilization", 
      value: "94",
      unit: "%",
      baseline: "$0",
      target: "$41.2M",
      icon: Target, 
      color: "text-[#FFD700]",
      source: "FinOps Tracking",
      progress: 94,
      delta: "$41.2M spent, +6% over"
    },
  ];

  // PMO shows project delivery metrics (different from VRO's value metrics)
  const pmoStats = [
    { 
      id: "cycle-time",
      label: "Cycle Time", 
      value: "19",
      unit: "days",
      baseline: "35 days",
      target: "10 days",
      icon: Clock, 
      color: "text-[#005EB8]",
      source: "PMO Flow Metrics",
      progress: 64,
      delta: "+8 days vs target"
    },
    { 
      id: "flow-efficiency",
      label: "Flow Efficiency", 
      value: "69",
      unit: "%",
      baseline: "45%",
      target: "50%",
      icon: Activity, 
      color: "text-[#D50032]",
      source: "Lean/Agile Metrics",
      progress: 138,
      delta: "-6% vs target"
    },
    { 
      id: "throughput",
      label: "Throughput", 
      value: "11",
      unit: "items/week",
      baseline: "8 items/week",
      target: "25 items/week",
      icon: TrendingUp, 
      color: "text-[#00843D]",
      source: "Sprint Analytics",
      progress: 44,
      delta: "+3 vs last week"
    },
    { 
      id: "wip-items",
      label: "WIP Items", 
      value: "9",
      unit: "/ 12",
      baseline: "12 items",
      target: "8 items",
      icon: Target, 
      color: "text-[#005EB8]",
      source: "Kanban Board",
      progress: 75,
      delta: "3 slots available"
    },
  ];

  const stats = mode === "VRO" ? vroStats : pmoStats;

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
                <span className="font-medium text-[#00843D]">2026: {stat.target}</span>
              </div>
              <Progress value={stat.progress} className="h-2" />
              <div className="text-xs text-right mt-1 font-medium" style={{ color: mode === "VRO" ? "#00843D" : "#757575" }}>
                {stat.progress}% to target
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-[#005EB8]">{stat.source}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function NavBar() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[#005EB8] tracking-tight cursor-pointer whitespace-nowrap" data-testid="link-home">Legal & General</div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[#005EB8]" data-testid="link-dashboard">Dashboard</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search dashboard..." 
            className="pl-9 h-9 bg-background border-border rounded-[4px]" 
            data-testid="input-search"
          />
        </div>
        <Button size="icon" variant="ghost" className="rounded-full" data-testid="button-user" onClick={() => alert('User Profile\n\nAccount settings, preferences, and logout options would appear here.')}>
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}

function DashboardContent() {
  const [location, navigate] = useLocation();
  const [selectedScenario] = useState<Scenario>(scenarios[0]);
  const [exportOpen, setExportOpen] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>("VRO");
  const [activeTab, setActiveTab] = useState("overview");
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState<{type: string; id: string} | null>(null);
  
  const { state, toggleLive, forceUpdate } = useSimulation();

  // Always redirect to VRO dashboard on initial load
  useEffect(() => {
    if (location === '/dashboard/pmo') {
      navigate('/dashboard', { replace: true });
    }
  }, []);
  
  // Start background agent monitor and orchestrator with toast notifications
  useEffect(() => {
    setActionNotificationCallback((agentName, action, target) => {
      toast.info(`${agentName} ${action} ${target}`, {
        description: "Agent action completed",
        duration: 5000,
      });
    });
    startBackgroundMonitor(15000);
    startOrchestrator(5000, 45000);
    return () => {
      stopBackgroundMonitor();
      stopOrchestrator();
    };
  }, []);
  
  // Handle mode changes through sidebar clicks only (not URL)

  const handleDrillDown = (type: string, id: string) => {
    if (type === 'division') {
      navigate(`/division/${id}`);
      return;
    }
    if (type === 'climate' && id === 'climate-overview') {
      navigate('/climate');
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
        <AgentSidebar dataMode={dataMode} onModeChange={setDataMode} />
        
        <main className="flex-1 px-8 py-8 max-w-[1400px]">
          <PageAgentWizard 
            context={{
              pageName: dataMode === "VRO" ? 'VRO Intelligence Engine' : 'PMO Control Center',
              pageType: 'dashboard',
              entityId: dataMode === "VRO" ? 'vro' : 'pmo',
              metrics: dataMode === "VRO" 
                ? {
                    'PRT Volume': lgAnnualReportData.prtVolume.actual2025,
                    'Forecast Accuracy': lgAnnualReportData.forecastAccuracy.actual2025,
                    'Cost Savings': lgAnnualReportData.costSavings.actual2025,
                    'Active Alerts': aiAlerts.length
                  }
                : (() => {
                    const pmoMetrics = getPMOOverviewMetrics();
                    return {
                      'Active Projects': pmoMetrics.activeProjects,
                      'On Track': pmoMetrics.onTrack,
                      'At Risk': pmoMetrics.atRisk + pmoMetrics.critical,
                      'SAFe Stages': pmoMetrics.safeStages
                    };
                  })()
            }}
            agentName={dataMode === "VRO" ? "VRO Agent" : "PMO Agent"}
          />

        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-[48px] font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
              {dataMode === "VRO" ? "VRO Intelligence Engine" : "PMO Control Center"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {dataMode === "VRO" 
                ? "AI-powered strategic transformation with real-time value realization insights."
                : "Traditional project management with standard governance and oversight."}
            </p>
          </motion.div>
          
                    
          <div className="flex items-center gap-3">
                        
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-export">
                  <Download size={16} />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Export Dashboard</DialogTitle>
                  <DialogDescription>Download current view with L&G benchmarks</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  {[
                    { format: "PDF Executive Summary", desc: "Full report with citations" },
                    { format: "Excel Workbook", desc: "Raw data for analysis" },
                    { format: "PowerPoint", desc: "Presentation-ready slides" },
                  ].map((option, i) => (
                    <div 
                      key={i} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center" 
                      data-testid={`export-option-${i}`}
                      onClick={() => {
                        alert(`Exporting ${option.format}...\n\n${option.desc}\n\nYour download will begin shortly.`);
                        setExportOpen(false);
                      }}
                    >
                      <div>
                        <span className="font-medium text-sm">{option.format}</span>
                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                      </div>
                      <Download size={16} className="text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            
            {activeTab === "overview" && (
              <Link href="/value-proposition">
                <Button className="gap-2 bg-[#005EB8] hover:bg-[#004494] text-white shadow-sm transition-all hover:-translate-y-0.5" data-testid="button-executive-brief">
                  Read Executive Brief <ArrowRight size={16} />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* L&G Report Anchored Stats */}
        <LGReportStats mode={dataMode} onDrillDown={handleDrillDown} />


        {/* AI Alert Ticker - Living Dashboard */}
        <div className="mt-6">
          <AIAlertTicker />
        </div>

        {/* Quick Navigation - Division Pages, Climate, Risk - VRO ONLY */}
        {dataMode === "VRO" && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {divisions.map((division) => (
              <div 
                key={division.id}
                className="p-3 rounded-lg border bg-white hover:shadow-md transition-all cursor-pointer group"
                style={{ borderLeftColor: division.color, borderLeftWidth: '4px' }}
                data-testid={`card-division-${division.id}`}
                onClick={() => handleDrillDown("division", division.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{division.name.split(' ')[0]}</p>
                    <p className="text-lg font-bold" style={{ color: division.color }}>£{division.profit2024}m</p>
                    <Badge variant={division.changePercent >= 0 ? "default" : "destructive"} className="text-xs mt-1">
                      {division.changePercent >= 0 ? "+" : ""}{division.changePercent}%
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            ))}
            
            <div 
              className="p-3 rounded-lg border border-green-200 bg-green-50 hover:shadow-md transition-all cursor-pointer group" 
              data-testid="card-climate"
              onClick={() => handleDrillDown("climate", "climate-overview")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-700 font-medium">Climate</p>
                  </div>
                  <p className="text-lg font-bold text-green-600">-37%</p>
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
        )}


        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1 rounded-lg mb-8">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-overview"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="portfolios" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-portfolios"
            >
              <Building2 size={16} />
              <span className="hidden sm:inline">Portfolios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="business-cases" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-business-cases"
            >
              <Briefcase size={16} />
              <span className="hidden sm:inline">Business Cases</span>
            </TabsTrigger>
            <TabsTrigger 
              value="early-warning" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-early-warning"
            >
              <AlertOctagon size={16} />
              <span className="hidden sm:inline">Early Warning</span>
            </TabsTrigger>
            <TabsTrigger 
              value="kpi-tracking" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-kpi-tracking"
            >
              <PieChart size={16} />
              <span className="hidden sm:inline">KPIs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai-insights" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-ai-insights"
            >
              <Brain size={16} />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="benchmarks" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-benchmarks"
            >
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Benchmarks</span>
            </TabsTrigger>
            {dataMode === "VRO" && (
              <TabsTrigger 
                value="performance" 
                className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
                data-testid="tab-performance"
              >
                <Target size={16} />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
            )}
            {dataMode === "PMO" && (
              <>
                <TabsTrigger 
                  value="pipeline" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
                  data-testid="tab-pipeline"
                >
                  <GitBranch size={16} />
                  <span className="hidden sm:inline">Pipeline</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="workspace" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
                  data-testid="tab-workspace"
                >
                  <Compass size={16} />
                  <span className="hidden sm:inline">Co-Pilot</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Agent Activity Feed */}
            <AgentActivityPanel maxItems={10} />

            {/* AI Recommendations - Always shown first */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AIRecommendations dataMode={dataMode} />
              </div>
              <div>
                <RiskConfidenceMetrics dataMode={dataMode} />
              </div>
            </div>

            {/* PMO Guidance Section - Only in PMO Mode */}
            {dataMode === "PMO" && (
              <PMOGuidance />
            )}

            {/* Cross-Agent Collaboration */}
            <CrossAgentCollaboration />

          </TabsContent>

          {/* Portfolios Tab - BU Programs with drill-down */}
          <TabsContent value="portfolios">
            <BUProgramsSection dataMode={dataMode} />
          </TabsContent>

          {/* Business Cases Tab */}
          <TabsContent value="business-cases">
            <BusinessCaseAssessment />
          </TabsContent>

          {/* Early Warning Tab */}
          <TabsContent value="early-warning">
            <EarlyWarningDashboard />
          </TabsContent>

          {/* KPI Tracking Tab */}
          <TabsContent value="kpi-tracking">
            <KPIAttributionPanel />
          </TabsContent>

          {/* AI Insights Tab - Available in both PMO and VRO modes */}
          <TabsContent value="ai-insights">
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExecutiveCommandCenter />
                <ActionAuditTimeline maxItems={15} />
              </div>
              <AICommandCenter />
              <AIProactiveInsightsSection />
            </div>
          </TabsContent>

          {/* Industry Benchmarks Tab */}
          <TabsContent value="benchmarks">
            <IndustryBenchmarksSection />
          </TabsContent>

          {/* Business Performance Tab */}
          <TabsContent value="performance">
            <BusinessPerformanceSection mode={dataMode} />
          </TabsContent>


          {/* Pipeline Tab - PMO Only */}
          <TabsContent value="pipeline" className="space-y-6">
            <PMOPipeline />
          </TabsContent>

          {/* Workspace Tab - PMO Co-Pilot */}
          <TabsContent value="workspace" className="space-y-6">
            <PMOCoPilotWorkspace />
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
                <p>† PRT volume target (£10bn): L&G Annual Report 2024, p.12</p>
                <p>† Forecast accuracy target (85%): L&G Annual Report 2024, p.45</p>
                <p>† Cost savings target (£200m): L&G Annual Report 2024, p.23</p>
                <p>† Transformation risk: L&G Annual Report 2024, Principal Risks (p.78)</p>
                <p>† Digital investment (£150m): L&G Annual Report 2024, p.34</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {state.isLive ? "Data refreshes every 4 seconds (LIVE)" : "Live updates paused"}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border pt-4">
            <p>© 2026 Legal & General. Internal Use Only.</p>
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
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <SimulationProvider>
      <DashboardContent />
    </SimulationProvider>
  );
}
