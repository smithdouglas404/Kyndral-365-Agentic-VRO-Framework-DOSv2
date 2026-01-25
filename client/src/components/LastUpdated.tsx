import { useEffect, useState } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/**
 * LAST UPDATED COMPONENT
 *
 * Shows when data was last refreshed with optional manual refresh button.
 * Auto-updates the timestamp every minute.
 */

interface LastUpdatedProps {
  timestamp: Date | string | number;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function LastUpdated({
  timestamp,
  onRefresh,
  isRefreshing = false,
  label = 'Last updated',
  showIcon = true,
  className,
}: LastUpdatedProps) {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    const updateRelativeTime = () => {
      try {
        const date = typeof timestamp === 'string' || typeof timestamp === 'number'
          ? new Date(timestamp)
          : timestamp;

        if (isNaN(date.getTime())) {
          setRelativeTime('Invalid date');
          return;
        }

        const timeAgo = formatDistanceToNow(date, { addSuffix: true });
        setRelativeTime(timeAgo);
      } catch (error) {
        setRelativeTime('Unknown');
      }
    };

    updateRelativeTime();

    // Update every minute
    const interval = setInterval(updateRelativeTime, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      await onRefresh();
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      {showIcon && <Clock className="h-3 w-3" />}
      <span>
        {label} {relativeTime}
      </span>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
        </Button>
      )}
    </div>
  );
}

/**
 * Compact version for tight spaces (just the time, no label)
 */
export function LastUpdatedCompact({ timestamp, className }: Pick<LastUpdatedProps, 'timestamp' | 'className'>) {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    const updateRelativeTime = () => {
      try {
        const date = typeof timestamp === 'string' || typeof timestamp === 'number'
          ? new Date(timestamp)
          : timestamp;

        if (isNaN(date.getTime())) {
          setRelativeTime('Invalid');
          return;
        }

        const timeAgo = formatDistanceToNow(date, { addSuffix: true });
        setRelativeTime(timeAgo);
      } catch (error) {
        setRelativeTime('Unknown');
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {relativeTime}
    </span>
  );
}

/**
 * Badge version for headers/cards
 */
export function LastUpdatedBadge({ timestamp, onRefresh, isRefreshing, className }: LastUpdatedProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs',
        className
      )}
    >
      <LastUpdated
        timestamp={timestamp}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        showIcon={true}
        className="text-muted-foreground"
      />
    </div>
  );
}
