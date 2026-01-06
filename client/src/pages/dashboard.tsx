import { challenges, pmoChallenges } from "@/lib/data";
import { ChallengeCard } from "@/components/ChallengeCard";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, TrendingUp, Filter, Search, User, Target, Link as LinkIcon, FileText, ArrowRight, RefreshCw, Play, Pause, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Theme } from "@/lib/data";
import { StrategicImpactSection } from "@/components/Charts";
import { generateVROStats, generatePMOStats, citations } from "@/lib/simulation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

type DataMode = "VRO" | "PMO";

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

function StatsOverview({ mode, stats }: { mode: DataMode; stats: ReturnType<typeof generateVROStats> }) {
  const statItems = [
    { 
      label: "Cycle Time", 
      value: `${stats.cycleTime.value}${stats.cycleTime.unit}`, 
      change: stats.cycleTime.change,
      icon: Clock, 
      color: "text-[hsl(209,100%,36%)]",
      citation: citations.forecastAccuracy
    },
    { 
      label: "Forecast Accuracy", 
      value: `${stats.forecastAccuracy.value}${stats.forecastAccuracy.unit}`, 
      change: stats.forecastAccuracy.change,
      icon: Target, 
      color: "text-[hsl(148,100%,26%)]",
      citation: citations.forecastAccuracy
    },
    { 
      label: "Cost Variance", 
      value: `${stats.costVariance.unit}${stats.costVariance.value}`, 
      change: stats.costVariance.change,
      icon: Activity, 
      color: "text-[hsl(51,100%,50%)]",
      citation: citations.costEfficiency
    },
    { 
      label: "Overhead Reduction", 
      value: `${stats.overheadReduction.value}${stats.overheadReduction.unit}`, 
      change: stats.overheadReduction.change,
      icon: TrendingUp, 
      color: "text-[hsl(209,100%,36%)]",
      citation: citations.costEfficiency
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat, i) => {
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
            <div className="flex items-end gap-2 w-full">
              <motion.div 
                key={stat.value}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-foreground tracking-tight"
              >
                {stat.value}
              </motion.div>
              <div className={cn(
                "text-xs font-medium mb-1",
                stat.change > 0 ? "text-green-600" : "text-green-600"
              )}>
                {stat.change > 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
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
                  <p className="text-xs text-muted-foreground">{stat.citation.context}</p>
                  <p className="text-xs text-[hsl(209,100%,36%)] mt-1 font-medium">{stat.citation.source}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        );
      })}
    </div>
  );
}

