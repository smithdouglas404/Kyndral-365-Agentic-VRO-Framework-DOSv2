/**
 * DynamicWorkspace - Example implementation of the new dashboard system
 *
 * This demonstrates:
 * - WorkspacePage with tabs and navigation
 * - Tremor widgets (KPI, charts, tables)
 * - Agent streaming widgets
 * - Dynamic widget placement
 */

import { useMemo, useState, type ReactNode } from 'react';
import { useRoute } from 'wouter';
import {
  workspaces,
  dashboards,
  getWorkspaceFromPath,
  getDashboardFromPath,
} from '@/lib/navigationRegistry';
import { WorkspacePage, DashboardPage } from '@/components/workspace';
import { AppShell } from '@/components/shell/AppShell';

// Tremor Widgets
import {
  TremorKPICard,
  TremorKPIGrid,
  TremorAreaChart,
  TremorBarChart,
  TremorBarList,
  TremorDonutChart,
  TremorStatusDistribution,
  TremorProgressTracker,
  TremorMilestoneTracker,
  TremorDataTable,
  TremorInsightsFeed,
  TremorAIRecommendation,
  TremorAgentStreamWidget,
  TremorAgentDiscussion,
  useAgentStream,
  type KPIData,
  type Insight,
  type Milestone,
  type TrackerItem,
  type Color,
} from '@/components/tremor-widgets';

import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Target,
  Briefcase,
  Shield,
} from 'lucide-react';

// ============================================================================
// Sample Data
// ============================================================================

const sampleKPIs: KPIData[] = [
  {
    title: 'Total Budget',
    value: 12500000,
    prefix: '$',
    delta: 5.2,
    deltaType: 'increase',
    previousValue: 11875000,
    trend: [100, 105, 102, 110, 108, 115, 120, 125],
    status: 'success',
    icon: DollarSign,
  },
  {
    title: 'Projects On Track',
    value: 24,
    suffix: ' / 28',
    delta: -3.5,
    deltaType: 'moderateDecrease',
    progress: 85,
    status: 'warning',
    icon: Target,
  },
  {
    title: 'Team Utilization',
    value: '87%',
    delta: 2.1,
    deltaType: 'increase',
    trend: [75, 78, 82, 80, 85, 87],
    status: 'success',
    icon: Users,
  },
  {
    title: 'Risk Score',
    value: 23,
    suffix: ' / 100',
    delta: -8,
    deltaType: 'decrease',
    insight: 'Risk reduced after mitigation actions',
    status: 'success',
    icon: Shield,
  },
];

const sampleTimeSeriesData = [
  { date: 'Jan', actual: 2400, planned: 2600, forecast: 2500 },
  { date: 'Feb', actual: 2800, planned: 2700, forecast: 2750 },
  { date: 'Mar', actual: 3200, planned: 3100, forecast: 3150 },
  { date: 'Apr', actual: 3600, planned: 3500, forecast: 3550 },
  { date: 'May', actual: 3900, planned: 4000, forecast: 3950 },
  { date: 'Jun', actual: 4200, planned: 4200, forecast: 4200 },
];

const sampleCategoryData = [
  { name: 'Infrastructure', value: 4500000 },
  { name: 'Development', value: 3200000 },
  { name: 'Operations', value: 2100000 },
  { name: 'Marketing', value: 1500000 },
  { name: 'Support', value: 1200000 },
];

const sampleMilestones: Milestone[] = [
  { id: '1', name: 'Requirements Finalized', dueDate: 'Jan 15', status: 'completed' },
  { id: '2', name: 'Design Complete', dueDate: 'Feb 28', status: 'completed' },
  { id: '3', name: 'Development Phase 1', dueDate: 'Mar 30', status: 'in_progress', progress: 65 },
  { id: '4', name: 'Testing Phase', dueDate: 'Apr 30', status: 'upcoming' },
  { id: '5', name: 'Production Release', dueDate: 'May 15', status: 'upcoming' },
];

