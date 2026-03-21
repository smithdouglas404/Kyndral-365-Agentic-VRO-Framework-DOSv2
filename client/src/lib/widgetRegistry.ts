import { ComponentType, lazy } from 'react';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  defaultSize: WidgetSize;
  allowedSizes: WidgetSize[];
  category: 'insights' | 'metrics' | 'segments' | 'agents' | 'charts';
  defaultVisible: boolean;
  tabs: string[];
  minHeight?: number;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  static?: boolean;
}

export interface DashboardConfig {
  layouts: {
    lg: WidgetLayout[];
    md: WidgetLayout[];
    sm: WidgetLayout[];
  };
  visibleWidgets: string[];
  widgetSizes: Record<string, WidgetSize>;
}

export const sizeToGrid: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 9, h: 4 },
  full: { w: 12, h: 4 },
};

export type DashboardMode = 'custom' | 'dynamic';

export const widgetDefinitions: WidgetDefinition[] = [
  {
    id: 'portfolio-status-breakdown',
    name: 'Portfolio Status Breakdown',
    description: 'Status distribution of all projects from Palantir (In Progress, At Risk, Planning, etc.)',
    defaultSize: 'full',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['overview'],
    minHeight: 1,
  },
  {
    id: 'palantir-portfolio',
    name: 'Palantir Portfolio',
    description: 'Project cards from Palantir Ontology with status, dates, and descriptions',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'insights',
    defaultVisible: true,
    tabs: ['overview', 'portfolios'],
    minHeight: 3,
  },
  {
    id: 'vro-metrics-summary',
    name: 'Portfolio Metrics',
    description: 'Key portfolio metrics from Palantir (projects, budget, risks)',
    defaultSize: 'full',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['overview'],
    minHeight: 2,
  },
  {
    id: 'agent-action-queue',
    name: 'Agent Action Queue',
    description: 'HITL dashboard for agent recommendations and approvals',
    defaultSize: 'full',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'agents',
    defaultVisible: true,
    tabs: ['overview', 'agents'],
    minHeight: 3,
  },
  {
    id: 'value-realization-metrics',
    name: 'Value Realization Metrics',
    description: 'Agent-calculated value tracking (planned vs actual vs leakage)',
    defaultSize: 'full',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['overview', 'value-tracking'],
    minHeight: 2,
  },
  {
    id: 'unified-metrics',
    name: 'Unified Metrics',
    description: 'VRO and PMO metrics in a unified view',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['overview'],
    minHeight: 4,
  },
  {
    id: 'segment-cards',
    name: 'Segment Performance',
    description: 'Reportable segments overview (Regional Utility, Renewables Division, Corporate)',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'segments',
    defaultVisible: true,
    tabs: ['portfolios'],
    minHeight: 2,
  },
  {
    id: 'scenario-charts',
    name: 'Scenario Analysis Charts',
    description: 'Interactive scenario analysis and what-if modeling',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'charts',
    defaultVisible: true,
    tabs: ['scenarios'],
    minHeight: 4,
  },
  {
    id: 'business-case-assessment',
    name: 'Business Case Assessment',
    description: 'Project business case validation and scoring',
    defaultSize: 'large',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'insights',
    defaultVisible: true,
    tabs: ['value-tracking'],
    minHeight: 3,
  },
  {
    id: 'kpi-attribution',
    name: 'KPI Attribution Panel',
    description: 'Track KPI contributions and attribution',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['value-tracking'],
    minHeight: 2,
  },
  {
    id: 'autonomous-risk-agent',
    name: 'Autonomous Risk Agent',
    description: 'AI-powered risk monitoring and mitigation',
    defaultSize: 'large',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'agents',
    defaultVisible: true,
    tabs: ['agents'],
    minHeight: 3,
  },
  {
    id: 'multi-agent-discussion',
    name: 'Multi-Agent Discussion',
    description: 'Cross-functional AI agent collaboration',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'agents',
    defaultVisible: true,
    tabs: ['agents'],
    minHeight: 4,
  },
  {
    id: 'agent-command-center',
    name: 'Agent Command Center',
    description: 'Central hub for AI agent orchestration',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'agents',
    defaultVisible: true,
    tabs: ['agents'],
    minHeight: 4,
  },
  {
    id: 'cross-agent-collaboration',
    name: 'Cross-Agent Collaboration',
    description: 'Inter-agent communication and task coordination',
    defaultSize: 'large',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'agents',
    defaultVisible: false,
    tabs: ['agents'],
    minHeight: 3,
  },
  {
    id: 'project-lifecycle',
    name: 'Project Lifecycle Command Center',
    description: 'End-to-end project lifecycle management',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'insights',
    defaultVisible: true,
    tabs: ['projects'],
    minHeight: 4,
  },
  {
    id: 'action-audit-timeline',
    name: 'Action Audit Timeline',
    description: 'Historical audit trail of agent actions',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    category: 'agents',
    defaultVisible: false,
    tabs: ['agents'],
    minHeight: 2,
  },
  // SAFe Portfolio Dashboards
  {
    id: 'portfolio-flow-metrics',
    name: 'Portfolio Flow Metrics',
    description: 'Portfolio-level flow time, efficiency, load, and velocity from Planning agent',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['portfolio'],
    minHeight: 2,
  },
  {
    id: 'portfolio-strategic-themes',
    name: 'Strategic Themes',
    description: 'Strategic theme progress and status from Planning agent',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['portfolio'],
    minHeight: 2,
  },
  {
    id: 'portfolio-wsjf',
    name: 'WSJF Prioritization',
    description: 'Weighted Shortest Job First prioritization from VRO agent',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['portfolio'],
    minHeight: 3,
  },
  {
    id: 'portfolio-investment-horizons',
    name: 'Investment Horizons',
    description: 'Investment allocation across horizons from FinOps agent',
    defaultSize: 'large',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['portfolio'],
    minHeight: 3,
  },
  // ART Dashboards
  {
    id: 'art-predictability',
    name: 'ART PI Predictability',
    description: 'Agile Release Train PI delivery predictability from PMO agent',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['art'],
    minHeight: 2,
  },
  {
    id: 'art-pi-objectives',
    name: 'PI Objectives Board',
    description: 'Program Increment objectives board from Planning agent',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['art'],
    minHeight: 3,
  },
  {
    id: 'art-dora-metrics',
    name: 'DORA Metrics',
    description: 'DevOps Research & Assessment metrics from PMO agent',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['art'],
    minHeight: 2,
  },
  // Value Stream Dashboards
  {
    id: 'value-stream-lead-time',
    name: 'Value Stream Lead Time',
    description: 'Value stream cycle time and efficiency from PMO agent',
    defaultSize: 'medium',
    allowedSizes: ['small', 'medium', 'large'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['value-stream'],
    minHeight: 2,
  },
  {
    id: 'value-stream-map',
    name: 'Value Stream Map',
    description: 'End-to-end value stream flow visualization from PMO agent',
    defaultSize: 'large',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'charts',
    defaultVisible: true,
    tabs: ['value-stream'],
    minHeight: 4,
  },
  // MCP Management Dashboards
  {
    id: 'mcp-connection-status',
    name: 'MCP Connection Status',
    description: 'Model Context Protocol connection management and status',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'agents',
    defaultVisible: true,
    tabs: ['mcp'],
    minHeight: 3,
  },
  // Prediction Hub Dashboards
  {
    id: 'prediction-risk-forecast',
    name: 'Risk Forecasts',
    description: '14-day ahead risk predictions from Risk agent',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['predictions'],
    minHeight: 3,
  },
  // Dependency Map Dashboards
  {
    id: 'dependency-graph',
    name: 'Dependency Graph',
    description: 'Cross-project dependency tracking from Planning agent',
    defaultSize: 'full',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'charts',
    defaultVisible: true,
    tabs: ['dependencies'],
    minHeight: 3,
  },
  // Decision Board Dashboards
  {
    id: 'decision-queue',
    name: 'Decision & Action Queue',
    description: 'Governance decisions and auto-approvals from Governance agent',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['decisions'],
    minHeight: 3,
  },
  // PPM Live Dashboard Widgets
  {
    id: 'live-metrics',
    name: 'Live Portfolio Metrics',
    description: 'Real-time portfolio metrics with WebSocket updates from Palantir',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['ppm', 'overview'],
    minHeight: 3,
  },
  {
    id: 'agent-feed',
    name: 'Agent Activity Feed',
    description: 'Real-time activity feed showing agent updates, insights, and actions',
    defaultSize: 'large',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'agents',
    defaultVisible: true,
    tabs: ['ppm', 'agents'],
    minHeight: 4,
  },
  {
    id: 'live-project-status',
    name: 'Live Project Status',
    description: 'Project cards with real-time status updates from Palantir',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'insights',
    defaultVisible: true,
    tabs: ['ppm', 'overview', 'portfolios'],
    minHeight: 4,
  },
];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return widgetDefinitions.find(w => w.id === id);
}

