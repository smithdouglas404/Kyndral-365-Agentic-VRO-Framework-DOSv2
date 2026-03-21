import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronRight,
  Activity,
  Loader2,
  Shield,
  Zap,
  GitBranch,
  CircleDot,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  green: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-500', icon: CheckCircle },
  amber: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-500', icon: Clock },
  red: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-500', icon: AlertTriangle },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-100' },
  high: { color: 'text-orange-700', bg: 'bg-orange-100' },
  medium: { color: 'text-blue-700', bg: 'bg-blue-100' },
  low: { color: 'text-gray-700', bg: 'bg-gray-100' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getTimelineProgress(start: string, end: string): number {
  if (!start || !end) return 0;
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.amber;
  const Icon = cfg.icon;
  const label = status === 'green' ? 'On Track' : status === 'red' ? 'At Risk' : 'In Progress';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.color}`} data-testid="badge-status">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.color}`} data-testid="badge-priority">
      {priority}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, subtitle, color = 'text-gray-900' }: { icon: any; label: string; value: string | number; subtitle?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow" data-testid={`metric-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function WorkItemRow({ name, status, priority, description, testId }: { name: string; status: string; priority?: string; description: string; testId: string }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = status === 'done' || status === 'complete' ? 'bg-emerald-500' : 
                       status === 'in_progress' || status === 'implementing' ? 'bg-blue-500' : 
                       status === 'blocked' ? 'bg-red-500' : 'bg-gray-300';
  return (
    <div className="border-b border-gray-100 last:border-0" data-testid={testId}>
      <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
        <div className={`h-2 w-2 rounded-full ${statusColor} flex-shrink-0`} />
        <span className="font-medium text-gray-900 flex-1 truncate">{name}</span>
        <span className="text-xs text-gray-500 capitalize px-2 py-0.5 rounded bg-gray-100">{status.replace('_', ' ')}</span>
        {priority && <PriorityBadge priority={priority} />}
      </div>
      {expanded && description && (
        <div className="px-12 pb-3 text-sm text-gray-600">{description}</div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<'overview' | 'features' | 'stories' | 'tasks' | 'risks'>('overview');

  const { data, isLoading, error } = useQuery<ProjectDetail>({
    queryKey: ["project-detail", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.id}/full`);
      if (!res.ok) throw new Error("Project not found");
      return res.json();
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or couldn't be loaded.</p>
          <Button onClick={() => setLocation('/dashboard')} data-testid="button-back-dashboard">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { project, features, stories, tasks, risks } = data;
  const timelineProgress = getTimelineProgress(project.startDate, project.endDate);
  const milestonePercent = Math.round((project.milestoneProgress || 0) * 100);

  const sections = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'features' as const, label: `Features (${features.length})` },
    { id: 'stories' as const, label: `Stories (${stories.length})` },
    { id: 'tasks' as const, label: `Tasks (${tasks.length})` },
    { id: 'risks' as const, label: `Risks (${risks.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard')} className="mt-1" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 truncate" data-testid="text-project-name">{project.name}</h1>
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-600 text-[10px] gap-1" data-testid="badge-palantir">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                  Palantir Ontology
                </Badge>
              </div>
              <p className="text-gray-500 mt-1 text-sm">{project.description}</p>
            </div>
          </div>

          <nav className="flex gap-1 mt-4 -mb-px overflow-x-auto">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeSection === s.id
                    ? 'bg-gray-50 text-purple-700 border border-gray-200 border-b-gray-50 -mb-px'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`tab-${s.id}`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={Calendar} label="Timeline" value={`${timelineProgress}%`} subtitle={`${formatDate(project.startDate)} — ${formatDate(project.endDate)}`} />
              <MetricCard icon={Target} label="Milestone Progress" value={`${milestonePercent}%`} subtitle={milestonePercent >= 70 ? 'On track' : milestonePercent >= 40 ? 'Progressing' : 'Early stage'} />
              <MetricCard icon={DollarSign} label="Budget" value={project.budgetTotal > 0 ? `$${(project.budgetTotal / 1000000).toFixed(1)}M` : '—'} subtitle={project.budgetTotal > 0 ? `${Math.round((project.budgetSpent / project.budgetTotal) * 100)}% utilized` : 'No budget linked'} />
              <MetricCard icon={BarChart3} label="Budget Spent" value={project.budgetSpent > 0 ? `$${(project.budgetSpent / 1000000).toFixed(1)}M` : '—'} subtitle={project.budgetTotal > 0 ? `$${((project.budgetTotal - project.budgetSpent) / 1000000).toFixed(1)}M remaining` : ''} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Project Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Schedule Progress</span>
                        <span className="font-medium">{timelineProgress}% elapsed</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            timelineProgress > 85 ? 'bg-red-500' : timelineProgress > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${timelineProgress}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Milestone Completion</span>
                        <span className="font-medium">{milestonePercent}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${milestonePercent}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-gray-50 rounded-lg" data-testid="tile-start-date">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                        <p className="font-semibold text-gray-900 mt-1">{formatDate(project.startDate)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg" data-testid="tile-end-date">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Target End</p>
                        <p className="font-semibold text-gray-900 mt-1">{formatDate(project.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    Work Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div data-testid="breakdown-features">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Features</span>
                      <span className="font-medium">{features.filter(f => f.status === 'done' || f.status === 'complete').length} / {features.length}</span>
                    </div>
                    <Progress value={features.length > 0 ? (features.filter(f => f.status === 'done' || f.status === 'complete').length / features.length) * 100 : 0} className="h-2" />
                  </div>
                  <div data-testid="breakdown-stories">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Stories</span>
                      <span className="font-medium">{stories.filter(s => s.status === 'done' || s.status === 'accepted').length} / {stories.length}</span>
                    </div>
                    <Progress value={stories.length > 0 ? (stories.filter(s => s.status === 'done' || s.status === 'accepted').length / stories.length) * 100 : 0} className="h-2" />
                  </div>
                  <div data-testid="breakdown-tasks">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Tasks</span>
                      <span className="font-medium">{tasks.filter(t => t.status === 'done').length} / {tasks.length}</span>
                    </div>
                    <Progress value={tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0} className="h-2" />
                  </div>

                  {risks.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-gray-600">{risks.length} active risk{risks.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="detail-transformation">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Transformation</p>
                <p className="font-semibold text-gray-900 mt-1">{project.transformationName || project.transformationId || '—'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="detail-budget-name">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                <p className="font-semibold text-gray-900 mt-1">{project.budgetName || '—'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="detail-priority">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Priority</p>
                <p className="font-semibold text-gray-900 mt-1 capitalize">{project.priorityText || '—'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="detail-status">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <p className="font-semibold text-gray-900 mt-1">{project.statusText || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'features' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-purple-600" />
                Features ({features.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {features.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No features linked to this project in Palantir.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {features.map(f => (
                    <WorkItemRow
                      key={f.id}
                      name={f.name}
                      status={f.status}
                      priority={f.priority}
                      description={f.description}
                      testId={`feature-${f.id}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === 'stories' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4 text-blue-600" />
                Stories ({stories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stories.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <GitBranch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No stories linked to this project in Palantir.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stories.map(s => (
                    <WorkItemRow
                      key={s.id}
                      name={s.name}
                      status={s.status}
                      description={s.description}
                      testId={`story-${s.id}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === 'tasks' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleDot className="h-4 w-4 text-emerald-600" />
                Tasks ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CircleDot className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No tasks linked to this project in Palantir.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tasks.map(t => (
                    <WorkItemRow
                      key={t.id}
                      name={t.name}
                      status={t.status}
                      priority={t.priority}
                      description={t.description}
                      testId={`task-${t.id}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === 'risks' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-red-600" />
                Risks ({risks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {risks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No risks registered for this project in Palantir.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {risks.map(r => (
                    <div key={r.id} className="p-4 hover:bg-gray-50 transition-colors" data-testid={`risk-${r.id}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          r.severity === 'critical' || r.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{r.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              r.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              r.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{r.severity}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{r.category}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{r.status}</span>
                          </div>
                          {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}