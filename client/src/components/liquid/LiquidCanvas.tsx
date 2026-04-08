import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Text,
  Flex,
  Badge,
  Title,
  type Color,
} from '@tremor/react';
import {
  Layout,
  Filter,
  SortAsc,
  Sparkles,
  Layers,
  Maximize2,
  Minimize2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AgentPacketCard } from './AgentPacketCard';
import { PacketConversation } from './PacketConversation';
import { CanvasSidePanel } from './CanvasSidePanel';
import type {
  AgentUIPacket,
  Severity,
  MemoryCoreBlock,
  MemoryFactsBlock,
  MemoryTimelineBlock,
  MemoryStatsBlock,
} from '@shared/agentUIPacket';

// ============================================================================
// Canvas Scopes — determines what this canvas shows
// ============================================================================

export type CanvasScope =
  | { type: 'agent'; agentId: string }              // Single agent's canvas (e.g., FinOps Canvas)
  | { type: 'executive' }                            // Roll-up of critical packets from all agents
  | { type: 'project'; projectId: string }           // Cross-agent view for one project
  | { type: 'segment'; segmentId: string }           // Business segment roll-up
  | { type: 'custom'; filter: (p: AgentUIPacket) => boolean }; // Arbitrary filter

export type SortMode = 'newest' | 'priority' | 'agent' | 'severity';

export type CanvasLayout = 'grid' | 'stream' | 'columns';

// ============================================================================
// LiquidCanvas — the universal canvas surface
// ============================================================================

interface LiquidCanvasProps {
  /** What this canvas shows */
  scope: CanvasScope;

  /** All available packets (from context/state) */
  packets: AgentUIPacket[];

  /** Canvas title */
  title?: string;
  subtitle?: string;

  /** Layout mode */
  layout?: CanvasLayout;

  /** Callbacks */
  onRefreshPacket?: (packetId: string) => void;
  onDrillDown?: (entityType: string, entityId: string) => void;

  /** Whether to auto-scroll when new packets arrive */
  autoScroll?: boolean;

  /** Max packets to show (newest first) */
  maxPackets?: number;

  /** Side panel config */
  showSidePanel?: boolean;
  agentName?: string;
  agentColor?: string;

  /** Memory data for side panel */
  coreMemory?: MemoryCoreBlock;
  factsData?: MemoryFactsBlock;
  timelineData?: MemoryTimelineBlock;
  statsData?: MemoryStatsBlock;

  className?: string;
}