function NavBar({ mode, onModeChange }: { mode: DataMode; onModeChange: (mode: DataMode) => void }) {
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
                <DialogDescription>Current transformation initiatives in the {mode} portfolio</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {[
                  { name: "PRT Platform Modernization", status: "On Track", progress: 78 },
                  { name: "Governance Automation", status: "On Track", progress: 65 },
                  { name: "Data Lake Integration", status: "At Risk", progress: 42 },
                  { name: "Customer Portal Refresh", status: "On Track", progress: 91 },
                  { name: "Regulatory Compliance Update", status: "Complete", progress: 100 },
                ].map((project, i) => (
                  <div key={i} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" data-testid={`project-item-${i}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{project.name}</span>
                      <Badge variant={project.status === "On Track" ? "default" : project.status === "At Risk" ? "destructive" : "secondary"} className="text-xs">
                        {project.status}
                      </Badge>
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
                <DialogDescription>Download or view strategic reports</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {[
                  { name: "Q4 2025 Executive Summary", type: "PDF", date: "Dec 2025" },
                  { name: "VRO Impact Assessment", type: "PDF", date: "Nov 2025" },
                  { name: "Governance Health Report", type: "Excel", date: "Dec 2025" },
                  { name: "Benefits Realization Tracker", type: "Excel", date: "Weekly" },
                  { name: "Risk Register", type: "PDF", date: "Dec 2025" },
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
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={mode === "VRO" ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange("VRO")}
            className={cn(
              "rounded-md transition-all",
              mode === "VRO" ? "bg-[hsl(209,100%,36%)] text-white shadow-sm" : "text-muted-foreground"
            )}
            data-testid="button-mode-vro"
          >
            VRO
          </Button>
          <Button
            variant={mode === "PMO" ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange("PMO")}
            className={cn(
              "rounded-md transition-all",
              mode === "PMO" ? "bg-gray-600 text-white shadow-sm" : "text-muted-foreground"
            )}
            data-testid="button-mode-pmo"
          >
            PMO
          </Button>
        </div>
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
  const [mode, setMode] = useState<DataMode>("VRO");
  const [isLive, setIsLive] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState(() => generateVROStats());
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const currentChallenges = mode === "VRO" ? challenges : pmoChallenges;
  const filteredChallenges = activeTheme === "All" 
    ? currentChallenges 
    : currentChallenges.filter(c => c.themes.includes(activeTheme));

  const themes: Theme[] = ["Automation", "Governance", "Data & Insights", "Value", "Speed"];

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setStats(mode === "VRO" ? generateVROStats() : generatePMOStats());
  }, [mode]);

  useEffect(() => {
    setStats(mode === "VRO" ? generateVROStats() : generatePMOStats());
    setRefreshKey(prev => prev + 1);
  }, [mode]);

  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive, refreshData]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar mode={mode} onModeChange={setMode} />

      <main className="container mx-auto px-8 py-8 max-w-[1400px]">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[48px] font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
                {mode} Strategy Dashboard
              </h1>
              <Badge variant={mode === "VRO" ? "default" : "secondary"} className={cn(
                "text-lg px-3 py-1",
                mode === "VRO" ? "bg-[hsl(148,100%,26%)]" : "bg-gray-600"
              )}>
                {mode === "VRO" ? "Value Realization Office" : "Project Management Office"}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {mode === "VRO" 
                ? "Real-time insights on efficiency, speed, and certainty through agentic automation."
                : "Traditional project management metrics and governance oversight."}
            </p>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <LiveIndicator isLive={isLive} onToggle={() => setIsLive(!isLive)} />
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="gap-2"
              data-testid="button-refresh"
            >
              <RefreshCw size={14} className={isLive ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Link href="/value-proposition">
              <Button className="gap-2 bg-[hsl(209,100%,36%)] hover:bg-[hsl(209,100%,32%)] text-white shadow-sm transition-all hover:-translate-y-0.5" data-testid="button-executive-brief">
                Read Executive Brief <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>

        <StatsOverview mode={mode} stats={stats} />

        <div className="mb-12">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <h2 className="text-[32px] font-bold text-foreground">Strategic Impact Analysis</h2>
            <div className="flex items-center gap-2">
              <Dialog open={scenarioOpen} onOpenChange={setScenarioOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-scenario">
                    <Settings size={16} />
                    Scenario Builder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Scenario Builder</DialogTitle>
                    <DialogDescription>Model different transformation scenarios and compare outcomes</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors" data-testid="scenario-aggressive">
                        <h4 className="font-semibold text-blue-900">Aggressive Automation</h4>
                        <p className="text-sm text-blue-700 mt-1">Maximum automation investment, fastest ROI</p>
                        <p className="text-xs text-blue-600 mt-2">Est. savings: £45m/year</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors" data-testid="scenario-balanced">
                        <h4 className="font-semibold text-green-900">Balanced Growth</h4>
                        <p className="text-sm text-green-700 mt-1">Steady transformation with risk mitigation</p>
                        <p className="text-xs text-green-600 mt-2">Est. savings: £28m/year</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors" data-testid="scenario-conservative">
                        <h4 className="font-semibold text-yellow-900">Conservative</h4>
                        <p className="text-sm text-yellow-700 mt-1">Minimal disruption, focus on governance</p>
                        <p className="text-xs text-yellow-600 mt-2">Est. savings: £12m/year</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors" data-testid="scenario-custom">
                        <h4 className="font-semibold text-gray-900">Custom Scenario</h4>
                        <p className="text-sm text-gray-700 mt-1">Build your own parameters</p>
                        <p className="text-xs text-gray-600 mt-2">Configure →</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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
                    <DialogDescription>Download current view in your preferred format</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {[
                      { format: "PDF Report", desc: "Full executive summary with charts" },
                      { format: "Excel Workbook", desc: "Raw data for analysis" },
                      { format: "PowerPoint", desc: "Presentation-ready slides" },
                      { format: "CSV Data", desc: "Plain data export" },
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
            </div>
          </div>
          <StrategicImpactSection mode={mode} refreshKey={refreshKey} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-border pb-4 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-[32px] font-bold text-foreground">Challenge Responses</h2>
              <div className="hidden md:flex h-6 w-px bg-border" />
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <Button 
                  variant={activeTheme === "All" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTheme("All")}
                  className={activeTheme === "All" ? "bg-[hsl(209,100%,36%)] text-white" : "text-muted-foreground"}
                  data-testid="filter-all"
                >
                  All ({currentChallenges.length})
                </Button>
                {themes.map(theme => {
                  const count = currentChallenges.filter(c => c.themes.includes(theme)).length;
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
              <Button variant="outline" className="gap-2 bg-white rounded-[4px]" data-testid="button-filter-advanced">
                <Filter className="h-4 w-4" /> Advanced Filter
              </Button>
              <Button variant="outline" className="gap-2 bg-white rounded-[4px]" data-testid="button-relationships">
                <LinkIcon className="h-4 w-4" /> View Relationships
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTheme + mode}
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
                <p>† Forecast accuracy targets: L&G Annual Report 2024, Strategic Objectives (p.45)</p>
                <p>† PRT volume metrics: L&G Annual Report 2024, Business Review (p.12)</p>
                <p>† Transformation risk: L&G Annual Report 2024, Principal Risks (p.78)</p>
                <p>† Cost efficiency targets: L&G Annual Report 2024, Operating Review (p.23)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Data refreshes every 4 seconds when LIVE</p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border pt-4">
            <p>© 2026 Legal & General. Internal Use Only.</p>
            <div className="flex gap-4">
              <Link href="/value-proposition" className="hover:text-primary">Value Proposition</Link>
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
