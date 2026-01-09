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
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const LG_BLUE = "#005EB8";
const LG_TEAL = "#00843D";
const LG_RED = "#D50032";
const LG_AMBER = "#F59E0B";

interface ChallengeData {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: number;
  aiInsight: string;
}

const challengeData: ChallengeData[] = [
  {
    id: "estimation-accuracy",
    title: "Estimation Accuracy",
    subtitle: "Challenge 1: Poor Estimation",
    icon: Target,
    currentValue: 78,
    targetValue: 90,
    unit: "%",
    status: 'warning',
    trend: 5.2,
    aiInsight: "AI detected 3 projects with >20% variance. Recommend historical calibration."
  },
  {
    id: "cost-variance",
    title: "Cost Variance",
    subtitle: "Challenge 1: Cost Overruns",
    icon: DollarSign,
    currentValue: 8.2,
    targetValue: 5,
    unit: "%",
    status: 'warning',
    trend: -2.1,
    aiInsight: "FinOps agent identified £2.4M savings opportunity in cloud spend."
  },
  {
    id: "dependency-health",
    title: "Dependency Health",
    subtitle: "Challenge 2: Resource Visibility",
    icon: GitBranch,
    currentValue: 84,
    targetValue: 95,
    unit: "%",
    status: 'good',
    trend: 3.8,
    aiInsight: "12 cross-portfolio dependencies mapped. 2 require attention."
  },
  {
    id: "status-confidence",
    title: "Status Confidence",
    subtitle: "Challenge 3: Real-Time Status",
    icon: Activity,
    currentValue: 92,
    targetValue: 95,
    unit: "%",
    status: 'good',
    trend: 8.5,
    aiInsight: "Live data feeds active. 47 projects reporting in real-time."
  }
];

const innovationFunnelData = [
  { stage: "Ideation", icon: Lightbulb, count: 24, color: "#9333EA", description: "New ideas captured" },
  { stage: "Validation", icon: Search, count: 12, color: "#3B82F6", description: "Business case review" },
  { stage: "Selection", icon: CheckSquare, count: 8, color: "#10B981", description: "Approved for execution" },
  { stage: "Execution", icon: Play, count: 47, color: LG_BLUE, description: "Active projects" },
  { stage: "Monitoring", icon: Eye, count: 156, color: LG_TEAL, description: "Benefits tracked" }
];

const projectDependencies = [
  { from: "Digital Platform", to: "Cloud Migration", status: "healthy", impact: "high" },
  { from: "Cloud Migration", to: "Data Analytics", status: "at-risk", impact: "critical" },
  { from: "Customer Portal", to: "API Gateway", status: "healthy", impact: "medium" },
  { from: "Legacy Modernization", to: "Cloud Migration", status: "blocked", impact: "high" },
  { from: "Security Upgrade", to: "All Projects", status: "healthy", impact: "critical" }
];

const realTimeGauges = [
  { label: "Schedule Performance", value: 87, target: 95, status: "warning" },
  { label: "Risk Exposure", value: 23, target: 15, status: "critical", inverse: true },
  { label: "Benefit Realization", value: 72, target: 80, status: "good" },
  { label: "Resource Utilization", value: 91, target: 85, status: "good" }
];

