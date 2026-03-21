import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, TrendingUp, Filter, Search, User, Target, Link as LinkIcon, FileText, ArrowRight, RefreshCw, Play, Pause, Download, TrendingDown, Brain, BarChart3, Building2, AlertCircle, Briefcase, AlertOctagon, PieChart, FileCode, Zap, Settings, Network, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo, ReactNode } from "react";
import { usePageContext } from "@/contexts/PageContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScenarioChartsGrid } from "@/components/ScenarioCharts";
import { UnifiedMetricsSection } from "@/components/UnifiedMetricsSection";
import { startScenarioSimulation } from "@/lib/scenarioSimulator";
import { useValueInsights } from "@/hooks/useAgentInsights";
import { AIAlertTicker } from "@/components/AIAlertTicker";
import { VROMetricsTable } from "@/components/VROMetricsTable";
import { KPIAttributionPanel } from "@/components/KPIAttributionPanel";
import { AutonomousRiskAgent } from "@/components/AutonomousRiskAgent";
import { MultiAgentDiscussion } from "@/components/MultiAgentDiscussion";
import { AgentCommandCenter } from "@/components/AgentCommandCenter";
import { AgentSidebar } from "@/components/AgentSidebar";
import { CrossAgentCollaboration } from "@/components/CrossAgentCollaboration";
import AgentActionQueue from "@/components/AgentActionQueue";
import { useDashboardMetrics, useOntologyProjects } from "@/hooks/usePalantirOntology";
import { useDemoMode, useToggleDemoMode } from "@/hooks/useAppConfig";
import { useCompanyName, useCompanyProfile } from "@/contexts/CompanyProfileContext";
import { formatMoney } from "@/lib/formatters";
import { colors } from "@/lib/designTokens";
import { Leaf, Shield, Sparkles, Building, ChevronRight, Bot } from "lucide-react";
import { DrillDownDrawer } from "@/components/DrillDownDrawer";
import { VROMetricsGrid } from "@/components/VROMetricCard";
import { Switch } from "@/components/ui/switch";
import { GitBranch, BookOpen, Compass } from "lucide-react";
import { startBackgroundMonitor, stopBackgroundMonitor, setActionNotificationCallback } from "@/lib/backgroundAgentMonitor";
import { startOrchestrator, stopOrchestrator } from "@/lib/agentOrchestrator";
import { toast } from "sonner";
import { ProjectLifecycleCommandCenter } from "@/components/ProjectLifecycleCommandCenter";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { HelpMenu } from "@/components/HelpMenu";
import { CustomizableDashboard } from "@/components/CustomizableDashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DashboardMode } from "@/lib/widgetRegistry";

// Design System Colors
const brandColors = {
  blue: colors.brand.blue,
  teal: colors.brand.teal,
  red: colors.brand.red,
  yellow: colors.brand.yellow,
  grey500: colors.neutral.grey500,
  grey700: colors.neutral.grey700,
};

function useDashboardMode() {
  return useQuery<DashboardMode>({
    queryKey: ['/api/config/dashboard_mode'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/config/dashboard_mode');
        if (!res.ok) return 'custom';
        const data = await res.json();
        return (data.value === 'dynamic' ? 'dynamic' : 'custom') as DashboardMode;
      } catch {
        return 'custom' as DashboardMode;
      }
    },
    staleTime: 60000,
  });
}

function isSAFeProject(p: any): boolean {
  if (!p.name) return false;
  const name = p.name;
  if (name.startsWith('[Feature]') || name.startsWith('[Story]') || name.startsWith('[Task]') || name.startsWith('[Agent]') || name.startsWith('[Integration]') || name.startsWith('[Division]') || name.startsWith('[Monday]') || name.startsWith('[Jira') || name.startsWith('[OpenProject]')) return false;
  if (p.id?.startsWith('feature-') || p.id?.startsWith('story-') || p.id?.startsWith('task-') || p.id?.startsWith('agent-') || p.id?.startsWith('source-') || p.id?.startsWith('div-') || p.id?.startsWith('monday-') || p.id?.startsWith('story-test-') || p.id?.startsWith('test-div-')) return false;
  return true;
}

