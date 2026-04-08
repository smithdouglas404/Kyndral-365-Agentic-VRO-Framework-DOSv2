import { useState } from 'react';
import {
  Text,
  Flex,
  Badge,
  type Color,
} from '@tremor/react';
import {
  Brain,
  DollarSign,
  Shield,
  Users,
  ArrowRightLeft,
  Target,
  Scale,
  Map,
  LayoutDashboard,
  Building2,
  FolderKanban,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiquidCanvas, type CanvasScope } from '@/components/liquid';
import { useLiquidCanvas } from '@/contexts/LiquidCanvasContext';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

// ============================================================================
// Canvas Tab Definitions
// ============================================================================

interface CanvasTab {
  id: string;
  label: string;
  icon: LucideIcon;
  color: Color;
  scope: CanvasScope;
  description: string;
}

const canvasTabs: CanvasTab[] = [
  {
    id: 'executive',
    label: 'Executive',
    icon: LayoutDashboard,
    color: 'violet',
    scope: { type: 'executive' },
    description: 'Critical insights and recommendations from all agents',
  },
  {
    id: 'pmo',
    label: 'PMO',
    icon: Brain,
    color: 'violet',
    scope: { type: 'agent', agentId: 'pmo-agent' },
    description: 'Portfolio health, schedules, dependencies',
  },
  {
    id: 'finops',
    label: 'FinOps',
    icon: DollarSign,
    color: 'emerald',
    scope: { type: 'agent', agentId: 'finops-agent' },
    description: 'Budget, cost optimization, ROI tracking',
  },
  {
    id: 'risk',
    label: 'Risk',
    icon: Shield,
    color: 'rose',
    scope: { type: 'agent', agentId: 'risk-agent' },
    description: 'Risk assessment, mitigations, compliance',
  },
  {
    id: 'ocm',
    label: 'OCM',
    icon: Users,
    color: 'cyan',
    scope: { type: 'agent', agentId: 'ocm-agent' },
    description: 'Change readiness, adoption, stakeholder impact',
  },
  {
    id: 'tmo',
    label: 'TMO',
    icon: ArrowRightLeft,
    color: 'blue',
    scope: { type: 'agent', agentId: 'tmo-agent' },
    description: 'Transition management, cutover, go-live',
  },
  {
    id: 'vro',
    label: 'VRO',
    icon: Target,
    color: 'amber',
    scope: { type: 'agent', agentId: 'vro-agent' },
    description: 'Value realization, OKR tracking, benefits',
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: Scale,
    color: 'indigo',
    scope: { type: 'agent', agentId: 'governance-agent' },
    description: 'Policy enforcement, gate reviews, audits',
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: Map,
    color: 'teal',
    scope: { type: 'agent', agentId: 'planning-agent' },
    description: 'Strategic planning, roadmaps, capacity',
  },
];

// ============================================================================
// Liquid Workspace Page
// ============================================================================

export default function LiquidWorkspace() {
  const [activeTab, setActiveTab] = useState('executive');
  const { packets, packetCount } = useLiquidCanvas();
  const { isConnected } = useWebSocketContext();

  const currentTab = canvasTabs.find(t => t.id === activeTab) || canvasTabs[0];

  // Count packets per agent for badge display
  const packetCounts = packets.reduce<Record<string, number>>((acc, p) => {
    acc[p.agentId] = (acc[p.agentId] || 0) + 1;
    return acc;
  }, {});

  // Count executive-level packets
  const executiveCount = packets.filter(p =>
    (p.layout?.priority ?? 0) >= 7 ||
    p.blocks.some(b =>
      (b.type === 'insight' && (b.severity === 'critical' || b.severity === 'warning')) ||
      b.type === 'recommendation'
    )
  ).length;

  return (
    <div className="flex h-full">
      {/* Sidebar — Canvas Tabs */}
      <div className="w-56 shrink-0 border-r border-tremor-border bg-tremor-background-subtle overflow-y-auto">
        <div className="p-4">
          <Flex alignItems="center" className="gap-2 mb-1">
            <Text className="font-semibold text-lg">Canvases</Text>
            <Flex alignItems="center" className="gap-1">
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-rose-500" />
              )}
            </Flex>
          </Flex>
          <Text className="text-xs text-tremor-content-subtle">
            {packetCount} total packets
          </Text>
        </div>

        <nav className="px-2 pb-4 space-y-1">
          {canvasTabs.map(tab => {
            const Icon = tab.icon;
            const count = tab.id === 'executive'
              ? executiveCount
              : packetCounts[`${tab.id}-agent`] || 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150',
                  isActive
                    ? `bg-${tab.color}-100 dark:bg-${tab.color}-900/30 text-${tab.color}-700 dark:text-${tab.color}-300`
                    : 'text-tremor-content hover:bg-tremor-background hover:text-tremor-content-emphasis'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? `text-${tab.color}-600` : 'text-tremor-content-subtle'
                )} />
                <span className="text-sm font-medium flex-1 truncate">{tab.label}</span>
                {count > 0 && (
                  <Badge
                    color={isActive ? tab.color : 'gray'}
                    size="xs"
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}

          {/* Separator */}
          <div className="border-t border-tremor-border my-3" />

          {/* Segment canvases (dynamic) */}
          <Text className="px-3 text-xs font-medium text-tremor-content-subtle uppercase tracking-wide mb-2">
            Segments
          </Text>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-tremor-content hover:bg-tremor-background"
          >
            <Building2 className="h-4 w-4 text-tremor-content-subtle" />
            <span className="text-sm">Enterprise IT</span>
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-tremor-content hover:bg-tremor-background"
          >
            <Building2 className="h-4 w-4 text-tremor-content-subtle" />
            <span className="text-sm">Digital Commerce</span>
          </button>

          {/* Project canvases */}
          <Text className="px-3 text-xs font-medium text-tremor-content-subtle uppercase tracking-wide mb-2 mt-4">
            Projects
          </Text>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-tremor-content hover:bg-tremor-background"
          >
            <FolderKanban className="h-4 w-4 text-tremor-content-subtle" />
            <span className="text-sm">Project Atlas</span>
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-tremor-content hover:bg-tremor-background"
          >
            <FolderKanban className="h-4 w-4 text-tremor-content-subtle" />
            <span className="text-sm">Cloud Migration</span>
          </button>
        </nav>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-6 overflow-hidden">
        <LiquidCanvas
          scope={currentTab.scope}
          packets={packets}
          title={`${currentTab.label} Canvas`}
          subtitle={currentTab.description}
          layout="grid"
          autoScroll
        />
      </div>
    </div>
  );
}
