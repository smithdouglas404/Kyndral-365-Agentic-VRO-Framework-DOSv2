import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AlertBubbleProps {
  count?: number;
  severity?: 'critical' | 'warning';
  pulse?: boolean;
  className?: string;
  onClick?: () => void;
  tooltip?: string;
}

export function AlertBubble({ 
  count, 
  severity = 'critical', 
  pulse = true, 
  className,
  onClick,
  tooltip
}: AlertBubbleProps) {
  const bgColor = severity === 'warning' ? 'bg-amber-500' : 'bg-red-500';
  const pingColor = severity === 'warning' ? 'bg-amber-400' : 'bg-red-400';
  
  const defaultTooltip = severity === 'warning' 
    ? `${count || 'Active'} alert${count !== 1 ? 's' : ''} need attention. Click card for details.`
    : `${count || 'Critical'} issue${count !== 1 ? 's' : ''} require immediate action. Click card for details.`;
  
  const baseClasses = cn(
    "absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold cursor-pointer z-10",
    bgColor,
    count && count > 0 ? 'min-w-[18px] h-[18px] px-1' : 'w-3 h-3',
    className
  );

  const bubble = (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={baseClasses}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      data-testid="alert-bubble"
    >
      {pulse && (
        <span className={cn("absolute inset-0 rounded-full animate-ping opacity-75", pingColor)} />
      )}
      {count && count > 0 && (
        <span className="relative z-10">{count > 99 ? '99+' : count}</span>
      )}
    </motion.div>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {bubble}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{tooltip || defaultTooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface TroubleBadgeProps {
  issues: number;
  alerts: number;
  onClick?: () => void;
}

export function TroubleBadge({ issues, alerts, onClick }: TroubleBadgeProps) {
  const total = issues + alerts;
  if (total === 0) return null;

  return (
    <AlertBubble 
      count={total} 
      severity="critical" 
      onClick={onClick}
    />
  );
}
