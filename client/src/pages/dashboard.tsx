import { challenges, pmoChallenges } from "@/lib/data";
import { ChallengeCard } from "@/components/ChallengeCard";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, TrendingUp, Filter, Search, User, Target, Link as LinkIcon, FileText, ArrowRight, RefreshCw, Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScenarioWorkflow } from "@/components/ScenarioWorkflow";
import { ScenarioChartsGrid } from "@/components/ScenarioCharts";
import { Scenario, StageId, scenarios, lgAnnualReportData } from "@/lib/scenarios";

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

function LGReportStats() {
  const stats = [
    { 
      label: "PRT Volume Target", 
      value: `${lgAnnualReportData.prtVolume.target}`,
      unit: lgAnnualReportData.prtVolume.unit,
      baseline: `${lgAnnualReportData.prtVolume.baseline}${lgAnnualReportData.prtVolume.unit}`,
      icon: Target, 
      color: "text-[hsl(209,100%,36%)]",
      source: lgAnnualReportData.prtVolume.source
    },
    { 
      label: "Forecast Accuracy", 
      value: `${lgAnnualReportData.forecastAccuracy.target}`,
      unit: lgAnnualReportData.forecastAccuracy.unit,
      baseline: `${lgAnnualReportData.forecastAccuracy.baseline}${lgAnnualReportData.forecastAccuracy.unit}`,
      icon: Activity, 
      color: "text-[hsl(148,100%,26%)]",
      source: lgAnnualReportData.forecastAccuracy.source
    },
    { 
      label: "Cost Savings Target", 
      value: `${lgAnnualReportData.costSavings.target}`,
      unit: lgAnnualReportData.costSavings.unit,
      baseline: `${lgAnnualReportData.costSavings.baseline}${lgAnnualReportData.costSavings.unit}`,
      icon: TrendingUp, 
      color: "text-[hsl(51,100%,50%)]",
      source: lgAnnualReportData.costSavings.source
    },
    { 
      label: "Cycle Time Target", 
      value: `${lgAnnualReportData.cycleTime.target}`,
      unit: lgAnnualReportData.cycleTime.unit,
      baseline: `${lgAnnualReportData.cycleTime.baseline}${lgAnnualReportData.cycleTime.unit}`,
      icon: Clock, 
      color: "text-[hsl(209,100%,36%)]",
      source: lgAnnualReportData.cycleTime.source
    },
  ];

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
              <span className="text-4xl font-bold text-foreground tracking-tight">{stat.value}</span>
              <span className="text-lg text-muted-foreground">{stat.unit}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground line-through">{stat.baseline}</span>
              <ArrowRight size={12} className="text-[hsl(148,100%,26%)]" />
              <span className="text-xs font-medium text-[hsl(148,100%,26%)]">{stat.value}{stat.unit}</span>
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

function NavBar() {
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="font-bold text-2xl text-[hsl(209,100%,36%)] tracking-tight cursor-pointer" data-testid="link-home">Legal & General</div>
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
                {[
                  { name: "PRT Pipeline Acceleration", status: "On Track", progress: 78, scenario: "Accelerate PRT" },
                  { name: "Governance Automation Platform", status: "On Track", progress: 65, scenario: "Governance Uplift" },
                  { name: "Real-time Reporting Engine", status: "At Risk", progress: 42, scenario: "Digitize Operations" },
                  { name: "Benefits Tracking System", status: "On Track", progress: 91, scenario: "Accelerate PRT" },
                  { name: "Compliance Automation", status: "Complete", progress: 100, scenario: "Governance Uplift" },
                ].map((project, i) => (
                  <div key={i} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" data-testid={`project-item-${i}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{project.name}</span>
                      <Badge variant={project.status === "On Track" ? "default" : project.status === "At Risk" ? "destructive" : "secondary"} className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Scenario: {project.scenario}</span>
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
                  </div>
                ))}
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [activeStage, setActiveStage] = useState<StageId>("design");
  const [exportOpen, setExportOpen] = useState(false);

  const filteredChallenges = activeTheme === "All" 
    ? challenges 
    : challenges.filter(c => c.themes.includes(activeTheme));

  const themes: Theme[] = ["Automation", "Governance", "Data & Insights", "Value", "Speed"];

  const handleScenarioChange = useCallback((scenario: Scenario, stage: StageId) => {
    setSelectedScenario(scenario);
    setActiveStage(stage);
  }, []);

  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />

      <main className="container mx-auto px-8 py-8 max-w-[1400px]">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-[48px] font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
              VRO Strategy Dashboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Strategic transformation powered by L&G Annual Report 2024 benchmarks and VRO methodology.
            </p>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <LiveIndicator isLive={isLive} onToggle={() => setIsLive(!isLive)} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="gap-2"
              data-testid="button-refresh"
            >
              <RefreshCw size={14} className={isLive ? "animate-spin" : ""} />
              Refresh
            </Button>
            
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
        <LGReportStats />

        {/* Design → Activate → Measure Value Section */}
        <div className="mb-12 border-b border-border pb-8">
          <ScenarioWorkflow onScenarioChange={handleScenarioChange} />
        </div>

        {/* Scenario-Driven Charts */}
        <div className="mb-12">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h2 className="text-[32px] font-bold text-foreground">Strategic Impact Analysis</h2>
              <p className="text-muted-foreground">
                KPIs for <span className="font-semibold text-[hsl(209,100%,36%)]">{selectedScenario.name}</span> scenario
              </p>
            </div>
          </div>
          <ScenarioChartsGrid scenario={selectedScenario} stage={activeStage} refreshKey={refreshKey} />
        </div>

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
              <Button variant="outline" className="gap-2 bg-white rounded-[4px]" data-testid="button-relationships">
                <LinkIcon className="h-4 w-4" /> View Relationships
              </Button>
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
