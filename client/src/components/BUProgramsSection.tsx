import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  pmoProjects, vroPrograms, riskIssues,
  pmoSummary, vroSummary, riskSummary,
  PMOProject, VROProgram, RiskIssue, ProactiveAction, AISignal
} from "@/lib/buPrograms";
import { challenges, VROMetric } from "@/lib/data";
import { 
  Building2, TrendingUp, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Brain, Users, Target, Sparkles, Shield,
  ChevronDown, ChevronUp, Zap, AlertCircle, RotateCcw,
  Rocket, Search, ArrowUpRight, Activity
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

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

const getRelevantVROMetrics = (projectType: string): { metrics: VROMetric[], trackingFields: string[] } => {
  const typeMapping: Record<string, string[]> = {
    "Institutional Retirement": ["planning", "certainty", "visibility"],
    "Asset Management": ["planning", "efficiency", "prioritization"],
    "Retail": ["speed", "visibility", "consistency"],
    "Corporate Investments": ["planning", "certainty", "prioritization"],
    "Risk & Compliance": ["agility", "visibility", "consistency"]
  };
  
  const relevantChallenges = typeMapping[projectType] || ["planning", "visibility"];
  const metrics: VROMetric[] = [];
  const trackingFields: string[] = [];
  
  relevantChallenges.slice(0, 2).forEach(id => {
    const challenge = challenges.find(c => c.id === id);
    if (challenge) {
      metrics.push(...challenge.vroMetrics.slice(0, 2));
      trackingFields.push(...challenge.coreTrackingFields.slice(0, 2));
    }
  });
  
  return { metrics: metrics.slice(0, 4), trackingFields: trackingFields.slice(0, 4) };
};

function MiniSparkline({ data }: { data: { week: string; value: number }[] }) {
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#005EB8" 
            strokeWidth={1.5}
            dot={false}
          />
          <Tooltip 
            contentStyle={{ fontSize: 10, padding: "2px 6px" }}
            formatter={(v: number) => [v, ""]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProactiveActionButton({ action, onAction }: { action: ProactiveAction; onAction: (a: ProactiveAction) => void }) {
  const [clicked, setClicked] = useState(false);
  
  return (
    <motion.button
      className="w-full text-left p-2 rounded-lg border transition-all"
      style={{ 
        borderColor: actionTypeColors[action.type],
        backgroundColor: clicked ? `${actionTypeColors[action.type]}15` : "white"
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        e.stopPropagation();
        setClicked(true);
        onAction(action);
      }}
      data-testid={`action-${action.id}`}
    >
      <div className="flex items-start gap-2">
        <div 
          className="p-1 rounded text-white"
          style={{ backgroundColor: actionTypeColors[action.type] }}
        >
          {actionTypeIcons[action.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{action.action}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge 
              variant="outline" 
              className="text-[9px] px-1 py-0"
              style={{ borderColor: actionTypeColors[action.type], color: actionTypeColors[action.type] }}
            >
              {action.urgency}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{action.impact}</span>
          </div>
        </div>
        {clicked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-green-500"
          >
            <CheckCircle size={14} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

function PMOFlipCard({ project }: { project: PMOProject }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [actionTaken, setActionTaken] = useState<string[]>([]);
  
  const statusColors = {
    green: "#00843D",
    amber: "#f59e0b",
    red: "#D50032"
  };
  
  const budgetPercent = (project.budget.spent / project.budget.total) * 100;
  const timelinePercent = (project.timeline.elapsed / project.timeline.total) * 100;
  const deliverablePercent = (project.deliverables.completed / project.deliverables.total) * 100;

  const handleAction = (action: ProactiveAction) => {
    setActionTaken(prev => [...prev, action.id]);
  };

  return (
    <div 
      className="relative h-[380px] cursor-pointer perspective-1000"
      style={{ perspective: "1000px" }}
      data-testid={`card-${project.id}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Front Face */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Card className="h-full border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: statusColors[project.status] }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge 
                    className="mb-2 text-white text-xs"
                    style={{ backgroundColor: BU_COLORS[project.bu] || "#005EB8" }}
                  >
                    {project.bu}
                  </Badge>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    className="text-white uppercase text-xs"
                    style={{ backgroundColor: statusColors[project.status] }}
                  >
                    {project.status}
                  </Badge>
                  {project.aiSignals.length > 0 && (
                    <motion.div 
                      className="flex items-center gap-1 text-[10px] text-purple-600"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Brain size={10} />
                      <span>{project.aiSignals.length} AI signals</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1"><DollarSign size={12} /> Budget</span>
                    <span className={budgetPercent > 100 ? "text-red-600 font-medium" : ""}>
                      {project.budget.spent.toFixed(1)}/{project.budget.total}{project.budget.unit}
                    </span>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    style={{ originX: 0 }}
                  >
                    <Progress value={Math.min(budgetPercent, 100)} className="h-1.5" />
                  </motion.div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1"><Clock size={12} /> Timeline</span>
                    <span>{project.timeline.elapsed}/{project.timeline.total} {project.timeline.unit}</span>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ originX: 0 }}
                  >
                    <Progress value={timelinePercent} className="h-1.5" />
                  </motion.div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1"><CheckCircle size={12} /> Deliverables</span>
                    <span>{project.deliverables.completed}/{project.deliverables.total}</span>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{ originX: 0 }}
                  >
                    <Progress value={deliverablePercent} className="h-1.5" />
                  </motion.div>
                </div>
                
                <div className="pt-2 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Next Milestone:</p>
                    <p className="text-sm font-medium">{project.nextMilestone}</p>
                  </div>
                  <MiniSparkline data={project.trendData} />
                </div>
                
                <motion.div 
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <RotateCcw size={12} />
                  <span>Click to flip for AI insights</span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Face */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Card className="h-full border-l-4 bg-gradient-to-br from-purple-50 to-blue-50" style={{ borderLeftColor: "#7c3aed" }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="mb-1 text-white text-xs bg-purple-600">
                    AI Intelligence
                  </Badge>
                  <CardTitle className="text-sm">{project.name}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] font-medium text-purple-700 mb-2 flex items-center gap-1">
                  <Brain size={10} /> AI SIGNALS
                </p>
                <div className="space-y-2">
                  {project.aiSignals.map((signal, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 p-2 bg-white/80 rounded-lg border border-purple-100"
                    >
                      {signalIcons[signal.type]}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] leading-tight">{signal.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div 
                              className="h-1 rounded-full bg-purple-200"
                              style={{ width: 40 }}
                            >
                              <motion.div 
                                className="h-full rounded-full bg-purple-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${signal.confidence}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                              />
                            </div>
                            <span className="text-[9px] text-purple-600">{signal.confidence}%</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">{signal.dataSource}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-green-700 mb-2 flex items-center gap-1">
                  <Zap size={10} /> PROACTIVE ACTIONS
                </p>
                <div className="space-y-1.5">
                  {project.proactiveActions.map((action) => (
                    <ProactiveActionButton
                      key={action.id}
                      action={action}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>

              {actionTaken.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2 bg-green-100 rounded-lg border border-green-200"
                >
                  <p className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle size={10} /> {actionTaken.length} action(s) initiated
                  </p>
                </motion.div>
              )}

              <div className="pt-2 border-t border-purple-200">
                <p className="text-[10px] font-medium text-blue-700 mb-1.5 flex items-center gap-1">
                  <Target size={10} /> VRO METRICS & TRACKING
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {getRelevantVROMetrics(project.bu).metrics.slice(0, 2).map((metric, i) => (
                    <div key={i} className="flex items-center gap-1 text-[9px] text-blue-700 bg-blue-50 rounded px-1 py-0.5">
                      <div className="w-1 h-1 rounded-full bg-blue-500" />
                      {metric.name.split(' ').slice(0, 3).join(' ')}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {getRelevantVROMetrics(project.bu).trackingFields.slice(0, 2).map((field, i) => (
                    <div key={i} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function VROFlipCard({ program }: { program: VROProgram }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [actionTaken, setActionTaken] = useState<string[]>([]);
  
  const statusColors = {
    accelerating: "#00843D",
    "on-track": "#005EB8",
    "at-risk": "#f59e0b",
    blocked: "#D50032"
  };
  
  const valuePercent = program.roiValue > 0 ? (program.valueRealized / program.roiValue) * 100 : 0;

  const handleAction = (action: ProactiveAction) => {
    setActionTaken(prev => [...prev, action.id]);
  };

  return (
    <div 
      className="relative h-[420px] cursor-pointer"
      style={{ perspective: "1000px" }}
      data-testid={`card-${program.id}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        {/* Front Face */}
        <motion.div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Card className="h-full border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: statusColors[program.valueStatus] }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge 
                    className="mb-2 text-white text-xs"
                    style={{ backgroundColor: BU_COLORS[program.bu] || "#005EB8" }}
                  >
                    {program.bu}
                  </Badge>
                  <CardTitle className="text-base">{program.name}</CardTitle>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    className="text-white capitalize text-xs"
                    style={{ backgroundColor: statusColors[program.valueStatus] }}
                  >
                    {program.valueStatus === "on-track" ? "On Track" : program.valueStatus}
                  </Badge>
                  <motion.div 
                    className="flex items-center gap-1 text-[10px] text-purple-600"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap size={10} />
                    <span>{program.proactiveActions.length} actions</span>
                  </motion.div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <motion.div 
                    className="p-2 bg-green-50 rounded"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-[10px] text-muted-foreground">Expected ROI</p>
                    <p className="text-sm font-bold text-green-700">{program.expectedROI}</p>
                  </motion.div>
                  <motion.div 
                    className="p-2 bg-blue-50 rounded"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-[10px] text-muted-foreground">Alignment</p>
                    <p className="text-sm font-bold text-blue-700">{program.strategicAlignment}%</p>
                  </motion.div>
                </div>
                
                {program.roiValue > 0 && program.roiValue < 10000 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1"><TrendingUp size={12} /> Value Realized</span>
                      <span className="font-medium">£{program.valueRealized}m / £{program.roiValue}m</span>
                    </div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8 }}
                      style={{ originX: 0 }}
                    >
                      <Progress value={valuePercent} className="h-1.5" />
                    </motion.div>
                  </div>
                )}
                
                <motion.div 
                  className="p-2 bg-purple-50 rounded border border-purple-100"
                  whileHover={{ scale: 1.01, borderColor: "#a855f7" }}
                >
                  <div className="flex items-start gap-2">
                    <Brain size={14} className="text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-purple-600 font-medium">AI INSIGHT</p>
                      <p className="text-[11px] line-clamp-2">{program.aiInsight}</p>
                    </div>
                  </div>
                </motion.div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {program.collaborators.length} collaborators
                    </span>
                  </div>
                  <MiniSparkline data={program.trendData} />
                </div>
                
                <motion.div 
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <RotateCcw size={12} />
                  <span>Click to flip for actions</span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Face */}
        <motion.div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <Card className="h-full border-l-4 bg-gradient-to-br from-green-50 to-blue-50" style={{ borderLeftColor: "#00843D" }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="mb-1 text-white text-xs bg-green-600">
                    Take Action
                  </Badge>
                  <CardTitle className="text-sm">{program.name}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] font-medium text-purple-700 mb-2 flex items-center gap-1">
                  <Brain size={10} /> AI SIGNALS
                </p>
                <div className="space-y-1.5">
                  {program.aiSignals.map((signal, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 p-2 bg-white/80 rounded-lg border border-purple-100"
                    >
                      {signalIcons[signal.type]}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] leading-tight">{signal.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className="h-1 rounded-full bg-purple-200" style={{ width: 40 }}>
                              <motion.div 
                                className="h-full rounded-full bg-purple-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${signal.confidence}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                              />
                            </div>
                            <span className="text-[9px] text-purple-600">{signal.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-green-700 mb-2 flex items-center gap-1">
                  <Zap size={10} /> PROACTIVE ACTIONS
                </p>
                <div className="space-y-1.5">
                  {program.proactiveActions.map((action) => (
                    <ProactiveActionButton
                      key={action.id}
                      action={action}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>

              {actionTaken.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2 bg-green-100 rounded-lg border border-green-200"
                >
                  <p className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle size={10} /> {actionTaken.length} action(s) initiated
                  </p>
                </motion.div>
              )}

              <div className="pt-2 border-t border-green-200">
                <p className="text-[10px] font-medium text-blue-700 mb-1.5 flex items-center gap-1">
                  <Target size={10} /> VRO METRICS & TRACKING
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {getRelevantVROMetrics(program.bu).metrics.slice(0, 2).map((metric, i) => (
                    <div key={i} className="flex items-center gap-1 text-[9px] text-blue-700 bg-blue-50 rounded px-1 py-0.5">
                      <div className="w-1 h-1 rounded-full bg-blue-500" />
                      {metric.name.split(' ').slice(0, 3).join(' ')}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {getRelevantVROMetrics(program.bu).trackingFields.slice(0, 2).map((field, i) => (
                    <div key={i} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function BUProgramsSection({ dataMode }: BUProgramsSectionProps) {
  const [selectedBU, setSelectedBU] = useState<string>("All");
  const [pulseActive, setPulseActive] = useState(true);
  
  const businessUnits = ["All", "Institutional Retirement", "Asset Management", "Retail", "Corporate Investments", "Risk & Compliance"];
  
  const filteredPMO = selectedBU === "All" 
    ? pmoProjects 
    : pmoProjects.filter(p => p.bu === selectedBU);
    
  const filteredVRO = selectedBU === "All" 
    ? vroPrograms 
    : vroPrograms.filter(p => p.bu === selectedBU);

  // Pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseActive(p => !p);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {dataMode === "PMO" ? "Project Delivery Status" : "Value Realization Programs"}
            <motion.div
              animate={{ scale: pulseActive ? [1, 1.2, 1] : 1, opacity: pulseActive ? [0.7, 1, 0.7] : 0.7 }}
              transition={{ duration: 1.5, repeat: pulseActive ? Infinity : 0 }}
            >
              <Activity size={20} className="text-green-500" />
            </motion.div>
          </h2>
          <p className="text-muted-foreground text-sm">
            {dataMode === "PMO" 
              ? "Click any card to reveal AI signals and proactive actions" 
              : "Click cards to access AI-powered insights and take action"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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

      <div className="flex flex-wrap gap-2">
        {businessUnits.map(bu => (
          <motion.div key={bu} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={selectedBU === bu ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBU(bu)}
              style={selectedBU === bu && bu !== "All" ? { backgroundColor: BU_COLORS[bu] } : undefined}
              data-testid={`filter-bu-${bu.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {bu}
            </Button>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        layout
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
                <PMOFlipCard project={project} />
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
                <VROFlipCard program={program} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Risk Issues Section - From Risk Management Supplement */}
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
              <Badge variant="outline">{riskSummary.withAIAlerts} AI Alerts</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskIssues.map((risk, i) => {
              const severityColors = {
                critical: "#D50032",
                high: "#f59e0b",
                medium: "#005EB8",
                low: "#00843D"
              };
              const trendIcons = {
                improving: <TrendingUp size={12} className="text-green-600" />,
                stable: <div className="w-3 h-0.5 bg-gray-400" />,
                worsening: <AlertTriangle size={12} className="text-red-600" />
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
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              {trendIcons[risk.trend]}
                              <span className="capitalize">{risk.trend}</span>
                            </div>
                          </div>
                          <p className="font-medium text-sm">{risk.name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{risk.description}</p>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span className="text-muted-foreground">Exposure: {risk.exposure}</span>
                        <span className="text-muted-foreground">Owner: {risk.owner}</span>
                      </div>
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
                      <p className="text-[10px] text-muted-foreground mt-2 italic">Source: {risk.source}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

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
    </div>
  );
}
