import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow, ReactFlowProvider, Controls, MiniMap, Background, BackgroundVariant,
  useNodesState, useEdgesState, Handle, Position, MarkerType,
  type Node, type Edge, type NodeProps, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Network, Search, Sparkles, AlertTriangle, ChevronRight, RefreshCw, Loader2,
  Briefcase, ShieldAlert, Target, Link2, Users, DollarSign, Activity, Lightbulb,
  User, Layers, X, Maximize2, Eye, Filter, ArrowRight, Database, Zap, ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = 'info' | 'warning' | 'high' | 'critical';

interface CrossDomainInsight {
  type: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation?: string;
  confidence?: number;
  relatedNodes?: (string | null)[];
}

interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties?: Record<string, any>;
  severity?: string;
  status?: string;
}

interface NeighborsResponse {
  sourceNode: { type: string; id: string };
  neighbors: GraphNode[];
  count: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const ATLAS_TYPE_META: Record<string, { friendly: string; label: string; color: string; bg: string; icon: any }> = {
  AtlasProject:     { friendly: 'project',     label: 'Project',     color: '#2563eb', bg: '#dbeafe', icon: Briefcase },
  AtlasRisk:        { friendly: 'risk',        label: 'Risk',        color: '#dc2626', bg: '#fee2e2', icon: ShieldAlert },
  AtlasObjective:   { friendly: 'objective',   label: 'Objective',   color: '#16a34a', bg: '#dcfce7', icon: Target },
  AtlasKeyResult:   { friendly: 'keyResult',   label: 'Key Result',  color: '#15803d', bg: '#dcfce7', icon: Target },
  AtlasDependency:  { friendly: 'dependency',  label: 'Dependency',  color: '#7c3aed', bg: '#ede9fe', icon: Link2 },
  AtlasTeam:        { friendly: 'team',        label: 'Team',        color: '#0891b2', bg: '#cffafe', icon: Users },
  AtlasPerson:      { friendly: 'person',      label: 'Person',      color: '#0d9488', bg: '#ccfbf1', icon: User },
  AtlasBudget:      { friendly: 'budget',      label: 'Budget',      color: '#65a30d', bg: '#ecfccb', icon: DollarSign },
  AtlasKpi:         { friendly: 'kpi',         label: 'KPI',         color: '#9333ea', bg: '#f3e8ff', icon: Activity },
  AtlasInsight:     { friendly: 'insight',     label: 'Insight',     color: '#d97706', bg: '#fef3c7', icon: Lightbulb },
};

function metaFor(type: string) {
  if (ATLAS_TYPE_META[type]) return ATLAS_TYPE_META[type];
  // try to normalize friendly → atlas
  const atlas = `Atlas${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  return ATLAS_TYPE_META[atlas] || { friendly: type.toLowerCase(), label: type, color: '#64748b', bg: '#f1f5f9', icon: Database };
}

// Pattern catalog: friendly labels + descriptions for the insight `type` values
// the backend currently emits from `generateCrossDomainInsights`. Patterns
// without server-side support are intentionally not listed here so the runner
// never shows a misleading zero count for an un-implemented check.
const PATTERN_META: Record<string, { label: string; desc: string }> = {
  orphaned_projects:                  { label: 'Orphaned Projects',         desc: 'Projects with no link to any strategic OKR.' },
  unmitigated_risks:                  { label: 'Unmitigated Critical Risks', desc: 'Critical or high-severity risks with no mitigation plan and not yet resolved.' },
  budget_schedule_correlation:        { label: 'Budget × Schedule At-Risk', desc: 'Projects where both CPI and SPI have fallen below 0.9.' },
  cross_project_dependencies:         { label: 'Blocked Cross-Project Deps', desc: 'Dependencies between distinct projects that are blocked and will cascade delays.' },
  cross_project_dependencies_aging:   { label: 'Aging Open Dependencies',    desc: 'Dependencies open longer than 60 days — likely unresolved hand-offs.' },
  dependency_hotspots:                { label: 'Dependency Hotspots',        desc: 'Projects on the receiving end of many open dependencies; portfolio bottlenecks.' },
};

// Map insight `type` → friendly node type used in URLs. Lets us drill in to
// the right kind of node without guessing.
const INSIGHT_TYPE_TO_NODE_FRIENDLY: Record<string, string> = {
  orphaned_projects:                  'project',
  unmitigated_risks:                  'risk',
  budget_schedule_correlation:        'project',
  cross_project_dependencies:         'dependency',
  cross_project_dependencies_aging:   'dependency',
  dependency_hotspots:                'project',
};

const SEVERITY_STYLE: Record<Severity, { badge: string; border: string; dot: string; rank: number }> = {
  critical: { badge: 'bg-red-100 text-red-800 border-red-300',       border: 'border-l-red-600',    dot: 'bg-red-600',    rank: 0 },
  high:     { badge: 'bg-orange-100 text-orange-800 border-orange-300', border: 'border-l-orange-500', dot: 'bg-orange-500', rank: 1 },
  warning:  { badge: 'bg-amber-100 text-amber-800 border-amber-300',    border: 'border-l-amber-500',  dot: 'bg-amber-500',  rank: 2 },
  info:     { badge: 'bg-blue-100 text-blue-800 border-blue-300',       border: 'border-l-blue-500',   dot: 'bg-blue-500',   rank: 3 },
};

function truncate(s: string, n: number): string { return !s ? '' : s.length <= n ? s : s.slice(0, n - 1) + '…'; }

// ─── Custom ReactFlow node ────────────────────────────────────────────────────
type CustomNodeData = {
  label: string;
  atlasType: string;
  status?: string;
  severity?: string;
  isCenter?: boolean;
  expanded?: boolean;
};

const GraphNodeCard = memo(({ data, selected }: NodeProps) => {
  const d = data as CustomNodeData;
  const m = metaFor(d.atlasType);
  const Icon = m.icon;
  const isCenter = d.isCenter;
  const sevDot = d.severity && (d.severity in SEVERITY_STYLE) ? SEVERITY_STYLE[d.severity as Severity].dot : null;

  return (
    <div
      className={`rounded-xl shadow-sm border-2 bg-white transition-all ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${isCenter ? 'shadow-lg' : ''}`}
      style={{
        borderColor: m.color,
        minWidth: isCenter ? 200 : 160,
        maxWidth: isCenter ? 240 : 180,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: m.color, width: 6, height: 6 }} />
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-t-[9px]"
        style={{ background: m.bg }}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: m.color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: m.color }}>{m.label}</span>
        {sevDot && <span className={`ml-auto h-2 w-2 rounded-full ${sevDot}`} />}
      </div>
      <div className="px-3 py-2">
        <div className="text-[12px] font-semibold leading-tight text-slate-900" title={d.label}>
          {truncate(d.label, isCenter ? 60 : 42)}
        </div>
        {d.status && (
          <div className="mt-1 text-[10px] text-slate-500 truncate">{d.status}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: m.color, width: 6, height: 6 }} />
    </div>
  );
});
GraphNodeCard.displayName = 'GraphNodeCard';

const nodeTypes = { custom: GraphNodeCard };

// ─── Helpers for layout ───────────────────────────────────────────────────────
function radialPositions(centerX: number, centerY: number, count: number, radius: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
  });
}

// ─── Insights tab ─────────────────────────────────────────────────────────────
function InsightCard({ insight, onShowInGraph }: { insight: CrossDomainInsight; onShowInGraph: (nodeId: string, friendlyType: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLE[insight.severity];
  const validNodes = (insight.relatedNodes || []).filter((n): n is string => typeof n === 'string' && n.length > 0);

  return (
    <Card className={`border-l-4 ${style.border}`} data-testid={`card-insight-${insight.type}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base" data-testid={`text-insight-title-${insight.type}`}>{insight.title}</CardTitle>
              <Badge className={style.badge} data-testid={`badge-severity-${insight.type}`}>{insight.severity.toUpperCase()}</Badge>
              {typeof insight.confidence === 'number' && (
                <Badge variant="outline" className="text-[10px]">conf {Math.round(insight.confidence * 100)}%</Badge>
              )}
            </div>
            <CardDescription className="mt-1.5">{insight.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {insight.recommendation && (
          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 mb-3">
            <p className="text-xs font-medium text-slate-700 mb-0.5">Recommendation</p>
            <p className="text-sm text-slate-600">{insight.recommendation}</p>
          </div>
        )}
        {validNodes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Affected:</span>
            {(expanded ? validNodes : validNodes.slice(0, 5)).map(nodeId => {
              const drillType = INSIGHT_TYPE_TO_NODE_FRIENDLY[insight.type] || 'project';
              return (
                <Button
                  key={nodeId}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px] font-mono"
                  onClick={() => onShowInGraph(nodeId, drillType)}
                  data-testid={`button-drilldown-${nodeId}`}
                >
                  <Eye className="h-3 w-3 mr-1" /> {nodeId}
                </Button>
              );
            })}
            {validNodes.length > 5 && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'show less' : `+${validNodes.length - 5} more`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsFeed({ onShowInGraph }: { onShowInGraph: (nodeId: string, friendlyType: string) => void }) {
  const [sevFilter, setSevFilter] = useState<Set<Severity>>(new Set(['critical', 'high', 'warning', 'info']));
  const [sortBy, setSortBy] = useState<'severity' | 'type'>('severity');

  const { data, isLoading, refetch, isRefetching, dataUpdatedAt } = useQuery({
    queryKey: ['/api/graph/insights'],
    queryFn: async () => {
      const res = await fetch('/api/graph/insights');
      if (!res.ok) throw new Error('Failed to load insights');
      return res.json() as Promise<{ insights: CrossDomainInsight[]; count: number; generatedAt: string }>;
    },
  });

  const filtered = useMemo(() => {
    const list = (data?.insights || []).filter(i => sevFilter.has(i.severity));
    if (sortBy === 'severity') return [...list].sort((a, b) => SEVERITY_STYLE[a.severity].rank - SEVERITY_STYLE[b.severity].rank);
    return [...list].sort((a, b) => a.type.localeCompare(b.type));
  }, [data, sevFilter, sortBy]);

  const toggleSev = (s: Severity) => {
    const next = new Set(sevFilter);
    next.has(s) ? next.delete(s) : next.add(s);
    setSevFilter(next);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, high: 0, warning: 0, info: 0 };
    (data?.insights || []).forEach(i => { c[i.severity] = (c[i.severity] || 0) + 1; });
    return c;
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(['critical', 'high', 'warning', 'info'] as const).map(s => (
            <button
              key={s}
              onClick={() => toggleSev(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                sevFilter.has(s) ? SEVERITY_STYLE[s].badge : 'bg-white text-slate-400 border-slate-200'
              }`}
              data-testid={`chip-severity-${s}`}
            >
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[150px] h-8 text-xs" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Sort by severity</SelectItem>
              <SelectItem value="type">Sort by type</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} data-testid="button-refresh-insights">
            {isRefetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Re-scan
          </Button>
        </div>
      </div>

      {dataUpdatedAt && (
        <p className="text-[11px] text-muted-foreground">
          Last scan: {new Date(dataUpdatedAt).toLocaleTimeString()} · {filtered.length} of {data?.count ?? 0} insights shown
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-insights">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
            {(data?.count ?? 0) === 0 ? 'No cross-domain patterns detected. The graph looks healthy.' : 'No insights match the current filters.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ins, i) => <InsightCard key={`${ins.type}-${i}`} insight={ins} onShowInGraph={onShowInGraph} />)}
        </div>
      )}
    </div>
  );
}

// ─── Node Explorer (the showcase) ────────────────────────────────────────────
interface ExplorerCanvasProps {
  initialType?: string;
  initialId?: string;
}

function ExplorerCanvas({ initialType, initialId }: ExplorerCanvasProps) {
  const [searchType, setSearchType] = useState<string>('project');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 250ms debounce so we don't fire a getGraph call per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(Object.keys(ATLAS_TYPE_META)));

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { fitView } = useReactFlow();
  const expandingRef = useRef<Set<string>>(new Set());
  const positionMapRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // ─── Search ───────────────────────────────────────────────────────────────
  const searchResults = useQuery({
    queryKey: ['/api/graph/search', debouncedQuery, searchType],
    queryFn: async () => {
      const params = new URLSearchParams({ q: debouncedQuery, type: searchType });
      const res = await fetch(`/api/graph/search?${params}`);
      if (!res.ok) return { results: [], count: 0 };
      return res.json() as Promise<{ results: GraphNode[]; count: number }>;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // ─── Selected node detail ────────────────────────────────────────────────
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedAtlasType = (selectedNode?.data as CustomNodeData | undefined)?.atlasType;
  const friendlyType = selectedAtlasType ? metaFor(selectedAtlasType).friendly : undefined;

  const nodeInsights = useQuery({
    queryKey: ['/api/graph/node-insights', friendlyType, selectedNodeId],
    queryFn: async () => {
      const res = await fetch(`/api/graph/node/${friendlyType}/${selectedNodeId}/insights`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedNodeId && !!friendlyType,
  });

  // ─── Add a node + auto-expand its first ring ─────────────────────────────
  const addCenterNode = useCallback((node: GraphNode) => {
    const pos = { x: 0, y: 0 };
    positionMapRef.current.set(node.id, pos);
    const center: Node<CustomNodeData> = {
      id: node.id,
      type: 'custom',
      position: pos,
      data: {
        label: node.label || node.id,
        atlasType: node.type,
        status: node.status,
        severity: node.severity,
        isCenter: true,
      },
    };
    setNodes([center]);
    setEdges([]);
    setSelectedNodeId(node.id);
    expandNode(node.id, node.type, pos);
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
  }, [setNodes, setEdges, fitView]);

  const expandNode = useCallback(async (nodeId: string, atlasType: string, sourcePos: { x: number; y: number }) => {
    if (expandingRef.current.has(nodeId)) return;
    expandingRef.current.add(nodeId);
    try {
      const friendly = metaFor(atlasType).friendly;
      const res = await fetch(`/api/graph/node/${friendly}/${nodeId}/neighbors`);
      if (!res.ok) return;
      const data = (await res.json()) as NeighborsResponse;
      const neighbors = data.neighbors || [];
      if (neighbors.length === 0) return;

      const newNeighbors = neighbors.filter(n => !positionMapRef.current.has(n.id));
      const radius = 260;
      const positions = radialPositions(sourcePos.x, sourcePos.y, Math.max(neighbors.length, 6), radius);

      const newNodes: Node<CustomNodeData>[] = newNeighbors.map((n, i) => {
        const fullIdx = neighbors.findIndex(x => x.id === n.id);
        const pos = positions[fullIdx] || positions[i];
        positionMapRef.current.set(n.id, pos);
        return {
          id: n.id,
          type: 'custom',
          position: pos,
          data: {
            label: n.label || n.id,
            atlasType: n.type,
            status: n.status,
            severity: n.severity,
          },
        };
      });

      const newEdges: Edge[] = neighbors.map(n => ({
        id: `${nodeId}->${n.id}`,
        source: nodeId,
        target: n.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: metaFor(n.type).color, strokeWidth: 1.5, opacity: 0.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: metaFor(n.type).color },
      }));

      setNodes(prev => {
        const existing = new Set(prev.map(p => p.id));
        return [...prev, ...newNodes.filter(n => !existing.has(n.id))];
      });
      setEdges(prev => {
        const existing = new Set(prev.map(e => e.id));
        return [...prev, ...newEdges.filter(e => !existing.has(e.id))];
      });
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
    } catch (e) {
      console.warn('expand failed', e);
    } finally {
      expandingRef.current.delete(nodeId);
    }
  }, [setNodes, setEdges, fitView]);

  // ─── Initial selection from props ─────────────────────────────────────────
  useEffect(() => {
    if (initialType && initialId) {
      fetch(`/api/graph/node/${initialType}/${initialId}`)
        .then(r => r.ok ? r.json() : null)
        .then(n => { if (n) addCenterNode(n); });
    }
  }, [initialType, initialId, addCenterNode]);

  // ─── Type filter (hide nodes of unchecked types) ─────────────────────────
  const visibleNodes = useMemo(() =>
    nodes.map(n => ({ ...n, hidden: !typeFilter.has((n.data as CustomNodeData).atlasType) })),
    [nodes, typeFilter]
  );
  const visibleEdges = useMemo(() => {
    const visible = new Set(visibleNodes.filter(n => !n.hidden).map(n => n.id));
    return edges.map(e => ({ ...e, hidden: !visible.has(e.source) || !visible.has(e.target) }));
  }, [edges, visibleNodes]);

  const toggleType = (t: string) => {
    const next = new Set(typeFilter);
    next.has(t) ? next.delete(t) : next.add(t);
    setTypeFilter(next);
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    const d = node.data as CustomNodeData;
    expandNode(node.id, d.atlasType, node.position);
  }, [expandNode]);

  const reset = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    positionMapRef.current.clear();
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `graph-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const visibleNodeCount = visibleNodes.filter(n => !n.hidden).length;

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[600px]">
      {/* LEFT: search + filters */}
      <div className="col-span-3 flex flex-col gap-3 overflow-hidden">
        <Card className="flex-shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" /> Find a starting node
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="h-8 text-xs" data-testid="select-search-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ATLAS_TYPE_META).map(([atlas, m]) => (
                  <SelectItem key={atlas} value={m.friendly}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search (≥ 2 chars)…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
              data-testid="input-search-node"
            />
            <ScrollArea className="h-44 border rounded-md">
              <div className="p-1.5 space-y-0.5">
                {searchResults.isLoading && searchQuery.length >= 2 && (
                  <div className="text-xs text-muted-foreground p-2">Searching…</div>
                )}
                {searchQuery.length < 2 && (
                  <div className="text-xs text-muted-foreground p-2">Type at least 2 characters.</div>
                )}
                {searchResults.data?.results.map(n => {
                  const m = metaFor(n.type);
                  const Icon = m.icon;
                  return (
                    <button
                      key={`${n.type}-${n.id}`}
                      onClick={() => addCenterNode(n)}
                      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-xs flex items-center gap-2"
                      data-testid={`button-select-node-${n.id}`}
                    >
                      <Icon className="h-3 w-3 flex-shrink-0" style={{ color: m.color }} />
                      <span className="truncate flex-1">{n.label || n.id}</span>
                    </button>
                  );
                })}
                {searchQuery.length >= 2 && searchResults.data && searchResults.data.results.length === 0 && (
                  <div className="text-xs text-muted-foreground p-2">No matches.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1 min-h-0 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> Show node types
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-1">
            {Object.entries(ATLAS_TYPE_META).map(([atlas, m]) => {
              const Icon = m.icon;
              const checked = typeFilter.has(atlas);
              const count = nodes.filter(n => (n.data as CustomNodeData).atlasType === atlas).length;
              return (
                <button
                  key={atlas}
                  onClick={() => toggleType(atlas)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition ${
                    checked ? 'bg-slate-50' : 'opacity-40'
                  }`}
                  data-testid={`toggle-type-${m.friendly}`}
                >
                  <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: m.color }} />
                  <Icon className="h-3 w-3 flex-shrink-0" style={{ color: m.color }} />
                  <span className="flex-1 text-left">{m.label}</span>
                  {count > 0 && <Badge variant="outline" className="h-4 text-[9px] px-1.5">{count}</Badge>}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* CENTER: ReactFlow canvas */}
      <div className="col-span-6 rounded-lg border bg-slate-50 overflow-hidden relative">
        {nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3" data-testid="text-explorer-empty">
            <Network className="h-12 w-12 opacity-30" />
            <p className="text-sm">Search for a starting node to begin exploring.</p>
            <p className="text-xs">Click a node to inspect it · Double-click to expand its neighbors</p>
          </div>
        ) : (
          <>
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-white rounded-md shadow-sm border px-2 py-1">
              <span className="text-[11px] text-slate-600">
                {visibleNodeCount} nodes · {visibleEdges.filter(e => !e.hidden).length} edges
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => fitView({ padding: 0.2, duration: 400 })}>
                <Maximize2 className="h-3 w-3 mr-1" /> Fit
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={exportJson}>
                Export
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-600" onClick={reset}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
            <ReactFlow
              nodes={visibleNodes}
              edges={visibleEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
              <Controls position="bottom-right" />
              <MiniMap
                position="bottom-left"
                pannable
                zoomable
                nodeColor={(n) => metaFor((n.data as CustomNodeData).atlasType).color}
                maskColor="rgba(241, 245, 249, 0.6)"
              />
            </ReactFlow>
          </>
        )}
      </div>

      {/* RIGHT: node details */}
      <div className="col-span-3 overflow-hidden">
        <Card className="h-full flex flex-col">
          {selectedNode ? (
            <>
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {(() => {
                      const d = selectedNode.data as CustomNodeData;
                      const m = metaFor(d.atlasType);
                      const Icon = m.icon;
                      return (
                        <>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: m.color }} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: m.color }}>{m.label}</span>
                          </div>
                          <CardTitle className="text-sm leading-tight" data-testid="text-detail-title">{d.label}</CardTitle>
                          <div className="text-[10px] text-muted-foreground font-mono mt-1 truncate">{selectedNode.id}</div>
                        </>
                      );
                    })()}
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedNodeId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <ScrollArea className="flex-1">
                <CardContent className="space-y-3 pt-3">
                  {/* Status & severity */}
                  {((selectedNode.data as CustomNodeData).status || (selectedNode.data as CustomNodeData).severity) && (
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedNode.data as CustomNodeData).status && (
                        <Badge variant="outline" className="text-[10px]">{(selectedNode.data as CustomNodeData).status}</Badge>
                      )}
                      {(selectedNode.data as CustomNodeData).severity && (
                        <Badge className={SEVERITY_STYLE[(selectedNode.data as CustomNodeData).severity as Severity]?.badge || ''}>
                          {(selectedNode.data as CustomNodeData).severity}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => {
                      const d = selectedNode.data as CustomNodeData;
                      expandNode(selectedNode.id, d.atlasType, selectedNode.position);
                    }} data-testid="button-expand">
                      <Zap className="h-3 w-3 mr-1" /> Expand
                    </Button>
                    {(selectedNode.data as CustomNodeData).atlasType === 'AtlasProject' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                        <a href={`/project/${selectedNode.id}`} data-testid="link-open-project">
                          <ExternalLink className="h-3 w-3 mr-1" /> Open
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Insights */}
                  {nodeInsights.data && Array.isArray(nodeInsights.data?.insights) && nodeInsights.data.insights.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Insights</p>
                      <div className="space-y-1.5">
                        {nodeInsights.data.insights.slice(0, 5).map((ins: any, i: number) => (
                          <div key={i} className={`p-2 rounded-md border text-xs ${SEVERITY_STYLE[ins.severity as Severity]?.badge || ''}`}>
                            <div className="font-semibold mb-0.5">{ins.title}</div>
                            <div className="opacity-90">{ins.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Properties */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Properties</p>
                    <NodeProperties nodeType={(selectedNode.data as CustomNodeData).atlasType} nodeId={selectedNode.id} />
                  </div>
                </CardContent>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-6">
              <Layers className="h-8 w-8 opacity-30" />
              <p className="text-xs text-center">Click a node to see its details, insights, and connections.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function NodeProperties({ nodeType, nodeId }: { nodeType: string; nodeId: string }) {
  const friendly = metaFor(nodeType).friendly;
  const { data, isLoading } = useQuery({
    queryKey: ['/api/graph/node', friendly, nodeId],
    queryFn: async () => {
      const res = await fetch(`/api/graph/node/${friendly}/${nodeId}`);
      if (!res.ok) return null;
      return res.json() as Promise<GraphNode>;
    },
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!data?.properties) return <p className="text-xs text-muted-foreground">No properties available.</p>;

  const props = Object.entries(data.properties)
    .filter(([k, v]) => !k.startsWith('__') && v != null && v !== '' && typeof v !== 'object')
    .slice(0, 12);

  if (props.length === 0) return <p className="text-xs text-muted-foreground">No displayable properties.</p>;

  return (
    <div className="space-y-1 text-[11px]">
      {props.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
          <span className="text-slate-500 capitalize flex-shrink-0">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
          <span className="text-slate-900 text-right truncate font-mono" title={String(v)}>{truncate(String(v), 24)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Pattern Runner ──────────────────────────────────────────────────────────
function PatternRunner({ onShowInGraph }: { onShowInGraph: (nodeId: string, friendlyType: string) => void }) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['/api/graph/insights'],
    queryFn: async () => {
      const res = await fetch('/api/graph/insights');
      if (!res.ok) throw new Error('failed');
      return res.json() as Promise<{ insights: CrossDomainInsight[] }>;
    },
  });

  // Build the runner's pattern list from what the backend actually emits today,
  // unioned with the curated metadata. Nothing fictional shows up.
  const patternIds = useMemo(() => {
    const ids = new Set<string>(Object.keys(PATTERN_META));
    (data?.insights || []).forEach(i => ids.add(i.type));
    return Array.from(ids);
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Server-side graph patterns. Each one walks the ontology looking for a specific structural signal in the live Palantir data.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} data-testid="button-run-all-patterns">
          {isRefetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Run all
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {patternIds.map(pid => {
          const meta = PATTERN_META[pid] || { label: pid.replace(/_/g, ' '), desc: 'Custom pattern emitted by the rules engine.' };
          const matches = (data?.insights || []).filter(i => i.type === pid);
          const count = matches.length;
          const topSeverity = matches.reduce<Severity | null>((acc, m) => {
            if (!acc) return m.severity;
            return SEVERITY_STYLE[m.severity].rank < SEVERITY_STYLE[acc].rank ? m.severity : acc;
          }, null);
          const drillType = INSIGHT_TYPE_TO_NODE_FRIENDLY[pid] || 'project';
          return (
            <Card key={pid} className={count > 0 ? `border-l-4 ${SEVERITY_STYLE[topSeverity || 'info'].border}` : ''} data-testid={`card-pattern-${pid}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm capitalize">{meta.label}</CardTitle>
                  {isLoading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : (
                    <Badge className={count > 0 ? SEVERITY_STYLE[topSeverity || 'info'].badge : 'bg-slate-100 text-slate-600 border-slate-200'}>
                      {count} {count === 1 ? 'match' : 'matches'}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">{meta.desc}</CardDescription>
              </CardHeader>
              {matches.length > 0 && (
                <CardContent className="pt-0 space-y-1.5">
                  {matches.slice(0, 3).map((m, i) => {
                    const valid = (m.relatedNodes || []).filter((n): n is string => typeof n === 'string' && n.length > 0);
                    return (
                      <div key={i} className="text-xs p-2 rounded-md bg-slate-50 border">
                        <div className="font-medium">{m.title}</div>
                        <div className="text-slate-600 mt-0.5">{m.description}</div>
                        {valid.length > 0 && (
                          <Button variant="link" size="sm" className="h-5 p-0 text-[11px] mt-1" onClick={() => onShowInGraph(valid[0], drillType)}>
                            Open in graph <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats header ────────────────────────────────────────────────────────────
function StatsHeader() {
  const status = useQuery({
    queryKey: ['/api/graph/status'],
    queryFn: async () => {
      const res = await fetch('/api/graph/status');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const insights = useQuery({
    queryKey: ['/api/graph/insights'],
    queryFn: async () => {
      const res = await fetch('/api/graph/insights');
      if (!res.ok) return null;
      return res.json() as Promise<{ count: number; insights: CrossDomainInsight[] }>;
    },
  });

  const critical = (insights.data?.insights || []).filter(i => i.severity === 'critical').length;
  const high = (insights.data?.insights || []).filter(i => i.severity === 'high').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Stat label="Graph status" value={status.data?.palantirAvailable ? 'Connected' : status.data ? 'Degraded' : '—'} icon={Database} color={status.data?.palantirAvailable ? '#16a34a' : '#dc2626'} />
      <Stat label="Node types" value={String((status.data?.nodeTypes || []).length || '—')} icon={Layers} color="#2563eb" />
      <Stat label="Cross-domain insights" value={String(insights.data?.count ?? '—')} icon={Sparkles} color="#7c3aed" />
      <Stat label="Critical / High" value={`${critical} / ${high}`} icon={AlertTriangle} color={critical > 0 ? '#dc2626' : '#d97706'} />
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="py-3 flex items-center gap-3">
        <div className="rounded-md p-2" style={{ background: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</div>
          <div className="text-base font-semibold truncate" style={{ color }}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────
export default function GraphExplorer() {
  const [activeTab, setActiveTab] = useState<string>('insights');
  const [drillType, setDrillType] = useState<string | undefined>();
  const [drillId, setDrillId] = useState<string | undefined>();

  const showInGraph = (nodeId: string, friendlyType: string = 'project') => {
    setDrillType(friendlyType);
    setDrillId(nodeId);
    setActiveTab('explorer');
  };

  return (
    <div className="container mx-auto py-6 max-w-[1600px] px-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Network className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Connections — Graph Explorer</h1>
            <Badge variant="outline">Powered by Neo4j over Palantir Foundry</Badge>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
            Walk the knowledge graph that sits over the ontology. Find structural patterns, drill from any insight into the connected nodes, and trace blast radius across projects, risks, OKRs, and resources.
          </p>
        </div>
      </div>

      <StatsHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="insights" data-testid="tab-insights">
            <Sparkles className="h-4 w-4 mr-2" /> Cross-Domain Insights
          </TabsTrigger>
          <TabsTrigger value="explorer" data-testid="tab-explorer">
            <Network className="h-4 w-4 mr-2" /> Node Explorer
          </TabsTrigger>
          <TabsTrigger value="patterns" data-testid="tab-patterns">
            <Search className="h-4 w-4 mr-2" /> Pattern Runner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <InsightsFeed onShowInGraph={showInGraph} />
        </TabsContent>
        <TabsContent value="explorer" className="mt-4">
          <ReactFlowProvider>
            <ExplorerCanvas initialType={drillType} initialId={drillId} />
          </ReactFlowProvider>
        </TabsContent>
        <TabsContent value="patterns" className="mt-4">
          <PatternRunner onShowInGraph={showInGraph} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
