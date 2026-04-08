import { useState } from 'react';
import {
  Card,
  Callout,
  Title,
  Text,
  Flex,
  Badge,
  type Color,
} from '@tremor/react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type InsightSeverity = 'info' | 'success' | 'warning' | 'error' | 'ai';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  source?: string;
  timestamp?: string;
  actions?: {
    label: string;
    onClick?: () => void;
    variant?: 'default' | 'outline';
  }[];
  details?: string;
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down';
  }[];
}

interface TremorInsightCalloutProps {
  insight: Insight;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getSeverityConfig = (
  severity: InsightSeverity
): { color: Color; icon: LucideIcon } => {
  switch (severity) {
    case 'success':
      return { color: 'emerald', icon: CheckCircle };
    case 'warning':
      return { color: 'amber', icon: AlertTriangle };
    case 'error':
      return { color: 'rose', icon: XCircle };
    case 'ai':
      return { color: 'violet', icon: Sparkles };
    default:
      return { color: 'blue', icon: Info };
  }
};

// ============================================================================
// Single Insight Callout
// ============================================================================

export function TremorInsightCallout({
  insight,
  dismissible = false,
  onDismiss,
  className,
}: TremorInsightCalloutProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { color, icon: Icon } = getSeverityConfig(insight.severity);

  return (
    <Callout
      title={insight.title}
      icon={Icon}
      color={color}
      className={cn('relative', className)}
    >
      <div className="space-y-3">
        <Text>{insight.description}</Text>

        {/* Metrics */}
        {insight.metrics && insight.metrics.length > 0 && (
          <Flex className="gap-4 mt-3">
            {insight.metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <Text className="text-xs text-tremor-content-subtle uppercase">
                  {metric.label}
                </Text>
                <Flex className="gap-1" justifyContent="center" alignItems="center">
                  <Text className="text-lg font-semibold">{metric.value}</Text>
                  {metric.trend && (
                    metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )
                  )}
                </Flex>
              </div>
            ))}
          </Flex>
        )}

        {/* Details (expandable) */}
        {insight.details && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-tremor-content-subtle hover:text-tremor-content"
            >
              {showDetails ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
            {showDetails && (
              <Text className="mt-2 text-sm bg-tremor-background-subtle p-2 rounded">
                {insight.details}
              </Text>
            )}
          </div>
        )}

        {/* Actions */}
        {insight.actions && insight.actions.length > 0 && (
          <Flex className="gap-2 mt-3">
            {insight.actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || (idx === 0 ? 'default' : 'outline')}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Flex>
        )}

        {/* Source & Timestamp */}
        {(insight.source || insight.timestamp) && (
          <Flex className="gap-2 mt-2" justifyContent="end">
            {insight.source && (
              <Badge color="gray" size="xs">
                {insight.source}
              </Badge>
            )}
            {insight.timestamp && (
              <Text className="text-xs text-tremor-content-subtle">
                {insight.timestamp}
              </Text>
            )}
          </Flex>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-tremor-content-subtle hover:text-tremor-content"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </Callout>
  );
}

// ============================================================================
// AI Recommendation Card
// ============================================================================

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  category?: string;
  reasoning?: string;
  actions?: {
    label: string;
    onClick?: () => void;
  }[];
}

