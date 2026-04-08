/**
 * PPM Canvas View
 *
 * Infinite workspace showing the 8 REAL Deep Agents:
 * - FinOps, TMO, PMO, VRO, Risk, Governance, OCM, Planning
 *
 * Connected to real Palantir data via PPMAgentContext.
 */

import { useState, useRef, useCallback, useEffect, useMemo, type ReactNode, type MouseEvent } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  GripVertical,
  X,
  Pin,
  PinOff,
  Bot,
  MessageSquare,
  TrendingUp,
  Shield,
  DollarSign,
  Users,
  MoreVertical,
  Plus,
  Minus,
  Gauge,
  Target,
  GitBranch,
  Activity,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Card, Text, Badge, Flex } from '@tremor/react';
import { usePPMAgents, type RealAgent } from '@/contexts/PPMAgentContext';

// ============================================================================
// Types
// ============================================================================

interface Position {
  x: number;
  y: number;
}

interface CanvasNode {
  id: string;
  agentId: string;
  position: Position;
  pinned: boolean;
}

interface CanvasConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  type?: 'data' | 'handoff' | 'subscription';
}

// ============================================================================
// Agent Icon Mapping
// ============================================================================

const AGENT_ICONS: Record<string, typeof Bot> = {
  finops: DollarSign,
  tmo: Calendar,
  pmo: Target,
  vro: TrendingUp,
  risk: Shield,
  governance: Users,
  ocm: Activity,
  planning: GitBranch,
};

const AGENT_COLORS: Record<string, string> = {
  finops: 'emerald',
  tmo: 'blue',
  pmo: 'violet',
  vro: 'amber',
  risk: 'rose',
  governance: 'indigo',
  ocm: 'cyan',
  planning: 'orange',
};

// ============================================================================
// Default Layout - All 8 agents in a meaningful arrangement
// ============================================================================

const DEFAULT_LAYOUT: CanvasNode[] = [
  // Row 1: Strategic agents
  { id: 'node-vro', agentId: 'vro', position: { x: 100, y: 80 }, pinned: true },
  { id: 'node-pmo', agentId: 'pmo', position: { x: 400, y: 80 }, pinned: true },
  { id: 'node-governance', agentId: 'governance', position: { x: 700, y: 80 }, pinned: true },

  // Row 2: Operational agents
  { id: 'node-finops', agentId: 'finops', position: { x: 100, y: 280 }, pinned: false },
  { id: 'node-risk', agentId: 'risk', position: { x: 400, y: 280 }, pinned: false },
  { id: 'node-tmo', agentId: 'tmo', position: { x: 700, y: 280 }, pinned: false },

  // Row 3: Supporting agents
  { id: 'node-planning', agentId: 'planning', position: { x: 250, y: 480 }, pinned: false },
  { id: 'node-ocm', agentId: 'ocm', position: { x: 550, y: 480 }, pinned: false },
];

// Agent fact subscription connections
const DEFAULT_CONNECTIONS: CanvasConnection[] = [
  // PMO subscribes to health from multiple agents
  { id: 'conn-1', from: 'node-finops', to: 'node-pmo', type: 'subscription', label: 'budget_status' },
  { id: 'conn-2', from: 'node-risk', to: 'node-pmo', type: 'subscription', label: 'risk_score' },
  { id: 'conn-3', from: 'node-tmo', to: 'node-pmo', type: 'subscription', label: 'schedule_variance' },

  // VRO gets value data
  { id: 'conn-4', from: 'node-pmo', to: 'node-vro', type: 'data', label: 'project_health' },
  { id: 'conn-5', from: 'node-finops', to: 'node-vro', type: 'data', label: 'roi_data' },

  // Governance tracks compliance
  { id: 'conn-6', from: 'node-pmo', to: 'node-governance', type: 'handoff', label: 'approval_requests' },

  // Planning coordinates
  { id: 'conn-7', from: 'node-tmo', to: 'node-planning', type: 'subscription', label: 'dependencies' },
  { id: 'conn-8', from: 'node-planning', to: 'node-risk', type: 'data', label: 'blocked_work' },

  // OCM tracks change
  { id: 'conn-9', from: 'node-pmo', to: 'node-ocm', type: 'subscription', label: 'change_events' },
];

// ============================================================================
// Agent Node Component - Shows REAL agent data
// ============================================================================

interface AgentNodeProps {
  node: CanvasNode;
  agent: RealAgent | undefined;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: MouseEvent) => void;
  onTogglePin: () => void;
  onChat: () => void;
  projectCount: number;
  riskCount: number;
}

