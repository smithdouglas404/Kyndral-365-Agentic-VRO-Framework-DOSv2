import { ComponentType } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  Clock,
  Target,
  Shield,
  Users,
  Settings,
  TrendingUp,
  FolderKanban,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Sparkles,
  AlertTriangle,
  GitBranch,
  Layers,
  Workflow,
  FileText,
  Database,
  Bot,
  Zap,
  Globe,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type UserRole =
  | 'system_admin'
  | 'tenant_admin'
  | 'executive'
  | 'pmo'
  | 'finops'
  | 'risk'
  | 'ocm'
  | 'tmo'
  | 'vro'
  | 'governance'
  | 'planning'
  | 'viewer';

export type WorkspaceId =
  | 'executive'
  | 'projects'
  | 'finance'
  | 'transformation'
  | 'planning'
  | 'governance'
  | 'change'
  | 'admin';

export type DashboardCategory =
  | 'overview'
  | 'portfolio'
  | 'financial'
  | 'risk'
  | 'analytics'
  | 'agents'
  | 'governance'
  | 'planning';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  roles?: UserRole[];
  isNew?: boolean;
  isAI?: boolean;
}

export interface Workspace {
  id: WorkspaceId;
  label: string;
  shortLabel: string;
  description: string;
  path: string;
  icon: LucideIcon;
  color: string; // Tremor color
  roles: UserRole[];
  defaultWidgets: string[];
  tabs: WorkspaceTab[];
}

export interface WorkspaceTab {
  id: string;
  label: string;
  icon: LucideIcon;
  widgets: string[]; // Default widget IDs for this tab
}

export interface Dashboard {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  category: DashboardCategory;
  roles?: UserRole[];
  isAI?: boolean;
  defaultWidgets: string[];
}

// ============================================================================
// Workspaces Registry
// ============================================================================

