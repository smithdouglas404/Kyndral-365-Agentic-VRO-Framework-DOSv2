import { challenges, pmoChallenges } from "@/lib/data";
import { ChallengeCard } from "@/components/ChallengeCard";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, TrendingUp, Filter, Search, User, Target, Link as LinkIcon, FileText, ArrowRight, RefreshCw, Play, Pause, Download, TrendingDown, Brain, BarChart3, Building2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenarioWorkflow } from "@/components/ScenarioWorkflow";
import { ScenarioChartsGrid } from "@/components/ScenarioCharts";
import { IndustryBenchmarksSection } from "@/components/IndustryBenchmarks";
import { BusinessPerformanceSection } from "@/components/BusinessPerformance";
import { AIProactiveInsightsSection } from "@/components/AIProactiveInsights";
import { Scenario, StageId, scenarios, lgAnnualReportData } from "@/lib/scenarios";

type DataMode = "VRO" | "PMO";

function VROPMOToggle({ mode, onModeChange }: { mode: DataMode; onModeChange: (mode: DataMode) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onModeChange("VRO")}
        className={cn(
          "px-5 py-3 rounded-lg text-sm font-semibold transition-all",
          mode === "VRO" 
            ? "bg-[hsl(209,100%,36%)] text-white shadow-md" 
            : "bg-gray-100 text-[hsl(209,100%,36%)] hover:bg-gray-200"
        )}
        data-testid="toggle-vro"
      >
        Value Realization Office
      </button>
      <button
        onClick={() => onModeChange("PMO")}
        className={cn(
          "px-5 py-3 rounded-lg text-sm font-semibold transition-all",
          mode === "PMO" 
            ? "bg-[hsl(220,15%,60%)] text-[hsl(209,100%,36%)] shadow-md" 
            : "bg-gray-100 text-[hsl(209,100%,36%)] hover:bg-gray-200"
        )}
        data-testid="toggle-pmo"
      >
        Project Management Office
      </button>
    </div>
  );
}

