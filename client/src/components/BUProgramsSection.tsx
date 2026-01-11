import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  pmoProjects, vroPrograms, riskIssues,
  pmoSummary, vroSummary, riskSummary,
  PMOProject, VROProgram, RiskIssue, ProactiveAction, AISignal,
  buPortfolios, BUPortfolio
} from "@/lib/buPrograms";
import { challenges, VROMetric } from "@/lib/data";
import { enrichedProjects, getProjectById, type ProjectDependency } from "@/lib/projects";
import { 
  Building2, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Brain, Users, Target, Sparkles, Shield,
  ChevronDown, ChevronUp, Zap, AlertCircle, RotateCcw,
  Rocket, Search, ArrowUpRight, Activity, ExternalLink,
  FileText, ChevronRight, ChevronLeft, Play, MessageSquare, Layers,
  GitBranch, Calendar, BarChart3, Eye, X
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, BarChart, Bar } from "recharts";

type DataMode = "VRO" | "PMO";

interface BUProgramsSectionProps {
  dataMode: DataMode;
  onDrillDown?: (type: string, id: string) => void;
}

const BU_COLORS: Record<string, string> = {
  "Institutional Retirement": "#005EB8",
  "Asset Management": "#00843D",
  "Retail": "#005EB8",
  "Corporate Investments": "#424242",
  "Risk & Compliance": "#D50032"
};

const signalIcons: Record<AISignal["type"], React.ReactNode> = {
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  opportunity: <Rocket size={14} className="text-green-500" />,
  insight: <Brain size={14} className="text-purple-500" />,
  prediction: <Sparkles size={14} className="text-blue-500" />
};

const actionTypeColors: Record<ProactiveAction["type"], string> = {
  mitigate: "#D50032",
  accelerate: "#00843D",
  investigate: "#005EB8",
  escalate: "#f59e0b"
};

const actionTypeIcons: Record<ProactiveAction["type"], React.ReactNode> = {
  mitigate: <Shield size={12} />,
  accelerate: <Rocket size={12} />,
  investigate: <Search size={12} />,
  escalate: <ArrowUpRight size={12} />
};

