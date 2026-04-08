/**
 * Insight Overlay Components
 *
 * Provides various ways to display AI insights within widgets:
 * - Badge overlays (corner indicators)
 * - Inline callouts
 * - Footer summaries
 * - Tooltip previews
 */

import { useState, type ReactNode } from 'react';
import {
  Callout,
  Badge,
  Text,
  Flex,
  type Color,
} from '@tremor/react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  ChevronRight,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Insight, InsightSeverity } from '@/components/tremor-widgets';

// ============================================================================
// Types
// ============================================================================

export type InsightPlacement = 'badge' | 'inline' | 'footer' | 'tooltip' | 'banner';

interface InsightOverlayProps {
  insights: Insight[];
  placement?: InsightPlacement;
  maxVisible?: number;
  onDismiss?: (id: string) => void;
  onViewAll?: () => void;
  onAction?: (insightId: string, actionIndex: number) => void;
  className?: string;
}

// ============================================================================
// Severity Config
// ============================================================================

const severityConfig: Record<InsightSeverity, {
  color: Color;
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
}> = {
  error: {
    color: 'rose',
    icon: AlertTriangle,
    bgClass: 'bg-rose-100 dark:bg-rose-900/30',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  warning: {
    color: 'amber',
    icon: AlertTriangle,
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  success: {
    color: 'emerald',
    icon: CheckCircle,
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  ai: {
    color: 'violet',
    icon: Sparkles,
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    textClass: 'text-violet-700 dark:text-violet-300',
  },
  info: {
    color: 'blue',
    icon: Info,
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
};

// ============================================================================
// Badge Overlay
// ============================================================================

interface InsightBadgeProps {
  insights: Insight[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showCount?: boolean;
  onClick?: () => void;
}

export function InsightBadge({
  insights,
  position = 'top-right',
  showCount = true,
  onClick,
}: InsightBadgeProps) {
  if (insights.length === 0) return null;

  // Get highest severity
  const highestSeverity = insights.reduce((highest, insight) => {
    const severityOrder: InsightSeverity[] = ['info', 'success', 'ai', 'warning', 'error'];
    const currentIndex = severityOrder.indexOf(insight.severity);
    const highestIndex = severityOrder.indexOf(highest);
    return currentIndex > highestIndex ? insight.severity : highest;
  }, 'info' as InsightSeverity);

  const config = severityConfig[highestSeverity];
  const Icon = config.icon;

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'absolute z-10 flex items-center gap-1 px-2 py-1 rounded-full',
            'transition-all hover:scale-105 cursor-pointer',
            config.bgClass,
            positionClasses[position]
          )}
          onClick={onClick}
        >
          <Icon className={cn('h-3 w-3', config.textClass)} />
          {showCount && insights.length > 1 && (
            <span className={cn('text-xs font-medium', config.textClass)}>
              {insights.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-tremor-border">
          <Flex justifyContent="between" alignItems="center">
            <Text className="font-medium">Insights</Text>
            <Badge color={config.color} size="xs">
              {insights.length} active
            </Badge>
          </Flex>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-tremor-border">
          {insights.slice(0, 5).map((insight) => (
            <InsightPreviewItem key={insight.id} insight={insight} />
          ))}
        </div>
        {insights.length > 5 && (
          <div className="p-2 border-t border-tremor-border">
            <Button variant="ghost" size="sm" className="w-full">
              View all {insights.length} insights
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Insight Preview Item
// ============================================================================

function InsightPreviewItem({ insight }: { insight: Insight }) {
  const config = severityConfig[insight.severity];
  const Icon = config.icon;

  return (
    <div className="p-3 hover:bg-tremor-background-subtle transition-colors">
      <Flex alignItems="start" className="gap-2">
        <div className={cn('p-1 rounded', config.bgClass)}>
          <Icon className={cn('h-3 w-3', config.textClass)} />
        </div>
        <div className="flex-1 min-w-0">
          <Text className="text-sm font-medium truncate">{insight.title}</Text>
          <Text className="text-xs text-tremor-content-subtle line-clamp-2">
            {insight.description}
          </Text>
          {insight.timestamp && (
            <Text className="text-xs text-tremor-content-subtle mt-1">
              {insight.timestamp}
            </Text>
          )}
        </div>
      </Flex>
    </div>
  );
}

// ============================================================================
// Inline Insight
// ============================================================================

interface InlineInsightProps {
  insight: Insight;
  onDismiss?: () => void;
  onAction?: (actionIndex: number) => void;
  compact?: boolean;
}

export function InlineInsight({
  insight,
  onDismiss,
  onAction,
  compact = false,
}: InlineInsightProps) {
  const config = severityConfig[insight.severity];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        config.bgClass
      )}>
        <Icon className={cn('h-4 w-4 shrink-0', config.textClass)} />
        <Text className={cn('text-sm flex-1', config.textClass)}>
          {insight.title}
        </Text>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn('hover:opacity-70', config.textClass)}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Callout
      title={insight.title}
      icon={Icon}
      color={config.color}
      className="relative"
    >
      <Text className="text-sm">{insight.description}</Text>

      {insight.actions && insight.actions.length > 0 && (
        <Flex className="gap-2 mt-2">
          {insight.actions.map((action, idx) => (
            <Button
              key={idx}
              variant={idx === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onAction?.(idx)}
            >
              {action.label}
            </Button>
          ))}
        </Flex>
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-tremor-content-subtle hover:text-tremor-content"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Callout>
  );
}

// ============================================================================
// Footer Insight Summary
// ============================================================================

interface InsightFooterProps {
  insights: Insight[];
  onViewAll?: () => void;
}

export function InsightFooter({ insights, onViewAll }: InsightFooterProps) {
  if (insights.length === 0) return null;

  // Group by severity
  const grouped = insights.reduce((acc, insight) => {
    acc[insight.severity] = (acc[insight.severity] || 0) + 1;
    return acc;
  }, {} as Record<InsightSeverity, number>);

  const entries = Object.entries(grouped) as [InsightSeverity, number][];

  return (
    <div className="px-4 py-2 border-t border-tremor-border bg-tremor-background-subtle">
      <Flex justifyContent="between" alignItems="center">
        <Flex className="gap-3">
          {entries.map(([severity, count]) => {
            const config = severityConfig[severity];
            const Icon = config.icon;
            return (
              <TooltipProvider key={severity}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Flex alignItems="center" className="gap-1">
                      <Icon className={cn('h-3 w-3', config.textClass)} />
                      <Text className="text-xs">{count}</Text>
                    </Flex>
                  </TooltipTrigger>
                  <TooltipContent>
                    {count} {severity} insight{count !== 1 ? 's' : ''}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </Flex>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </Flex>
    </div>
  );
}

// ============================================================================
// Banner Insight
// ============================================================================

interface InsightBannerProps {
  insight: Insight;
  onDismiss?: () => void;
  onAction?: (actionIndex: number) => void;
}

export function InsightBanner({ insight, onDismiss, onAction }: InsightBannerProps) {
  const config = severityConfig[insight.severity];
  const Icon = config.icon;

  return (
    <div className={cn(
      'w-full px-4 py-3 flex items-center gap-3',
      config.bgClass
    )}>
      <Icon className={cn('h-5 w-5 shrink-0', config.textClass)} />
      <div className="flex-1 min-w-0">
        <Text className={cn('font-medium', config.textClass)}>
          {insight.title}
        </Text>
        <Text className={cn('text-sm opacity-90', config.textClass)}>
          {insight.description}
        </Text>
      </div>
      <Flex className="gap-2 shrink-0">
        {insight.actions?.map((action, idx) => (
          <Button
            key={idx}
            variant={idx === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => onAction?.(idx)}
          >
            {action.label}
          </Button>
        ))}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </Flex>
    </div>
  );
}

// ============================================================================
// Main Overlay Component
// ============================================================================

export function InsightOverlay({
  insights,
  placement = 'badge',
  maxVisible = 3,
  onDismiss,
  onViewAll,
  onAction,
  className,
}: InsightOverlayProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleInsights = insights
    .filter(i => !dismissed.has(i.id))
    .slice(0, maxVisible);

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    onDismiss?.(id);
  };

  if (visibleInsights.length === 0) return null;

  switch (placement) {
    case 'badge':
      return (
        <InsightBadge
          insights={visibleInsights}
          onClick={onViewAll}
        />
      );

    case 'inline':
      return (
        <div className={cn('space-y-2', className)}>
          {visibleInsights.map((insight) => (
            <InlineInsight
              key={insight.id}
              insight={insight}
              onDismiss={() => handleDismiss(insight.id)}
              onAction={(idx) => onAction?.(insight.id, idx)}
            />
          ))}
        </div>
      );

    case 'footer':
      return (
        <InsightFooter
          insights={visibleInsights}
          onViewAll={onViewAll}
        />
      );

    case 'banner':
      return (
        <div className={cn('space-y-1', className)}>
          {visibleInsights.map((insight) => (
            <InsightBanner
              key={insight.id}
              insight={insight}
              onDismiss={() => handleDismiss(insight.id)}
              onAction={(idx) => onAction?.(insight.id, idx)}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ============================================================================
// Widget Wrapper with Insights
// ============================================================================

interface WidgetWithInsightsProps {
  children: ReactNode;
  insights: Insight[];
  insightPlacement?: InsightPlacement;
  onInsightDismiss?: (id: string) => void;
  onInsightAction?: (insightId: string, actionIndex: number) => void;
  className?: string;
}

export function WidgetWithInsights({
  children,
  insights,
  insightPlacement = 'badge',
  onInsightDismiss,
  onInsightAction,
  className,
}: WidgetWithInsightsProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Badge placement */}
      {insightPlacement === 'badge' && (
        <InsightOverlay
          insights={insights}
          placement="badge"
          onDismiss={onInsightDismiss}
          onAction={onInsightAction}
        />
      )}

      {/* Banner placement (before content) */}
      {insightPlacement === 'banner' && (
        <InsightOverlay
          insights={insights}
          placement="banner"
          maxVisible={1}
          onDismiss={onInsightDismiss}
          onAction={onInsightAction}
        />
      )}

      {/* Main content */}
      {children}

      {/* Inline placement (after content) */}
      {insightPlacement === 'inline' && (
        <div className="p-4 border-t border-tremor-border">
          <InsightOverlay
            insights={insights}
            placement="inline"
            onDismiss={onInsightDismiss}
            onAction={onInsightAction}
          />
        </div>
      )}

      {/* Footer placement */}
      {insightPlacement === 'footer' && (
        <InsightOverlay
          insights={insights}
          placement="footer"
          onDismiss={onInsightDismiss}
          onAction={onInsightAction}
        />
      )}
    </div>
  );
}

export default InsightOverlay;
