import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useUnifiedNotifications } from '@/contexts/UnifiedNotificationContext';
import { AlertsFlyout } from '@/components/AlertsFlyout';
import { cn } from '@/lib/utils';

/**
 * GLOBAL NOTIFICATION BELL
 *
 * Single notification icon visible on ALL pages.
 * Replaces the fragmented notification systems.
 *
 * Features:
 * - Unified badge count (all notification sources)
 * - Pulsing animation for critical alerts
 * - Opens AlertsFlyout with all notifications
 * - Always visible in header
 */

interface GlobalNotificationBellProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'minimal';
}

export function GlobalNotificationBell({
  className,
  variant = 'ghost'
}: GlobalNotificationBellProps) {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const { unreadCount, criticalCount, isConnected } = useUnifiedNotifications();

  const hasCritical = criticalCount > 0;
  const hasUnread = unreadCount > 0;

  return (
    <>
      <Button
        variant={variant}
        size="icon"
        className={cn('relative', className)}
        onClick={() => setIsFlyoutOpen(true)}
        data-testid="global-notification-bell"
        aria-label={`Notifications ${hasUnread ? `(${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        <motion.div
          animate={hasCritical ? {
            rotate: [0, -10, 10, -10, 10, 0],
          } : {}}
          transition={{
            duration: 0.5,
            repeat: hasCritical ? Infinity : 0,
            repeatDelay: 3,
          }}
        >
          <Bell
            className={cn(
              'h-5 w-5',
              hasCritical && 'text-red-500',
              hasUnread && !hasCritical && 'text-blue-500'
            )}
          />
        </motion.div>

        {/* Unread Badge */}
        {hasUnread && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Badge
              variant={hasCritical ? 'destructive' : 'default'}
              className={cn(
                'h-5 min-w-[20px] px-1 text-[10px] font-bold flex items-center justify-center',
                hasCritical && 'bg-red-500 hover:bg-red-600'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </motion.div>
        )}

        {/* Critical Pulse Animation */}
        {hasCritical && (
          <motion.span
            className="absolute inset-0 rounded-full bg-red-500"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{
              opacity: [0.6, 0],
              scale: [1, 1.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
        )}

        {/* Connection Status Indicator */}
        {!isConnected && (
          <span
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-orange-500 border border-white"
            title="Reconnecting..."
          />
        )}
      </Button>

      {/* AlertsFlyout - Now actually wired up! */}
      <AlertsFlyout
        isOpen={isFlyoutOpen}
        onClose={() => setIsFlyoutOpen(false)}
      />
    </>
  );
}

/**
 * Mini variant for compact spaces
 */
export function GlobalNotificationBellMini() {
  return (
    <GlobalNotificationBell
      variant="minimal"
      className="h-8 w-8"
    />
  );
}
