/**
 * PROJECT DETAIL PAGE (ENHANCED)
 *
 * Comprehensive project view with rich visualizations:
 * - Progress & timeline charts
 * - Budget burndown visualization
 * - EVM (Earned Value Management) indicators
 * - Risk heat map
 * - SAFe metrics
 * - Work breakdown structure
 */

import { useParams, useLocation, Link } from "wouter";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronRight,
  Loader2,
  Shield,
  Zap,
  GitBranch,
  CircleDot,
  DollarSign,
  RefreshCw,
  Users,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { OpenProjectPanel, PushStatus, SourceBadge, useBidirectionalSave } from "@/openproject";

const AGENT_CONSOLE_URL: string | undefined =
  (import.meta.env.VITE_AGENT_CONSOLE_URL as string | undefined) || undefined;

// ============================================================================
// TYPES & CONFIGS
// ============================================================================

interface ProjectDetail {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
    statusText: string;
    priority: string;
    priorityText: string;
    transformationId: string;
    transformationName: string;
    startDate: string;
    endDate: string;
    budgetId: string;
    budgetName: string;
    budgetTotal: number;
    budgetSpent: number;
    budgetAllocated: number;
    budgetCurrency: string;
    milestoneProgress: number;
    progress: number;
    createdAt: string;
    cpiValue?: number;
    spiValue?: number;
    earnedValue?: number;
    plannedValue?: number;
  };
  features: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    storyPoints: number;
    milestoneProgress: number;
  }>;
  stories: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    storyPoints: number;
    assignedTeam: string;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    assignee: string;
    priority: string;
  }>;
  risks: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    impact: string;
    probability: number;
    riskScore: number;
    mitigationPlan: string;
    owner: string;
    category?: string;
  }>;
  kpis: Array<{
    id: string;
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    status: string;
  }>;
  insights: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    recommendation: string;
    sourceAgent: string;
  }>;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  green: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-500', icon: CheckCircle, label: 'On Track' },
  amber: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-500', icon: Clock, label: 'At Risk' },
  red: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-500', icon: AlertTriangle, label: 'Critical' },
};

const priorityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  high: { color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  medium: { color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  low: { color: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-400' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number, compact = false) {
  if (amount === 0) return '$0';
  if (compact) {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function getTimelineProgress(start: string, end: string): number {
  if (!start || !end) return 0;
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
}

function getDaysRemaining(endDate: string): number {
  if (!endDate) return 0;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

// ============================================================================
// VISUALIZATION COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.amber;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
}

function EVMIndicator({
  label,
  value,
  threshold = 1,
  format = 'decimal',
}: {
  label: string;
  value: number;
  threshold?: number;
  format?: 'decimal' | 'percent' | 'currency';
}) {
  const isGood = value >= threshold;
  const isBad = value < threshold - 0.1;
  const color = isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-amber-600';
  const bgColor = isGood ? 'bg-green-50' : isBad ? 'bg-red-50' : 'bg-amber-50';
  const Icon = isGood ? ArrowUpRight : isBad ? ArrowDownRight : Minus;

  let displayValue = '';
  if (format === 'decimal') displayValue = value.toFixed(2);
  else if (format === 'percent') displayValue = `${(value * 100).toFixed(0)}%`;
  else if (format === 'currency') displayValue = formatCurrency(value, true);

  return (
    <div className={cn('p-4 rounded-lg', bgColor)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 uppercase tracking-wide">{label}</span>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <p className={cn('text-2xl font-bold', color)}>{displayValue}</p>
      <p className="text-xs text-gray-500 mt-1">
        Target: {format === 'decimal' ? threshold.toFixed(2) : format === 'percent' ? `${(threshold * 100).toFixed(0)}%` : formatCurrency(threshold, true)}
      </p>
    </div>
  );
}

function BudgetVisualization({ total, spent, allocated }: { total: number; spent: number; allocated: number }) {
  const spentPercent = total > 0 ? (spent / total) * 100 : 0;
  const allocatedPercent = total > 0 ? (allocated / total) * 100 : 0;
  const remaining = total - spent;
  const isOverBudget = spent > total;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Bar */}
        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
          <div
            className={cn(
              'absolute inset-y-0 left-0 transition-all',
              isOverBudget ? 'bg-red-500' : spentPercent > 80 ? 'bg-amber-500' : 'bg-green-500'
            )}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
          {allocatedPercent > spentPercent && (
            <div
              className="absolute inset-y-0 bg-blue-200 opacity-50"
              style={{ left: `${spentPercent}%`, width: `${Math.min(allocatedPercent - spentPercent, 100 - spentPercent)}%` }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Total Budget</p>
            <p className="font-bold text-gray-900">{formatCurrency(total, true)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Spent</p>
            <p className={cn('font-bold', isOverBudget ? 'text-red-600' : 'text-gray-900')}>
              {formatCurrency(spent, true)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p className={cn('font-bold', remaining < 0 ? 'text-red-600' : 'text-green-600')}>
              {formatCurrency(remaining, true)}
            </p>
          </div>
        </div>

        {/* Utilization */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-600">Utilization</span>
          <Badge
            variant="outline"
            className={cn(
              spentPercent > 90 ? 'border-red-300 bg-red-50 text-red-700' :
              spentPercent > 70 ? 'border-amber-300 bg-amber-50 text-amber-700' :
              'border-green-300 bg-green-50 text-green-700'
            )}
          >
            {spentPercent.toFixed(0)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineVisualization({
  startDate,
  endDate,
  progress,
}: {
  startDate: string;
  endDate: string;
  progress: number;
}) {
  const timelineProgress = getTimelineProgress(startDate, endDate);
  const daysRemaining = getDaysRemaining(endDate);
  const isAhead = progress > timelineProgress;
  const isBehind = progress < timelineProgress - 10;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          Timeline & Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{formatDate(startDate)}</span>
            <span>{formatDate(endDate)}</span>
          </div>
          <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
            {/* Time elapsed */}
            <div
              className="absolute inset-y-0 left-0 bg-gray-300"
              style={{ width: `${timelineProgress}%` }}
            />
            {/* Work completed */}
            <div
              className={cn(
                'absolute inset-y-0 left-0 transition-all',
                isAhead ? 'bg-green-500' : isBehind ? 'bg-red-500' : 'bg-blue-500'
              )}
              style={{ width: `${progress}%` }}
            />
            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
              style={{ left: `${timelineProgress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Time Elapsed</p>
            <p className="font-bold text-gray-900">{timelineProgress}%</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Work Done</p>
            <p className={cn(
              'font-bold',
              isAhead ? 'text-green-600' : isBehind ? 'text-red-600' : 'text-blue-600'
            )}>
              {progress}%
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Days Left</p>
            <p className={cn('font-bold', daysRemaining < 30 ? 'text-red-600' : 'text-gray-900')}>
              {daysRemaining}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={cn(
          'p-3 rounded-lg flex items-center gap-3',
          isAhead ? 'bg-green-50' : isBehind ? 'bg-red-50' : 'bg-blue-50'
        )}>
          {isAhead ? (
            <>
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-700">Ahead of Schedule</p>
                <p className="text-xs text-green-600">{(progress - timelineProgress).toFixed(0)}% ahead</p>
              </div>
            </>
          ) : isBehind ? (
            <>
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-700">Behind Schedule</p>
                <p className="text-xs text-red-600">{(timelineProgress - progress).toFixed(0)}% behind</p>
              </div>
            </>
          ) : (
            <>
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-700">On Track</p>
                <p className="text-xs text-blue-600">Progress aligned with timeline</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskHeatMap({ risks }: { risks: ProjectDetail['risks'] }) {
  const risksByLevel = useMemo(() => {
    const groups = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const r of risks) {
      const level = (r.severity || 'medium').toLowerCase() as keyof typeof groups;
      if (groups[level] !== undefined) groups[level]++;
    }
    return groups;
  }, [risks]);

  const totalRisks = risks.length;
  const criticalRisks = risks.filter(r =>
    r.severity === 'critical' || r.severity === 'high' || r.riskScore >= 7
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-600" />
          Risk Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Grid */}
        <div className="grid grid-cols-4 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105',
                risksByLevel.critical > 0 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
              )}>
                <p className="text-2xl font-bold">{risksByLevel.critical}</p>
                <p className="text-xs">Critical</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Critical severity risks</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105',
                risksByLevel.high > 0 ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
              )}>
                <p className="text-2xl font-bold">{risksByLevel.high}</p>
                <p className="text-xs">High</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>High severity risks</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105',
                risksByLevel.medium > 0 ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
              )}>
                <p className="text-2xl font-bold">{risksByLevel.medium}</p>
                <p className="text-xs">Medium</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Medium severity risks</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105',
                risksByLevel.low > 0 ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700'
              )}>
                <p className="text-2xl font-bold">{risksByLevel.low}</p>
                <p className="text-xs">Low</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Low severity risks</TooltipContent>
          </Tooltip>
        </div>

        {/* Critical Risks List */}
        {criticalRisks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Critical Risks</p>
            {criticalRisks.slice(0, 3).map((risk, i) => (
              <div key={risk.id || i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-700 truncate">{risk.title}</p>
                  {risk.mitigationPlan && (
                    <p className="text-xs text-red-600 truncate">{risk.mitigationPlan}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalRisks === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No risks registered</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkBreakdownChart({
  features,
  stories,
  tasks,
}: {
  features: ProjectDetail['features'];
  stories: ProjectDetail['stories'];
  tasks: ProjectDetail['tasks'];
}) {
  const getStats = (items: Array<{ status: string }>) => {
    const total = items.length;
    const done = items.filter(i =>
      ['done', 'complete', 'accepted', 'closed'].includes((i.status || '').toLowerCase())
    ).length;
    const inProgress = items.filter(i =>
      ['in_progress', 'in progress', 'implementing', 'active'].includes((i.status || '').toLowerCase())
    ).length;
    return { total, done, inProgress, pending: total - done - inProgress };
  };

  const featureStats = getStats(features);
  const storyStats = getStats(stories);
  const taskStats = getStats(tasks);

  const items = [
    { label: 'Features', ...featureStats, icon: Zap, color: 'bg-purple-500' },
    { label: 'Stories', ...storyStats, icon: GitBranch, color: 'bg-blue-500' },
    { label: 'Tasks', ...taskStats, icon: CircleDot, color: 'bg-green-500' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-600" />
          Work Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm text-gray-500">
                {item.done}/{item.total}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
              {item.done > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(item.done / item.total) * 100}%` }}
                />
              )}
              {item.inProgress > 0 && (
                <div
                  className="bg-blue-500"
                  style={{ width: `${(item.inProgress / item.total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Done: {item.done}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Active: {item.inProgress}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                Pending: {item.pending}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** OpenProject status names the connector PATCH endpoint accepts. */
const OP_STATUS_OPTIONS = ['New', 'In progress', 'On hold', 'Closed'];

function WorkItemCard({
  item,
  type,
  onSaved,
}: {
  item: { id: string; name: string; status: string; description?: string; priority?: string };
  type: 'feature' | 'story' | 'task';
  /** Called after a successful OpenProject write-back (e.g. refetch). */
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  // Bidirectional save: this page has no local work-item mutation (data is
  // read via the project360 query and round-trips through the connector
  // sync), so the local step is a no-op and the push is the save.
  const { save, status: pushStatus, error: pushError, retry, isOpenProject } = useBidirectionalSave(item, {
    entityType: type,
    onLocalSave: async () => {},
    onPushed: () => {
      toast({ title: 'Synced to OpenProject', description: `${item.name} updated in the source of record.` });
      onSaved?.();
    },
    onPushFailed: (e) =>
      toast({ title: 'OpenProject push failed', description: e, variant: 'destructive' }),
  });

  const statusLower = (item.status || '').toLowerCase();
  const isDone = ['done', 'complete', 'accepted', 'closed'].includes(statusLower);
  const isInProgress = ['in_progress', 'in progress', 'implementing', 'active'].includes(statusLower);
  const isBlocked = statusLower.includes('blocked');

  const StatusIcon = isDone ? CheckCircle2 : isInProgress ? PlayCircle : isBlocked ? PauseCircle : Circle;
  const statusColor = isDone ? 'text-green-600' : isInProgress ? 'text-blue-600' : isBlocked ? 'text-red-600' : 'text-gray-400';

  const linkPath = type === 'feature' ? `/feature/${item.id}` : type === 'story' ? `/story/${item.id}` : null;

  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:border-blue-300 hover:bg-gray-50 transition-all cursor-pointer">
      <StatusIcon className={cn('h-5 w-5 mt-0.5 shrink-0', statusColor)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {item.name}
          <SourceBadge entity={item} entityType={type} className="ml-2 align-middle" />
        </p>
        {item.description && (
          <p className="text-sm text-gray-500 truncate">{item.description}</p>
        )}
        <PushStatus status={pushStatus} error={pushError} onRetry={() => void retry()} className="mt-1" />
      </div>
      {isOpenProject && !linkPath && (
        <select
          aria-label="Update status in OpenProject"
          defaultValue=""
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) void save({ status: e.target.value });
          }}
          className="shrink-0 rounded-md border border-gray-200 bg-transparent px-2 py-1 text-xs text-gray-600 hover:border-blue-300"
        >
          <option value="" disabled>
            Set status…
          </option>
          {OP_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      {item.priority && <PriorityBadge priority={item.priority} />}
      {linkPath && <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />}
    </div>
  );

  if (linkPath) {
    return <Link href={linkPath}>{content}</Link>;
  }
  return content;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading, error, refetch } = useQuery<ProjectDetail>({
    queryKey: ["project-detail", params.id],
    queryFn: async () => {
      // Try project360 endpoint first
      const res = await fetch(`/api/ontology/project360/${params.id}`);
      if (res.ok) {
        const project360 = await res.json();
        return {
          project: project360,
          features: project360.features || [],
          stories: project360.stories || [],
          tasks: project360.tasks || [],
          risks: project360.risks || [],
          kpis: [],
          insights: [],
        };
      }

      // Fallback to individual project endpoint
      const projectRes = await fetch(`/api/ontology/projects/${params.id}`);
      if (!projectRes.ok) throw new Error("Project not found");
      const project = await projectRes.json();

      // Fetch related data in parallel
      const [risksRes] = await Promise.all([
        fetch(`/api/ontology/risks?projectId=${params.id}`).catch(() => null),
      ]);

      return {
        project,
        features: [],
        stories: [],
        tasks: [],
        risks: risksRes?.ok ? await risksRes.json() : [],
        kpis: [],
        insights: [],
      };
    },
    enabled: !!params.id,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading project details...</span>
        </div>
      </div>
    );
  }

  if (error || !data?.project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or couldn't be loaded.</p>
          <Button onClick={() => setLocation('/ppm')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { project, features, stories, tasks, risks } = data;
  const milestonePercent = Math.round((project.milestoneProgress || project.progress || 0));
  const cpi = project.cpiValue || 1;
  const spi = project.spiValue || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation('/ppm')} className="mt-1">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <SourceBadge entity={project} entityType="project" />
                  <StatusBadge status={project.status} />
                  <PriorityBadge priority={project.priority} />
                </div>
                {project.description && (
                  <p className="text-gray-500 mt-1 text-sm max-w-2xl">{project.description}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features ({features.length})</TabsTrigger>
            <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="risks">Risks ({risks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* OpenProject system-of-work panel */}
            <OpenProjectPanel
              entity={project}
              consoleUrl={AGENT_CONSOLE_URL}
              defaultOpen
              onWorkPackageCreated={() => refetch()}
            />

            {/* EVM Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EVMIndicator label="CPI (Cost Performance)" value={cpi} threshold={1} />
              <EVMIndicator label="SPI (Schedule Performance)" value={spi} threshold={1} />
              <EVMIndicator
                label="Milestone Progress"
                value={milestonePercent / 100}
                threshold={0.5}
                format="percent"
              />
              <EVMIndicator
                label="Budget Utilization"
                value={project.budgetTotal > 0 ? project.budgetSpent / project.budgetTotal : 0}
                threshold={0.8}
                format="percent"
              />
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimelineVisualization
                startDate={project.startDate}
                endDate={project.endDate}
                progress={milestonePercent}
              />
              <BudgetVisualization
                total={project.budgetTotal || 0}
                spent={project.budgetSpent || 0}
                allocated={project.budgetAllocated || project.budgetTotal || 0}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkBreakdownChart features={features} stories={stories} tasks={tasks} />
              <RiskHeatMap risks={risks} />
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Transformation</p>
                  <p className="font-semibold text-gray-900 mt-1 truncate">
                    {project.transformationName || project.transformationId || '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                  <p className="font-semibold text-gray-900 mt-1 truncate">
                    {project.budgetName || formatCurrency(project.budgetTotal || 0, true)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                  <p className="font-semibold text-gray-900 mt-1">{formatDate(project.startDate)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                  <p className="font-semibold text-gray-900 mt-1">{formatDate(project.endDate)}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                {features.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No features linked to this project</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {features.map((f) => (
                      <WorkItemCard key={f.id} item={f} type="feature" onSaved={() => refetch()} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stories.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stories linked to this project</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stories.map((s) => (
                      <WorkItemCard key={s.id} item={s} type="story" onSaved={() => refetch()} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-green-600" />
                    Tasks
                  </CardTitle>
                  <Link href="/tasks">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Task Board
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CircleDot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks linked to this project</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((t) => (
                      <WorkItemCard key={t.id} item={t} type="task" onSaved={() => refetch()} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  Risk Register
                </CardTitle>
              </CardHeader>
              <CardContent>
                {risks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No risks registered for this project</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {risks.map((r) => {
                      const severityColor =
                        r.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                        r.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        r.severity === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-200';

                      return (
                        <div key={r.id} className="p-4 rounded-lg border hover:border-red-300 transition-all">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className={cn(
                              'h-5 w-5 mt-0.5 shrink-0',
                              r.severity === 'critical' || r.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-medium text-gray-900">{r.title}</span>
                                <Badge variant="outline" className={severityColor}>
                                  {r.severity}
                                </Badge>
                                {r.riskScore > 0 && (
                                  <Badge variant="secondary">Score: {r.riskScore}</Badge>
                                )}
                              </div>
                              {r.description && (
                                <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                              )}
                              {r.mitigationPlan && (
                                <div className="p-2 bg-blue-50 rounded text-sm">
                                  <span className="font-medium text-blue-700">Mitigation: </span>
                                  <span className="text-blue-600">{r.mitigationPlan}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