const sampleInsights: Insight[] = [
  {
    id: '1',
    title: 'Budget Alert',
    description: 'Project Alpha is trending 12% over budget. Consider reviewing scope.',
    severity: 'warning',
    source: 'FinOps Agent',
    timestamp: '2 hours ago',
    actions: [
      { label: 'View Details' },
      { label: 'Dismiss', variant: 'outline' },
    ],
  },
  {
    id: '2',
    title: 'Schedule Risk',
    description: '3 dependencies blocking critical path for Q2 release.',
    severity: 'error',
    source: 'Risk Agent',
    timestamp: '4 hours ago',
    metrics: [
      { label: 'Blocked Items', value: 3, trend: 'up' },
      { label: 'Days at Risk', value: 5 },
    ],
  },
  {
    id: '3',
    title: 'Resource Optimization',
    description: 'Team B has 20% spare capacity. Consider reassignment to Project Delta.',
    severity: 'ai',
    source: 'Resource Agent',
    timestamp: '1 day ago',
  },
];

const sampleTrackerData: TrackerItem[] = [
  { color: 'emerald', tooltip: 'Week 1 - On track' },
  { color: 'emerald', tooltip: 'Week 2 - On track' },
  { color: 'emerald', tooltip: 'Week 3 - On track' },
  { color: 'amber', tooltip: 'Week 4 - Minor delays' },
  { color: 'emerald', tooltip: 'Week 5 - On track' },
  { color: 'emerald', tooltip: 'Week 6 - On track' },
  { color: 'rose', tooltip: 'Week 7 - At risk' },
  { color: 'amber', tooltip: 'Week 8 - Minor delays' },
  { color: 'emerald', tooltip: 'Week 9 - On track' },
  { color: 'emerald', tooltip: 'Week 10 - On track' },
  { color: 'gray', tooltip: 'Week 11 - Not started' },
  { color: 'gray', tooltip: 'Week 12 - Not started' },
];

// ============================================================================
// Widget Components Map
// ============================================================================

function createWidgetComponents(): Record<string, ReactNode> {
  return {
    // KPI Widgets
    'portfolio-kpi-grid': (
      <TremorKPIGrid
        kpis={sampleKPIs}
        columns={4}
        showSparklines
      />
    ),

    'budget-kpi': (
      <TremorKPICard
        data={sampleKPIs[0]}
        showSparkline
        showProgress={false}
        showInsight={false}
      />
    ),

    // Chart Widgets
    'budget-trend': (
      <TremorAreaChart
        config={{
          title: 'Budget Performance',
          subtitle: 'Actual vs Planned vs Forecast',
          data: sampleTimeSeriesData,
          categories: ['actual', 'planned', 'forecast'],
          index: 'date',
          colors: ['blue', 'emerald', 'amber'],
          valueFormatter: (v) => `$${(v / 1000).toFixed(0)}K`,
          insight: {
            text: 'Trending 3% ahead of plan due to optimized resource allocation',
            type: 'positive',
          },
        }}
        timeRanges={[
          { label: '6 months', value: '6m' },
          { label: '12 months', value: '12m' },
          { label: 'YTD', value: 'ytd' },
        ]}
        height="md"
      />
    ),

    'category-breakdown': (
      <TremorDonutChart
        config={{
          title: 'Budget Allocation',
          subtitle: 'By category',
          data: sampleCategoryData,
          category: 'value',
          index: 'name',
          valueFormatter: (v) => `$${(v / 1000000).toFixed(1)}M`,
        }}
        showList
        height="md"
      />
    ),

    'cost-categories': (
      <TremorBarList
        title="Cost by Category"
        subtitle="Current fiscal year"
        data={sampleCategoryData.map(d => ({
          name: d.name,
          value: d.value,
        }))}
        valueFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
        color="blue"
      />
    ),

    // Progress Widgets
    'project-tracker': (
      <TremorProgressTracker
        config={{
          title: 'Sprint Progress',
          subtitle: '12-week delivery cycle',
          data: sampleTrackerData,
          showLegend: true,
        }}
      />
    ),

    'milestone-tracker': (
      <TremorMilestoneTracker
        title="Key Milestones"
        milestones={sampleMilestones}
      />
    ),

    // Insights Widgets
    'ai-insights': (
      <TremorInsightsFeed
        title="AI Insights"
        insights={sampleInsights}
        maxItems={5}
      />
    ),
  };
}

