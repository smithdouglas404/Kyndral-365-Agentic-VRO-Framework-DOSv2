import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Clock, Zap, Target, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useVroMetrics, usePmoMetrics } from "@/hooks/useVroMetrics";
import { AttributeStatusBadge } from "@/components/AttributeStatusBadge";
import { getAttributeMap, parseAttributeNumber, parseAttributeText, useAgentAttributes } from "@/hooks/useAgentAttributes";

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
  domain,
  onClick,
  availability
}: { 
  metric: { id: string; name: string; value: number | string | null; target: number; unit: string; trend?: string; source?: string };
  isPulsing?: boolean;
  domain: 'VRO' | 'PMO';
  onClick?: () => void;
  availability?: 'available' | 'admin_required' | 'mcp_required' | 'missing';
}) {
  const numericValue = typeof metric.value === 'number' ? metric.value : Number(metric.value);
  const hasNumber = Number.isFinite(numericValue);
  const progress = hasNumber ? Math.min(100, (numericValue / metric.target) * 100) : 0;
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
        `${domainColors.bg} ${domainColors.border} border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer`,
        isPulsing && `ring-2 ${domainColors.ring} ring-opacity-50`
      )}
      data-testid={`metric-card-${metric.id}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{metric.name}</span>
        {availability ? (
          <AttributeStatusBadge availability={availability} />
        ) : (
          <TrendIcon className={cn(
            "h-4 w-4",
            metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-amber-500' : 'text-gray-400'
          )} />
        )}
      </div>
      
      <div className="flex items-baseline gap-1 mb-2">
        <motion.span 
          className={cn("text-2xl font-bold", isOnTrack ? "text-green-600" : "text-amber-600")}
          animate={isPulsing ? { scale: [1, 1.1, 1] } : {}}
        >
          {metric.value === null || metric.value === undefined || (typeof metric.value === 'number' && !Number.isFinite(metric.value)) ? '--' : metric.value}
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

interface UnifiedMetricsSectionProps {
  onDrillDown?: (type: string, id: string) => void;
}

export function UnifiedMetricsSection({ onDrillDown }: UnifiedMetricsSectionProps) {
  const { data: vroMetricsData = [], isLoading: vroLoading } = useVroMetrics();
  const { data: pmoMetricsData = [], isLoading: pmoLoading } = usePmoMetrics();
  const { data: vroAttributes } = useAgentAttributes('vro');
  const { data: pmoAttributes } = useAgentAttributes('pmo');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!vroLoading && !pmoLoading) {
      setLastUpdated(new Date());
    }
  }, [vroLoading, pmoLoading, vroMetricsData, pmoMetricsData]);

  const vroMap = getAttributeMap(vroAttributes?.attributes || []);
  const pmoMap = getAttributeMap(pmoAttributes?.attributes || []);

  const vroMetricDefs = [
    { attr: 'valueScore', label: 'Strategic ROI', target: 85 },
    { attr: 'strategicAlignmentScore', label: 'Delivery Predictability', target: 90 },
    { attr: 'benefitsRealizationRate', label: 'OKR Achievement', target: 80 },
    { attr: 'business_value_score', label: 'Delivery Success Rate', target: 85 },
    { attr: 'time_to_value', label: 'Portfolio Velocity', target: 55 },
  ];

  const pmoMetricDefs = [
    { attr: 'cycle_time_avg', label: 'Cycle Time', target: 10 },
    { attr: 'flow_efficiency', label: 'Flow Efficiency', target: 50 },
    { attr: 'team_velocity_current', label: 'Throughput', target: 25 },
    { attr: 'wip_age', label: 'WIP Items', target: 8 },
  ];

  const vroMetrics = vroMetricDefs.map((def) => {
    const attr = vroMap[def.attr];
    const value = parseAttributeNumber(attr?.value) ?? parseAttributeText(attr?.value);
    return {
      id: def.attr,
      name: def.label,
      value,
      target: def.target,
      unit: attr?.unit || (def.attr === 'time_to_value' ? 'days' : '%'),
      trend: 'up' as const,
      source: attr?.displayName || 'VRO Analytics',
      availability: attr?.availability || 'missing',
    };
  });

  const pmoMetrics = pmoMetricDefs.map((def) => {
    const attr = pmoMap[def.attr];
    const value = parseAttributeNumber(attr?.value) ?? parseAttributeText(attr?.value);
    return {
      id: def.attr,
      name: def.label,
      value,
      target: def.target,
      unit: attr?.unit || (def.attr === 'cycle_time_avg' ? 'days' : '%'),
      trend: 'up' as const,
      source: attr?.displayName || 'PMO Analytics',
      availability: attr?.availability || 'missing',
    };
  });

  const displayPmoMetrics = pmoMetrics.length > 0 ? pmoMetrics : PMO_METRICS.map((metric) => ({
    ...metric,
    availability: 'missing' as const,
  }));

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
        <div className="flex items-center gap-2">
          {!vroLoading && !pmoLoading && (
            <span className="text-xs text-emerald-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              LIVE
            </span>
          )}
          <span className="text-xs text-gray-400">
            {vroLoading || pmoLoading
              ? 'Loading...'
              : `Updated: ${lastUpdated?.toLocaleTimeString() || '—'}`}
          </span>
        </div>
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
              return (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  isPulsing={false}
                  domain="VRO"
                  availability={metric.availability}
                  onClick={() => onDrillDown?.('metric', metric.id)}
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
            {displayPmoMetrics.map((metric) => {
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
                  isPulsing={false}
                  domain="PMO"
                  availability={'availability' in metric ? metric.availability : undefined}
                  onClick={() => onDrillDown?.('metric', metric.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
