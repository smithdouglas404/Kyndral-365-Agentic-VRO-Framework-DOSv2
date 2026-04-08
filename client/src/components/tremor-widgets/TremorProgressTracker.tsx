import {
  Card,
  Title,
  Text,
  Tracker,
  Flex,
  Badge,
  ProgressBar,
  type Color,
} from '@tremor/react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TrackerItem {
  color: Color;
  tooltip?: string;
}

export interface TrackerConfig {
  title: string;
  subtitle?: string;
  data: TrackerItem[];
  showLegend?: boolean;
  legendItems?: { color: Color; label: string }[];
}

interface TremorProgressTrackerProps {
  config: TrackerConfig;
  className?: string;
}

// ============================================================================
// Status Tracker Component
// ============================================================================

export function TremorProgressTracker({
  config,
  className,
}: TremorProgressTrackerProps) {
  const { title, subtitle, data, showLegend = true, legendItems } = config;

  // Calculate color distribution
  const colorCounts = data.reduce((acc, item) => {
    acc[item.color] = (acc[item.color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const defaultLegend: { color: Color; label: string }[] = [
    { color: 'emerald', label: 'Completed' },
    { color: 'amber', label: 'In Progress' },
    { color: 'rose', label: 'At Risk' },
    { color: 'gray', label: 'Not Started' },
  ];

  const legend = legendItems || defaultLegend;

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-4">
        <Title>{title}</Title>
        {subtitle && (
          <Text className="text-tremor-content-subtle mt-1">{subtitle}</Text>
        )}
      </div>

      <Tracker data={data} className="h-2" />

      {showLegend && (
        <Flex className="mt-4 flex-wrap gap-4">
          {legend
            .filter((item) => colorCounts[item.color])
            .map((item) => (
              <Flex key={item.color} className="gap-2" alignItems="center">
                <div
                  className={cn('w-3 h-3 rounded-sm', `bg-${item.color}-500`)}
                />
                <Text className="text-sm">
                  {item.label}
                  <span className="text-tremor-content-subtle ml-1">
                    ({colorCounts[item.color]})
                  </span>
                </Text>
              </Flex>
            ))}
        </Flex>
      )}
    </Card>
  );
}

// ============================================================================
// Milestone Tracker
// ============================================================================

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'completed' | 'in_progress' | 'upcoming' | 'overdue';
  progress?: number;
}

interface TremorMilestoneTrackerProps {
  title: string;
  milestones: Milestone[];
  className?: string;
}

export function TremorMilestoneTracker({
  title,
  milestones,
  className,
}: TremorMilestoneTrackerProps) {
  const getStatusConfig = (
    status: Milestone['status']
  ): { color: Color; icon: LucideIcon; label: string } => {
    switch (status) {
      case 'completed':
        return { color: 'emerald', icon: CheckCircle, label: 'Completed' };
      case 'in_progress':
        return { color: 'blue', icon: Clock, label: 'In Progress' };
      case 'overdue':
        return { color: 'rose', icon: AlertTriangle, label: 'Overdue' };
      default:
        return { color: 'gray', icon: Clock, label: 'Upcoming' };
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      <Title className="mb-4">{title}</Title>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const { color, icon: Icon, label } = getStatusConfig(milestone.status);
          const isLast = index === milestones.length - 1;

          return (
            <div key={milestone.id} className="relative">
              {/* Timeline connector */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-3 top-8 w-0.5 h-full -mb-4',
                    milestone.status === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-tremor-border'
                  )}
                />
              )}

              <Flex alignItems="start" className="gap-3">
                {/* Status Icon */}
                <div
                  className={cn(
                    'p-1.5 rounded-full shrink-0 z-10',
                    `bg-${color}-100 dark:bg-${color}-900/30`
                  )}
                >
                  <Icon className={cn('h-4 w-4', `text-${color}-600`)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Flex justifyContent="between" alignItems="start">
                    <div>
                      <Text className="font-medium">{milestone.name}</Text>
                      <Text className="text-xs text-tremor-content-subtle">
                        Due: {milestone.dueDate}
                      </Text>
                    </div>
                    <Badge color={color} size="xs">
                      {label}
                    </Badge>
                  </Flex>

                  {/* Progress bar for in-progress milestones */}
                  {milestone.status === 'in_progress' &&
                    milestone.progress !== undefined && (
                      <div className="mt-2">
                        <ProgressBar
                          value={milestone.progress}
                          color={color}
                          className="h-1"
                        />
                        <Text className="text-xs text-tremor-content-subtle mt-1">
                          {milestone.progress}% complete
                        </Text>
                      </div>
                    )}
                </div>
              </Flex>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================================
// Sprint/Iteration Progress
// ============================================================================

interface SprintProgressProps {
  title: string;
  currentSprint: string;
  daysRemaining: number;
  totalDays: number;
  metrics: {
    label: string;
    completed: number;
    total: number;
    color?: Color;
  }[];
}

export function TremorSprintProgress({
  title,
  currentSprint,
  daysRemaining,
  totalDays,
  metrics,
}: SprintProgressProps) {
  const daysProgress = ((totalDays - daysRemaining) / totalDays) * 100;

  return (
    <Card className="p-6">
      <Flex justifyContent="between" alignItems="start" className="mb-4">
        <div>
          <Title>{title}</Title>
          <Text className="text-tremor-content-subtle">{currentSprint}</Text>
        </div>
        <Badge color={daysRemaining <= 2 ? 'rose' : daysRemaining <= 5 ? 'amber' : 'blue'}>
          {daysRemaining} days left
        </Badge>
      </Flex>

      {/* Days Progress */}
      <div className="mb-4">
        <Flex justifyContent="between" className="mb-1">
          <Text className="text-sm">Sprint Progress</Text>
          <Text className="text-sm font-medium">
            Day {totalDays - daysRemaining} of {totalDays}
          </Text>
        </Flex>
        <ProgressBar value={daysProgress} color="blue" />
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {metrics.map((metric) => {
          const progress = (metric.completed / metric.total) * 100;
          return (
            <div key={metric.label}>
              <Flex justifyContent="between" className="mb-1">
                <Text className="text-sm">{metric.label}</Text>
                <Text className="text-sm font-medium">
                  {metric.completed}/{metric.total}
                </Text>
              </Flex>
              <ProgressBar
                value={progress}
                color={metric.color || 'emerald'}
                className="h-1.5"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================================
// Health Score Tracker
// ============================================================================

interface HealthScoreProps {
  title: string;
  scores: {
    category: string;
    score: number;
    maxScore?: number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  overallScore?: number;
}

export function TremorHealthScore({ title, scores, overallScore }: HealthScoreProps) {
  const getScoreColor = (score: number, max: number = 100): Color => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'emerald';
    if (percentage >= 60) return 'amber';
    return 'rose';
  };

  const calculatedOverall =
    overallScore ??
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  return (
    <Card className="p-6">
      <Flex justifyContent="between" alignItems="start" className="mb-4">
        <Title>{title}</Title>
        <div className="text-right">
          <Text className="text-3xl font-bold">{calculatedOverall.toFixed(0)}</Text>
          <Badge color={getScoreColor(calculatedOverall)} size="xs">
            {calculatedOverall >= 80
              ? 'Healthy'
              : calculatedOverall >= 60
              ? 'Needs Attention'
              : 'At Risk'}
          </Badge>
        </div>
      </Flex>

      <div className="space-y-3">
        {scores.map((item) => {
          const maxScore = item.maxScore || 100;
          const color = getScoreColor(item.score, maxScore);

          return (
            <div key={item.category}>
              <Flex justifyContent="between" className="mb-1">
                <Flex className="gap-2" alignItems="center">
                  <Text className="text-sm">{item.category}</Text>
                  {item.trend && (
                    <Badge
                      color={item.trend === 'up' ? 'emerald' : item.trend === 'down' ? 'rose' : 'gray'}
                      size="xs"
                    >
                      {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                    </Badge>
                  )}
                </Flex>
                <Text className="text-sm font-medium">
                  {item.score}/{maxScore}
                </Text>
              </Flex>
              <ProgressBar value={(item.score / maxScore) * 100} color={color} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================================
// Week/Day Tracker Grid
// ============================================================================

interface DayTrackerProps {
  title: string;
  weeks: {
    label?: string;
    days: {
      date: string;
      status: 'success' | 'warning' | 'error' | 'neutral' | 'empty';
      value?: number;
    }[];
  }[];
}

export function TremorDayTracker({ title, weeks }: DayTrackerProps) {
  const getStatusColor = (status: string): Color => {
    switch (status) {
      case 'success': return 'emerald';
      case 'warning': return 'amber';
      case 'error': return 'rose';
      case 'neutral': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Card className="p-6">
      <Title className="mb-4">{title}</Title>

      <div className="space-y-1">
        {weeks.map((week, weekIdx) => (
          <Flex key={weekIdx} className="gap-1">
            {week.label && (
              <Text className="text-xs w-8 text-tremor-content-subtle">
                {week.label}
              </Text>
            )}
            {week.days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  'w-4 h-4 rounded-sm transition-colors',
                  day.status === 'empty'
                    ? 'bg-tremor-background-subtle'
                    : `bg-${getStatusColor(day.status)}-500`
                )}
                title={`${day.date}${day.value !== undefined ? `: ${day.value}` : ''}`}
              />
            ))}
          </Flex>
        ))}
      </div>

      {/* Legend */}
      <Flex className="mt-4 gap-4">
        <Flex className="gap-1" alignItems="center">
          <div className="w-3 h-3 rounded-sm bg-tremor-background-subtle" />
          <Text className="text-xs">No data</Text>
        </Flex>
        <Flex className="gap-1" alignItems="center">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <Text className="text-xs">On track</Text>
        </Flex>
        <Flex className="gap-1" alignItems="center">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <Text className="text-xs">Warning</Text>
        </Flex>
        <Flex className="gap-1" alignItems="center">
          <div className="w-3 h-3 rounded-sm bg-rose-500" />
          <Text className="text-xs">Issue</Text>
        </Flex>
      </Flex>
    </Card>
  );
}

export default TremorProgressTracker;
