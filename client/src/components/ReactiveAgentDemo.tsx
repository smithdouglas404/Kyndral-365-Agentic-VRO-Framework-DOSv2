import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  AlertTriangle, 
  Zap, 
  TrendingDown, 
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Bot,
  Database,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";

interface MetricSimulator {
  id: string;
  name: string;
  currentValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  direction: 'above' | 'below';
  unit: string;
  agent: string;
}

const DEMO_METRICS: MetricSimulator[] = [
  {
    id: 'schedule-performance',
    name: 'Schedule Performance Index',
    currentValue: 0.98,
    warningThreshold: 0.95,
    criticalThreshold: 0.85,
    direction: 'below',
    unit: 'SPI',
    agent: 'TMO Agent'
  },
  {
    id: 'cost-performance',
    name: 'Cost Performance Index',
    currentValue: 0.94,
    warningThreshold: 0.92,
    criticalThreshold: 0.80,
    direction: 'below',
    unit: 'CPI',
    agent: 'FinOps Agent'
  },
  {
    id: 'okr-progress',
    name: 'OKR Progress Rate',
    currentValue: 0.75,
    warningThreshold: 0.70,
    criticalThreshold: 0.50,
    direction: 'below',
    unit: '%',
    agent: 'OKR Agent'
  },
  {
    id: 'change-adoption',
    name: 'Change Adoption Rate',
    currentValue: 0.72,
    warningThreshold: 0.65,
    criticalThreshold: 0.45,
    direction: 'below',
    unit: '%',
    agent: 'OCM Agent'
  },
  {
    id: 'sprint-velocity',
    name: 'Sprint Velocity Variance',
    currentValue: 8,
    warningThreshold: 15,
    criticalThreshold: 25,
    direction: 'above',
    unit: '%',
    agent: 'Planning Agent'
  }
];