export function getWidgetsForTab(tab: string): WidgetDefinition[] {
  return widgetDefinitions.filter(w => w.tabs.includes(tab));
}

export function getDefaultLayout(tab: string): WidgetLayout[] {
  const widgets = getWidgetsForTab(tab).filter(w => w.defaultVisible);
  let y = 0;
  
  return widgets.map(widget => {
    const size = sizeToGrid[widget.defaultSize];
    const layout: WidgetLayout = {
      i: widget.id,
      x: 0,
      y,
      w: size.w,
      h: size.h,
      minH: widget.minHeight || 2,
    };
    y += size.h;
    return layout;
  });
}

export function getDefaultConfig(): DashboardConfig {
  const visibleWidgets = widgetDefinitions
    .filter(w => w.defaultVisible)
    .map(w => w.id);
  
  const widgetSizes: Record<string, WidgetSize> = {};
  widgetDefinitions.forEach(w => {
    widgetSizes[w.id] = w.defaultSize;
  });

  return {
    layouts: {
      lg: getDefaultLayout('overview'),
      md: getDefaultLayout('overview'),
      sm: getDefaultLayout('overview'),
    },
    visibleWidgets,
    widgetSizes,
  };
}

const STORAGE_KEY = 'nextera-dashboard-config';

export function loadDashboardConfig(): DashboardConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load dashboard config:', e);
  }
  return getDefaultConfig();
}

export function saveDashboardConfig(config: DashboardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save dashboard config:', e);
  }
}

export function resetDashboardConfig(): DashboardConfig {
  localStorage.removeItem(STORAGE_KEY);
  return getDefaultConfig();
}
