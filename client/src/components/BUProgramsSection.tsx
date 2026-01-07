import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  pmoProjects, vroPrograms, riskIssues,
  pmoSummary, vroSummary, riskSummary,
  PMOProject, VROProgram, RiskIssue, ProactiveAction, AISignal,
  buPortfolios, BUPortfolio
} from "@/lib/buPrograms";
import { challenges, VROMetric } from "@/lib/data";
import { 
  Building2, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Brain, Users, Target, Sparkles, Shield,
  ChevronDown, ChevronUp, Zap, AlertCircle, RotateCcw,
  Rocket, Search, ArrowUpRight, Activity, ExternalLink,
  FileText, ChevronRight, ChevronLeft, Play, MessageSquare, Layers,
  GitBranch, Calendar, BarChart3, Eye
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, BarChart, Bar } from "recharts";

type DataMode = "VRO" | "PMO";

interface BUProgramsSectionProps {
  dataMode: DataMode;
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
  
  const item = project || program;
  if (!item) return null;
  
  const isPMO = mode === "PMO" && project;
  const isVRO = mode === "VRO" && program;
  
  // Generate SAFe metrics for display
  const safeMetrics = {
    piNumber: "PI 24.4",
    velocity: Math.floor(Math.random() * 30) + 40,
    predictability: Math.floor(Math.random() * 15) + 80,
    flowEfficiency: Math.floor(Math.random() * 20) + 60,
    wip: Math.floor(Math.random() * 5) + 3,
    leadTime: Math.floor(Math.random() * 10) + 8
  };

  const epicData = [
    { name: "Completed", value: Math.floor(Math.random() * 5) + 3 },
    { name: "In Progress", value: Math.floor(Math.random() * 4) + 2 },
    { name: "Planned", value: Math.floor(Math.random() * 3) + 1 }
  ];

