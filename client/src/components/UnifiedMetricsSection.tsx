import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Clock, Zap, Target, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSimulation } from "@/lib/liveSimulationEngine";
import { cn } from "@/lib/utils";

interface PMOMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  source: string;
  year2024: string;
  year2026: string;
}

const PMO_METRICS: PMOMetric[] = [
  {
    id: 'cycle-time',
    name: 'Cycle Time',
    value: 19,
    target: 10,
    unit: 'days',
    trend: 'down',
    source: 'PMO Flow Metrics',
    year2024: '35 days',
    year2026: '10 days'
  },
  {
    id: 'flow-efficiency',
    name: 'Flow Efficiency',
    value: 69,
    target: 50,
    unit: '%',
    trend: 'up',
    source: 'Lean/Agile Metrics',
    year2024: '45%',
    year2026: '50%'
  },
  {
    id: 'throughput',
    name: 'Throughput',
    value: 11,
    target: 25,
    unit: 'items/week',
    trend: 'up',
    source: 'Sprint Analytics',
    year2024: '8 items/week',
    year2026: '25 items/week'
  },
  {
    id: 'wip-items',
    name: 'WIP Items',
    value: 9,
    target: 8,
    unit: '/12',
    trend: 'down',
    source: 'Kanban Board',
    year2024: '12 items',
    year2026: '8 items'
  }
];

function MetricCard({ 
  metric, 
  isPulsing = false,
  domain
}: { 
  metric: { id: string; name: string; value: number; target: number; unit: string; trend?: string; source?: string };
  isPulsing?: boolean;
  domain: 'VRO' | 'PMO';
}) {
  const progress = Math.min(100, (metric.value / metric.target) * 100);
  const isOnTrack = progress >= 90;
  const trendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Activity;
  const TrendIcon = trendIcon;
  
  const domainColors = domain === 'VRO' 
    ? { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-600', ring: 'ring-blue-400' }
    : { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-600', ring: 'ring-purple-400' };
  
  return (
    <motion.div
      animate={isPulsing ? { 
        scale: [1, 1.02, 1], 
        backgroundColor: domain === 'VRO' 
          ? ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)']
          : ['rgba(147, 51, 234, 0)', 'rgba(147, 51, 234, 0.1)', 'rgba(147, 51, 234, 0)']
      } : {}}
      transition={{ duration: 0.5 }}
      className={cn(
        `${domainColors.bg} ${domainColors.border} border rounded-lg p-4 transition-all hover:shadow-md`,
        isPulsing && `ring-2 ${domainColors.ring} ring-opacity-50`
      )}
      data-testid={`metric-card-${metric.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{metric.name}</span>
        <TrendIcon className={cn(
          "h-4 w-4",
          metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-amber-500' : 'text-gray-400'
        )} />
      </div>
      
      <div className="flex items-baseline gap-1 mb-2">
        <motion.span 
          className={cn("text-2xl font-bold", isOnTrack ? "text-green-600" : "text-amber-600")}
          animate={isPulsing ? { scale: [1, 1.1, 1] } : {}}
        >
          {metric.value}
        </motion.span>
        <span className="text-sm text-gray-500">{metric.unit}</span>
      </div>
      
      <Progress 
        value={progress} 
        className={cn("h-1.5", domain === 'VRO' ? '[&>div]:bg-blue-500' : '[&>div]:bg-purple-500')}
      />
      
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Target: {metric.target}{metric.unit}</span>
        <span className="text-[10px] text-gray-400">{Math.round(progress)}%</span>
      </div>
      
      {metric.source && (
        <div className="mt-1">
          <span className={cn("text-[10px] font-medium", domainColors.accent)}>{metric.source}</span>
        </div>
      )}
    </motion.div>
  );
}

export function UnifiedMetricsSection() {
  const { state } = useSimulation();
  const vroMetrics = state.vroMetrics;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-gray-600">VRO Metrics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm font-medium text-gray-600">PMO Metrics</span>
          </div>
        </div>
        {state.isLive && (
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600 font-medium">LIVE</span>
            </motion.div>
            <span className="text-xs text-gray-400">Updated: {state.lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-800">Value Realization (VRO)</h3>
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
              Strategic Outcomes
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {vroMetrics.map((metric) => {
              const isPulsing = state.pulsingMetrics.includes(`vro-${metric.id}`);
              return (
                <MetricCard 
                  key={metric.id}
                  metric={{
                    id: metric.id,
                    name: metric.name,
                    value: metric.currentValue,
                    target: metric.targetValue,
                    unit: metric.unit,
                    trend: 'up',
                    source: 'VRO Analytics'
                  }}
                  isPulsing={isPulsing}
                  domain="VRO"
                />
              );
            })}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-200">
            <Clock className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-purple-800">Delivery Execution (PMO)</h3>
            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
              Flow Metrics
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PMO_METRICS.map((metric) => {
              const isPulsing = state.pulsingMetrics.includes(`pmo-${metric.id}`);
              return (
                <MetricCard 
                  key={metric.id}
                  metric={{
                    id: metric.id,
                    name: metric.name,
                    value: metric.value,
                    target: metric.target,
                    unit: metric.unit,
                    trend: metric.trend,
                    source: metric.source
                  }}
                  isPulsing={isPulsing}
                  domain="PMO"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