// ============================================================================
// Agent Stream Demo Widget
// ============================================================================

function AgentStreamDemo() {
  const { state, content, reasoning, startThinking, complete, error, reset } = useAgentStream();

  const runAnalysis = async () => {
    reset();
    startThinking('Analyzing portfolio performance...');

    // Simulate agent processing
    await new Promise(r => setTimeout(r, 2000));

    // Simulate agent returning a widget
    const generatedWidget = (
      <TremorKPIGrid
        kpis={[
          {
            title: 'Generated Metric',
            value: Math.floor(Math.random() * 1000000),
            prefix: '$',
            delta: Math.floor(Math.random() * 20) - 10,
            status: 'success',
            icon: TrendingUp,
          },
          {
            title: 'AI Score',
            value: Math.floor(Math.random() * 100),
            suffix: '%',
            status: 'success',
            icon: CheckCircle,
          },
        ]}
        columns={2}
      />
    );

    complete(
      generatedWidget,
      'I analyzed 47 projects across 8 portfolios. The top performers share high team engagement (>85%) and clear milestone definitions.'
    );
  };

  return (
    <TremorAgentStreamWidget
      title="Dynamic Analysis"
      agent={{
        name: 'FinOps Agent',
        icon: DollarSign,
        color: 'violet',
      }}
      state={state}
      onRefresh={runAnalysis}
      showReasoning
      reasoning={reasoning}
      timestamp="Just now"
    >
      {content}
    </TremorAgentStreamWidget>
  );
}

// ============================================================================
// Main Page Components
// ============================================================================

export function DynamicWorkspacePage() {
  const [, params] = useRoute('/workspace/:workspaceId');
  const workspaceId = params?.workspaceId;

  const workspace = useMemo(() => {
    if (!workspaceId) return null;
    return workspaces.find(w => w.id === workspaceId);
  }, [workspaceId]);

  if (!workspace) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Workspace not found</h1>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <WorkspacePage workspace={workspace} />
    </AppShell>
  );
}

export function DynamicDashboardPage() {
  const [, params] = useRoute('/dashboard/:dashboardId');
  const dashboardId = params?.dashboardId;

  const dashboard = useMemo(() => {
    if (!dashboardId) return null;
    return dashboards.find(d => d.id === dashboardId);
  }, [dashboardId]);

  if (!dashboard) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Dashboard not found</h1>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardPage
        title={dashboard.label}
        subtitle={dashboard.description}
        icon={dashboard.icon}
        defaultWidgets={[]}
        showAIInsights={dashboard.isAI}
      />
    </AppShell>
  );
}

// ============================================================================
// Demo Page (All Widgets Showcase)
// ============================================================================

export function WidgetShowcase() {
  const widgetComponents = createWidgetComponents();

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tremor Widget Showcase</h1>
          <p className="text-tremor-content-subtle">
            All available dashboard widgets with sample data
          </p>
        </div>

        {/* KPI Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-4">KPI Cards</h2>
          {widgetComponents['portfolio-kpi-grid']}
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Area Chart</h2>
            {widgetComponents['budget-trend']}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Donut Chart</h2>
            {widgetComponents['category-breakdown']}
          </div>
        </section>

        {/* Progress Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Progress Tracker</h2>
            {widgetComponents['project-tracker']}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Milestone Tracker</h2>
            {widgetComponents['milestone-tracker']}
          </div>
        </section>

        {/* Insights Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Insights Feed</h2>
            {widgetComponents['ai-insights']}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Agent Stream Widget</h2>
            <AgentStreamDemo />
          </div>
        </section>

        {/* Bar List */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Bar List</h2>
          {widgetComponents['cost-categories']}
        </section>
      </div>
    </AppShell>
  );
}

export default DynamicWorkspacePage;
