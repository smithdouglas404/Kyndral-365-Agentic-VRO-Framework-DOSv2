import { useState, useMemo } from 'react';
import {
  Card,
  Title,
  Text,
  AreaChart,
  Flex,
  Select,
  SelectItem,
  Badge,
  type Color,
} from '@tremor/react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TimeSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface AreaChartConfig {
  title: string;
  subtitle?: string;
  data: TimeSeriesDataPoint[];
  categories: string[];
  index: string;
  colors?: Color[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  curveType?: 'linear' | 'natural' | 'monotone' | 'step';
  stack?: boolean;
  connectNulls?: boolean;
  insight?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
  };
}

interface TremorAreaChartProps {
  config: AreaChartConfig;
  timeRanges?: { label: string; value: string }[];
  onTimeRangeChange?: (range: string) => void;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const defaultValueFormatter = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const heightClasses = {
  sm: 'h-48',
  md: 'h-72',
  lg: 'h-96',
};

// ============================================================================
// Component
// ============================================================================

export function TremorAreaChart({
  config,
  timeRanges,
  onTimeRangeChange,
  height = 'md',
  className,
}: TremorAreaChartProps) {
  const [selectedRange, setSelectedRange] = useState(timeRanges?.[0]?.value || '30d');

  const {
    title,
    subtitle,
    data,
    categories,
    index,
    colors = ['blue', 'emerald', 'amber'],
    valueFormatter = defaultValueFormatter,
    showLegend = true,
    showGridLines = true,
    showAnimation = true,
    curveType = 'natural',
    stack = false,
    connectNulls = true,
    insight,
  } = config;

  // Calculate trend from data
  const trend = useMemo(() => {
    if (data.length < 2 || categories.length === 0) return null;
    const firstCategory = categories[0];
    const firstValue = data[0][firstCategory] as number;
    const lastValue = data[data.length - 1][firstCategory] as number;
    if (firstValue === 0) return null;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    return {
      value: change,
      direction: change >= 0 ? 'up' : 'down',
    };
  }, [data, categories]);

  const handleRangeChange = (value: string) => {
    setSelectedRange(value);
    onTimeRangeChange?.(value);
  };

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <Flex justifyContent="between" alignItems="start" className="mb-4">
        <div>
          <Flex alignItems="center" className="gap-2">
            <Title>{title}</Title>
            {trend && (
              <Badge
                color={trend.direction === 'up' ? 'emerald' : 'rose'}
                size="sm"
                icon={trend.direction === 'up' ? TrendingUp : TrendingDown}
              >
                {trend.direction === 'up' ? '+' : ''}{trend.value.toFixed(1)}%
              </Badge>
            )}
          </Flex>
          {subtitle && (
            <Text className="text-tremor-content-subtle mt-1">{subtitle}</Text>
          )}
        </div>

        {/* Time Range Selector */}
        {timeRanges && timeRanges.length > 0 && (
          <Select
            value={selectedRange}
            onValueChange={handleRangeChange}
            className="w-32"
            icon={Calendar}
          >
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </Select>
        )}
      </Flex>

      {/* Chart */}
      <AreaChart
        className={heightClasses[height]}
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        showLegend={showLegend}
        showGridLines={showGridLines}
        showAnimation={showAnimation}
        curveType={curveType}
        stack={stack}
        connectNulls={connectNulls}
        yAxisWidth={56}
      />

      {/* Insight */}
      {insight && (
        <div
          className={cn(
            'mt-4 p-3 rounded-lg text-sm',
            insight.type === 'positive' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
            insight.type === 'negative' && 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
            insight.type === 'neutral' && 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          )}
        >
          {insight.text}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// Multi-Series Comparison Chart
// ============================================================================

interface ComparisonChartProps {
  title: string;
  series: {
    name: string;
    data: TimeSeriesDataPoint[];
    color?: Color;
  }[];
  index: string;
  valueFormatter?: (value: number) => string;
}

export function TremorComparisonChart({
  title,
  series,
  index,
  valueFormatter = defaultValueFormatter,
}: ComparisonChartProps) {
  const [activeSeries, setActiveSeries] = useState<string[]>(
    series.map((s) => s.name)
  );

  // Merge data from all series
  const mergedData = useMemo(() => {
    if (series.length === 0) return [];
    const dataMap = new Map<string, TimeSeriesDataPoint>();

    series.forEach((s) => {
      s.data.forEach((point) => {
        const existing = dataMap.get(point[index] as string) || { [index]: point[index] };
        existing[s.name] = point[Object.keys(point).find((k) => k !== index) || s.name] as number;
        dataMap.set(point[index] as string, existing);
      });
    });

    return Array.from(dataMap.values());
  }, [series, index]);

  const colors = series.map((s) => s.color || 'blue') as Color[];

  return (
    <Card className="p-6">
      <Title className="mb-4">{title}</Title>

      {/* Series Toggle */}
      <Flex className="gap-2 mb-4 flex-wrap">
        {series.map((s, i) => (
          <Badge
            key={s.name}
            color={activeSeries.includes(s.name) ? colors[i] : 'gray'}
            className="cursor-pointer"
            onClick={() => {
              setActiveSeries((prev) =>
                prev.includes(s.name)
                  ? prev.filter((n) => n !== s.name)
                  : [...prev, s.name]
              );
            }}
          >
            {s.name}
          </Badge>
        ))}
      </Flex>

      <AreaChart
        className="h-72"
        data={mergedData}
        index={index}
        categories={activeSeries}
        colors={colors.filter((_, i) => activeSeries.includes(series[i].name))}
        valueFormatter={valueFormatter}
        showLegend={false}
        curveType="natural"
      />
    </Card>
  );
}

// ============================================================================
// Sparkline Area Chart (Inline)
// ============================================================================

interface SparklineAreaProps {
  data: number[];
  color?: Color;
  showChange?: boolean;
  height?: number;
}

export function TremorSparklineArea({
  data,
  color = 'blue',
  showChange = true,
  height = 40,
}: SparklineAreaProps) {
  const chartData = data.map((value, i) => ({ index: i, value }));
  const change = data.length >= 2
    ? ((data[data.length - 1] - data[0]) / data[0]) * 100
    : 0;

  return (
    <Flex alignItems="center" className="gap-2">
      <AreaChart
        className={`w-24`}
        style={{ height }}
        data={chartData}
        index="index"
        categories={['value']}
        colors={[color]}
        showLegend={false}
        showGridLines={false}
        showXAxis={false}
        showYAxis={false}
        showAnimation={false}
      />
      {showChange && (
        <Badge
          size="xs"
          color={change >= 0 ? 'emerald' : 'rose'}
        >
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </Badge>
      )}
    </Flex>
  );
}

export default TremorAreaChart;