function PortfolioStatusBreakdownWidget({ projects }: { projects: any[] }) {
  const safeOnly = projects.filter(isSAFeProject);
  if (!safeOnly || safeOnly.length === 0) return null;
  const statusCounts: Record<string, number> = {};
  safeOnly.forEach((p) => {
    const st = p.statusText || (p.status === 'green' ? 'On Track' : p.status === 'red' ? 'Critical' : 'In Progress');
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });
  const statusColors: Record<string, string> = {
    'Active': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'active': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-300',
    'Planning': 'bg-violet-100 text-violet-800 border-violet-300',
    'At Risk': 'bg-amber-100 text-amber-800 border-amber-300',
    'Complete': 'bg-gray-100 text-gray-800 border-gray-300',
    'Not Started': 'bg-slate-100 text-slate-700 border-slate-300',
    'On Track': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Critical': 'bg-red-100 text-red-800 border-red-300',
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {Object.entries(statusCounts).sort((a,b) => b[1] - a[1]).map(([st, count]) => (
        <div key={st} className={`p-3 rounded-lg border text-center ${statusColors[st] || 'bg-gray-100 text-gray-700 border-gray-300'}`} data-testid={`status-badge-${st.toLowerCase().replace(/\s+/g,'-')}`}>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs font-medium">{st}</p>
        </div>
      ))}
    </div>
  );
}

