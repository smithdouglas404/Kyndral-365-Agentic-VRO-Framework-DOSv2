import {
  Card,
  Metric,
  Text,
  Flex,
  Badge,
  BadgeDelta,
  ProgressBar,
  SparkAreaChart,
  Grid,
  Col,
  type Color,
} from '@tremor/react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type DeltaType = 'increase' | 'decrease' | 'unchanged' | 'moderateIncrease' | 'moderateDecrease';

export interface KPIData {
  title: string;
  value: string | number;
  previousValue?: string | number;
  delta?: number;
  deltaType?: DeltaType;
  target?: number;
  progress?: number;
  unit?: string;
  prefix?: string;
  suffix?: string;
  trend?: number[]; // Sparkline data
  status?: 'success' | 'warning' | 'error' | 'neutral';
  insight?: string;
  icon?: LucideIcon;
  color?: Color;
}

interface TremorKPICardProps {
  data: KPIData;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  showProgress?: boolean;
  showInsight?: boolean;
  onClick?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatValue(value: string | number, prefix?: string, suffix?: string): string {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString()
    : value;
  return `${prefix || ''}${formattedValue}${suffix || ''}`;
}

function getStatusColor(status?: KPIData['status']): Color {
  switch (status) {
    case 'success': return 'emerald';
    case 'warning': return 'amber';
    case 'error': return 'rose';
    default: return 'blue';
  }
}

function getStatusIcon(status?: KPIData['status']): LucideIcon {
  switch (status) {
    case 'success': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'error': return AlertTriangle;
    default: return Info;
  }
}

// ============================================================================
// Single KPI Card Component
// ============================================================================

export function TremorKPICard({
  data,
  size = 'md',
  showSparkline = false,
  showProgress = false,
  showInsight = false,
  onClick,
}: TremorKPICardProps) {
  const {
    title,
    value,
    previousValue,
    delta,
    deltaType,
    target,
    progress,
    prefix,
    suffix,
    trend,
    status,
    insight,
    icon: Icon,
    color,
  } = data;

  const statusColor = color || getStatusColor(status);
  const StatusIcon = getStatusIcon(status);

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-lg hover:border-tremor-brand'
      )}
      onClick={onClick}
    >
      <Flex justifyContent="between" alignItems="start">
        <div className="flex-1">
          <Flex alignItems="center" className="gap-2 mb-2">
            {Icon && (
              <div className={cn(
                'p-1.5 rounded-lg',
                `bg-${statusColor}-100 dark:bg-${statusColor}-900/30`
              )}>
                <Icon className={cn('h-4 w-4', `text-${statusColor}-600`)} />
              </div>
            )}
            <Text className="text-tremor-content-subtle font-medium">
              {title}
            </Text>
          </Flex>

          <Metric className={size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-3xl'}>
            {formatValue(value, prefix, suffix)}
          </Metric>

          {/* Delta Badge */}
          {delta !== undefined && (
            <Flex alignItems="center" className="mt-2 gap-2">
              <BadgeDelta
                deltaType={deltaType || (delta >= 0 ? 'increase' : 'decrease')}
                size="sm"
              >
                {delta > 0 ? '+' : ''}{delta}%
              </BadgeDelta>
              {previousValue !== undefined && (
                <Text className="text-xs text-tremor-content-subtle">
                  from {formatValue(previousValue, prefix, suffix)}
                </Text>
              )}
            </Flex>
          )}
        </div>

        {/* Sparkline */}
        {showSparkline && trend && trend.length > 0 && (
          <div className="w-24 h-12">
            <SparkAreaChart
              data={trend.map((v, i) => ({ index: i, value: v }))}
              categories={['value']}
              index="index"
              colors={[statusColor]}
              className="h-full w-full"
            />
          </div>
        )}
      </Flex>

      {/* Progress Bar */}
      {showProgress && progress !== undefined && (
        <div className="mt-4">
          <Flex justifyContent="between" className="mb-1">
            <Text className="text-xs text-tremor-content-subtle">Progress</Text>
            <Text className="text-xs font-medium">{progress}%</Text>
          </Flex>
          <ProgressBar value={progress} color={statusColor} />
          {target && (
            <Text className="text-xs text-tremor-content-subtle mt-1">
              Target: {formatValue(target, prefix, suffix)}
            </Text>
          )}
        </div>
      )}

      {/* Insight */}
      {showInsight && insight && (
        <div className="mt-4 p-2 rounded-lg bg-tremor-background-subtle">
          <Flex alignItems="start" className="gap-2">
            <StatusIcon className={cn('h-4 w-4 mt-0.5 shrink-0', `text-${statusColor}-500`)} />
            <Text className="text-xs text-tremor-content">
              {insight}
            </Text>
          </Flex>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// KPI Grid Component (Multiple KPIs)
// ============================================================================

interface TremorKPIGridProps {
  kpis: KPIData[];
  columns?: 2 | 3 | 4;
  showSparklines?: boolean;
  onKPIClick?: (kpi: KPIData) => void;
}

export function TremorKPIGrid({
  kpis,
  columns = 4,
  showSparklines = true,
  onKPIClick,
}: TremorKPIGridProps) {
  const numItemsProps = {
    numItemsSm: 1,
    numItemsMd: Math.min(columns, 2),
    numItemsLg: columns,
  };

  return (
    <Grid {...numItemsProps} className="gap-4">
      {kpis.map((kpi, index) => (
        <Col key={index}>
          <TremorKPICard
            data={kpi}
            size="md"
            showSparkline={showSparklines}
            onClick={onKPIClick ? () => onKPIClick(kpi) : undefined}
          />
        </Col>
      ))}
    </Grid>
  );
}

// ============================================================================
// Quick Stats Row Component
// ============================================================================

interface QuickStat {
  label: string;
  value: string | number;
  delta?: number;
  color?: Color;
}

interface TremorQuickStatsProps {
  stats: QuickStat[];
}

export function TremorQuickStats({ stats }: TremorQuickStatsProps) {
  return (
    <Card>
      <Flex justifyContent="between" className="flex-wrap gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <Text className="text-tremor-content-subtle text-xs uppercase tracking-wide">
              {stat.label}
            </Text>
            <Flex justifyContent="center" alignItems="baseline" className="gap-2 mt-1">
              <Metric className="text-2xl">{stat.value}</Metric>
              {stat.delta !== undefined && (
                <BadgeDelta
                  deltaType={stat.delta >= 0 ? 'increase' : 'decrease'}
                  size="xs"
                >
                  {stat.delta > 0 ? '+' : ''}{stat.delta}%
                </BadgeDelta>
              )}
            </Flex>
          </div>
        ))}
      </Flex>
    </Card>
  );
}

export default TremorKPICard;