export const workspaces: Workspace[] = [
  {
    id: 'executive',
    label: 'Executive',
    shortLabel: 'Exec',
    description: 'Strategic portfolio overview and KPIs',
    path: '/workspace/executive',
    icon: TrendingUp,
    color: 'blue',
    roles: ['executive', 'vro', 'system_admin', 'tenant_admin'],
    defaultWidgets: ['portfolio-status-breakdown', 'vro-metrics-summary', 'ai-insights'],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        widgets: ['portfolio-status-breakdown', 'vro-metrics-summary', 'live-metrics'],
      },
      {
        id: 'portfolio',
        label: 'Portfolio',
        icon: Briefcase,
        widgets: ['palantir-portfolio', 'portfolio-flow-metrics', 'portfolio-strategic-themes'],
      },
      {
        id: 'value',
        label: 'Value Realization',
        icon: Target,
        widgets: ['value-realization-metrics', 'business-case-assessment', 'kpi-attribution'],
      },
      {
        id: 'okrs',
        label: 'OKRs',
        icon: Target,
        widgets: ['okr-objectives-board', 'okr-key-results-progress', 'okr-alignment-matrix'],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        widgets: ['scenario-charts', 'prediction-risk-forecast'],
      },
      {
        id: 'agents',
        label: 'AI Agents',
        icon: Bot,
        widgets: ['agent-action-queue', 'agent-feed', 'multi-agent-discussion'],
      },
    ],
  },
  {
    id: 'projects',
    label: 'Project Management',
    shortLabel: 'Projects',
    description: 'Project delivery and task management',
    path: '/workspace/pm',
    icon: FolderKanban,
    color: 'emerald',
    roles: ['pmo', 'vro', 'risk', 'system_admin'],
    defaultWidgets: ['live-project-status', 'dependency-graph'],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        widgets: ['live-project-status', 'portfolio-status-breakdown'],
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: FolderKanban,
        widgets: ['palantir-portfolio', 'project-lifecycle'],
      },
      {
        id: 'dependencies',
        label: 'Dependencies',
        icon: GitBranch,
        widgets: ['dependency-graph'],
      },
      {
        id: 'risks',
        label: 'Risks',
        icon: AlertTriangle,
        widgets: ['governance-risk-categories', 'prediction-risk-forecast'],
      },
    ],
  },
  {
    id: 'finance',
    label: 'FinOps',
    shortLabel: 'Finance',
    description: 'Financial operations and budget tracking',
    path: '/workspace/finops',
    icon: DollarSign,
    color: 'amber',
    roles: ['finops', 'vro', 'system_admin'],
    defaultWidgets: ['finops-budget-overview', 'finops-cost-categories', 'finops-evm-metrics'],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        widgets: ['finops-budget-overview', 'finops-evm-metrics'],
      },
      {
        id: 'budget',
        label: 'Budget',
        icon: DollarSign,
        widgets: ['finops-budget-overview', 'finops-cost-categories'],
      },
      {
        id: 'savings',
        label: 'Savings',
        icon: Zap,
        widgets: ['finops-savings-opportunities'],
      },
      {
        id: 'forecasts',
        label: 'Forecasts',
        icon: TrendingUp,
        widgets: ['finops-evm-metrics', 'scenario-charts'],
      },
    ],
  },
  {
    id: 'transformation',
    label: 'Transformation',
    shortLabel: 'TMO',
    description: 'Technology and organizational transformation',
    path: '/workspace/tmo',
    icon: RefreshCw,
    color: 'violet',
    roles: ['tmo', 'ocm', 'system_admin'],
    defaultWidgets: ['tmo-adoption-metrics', 'tmo-change-initiatives'],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        widgets: ['tmo-adoption-metrics', 'tmo-change-initiatives'],
      },
      {
        id: 'adoption',
        label: 'Adoption',
        icon: Users,
        widgets: ['tmo-adoption-metrics'],
      },
      {
        id: 'initiatives',
        label: 'Initiatives',
        icon: Layers,
        widgets: ['tmo-change-initiatives'],
      },
      {
        id: 'integration',
        label: 'Integration',
        icon: Workflow,
        widgets: ['tmo-integration-status', 'mcp-connection-status'],
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    shortLabel: 'Plan',
    description: 'Strategic planning and roadmaps',
    path: '/workspace/planning',
    icon: Calendar,
    color: 'cyan',
    roles: ['planning', 'tmo', 'pmo', 'system_admin'],
    defaultWidgets: ['planning-milestones', 'planning-roadmap'],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        widgets: ['planning-milestones', 'planning-resource-allocation'],
      },
      {
        id: 'roadmap',
        label: 'Roadmap',
        icon: Calendar,
        widgets: ['planning-roadmap'],
      },
      {
        id: 'resources',
        label: 'Resources',
        icon: Users,
        widgets: ['planning-resource-allocation'],
      },
      {
        id: 'safe',
        label: 'SAFe',
        icon: GitBranch,
        widgets: ['art-pi-objectives', 'art-predictability', 'art-dora-metrics'],
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    shortLabel: 'Gov',
    description: 'Compliance, approvals, and risk management',
    path: '/workspace/governance',
    icon: Shield,
    color: 'rose',
    roles: ['governance', 'risk', 'system_admin'],
    defaultWidgets: ['governance-queue', 'governance-risk-categories', 'governance-compliance-status'],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        widgets: ['governance-queue', 'governance-compliance-status'],
      },
      {
        id: 'approvals',
        label: 'Approvals',
        icon: FileText,
        widgets: ['governance-queue', 'decision-queue'],
      },
      {
        id: 'risk',
        label: 'Risk',
        icon: AlertTriangle,
        widgets: ['governance-risk-categories', 'autonomous-risk-agent'],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        icon: Shield,
        widgets: ['governance-compliance-status'],
      },
    ],
  },
  {
    id: 'change',
    label: 'Change Management',
    shortLabel: 'OCM',
    description: 'Organizational change and adoption',
    path: '/workspace/ocm',
    icon: Users,
    color: 'orange',
    roles: ['ocm', 'tmo', 'system_admin'],
    defaultWidgets: ['ocm-change-readiness', 'ocm-stakeholder-groups', 'ocm-adoption-metrics'],
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        widgets: ['ocm-change-readiness', 'ocm-adoption-metrics'],
      },
      {
        id: 'readiness',
        label: 'Readiness',
        icon: Activity,
        widgets: ['ocm-change-readiness'],
      },
      {
        id: 'stakeholders',
        label: 'Stakeholders',
        icon: Users,
        widgets: ['ocm-stakeholder-groups'],
      },
      {
        id: 'training',
        label: 'Training',
        icon: Target,
        widgets: ['ocm-training-progress'],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    shortLabel: 'Admin',
    description: 'System configuration and user management',
    path: '/workspace/admin',
    icon: Settings,
    color: 'slate',
    roles: ['system_admin', 'tenant_admin', 'governance'],
    defaultWidgets: [],
    tabs: [
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        widgets: [],
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: Workflow,
        widgets: ['mcp-connection-status'],
      },
      {
        id: 'agents',
        label: 'Agents',
        icon: Bot,
        widgets: ['agent-command-center'],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        widgets: [],
      },
    ],
  },
];

// ============================================================================
// AI/Analytics Dashboards
// ============================================================================