interface TremorAIRecommendationProps {
  recommendation: AIRecommendation;
  onAccept?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function TremorAIRecommendation({
  recommendation,
  onAccept,
  onDismiss,
  className,
}: TremorAIRecommendationProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  const impactColors: Record<string, Color> = {
    high: 'rose',
    medium: 'amber',
    low: 'blue',
  };

  return (
    <Card className={cn('p-4', className)}>
      <Flex alignItems="start" className="gap-3">
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 shrink-0">
          <Sparkles className="h-5 w-5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <Flex justifyContent="between" alignItems="start">
            <div>
              <Text className="font-semibold">{recommendation.title}</Text>
              {recommendation.category && (
                <Badge color="gray" size="xs" className="mt-1">
                  {recommendation.category}
                </Badge>
              )}
            </div>
            <Flex className="gap-2 shrink-0">
              <Badge color={impactColors[recommendation.impact]} size="xs">
                {recommendation.impact} impact
              </Badge>
              <Badge color="violet" size="xs">
                {recommendation.confidence}% confident
              </Badge>
            </Flex>
          </Flex>

          <Text className="mt-2 text-sm text-tremor-content">
            {recommendation.description}
          </Text>

          {/* Reasoning */}
          {recommendation.reasoning && (
            <div className="mt-3">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
              >
                <Lightbulb className="h-3 w-3" />
                {showReasoning ? 'Hide reasoning' : 'See reasoning'}
              </button>
              {showReasoning && (
                <Text className="mt-2 text-xs bg-violet-50 dark:bg-violet-900/20 p-2 rounded text-tremor-content-subtle">
                  {recommendation.reasoning}
                </Text>
              )}
            </div>
          )}

          {/* Actions */}
          <Flex className="gap-2 mt-3">
            {recommendation.actions?.map((action, idx) => (
              <Button key={idx} variant="outline" size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
            {onAccept && (
              <Button size="sm" onClick={onAccept}>
                Accept
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </Flex>
        </div>
      </Flex>
    </Card>
  );
}

// ============================================================================
// Insights Feed
// ============================================================================

interface TremorInsightsFeedProps {
  title: string;
  insights: Insight[];
  maxItems?: number;
  onSeeAll?: () => void;
  className?: string;
}

export function TremorInsightsFeed({
  title,
  insights,
  maxItems = 5,
  onSeeAll,
  className,
}: TremorInsightsFeedProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleInsights = insights
    .filter((i) => !dismissed.has(i.id))
    .slice(0, maxItems);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <Card className={cn('p-6', className)}>
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Title>{title}</Title>
        {onSeeAll && insights.length > maxItems && (
          <Button variant="ghost" size="sm" onClick={onSeeAll}>
            See all ({insights.length})
          </Button>
        )}
      </Flex>

      <div className="space-y-3">
        {visibleInsights.length === 0 ? (
          <Text className="text-center py-4 text-tremor-content-subtle">
            No active insights
          </Text>
        ) : (
          visibleInsights.map((insight) => (
            <TremorInsightCallout
              key={insight.id}
              insight={insight}
              dismissible
              onDismiss={() => handleDismiss(insight.id)}
            />
          ))
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Quick Insight Badges
// ============================================================================

interface QuickInsight {
  id: string;
  label: string;
  icon?: LucideIcon;
  color?: Color;
  onClick?: () => void;
}

interface TremorQuickInsightsProps {
  insights: QuickInsight[];
  className?: string;
}

export function TremorQuickInsights({
  insights,
  className,
}: TremorQuickInsightsProps) {
  return (
    <Flex className={cn('gap-2 flex-wrap', className)}>
      {insights.map((insight) => {
        const Icon = insight.icon || Zap;
        return (
          <Badge
            key={insight.id}
            color={insight.color || 'blue'}
            size="sm"
            className={cn(
              'gap-1',
              insight.onClick && 'cursor-pointer hover:opacity-80'
            )}
            onClick={insight.onClick}
          >
            <Icon className="h-3 w-3" />
            {insight.label}
          </Badge>
        );
      })}
    </Flex>
  );
}

// ============================================================================
// Goal/Target Card
// ============================================================================

interface GoalCardProps {
  title: string;
  currentValue: number;
  targetValue: number;
  unit?: string;
  deadline?: string;
  insights?: string[];
  color?: Color;
}

export function TremorGoalCard({
  title,
  currentValue,
  targetValue,
  unit = '',
  deadline,
  insights,
  color = 'blue',
}: GoalCardProps) {
  const progress = (currentValue / targetValue) * 100;
  const isOnTrack = progress >= 75;

  return (
    <Card className="p-6">
      <Flex alignItems="start" className="gap-3">
        <div className={cn('p-2 rounded-lg', `bg-${color}-100 dark:bg-${color}-900/30`)}>
          <Target className={cn('h-5 w-5', `text-${color}-600`)} />
        </div>
        <div className="flex-1">
          <Flex justifyContent="between" alignItems="start">
            <Text className="font-semibold">{title}</Text>
            <Badge color={isOnTrack ? 'emerald' : 'amber'} size="xs">
              {isOnTrack ? 'On Track' : 'Behind'}
            </Badge>
          </Flex>

          <Flex alignItems="baseline" className="gap-1 mt-2">
            <Text className="text-3xl font-bold">{currentValue.toLocaleString()}</Text>
            <Text className="text-tremor-content-subtle">
              / {targetValue.toLocaleString()} {unit}
            </Text>
          </Flex>

          {deadline && (
            <Text className="text-xs text-tremor-content-subtle mt-1">
              Due: {deadline}
            </Text>
          )}

          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full bg-tremor-background-subtle overflow-hidden">
            <div
              className={cn('h-full rounded-full', `bg-${color}-500`)}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="mt-3 space-y-1">
              {insights.map((insight, idx) => (
                <Flex key={idx} alignItems="start" className="gap-2">
                  <Lightbulb className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                  <Text className="text-xs text-tremor-content-subtle">
                    {insight}
                  </Text>
                </Flex>
              ))}
            </div>
          )}
        </div>
      </Flex>
    </Card>
  );
}

export default TremorInsightCallout;