function PalantirPortfolioWidget({ projects, projectsLoading, onDrillDown }: { projects: any[]; projectsLoading: boolean; onDrillDown: (type: string, id: string) => void }) {
  const safeProjects = projects.filter(isSAFeProject);
  const features = projects.filter(p => p.name?.startsWith('[Feature]') || p.id?.startsWith('feature-'));
  const stories = projects.filter(p => p.name?.startsWith('[Story]') || p.id?.startsWith('story-'));
  const tasks = projects.filter(p => p.name?.startsWith('[Task]') || p.id?.startsWith('task-'));

  return (
    <Card className="border-purple-300 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-600" />
          SAFe Portfolio from Palantir Ontology
          <Badge className="bg-purple-600">{safeProjects.length} Projects</Badge>
          <Badge variant="outline" className="text-[10px]">{features.length} Features</Badge>
          <Badge variant="outline" className="text-[10px]">{stories.length} Stories</Badge>
          <Badge variant="outline" className="text-[10px]">{tasks.length} Tasks</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projectsLoading ? (
          <div className="text-center py-4">Loading from Palantir...</div>
        ) : safeProjects.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No SAFe projects found in Palantir ({projects.length} total objects loaded)</div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeProjects.slice(0, 12).map((p) => {
                const statusLabel = p.statusText || (p.status === 'green' ? 'On Track' : p.status === 'red' ? 'Critical' : 'In Progress');
                const statusBg = p.status === 'green' ? 'bg-emerald-100 text-emerald-700' : p.status === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                const borderColor = p.status === 'green' ? 'border-l-emerald-500' : p.status === 'red' ? 'border-l-red-500' : 'border-l-amber-500';
                return (
                  <div key={p.id} className={`p-4 rounded-lg border border-gray-200 border-l-4 bg-white hover:shadow-md transition-shadow cursor-pointer ${borderColor}`} onClick={() => onDrillDown('project', p.id)} data-testid={`project-card-${p.id}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm leading-tight line-clamp-2" title={p.name}>{p.name}</p>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${statusBg}`}>{statusLabel}</Badge>
                    </div>
                    {p.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{p.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                      {p.priorityText && <span className="font-medium">{p.priorityText}</span>}
                      {p.businessUnit && p.businessUnit !== 'General' && <span>{p.businessUnit}</span>}
                      {p.startDate && <span>{new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                      {p.endDate && <span>→ {new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {safeProjects.length > 12 && (
              <p className="text-center text-xs text-gray-400 pt-2">Showing 12 of {safeProjects.length} SAFe projects from Palantir</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ValueRealizationWidget({ valueInsights }: { valueInsights: any }) {
  if (!valueInsights) return null;
  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Agent-Calculated Value Realization Metrics
          <Badge variant="outline" className="ml-2 text-xs">Real-time from Value Realization Agent</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Total Planned Value</p>
            <p className="text-2xl font-bold text-blue-600">${(valueInsights.aggregated.totalPlannedValue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500 mt-1">Across {valueInsights.aggregated.totalProjects} projects</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Total Actual Value</p>
            <p className="text-2xl font-bold text-green-600">${(valueInsights.aggregated.totalActualValue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500 mt-1">Benefits realized to date</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Value Leakage</p>
            <p className={`text-2xl font-bold ${valueInsights.aggregated.totalValueLeakage > 1000000 ? 'text-red-600' : 'text-amber-600'}`}>
              ${(valueInsights.aggregated.totalValueLeakage / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-500 mt-1">{((valueInsights.aggregated.totalValueLeakage / valueInsights.aggregated.totalPlannedValue) * 100).toFixed(1)}% of planned value</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Avg Realization Rate</p>
            <p className={`text-2xl font-bold ${valueInsights.aggregated.avgRealizationRate >= 0.9 ? 'text-green-600' : valueInsights.aggregated.avgRealizationRate >= 0.75 ? 'text-amber-600' : 'text-red-600'}`}>
              {(valueInsights.aggregated.avgRealizationRate * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">{valueInsights.aggregated.avgRealizationRate >= 0.9 ? 'Excellent' : valueInsights.aggregated.avgRealizationRate >= 0.75 ? 'Acceptable' : 'Needs attention'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-xs text-gray-500 mb-1">On Track</p>
            <p className="text-2xl font-bold text-green-600">{valueInsights.aggregated.projectsOnTrack}</p>
            <p className="text-xs text-gray-500 mt-1">{((valueInsights.aggregated.projectsOnTrack / valueInsights.aggregated.totalProjects) * 100).toFixed(0)}% of portfolio</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <p className="text-xs text-gray-500 mb-1">At Risk</p>
            <p className="text-2xl font-bold text-amber-600">{valueInsights.aggregated.projectsAtRisk}</p>
            <p className="text-xs text-gray-500 mt-1">{((valueInsights.aggregated.projectsAtRisk / valueInsights.aggregated.totalProjects) * 100).toFixed(0)}% of portfolio</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <p className="text-xs text-gray-500 mb-1">High Risk</p>
            <p className="text-2xl font-bold text-red-600">{valueInsights.aggregated.projectsHighRisk}</p>
            <p className="text-xs text-gray-500 mt-1">{((valueInsights.aggregated.projectsHighRisk / valueInsights.aggregated.totalProjects) * 100).toFixed(0)}% of portfolio</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


// Palantir-driven VRO Metrics Summary
function VROMetricsSummary() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#0072CE]" />
          <span className="text-sm font-medium text-gray-600">Portfolio Metrics from Palantir</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-blue-50 border border-blue-200 rounded-[4px] p-4 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics || metrics.totalProjects === 0) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#0072CE]" />
          <span className="text-sm font-medium text-gray-600">Portfolio Metrics from Palantir</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 border-dashed rounded-lg p-8 text-center">
          <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-700 mb-2">Connecting to Palantir</h4>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Loading portfolio data from Palantir Foundry ontology...
          </p>
        </div>
      </div>
    );
  }

  // Transform Palantir metrics for display
  const displayMetrics = [
    {
      id: 'total-projects',
      label: 'Total Projects',
      value: metrics.totalProjects.toString(),
      unit: 'projects',
      color: 'text-[#0072CE]',
      source: 'Palantir Ontology',
    },
    {
      id: 'active-projects',
      label: 'Active Projects',
      value: metrics.activeProjects.toString(),
      unit: 'in progress',
      color: 'text-[#00A651]',
      source: 'Palantir Ontology',
    },
    {
      id: 'budget-utilization',
      label: 'Budget Utilization',
      value: metrics.totalBudget > 0 ? `${Math.round((metrics.spentBudget / metrics.totalBudget) * 100)}` : '0',
      unit: '%',
      color: metrics.spentBudget / metrics.totalBudget > 0.9 ? 'text-red-600' : 'text-[#0072CE]',
      source: 'Palantir Ontology',
    },
    {
      id: 'risk-items',
      label: 'Risk Items',
      value: metrics.totalRisks.toString(),
      unit: `(${metrics.criticalRisks} critical)`,
      color: metrics.criticalRisks > 0 ? 'text-red-600' : 'text-[#00A651]',
      source: 'Palantir Ontology',
    },
  ];

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[#0072CE]" />
        <span className="text-sm font-medium text-gray-600">Portfolio Metrics from Palantir</span>
        <Badge variant="outline" className="text-xs bg-purple-50">Live</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayMetrics.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-blue-50 border border-blue-200 rounded-[4px] p-4 flex flex-col"
            data-testid={`vro-stat-${kpi.id}`}
          >
            <span className="text-xs font-medium text-gray-500 mb-1">{kpi.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</span>
              <span className="text-sm text-gray-500">{kpi.unit}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-[10px] font-semibold text-[#0072CE]">{kpi.source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveIndicatorButton({ isLive, onToggle }: { isLive: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={cn(
        "gap-2 transition-all",
        isLive ? "border-[#00A651] text-[#00A651] bg-[#00A651]/10" : "border-gray-300"
      )}
      data-testid="button-live-toggle"
    >
      {isLive ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          LIVE
          <Pause size={14} />
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-gray-400"></span>
          PAUSED
          <Play size={14} />
        </>
      )}
    </Button>
  );
}

function LGReportStats({ mode, onDrillDown }: { mode: "VRO" | "PMO"; onDrillDown?: (type: string, id: string) => void }) {
  // Fetch metrics from Palantir
  const { data: metrics, isLoading } = useDashboardMetrics();

  // Map icon names to icon components
  const iconMap: Record<string, any> = {
    Clock,
    Activity,
    TrendingUp,
    Target,
    TrendingDown,
    Building2,
  };

  // Transform Palantir metrics to component format based on mode
  const stats = metrics ? (mode === "VRO" ? [
    {
      id: 'total-projects',
      label: 'Portfolio Projects',
      value: metrics.totalProjects.toString(),
      unit: '',
      icon: Building2,
      color: 'text-[#0072CE]',
      source: 'Palantir Ontology',
      progress: Math.round((metrics.activeProjects / Math.max(metrics.totalProjects, 1)) * 100),
      baseline: `${metrics.projectsByStatus.red} at risk`,
      target: `${metrics.projectsByStatus.green} on track`,
    },
    {
      id: 'budget-total',
      label: 'Total Budget',
      value: `$${(metrics.totalBudget / 1000000).toFixed(1)}M`,
      unit: '',
      icon: TrendingUp,
      color: 'text-[#0072CE]',
      source: 'Palantir Ontology',
      progress: Math.round((metrics.spentBudget / Math.max(metrics.totalBudget, 1)) * 100),
      baseline: `$${(metrics.spentBudget / 1000000).toFixed(1)}M spent`,
      target: `$${((metrics.totalBudget - metrics.spentBudget) / 1000000).toFixed(1)}M remaining`,
    },
    {
      id: 'okr-progress',
      label: 'OKR Progress',
      value: `${Math.round(metrics.okrProgress)}`,
      unit: '%',
      icon: Target,
      color: metrics.okrProgress >= 70 ? 'text-[#00A651]' : 'text-amber-600',
      source: 'Palantir Ontology',
      progress: Math.round(metrics.okrProgress),
      baseline: 'Current quarter',
      target: '100% target',
    },
    {
      id: 'risk-count',
      label: 'Active Risks',
      value: metrics.totalRisks.toString(),
      unit: '',
      icon: Activity,
      color: metrics.criticalRisks > 0 ? 'text-red-600' : 'text-[#00A651]',
      source: 'Palantir Ontology',
      progress: Math.round((1 - metrics.criticalRisks / Math.max(metrics.totalRisks, 1)) * 100),
      baseline: `${metrics.criticalRisks} critical`,
      target: '0 critical',
    },
  ] : [
    // PMO mode metrics
    {
      id: 'active-projects',
      label: 'Active Projects',
      value: metrics.activeProjects.toString(),
      unit: '',
      icon: Activity,
      color: 'text-[#0072CE]',
      source: 'Palantir Ontology',
      progress: Math.round((metrics.projectsByStatus.green / Math.max(metrics.activeProjects, 1)) * 100),
      baseline: `${metrics.projectsByStatus.amber} at risk`,
      target: 'All on track',
    },
    {
      id: 'green-status',
      label: 'On Track',
      value: metrics.projectsByStatus.green.toString(),
      unit: 'projects',
      icon: TrendingUp,
      color: 'text-[#00A651]',
      source: 'Palantir Ontology',
      progress: Math.round((metrics.projectsByStatus.green / Math.max(metrics.totalProjects, 1)) * 100),
      baseline: '',
      target: '',
    },
    {
      id: 'amber-status',
      label: 'At Risk',
      value: metrics.projectsByStatus.amber.toString(),
      unit: 'projects',
      icon: Clock,
      color: 'text-amber-600',
      source: 'Palantir Ontology',
      progress: 50,
      baseline: '',
      target: '',
    },
    {
      id: 'red-status',
      label: 'Critical',
      value: metrics.projectsByStatus.red.toString(),
      unit: 'projects',
      icon: TrendingDown,
      color: 'text-red-600',
      source: 'Palantir Ontology',
      progress: 25,
      baseline: '',
      target: '',
    },
  ]) : [];

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            className="bg-white border border-border rounded-[4px] p-6 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow duration-150 cursor-pointer"
            data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onDrillDown?.("metric", stat.id)}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <Icon className={stat.color} size={20} strokeWidth={1.5} />
            </div>
            <div className="flex items-baseline gap-1 w-full">
              <motion.span
                key={`${mode}-${stat.label}`}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-foreground tracking-tight"
              >
                {stat.value}
              </motion.span>
              <span className="text-lg text-muted-foreground">{stat.unit}</span>
            </div>
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{stat.baseline}</span>
                <span className="font-medium text-[#00A651]">{stat.target}</span>
              </div>
              <Progress value={stat.progress} className="h-2" />
              <div className="text-xs text-right mt-1 font-medium" style={{ color: mode === "VRO" ? "#00A651" : "#757575" }}>
                {stat.progress}% to target
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-[#0072CE]">{stat.source}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function NavBar() {
  const companyName = useCompanyName();
  const { profile, isDemoMode } = useCompanyProfile();

  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-home">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{companyName}</h1>
              {isDemoMode && (
                <span className="text-xs text-orange-600 font-medium">Demo Mode</span>
              )}
            </div>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search dashboard..." 
            className="pl-9 h-9 bg-background border-border rounded-[4px]" 
            data-testid="input-search"
          />
        </div>
        <NotificationsDropdown />
        <HelpMenu />
        <Button size="icon" variant="ghost" className="rounded-full" data-testid="button-user" onClick={() => alert('User Profile\n\nAccount settings, preferences, and logout options would appear here.')}>
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}

function OverviewWidgetDashboard({ projects, projectsLoading, valueInsights, onDrillDown }: {
  projects: any[];
  projectsLoading: boolean;
  valueInsights: any;
  onDrillDown: (type: string, id: string) => void;
}) {
  const { data: dashboardMode = 'custom' } = useDashboardMode();

  const widgetComponents = useMemo<Record<string, ReactNode>>(() => {
    const components: Record<string, ReactNode> = {
      'vro-metrics-summary': <VROMetricsSummary />,
      'portfolio-status-breakdown': !projectsLoading && projects.length > 0
        ? <PortfolioStatusBreakdownWidget projects={projects} />
        : null,
      'palantir-portfolio': <PalantirPortfolioWidget projects={projects} projectsLoading={projectsLoading} onDrillDown={onDrillDown} />,
      'agent-action-queue': <AgentActionQueue />,
      'value-realization-metrics': <ValueRealizationWidget valueInsights={valueInsights} />,
      'unified-metrics': <UnifiedMetricsSection onDrillDown={onDrillDown} />,
    };
    return components;
  }, [projects, projectsLoading, valueInsights, onDrillDown]);

  return (
    <CustomizableDashboard
      activeTab="overview"
      widgetComponents={widgetComponents}
      onDrillDown={onDrillDown}
    />
  );
}

function DashboardContent() {
  const [location, navigate] = useLocation();
  const { setPageContext } = usePageContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownEntity, setDrillDownEntity] = useState<{type: string; id: string} | null>(null);

  const companyName = useCompanyName();
  const { profile } = useCompanyProfile();

  // Fetch projects from Palantir ontology
  const { data: projects = [], isLoading: projectsLoading } = useOntologyProjects();

  // Fetch agent-calculated value insights
  const { data: valueInsights, isLoading: valueInsightsLoading } = useValueInsights();

  // Update page context for Ask PM
  useEffect(() => {
    setPageContext({
      pageType: 'dashboard',
      entityId: 'integrated-management',
      entityName: 'Value Realization',
      breadcrumb: ['Dashboard']
    });
  }, [setPageContext]);

  // Read tab from URL query parameter on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      // Clean up the URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Always redirect to VRO dashboard on initial load
  useEffect(() => {
    if (location === '/dashboard/pmo') {
      navigate('/dashboard', { replace: true });
    }
  }, []);
  
  // Start background agent monitor, orchestrator, and scenario simulation with toast notifications
  // Only show toast notifications for critical agent messages
  useEffect(() => {
    setActionNotificationCallback((agentName, action, target, severity) => {
      if (severity === 'critical') {
        toast.error(`🚨 ${agentName} ${action} ${target}`, {
          description: "Critical agent action - immediate attention required",
          duration: 8000,
        });
      }
    });
    startBackgroundMonitor(15000);
    startOrchestrator(5000, 45000);
    startScenarioSimulation();
    return () => {
      stopBackgroundMonitor();
      stopOrchestrator();
    };
  }, []);
  
  const handleDrillDown = (type: string, id: string) => {
    if (type === 'division' || type === 'segment') {
      navigate(`/segment/${id}?fromTab=${activeTab}`);
      return;
    }
    if (type === 'sustainability' && id === 'sustainability-overview') {
      navigate('/sustainability');
      return;
    }
    if (type === 'risk' && id === 'risk-overview') {
      navigate('/risk');
      return;
    }
    setDrillDownEntity({ type, id });
    setDrillDownOpen(true);
  };




  
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <NavBar />

      <div className="flex">
        <AgentSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 px-8 py-8 max-w-[1400px]">
        {/* Title section - Only show on Overview tab */}
        {activeTab === "overview" && (
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-[48px] font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
                Value Realization
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                AI-powered Insights supporting the Value Realization and Project Execution Process
              </p>
              <div className="mt-4 w-full max-w-5xl">
                <AIAlertTicker />
              </div>
            </motion.div>
          </div>
        )}



        {/* Tab Content - Navigation handled by sidebar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          {/* Overview Tab - Customizable Widget Dashboard */}
          <TabsContent value="overview" className="space-y-8">
            <OverviewWidgetDashboard
              projects={projects}
              projectsLoading={projectsLoading}
              valueInsights={valueInsights}
              onDrillDown={handleDrillDown}
            />
          </TabsContent>

          {/* Portfolios Tab - BU Programs */}
          <TabsContent value="portfolios" className="space-y-6">

            {/* Portfolio Projects from Palantir */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Portfolio Projects
                  <Badge variant="outline" className="ml-2 text-xs bg-purple-50">
                    From Palantir Ontology
                  </Badge>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Click any project to view detailed metrics and status
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {projectsLoading ? (
                  <div className="col-span-3 flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : projects.slice(0, 12).map((project) => {
                  const statusColors = {
                    green: { border: '#00A651', bg: 'bg-green-50', text: 'text-green-700' },
                    amber: { border: '#FFA500', bg: 'bg-amber-50', text: 'text-amber-700' },
                    red: { border: '#D50032', bg: 'bg-red-50', text: 'text-red-700' },
                  };
                  const colors = statusColors[project.status] || statusColors.amber;
                  return (
                    <div
                      key={project.id}
                      className={`p-3 rounded-lg border bg-white hover:shadow-md transition-all cursor-pointer group ${colors.bg}`}
                      style={{ borderLeftColor: colors.border, borderLeftWidth: '4px' }}
                      data-testid={`card-project-${project.id}`}
                      onClick={() => handleDrillDown("project", project.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 truncate">{project.businessUnit}</p>
                          <p className={`text-sm font-bold truncate ${colors.text}`}>{project.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={project.priority === 'critical' ? 'destructive' : project.priority === 'high' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {project.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {Math.round((project.milestoneProgress || 0) * 100)}% complete
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              
              <div 
                className="p-3 rounded-lg border border-green-200 bg-green-50 hover:shadow-md transition-all cursor-pointer group" 
                data-testid="card-sustainability"
                onClick={() => handleDrillDown("sustainability", "sustainability-overview")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <p className="text-xs text-green-700 font-medium">Sustainability</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">-60%</p>
                    <p className="text-xs text-green-600">emissions</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-green-400 group-hover:text-green-600 transition-colors" />
                </div>
              </div>
              
              <div 
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:shadow-md transition-all cursor-pointer group" 
                data-testid="card-risk"
                onClick={() => handleDrillDown("risk", "risk-overview")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-slate-600" />
                      <p className="text-xs text-slate-700 font-medium">Risk Center</p>
                    </div>
                    <p className="text-lg font-bold text-slate-600">5 Categories</p>
                    <p className="text-xs text-slate-500">3 Lines</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
              </div>
            </div>

            {/* Autonomous Risk Mitigation */}
            <AutonomousRiskAgent onNavigateToProject={(id) => navigate(`/project/${id}`)} />

            {/* Multi-Agent Discussion */}
            <MultiAgentDiscussion />

            {/* Cross-Agent Collaboration */}
            <CrossAgentCollaboration />

          </TabsContent>

          {/* KPI Tracking Tab */}
          <TabsContent value="kpi-tracking">
            <KPIAttributionPanel />
          </TabsContent>

          {/* Project Lifecycle Command Center - VRO Only */}
          <TabsContent value="lifecycle">
            <ProjectLifecycleCommandCenter onDrillDown={handleDrillDown} />
          </TabsContent>

          {/* Agent Command Center Tab */}
          <TabsContent value="agent-command" className="space-y-6">
            <AgentCommandCenter onNavigateToProject={(id) => navigate(`/project/${id}`)} />
          </TabsContent>

        </Tabs>
      </main>
      </div>
      
      <footer className="mt-12 py-8 border-t border-border bg-white px-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Data Sources & Citations</p>
              <div className="text-xs text-muted-foreground space-y-1">
                {profile?.company && profile.meta?.extractedAt ? (
                  <>
                    <p>† Data extracted from {companyName} Annual Report</p>
                    <p>† Metrics and objectives from company strategic plan</p>
                    <p>† Organizational structure from SEC filings</p>
                    <p>† Governance rules from corporate policies</p>
                    <p>† Extracted: {new Date(profile.meta.extractedAt).toLocaleDateString()}</p>
                  </>
                ) : (
                  <>
                    <p>† Revenue target ($28bn): Enterprise Annual Report 2024</p>
                    <p>† Clean Energy Capacity (75GW): Enterprise 10-K 2024</p>
                    <p>† Cost efficiency target: Enterprise Annual Report 2024</p>
                    <p>† Operational risk: Enterprise Annual Report 2024, Risk Factors</p>
                    <p>† Capital investment: Enterprise Annual Report 2024</p>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Data updates from database
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border pt-4">
            <p>© 2026 {companyName}. Internal Use Only.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <DrillDownDrawer
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        entityType={drillDownEntity?.type || ""}
        entityId={drillDownEntity?.id || ""}
        dataMode="VRO"
        onNavigate={(type, id) => {
          setDrillDownEntity({ type, id });
        }}
      />
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