export const dashboards: Dashboard[] = [
  {
    id: 'cop',
    label: 'Common Operational Picture',
    description: 'Unified view across all portfolios',
    path: '/cop',
    icon: Globe,
    category: 'overview',
    defaultWidgets: ['unified-metrics', 'palantir-portfolio', 'agent-feed'],
  },
  {
    id: 'portfolio',
    label: 'Portfolio Dashboard',
    description: 'LPM-level portfolio insights',
    path: '/dashboard/portfolio',
    icon: Briefcase,
    category: 'portfolio',
    defaultWidgets: ['portfolio-flow-metrics', 'portfolio-strategic-themes', 'portfolio-wsjf'],
  },
  {
    id: 'art',
    label: 'ART Dashboard',
    description: 'Agile Release Train metrics',
    path: '/dashboard/art',
    icon: GitBranch,
    category: 'portfolio',
    defaultWidgets: ['art-predictability', 'art-pi-objectives', 'art-dora-metrics'],
  },
  {
    id: 'value-stream',
    label: 'Value Stream',
    description: 'End-to-end value flow',
    path: '/dashboard/value-stream',
    icon: Workflow,
    category: 'portfolio',
    defaultWidgets: ['value-stream-lead-time', 'value-stream-map'],
  },
  {
    id: 'predictions',
    label: 'Predictions Hub',
    description: 'AI-powered forecasts',
    path: '/dashboard/predictions',
    icon: Brain,
    category: 'analytics',
    isAI: true,
    defaultWidgets: ['prediction-risk-forecast', 'scenario-charts'],
  },
  {
    id: 'finops',
    label: 'FinOps Intelligence',
    description: 'Financial analytics center',
    path: '/dashboard/finops',
    icon: DollarSign,
    category: 'financial',
    defaultWidgets: ['finops-budget-overview', 'finops-cost-categories', 'finops-savings-opportunities'],
  },
  {
    id: 'risk',
    label: 'Risk Center',
    description: 'Comprehensive risk management',
    path: '/risk',
    icon: AlertTriangle,
    category: 'risk',
    defaultWidgets: ['governance-risk-categories', 'autonomous-risk-agent', 'prediction-risk-forecast'],
  },
  {
    id: 'agent-command',
    label: 'Agent Command Center',
    description: 'AI agent orchestration',
    path: '/command-center',
    icon: Bot,
    category: 'agents',
    isAI: true,
    defaultWidgets: ['agent-command-center', 'agent-action-queue', 'cross-agent-collaboration'],
  },
  {
    id: 'liquid-canvas',
    label: 'Liquid Canvas',
    description: 'AI-powered collaborative canvas — agents push insights, users reshape',
    path: '/canvas',
    icon: Sparkles,
    category: 'agents',
    isAI: true,
    defaultWidgets: [],
  },
  {
    id: 'dependencies',
    label: 'Dependency Map',
    description: 'Cross-project dependencies',
    path: '/dashboard/dependencies',
    icon: GitBranch,
    category: 'portfolio',
    defaultWidgets: ['dependency-graph'],
  },
  {
    id: 'decisions',
    label: 'Decision Board',
    description: 'Governance decisions',
    path: '/dashboard/decisions',
    icon: FileText,
    category: 'governance',
    defaultWidgets: ['decision-queue', 'governance-queue'],
  },
];

// ============================================================================
// Quick Actions
// ============================================================================

export const quickActions: NavItem[] = [
  {
    id: 'ai-widget',
    label: 'Create AI Widget',
    path: '#ai-widget',
    icon: Sparkles,
    description: 'Generate a custom widget with AI',
    isAI: true,
  },
  {
    id: 'add-widget',
    label: 'Add Widget',
    path: '#add-widget',
    icon: PieChart,
    description: 'Browse widget catalog',
  },
  {
    id: 'share',
    label: 'Share Dashboard',
    path: '#share',
    icon: Globe,
    description: 'Create shareable link',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getWorkspaceById(id: WorkspaceId): Workspace | undefined {
  return workspaces.find(w => w.id === id);
}

export function getWorkspacesForRole(role: UserRole): Workspace[] {
  return workspaces.filter(w => w.roles.includes(role) || role === 'system_admin');
}

export function getDashboardById(id: string): Dashboard | undefined {
  return dashboards.find(d => d.id === id);
}

export function getDashboardsByCategory(category: DashboardCategory): Dashboard[] {
  return dashboards.filter(d => d.category === category);
}

export function getAIDashboards(): Dashboard[] {
  return dashboards.filter(d => d.isAI);
}

export function getWorkspaceFromPath(path: string): Workspace | undefined {
  return workspaces.find(w => path.startsWith(w.path));
}

export function getDashboardFromPath(path: string): Dashboard | undefined {
  return dashboards.find(d => path === d.path);
}

// Get all navigation items for global search
export function getAllNavigationItems(): NavItem[] {
  const items: NavItem[] = [];

  workspaces.forEach(w => {
    items.push({
      id: `workspace-${w.id}`,
      label: w.label,
      path: w.path,
      icon: w.icon,
      description: w.description,
    });
  });

  dashboards.forEach(d => {
    items.push({
      id: `dashboard-${d.id}`,
      label: d.label,
      path: d.path,
      icon: d.icon,
      description: d.description,
      isAI: d.isAI,
    });
  });

  return items;
}

// Dashboard categories for grouping
export const dashboardCategories: { id: DashboardCategory; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'risk', label: 'Risk', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'governance', label: 'Governance', icon: Shield },
  { id: 'planning', label: 'Planning', icon: Calendar },
];