export function LiquidCanvas({
  scope,
  packets,
  title,
  subtitle,
  layout: initialLayout = 'grid',
  onRefreshPacket,
  onDrillDown,
  autoScroll = false,
  maxPackets = 50,
  showSidePanel = true,
  agentName,
  agentColor,
  coreMemory,
  factsData,
  timelineData,
  statsData,
  className,
}: LiquidCanvasProps) {
  const [layout, setLayout] = useState<CanvasLayout>(initialLayout);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<Severity | null>(null);
  const [expandedView, setExpandedView] = useState(false);
  const [conversingPacket, setConversingPacket] = useState<AgentUIPacket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- Filter packets based on scope ----
  const scopedPackets = useMemo(() => {
    return packets.filter(p => {
      switch (scope.type) {
        case 'agent':
          return p.agentId === scope.agentId;
        case 'executive':
          // Executive sees high-priority + critical insights from all agents
          return (
            (p.layout?.priority ?? 0) >= 7 ||
            p.blocks.some(b =>
              (b.type === 'insight' && (b.severity === 'critical' || b.severity === 'warning')) ||
              b.type === 'recommendation'
            )
          );
        case 'project':
          return p.entityId === scope.projectId;
        case 'segment':
          return p.layout?.section === scope.segmentId;
        case 'custom':
          return scope.filter(p);
      }
    });
  }, [packets, scope]);

  // ---- Apply user filters ----
  const filteredPackets = useMemo(() => {
    let result = scopedPackets;

    if (filterAgent) {
      result = result.filter(p => p.agentId === filterAgent);
    }
    if (filterSeverity) {
      result = result.filter(p =>
        p.blocks.some(b => b.type === 'insight' && b.severity === filterSeverity)
      );
    }

    return result;
  }, [scopedPackets, filterAgent, filterSeverity]);

  // ---- Sort ----
  const sortedPackets = useMemo(() => {
    const sorted = [...filteredPackets];

    switch (sortMode) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'priority':
        sorted.sort((a, b) => (b.layout?.priority ?? 0) - (a.layout?.priority ?? 0));
        break;
      case 'agent':
        sorted.sort((a, b) => a.agentName.localeCompare(b.agentName));
        break;
      case 'severity':
        sorted.sort((a, b) => getSeverityWeight(b) - getSeverityWeight(a));
        break;
    }

    return sorted.slice(0, maxPackets);
  }, [filteredPackets, sortMode, maxPackets]);

  // ---- Unique agents in scope (for filter dropdown) ----
  const agentsInScope = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    scopedPackets.forEach(p => {
      const entry = map.get(p.agentId);
      if (entry) {
        entry.count++;
      } else {
        map.set(p.agentId, { id: p.agentId, name: p.agentName, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [scopedPackets]);

  // ---- Auto-scroll on new packets ----
  const prevCount = useRef(sortedPackets.length);
  useEffect(() => {
    if (autoScroll && sortedPackets.length > prevCount.current && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevCount.current = sortedPackets.length;
  }, [sortedPackets.length, autoScroll]);

  // ---- Layout grid classes ----
  const gridClasses: Record<CanvasLayout, string> = {
    grid: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4',
    stream: 'flex flex-col gap-4 max-w-3xl mx-auto',
    columns: 'columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4',
  };

  // Derive agentId from scope for side panel
  const scopeAgentId = scope.type === 'agent' ? scope.agentId : undefined;

  return (
    <div className={cn(
      'flex h-full',
      expandedView && 'fixed inset-0 z-50 bg-tremor-background p-6',
      className
    )}>
      {/* Main Canvas */}
      <div className="flex flex-col flex-1 min-w-0">
      {/* Canvas Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          {title && <Title className="text-lg">{title}</Title>}
          {subtitle && <Text className="text-tremor-content-subtle">{subtitle}</Text>}
        </div>

        <Flex className="gap-2" alignItems="center">
          {/* Packet count */}
          <Badge color="gray" size="sm">
            {sortedPackets.length} packet{sortedPackets.length !== 1 ? 's' : ''}
          </Badge>

          {/* Agent filter (only for multi-agent canvases) */}
          {scope.type !== 'agent' && agentsInScope.length > 1 && (
            <div className="relative">
              <select
                value={filterAgent || ''}
                onChange={e => setFilterAgent(e.target.value || null)}
                className="appearance-none text-xs border rounded px-2 py-1.5 pr-6 bg-tremor-background cursor-pointer"
              >
                <option value="">All agents</option>
                {agentsInScope.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
            </div>
          )}

          {/* Sort */}
          <div className="relative">
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              className="appearance-none text-xs border rounded px-2 py-1.5 pr-6 bg-tremor-background cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="priority">Priority</option>
              <option value="severity">Severity</option>
              <option value="agent">By Agent</option>
            </select>
            <SortAsc className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
          </div>

          {/* Layout toggle */}
          <div className="flex border rounded overflow-hidden">
            {(['grid', 'stream', 'columns'] as CanvasLayout[]).map(l => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={cn(
                  'px-2 py-1 text-xs transition-colors',
                  layout === l
                    ? 'bg-tremor-brand text-white'
                    : 'hover:bg-tremor-background-subtle'
                )}
              >
                {l === 'grid' ? <Layout className="h-3.5 w-3.5" /> :
                 l === 'stream' ? <Layers className="h-3.5 w-3.5" /> :
                 <Filter className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>

          {/* Expand/collapse */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpandedView(!expandedView)}
          >
            {expandedView ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </Flex>
      </div>

      {/* Canvas Surface */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {sortedPackets.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-tremor-content-subtle mb-3" />
            <Text className="text-lg font-medium mb-1">No agent packets yet</Text>
            <Text className="text-tremor-content-subtle">
              Agents will push insights and visualizations here as they analyze data
            </Text>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className={gridClasses[layout]}>
              {sortedPackets.map((packet) => (
                <motion.div
                  key={packet.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={layout === 'columns' ? 'break-inside-avoid' : ''}
                >
                  <AgentPacketCard
                    packet={packet}
                    onRefresh={onRefreshPacket}
                    onDrillDown={onDrillDown}
                    onConverse={setConversingPacket}
                    compact={layout === 'stream'}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
      </div>

      {/* Packet Conversation Overlay — collaborative dialogue */}
      <AnimatePresence>
        {conversingPacket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-8">
            <PacketConversation
              packet={conversingPacket}
              onClose={() => setConversingPacket(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Side Panel — Memory + AI Chat */}
      {showSidePanel && (
        <CanvasSidePanel
          agentId={scopeAgentId}
          agentName={agentName || title?.replace(' Canvas', '') || 'AI Assistant'}
          agentColor={(agentColor || 'violet') as any}
          coreMemory={coreMemory}
          factsData={factsData}
          timelineData={timelineData}
          statsData={statsData}
          canvasContext={`Viewing ${title || 'dashboard'} with ${sortedPackets.length} active packets`}
          defaultCollapsed={false}
        />
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getSeverityWeight(packet: AgentUIPacket): number {
  let max = 0;
  for (const block of packet.blocks) {
    if (block.type === 'insight') {
      const w = block.severity === 'critical' ? 3 : block.severity === 'warning' ? 2 : block.severity === 'success' ? 0 : 1;
      if (w > max) max = w;
    }
  }
  return max;
}

export default LiquidCanvas;