// ============================================================================
// PROJECT DETAIL MODAL - Full AI Briefing with SAFe 6.0 Metrics
// ============================================================================
function ProjectDetailModal({ 
  project, 
  program,
  open, 
  onClose,
  mode
}: { 
  project?: PMOProject; 
  program?: VROProgram;
  open: boolean; 
  onClose: () => void;
  mode: DataMode;
}) {
  const [actionsTaken, setActionsTaken] = useState<string[]>([]);
  
  // Escape key handler - must be before any conditional returns
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  
  const item = project || program;
  if (!item) return null;
  
  const isPMO = mode === "PMO" && project;
  const isVRO = mode === "VRO" && program;
  
  // Use actual SAFe metrics from project/program
  const safeData = (project || program)?.safe;
  const safeMetrics = {
    piNumber: safeData?.currentPI || "PI 24.4",
    velocity: safeData?.velocity || 45,
    predictability: safeData?.predictability || 82,
    flowEfficiency: safeData?.flowEfficiency || 68,
    wip: 4,
    leadTime: Math.round((100 - (safeData?.flowEfficiency || 68)) * 0.15 + 8)
  };

  const epicData = [
    { name: "Completed", value: Math.round((safeData?.epicProgress || 60) / 10) },
    { name: "In Progress", value: Math.round((100 - (safeData?.epicProgress || 60)) / 15) },
    { name: "Planned", value: 2 }
  ];

  // Use actual PI trend data from project/program
  const piTrendData = safeData?.piTrend?.map(t => ({
    pi: t.pi,
    planned: t.predictability + 3,
    actual: t.predictability
  })) || [
    { pi: "PI 24.1", planned: 85, actual: 82 },
    { pi: "PI 24.2", planned: 90, actual: 88 },
    { pi: "PI 24.3", planned: 88, actual: 91 },
    { pi: "PI 24.4", planned: 92, actual: 89 }
  ];
  
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Flyout Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-5xl bg-white shadow-2xl z-50 flex flex-col"
            data-testid={`flyout-project-${item.id}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-transparent">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: BU_COLORS[item.bu] || "#005EB8" }}
                  >
                    {item.bu}
                  </Badge>
                  <Badge variant="outline" className={isPMO ? "border-gray-500 bg-gray-50" : "border-teal-500 text-teal-700 bg-teal-50"}>
                    {isPMO ? "PMO DELIVERY VIEW" : "VRO VALUE VIEW"}
                  </Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-700">
                    {safeMetrics.piNumber}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold">{item.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText size={12} />
                  Source: L&G Annual Report 2024, Climate & Nature Report 2024
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-project-flyout">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-6">
              <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="safe" data-testid="tab-safe">SAFe Metrics</TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai">AI Briefing</TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab - UNIFIED: Shows both VRO and PMO metrics */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* VRO Value Metrics - Always Show */}
              <Card className="border-l-4 border-teal-500">
                <CardContent className="py-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-teal-700">
                    <Target size={16} className="text-teal-600" /> VRO Value Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-teal-50 rounded-lg">
                      <p className="text-2xl font-bold text-teal-700">{program?.expectedROI || "45%"}</p>
                      <p className="text-xs text-teal-600">Expected ROI</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">£{program?.valueRealized || 4.2}m</p>
                      <p className="text-xs text-green-600">Value Realized</p>
                    </div>
                  </div>
                  {program?.keyOutcomes && (
                    <div className="space-y-3">
                      {program.keyOutcomes.slice(0, 2).map((outcome, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{outcome.outcome}</span>
                            <span className="font-medium">{outcome.progress.toLocaleString()} / {outcome.target.toLocaleString()} {outcome.unit}</span>
                          </div>
                          <Progress value={(outcome.progress / outcome.target) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* PMO Delivery Metrics - Always Show */}
              <Card className="border-l-4 border-blue-500">
                <CardContent className="py-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                    <DollarSign size={16} className="text-blue-600" /> PMO Delivery Metrics
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Budget</span>
                        <span className={project && project.budget.spent > project.budget.total ? "text-red-600 font-medium" : ""}>
                          {project?.budget.spent.toFixed(1) || "3.2"} / {project?.budget.total || 4.5}{project?.budget.unit || "M"}
                        </span>
                      </div>
                      <Progress value={project ? Math.min((project.budget.spent / project.budget.total) * 100, 100) : 71} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Timeline</span>
                        <span>{project?.timeline.elapsed || 8} / {project?.timeline.total || 12} {project?.timeline.unit || "months"}</span>
                      </div>
                      <Progress value={project ? (project.timeline.elapsed / project.timeline.total) * 100 : 67} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Deliverables</span>
                        <span>{project?.deliverables.completed || 12} / {project?.deliverables.total || 18}</span>
                      </div>
                      <Progress value={project ? (project.deliverables.completed / project.deliverables.total) * 100 : 67} className="h-2" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">Next Milestone:</p>
                    <p className="font-medium">{project?.nextMilestone || "Phase 2 UAT Complete"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Trend Chart */}
            <Card>
              <CardContent className="py-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity size={16} /> Progress Trend
                </h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(project || program)?.trendData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="value" stroke="#7c3aed" fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* SAFe 6.0 Metrics Tab */}
          <TabsContent value="safe" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{safeMetrics.velocity}</p>
                  <p className="text-xs text-blue-600">Velocity (pts/sprint)</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="py-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{safeMetrics.predictability}%</p>
                  <p className="text-xs text-green-600">Predictability</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="py-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">{safeMetrics.flowEfficiency}%</p>
                  <p className="text-xs text-purple-600">Flow Efficiency</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="py-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{safeMetrics.leadTime}d</p>
                  <p className="text-xs text-amber-600">Lead Time</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="py-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Layers size={16} /> EPICs Status
                  </h4>
                  <div className="space-y-2">
                    {epicData.map((epic, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{epic.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              style={{ backgroundColor: i === 0 ? "#00843D" : i === 1 ? "#005EB8" : "#9ca3af" }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(epic.value / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-6">{epic.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar size={16} /> PI Predictability Trend
                  </h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={piTrendData}>
                        <XAxis dataKey="pi" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[70, 100]} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="planned" fill="#93c5fd" name="Planned" />
                        <Bar dataKey="actual" fill="#005EB8" name="Actual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="py-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <GitBranch size={16} /> Current PI Objectives (OKRs)
                </h4>
                <div className="space-y-3">
                  {safeData?.okr && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{safeData.okr.objective}</span>
                        <Badge className={safeData.okr.progress >= 70 ? "bg-green-600 text-white" : safeData.okr.progress >= 50 ? "bg-amber-500 text-white" : "bg-red-500 text-white"}>
                          {safeData.okr.progress >= 70 ? "On Track" : safeData.okr.progress >= 50 ? "At Risk" : "Behind"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">KR: {safeData.okr.keyResult}</p>
                      <Progress value={safeData.okr.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">{safeData.okr.progress}% complete</p>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{safeData?.epicName || "EPIC Progress"}</span>
                      <Badge className="bg-blue-600 text-white">{safeData?.epicId}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">EPIC Completion</p>
                    <Progress value={safeData?.epicProgress || 60} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">{safeData?.epicProgress || 60}% complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* AI Briefing Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="py-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                  <Brain size={16} /> AI Intelligence Briefing
                </h4>
                
                {isVRO && program && (
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-100">
                      <p className="text-xs font-medium text-purple-600 mb-1">AI INSIGHT</p>
                      <p className="text-sm">{program.aiInsight}</p>
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-600 mb-1">PREDICTION</p>
                      <p className="text-sm">{program.prediction}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-purple-600">AI SIGNALS ({(project || program)?.aiSignals.length})</p>
                  {(project || program)?.aiSignals.map((signal, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-white/80 rounded-lg border border-purple-100"
                    >
                      <div className="flex items-start gap-2">
                        {signalIcons[signal.type]}
                        <div className="flex-1">
                          <p className="text-sm">{signal.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-purple-600 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${signal.confidence}%` }}
                                  transition={{ duration: 0.8, delay: 0.3 }}
                                />
                              </div>
                              <span className="text-xs text-purple-600">{signal.confidence}% confidence</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{signal.dataSource}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card className="border-green-200">
              <CardContent className="py-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                  <Zap size={16} /> Proactive Actions
                </h4>
                <p className="text-xs text-muted-foreground mb-3">Click to initiate action workflow</p>
                <div className="space-y-2">
                  {(project || program)?.proactiveActions.map((action) => {
                    const taken = actionsTaken.includes(action.id);
                    return (
                      <motion.button
                        key={action.id}
                        className="w-full text-left p-3 rounded-lg border-2 transition-all"
                        style={{ 
                          borderColor: taken ? "#00843D" : actionTypeColors[action.type],
                          backgroundColor: taken ? "#dcfce7" : "white"
                        }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => !taken && setActionsTaken(prev => [...prev, action.id])}
                        data-testid={`modal-action-${action.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="p-1.5 rounded text-white"
                            style={{ backgroundColor: taken ? "#00843D" : actionTypeColors[action.type] }}
                          >
                            {taken ? <CheckCircle size={14} /> : actionTypeIcons[action.type]}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{action.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: actionTypeColors[action.type], color: actionTypeColors[action.type] }}
                              >
                                {action.urgency}
                              </Badge>
                              <span className="text-xs text-green-600 font-medium">{action.impact}</span>
                            </div>
                          </div>
                          {!taken && <ChevronRight size={16} className="text-muted-foreground" />}
                          {taken && <CheckCircle size={18} className="text-green-600" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                
                {actionsTaken.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200"
                  >
                    <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                      <CheckCircle size={14} />
                      {actionsTaken.length} action(s) initiated - notifications sent to stakeholders
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
              </Tabs>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// UNIFIED PORTFOLIO CARD - BU-level with BOTH VRO + PMO metrics side-by-side
// ============================================================================
function PortfolioCard({ portfolio, onDrillDown }: { portfolio: BUPortfolio; onDrillDown: () => void; mode?: DataMode }) {
  const healthColor = portfolio.healthScore >= 80 ? "#00843D" : portfolio.healthScore >= 60 ? "#f59e0b" : "#D50032";
  
  const BU_COLORS: Record<string, string> = {
    "Institutional Retirement": "#005EB8",
    "Asset Management": "#00843D",
    "Retail": "#005EB8",
    "Corporate Investments": "#424242",
    "Risk & Compliance": "#D50032"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="h-full hover:shadow-xl transition-all cursor-pointer relative overflow-hidden border-l-4 bg-gradient-to-br from-white to-gray-50 border-t-2 border-t-purple-500"
        style={{ borderLeftColor: BU_COLORS[portfolio.name] || "#005EB8" }}
        onClick={onDrillDown}
        data-testid={`portfolio-${portfolio.id}`}
      >
        {/* UNIFIED Badge */}
        <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold text-white rounded-bl-lg bg-gradient-to-r from-teal-600 to-blue-600">
          UNIFIED
        </div>
        
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{portfolio.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{portfolio.description}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* DUAL METRICS - VRO left, PMO right */}
          <div className="grid grid-cols-2 gap-2">
            {/* VRO Side - Value Metrics (Teal) */}
            <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center gap-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-[9px] font-bold text-teal-700">VRO VALUE</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-teal-600">Realized</span>
                  <span className="text-sm font-bold text-teal-700">£{portfolio.valueRealized}m</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-teal-600">Programs</span>
                  <span className="text-sm font-bold text-emerald-700">{portfolio.programCount}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-teal-600">Value Score</span>
                  <span className="text-sm font-bold" style={{ color: healthColor }}>{portfolio.healthScore}%</span>
                </div>
              </div>
            </div>
            
            {/* PMO Side - Delivery Metrics (Blue) */}
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-bold text-blue-700">PMO DELIVERY</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-blue-600">Projects</span>
                  <span className="text-sm font-bold text-blue-700">{portfolio.projectCount}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-blue-600">On-Time</span>
                  <span className="text-sm font-bold text-blue-700">{portfolio.predictability}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-blue-600">EPICs</span>
                  <span className="text-sm font-bold text-gray-700">{portfolio.activeEpics}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* SAFe Metrics Row - Unified purple */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gradient-to-r from-blue-50 to-teal-50 p-2 rounded-lg border border-purple-100">
            <div className="p-1.5 bg-white rounded shadow-sm">
              <p className="font-bold text-purple-700">{portfolio.velocity}</p>
              <p className="text-[9px] text-muted-foreground">Velocity</p>
            </div>
            <div className="p-1.5 bg-white rounded shadow-sm">
              <p className="font-bold text-purple-700">{portfolio.predictability}%</p>
              <p className="text-[9px] text-muted-foreground">Predict.</p>
            </div>
            <div className="p-1.5 bg-white rounded shadow-sm">
              <p className="font-bold text-purple-700">{portfolio.currentPI}</p>
              <p className="text-[9px] text-muted-foreground">Current PI</p>
            </div>
          </div>
          
          {/* OKR Progress */}
          {portfolio.okrs[0] && (
            <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate flex-1">{portfolio.okrs[0].objective}</span>
                <Badge 
                  className="text-[9px] ml-2"
                  variant={portfolio.okrs[0].status === "on-track" ? "default" : "outline"}
                  style={{ 
                    backgroundColor: portfolio.okrs[0].status === "on-track" ? "#00843D" : undefined,
                    color: portfolio.okrs[0].status === "on-track" ? "white" : portfolio.okrs[0].status === "at-risk" ? "#f59e0b" : "#D50032"
                  }}
                >
                  {portfolio.okrs[0].status}
                </Badge>
              </div>
              <Progress value={portfolio.okrs[0].progress} className="h-1.5" />
            </div>
          )}
          
          {/* AI Signal */}
          <motion.div 
            className="p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200"
            animate={{ borderColor: ["#e9d5ff", "#a855f7", "#e9d5ff"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-start gap-2">
              <Brain size={12} className="text-purple-600 mt-0.5" />
              <p className="text-[10px] text-purple-900 leading-tight line-clamp-2">{portfolio.topAISignal.message}</p>
            </div>
          </motion.div>
          
          {/* Drill Down CTA */}
          <motion.div 
            className="flex items-center justify-center gap-2 text-xs font-medium pt-2 border-t text-purple-600"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Layers size={12} />
            <span>View {portfolio.projectCount} Projects</span>
            <ChevronRight size={14} />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// PMO PROJECT CARD - AI insights visible on front, clickable for details
// ============================================================================
function PMOProjectCard({ project, onViewDetails }: { project: PMOProject; onViewDetails: () => void }) {
  const statusColors = {
    green: "#00843D",
    amber: "#f59e0b",
    red: "#D50032"
  };
  
  const budgetPercent = (project.budget.spent / project.budget.total) * 100;
  const timelinePercent = (project.timeline.elapsed / project.timeline.total) * 100;
  const topSignal = project.aiSignals[0];
  const topAction = project.proactiveActions[0];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="h-full border-l-4 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden" 
        style={{ borderLeftColor: statusColors[project.status] }}
        data-testid={`card-pmo-${project.id}`}
        onClick={onViewDetails}
      >
        {/* PMO Label Banner */}
        <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold text-white bg-gray-600 rounded-bl">
          PMO DELIVERY
        </div>
        
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge 
                className="mb-2 text-white text-xs"
                style={{ backgroundColor: BU_COLORS[project.bu] || "#005EB8" }}
              >
                {project.bu}
              </Badge>
              <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
            </div>
            <Badge 
              className="text-white uppercase text-xs"
              style={{ backgroundColor: statusColors[project.status] }}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-lg font-bold" style={{ color: budgetPercent > 100 ? "#D50032" : "#005EB8" }}>
                {Math.round(budgetPercent)}%
              </p>
              <p className="text-[10px] text-muted-foreground">Budget</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-lg font-bold text-blue-700">{Math.round(timelinePercent)}%</p>
              <p className="text-[10px] text-muted-foreground">Timeline</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-lg font-bold text-green-700">{project.deliverables.completed}/{project.deliverables.total}</p>
              <p className="text-[10px] text-muted-foreground">Done</p>
            </div>
          </div>
          
          {/* SAFe 6.0 Metrics Row */}
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-semibold text-blue-700 flex items-center gap-1">
                <GitBranch size={10} /> SAFe 6.0 | {project.safe.currentPI}
              </span>
              <Badge className="text-[8px] bg-blue-600 text-white">{project.safe.epicId}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-sm font-bold text-blue-700">{project.safe.velocity}</p>
                <p className="text-[8px] text-muted-foreground">Velocity</p>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-700">{project.safe.predictability}%</p>
                <p className="text-[8px] text-muted-foreground">Predict.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-700">{project.safe.flowEfficiency}%</p>
                <p className="text-[8px] text-muted-foreground">Flow</p>
              </div>
            </div>
          </div>
          
          {/* AI SIGNAL - Visible on front! */}
          {topSignal && (
            <motion.div 
              className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
              animate={{ borderColor: ["#e9d5ff", "#a855f7", "#e9d5ff"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex items-start gap-2">
                <Brain size={14} className="text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-purple-700 mb-1">AI INSIGHT</p>
                  <p className="text-xs text-purple-900 leading-tight line-clamp-2">{topSignal.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-purple-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${topSignal.confidence}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className="text-[9px] text-purple-600 font-medium">{topSignal.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Proactive Action - Clickable */}
          {topAction && (
            <motion.div 
              className="p-2 rounded-lg border-2 flex items-center gap-2"
              style={{ borderColor: actionTypeColors[topAction.type], backgroundColor: `${actionTypeColors[topAction.type]}10` }}
              whileHover={{ x: 4 }}
            >
              <div 
                className="p-1.5 rounded text-white"
                style={{ backgroundColor: actionTypeColors[topAction.type] }}
              >
                <Zap size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{topAction.action}</p>
                <p className="text-[10px] text-green-600 font-medium">{topAction.impact}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.div>
          )}
          
          {/* View Details CTA */}
          <motion.div 
            className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600 pt-2 border-t"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Eye size={12} />
            <span>Click for Full AI Briefing</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// VRO PROGRAM CARD - Value-focused with AI insights on front
// ============================================================================
function VROProgramCard({ program, onViewDetails }: { program: VROProgram; onViewDetails: () => void }) {
  const statusColors = {
    accelerating: "#00843D",
    "on-track": "#005EB8",
    "at-risk": "#f59e0b",
    blocked: "#D50032"
  };
  
  const valuePercent = program.roiValue > 0 && program.roiValue < 10000 
    ? (program.valueRealized / program.roiValue) * 100 
    : 0;
  const topSignal = program.aiSignals[0];
  const topAction = program.proactiveActions[0];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="h-full border-l-4 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden" 
        style={{ borderLeftColor: statusColors[program.valueStatus] }}
        data-testid={`card-vro-${program.id}`}
        onClick={onViewDetails}
      >
        {/* VRO Label Banner */}
        <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold text-white bg-teal-600 rounded-bl">
          VRO VALUE
        </div>
        
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge 
                className="mb-2 text-white text-xs"
                style={{ backgroundColor: BU_COLORS[program.bu] || "#005EB8" }}
              >
                {program.bu}
              </Badge>
              <CardTitle className="text-base leading-tight">{program.name}</CardTitle>
            </div>
            <Badge 
              className="text-white capitalize text-xs"
              style={{ backgroundColor: statusColors[program.valueStatus] }}
            >
              {program.valueStatus === "on-track" ? "On Track" : program.valueStatus}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Value Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-teal-50 rounded text-center">
              <p className="text-lg font-bold text-teal-700">{program.expectedROI}</p>
              <p className="text-[10px] text-teal-600">Expected ROI</p>
            </div>
            <div className="p-2 bg-green-50 rounded text-center">
              <p className="text-lg font-bold text-green-700">£{program.valueRealized}m</p>
              <p className="text-[10px] text-green-600">Realized</p>
            </div>
          </div>
          
          {/* Value Progress */}
          {valuePercent > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1"><TrendingUp size={12} /> Value Realization</span>
                <span className="font-medium">{Math.round(valuePercent)}%</span>
              </div>
              <Progress value={valuePercent} className="h-1.5" />
            </div>
          )}
          
          {/* SAFe 6.0 Metrics Row */}
          <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-semibold text-teal-700 flex items-center gap-1">
                <GitBranch size={10} /> SAFe 6.0 | {program.safe.currentPI}
              </span>
              <Badge className="text-[8px] bg-teal-600 text-white">{program.safe.epicId}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-sm font-bold text-teal-700">{program.safe.velocity}</p>
                <p className="text-[8px] text-muted-foreground">Velocity</p>
              </div>
              <div>
                <p className="text-sm font-bold text-teal-700">{program.safe.predictability}%</p>
                <p className="text-[8px] text-muted-foreground">Predict.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-teal-700">{program.safe.flowEfficiency}%</p>
                <p className="text-[8px] text-muted-foreground">Flow</p>
              </div>
            </div>
          </div>
          
          {/* AI Insight - Visible on front! */}
          <motion.div 
            className="p-3 bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg border border-purple-200"
            animate={{ borderColor: ["#e9d5ff", "#14b8a6", "#e9d5ff"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-start gap-2">
              <Brain size={14} className="text-purple-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-purple-700 mb-1">AI PREDICTION</p>
                <p className="text-xs text-purple-900 leading-tight line-clamp-2">{program.prediction}</p>
              </div>
            </div>
          </motion.div>
          
          {/* Proactive Action */}
          {topAction && (
            <motion.div 
              className="p-2 rounded-lg border-2 flex items-center gap-2"
              style={{ borderColor: actionTypeColors[topAction.type], backgroundColor: `${actionTypeColors[topAction.type]}10` }}
              whileHover={{ x: 4 }}
            >
              <div 
                className="p-1.5 rounded text-white"
                style={{ backgroundColor: actionTypeColors[topAction.type] }}
              >
                <Zap size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{topAction.action}</p>
                <p className="text-[10px] text-green-600 font-medium">{topAction.impact}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.div>
          )}
          
          {/* View Details CTA */}
          <motion.div 
            className="flex items-center justify-center gap-2 text-xs font-medium text-teal-600 pt-2 border-t"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Eye size={12} />
            <span>Click for Full AI Briefing</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// UNIFIED PROJECT CARD - Shows both VRO value + PMO delivery on same card
// ============================================================================
interface UnifiedProject {
  id: string;
  name: string;
  bu: string;
  status: 'green' | 'amber' | 'red';
  valueStatus: 'accelerating' | 'on-track' | 'at-risk' | 'blocked';
  // PMO Delivery Metrics
  budget: { spent: number; total: number };
  timeline: { elapsed: number; total: number };
  deliverables: { completed: number; total: number };
  // VRO Value Metrics
  expectedROI: string;
  valueRealized: number;
  roiValue: number;
  // SAFe
  safe: {
    currentPI: string;
    epicId: string;
    velocity: number;
    predictability: number;
    flowEfficiency: number;
  };
  // AI
  aiInsight: string;
  aiConfidence: number;
  proactiveAction?: { action: string; impact: string; type: 'mitigate' | 'accelerate' | 'investigate' | 'escalate' };
}

interface LiveAgentAlert {
  projectId: string;
  agentName: string;
  message: string;
  type: 'insight' | 'warning' | 'action' | 'update';
  timestamp: Date;
}

function UnifiedProjectCard({ project, onViewDetails, liveAlert }: { project: UnifiedProject; onViewDetails: () => void; liveAlert?: LiveAgentAlert }) {
  const statusColors = {
    green: "#00843D",
    amber: "#f59e0b", 
    red: "#D50032"
  };
  
  const budgetPercent = (project.budget.spent / project.budget.total) * 100;
  const timelinePercent = (project.timeline.elapsed / project.timeline.total) * 100;
  const valuePercent = project.roiValue > 0 ? (project.valueRealized / project.roiValue) * 100 : 0;
  
  const alertColors = {
    insight: { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-700' },
    warning: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-700' },
    action: { bg: 'bg-teal-500', border: 'border-teal-400', text: 'text-teal-700' },
    update: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-700' }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Live Agent Alert Pulse */}
      {liveAlert && (
        <motion.div
          className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-500 via-teal-500 to-blue-500 opacity-50 blur-sm z-0"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      
      <Card 
        className={`h-full border-l-4 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden ${liveAlert ? 'ring-2 ring-purple-400' : ''}`}
        style={{ borderLeftColor: statusColors[project.status] }}
        data-testid={`card-unified-${project.id}`}
        onClick={onViewDetails}
      >
        {/* Live Alert Banner */}
        {liveAlert && (
          <motion.div
            className={`absolute top-0 left-0 right-0 px-3 py-1.5 ${alertColors[liveAlert.type].bg} text-white text-xs flex items-center gap-2 z-10`}
            initial={{ y: -30 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Sparkles size={12} />
            </motion.div>
            <span className="font-medium">{liveAlert.agentName}:</span>
            <span className="truncate">{liveAlert.message}</span>
          </motion.div>
        )}
        
        {/* UNIFIED Label Banner */}
        <div className={`absolute ${liveAlert ? 'top-7' : 'top-0'} right-0 px-2 py-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-blue-600 to-teal-600 rounded-bl`}>
          VRO CO-PILOT
        </div>
        
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge 
                className="mb-2 text-white text-xs"
                style={{ backgroundColor: BU_COLORS[project.bu] || "#005EB8" }}
              >
                {project.bu}
              </Badge>
              <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
            </div>
            <Badge 
              className="text-white uppercase text-xs"
              style={{ backgroundColor: statusColors[project.status] }}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* DUAL METRICS - VRO left, PMO right */}
          <div className="grid grid-cols-2 gap-2">
            {/* VRO Side - Value */}
            <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center gap-1 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-[9px] font-bold text-teal-700">VRO VALUE</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-teal-600">ROI</span>
                  <span className="text-sm font-bold text-teal-700">{project.expectedROI}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-teal-600">Realized</span>
                  <span className="text-sm font-bold text-green-700">£{project.valueRealized}m</span>
                </div>
                {valuePercent > 0 && (
                  <Progress value={valuePercent} className="h-1 [&>div]:bg-teal-500" />
                )}
              </div>
            </div>
            
            {/* PMO Side - Delivery */}
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-1 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-bold text-blue-700">PMO DELIVERY</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-blue-600">Budget</span>
                  <span className={`text-sm font-bold ${budgetPercent > 100 ? 'text-red-600' : 'text-blue-700'}`}>
                    {Math.round(budgetPercent)}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-blue-600">Timeline</span>
                  <span className="text-sm font-bold text-blue-700">{Math.round(timelinePercent)}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-blue-600">Done</span>
                  <span className="text-sm font-bold text-green-700">{project.deliverables.completed}/{project.deliverables.total}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* SAFe 6.0 Metrics Row */}
          <div className="p-2 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-semibold text-purple-700 flex items-center gap-1">
                <GitBranch size={10} /> SAFe 6.0 | {project.safe.currentPI}
              </span>
              <Badge className="text-[8px] bg-purple-600 text-white">{project.safe.epicId}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-sm font-bold text-purple-700">{project.safe.velocity}</p>
                <p className="text-[8px] text-muted-foreground">Velocity</p>
              </div>
              <div>
                <p className="text-sm font-bold text-purple-700">{project.safe.predictability}%</p>
                <p className="text-[8px] text-muted-foreground">Predict.</p>
              </div>
              <div>
                <p className="text-sm font-bold text-purple-700">{project.safe.flowEfficiency}%</p>
                <p className="text-[8px] text-muted-foreground">Flow</p>
              </div>
            </div>
          </div>
          
          {/* AI INSIGHT - Unified */}
          <motion.div 
            className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200"
            animate={{ borderColor: ["#e9d5ff", "#a855f7", "#e9d5ff"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-start gap-2">
              <Brain size={14} className="text-purple-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-purple-700 mb-1">AI INSIGHT</p>
                <p className="text-xs text-purple-900 leading-tight line-clamp-2">{project.aiInsight}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-purple-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${project.aiConfidence}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <span className="text-[9px] text-purple-600 font-medium">{project.aiConfidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Proactive Action */}
          {project.proactiveAction && (
            <motion.div 
              className="p-2 rounded-lg border-2 flex items-center gap-2"
              style={{ borderColor: actionTypeColors[project.proactiveAction.type], backgroundColor: `${actionTypeColors[project.proactiveAction.type]}10` }}
              whileHover={{ x: 4 }}
            >
              <div 
                className="p-1.5 rounded text-white"
                style={{ backgroundColor: actionTypeColors[project.proactiveAction.type] }}
              >
                <Zap size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{project.proactiveAction.action}</p>
                <p className="text-[10px] text-green-600 font-medium">{project.proactiveAction.impact}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.div>
          )}
          
          {/* View Details CTA */}
          <motion.div 
            className="flex items-center justify-center gap-2 text-xs font-medium text-purple-600 pt-2 border-t"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Eye size={12} />
            <span>Click for Full AI Briefing</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper to merge PMO + VRO data into unified format
function createUnifiedProjects(): UnifiedProject[] {
  return pmoProjects.map(pmo => {
    const matchingVRO = vroPrograms.find(v => v.bu === pmo.bu) || vroPrograms[0];
    return {
      id: pmo.id,
      name: pmo.name,
      bu: pmo.bu,
      status: pmo.status,
      valueStatus: matchingVRO.valueStatus,
      budget: pmo.budget,
      timeline: pmo.timeline,
      deliverables: pmo.deliverables,
      expectedROI: matchingVRO.expectedROI,
      valueRealized: matchingVRO.valueRealized,
      roiValue: matchingVRO.roiValue,
      safe: pmo.safe,
      aiInsight: pmo.aiSignals[0]?.message || matchingVRO.prediction,
      aiConfidence: pmo.aiSignals[0]?.confidence || 85,
      proactiveAction: pmo.proactiveActions[0]
    };
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
// Agent alert messages for simulation
const AGENT_ALERTS: Omit<LiveAgentAlert, 'projectId' | 'timestamp'>[] = [
  { agentName: 'Integrated Management', message: 'Value realization trending ahead of forecast', type: 'insight' },
  { agentName: 'FinOps Agent', message: 'Budget variance detected - reviewing allocation', type: 'warning' },
  { agentName: 'TMO Agent', message: 'Transformation milestone approaching', type: 'update' },
  { agentName: 'Governance Agent', message: 'Compliance check completed successfully', type: 'action' },
  { agentName: 'OKR Agent', message: 'Key result progress updated to 85%', type: 'insight' },
  { agentName: 'Planning Agent', message: 'Sprint velocity improved by 12%', type: 'update' },
  { agentName: 'OCM Agent', message: 'Stakeholder engagement score rising', type: 'action' },
  { agentName: 'Integrated Management', message: 'Cross-portfolio dependency identified', type: 'warning' },
];

export function BUProgramsSection({ dataMode, onDrillDown }: BUProgramsSectionProps) {
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [pulseActive, setPulseActive] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PMOProject | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<VROProgram | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<Map<string, LiveAgentAlert>>(new Map());
  
  // Generate unified projects (VRO + PMO combined)
  const unifiedProjects = createUnifiedProjects();
  
  // Get projects for selected BU (now always unified)
  const filteredUnified = selectedBU 
    ? unifiedProjects.filter(p => p.bu === selectedBU)
    : [];
  
  // Keep legacy filters for modal compatibility
  const filteredPMO = selectedBU 
    ? pmoProjects.filter(p => p.bu === selectedBU)
    : [];
    
  const filteredVRO = selectedBU 
    ? vroPrograms.filter(p => p.bu === selectedBU)
    : [];

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseActive(p => !p);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Simulate live agent alerts on project cards
  useEffect(() => {
    if (!selectedBU || filteredUnified.length === 0) return;
    
    const alertInterval = setInterval(() => {
      // Pick a random project to alert
      const randomProject = filteredUnified[Math.floor(Math.random() * filteredUnified.length)];
      const randomAlert = AGENT_ALERTS[Math.floor(Math.random() * AGENT_ALERTS.length)];
      
      const newAlert: LiveAgentAlert = {
        projectId: randomProject.id,
        agentName: randomAlert.agentName,
        message: randomAlert.message,
        type: randomAlert.type,
        timestamp: new Date()
      };
      
      setLiveAlerts(prev => new Map(prev).set(randomProject.id, newAlert));
      
      // Clear alert after 5 seconds
      setTimeout(() => {
        setLiveAlerts(prev => {
          const newMap = new Map(prev);
          newMap.delete(randomProject.id);
          return newMap;
        });
      }, 5000);
    }, 8000); // New alert every 8 seconds
    
    return () => clearInterval(alertInterval);
  }, [selectedBU, filteredUnified]);

  const handleViewProjectDetails = (project: PMOProject) => {
    setSelectedProject(project);
    setSelectedProgram(null);
    setModalOpen(true);
  };

  const handleViewProgramDetails = (program: VROProgram) => {
    setSelectedProgram(program);
    setSelectedProject(null);
    setModalOpen(true);
  };

  const handleDrillDown = (buName: string) => {
    setSelectedBU(buName);
  };

  const handleBackToPortfolios = () => {
    setSelectedBU(null);
  };

  return (
    <div className="space-y-6">
      {/* Header - VRO Co-Pilot */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600">
              <Layers size={20} className="text-white" />
            </div>
            {selectedBU ? `${selectedBU} - Unified View` : "VRO Co-Pilot Portfolios"}
            <motion.div
              animate={{ scale: pulseActive ? [1, 1.2, 1] : 1, opacity: pulseActive ? [0.7, 1, 0.7] : 0.7 }}
              transition={{ duration: 1.5, repeat: pulseActive ? Infinity : 0 }}
            >
              <Activity size={20} className="text-green-500" />
            </motion.div>
          </h2>
          <p className="text-muted-foreground text-sm">
            {selectedBU 
              ? "Unified VRO + PMO view - Click any project to access full AI briefing"
              : "Click a portfolio to see unified value + delivery metrics"
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedBU && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToPortfolios}
              data-testid="back-to-portfolios"
            >
              <ChevronLeft size={14} className="mr-1" />
              Back to Portfolios
            </Button>
          )}
          {/* Unified summary showing both VRO + PMO stats */}
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1 px-2 py-1 bg-teal-50 rounded border border-teal-200">
              <span className="text-[10px] text-teal-600">VRO:</span>
              <span className="text-xs font-bold text-teal-700">£{vroSummary.totalRealized}m</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200">
              <span className="text-[10px] text-blue-600">PMO:</span>
              <Badge className="bg-green-600 text-white text-[10px]">{pmoSummary.green}</Badge>
              <Badge className="bg-amber-500 text-white text-[10px]">{pmoSummary.amber}</Badge>
              <Badge className="bg-red-600 text-white text-[10px]">{pmoSummary.red}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Grid (when no BU selected) */}
      {!selectedBU && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {buPortfolios.map((portfolio, i) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <PortfolioCard 
                  portfolio={portfolio} 
                  onDrillDown={() => handleDrillDown(portfolio.name)}
                  mode={dataMode}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Unified Project Grid (when BU selected) - Always shows combined VRO + PMO */}
      {selectedBU && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredUnified.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <UnifiedProjectCard 
                  project={project} 
                  liveAlert={liveAlerts.get(project.id)}
                  onViewDetails={() => {
                    if (onDrillDown) {
                      onDrillDown('project', project.id);
                    } else {
                      const pmoProject = pmoProjects.find(p => p.id === project.id);
                      if (pmoProject) handleViewProjectDetails(pmoProject);
                    }
                  }} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Risk Intelligence - Always visible in unified view */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Shield className="text-red-600" size={20} />
              Risk Intelligence Dashboard
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-monitored risk landscape with proactive alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-red-600 text-white">{riskSummary.critical} Critical</Badge>
            <Badge className="bg-amber-500 text-white">{riskSummary.high} High</Badge>
            <Badge className="bg-blue-600 text-white">{riskSummary.medium} Medium</Badge>
          </div>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskIssues.slice(0, 4).map((risk, i) => {
              const severityColors = {
                critical: "#D50032",
                high: "#f59e0b",
                medium: "#005EB8",
                low: "#00843D"
              };
              
              return (
                <motion.div
                  key={risk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: severityColors[risk.severity] }}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className="text-white text-[10px] uppercase"
                              style={{ backgroundColor: severityColors[risk.severity] }}
                            >
                              {risk.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{risk.category}</Badge>
                          </div>
                          <p className="font-medium text-sm">{risk.name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{risk.description}</p>
                      {risk.aiAlert && (
                        <motion.div 
                          className="p-2 bg-purple-50 rounded border border-purple-100 text-xs"
                          animate={{ borderColor: ["#e9d5ff", "#a855f7", "#e9d5ff"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="flex items-start gap-1">
                            <Brain size={12} className="text-purple-600 mt-0.5" />
                            <span className="text-purple-700">{risk.aiAlert}</span>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

      {/* Detail Modal */}
      <ProjectDetailModal
        project={selectedProject || undefined}
        program={selectedProgram || undefined}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={dataMode}
      />
    </div>
  );
}
