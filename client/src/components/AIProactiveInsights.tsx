import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { proactiveAlerts, aiMonitoringValue, ProactiveAlert } from "@/lib/scenarios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Search, 
  Brain,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  ShieldCheck,
  Activity,
  Eye,
  EyeOff,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const LG_BLUE = "#005EB8";
const LG_TEAL = "#00843D";

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
};

const typeIcons: Record<string, React.ElementType> = {
  anomaly: AlertTriangle,
  prediction: TrendingUp,
  threshold: Activity,
  risk: ShieldCheck
};

const capabilityIcons: Record<string, React.ElementType> = {
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  "layers": Layers,
  "search": Search,
  "brain": Brain
};

function AlertCard({ alert, isNew }: { alert: ProactiveAlert; isNew?: boolean }) {
  const colors = severityColors[alert.severity];
  const Icon = typeIcons[alert.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "p-4 rounded-lg border-l-4 transition-all",
        colors.bg,
        colors.border,
        isNew && "ring-2 ring-offset-1 ring-blue-400"
      )}
      data-testid={`alert-${alert.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full", colors.bg)}>
          <Icon size={18} className={colors.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-semibold", colors.text)}>{alert.title}</span>
            {isNew && (
              <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 animate-pulse">NEW</Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px]", colors.text, colors.border)}>
              {alert.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">VRO Detection:</span>
              <span className="ml-1 font-medium text-green-600">{alert.timeToDetect}</span>
            </div>
            <div>
              <span className="text-muted-foreground">PMO Detection:</span>
              <span className="ml-1 font-medium text-red-500">{alert.pmoDetectTime}</span>
            </div>
          </div>
          
          <div className="mt-2 p-2 bg-white/50 rounded text-xs">
            <span className="font-medium">Predicted Impact:</span> {alert.predictedImpact}
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <Badge className="bg-green-100 text-green-700 text-xs">
              Value Protected: {alert.valueSaved}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{alert.detectedAt}</span>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => window.alert(`View Insights: Detailed analysis for ${alert.title} - showing risk factors, timeline, and recommended actions`)}
              data-testid={`button-view-insights-${alert.id}`}
            >
              <Eye size={12} className="mr-1" />
              View Insights
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => window.alert(`Trigger Automation: Initiating automated response workflow for ${alert.title} - notifying stakeholders and creating mitigation tasks`)}
              data-testid={`button-trigger-automation-${alert.id}`}
            >
              <Zap size={12} className="mr-1" />
              Trigger Automation
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReactiveVsProactiveComparison() {
  const { reactive, proactive } = aiMonitoringValue.reactiveVsProactive;
  
  const metrics = [
    { label: "Detection Time", reactive: reactive.detectionTime, proactive: proactive.detectionTime },
    { label: "Response Time", reactive: reactive.responseTime, proactive: proactive.responseTime },
    { label: "Issue Visibility", reactive: reactive.issueVisibility, proactive: proactive.issueVisibility },
    { label: "Value at Risk", reactive: reactive.valueAtRisk, proactive: proactive.valueAtRisk }
  ];
  
  return (
    <Card className="bg-card" data-testid="card-reactive-vs-proactive">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap size={18} className="text-amber-500" />
          Reactive vs Proactive Monitoring
        </CardTitle>
        <CardDescription>Why VRO AI Insights outperform traditional PMO</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div></div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <EyeOff size={14} className="text-gray-400" />
              <span className="font-medium text-gray-500">PMO</span>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Eye size={14} className="text-[#005EB8]" />
              <span className="font-medium text-[#005EB8]">VRO</span>
            </div>
          </div>
          
          {metrics.map((m, i) => (
            <div key={i} className="contents">
              <div className="py-2 font-medium text-muted-foreground">{m.label}</div>
              <div className="py-2 text-center text-red-500 bg-red-50 rounded">{m.reactive}</div>
              <div className="py-2 text-center text-green-600 bg-green-50 rounded font-medium">{m.proactive}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IndustryStatsCard() {
  return (
    <Card className="bg-card" data-testid="card-ai-industry-stats">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp size={18} className="text-[#00843D]" />
          AI Monitoring ROI
        </CardTitle>
        <CardDescription>Industry-validated benefits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {aiMonitoringValue.industryStats.map((stat, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="text-xl font-bold text-[#005EB8] min-w-[60px]">{stat.stat}</div>
              <div className="flex-1">
                <p className="text-sm">{stat.description}</p>
                <p className="text-[10px] text-muted-foreground">{stat.source}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CapabilitiesCard() {
  return (
    <Card className="bg-card" data-testid="card-ai-capabilities">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain size={18} className="text-purple-600" />
          AI Capabilities
        </CardTitle>
        <CardDescription>Intelligent monitoring features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {aiMonitoringValue.capabilities.map((cap, i) => {
            const Icon = capabilityIcons[cap.icon] || Activity;
            return (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <Icon size={16} className="text-[#005EB8]" />
                <div>
                  <p className="text-sm font-medium">{cap.name}</p>
                  <p className="text-xs text-muted-foreground">{cap.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveAlertsFeed() {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>(proactiveAlerts);
  const [newAlertId, setNewAlertId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      const randomAlert = proactiveAlerts[Math.floor(Math.random() * proactiveAlerts.length)];
      const updatedAlert = {
        ...randomAlert,
        id: `ALERT-${Date.now()}`,
        detectedAt: "Just now"
      };
      
      setNewAlertId(updatedAlert.id);
      setAlerts(prev => [updatedAlert, ...prev.slice(0, 3)]);
      
      setTimeout(() => setNewAlertId(null), 3000);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isLive]);
  
  const activeAlerts = alerts.filter(a => a.status === "active").length;
  
  return (
    <Card className="bg-card" data-testid="card-live-alerts">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BellRing size={18} className="text-[#005EB8]" />
              Live AI Alerts
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>Real-time proactive monitoring</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeAlerts} Active
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={cn(isLive ? "text-green-600" : "text-gray-400")}
              data-testid="button-toggle-live-alerts"
            >
              {isLive ? "LIVE" : "PAUSED"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {alerts.slice(0, 4).map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                isNew={alert.id === newAlertId}
              />
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function ValueSummaryBanner() {
  // Only sum monetary values (using the dedicated numeric field)
  const totalValueProtected = proactiveAlerts.reduce((sum, a) => {
    return sum + (a.valueSavedMillions || 0);
  }, 0);
  
  return (
    <div className="bg-gradient-to-r from-[#005EB8] to-[#00843D] rounded-lg p-4 text-white" data-testid="banner-value-summary">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-full">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Proactive Value Protection</h3>
            <p className="text-white/80 text-sm">AI-powered early warning system identifying risks before they become issues</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">£{totalValueProtected}m+</div>
          <p className="text-white/80 text-sm">Value at risk identified & protected</p>
          <div className="mt-2 flex gap-2 justify-end">
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 text-white text-xs"
              onClick={() => alert('Share Report: Generating comprehensive AI insights report with all detected risks, value protected, and trend analysis for executive stakeholders')}
              data-testid="button-share-report"
            >
              <ArrowRight size={12} className="mr-1" />
              Share Report
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 text-white text-xs"
              onClick={() => alert('View All Alerts: Opening full alert dashboard with filtering, sorting, and detailed drill-down capabilities')}
              data-testid="button-view-all-alerts"
            >
              <Eye size={12} className="mr-1" />
              View All Alerts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIProactiveInsightsSection() {
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
            <Brain className="text-[#005EB8]" />
            AI Proactive Insights
          </h2>
          <p className="text-muted-foreground">Shifting from reactive reporting to predictive value protection</p>
        </div>
        <Badge variant="outline" className="text-xs">
          VRO Differentiator
        </Badge>
      </div>

      <ValueSummaryBanner />

      <LiveAlertsFeed />
    </motion.section>
  );
}
