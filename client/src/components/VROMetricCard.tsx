import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp, Calculator, Target, Layers, ChevronRight, FileText, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
// Simulation engine removed
import type { VROAggregatedMetric, TraceableMetricBreakdown } from '@/lib/unifiedMetrics';
import { getFullTraceabilityChain, OKRS } from '@/lib/unifiedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TraceabilityItemProps {
  item: TraceableMetricBreakdown | null;
  okrName: string;
  depth?: number;
}

function TraceabilityItem({ item, okrName, depth = 0 }: TraceabilityItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!item) {
    return (
      <div className="text-xs text-gray-400 italic pl-4">
        No traceability data available
      </div>
    );
  }
  
  const levelColors = {
    okr: 'bg-purple-50 border-purple-200 text-purple-700',
    kr: 'bg-blue-50 border-blue-200 text-blue-700',
    kpi: 'bg-green-50 border-green-200 text-green-700',
    project: 'bg-amber-50 border-amber-200 text-amber-700'
  };
  
  const levelIcons = {
    okr: Target,
    kr: BarChart3,
    kpi: TrendingUp,
    project: FileText
  };
  
  const Icon = levelIcons[item.level];
  const hasChildren = item.children && item.children.length > 0;
  
  return (
    <div className={cn("rounded-lg border", depth === 0 ? "p-2" : "p-1.5 ml-3 mt-1", levelColors[item.level])}>
      <button
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 text-left"
        disabled={!hasChildren}
        data-testid={`trace-${item.level}-${item.id}`}
      >
        {hasChildren && (
          <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
        )}
        <Icon className="h-3 w-3" />
        <span className={cn("text-xs font-medium flex-1 truncate", depth === 0 ? "font-semibold" : "")}>
          {depth === 0 ? okrName : item.name}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {item.level === 'project' ? `${item.value}% complete` : `${Math.round(item.value)}%`}
        </Badge>
      </button>
      
      {isOpen && hasChildren && (
        <div className="mt-1">
          {item.children!.map((child, idx) => (
            <TraceabilityItem 
              key={child.id || idx} 
              item={child} 
              okrName={child.name}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface VROMetricCardProps {
  metric: VROAggregatedMetric;
  index: number;
}

export function VROMetricCard({ metric, index }: VROMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const progressPercent = Math.min(100, (metric.currentValue / metric.targetValue) * 100);
  const isOnTarget = metric.currentValue >= metric.targetValue * 0.9;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          isExpanded && "shadow-lg"
        )}
        data-testid={`vro-metric-card-${metric.id}`}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.name}
                </CardTitle>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={cn(
                    "text-3xl font-bold",
                    isOnTarget ? "text-green-600" : "text-amber-600"
                  )}>
                    {metric.currentValue}
                  </span>
                  <span className="text-lg text-gray-400">{metric.unit}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      isOnTarget ? "border-green-300 text-green-600" : "border-amber-300 text-amber-600"
                    )}
                  >
                    Target: {metric.targetValue}{metric.unit}
                  </Badge>
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CollapsibleTrigger asChild>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        data-testid={`button-expand-${metric.id}`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Info className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to see how this is calculated</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Progress 
              value={progressPercent} 
              className="h-2 mt-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {metric.lastUpdated.toLocaleTimeString()}
            </p>
          </CardHeader>
          
          <CollapsibleContent>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <CardContent className="pt-0 border-t border-gray-100 mt-2">
                    <div className="space-y-4 py-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">How is this calculated?</span>
                        </div>
                        <p className="text-sm text-blue-800 font-mono bg-white rounded px-2 py-1">
                          {metric.calculationFormula}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-700">Value Breakdown</span>
                        </div>
                        <div className="space-y-2">
                          {metric.breakdown.map((item, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                            >
                              <span className="text-sm text-gray-700">{item.source}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-900">
                                  {typeof item.value === 'number' && item.value > 100 
                                    ? `$${item.value.toLocaleString()}m` 
                                    : item.value}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {item.contribution}%
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-700">Full Traceability Chain</span>
                        </div>
                        <div className="space-y-2">
                          {metric.sourceOKRs.map(okrId => {
                            const okr = OKRS.find(o => o.id === okrId);
                            const traceChain = getFullTraceabilityChain(okrId);
                            return (
                              <TraceabilityItem 
                                key={okrId} 
                                item={traceChain}
                                okrName={okr?.objective || okrId}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

interface VROMetricsGridProps {
  metrics: VROAggregatedMetric[];
}

export function VROMetricsGrid({ metrics }: VROMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {metrics.map((metric, idx) => (
        <VROMetricCard key={metric.id} metric={metric} index={idx} />
      ))}
    </div>
  );
}