  const piTrendData = [
    { pi: "PI 24.1", planned: 85, actual: 82 },
    { pi: "PI 24.2", planned: 90, actual: 88 },
    { pi: "PI 24.3", planned: 88, actual: 91 },
    { pi: "PI 24.4", planned: 92, actual: 89 }
  ];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
          <DialogTitle className="text-xl mt-2">{item.name}</DialogTitle>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <FileText size={12} />
            Source: L&G Annual Report 2024, Climate & Nature Report 2024
          </p>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="safe" data-testid="tab-safe">SAFe Metrics</TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai">AI Briefing</TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isPMO && project && (
                <Card className="border-l-4" style={{ borderLeftColor: project.status === "green" ? "#00843D" : project.status === "amber" ? "#f59e0b" : "#D50032" }}>
                  <CardContent className="py-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign size={16} /> Delivery Metrics
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Budget</span>
                          <span className={project.budget.spent > project.budget.total ? "text-red-600 font-medium" : ""}>
                            {project.budget.spent.toFixed(1)} / {project.budget.total}{project.budget.unit}
                          </span>
                        </div>
                        <Progress value={Math.min((project.budget.spent / project.budget.total) * 100, 100)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Timeline</span>
                          <span>{project.timeline.elapsed} / {project.timeline.total} {project.timeline.unit}</span>
                        </div>
                        <Progress value={(project.timeline.elapsed / project.timeline.total) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Deliverables</span>
                          <span>{project.deliverables.completed} / {project.deliverables.total}</span>
                        </div>
                        <Progress value={(project.deliverables.completed / project.deliverables.total) * 100} className="h-2" />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Next Milestone:</p>
                      <p className="font-medium">{project.nextMilestone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isVRO && program && (
                <Card className="border-l-4 border-teal-500">
                  <CardContent className="py-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target size={16} className="text-teal-600" /> Value Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-teal-50 rounded-lg">
                        <p className="text-2xl font-bold text-teal-700">{program.expectedROI}</p>
                        <p className="text-xs text-teal-600">Expected ROI</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">£{program.valueRealized}m</p>
                        <p className="text-xs text-green-600">Value Realized</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {program.keyOutcomes.map((outcome, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{outcome.outcome}</span>
                            <span className="font-medium">{outcome.progress} / {outcome.target} {outcome.unit}</span>
                          </div>
                          <Progress value={(outcome.progress / outcome.target) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
                            <stop offset="5%" stopColor={isPMO ? "#005EB8" : "#00843D"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isPMO ? "#005EB8" : "#00843D"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke={isPMO ? "#005EB8" : "#00843D"} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Accelerate Digital Transformation</span>
                      <Badge className="bg-green-600 text-white">On Track</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">KR: Complete 80% of platform migration by PI end</p>
                    <Progress value={75} className="h-1.5" />
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Improve Customer Experience</span>
                      <Badge className="bg-amber-500 text-white">At Risk</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">KR: Reduce onboarding time by 40%</p>
                    <Progress value={55} className="h-1.5" />
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
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// PORTFOLIO CARD - BU-level with macro KPIs and drill-down
// ============================================================================
function PortfolioCard({ portfolio, onDrillDown, mode }: { portfolio: BUPortfolio; onDrillDown: () => void; mode: DataMode }) {
  const healthColor = portfolio.healthScore >= 80 ? "#00843D" : portfolio.healthScore >= 60 ? "#f59e0b" : "#D50032";
  const isPMO = mode === "PMO";
  
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
        className="h-full hover:shadow-xl transition-all cursor-pointer relative overflow-hidden border-l-4"
        style={{ borderLeftColor: BU_COLORS[portfolio.name] || "#005EB8" }}
        onClick={onDrillDown}
        data-testid={`portfolio-${portfolio.id}`}
      >
        {/* Mode Badge */}
        <div className={`absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold text-white rounded-bl ${isPMO ? "bg-gray-600" : "bg-teal-600"}`}>
          {isPMO ? "PMO PORTFOLIO" : "VRO PORTFOLIO"}
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
          {/* Macro KPIs */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded" style={{ backgroundColor: `${healthColor}15` }}>
              <p className="text-xl font-bold" style={{ color: healthColor }}>{portfolio.healthScore}%</p>
              <p className="text-[9px] text-muted-foreground">Health</p>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-xl font-bold text-blue-700">{portfolio.projectCount}</p>
              <p className="text-[9px] text-muted-foreground">Projects</p>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <p className="text-xl font-bold text-purple-700">{portfolio.activeEpics}</p>
              <p className="text-[9px] text-muted-foreground">EPICs</p>
            </div>
          </div>
          
          {/* SAFe Metrics Row */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-1.5 bg-gray-50 rounded">
              <p className="font-bold">{portfolio.velocity}</p>
              <p className="text-[9px] text-muted-foreground">Velocity</p>
            </div>
            <div className="p-1.5 bg-gray-50 rounded">
              <p className="font-bold">{portfolio.predictability}%</p>
              <p className="text-[9px] text-muted-foreground">Predictability</p>
            </div>
            <div className="p-1.5 bg-gray-50 rounded">
              <p className="font-bold">{portfolio.currentPI}</p>
              <p className="text-[9px] text-muted-foreground">Current PI</p>
            </div>
          </div>
          
          {/* OKR Progress */}
          {portfolio.okrs[0] && (
            <div className="p-2 bg-blue-50 rounded-lg">
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
            className="p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
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
            className="flex items-center justify-center gap-2 text-xs font-medium pt-2 border-t"
            style={{ color: isPMO ? "#005EB8" : "#00843D" }}
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
// MAIN COMPONENT
// ============================================================================
export function BUProgramsSection({ dataMode }: BUProgramsSectionProps) {
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [pulseActive, setPulseActive] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PMOProject | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<VROProgram | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Get projects/programs for selected BU
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {dataMode === "PMO" ? (
              <>
                <Building2 size={24} className="text-gray-600" />
                {selectedBU ? `${selectedBU} Projects` : "Business Unit Portfolios"}
              </>
            ) : (
              <>
                <Target size={24} className="text-teal-600" />
                {selectedBU ? `${selectedBU} Programs` : "Value Portfolios"}
              </>
            )}
            <motion.div
              animate={{ scale: pulseActive ? [1, 1.2, 1] : 1, opacity: pulseActive ? [0.7, 1, 0.7] : 0.7 }}
              transition={{ duration: 1.5, repeat: pulseActive ? Infinity : 0 }}
            >
              <Activity size={20} className="text-green-500" />
            </motion.div>
          </h2>
          <p className="text-muted-foreground text-sm">
            {selectedBU 
              ? "Click any project card to access full AI briefing, SAFe metrics, and proactive actions"
              : "Click a portfolio to drill down to individual projects and programs"
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
          {dataMode === "PMO" ? (
            <div className="flex gap-2">
              <Badge className="bg-green-600 text-white">{pmoSummary.green} Green</Badge>
              <Badge className="bg-amber-500 text-white">{pmoSummary.amber} Amber</Badge>
              <Badge className="bg-red-600 text-white">{pmoSummary.red} Red</Badge>
            </div>
          ) : (
            <div className="flex gap-2">
              <Badge className="bg-green-600 text-white">{vroSummary.accelerating} Accelerating</Badge>
              <Badge className="bg-blue-600 text-white">{vroSummary.onTrack} On Track</Badge>
              <div className="text-sm font-medium text-green-700">
                £{vroSummary.totalRealized}m realized
              </div>
            </div>
          )}
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

      {/* Project/Program Grid (when BU selected) */}
      {selectedBU && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {dataMode === "PMO" ? (
              filteredPMO.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <PMOProjectCard 
                    project={project} 
                    onViewDetails={() => handleViewProjectDetails(project)} 
                  />
                </motion.div>
              ))
            ) : (
              filteredVRO.map((program, i) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <VROProgramCard 
                    program={program} 
                    onViewDetails={() => handleViewProgramDetails(program)} 
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Risk Section for VRO mode */}
      {dataMode === "VRO" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-red-600" size={20} />
                Risk Intelligence Dashboard
              </h3>
              <p className="text-sm text-muted-foreground">
                From L&G Risk Management Supplement 2024 - AI-monitored risk landscape
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
      )}

      {/* PMO Limitation Notice */}
      {dataMode === "PMO" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-600" size={24} />
                <div>
                  <p className="font-medium text-amber-800">PMO Limitation</p>
                  <p className="text-sm text-amber-700">
                    Traditional project tracking shows delivery status but lacks value realization insights, 
                    AI predictions, and strategic alignment metrics that VRO provides.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