function ChallengeResponseTile({ challenge, onClick }: { challenge: ChallengeData; onClick?: () => void }) {
  const Icon = challenge.icon;
  const statusColors = {
    good: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-red-100 text-red-700 border-red-200"
  };
  
  const progressColor = challenge.status === 'good' ? LG_TEAL : 
                        challenge.status === 'warning' ? LG_AMBER : LG_RED;
  
  const progressValue = Math.min((challenge.currentValue / challenge.targetValue) * 100, 100);

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all border-l-4 group"
      style={{ borderLeftColor: progressColor }}
      onClick={onClick}
      data-testid={`challenge-tile-${challenge.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${progressColor}15` }}>
            <Icon size={20} style={{ color: progressColor }} />
          </div>
          <Badge className={cn("text-xs", statusColors[challenge.status])}>
            {challenge.status === 'good' ? 'On Track' : 
             challenge.status === 'warning' ? 'Attention' : 'Critical'}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-sm mb-1">{challenge.title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{challenge.subtitle}</p>
        
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold" style={{ color: progressColor }}>
            {challenge.currentValue}
          </span>
          <span className="text-sm text-muted-foreground">{challenge.unit}</span>
          <span className="text-xs text-muted-foreground ml-1">/ {challenge.targetValue}{challenge.unit}</span>
        </div>
        
        <Progress 
          value={progressValue} 
          className="h-1.5 mb-2"
        />
        
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-1">
            {challenge.trend >= 0 ? (
              <TrendingUp size={12} className="text-green-600" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
            <span className={challenge.trend >= 0 ? "text-green-600" : "text-red-500"}>
              {challenge.trend >= 0 ? "+" : ""}{challenge.trend}% vs last month
            </span>
          </div>
          <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        
        <div className="p-2 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-start gap-2">
            <Sparkles size={12} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-blue-700">{challenge.aiInsight}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InnovationFunnel() {
  const totalIdeas = innovationFunnelData.reduce((sum, stage) => sum + stage.count, 0);
  
  return (
    <Card data-testid="card-innovation-funnel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap size={18} className="text-purple-600" />
              Innovation Funnel
            </CardTitle>
            <CardDescription>From ideation to value realization</CardDescription>
          </div>
          <Badge className="bg-purple-100 text-purple-700">{totalIdeas} Total Items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          {innovationFunnelData.map((stage, index) => {
            const Icon = stage.icon;
            const widthPercent = 100 - (index * 15);
            
            return (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 text-center"
                data-testid={`funnel-stage-${stage.stage.toLowerCase()}`}
              >
                <div 
                  className="mx-auto mb-2 p-3 rounded-lg"
                  style={{ 
                    backgroundColor: `${stage.color}15`,
                    width: `${widthPercent}%`,
                    minWidth: '60px'
                  }}
                >
                  <Icon size={24} style={{ color: stage.color }} className="mx-auto" />
                </div>
                <p className="text-2xl font-bold" style={{ color: stage.color }}>{stage.count}</p>
                <p className="text-xs font-medium">{stage.stage}</p>
                <p className="text-[10px] text-muted-foreground">{stage.description}</p>
                {index < innovationFunnelData.length - 1 && (
                  <ArrowRight size={16} className="mx-auto mt-2 text-gray-300" />
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DependencyMap() {
  return (
    <Card data-testid="card-dependency-map">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch size={18} className="text-blue-600" />
              Dependency Visibility
            </CardTitle>
            <CardDescription>Cross-project resource relationships</CardDescription>
          </div>
          <Badge variant="outline">{projectDependencies.length} Dependencies</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projectDependencies.map((dep, index) => {
            const statusColors = {
              healthy: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: CheckCircle2 },
              "at-risk": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: AlertTriangle },
              blocked: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertCircle }
            };
            const style = statusColors[dep.status as keyof typeof statusColors];
            const StatusIcon = style.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  style.bg, style.border
                )}
                data-testid={`dependency-${index}`}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon size={16} className={style.text} />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{dep.from}</span>
                      <ArrowRight size={12} className="text-gray-400" />
                      <span>{dep.to}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {dep.impact}
                  </Badge>
                  <Badge className={cn("text-xs capitalize", style.text, style.bg)}>
                    {dep.status}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RealTimeGauges() {
  return (
    <Card data-testid="card-realtime-gauges">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity size={18} className="text-green-600" />
              Real-Time Status
            </CardTitle>
            <CardDescription>Live project health indicators</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {realTimeGauges.map((gauge, index) => {
            const isOverTarget = gauge.inverse 
              ? gauge.value > gauge.target 
              : gauge.value < gauge.target;
            const color = gauge.status === 'good' ? LG_TEAL : 
                         gauge.status === 'warning' ? LG_AMBER : LG_RED;
            
            return (
              <motion.div
                key={gauge.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`gauge-${gauge.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{gauge.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color }}>
                      {gauge.value}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Target: {gauge.target}%
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={gauge.value} className="h-2" />
                  <div 
                    className="absolute top-0 w-0.5 h-2 bg-gray-800"
                    style={{ left: `${gauge.target}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <Brain size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-800">AI Next Best Action</p>
              <p className="text-xs text-blue-700 mt-1">
                Focus on Cloud Migration risk mitigation. Scheduling review with TMO agent for dependency resolution.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EstimationCostIntelligence() {
  const varianceData = [
    { project: "Digital Platform", estimated: 2.4, actual: 2.8, variance: "+16.7%", status: "over" },
    { project: "Cloud Migration", estimated: 5.1, actual: 4.9, variance: "-3.9%", status: "under" },
    { project: "Customer Portal", estimated: 1.8, actual: 2.1, variance: "+16.7%", status: "over" },
    { project: "Data Analytics", estimated: 3.2, actual: 3.0, variance: "-6.3%", status: "under" }
  ];

  return (
    <Card data-testid="card-estimation-intelligence">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-600" />
              Estimation & Cost Intelligence
            </CardTitle>
            <CardDescription>AI-powered variance analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {varianceData.map((item, index) => (
            <div 
              key={item.project}
              className="flex items-center justify-between p-2 rounded-lg border bg-gray-50"
              data-testid={`variance-${index}`}
            >
              <div>
                <p className="text-sm font-medium">{item.project}</p>
                <p className="text-xs text-muted-foreground">
                  Est: £{item.estimated}M → Actual: £{item.actual}M
                </p>
              </div>
              <Badge className={cn(
                "text-xs",
                item.status === "over" 
                  ? "bg-red-100 text-red-700" 
                  : "bg-green-100 text-green-700"
              )}>
                {item.variance}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-start gap-2">
            <Brain size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">AI Variance Explanation</p>
              <p className="text-xs text-amber-700 mt-1">
                Digital Platform variance driven by scope additions (+12%) and resource rate increases (+5%). 
                Recommend baseline recalibration for Q2 estimates.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  onDrillDown?: (type: string, id: string) => void;
}

export function ProjectLifecycleCommandCenter({ onDrillDown }: Props = {}) {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  
  const handleChallengeClick = (challengeId: string) => {
    setSelectedChallenge(challengeId);
    if (onDrillDown) {
      onDrillDown('challenge', challengeId);
    }
  };
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target size={24} className="text-[#005EB8]" />
            Project Lifecycle Command Center
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Simulated Data</Badge>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Badge className="bg-green-100 text-green-700">VRO Intelligence Active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {challengeData.map((challenge) => (
          <ChallengeResponseTile 
            key={challenge.id} 
            challenge={challenge} 
            onClick={() => handleChallengeClick(challenge.id)}
          />
        ))}
      </div>

      <InnovationFunnel />

      <div className="grid md:grid-cols-3 gap-6">
        <EstimationCostIntelligence />
        <DependencyMap />
        <RealTimeGauges />
      </div>
    </motion.section>
  );
}
