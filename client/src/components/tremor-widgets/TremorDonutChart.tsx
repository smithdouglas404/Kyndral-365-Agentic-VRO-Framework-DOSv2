import { useState } from 'react';
import {
  Card,
  Title,
  Text,
  DonutChart,
  Flex,
  Legend,
  Badge,
  List,
  ListItem,
  type Color,
} from '@tremor/react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DonutDataPoint {
  name: string;
  value: number;
  color?: Color;
}

export interface DonutChartConfig {
  title: string;
  subtitle?: string;
  data: DonutDataPoint[];
  category: string;
  index: string;
  colors?: Color[];
  valueFormatter?: (value: number) => string;
  variant?: 'donut' | 'pie';
  showAnimation?: boolean;
  showTooltip?: boolean;
  showLabel?: boolean;
  label?: string;
}

interface TremorDonutChartProps {
  config: DonutChartConfig;
  showLegend?: boolean;
  showList?: boolean;
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

const percentFormatter = (value: number, total: number): string => {
  return `${((value / total) * 100).toFixed(1)}%`;
};

const heightClasses = {
  sm: 'h-40',
  md: 'h-56',
  lg: 'h-72',
};

const defaultColors: Color[] = [
  'blue',
  'emerald',
  'amber',
  'rose',
  'violet',
  'cyan',
  'fuchsia',
  'lime',
];

// ============================================================================
// Main Donut Chart Component
// ============================================================================

export function TremorDonutChart({
  config,
  showLegend = true,
  showList = false,
  height = 'md',
  className,
}: TremorDonutChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const {
    title,
    subtitle,
    data,
    category = 'value',
    index = 'name',
    colors = defaultColors,
    valueFormatter = defaultValueFormatter,
    variant = 'donut',
    showAnimation = true,
    showTooltip = true,
    showLabel = true,
    label,
  } = config;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-4">
        <Title>{title}</Title>
        {subtitle && (
          <Text className="text-tremor-content-subtle mt-1">{subtitle}</Text>
        )}
      </div>

      <Flex className="gap-6" flexDirection={showList ? 'row' : 'col'}>
        {/* Chart */}
        <div className={cn('flex-1', heightClasses[height])}>
          <DonutChart
            data={data}
            category={category}
            index={index}
            colors={colors}
            valueFormatter={valueFormatter}
            variant={variant}
            showAnimation={showAnimation}
            showTooltip={showTooltip}
            showLabel={showLabel}
            label={label || valueFormatter(total)}
            className="h-full"
            onValueChange={(v) => {
              if (v) {
                const idx = data.findIndex((d) => d.name === v.name);
                setSelectedIndex(idx);
              } else {
                setSelectedIndex(null);
              }
            }}
          />
        </div>

        {/* Legend or List */}
        {showLegend && !showList && (
          <Legend
            categories={data.map((d) => d.name)}
            colors={colors}
            className="mt-4"
          />
        )}

        {showList && (
          <List className="flex-1">
            {data.map((item, idx) => (
              <ListItem
                key={item.name}
                className={cn(
                  'transition-colors',
                  selectedIndex === idx && 'bg-tremor-background-subtle'
                )}
              >
                <Flex justifyContent="between" className="w-full">
                  <Flex className="gap-2" alignItems="center">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        `bg-${colors[idx % colors.length]}-500`
                      )}
                    />
                    <Text>{item.name}</Text>
                  </Flex>
                  <Flex className="gap-2">
                    <Text className="font-medium">
                      {valueFormatter(item.value)}
                    </Text>
                    <Badge color="gray" size="xs">
                      {percentFormatter(item.value, total)}
                    </Badge>
                  </Flex>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}
      </Flex>
    </Card>
  );
}

// ============================================================================
// Status Distribution Chart
// ============================================================================

interface StatusDistributionProps {
  title: string;
  statuses: {
    name: string;
    count: number;
    color: Color;
  }[];
  showPercentages?: boolean;
}

export function TremorStatusDistribution({
  title,
  statuses,
  showPercentages = true,
}: StatusDistributionProps) {
  const total = statuses.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="p-6">
      <Title className="mb-4">{title}</Title>

      {/* Segmented Bar */}
      <div className="h-4 rounded-full overflow-hidden flex">
        {statuses.map((status, idx) => (
          <div
            key={status.name}
            className={cn(
              'h-full transition-all duration-500',
              `bg-${status.color}-500`,
              idx === 0 && 'rounded-l-full',
              idx === statuses.length - 1 && 'rounded-r-full'
            )}
            style={{ width: `${(status.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <Flex className="mt-4 flex-wrap gap-4">
        {statuses.map((status) => (
          <Flex key={status.name} className="gap-2" alignItems="center">
            <div className={cn('w-3 h-3 rounded-full', `bg-${status.color}-500`)} />
            <Text className="text-sm">
              {status.name}
              {showPercentages && (
                <span className="text-tremor-content-subtle ml-1">
                  ({((status.count / total) * 100).toFixed(0)}%)
                </span>
              )}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}

// ============================================================================
// Allocation Chart with Details
// ============================================================================

interface AllocationItem {
  name: string;
  value: number;
  subItems?: { name: string; value: number }[];
  color?: Color;
}

interface TremorAllocationChartProps {
  title: string;
  allocations: AllocationItem[];
  valueFormatter?: (value: number) => string;
}

export function TremorAllocationChart({
  title,
  allocations,
  valueFormatter = defaultValueFormatter,
}: TremorAllocationChartProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const total = allocations.reduce((sum, a) => sum + a.value, 0);

  const colors = allocations.map((a, i) => a.color || defaultColors[i % defaultColors.length]);

  return (
    <Card className="p-6">
      <Flex justifyContent="between" alignItems="start" className="mb-4">
        <Title>{title}</Title>
        <Text className="font-semibold">{valueFormatter(total)}</Text>
      </Flex>

      <Flex className="gap-6">
        {/* Donut Chart */}
        <div className="h-48 w-48 shrink-0">
          <DonutChart
            data={allocations}
            category="value"
            index="name"
            colors={colors}
            valueFormatter={valueFormatter}
            showLabel={true}
            label={valueFormatter(total)}
            className="h-full"
          />
        </div>

        {/* Allocation List */}
        <div className="flex-1 space-y-2">
          {allocations.map((allocation, idx) => (
            <div key={allocation.name}>
              <button
                onClick={() =>
                  setExpanded(expanded === allocation.name ? null : allocation.name)
                }
                className="w-full text-left"
              >
                <Flex justifyContent="between" alignItems="center" className="py-2">
                  <Flex className="gap-2" alignItems="center">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        `bg-${colors[idx]}-500`
                      )}
                    />
                    <Text className="font-medium">{allocation.name}</Text>
                    {allocation.subItems && allocation.subItems.length > 0 && (
                      <Badge color="gray" size="xs">
                        {allocation.subItems.length}
                      </Badge>
                    )}
                  </Flex>
                  <Text className="font-semibold">
                    {valueFormatter(allocation.value)}
                  </Text>
                </Flex>
              </button>

              {/* Sub-items */}
              {expanded === allocation.name && allocation.subItems && (
                <div className="ml-5 pl-4 border-l-2 border-tremor-border space-y-1">
                  {allocation.subItems.map((sub) => (
                    <Flex
                      key={sub.name}
                      justifyContent="between"
                      className="py-1 text-sm"
                    >
                      <Text className="text-tremor-content-subtle">
                        {sub.name}
                      </Text>
                      <Text>{valueFormatter(sub.value)}</Text>
                    </Flex>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Flex>
    </Card>
  );
}

// ============================================================================
// Mini Donut with Label
// ============================================================================

interface MiniDonutProps {
  label: string;
  value: number;
  total: number;
  color?: Color;
  size?: 'sm' | 'md';
}

export function TremorMiniDonut({
  label,
  value,
  total,
  color = 'blue',
  size = 'md',
}: MiniDonutProps) {
  const percentage = (value / total) * 100;
  const sizeClass = size === 'sm' ? 'h-12 w-12' : 'h-16 w-16';

  return (
    <Flex className="gap-3" alignItems="center">
      <div className={cn(sizeClass, 'relative')}>
        <DonutChart
          data={[
            { name: 'value', value },
            { name: 'remaining', value: total - value },
          ]}
          category="value"
          index="name"
          colors={[color, 'gray']}
          showLabel={false}
          showTooltip={false}
          className="h-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Text className="text-xs font-semibold">
            {percentage.toFixed(0)}%
          </Text>
        </div>
      </div>
      <div>
        <Text className="font-medium">{label}</Text>
        <Text className="text-xs text-tremor-content-subtle">
          {value} of {total}
        </Text>
      </div>
    </Flex>
  );
}

export default TremorDonutChart;