export function ReactiveAgentDemo() {
  const [metrics, setMetrics] = useState<MetricSimulator[]>(DEMO_METRICS);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [simulatingMetrics, setSimulatingMetrics] = useState<Set<string>>(new Set());
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await apiRequest('POST', '/api/demo/reset', {});
      setMetrics(DEMO_METRICS);
      setSimulationLog([`[${new Date().toLocaleTimeString()}] Demo reset - ALL interventions cleared!`]);
    } catch (error) {
      setSimulationLog(prev => [`[${new Date().toLocaleTimeString()}] Reset failed`, ...prev]);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await apiRequest('POST', '/api/demo/seed', {});
      setSimulationLog(prev => [`[${new Date().toLocaleTimeString()}] Demo seeded with [AUTONOMOUS] examples!`, ...prev]);
    } catch (error) {
      setSimulationLog(prev => [`[${new Date().toLocaleTimeString()}] Seed failed`, ...prev]);
    } finally {
      setIsSeeding(false);
    }
  };

  const getStatus = (metric: MetricSimulator): 'ok' | 'warning' | 'critical' => {
    if (metric.direction === 'below') {
      if (metric.currentValue < metric.criticalThreshold) return 'critical';
      if (metric.currentValue < metric.warningThreshold) return 'warning';
    } else {
      if (metric.currentValue > metric.criticalThreshold) return 'critical';
      if (metric.currentValue > metric.warningThreshold) return 'warning';
    }
    return 'ok';
  };

  const handleSliderChange = (metricId: string, value: number) => {
    setMetrics(prev => prev.map(m => 
      m.id === metricId ? { ...m, currentValue: value } : m
    ));
  };

  const handleTriggerSimulation = async (metric: MetricSimulator) => {
    if (simulatingMetrics.has(metric.id)) return;
    
    setSimulatingMetrics(prev => new Set(prev).add(metric.id));
    
    const timestamp = new Date().toLocaleTimeString();
    const displayValue = metric.unit === '%' || metric.id.includes('progress') || metric.id.includes('adoption')
      ? `${(metric.currentValue * 100).toFixed(1)}%`
      : metric.currentValue.toFixed(2);
    
    setSimulationLog(prev => [
      `[${timestamp}] Sending ${metric.name} = ${displayValue} to database...`,
      ...prev.slice(0, 9)
    ]);
    
    const metricKeyMap: Record<string, string> = {
      'schedule-performance': 'spi',
      'cost-performance': 'cpi',
      'okr-progress': 'okr_progress',
      'change-adoption': 'change_adoption',
      'sprint-velocity': 'sprint_velocity'
    };
    
    try {
      const response = await apiRequest('POST', '/api/metrics/update', {
        projectId: 'proj-reactive-demo',
        projectName: 'Reactive Agent Demo Project',
        metricKey: metricKeyMap[metric.id] || metric.id,
        value: metric.id === 'sprint-velocity' ? metric.currentValue / 100 : metric.currentValue
      });
      
      const result = await response.json();
      
      if (result.intervention) {
        setSimulationLog(prev => [
          `[${new Date().toLocaleTimeString()}] BREACH DETECTED! ${metric.agent} created intervention in database.`,
          ...prev.slice(0, 9)
        ]);
        
        if (result.autonomousAction) {
          setTimeout(() => {
            setSimulationLog(prev => [
              `[${new Date().toLocaleTimeString()}] Autonomous action executed! Check floating alerts.`,
              ...prev.slice(0, 9)
            ]);
          }, 500);
        }
      } else {
        setSimulationLog(prev => [
          `[${new Date().toLocaleTimeString()}] Metric stored. Within acceptable range - no intervention.`,
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error) {
      setSimulationLog(prev => [
        `[${new Date().toLocaleTimeString()}] Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setSimulatingMetrics(prev => {
        const next = new Set(prev);
        next.delete(metric.id);
        return next;
      });
    }
  };

  const handleTriggerAll = () => {
    const metricsSnapshot = [...metrics];
    metricsSnapshot.forEach((metric, index) => {
      setTimeout(() => handleTriggerSimulation(metric), index * 800);
    });
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-purple-600" />
          Reactive Agent Demo
          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-300">
            <Database className="h-3 w-3 mr-1" />
            Database-Backed
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Adjust metrics below threshold to trigger agent interventions. Watch the Command Center and floating alerts!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {metrics.map((metric) => {
            const status = getStatus(metric);
            return (
              <div 
                key={metric.id} 
                className={`p-3 rounded-lg border ${
                  status === 'critical' ? 'bg-red-50 border-red-200' :
                  status === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-white border-gray-200'
                }`}
                data-testid={`metric-simulator-${metric.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{metric.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {metric.agent}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'critical' && <XCircle className="h-4 w-4 text-red-500" />}
                    {status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {status === 'ok' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    <span className={`font-bold text-lg ${
                      status === 'critical' ? 'text-red-600' :
                      status === 'warning' ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {metric.id === 'sprint-velocity' 
                        ? `${metric.currentValue.toFixed(0)}%`
                        : metric.currentValue.toFixed(2)
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Slider
                    value={[metric.currentValue]}
                    onValueChange={([v]) => handleSliderChange(metric.id, v)}
                    min={metric.id === 'sprint-velocity' ? 0 : 0.3}
                    max={metric.id === 'sprint-velocity' ? 35 : 1.1}
                    step={metric.id === 'sprint-velocity' ? 1 : 0.01}
                    className="flex-1"
                    data-testid={`slider-${metric.id}`}
                  />
                  <Button
                    size="sm"
                    variant={status !== 'ok' ? 'destructive' : 'outline'}
                    onClick={() => handleTriggerSimulation(metric)}
                    disabled={simulatingMetrics.has(metric.id)}
                    className="min-w-[80px]"
                    data-testid={`trigger-${metric.id}`}
                  >
                    {simulatingMetrics.has(metric.id) ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        Trigger
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Critical: {metric.criticalThreshold}</span>
                  <span>Warning: {metric.warningThreshold}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleResetDemo} 
            variant="outline"
            disabled={isResetting}
            data-testid="button-reset-demo"
          >
            {isResetting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </>
            )}
          </Button>
          <Button 
            onClick={handleSeedDemo} 
            variant="outline"
            disabled={isSeeding}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
            data-testid="button-seed-demo"
          >
            {isSeeding ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Seed Demo
              </>
            )}
          </Button>
          <Button 
            onClick={handleTriggerAll} 
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            disabled={simulatingMetrics.size > 0}
            data-testid="button-trigger-all"
          >
            <Play className="h-4 w-4 mr-2" />
            Trigger All Metrics
          </Button>
        </div>
        
        {simulationLog.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-xs text-gray-400 mb-2 font-mono">Simulation Log:</p>
            <AnimatePresence>
              {simulationLog.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs font-mono ${
                    log.includes('CRITICAL') ? 'text-red-400' :
                    log.includes('WARNING') ? 'text-amber-400' :
                    log.includes('intervention') ? 'text-green-400' :
                    'text-gray-300'
                  }`}
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Activity className="h-3 w-3" />
          <span>Drag sliders below thresholds, then click Trigger to see reactive agent behavior</span>
        </div>
      </CardContent>
    </Card>
  );
}
