import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp, Calculator, Target, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulation } from '@/lib/liveSimulationEngine';
import type { VROAggregatedMetric } from '@/lib/unifiedMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface VROMetricCardProps {
  metric: VROAggregatedMetric;
  index: number;
}

export function VROMetricCard({ metric, index }: VROMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { state } = useSimulation();
  
  const isPulsing = state.pulsingMetrics.includes(`vro-${metric.id}`);
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
          isPulsing && "ring-2 ring-blue-400 ring-opacity-50",
          isExpanded && "shadow-lg"
        )}
        data-testid={`vro-metric-card-${metric.id}`}
      >
        {isPulsing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-blue-400 pointer-events-none"
          />
        )}
        
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.name}
                </CardTitle>
                <motion.div 
                  className="flex items-baseline gap-2 mt-1"
                  animate={isPulsing ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
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
                </motion.div>
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
                                    ? `£${item.value.toLocaleString()}m` 
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
                          <span className="text-sm font-semibold text-gray-700">Source OKRs</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {metric.sourceOKRs.map(okrId => (
                            <Badge key={okrId} variant="secondary" className="text-xs">
                              {okrId}
                            </Badge>
                          ))}
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
