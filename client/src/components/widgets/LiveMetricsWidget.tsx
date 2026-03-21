/**
 * LIVE METRICS WIDGET
 *
 * Displays real-time portfolio metrics from Palantir with WebSocket updates.
 * Shows key KPIs: project counts, budget, risks, and OKR progress.
 */

import { useLiveDashboardMetrics } from "@/hooks/useLivePalantirData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FolderKanban,
  RefreshCw,
  Target,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  label: string;
  value: number | string | undefined;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
  format?: "number" | "currency" | "percent";
}

function MetricCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = "default",
  format = "number",
}: MetricCardProps) {
  const formatValue = (val: number | string | undefined) => {
    if (val === undefined || val === null) return "--";
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(val);
      case "percent":
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const variantStyles = {
    default: "bg-background",
    success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
  };

  const iconVariantStyles = {
    default: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all hover:shadow-md",
        variantStyles[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("h-4 w-4", iconVariantStyles[variant])}>{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{formatValue(value)}</span>
        {trend && trendValue && (
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" && "+"}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function LiveMetricsWidget() {
  const { metrics, isLive, isLoading, lastUpdated, refetch, error } =
    useLiveDashboardMetrics();

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || "Failed to load metrics from Palantir"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Portfolio Metrics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={isLive ? "default" : "secondary"}
                  className={cn(
                    "gap-1",
                    isLive
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  )}
                >
                  {isLive ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {isLive ? "Live" : "Polling"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isLive
                  ? "Connected to real-time updates"
                  : "WebSocket disconnected, using polling"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Project Status Row */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                Project Status
              </h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard
                  label="Total Projects"
                  value={metrics?.totalProjects}
                  icon={<FolderKanban className="h-4 w-4" />}
                />
                <MetricCard
                  label="On Track"
                  value={metrics?.projectsByStatus?.green}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  variant="success"
                />
                <MetricCard
                  label="At Risk"
                  value={metrics?.projectsByStatus?.amber}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant="warning"
                />
                <MetricCard
                  label="Delayed"
                  value={metrics?.projectsByStatus?.red}
                  icon={<Clock className="h-4 w-4" />}
                  variant="danger"
                />
              </div>
            </div>

            {/* Status Distribution Bar */}
            {metrics?.totalProjects && metrics.totalProjects > 0 && (
              <div className="space-y-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-green-500 transition-all"
                    style={{
                      width: `${((metrics.projectsByStatus?.green || 0) / metrics.totalProjects) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-amber-500 transition-all"
                    style={{
                      width: `${((metrics.projectsByStatus?.amber || 0) / metrics.totalProjects) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{
                      width: `${((metrics.projectsByStatus?.red || 0) / metrics.totalProjects) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {(
                      ((metrics.projectsByStatus?.green || 0) / metrics.totalProjects) *
                      100
                    ).toFixed(0)}
                    % On Track
                  </span>
                  <span>
                    {(
                      ((metrics.projectsByStatus?.amber || 0) / metrics.totalProjects) *
                      100
                    ).toFixed(0)}
                    % At Risk
                  </span>
                  <span>
                    {(
                      ((metrics.projectsByStatus?.red || 0) / metrics.totalProjects) *
                      100
                    ).toFixed(0)}
                    % Delayed
                  </span>
                </div>
              </div>
            )}

            {/* Financial & Performance Row */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                Financial & Performance
              </h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard
                  label="Total Budget"
                  value={metrics?.totalBudget}
                  icon={<DollarSign className="h-4 w-4" />}
                  format="currency"
                />
                <MetricCard
                  label="Budget Spent"
                  value={metrics?.spentBudget}
                  icon={<TrendingUp className="h-4 w-4" />}
                  format="currency"
                />
                <MetricCard
                  label="Active Risks"
                  value={metrics?.totalRisks}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant={
                    (metrics?.criticalRisks || 0) > 0 ? "danger" : "default"
                  }
                />
                <MetricCard
                  label="OKR Progress"
                  value={metrics?.okrProgress}
                  icon={<Target className="h-4 w-4" />}
                  format="percent"
                />
              </div>
            </div>

            {/* Budget Progress */}
            {metrics?.totalBudget && metrics.totalBudget > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium">
                    {(
                      ((metrics.spentBudget || 0) / metrics.totalBudget) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <Progress
                  value={((metrics.spentBudget || 0) / metrics.totalBudget) * 100}
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LiveMetricsWidget;
