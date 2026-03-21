/**
 * BUDGET OVERVIEW WIDGET
 *
 * Displays key financial metrics including budget, spending, forecast, and EVM indicators.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { formatMoney } from '@/lib/formatters';
import { useDashboardMetrics, useOntologyFinancials } from '@/hooks/usePalantirOntology';
import { useFinancialInsights } from '@/hooks/useAgentInsights';
import type { DataMode } from '@/lib/agentDataTransformers';

interface BudgetOverviewWidgetProps {
  mode: DataMode;
  onDrillDown?: (type: string, id: string) => void;
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({ label, value, subValue, icon, trend, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {subValue && (
          <span className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function BudgetOverviewWidget({ mode, onDrillDown }: BudgetOverviewWidgetProps) {
  const { data: palantirMetrics } = useDashboardMetrics();
  const { data: financialInsights, isLoading } = useFinancialInsights();
  const { data: palantirFinancials = [] } = useOntologyFinancials();

  // Use agent-calculated insights if available
  const agentMetrics = financialInsights?.aggregated;
  const totalBudget = agentMetrics?.totalBAC || palantirMetrics?.totalBudget || 0;
  const totalSpent = agentMetrics?.totalAC || palantirMetrics?.spentBudget || 0;
  const totalEV = agentMetrics?.totalEV || 0;
  const totalForecast = agentMetrics?.totalEAC || totalBudget;
  const avgCPI = agentMetrics?.avgCPI || 1.0;
  const avgSPI = agentMetrics?.avgSPI || 1.0;

  const utilizationRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const forecastVariance = totalBudget > 0 ? ((totalForecast - totalBudget) / totalBudget) * 100 : 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            Budget Overview
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {mode} Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Budget"
            value={formatCurrency(totalBudget)}
            icon={<PieChart className="h-4 w-4 text-blue-500" />}
          />
          <MetricCard
            label="YTD Spending"
            value={formatCurrency(totalSpent)}
            subValue={`${utilizationRate}% utilized`}
            icon={<BarChart3 className="h-4 w-4 text-purple-500" />}
            trend={utilizationRate > 90 ? 'down' : 'neutral'}
            variant={utilizationRate > 100 ? 'danger' : utilizationRate > 90 ? 'warning' : 'default'}
          />
          <MetricCard
            label="Forecast"
            value={formatCurrency(totalForecast)}
            subValue={`${forecastVariance > 0 ? '+' : ''}${forecastVariance.toFixed(1)}%`}
            icon={forecastVariance > 0 ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-green-500" />}
            trend={forecastVariance > 0 ? 'down' : 'up'}
            variant={forecastVariance > 10 ? 'danger' : forecastVariance > 5 ? 'warning' : 'success'}
          />
          <MetricCard
            label="Earned Value"
            value={formatCurrency(totalEV)}
            subValue={`CPI: ${avgCPI.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            variant={avgCPI >= 1 ? 'success' : avgCPI >= 0.9 ? 'warning' : 'danger'}
          />
        </div>

        {/* EVM Performance Indicators */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget Utilization</span>
            <span className="font-medium">{utilizationRate}%</span>
          </div>
          <Progress value={Math.min(utilizationRate, 100)} className="h-2 mt-2" />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-2 rounded bg-gray-50">
              <span className="text-xs text-muted-foreground">Cost Performance Index</span>
              <p className={`text-lg font-bold ${avgCPI >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {avgCPI.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-2 rounded bg-gray-50">
              <span className="text-xs text-muted-foreground">Schedule Performance Index</span>
              <p className={`text-lg font-bold ${avgSPI >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {avgSPI.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