function AgentNode({
  node,
  agent,
  selected,
  onSelect,
  onDragStart,
  onTogglePin,
  onChat,
  projectCount,
  riskCount,
}: AgentNodeProps) {
  const Icon = AGENT_ICONS[node.agentId] || Bot;
  const color = AGENT_COLORS[node.agentId] || 'gray';

  if (!agent) {
    return (
      <div
        className="absolute w-64 rounded-xl border-2 bg-tremor-background shadow-lg p-4"
        style={{ left: node.position.x, top: node.position.y }}
      >
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  const statusColors = {
    active: 'bg-emerald-500',
    processing: 'bg-amber-500 animate-pulse',
    idle: 'bg-gray-400',
    error: 'bg-rose-500',
  };

  return (
    <div
      className={cn(
        'absolute w-72 rounded-xl border-2 bg-tremor-background shadow-lg transition-shadow cursor-move select-none',
        `border-${color}-500/30`,
        selected && 'ring-2 ring-tremor-brand ring-offset-2',
        node.pinned && 'border-dashed'
      )}
      style={{ left: node.position.x, top: node.position.y }}
      onClick={onSelect}
      onMouseDown={onDragStart}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 border-b border-tremor-border rounded-t-xl', `bg-${color}-500/5`)}>
        <Flex justifyContent="between" alignItems="start">
          <Flex alignItems="center" className="gap-3">
            <div className="relative">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', `bg-${color}-500/10`)}>
                <Icon className={cn('h-5 w-5', `text-${color}-600`)} />
              </div>
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-tremor-background',
                  statusColors[agent.status]
                )}
              />
            </div>
            <div>
              <Text className="font-semibold text-sm">{agent.name}</Text>
              <Text className="text-xs text-tremor-content-subtle capitalize">{agent.status}</Text>
            </div>
          </Flex>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onChat}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePin}>
                {node.pinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin to Canvas
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <Text className="text-xs text-tremor-content-subtle line-clamp-2">{agent.description}</Text>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <Badge key={cap} color="gray" size="xs">
              {cap.replace(/_/g, ' ')}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge color="gray" size="xs">+{agent.capabilities.length - 3}</Badge>
          )}
        </div>

        {/* Context-specific stats */}
        <Flex className="gap-2 pt-2 border-t border-tremor-border">
          <div className="flex-1 text-center">
            <Text className="text-lg font-bold">{projectCount}</Text>
            <Text className="text-xs text-tremor-content-subtle">Projects</Text>
          </div>
          {node.agentId === 'risk' && (
            <div className="flex-1 text-center">
              <Text className="text-lg font-bold text-rose-600">{riskCount}</Text>
              <Text className="text-xs text-tremor-content-subtle">Active Risks</Text>
            </div>
          )}
        </Flex>

        <Button variant="outline" size="sm" className="w-full" onClick={onChat}>
          <MessageSquare className="h-3 w-3 mr-2" />
          Ask {agent.name.split(' ')[0]}
        </Button>
      </div>

      {/* Pin indicator */}
      {node.pinned && (
        <div className="absolute -top-2 -right-2">
          <div className="h-6 w-6 rounded-full bg-tremor-brand flex items-center justify-center">
            <Pin className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Connection Line Component
// ============================================================================

interface ConnectionLineProps {
  from: Position;
  to: Position;
  type?: 'data' | 'handoff' | 'subscription';
  label?: string;
}

function ConnectionLine({ from, to, type = 'data', label }: ConnectionLineProps) {
  const fromX = from.x + 144; // Center of 288px wide node
  const fromY = from.y + 180; // Bottom of node
  const toX = to.x + 144;
  const toY = to.y;

  const midY = (fromY + toY) / 2;
  const path = `M ${fromX} ${fromY} C ${fromX} ${midY} ${toX} ${midY} ${toX} ${toY}`;

  const colors = {
    data: 'stroke-emerald-500',
    handoff: 'stroke-amber-500',
    subscription: 'stroke-blue-400',
  };

  const dashes = {
    data: '',
    handoff: '5,5',
    subscription: '2,4',
  };

  return (
    <g>
      <path
        d={path}
        fill="none"
        className={cn('transition-all', colors[type])}
        strokeWidth={2}
        strokeDasharray={dashes[type]}
        strokeLinecap="round"
        opacity={0.6}
      />
      {label && (
        <text
          x={(fromX + toX) / 2}
          y={midY}
          textAnchor="middle"
          className="fill-tremor-content-subtle text-[10px]"
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ============================================================================
// Zoom Controls
// ============================================================================

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-tremor-background rounded-lg shadow-lg border border-tremor-border p-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
        <Minus className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="px-2 min-w-[4rem]" onClick={onReset}>
        {Math.round(zoom * 100)}%
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
        <Plus className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-tremor-border" />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onReset}>
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// Legend
// ============================================================================

function CanvasLegend() {
  return (
    <div className="absolute top-4 left-4 bg-tremor-background/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-tremor-border">
      <Text className="text-xs font-medium mb-2">Agent Connections</Text>
      <div className="space-y-1">
        <Flex alignItems="center" className="gap-2">
          <div className="w-6 h-0.5 bg-emerald-500" />
          <Text className="text-xs">Data flow</Text>
        </Flex>
        <Flex alignItems="center" className="gap-2">
          <div className="w-6 h-0.5 bg-amber-500 border-dashed" style={{ borderTopWidth: 2, borderStyle: 'dashed' }} />
          <Text className="text-xs">Handoff</Text>
        </Flex>
        <Flex alignItems="center" className="gap-2">
          <div className="w-6 h-0.5 bg-blue-400" style={{ borderTopWidth: 2, borderStyle: 'dotted' }} />
          <Text className="text-xs">Subscription</Text>
        </Flex>
      </div>
    </div>
  );
}

// ============================================================================
// Main Canvas Component - Using REAL Agent Data
// ============================================================================

interface PPMCanvasProps {
  onAgentChat?: (agentId: string) => void;
}

export function PPMCanvas({ onAgentChat }: PPMCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get REAL agent and project data
  const { agents, projects, risks, isLoadingAgents, isLoadingProjects } = usePPMAgents();

  const [nodes, setNodes] = useState<CanvasNode[]>(DEFAULT_LAYOUT);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  // Handle node dragging
  const handleNodeDragStart = useCallback(
    (nodeId: string, e: MouseEvent) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.pinned) return;

      setIsDragging(true);
      setSelectedNode(nodeId);
      setDragOffset({
        x: e.clientX - node.position.x * zoom - pan.x,
        y: e.clientY - node.position.y * zoom - pan.y,
      });
    },
    [nodes, zoom, pan]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && selectedNode) {
        const newX = (e.clientX - dragOffset.x - pan.x) / zoom;
        const newY = (e.clientY - dragOffset.y - pan.y) / zoom;

        setNodes((prev) =>
          prev.map((node) =>
            node.id === selectedNode ? { ...node, position: { x: newX, y: newY } } : node
          )
        );
      } else if (isPanning) {
        setPan((prev) => ({
          x: prev.x + (e.clientX - panStart.x),
          y: prev.y + (e.clientY - panStart.y),
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, selectedNode, dragOffset, zoom, pan, isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  const handleCanvasMouseDown = useCallback((e: MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
    }
  }, []);

  const handleZoomIn = useCallback(() => setZoom((prev) => Math.min(prev + 0.1, 2)), []);
  const handleZoomOut = useCallback(() => setZoom((prev) => Math.max(prev - 0.1, 0.5)), []);
  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 2));
  }, []);

  const handleTogglePin = useCallback((nodeId: string) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, pinned: !node.pinned } : node))
    );
  }, []);

  const handleChatWithAgent = useCallback(
    (agentId: string) => {
      onAgentChat?.(agentId);
    },
    [onAgentChat]
  );

  const getAgent = useCallback(
    (agentId: string) => agents.find((a) => a.id === agentId),
    [agents]
  );

  const isLoading = isLoadingAgents || isLoadingProjects;

  return (
    <div
      ref={canvasRef}
      className="relative h-full bg-tremor-background-subtle overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern
            id="grid"
            width={40 * zoom}
            height={40 * zoom}
            patternUnits="userSpaceOnUse"
            x={pan.x % (40 * zoom)}
            y={pan.y % (40 * zoom)}
          >
            <circle cx={1} cy={1} r={1} fill="currentColor" className="text-tremor-border" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Canvas content */}
      <div
        className="relative"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: 1200, height: 800 }}>
          {DEFAULT_CONNECTIONS.map((conn) => {
            const fromNode = nodes.find((n) => n.id === conn.from);
            const toNode = nodes.find((n) => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            return (
              <ConnectionLine
                key={conn.id}
                from={fromNode.position}
                to={toNode.position}
                type={conn.type}
                label={conn.label}
              />
            );
          })}
        </svg>

        {/* Agent Nodes - Using REAL agents */}
        {nodes.map((node) => (
          <AgentNode
            key={node.id}
            node={node}
            agent={getAgent(node.agentId)}
            selected={selectedNode === node.id}
            onSelect={() => setSelectedNode(node.id)}
            onDragStart={(e) => handleNodeDragStart(node.id, e)}
            onTogglePin={() => handleTogglePin(node.id)}
            onChat={() => handleChatWithAgent(node.agentId)}
            projectCount={projects.length}
            riskCount={risks.length}
          />
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-tremor-background/50 flex items-center justify-center">
          <div className="bg-tremor-background rounded-lg p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <Text>Loading agents...</Text>
          </div>
        </div>
      )}

      {/* Controls */}
      <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleZoomReset} />
      <CanvasLegend />
    </div>
  );
}

export default PPMCanvas;
