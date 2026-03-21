/**
 * PPM EXECUTIVE DASHBOARD
 *
 * Comprehensive Project Portfolio Management dashboard with:
 * - Portfolio health overview
 * - Budget & EVM metrics
 * - Project status grid
 * - SAFe breakdown
 * - Risk overview
 * - Real-time data from PostgreSQL/Palantir
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  GitBranch,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  ChevronRight,
  Activity,
  Zap,
  Shield,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  FolderKanban,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboardMetrics, useOntologyProjects } from '@/hooks/usePalantirOntology';
import { cn } from '@/lib/utils';

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, icon, trend, variant = 'default', onClick }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
    warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200',
    danger: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
  };

  const iconStyles = {
    default: 'text-gray-600 bg-gray-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-amber-600 bg-amber-100',
    danger: 'text-red-600 bg-red-100',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg border-2',
          variantStyles[variant]
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
              {trend && (
                <div className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {trend.value >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend.value)}% {trend.label}</span>
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// PROJECT ROW COMPONENT
// ============================================================================

interface ProjectRowProps {
  project: any;
  index: number;
}

function ProjectRow({ project, index }: ProjectRowProps) {
  const statusColors = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const budgetPercent = project.budgetTotal > 0
    ? (project.budgetSpent / project.budgetTotal) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/project/${project.id}`}>
        <div className="group flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
          {/* Status Indicator */}
          <div className={cn('w-2 h-12 rounded-full', statusColors[project.status as keyof typeof statusColors] || 'bg-gray-300')} />

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {project.name}
              </h4>
              <Badge variant="outline" className={cn('text-[10px] shrink-0', priorityColors[project.priority as keyof typeof priorityColors])}>
                {project.priorityText || project.priority}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 truncate">{project.businessUnit}</p>
          </div>

          {/* Progress */}
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-1.5" />
          </div>

          {/* Budget */}
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Budget</span>
              <span className={cn('font-medium', budgetPercent > 90 ? 'text-red-600' : budgetPercent > 75 ? 'text-amber-600' : 'text-green-600')}>
                {budgetPercent.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={budgetPercent}
              className={cn(
                'h-1.5',
                budgetPercent > 90 && '[&>div]:bg-red-500',
                budgetPercent > 75 && budgetPercent <= 90 && '[&>div]:bg-amber-500'
              )}
            />
          </div>

          {/* EVM Badges */}
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={cn(
                  'text-[10px]',
                  (project.cpiValue || 1) >= 1
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                )}>
                  CPI {(project.cpiValue || 1).toFixed(2)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Cost Performance Index</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={cn(
                  'text-[10px]',
                  (project.spiValue || 1) >= 1
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}>
                  SPI {(project.spiValue || 1).toFixed(2)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Schedule Performance Index</TooltipContent>
            </Tooltip>
          </div>

          {/* Work Items */}
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {project.featureCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {project.storyCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {project.taskCount || 0}
            </span>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// STATUS DISTRIBUTION CHART
// ============================================================================

function StatusDistribution({ metrics }: { metrics: any }) {
  const total = metrics?.totalProjects || 0;
  const statusData = [
    { label: 'On Track', count: metrics?.projectsByStatus?.green || 0, color: 'bg-green-500', textColor: 'text-green-700' },
    { label: 'At Risk', count: metrics?.projectsByStatus?.amber || 0, color: 'bg-amber-500', textColor: 'text-amber-700' },
    { label: 'Delayed', count: metrics?.projectsByStatus?.red || 0, color: 'bg-red-500', textColor: 'text-red-700' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChart className="h-4 w-4 text-blue-600" />
          Portfolio Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status Bar */}
        <div className="h-4 rounded-full overflow-hidden flex mb-4">
          {statusData.map((status, i) => (
            <div
              key={i}
              className={cn('transition-all', status.color)}
              style={{ width: total > 0 ? `${(status.count / total) * 100}%` : '0%' }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {statusData.map((status, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', status.color)} />
                <span className="text-sm text-gray-600">{status.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold', status.textColor)}>{status.count}</span>
                <span className="text-xs text-gray-400">
                  ({total > 0 ? ((status.count / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SAFE BREAKDOWN COMPONENT
// ============================================================================

function SAFeBreakdown({ metrics }: { metrics: any }) {
  const items = [
    { label: 'Features', count: metrics?.totalFeatures || 0, icon: Layers, color: 'text-purple-600 bg-purple-100' },
    { label: 'Stories', count: metrics?.totalStories || 0, icon: GitBranch, color: 'text-blue-600 bg-blue-100' },
    { label: 'Tasks', count: metrics?.totalTasks || 0, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
    { label: 'Dependencies', count: metrics?.totalDependencies || 0, icon: Activity, color: 'text-orange-600 bg-orange-100' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-blue-600" />
          SAFe Work Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className={cn('p-2 rounded-lg', item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// BUDGET OVERVIEW COMPONENT
// ============================================================================

function BudgetOverview({ metrics }: { metrics: any }) {
  const totalBudget = metrics?.totalBudget || 0;
  const spentBudget = metrics?.spentBudget || 0;
  const remaining = totalBudget - spentBudget;
  const utilization = metrics?.budgetUtilization || 0;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          Budget Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Utilization</span>
            <span className={cn(
              'font-medium',
              utilization > 90 ? 'text-red-600' : utilization > 75 ? 'text-amber-600' : 'text-green-600'
            )}>
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-amber-500' : 'bg-green-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilization, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Budget Details */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 rounded-lg bg-blue-50">
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totalBudget)}</p>
            <p className="text-[10px] text-blue-600">Total Budget</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50">
            <p className="text-lg font-bold text-amber-700">{formatCurrency(spentBudget)}</p>
            <p className="text-[10px] text-amber-600">Spent</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-50">
            <p className="text-lg font-bold text-green-700">{formatCurrency(remaining)}</p>
            <p className="text-[10px] text-green-600">Remaining</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EVM PERFORMANCE COMPONENT
// ============================================================================

function EVMPerformance({ metrics }: { metrics: any }) {
  const avgCPI = metrics?.avgCPI || 1;
  const avgSPI = metrics?.avgSPI || 1;

  const getPerformanceLabel = (value: number, type: 'cost' | 'schedule') => {
    if (value >= 1.1) return type === 'cost' ? 'Under Budget' : 'Ahead of Schedule';
    if (value >= 1.0) return type === 'cost' ? 'On Budget' : 'On Schedule';
    if (value >= 0.9) return type === 'cost' ? 'Slightly Over' : 'Slightly Behind';
    return type === 'cost' ? 'Over Budget' : 'Behind Schedule';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          EVM Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cost Performance (CPI)</span>
            <Badge variant="outline" className={cn(
              avgCPI >= 1 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {avgCPI.toFixed(2)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={Math.min(avgCPI * 50, 100)}
              className={cn('flex-1 h-2', avgCPI >= 1 ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500')}
            />
            <span className="text-xs text-gray-500 w-24 text-right">
              {getPerformanceLabel(avgCPI, 'cost')}
            </span>
          </div>
        </div>

        {/* SPI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Schedule Performance (SPI)</span>
            <Badge variant="outline" className={cn(
              avgSPI >= 1 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            )}>
              {avgSPI.toFixed(2)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={Math.min(avgSPI * 50, 100)}
              className={cn('flex-1 h-2', avgSPI >= 1 ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500')}
            />
            <span className="text-xs text-gray-500 w-24 text-right">
              {getPerformanceLabel(avgSPI, 'schedule')}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400">
          CPI/SPI &gt; 1.0 = Good | CPI/SPI = 1.0 = On Target | CPI/SPI &lt; 1.0 = Needs Attention
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function PPMExecutiveDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useOntologyProjects();

  const filteredProjects = (projects || []).filter((p: any) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
    return true;
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchProjects();
  };

  if (metricsLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PPM Executive Dashboard</h1>
                <p className="text-sm text-gray-500">Portfolio Performance Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Total Projects"
            value={metrics?.totalProjects || 0}
            subtitle="Active portfolio"
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <MetricCard
            title="On Track"
            value={metrics?.projectsByStatus?.green || 0}
            subtitle={`${metrics?.totalProjects ? ((metrics.projectsByStatus?.green || 0) / metrics.totalProjects * 100).toFixed(0) : 0}% of portfolio`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />
          <MetricCard
            title="At Risk"
            value={metrics?.projectsByStatus?.amber || 0}
            subtitle="Needs attention"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="warning"
          />
          <MetricCard
            title="Delayed"
            value={metrics?.projectsByStatus?.red || 0}
            subtitle="Critical issues"
            icon={<Clock className="h-5 w-5" />}
            variant="danger"
          />
          <MetricCard
            title="Total Risks"
            value={metrics?.totalRisks || 0}
            subtitle={`${metrics?.criticalRisks || 0} critical`}
            icon={<Shield className="h-5 w-5" />}
            variant={(metrics?.criticalRisks || 0) > 0 ? 'danger' : 'default'}
          />
          <MetricCard
            title="Avg Progress"
            value={`${(metrics?.avgProgress || 0).toFixed(0)}%`}
            subtitle="Across portfolio"
            icon={<Target className="h-5 w-5" />}
            trend={{ value: 5, label: 'vs last month' }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusDistribution metrics={metrics} />
          <BudgetOverview metrics={metrics} />
          <EVMPerformance metrics={metrics} />
          <SAFeBreakdown metrics={metrics} />
        </div>

        {/* Projects Section */}
        <Card>
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Project Portfolio
                <Badge variant="secondary" className="ml-2">{filteredProjects.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="green">On Track</SelectItem>
                      <SelectItem value="amber">At Risk</SelectItem>
                      <SelectItem value="red">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-3">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No projects match the selected filters</p>
                  </div>
                ) : (
                  filteredProjects.map((project: any, index: number) => (
                    <ProjectRow key={project.id} project={project} index={index} />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
