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

export const widgetDefinitions: WidgetDefinition[] = [
  {
    id: 'ai-executive-insights',
    name: 'AI Executive Insights',
    description: 'Kyndryl Clarity portfolio insights and strategic recommendations',
    defaultSize: 'full',
    allowedSizes: ['large', 'full'],
    category: 'insights',
    defaultVisible: true,
    tabs: ['overview', 'portfolios'],
    minHeight: 3,
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
    id: 'vro-metrics-summary',
    name: 'VRO Metrics Summary',
    description: 'Key VRO performance indicators',
    defaultSize: 'full',
    allowedSizes: ['medium', 'large', 'full'],
    category: 'metrics',
    defaultVisible: true,
    tabs: ['overview'],
    minHeight: 2,
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