function LiveIndicator({ isLive, onToggle }: { isLive: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={cn(
        "gap-2 transition-all",
        isLive ? "border-green-500 text-green-600 bg-green-50" : "border-gray-300"
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

function LGReportStats({ mode }: { mode: DataMode }) {
  const vroStats = [
    { 
      label: "PRT Volume (2025)", 
      value: `${lgAnnualReportData.prtVolume.actual2025}`,
      unit: lgAnnualReportData.prtVolume.unit,
      baseline: `${lgAnnualReportData.prtVolume.baseline2024} ${lgAnnualReportData.prtVolume.unit}`,
      target: `${lgAnnualReportData.prtVolume.target2026} ${lgAnnualReportData.prtVolume.unit}`,
      icon: Target, 
      color: "text-[hsl(209,100%,36%)]",
      source: lgAnnualReportData.prtVolume.source,
      progress: Math.round(((lgAnnualReportData.prtVolume.actual2025 - lgAnnualReportData.prtVolume.baseline2024) / (lgAnnualReportData.prtVolume.target2026 - lgAnnualReportData.prtVolume.baseline2024)) * 100)
    },
    { 
      label: "Forecast Accuracy (2025)", 
      value: `${lgAnnualReportData.forecastAccuracy.actual2025}`,
      unit: lgAnnualReportData.forecastAccuracy.unit,
      baseline: `${lgAnnualReportData.forecastAccuracy.baseline2024} ${lgAnnualReportData.forecastAccuracy.unit}`,
      target: `${lgAnnualReportData.forecastAccuracy.target2026} ${lgAnnualReportData.forecastAccuracy.unit}`,
      icon: Activity, 
      color: "text-[hsl(148,100%,26%)]",
      source: lgAnnualReportData.forecastAccuracy.source,
      progress: Math.round(((lgAnnualReportData.forecastAccuracy.actual2025 - lgAnnualReportData.forecastAccuracy.baseline2024) / (lgAnnualReportData.forecastAccuracy.target2026 - lgAnnualReportData.forecastAccuracy.baseline2024)) * 100)
    },
    { 
      label: "Cost Savings (2025)", 
      value: `${lgAnnualReportData.costSavings.actual2025}`,
      unit: lgAnnualReportData.costSavings.unit,
      baseline: `${lgAnnualReportData.costSavings.baseline2024} ${lgAnnualReportData.costSavings.unit}`,
      target: `${lgAnnualReportData.costSavings.target2026} ${lgAnnualReportData.costSavings.unit}`,
      icon: TrendingUp, 
      color: "text-[hsl(51,100%,50%)]",
      source: lgAnnualReportData.costSavings.source,
      progress: Math.round((lgAnnualReportData.costSavings.actual2025 / lgAnnualReportData.costSavings.target2026) * 100)
    },
    { 
      label: "Cycle Time (2025)", 
      value: `${lgAnnualReportData.cycleTime.actual2025}`,
      unit: lgAnnualReportData.cycleTime.unit,
      baseline: `${lgAnnualReportData.cycleTime.baseline2024} ${lgAnnualReportData.cycleTime.unit}`,
      target: `${lgAnnualReportData.cycleTime.target2026} ${lgAnnualReportData.cycleTime.unit}`,
      icon: Clock, 
      color: "text-[hsl(209,100%,36%)]",
      source: lgAnnualReportData.cycleTime.source,
      progress: Math.round(((lgAnnualReportData.cycleTime.baseline2024 - lgAnnualReportData.cycleTime.actual2025) / (lgAnnualReportData.cycleTime.baseline2024 - lgAnnualReportData.cycleTime.target2026)) * 100)
    },
  ];

  const pmoStats = [
    { 
      label: "PRT Volume (2025)", 
      value: `${(lgAnnualReportData.prtVolume.baseline2024 + (lgAnnualReportData.prtVolume.target2026 - lgAnnualReportData.prtVolume.baseline2024) * 0.35).toFixed(1)}`,
      unit: lgAnnualReportData.prtVolume.unit,
      baseline: `${lgAnnualReportData.prtVolume.baseline2024} ${lgAnnualReportData.prtVolume.unit}`,
      target: `${lgAnnualReportData.prtVolume.target2026} ${lgAnnualReportData.prtVolume.unit}`,
      icon: Target, 
      color: "text-[hsl(220,15%,60%)]",
      source: `PMO: 35% progress vs VRO 50% (${lgAnnualReportData.prtVolume.source})`,
      progress: 35
    },
    { 
      label: "Forecast Accuracy (2025)", 
      value: `${Math.round(lgAnnualReportData.forecastAccuracy.baseline2024 + (lgAnnualReportData.forecastAccuracy.target2026 - lgAnnualReportData.forecastAccuracy.baseline2024) * 0.25)}`,
      unit: lgAnnualReportData.forecastAccuracy.unit,
      baseline: `${lgAnnualReportData.forecastAccuracy.baseline2024} ${lgAnnualReportData.forecastAccuracy.unit}`,
      target: `${lgAnnualReportData.forecastAccuracy.target2026} ${lgAnnualReportData.forecastAccuracy.unit}`,
      icon: Activity, 
      color: "text-[hsl(220,15%,60%)]",
      source: `PMO: 25% progress vs VRO 59% (${lgAnnualReportData.forecastAccuracy.source})`,
      progress: 25
    },
    { 
      label: "Cost Savings (2025)", 
      value: `${Math.round(lgAnnualReportData.costSavings.target2026 * 0.28)}`,
      unit: lgAnnualReportData.costSavings.unit,
      baseline: `${lgAnnualReportData.costSavings.baseline2024} ${lgAnnualReportData.costSavings.unit}`,
      target: `${lgAnnualReportData.costSavings.target2026} ${lgAnnualReportData.costSavings.unit}`,
      icon: TrendingUp, 
      color: "text-[hsl(220,15%,60%)]",
      source: `PMO: 28% progress vs VRO 56% (${lgAnnualReportData.costSavings.source})`,
      progress: 28
    },
    { 
      label: "Cycle Time (2025)", 
      value: `${Math.round(lgAnnualReportData.cycleTime.baseline2024 - (lgAnnualReportData.cycleTime.baseline2024 - lgAnnualReportData.cycleTime.target2026) * 0.30)}`,
      unit: lgAnnualReportData.cycleTime.unit,
      baseline: `${lgAnnualReportData.cycleTime.baseline2024} ${lgAnnualReportData.cycleTime.unit}`,
      target: `${lgAnnualReportData.cycleTime.target2026} ${lgAnnualReportData.cycleTime.unit}`,
      icon: Clock, 
      color: "text-[hsl(220,15%,60%)]",
      source: `PMO: 30% progress vs VRO 57% (${lgAnnualReportData.cycleTime.source})`,
      progress: 30
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
            className="bg-white border border-border rounded-[4px] p-6 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow duration-150"
            data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
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
                <span className="font-medium text-[hsl(148,100%,26%)]">2026: {stat.target}</span>
              </div>
              <Progress value={stat.progress} className="h-2" />
              <div className="text-xs text-right mt-1 font-medium" style={{ color: mode === "VRO" ? "hsl(148,100%,26%)" : "hsl(220,15%,60%)" }}>
                {stat.progress}% to target
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-2 text-[10px] text-muted-foreground cursor-help flex items-center gap-1">
                    <span className="underline decoration-dotted">Source†</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs bg-white border shadow-lg p-3">
                  <p className="text-xs text-[hsl(209,100%,36%)] font-medium">{stat.source}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        );
      })}
    </div>
  );
}

interface NavBarProps {
  onProjectSelect?: (scenarioId: string) => void;
}

function NavBar({ onProjectSelect }: NavBarProps) {
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const projectData = [
    { name: "PRT Pipeline Acceleration", status: "On Track", progress: 78, scenarioId: "accelerate-prt" },
    { name: "Governance Automation Platform", status: "On Track", progress: 65, scenarioId: "governance-uplift" },
    { name: "Real-time Reporting Engine", status: "At Risk", progress: 42, scenarioId: "digitize-operations" },
    { name: "Benefits Tracking System", status: "On Track", progress: 91, scenarioId: "accelerate-prt" },
    { name: "Compliance Automation", status: "Complete", progress: 100, scenarioId: "governance-uplift" },
  ];

  const handleProjectClick = (scenarioId: string) => {
    if (onProjectSelect) {
      onProjectSelect(scenarioId);
    }
    setProjectsOpen(false);
  };

  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[hsl(209,100%,36%)] tracking-tight cursor-pointer whitespace-nowrap" data-testid="link-home">Legal & General</div>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-[hsl(209,100%,36%)]" data-testid="link-dashboard">Dashboard</Link>
          <Link href="/value-proposition" className="text-sm font-medium text-muted-foreground hover:text-[hsl(209,100%,36%)] transition-colors" data-testid="link-value-proposition">Strategic Value</Link>
          
          <Dialog open={projectsOpen} onOpenChange={setProjectsOpen}>
            <DialogTrigger asChild>
              <button className="text-sm font-medium text-muted-foreground hover:text-[hsl(209,100%,36%)] transition-colors" data-testid="button-projects">Projects</button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Active Projects</DialogTitle>
                <DialogDescription>Current transformation initiatives aligned to VRO scenarios</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {projectData.map((project, i) => {
                  const scenarioName = scenarios.find(s => s.id === project.scenarioId)?.name || project.scenarioId;
                  return (
                    <div 
                      key={i} 
                      className="p-3 border rounded-lg hover:bg-[hsl(209,100%,36%)]/5 hover:border-[hsl(209,100%,36%)]/30 cursor-pointer transition-all" 
                      onClick={() => handleProjectClick(project.scenarioId)}
                      data-testid={`project-item-${i}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{project.name}</span>
                        <Badge variant={project.status === "On Track" ? "default" : project.status === "At Risk" ? "destructive" : "secondary"} className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">Scenario: {scenarioName}</span>
                        <span className="text-xs font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all",
                            project.status === "At Risk" ? "bg-yellow-500" : "bg-[hsl(148,100%,26%)]"
                          )}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-[hsl(209,100%,36%)] font-medium">
                        Click to view scenario →
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={reportsOpen} onOpenChange={setReportsOpen}>
            <DialogTrigger asChild>
              <button className="text-sm font-medium text-muted-foreground hover:text-[hsl(209,100%,36%)] transition-colors" data-testid="button-reports">Reports</button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Available Reports</DialogTitle>
                <DialogDescription>Download strategic reports with L&G benchmarks</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {[
                  { name: "Q4 2025 VRO Executive Summary", type: "PDF", date: "Dec 2025" },
                  { name: "L&G Annual Report 2024 Extract", type: "PDF", date: "Mar 2024" },
                  { name: "Scenario Impact Assessment", type: "Excel", date: "Dec 2025" },
                  { name: "Benefits Realization Tracker", type: "Excel", date: "Weekly" },
                  { name: "Governance Health Report", type: "PDF", date: "Dec 2025" },
                ].map((report, i) => (
                  <div key={i} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center" data-testid={`report-item-${i}`}>
                    <div>
                      <span className="font-medium text-sm">{report.name}</span>
                      <p className="text-xs text-muted-foreground">{report.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{report.type}</Badge>
                      <Download size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/value-proposition">
          <Button variant="outline" size="sm" className="hidden lg:flex gap-2 text-[hsl(209,100%,36%)] border-[hsl(209,100%,36%)]/30 hover:bg-[hsl(209,100%,36%)]/5" data-testid="button-value-proposition">
            <FileText size={16} />
            Value Proposition
          </Button>
        </Link>
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search dashboard..." 
            className="pl-9 h-9 bg-background border-border rounded-[4px]" 
            data-testid="input-search"
          />
        </div>
        <Button size="icon" variant="ghost" className="rounded-full" data-testid="button-user">
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}

export default function Dashboard() {
  const [activeTheme, setActiveTheme] = useState<Theme | "All">("All");
  const [isLive, setIsLive] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [activeStage, setActiveStage] = useState<StageId>("design");
  const [exportOpen, setExportOpen] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>("VRO");
  const [relationshipsOpen, setRelationshipsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const filteredChallenges = activeTheme === "All" 
    ? challenges 
    : challenges.filter(c => c.themes.includes(activeTheme));

  const themes: Theme[] = ["Automation", "Governance", "Data & Insights", "Value", "Speed"];

  const handleScenarioChange = useCallback((scenario: Scenario, stage: StageId) => {
    setSelectedScenario(scenario);
    setActiveStage(stage);
  }, []);

  const handleProjectSelect = useCallback((scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setSelectedScenario(scenario);
      setActiveTab("overview");
    }
  }, []);

  
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar onProjectSelect={handleProjectSelect} />

      <main className="container mx-auto px-8 py-8 max-w-[1400px]">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-[48px] font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
              {dataMode === "VRO" ? "VRO Strategy Dashboard" : "PMO Strategy Dashboard"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {dataMode === "VRO" 
                ? "Strategic transformation powered by L&G Annual Report 2024 benchmarks and VRO methodology."
                : "Traditional project management approach with standard governance and oversight."}
            </p>
          </motion.div>
          
          <VROPMOToggle mode={dataMode} onModeChange={setDataMode} />
          
          <div className="flex items-center gap-3">
            <LiveIndicator isLive={isLive} onToggle={() => setIsLive(!isLive)} />
                        
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
                    <div key={i} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center" data-testid={`export-option-${i}`}>
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
            
            <Link href="/value-proposition">
              <Button className="gap-2 bg-[hsl(209,100%,36%)] hover:bg-[hsl(209,100%,32%)] text-white shadow-sm transition-all hover:-translate-y-0.5" data-testid="button-executive-brief">
                Read Executive Brief <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>

        {/* L&G Report Anchored Stats */}
        <LGReportStats mode={dataMode} />

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 rounded-lg mb-8">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-overview"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Overview</span>
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
            <TabsTrigger 
              value="performance" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-performance"
            >
              <Building2 size={16} />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="challenges" 
              className="flex items-center gap-2 data-[state=active]:bg-[#005EB8] data-[state=active]:text-white"
              data-testid="tab-challenges"
            >
              <AlertCircle size={16} />
              <span className="hidden sm:inline">Challenges</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Design → Activate → Measure Value Section */}
            <div className="border-b border-border pb-8">
              <ScenarioWorkflow 
                onScenarioChange={handleScenarioChange} 
                initialScenario={selectedScenario}
                initialStage={activeStage}
              />
            </div>

            {/* Scenario-Driven Charts */}
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div>
                  <h2 className="text-[32px] font-bold text-foreground">Strategic Impact Analysis</h2>
                  <p className="text-muted-foreground">
                    KPIs for <span className="font-semibold text-[hsl(209,100%,36%)]">{selectedScenario.name}</span> scenario
                  </p>
                </div>
              </div>
              <ScenarioChartsGrid scenario={selectedScenario} stage={activeStage} isLive={isLive} />
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights">
            <AIProactiveInsightsSection />
          </TabsContent>

          {/* Industry Benchmarks Tab */}
          <TabsContent value="benchmarks">
            <IndustryBenchmarksSection />
          </TabsContent>

          {/* Business Performance Tab */}
          <TabsContent value="performance">
            <BusinessPerformanceSection />
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
        {/* Challenge Cards */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-border pb-4 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-[32px] font-bold text-foreground">8 Client Challenges</h2>
              <div className="hidden md:flex h-6 w-px bg-border" />
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <Button 
                  variant={activeTheme === "All" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTheme("All")}
                  className={activeTheme === "All" ? "bg-[hsl(209,100%,36%)] text-white" : "text-muted-foreground"}
                  data-testid="filter-all"
                >
                  All ({challenges.length})
                </Button>
                {themes.map(theme => {
                  const count = challenges.filter(c => c.themes.includes(theme)).length;
                  return (
                    <Button
                      key={theme}
                      variant={activeTheme === theme ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTheme(theme)}
                      className={activeTheme === theme ? "bg-[hsl(209,100%,36%)] text-white" : "text-muted-foreground"}
                      data-testid={`filter-${theme.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {theme} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={relationshipsOpen} onOpenChange={setRelationshipsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white rounded-[4px]" data-testid="button-relationships">
                    <LinkIcon className="h-4 w-4" /> View Relationships
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Challenge → Scenario Relationships</DialogTitle>
                    <DialogDescription>How the 8 client challenges map to VRO scenarios and the Design → Activate → Measure Value workflow</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {scenarios.map((scenario) => (
                      <div key={scenario.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[hsl(209,100%,36%)] flex items-center justify-center text-white">
                            {scenario.id === "accelerate-prt" ? "⚡" : scenario.id === "digitize-operations" ? "📊" : "🛡️"}
                          </div>
                          <div>
                            <h4 className="font-semibold">{scenario.name}</h4>
                            <p className="text-xs text-muted-foreground">{scenario.strategicFocus}</p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Addresses these challenges:</p>
                          <div className="flex flex-wrap gap-2">
                            {scenario.challenges.map((challengeId) => {
                              const challenge = challenges.find(c => c.id === challengeId);
                              return (
                                <Badge key={challengeId} variant="outline" className="capitalize">
                                  {challenge?.title || challengeId.replace(/-/g, ' ')}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 rounded bg-[hsl(209,100%,36%)]/10 text-[hsl(209,100%,36%)]">Design</span>
                          <ArrowRight size={12} className="text-muted-foreground" />
                          <span className="px-2 py-1 rounded bg-[hsl(148,100%,26%)]/10 text-[hsl(148,100%,26%)]">Activate</span>
                          <ArrowRight size={12} className="text-muted-foreground" />
                          <span className="px-2 py-1 rounded bg-[hsl(51,100%,40%)]/10 text-[hsl(51,100%,40%)]">Measure Value</span>
                          <span className="ml-2 text-muted-foreground">→ {scenario.expectedROI}</span>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Workflow Integration</h4>
                      <p className="text-xs text-muted-foreground">
                        Each scenario follows the VRO methodology: <strong>Design</strong> strategic interventions, 
                        <strong> Activate</strong> through automation and process changes, then 
                        <strong> Measure Value</strong> against L&G Annual Report 2024 benchmarks.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTheme}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredChallenges.map((challenge, index) => (
                <ChallengeCard key={challenge.id} challenge={challenge} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
          </TabsContent>
        </Tabs>
      </main>
      
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
                {isLive ? "Data refreshes every 4 seconds (LIVE)" : "Live updates paused"}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border pt-4">
            <p>© 2026 Legal & General. Internal Use Only.</p>
            <div className="flex gap-4">
              <Link href="/value-proposition" className="hover:text-primary">Value Proposition</Link>
              <a href="#" className="hover:text-primary">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
