import { useState } from 'react';
import {
  Card,
  Title,
  Text,
  BarChart,
  BarList,
  Flex,
  Select,
  SelectItem,
  Badge,
  Grid,
  Col,
  type Color,
} from '@tremor/react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface BarDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface BarChartConfig {
  title: string;
  subtitle?: string;
  data: BarDataPoint[];
  categories: string[];
  index: string;
  colors?: Color[];
  valueFormatter?: (value: number) => string;
  layout?: 'vertical' | 'horizontal';
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  stack?: boolean;
  relative?: boolean;
}

interface TremorBarChartProps {
  config: BarChartConfig;
  sortOptions?: { label: string; value: string }[];
  onSortChange?: (sort: string) => void;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const defaultValueFormatter = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toFixed(0);
};

const heightClasses = {
  sm: 'h-48',
  md: 'h-72',
  lg: 'h-96',
};

// ============================================================================
// Main Bar Chart Component
// ============================================================================

export function TremorBarChart({
  config,
  sortOptions,
  onSortChange,
  height = 'md',
  className,
}: TremorBarChartProps) {
  const [selectedSort, setSelectedSort] = useState(sortOptions?.[0]?.value || 'default');

  const {
    title,
    subtitle,
    data,
    categories,
    index,
    colors = ['blue', 'emerald', 'amber', 'rose'],
    valueFormatter = defaultValueFormatter,
    layout = 'vertical',
    showLegend = true,
    showGridLines = true,
    showAnimation = true,
    stack = false,
    relative = false,
  } = config;

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSortChange?.(value);
  };

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <Flex justifyContent="between" alignItems="start" className="mb-4">
        <div>
          <Title>{title}</Title>
          {subtitle && (
            <Text className="text-tremor-content-subtle mt-1">{subtitle}</Text>
          )}
        </div>

        {/* Sort Selector */}
        {sortOptions && sortOptions.length > 0 && (
          <Select
            value={selectedSort}
            onValueChange={handleSortChange}
            className="w-36"
          >
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        )}
      </Flex>

      {/* Chart */}
      <BarChart
        className={heightClasses[height]}
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        layout={layout}
        showLegend={showLegend}
        showGridLines={showGridLines}
        showAnimation={showAnimation}
        stack={stack}
        relative={relative}
        yAxisWidth={48}
      />
    </Card>
  );
}

// ============================================================================
// Simple Bar List Component
// ============================================================================

export interface BarListItem {
  name: string;
  value: number;
  color?: Color;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
}

interface TremorBarListProps {
  title: string;
  subtitle?: string;
  data: BarListItem[];
  valueFormatter?: (value: number) => string;
  showAnimation?: boolean;
  color?: Color;
  className?: string;
}

export function TremorBarList({
  title,
  subtitle,
  data,
  valueFormatter = defaultValueFormatter,
  showAnimation = true,
  color = 'blue',
  className,
}: TremorBarListProps) {
  return (
    <Card className={cn('p-6', className)}>
      <Title>{title}</Title>
      {subtitle && (
        <Text className="text-tremor-content-subtle mt-1 mb-4">{subtitle}</Text>
      )}
      <BarList
        data={data}
        valueFormatter={valueFormatter}
        showAnimation={showAnimation}
        color={color}
        className="mt-4"
      />
    </Card>
  );
}

// ============================================================================
// Category Comparison Chart
// ============================================================================

interface CategoryComparisonProps {
  title: string;
  categories: {
    name: string;
    value: number;
    target?: number;
    color?: Color;
  }[];
  valueFormatter?: (value: number) => string;
}

export function TremorCategoryComparison({
  title,
  categories,
  valueFormatter = defaultValueFormatter,
}: CategoryComparisonProps) {
  return (
    <Card className="p-6">
      <Title className="mb-4">{title}</Title>
      <div className="space-y-4">
        {categories.map((category) => {
          const progress = category.target
            ? (category.value / category.target) * 100
            : 100;
          const isOverTarget = category.target && category.value > category.target;

          return (
            <div key={category.name}>
              <Flex justifyContent="between" className="mb-1">
                <Text className="font-medium">{category.name}</Text>
                <Flex className="gap-2">
                  <Text className="font-medium">
                    {valueFormatter(category.value)}
                  </Text>
                  {category.target && (
                    <Text className="text-tremor-content-subtle">
                      / {valueFormatter(category.target)}
                    </Text>
                  )}
                </Flex>
              </Flex>
              <div className="relative h-2 rounded-full bg-tremor-background-subtle overflow-hidden">
                <div
                  className={cn(
                    'absolute h-full rounded-full transition-all duration-500',
                    isOverTarget
                      ? 'bg-rose-500'
                      : category.color
                      ? `bg-${category.color}-500`
                      : 'bg-blue-500'
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
                {category.target && progress > 100 && (
                  <div
                    className="absolute h-full bg-rose-300 opacity-50"
                    style={{
                      left: '100%',
                      width: `${Math.min(progress - 100, 50)}%`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================================
// Grouped Metrics Bar Chart
// ============================================================================

interface GroupedMetricsProps {
  title: string;
  groups: {
    name: string;
    metrics: {
      label: string;
      value: number;
      color?: Color;
    }[];
  }[];
  valueFormatter?: (value: number) => string;
}

export function TremorGroupedMetrics({
  title,
  groups,
  valueFormatter = defaultValueFormatter,
}: GroupedMetricsProps) {
  // Transform data for bar chart
  const data = groups.map((group) => {
    const point: BarDataPoint = { name: group.name };
    group.metrics.forEach((metric) => {
      point[metric.label] = metric.value;
    });
    return point;
  });

  const categories = groups[0]?.metrics.map((m) => m.label) || [];
  const colors = groups[0]?.metrics.map((m) => m.color || 'blue') as Color[];

  return (
    <Card className="p-6">
      <Title className="mb-4">{title}</Title>
      <BarChart
        className="h-72"
        data={data}
        index="name"
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        showLegend={true}
      />
    </Card>
  );
}

// ============================================================================
// Horizontal Progress Bars Grid
// ============================================================================

interface ProgressGridItem {
  label: string;
  value: number;
  maxValue?: number;
  color?: Color;
  status?: 'success' | 'warning' | 'error' | 'neutral';
}

interface TremorProgressGridProps {
  title: string;
  items: ProgressGridItem[];
  columns?: 1 | 2 | 3;
}

export function TremorProgressGrid({
  title,
  items,
  columns = 2,
}: TremorProgressGridProps) {
  const getStatusColor = (status?: string): Color => {
    switch (status) {
      case 'success': return 'emerald';
      case 'warning': return 'amber';
      case 'error': return 'rose';
      default: return 'blue';
    }
  };

  return (
    <Card className="p-6">
      <Title className="mb-4">{title}</Title>
      <Grid numItemsSm={1} numItemsMd={columns} className="gap-4">
        {items.map((item, index) => {
          const maxValue = item.maxValue || 100;
          const percentage = (item.value / maxValue) * 100;
          const color = item.color || getStatusColor(item.status);

          return (
            <Col key={index}>
              <Flex justifyContent="between" className="mb-1">
                <Text className="text-sm">{item.label}</Text>
                <Badge color={color} size="xs">
                  {item.value.toFixed(0)}%
                </Badge>
              </Flex>
              <div className="h-2 rounded-full bg-tremor-background-subtle overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    `bg-${color}-500`
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </Col>
          );
        })}
      </Grid>
    </Card>
  );
}

export default TremorBarChart;
