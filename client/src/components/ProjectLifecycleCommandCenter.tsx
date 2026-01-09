import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  GitBranch,
  Activity,
  Lightbulb,
  Search,
  CheckSquare,
  Play,
  Eye,
  ArrowRight,
  Brain,
  Zap,
  Clock,
  Users,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { useSimulation } from "@/lib/liveSimulationEngine";
import { getTaskQueue, getMemoryStore, delegateTask } from "@/lib/agentOrchestrator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SAFE_STAGES, SAFE_STAGE_LABELS } from "@/lib/unifiedMetrics";

const LG_BLUE = "#005EB8";
const LG_TEAL = "#00843D";
const LG_RED = "#D50032";
const LG_AMBER = "#F59E0B";

interface Props {
  onDrillDown?: (type: string, id: string) => void;
}

export function ProjectLifecycleCommandCenter({ onDrillDown }: Props) {
  const { state } = useSimulation();
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Get live task queue and memory from orchestrator
  const taskQueue = getTaskQueue();
  const memoryStore = getMemoryStore();
  
  // Calculate live metrics from simulation state
  const liveMetrics = useMemo(() => {
    const projects = state.projects;
    const totalProjects = projects.length;
    
    // Estimation Accuracy: Based on predictability scores
    const avgPredictability = projects.reduce((sum, p) => sum + (p.safe?.predictability || 0), 0) / totalProjects;
    
    // Cost Variance: Based on budget utilization
    const budgetVariances = projects.map(p => {
      const spent = p.budget?.spent || 0;
      const total = p.budget?.total || 1;
      return ((spent / total) * 100) - 100; // Negative is under, positive is over
    });
    const avgCostVariance = Math.abs(budgetVariances.reduce((a, b) => a + b, 0) / totalProjects);
    
    // Dependency Health: Based on project status distribution
    const greenProjects = projects.filter(p => p.status === 'green').length;
    const amberProjects = projects.filter(p => p.status === 'amber').length;
    const redProjects = projects.filter(p => p.status === 'red').length;
    const dependencyHealth = Math.round((greenProjects / totalProjects) * 100);
    
    // Status Confidence: Based on velocity and OKR progress
    const avgVelocity = projects.reduce((sum, p) => sum + (p.safe?.velocity || 0), 0) / totalProjects;
    const statusConfidence = Math.min(100, Math.round(avgVelocity + 20));
    
    return {
      estimationAccuracy: { value: Math.round(avgPredictability), target: 90 },
      costVariance: { value: Math.round(avgCostVariance * 10) / 10, target: 5 },
      dependencyHealth: { value: dependencyHealth, target: 85 },
      statusConfidence: { value: statusConfidence, target: 90 },
      greenProjects,
      amberProjects,
      redProjects,
      totalProjects
    };
  }, [state.projects]);
  
  // Calculate innovation funnel from SAFe stages
  const innovationFunnel = useMemo(() => {
    const projects = state.projects;
    return [
      { stage: 'funnel', label: 'Ideation', icon: Lightbulb, count: projects.filter(p => p.safeStage === 'funnel').length, color: '#9333EA' },
      { stage: 'reviewing', label: 'Validation', icon: Search, count: projects.filter(p => p.safeStage === 'reviewing').length, color: '#3B82F6' },
      { stage: 'analyzing', label: 'Selection', icon: CheckSquare, count: projects.filter(p => p.safeStage === 'analyzing' || p.safeStage === 'portfolio-backlog').length, color: '#F59E0B' },
      { stage: 'implementing', label: 'Execution', icon: Play, count: projects.filter(p => p.safeStage === 'implementing').length, color: LG_TEAL },
      { stage: 'done', label: 'Monitoring', icon: Eye, count: projects.filter(p => p.safeStage === 'done').length, color: '#6B7280' }
    ];
  }, [state.projects]);
  
  // Get recent agent activities
  const recentAgentActions = useMemo(() => {
    return memoryStore
      .filter(m => m.memoryType === 'action')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [memoryStore]);
  
  // Fetch AI insight
  const fetchAIInsight = async () => {
    setIsLoadingInsight(true);
    try {
      const response = await fetch('/api/ai/lifecycle-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: liveMetrics,
          funnel: innovationFunnel,
          recentChanges: state.recentChanges.slice(0, 10)
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAiInsight(data.insight);
      }
    } catch (error) {
      console.error('Failed to fetch AI insight:', error);
    } finally {
      setIsLoadingInsight(false);
    }
  };
  
  // Update timestamp when simulation updates
  useEffect(() => {
    setLastUpdate(state.lastUpdate);
  }, [state.lastUpdate]);
  
  const handleChallengeClick = (challengeId: string) => {
    if (onDrillDown) {
      onDrillDown('challenge', challengeId);
    }
    // Delegate investigation task to VRO agent
    delegateTask(
      'orchestrator',
      'investigate',
      'challenge',
      challengeId,
      `Challenge: ${challengeId}`,
      `Investigating ${challengeId} metrics and recommending actions`,
      'medium'
    );
  };
  
  const handleProjectClick = (projectId: string, projectName: string) => {
    if (onDrillDown) {
      onDrillDown('project', projectId);
    }
  };
  
  const getStatusColor = (value: number, target: number, isInverse: boolean = false) => {
    const ratio = isInverse ? target / value : value / target;
    if (ratio >= 0.9) return LG_TEAL;
    if (ratio >= 0.7) return LG_AMBER;
    return LG_RED;
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
      data-testid="lifecycle-command-center"
    >
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target size={24} className="text-[#005EB8]" />
            Project Lifecycle Command Center
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
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
          <Badge className="bg-green-100 text-green-700">VRO Intelligence Active</Badge>
        </div>
      </div>

      {/* Challenge Response Tiles - Live Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimation Accuracy */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 group"
          style={{ borderLeftColor: getStatusColor(liveMetrics.estimationAccuracy.value, liveMetrics.estimationAccuracy.target) }}
          onClick={() => handleChallengeClick('estimation-accuracy')}
          data-testid="challenge-tile-estimation"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Target size={20} className="text-blue-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                {liveMetrics.estimationAccuracy.value >= liveMetrics.estimationAccuracy.target * 0.9 ? 'On Track' : 'Needs Attention'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm mb-1">Estimation Accuracy</h3>
            <p className="text-xs text-muted-foreground mb-3">Challenge 1: Poor Estimation</p>
            <div className="flex items-baseline gap-1 mb-2">
              <motion.span 
                className="text-2xl font-bold"
                animate={state.pulsingMetrics.some(m => m.includes('predictability')) ? { scale: [1, 1.1, 1] } : {}}
              >
                {liveMetrics.estimationAccuracy.value}
              </motion.span>
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-xs text-muted-foreground ml-1">/ {liveMetrics.estimationAccuracy.target}%</span>
            </div>
            <Progress 
              value={Math.min((liveMetrics.estimationAccuracy.value / liveMetrics.estimationAccuracy.target) * 100, 100)} 
              className="h-1.5 mb-2"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Based on {liveMetrics.totalProjects} projects</span>
              <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Cost Variance */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 group"
          style={{ borderLeftColor: getStatusColor(liveMetrics.costVariance.target, liveMetrics.costVariance.value, true) }}
          onClick={() => handleChallengeClick('cost-variance')}
          data-testid="challenge-tile-cost"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <DollarSign size={20} className="text-amber-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                {liveMetrics.costVariance.value <= liveMetrics.costVariance.target ? 'Within Budget' : 'Over Budget'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm mb-1">Cost Variance</h3>
            <p className="text-xs text-muted-foreground mb-3">Challenge 1: Cost Overruns</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold">{liveMetrics.costVariance.value}</span>
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-xs text-muted-foreground ml-1">/ {liveMetrics.costVariance.target}% target</span>
            </div>
            <Progress 
              value={Math.min((liveMetrics.costVariance.target / Math.max(liveMetrics.costVariance.value, 0.1)) * 100, 100)} 
              className="h-1.5 mb-2"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">FinOps monitoring active</span>
              <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Dependency Health */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 group"
          style={{ borderLeftColor: getStatusColor(liveMetrics.dependencyHealth.value, liveMetrics.dependencyHealth.target) }}
          onClick={() => handleChallengeClick('dependency-health')}
          data-testid="challenge-tile-dependency"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <GitBranch size={20} className="text-purple-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                {liveMetrics.dependencyHealth.value >= liveMetrics.dependencyHealth.target * 0.9 ? 'Healthy' : 'At Risk'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm mb-1">Dependency Health</h3>
            <p className="text-xs text-muted-foreground mb-3">Challenge 2: No Visibility</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold">{liveMetrics.dependencyHealth.value}</span>
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-xs text-muted-foreground ml-1">/ {liveMetrics.dependencyHealth.target}%</span>
            </div>
            <Progress 
              value={Math.min((liveMetrics.dependencyHealth.value / liveMetrics.dependencyHealth.target) * 100, 100)} 
              className="h-1.5 mb-2"
            />
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-2">
                <span className="text-green-600">{liveMetrics.greenProjects} green</span>
                <span className="text-amber-600">{liveMetrics.amberProjects} amber</span>
                <span className="text-red-600">{liveMetrics.redProjects} red</span>
              </div>
              <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Status Confidence */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-l-4 group"
          style={{ borderLeftColor: getStatusColor(liveMetrics.statusConfidence.value, liveMetrics.statusConfidence.target) }}
          onClick={() => handleChallengeClick('status-confidence')}
          data-testid="challenge-tile-status"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Activity size={20} className="text-green-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                {liveMetrics.statusConfidence.value >= liveMetrics.statusConfidence.target * 0.9 ? 'High' : 'Medium'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm mb-1">Status Confidence</h3>
            <p className="text-xs text-muted-foreground mb-3">Challenge 3: Real-Time Status</p>
            <div className="flex items-baseline gap-1 mb-2">
              <motion.span 
                className="text-2xl font-bold"
                animate={state.pulsingMetrics.some(m => m.includes('velocity')) ? { scale: [1, 1.1, 1] } : {}}
              >
                {liveMetrics.statusConfidence.value}
              </motion.span>
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-xs text-muted-foreground ml-1">/ {liveMetrics.statusConfidence.target}%</span>
            </div>
            <Progress 
              value={Math.min((liveMetrics.statusConfidence.value / liveMetrics.statusConfidence.target) * 100, 100)} 
              className="h-1.5 mb-2"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Real-time updates enabled</span>
              <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Innovation Funnel - Live from SAFe Stages */}
      <Card data-testid="innovation-funnel-live">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb size={18} className="text-purple-600" />
                Innovation Funnel
              </CardTitle>
              <CardDescription>Project pipeline from ideation to monitoring</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{liveMetrics.totalProjects} Total Projects</span>
              {state.isLive && <Badge variant="outline" className="text-xs">Live</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {innovationFunnel.map((stage, index) => {
              const Icon = stage.icon;
              const widthPercent = Math.max(15, (stage.count / Math.max(...innovationFunnel.map(s => s.count), 1)) * 100);
              
              return (
                <div key={stage.stage} className="flex-1 flex flex-col items-center">
                  <motion.div 
                    className="w-full flex flex-col items-center cursor-pointer group"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onDrillDown?.('stage', stage.stage)}
                  >
                    <div 
                      className="rounded-lg p-3 mb-2 transition-all group-hover:shadow-md"
                      style={{ backgroundColor: `${stage.color}15` }}
                    >
                      <Icon size={24} style={{ color: stage.color }} />
                    </div>
                    <motion.span 
                      className="text-2xl font-bold"
                      animate={state.recentChanges.some(c => c.entityName.toLowerCase().includes(stage.stage)) ? { scale: [1, 1.1, 1] } : {}}
                    >
                      {stage.count}
                    </motion.span>
                    <span className="text-xs text-muted-foreground">{stage.label}</span>
                  </motion.div>
                  {index < innovationFunnel.length - 1 && (
                    <ArrowRight size={16} className="text-gray-300 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Funnel flow visualization */}
          <div className="mt-4 h-8 flex rounded-lg overflow-hidden">
            {innovationFunnel.map((stage, index) => (
              <motion.div
                key={stage.stage}
                className="h-full flex items-center justify-center text-white text-xs font-medium"
                style={{ 
                  backgroundColor: stage.color,
                  flex: stage.count || 1
                }}
                whileHover={{ opacity: 0.8 }}
              >
                {stage.count > 0 && stage.count}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: AI Insights, Recent Activity, Project Highlights */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* AI-Generated Insight */}
        <Card data-testid="ai-insight-panel">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain size={18} className="text-blue-600" />
                AI Insight
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchAIInsight}
                disabled={isLoadingInsight}
              >
                <RefreshCw size={14} className={cn(isLoadingInsight && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingInsight ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw size={14} className="animate-spin" />
                Generating insight...
              </div>
            ) : aiInsight ? (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">{aiInsight}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      {liveMetrics.amberProjects > liveMetrics.greenProjects 
                        ? `${liveMetrics.amberProjects} projects need attention. VRO agent recommends immediate review of amber-status initiatives.`
                        : `Portfolio health is strong with ${liveMetrics.greenProjects} projects on track. Focus on accelerating ${innovationFunnel[3].count} executing projects.`
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={fetchAIInsight}
                >
                  <Brain size={14} className="mr-2" />
                  Get AI Analysis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Agent Activity */}
        <Card data-testid="agent-activity-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap size={18} className="text-amber-600" />
              Agent Activity
            </CardTitle>
            <CardDescription>Recent autonomous actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentAgentActions.length > 0 ? (
                recentAgentActions.map((action, idx) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border text-xs"
                  >
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] shrink-0",
                        action.agentId === 'vro' && "border-blue-300 text-blue-700",
                        action.agentId === 'pmo' && "border-purple-300 text-purple-700"
                      )}
                    >
                      {action.agentId.toUpperCase()}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{action.content}</p>
                      <p className="text-gray-400 text-[10px]">{action.targetName}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Agent monitoring active...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Highlights */}
        <Card data-testid="project-highlights">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-green-600" />
              Project Highlights
            </CardTitle>
            <CardDescription>Recent changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.recentChanges.slice(0, 5).map((change, idx) => (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg border bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleProjectClick(change.id, change.entityName)}
                >
                  <div className="flex items-center gap-2">
                    {change.trend === 'up' ? (
                      <TrendingUp size={14} className="text-green-600" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <div>
                      <p className="text-xs font-medium truncate max-w-[120px]">{change.entityName}</p>
                      <p className="text-[10px] text-muted-foreground">{change.field}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-xs font-medium",
                      change.trend === 'up' ? "text-green-600" : "text-red-500"
                    )}>
                      {change.oldValue} → {change.newValue}
                    </span>
                  </div>
                </motion.div>
              ))}
              {state.recentChanges.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Monitoring for changes...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}
