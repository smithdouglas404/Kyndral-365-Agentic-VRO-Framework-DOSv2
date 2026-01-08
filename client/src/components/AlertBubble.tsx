import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AlertBubbleProps {
  count?: number;
  severity?: 'warning' | 'critical';
  pulse?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AlertBubble({ 
  count, 
  severity = 'warning', 
  pulse = true, 
  className,
  onClick 
}: AlertBubbleProps) {
  const baseClasses = cn(
    "absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold cursor-pointer z-10",
    severity === 'critical' ? 'bg-red-500' : 'bg-amber-500',
    count && count > 0 ? 'min-w-[18px] h-[18px] px-1' : 'w-3 h-3',
    className
  );

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={baseClasses}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      data-testid="alert-bubble"
    >
      {pulse && (
        <span className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-75",
          severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'
        )} />
      )}
      {count && count > 0 && (
        <span className="relative z-10">{count > 99 ? '99+' : count}</span>
      )}
    </motion.div>
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

  const severity = alerts > 0 ? 'critical' : 'warning';

  return (
    <AlertBubble 
      count={total} 
      severity={severity} 
      onClick={onClick}
    />
  );
}
