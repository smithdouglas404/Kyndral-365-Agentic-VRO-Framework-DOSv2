/**
 * METRIC SPARKLINE COMPONENT
 * Displays a mini line chart with trend indicator for metric cards
 */

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricSparklineProps {
  data: number[];
  trendPercentage: number;
  comparisonPeriod?: string;
  color?: string;
}

export function MetricSparkline({
  data,
  trendPercentage,
  comparisonPeriod = 'vs last period',
  color = '#3b82f6',
}: MetricSparklineProps) {
  // Convert array to format recharts expects
  const chartData = data.map((value, index) => ({
    value,
    index,
  }));

  const isPositive = trendPercentage >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className="flex items-center gap-3 mt-3">
      {/* Sparkline Chart */}
      <div className="flex-1 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Indicator */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${bgColor}`}>
        <TrendIcon className={`w-3 h-3 ${trendColor}`} />
        <span className={`text-xs font-semibold ${trendColor}`}>
          {Math.abs(trendPercentage).toFixed(1)}%
        </span>
      </div>

      {/* Comparison Text */}
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {comparisonPeriod}
      </span>
    </div>
  );
}
