import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulation, type DataChange } from '@/lib/liveSimulationEngine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function LiveToggle() {
  const { state, toggleLive } = useSimulation();
  
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <Switch
          checked={state.isLive}
          onCheckedChange={toggleLive}
          data-testid="toggle-live-mode"
        />
        <span className="text-sm font-medium text-gray-700">Live Mode</span>
      </div>
      
      {state.isLive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-2 h-2 rounded-full bg-green-500"
          />
          <span className="text-xs text-green-600 font-medium">LIVE</span>
        </motion.div>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {state.lastUpdate.toLocaleTimeString()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last updated: {state.lastUpdate.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Updates: {state.updateCount}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function LiveActivityFeed() {
  const { state } = useSimulation();
  
  if (!state.isLive || state.recentChanges.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-900">Live Activity</span>
        <Badge variant="outline" className="text-xs bg-white">
          {state.recentChanges.length} recent changes
        </Badge>
      </div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        <AnimatePresence>
          {state.recentChanges.slice(0, 5).map((change, idx) => (
            <motion.div
              key={change.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1"
            >
              {change.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className="text-gray-700 truncate flex-1">
                <span className="font-medium">{change.entityName}</span>
                <span className="text-gray-400"> • </span>
                {change.field}
              </span>
              <span className={cn(
                "font-mono",
                change.trend === 'up' ? "text-green-600" : "text-red-600"
              )}>
                {change.oldValue.toFixed(1)} → {change.newValue.toFixed(1)}
              </span>
              <span className="text-gray-400">
                {change.timestamp.toLocaleTimeString()}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface PulsingValueProps {
  value: number | string;
  isPulsing: boolean;
  unit?: string;
  className?: string;
  trend?: 'up' | 'down' | 'stable';
}

export function PulsingValue({ value, isPulsing, unit = '', className, trend }: PulsingValueProps) {
  return (
    <motion.span
      animate={isPulsing ? {
        scale: [1, 1.1, 1],
        backgroundColor: ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0)']
      } : {}}
      transition={{ duration: 0.5 }}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1",
        isPulsing && "ring-2 ring-blue-400 ring-opacity-50",
        className
      )}
    >
      {value}{unit}
      {trend && isPulsing && (
        <motion.span
          initial={{ opacity: 0, y: trend === 'up' ? 5 : -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : trend === 'down' ? (
            <TrendingDown className="h-3 w-3 text-red-500" />
          ) : null}
        </motion.span>
      )}
    </motion.span>
  );
}

export function LiveStatusBar() {
  const { state, forceUpdate } = useSimulation();
  
  return (
    <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-4">
        <LiveToggle />
        
        {state.isLive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-gray-600">
              Real-time simulation running • {state.updateCount} updates
            </span>
          </motion.div>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={forceUpdate}
        className="gap-1"
        data-testid="button-force-update"
      >
        <Activity className="h-3 w-3" />
        Simulate Update
      </Button>
    </div>
  );
}
