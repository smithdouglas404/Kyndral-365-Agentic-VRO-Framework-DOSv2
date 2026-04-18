import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Network, Search, Sparkles, AlertTriangle, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';

type Severity = 'info' | 'warning' | 'high' | 'critical';

interface CrossDomainInsight {
  type: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation?: string;
  relatedNodes?: string[];
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

function inferRelationship(neighborType: string): string {
  const map: Record<string, string> = {
    AtlasRisk: 'has risk',
    AtlasDependency: 'depends on',
    AtlasObjective: 'aligned to',
    AtlasKeyResult: 'has KR',
    AtlasProject: 'related project',
    AtlasTeam: 'staffed by',
    AtlasPerson: 'owned by',
    AtlasBudget: 'funded by',
    AtlasKpi: 'tracks',
    AtlasInsight: 'insight',
  };
  return map[neighborType] || 'linked';
}

const NODE_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'risk', label: 'Risk' },
  { value: 'objective', label: 'Objective' },
  { value: 'dependency', label: 'Dependency' },
];

const PATTERNS = [
  { id: 'orphaned_projects', label: 'Orphaned Projects (no strategic alignment)' },
  { id: 'critical_unmitigated_risks', label: 'Critical Unmitigated Risks' },
  { id: 'at_risk_projects', label: 'High-Risk + Low-Readiness Projects' },
  { id: 'budget_overruns', label: 'Budget Overruns (CPI < 1.0)' },
  { id: 'schedule_slips', label: 'Schedule Slips (SPI < 1.0)' },
  { id: 'dependency_bottlenecks', label: 'Dependency Bottlenecks' },
  { id: 'cascading_risk_blast_radius', label: 'Cascading Risk Blast Radius' },
  { id: 'resource_contention', label: 'Resource Contention' },
];

function severityClasses(s?: string): string {
  switch (s) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-300';
    case 'high':     return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'warning':  return 'bg-amber-100 text-amber-800 border-amber-300';
    default:         return 'bg-blue-100 text-blue-800 border-blue-300';
  }
}

function nodeTypeShort(t: string): string {
  return t.replace(/^Atlas/, '');
}

// ─── Insight Card ─────────────────────────────────────────────────────────────
function InsightCard({ insight, onDrillDown }: { insight: CrossDomainInsight; onDrillDown: (nodeId: string) => void }) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: insight.severity === 'critical' ? '#dc2626' : insight.severity === 'high' ? '#ea580c' : insight.severity === 'warning' ? '#d97706' : '#2563eb' }} data-testid={`card-insight-${insight.type}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2" data-testid={`text-insight-title-${insight.type}`}>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              {insight.title}
            </CardTitle>
            <CardDescription className="mt-1.5" data-testid={`text-insight-description-${insight.type}`}>
              {insight.description}
            </CardDescription>
          </div>
          <Badge className={severityClasses(insight.severity)} data-testid={`badge-severity-${insight.type}`}>
            {insight.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      {(insight.recommendation || (insight.relatedNodes && insight.relatedNodes.length > 0)) && (
        <CardContent className="pt-0">
          {insight.recommendation && (
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-recommendation-${insight.type}`}>
              <span className="font-medium text-foreground">Recommendation: </span>
              {insight.recommendation}
            </p>
          )}
          {(() => {
            const validNodes = (insight.relatedNodes || []).filter((n): n is string => typeof n === 'string' && n.length > 0);
            return validNodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {validNodes.slice(0, 8).map(nodeId => (
                <Button
                  key={nodeId}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onDrillDown(nodeId)}
                  data-testid={`button-drilldown-${nodeId}`}
                >
                  {nodeId}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {validNodes.length > 8 && (
                <Badge variant="outline" className="h-7">+{validNodes.length - 8} more</Badge>
              )}
            </div>
            );
          })()}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Cross-Domain Insights Tab ────────────────────────────────────────────────
function InsightsFeed({ onDrillDown }: { onDrillDown: (type: string, id: string) => void }) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['/api/graph/insights'],
    queryFn: async () => {
      const res = await fetch('/api/graph/insights');
      if (!res.ok) throw new Error('Failed to load insights');
      return res.json() as Promise<{ insights: CrossDomainInsight[]; count: number; generatedAt: string }>;
    },
  });

  const insights = data?.insights || [];
  const grouped = useMemo(() => {
    const sev: Record<string, CrossDomainInsight[]> = { critical: [], high: [], warning: [], info: [] };
    insights.forEach(i => sev[i.severity]?.push(i));
    return sev;
  }, [insights]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-insights-heading">Cross-Domain Insights</h3>
          <p className="text-sm text-muted-foreground" data-testid="text-insights-summary">
            {isLoading ? 'Scanning the knowledge graph…' : `${data?.count ?? 0} pattern matches across the portfolio`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} data-testid="button-refresh-insights">
          {isRefetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Re-scan
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-no-insights">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
            No cross-domain patterns detected right now. The graph looks healthy.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(['critical', 'high', 'warning', 'info'] as const).map(sev =>
            grouped[sev].length === 0 ? null : (
              <div key={sev} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {sev} ({grouped[sev].length})
                </h4>
                {grouped[sev].map((ins, idx) => (
                  <InsightCard
                    key={`${ins.type}-${idx}`}
                    insight={ins}
                    onDrillDown={(nodeId) => {
                      // Best-effort: try project type for IDs; user can change in tab 2
                      onDrillDown('project', nodeId);
                    }}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Node Explorer Tab (radial neighbor view) ────────────────────────────────
function NodeExplorer({ initialType, initialId, onSelect }: {
  initialType?: string;
  initialId?: string;
  onSelect: (type: string, id: string) => void;
}) {
  const [searchType, setSearchType] = useState<string>(initialType || 'project');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(initialType || null);
  const [selectedId, setSelectedId] = useState<string | null>(initialId || null);

  useEffect(() => {
    if (initialType && initialId) {
      setSelectedType(initialType);
      setSelectedId(initialId);
    }
  }, [initialType, initialId]);

  const searchResults = useQuery({
    queryKey: ['/api/graph/search', searchQuery, searchType],
    queryFn: async () => {
      const params = new URLSearchParams({ q: searchQuery, type: searchType });
      const res = await fetch(`/api/graph/search?${params}`);
      if (!res.ok) return { results: [], count: 0 };
      return res.json() as Promise<{ results: GraphNode[]; count: number }>;
    },
    enabled: searchQuery.length >= 2,
  });

  const neighbors = useQuery({
    queryKey: ['/api/graph/neighbors', selectedType, selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/graph/node/${selectedType}/${selectedId}/neighbors`);
      if (!res.ok) throw new Error('Failed to load neighbors');
      return res.json() as Promise<NeighborsResponse>;
    },
    enabled: !!selectedType && !!selectedId,
  });

  const node = useQuery({
    queryKey: ['/api/graph/node', selectedType, selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/graph/node/${selectedType}/${selectedId}`);
      if (!res.ok) return null;
      return res.json() as Promise<GraphNode>;
    },
    enabled: !!selectedType && !!selectedId,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Find a node
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[160px]" data-testid="select-search-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search by name or ID (min 2 chars)…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="input-search-node"
            />
          </div>
          {searchResults.data && searchResults.data.results.length > 0 && (
            <ScrollArea className="h-48 mt-3 border rounded-md">
              <div className="p-2 space-y-1">
                {searchResults.data.results.map(n => (
                  <button
                    key={`${n.type}-${n.id}`}
                    onClick={() => {
                      setSelectedType(searchType);
                      setSelectedId(n.id);
                      onSelect(searchType, n.id);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center justify-between"
                    data-testid={`button-select-node-${n.id}`}
                  >
                    <span className="truncate">{n.label}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{nodeTypeShort(n.type)}</Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedType && selectedId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {node.data?.label || selectedId}
              <Badge variant="outline" className="ml-2 text-xs">{nodeTypeShort(selectedType)}</Badge>
            </CardTitle>
            <CardDescription>
              {neighbors.isLoading ? 'Loading neighborhood…' : `${neighbors.data?.count ?? 0} direct connections`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {neighbors.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : neighbors.data && neighbors.data.neighbors.length > 0 ? (
              <RadialNeighborView
                center={{ id: selectedId, label: node.data?.label || selectedId, type: selectedType }}
                neighbors={neighbors.data.neighbors}
                onSelectNeighbor={(t, id) => {
                  setSelectedType(t);
                  setSelectedId(id);
                  onSelect(t, id);
                }}
              />
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground" data-testid="text-no-neighbors">
                This node has no direct connections in the graph yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground" data-testid="text-explorer-empty">
            <Network className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Search above to pick a node and explore its neighborhood.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Radial visualization (pure SVG, no deps) ────────────────────────────────
function RadialNeighborView({ center, neighbors, onSelectNeighbor }: {
  center: { id: string; label: string; type: string };
  neighbors: GraphNode[];
  onSelectNeighbor: (type: string, id: string) => void;
}) {
  const W = 700, H = 460;
  const cx = W / 2, cy = H / 2;
  const radius = Math.min(W, H) * 0.36;
  const items = neighbors.slice(0, 14);

  const positions = items.map((_, i) => {
    const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });

  const typeToFriendly = (atlasType: string): string => {
    const map: Record<string, string> = {
      AtlasProject: 'project', AtlasRisk: 'risk', AtlasObjective: 'objective', AtlasDependency: 'dependency',
    };
    return map[atlasType] || atlasType.toLowerCase();
  };

  const colorFor = (atlasType: string): string => {
    const map: Record<string, string> = {
      AtlasProject: '#2563eb', AtlasRisk: '#dc2626', AtlasObjective: '#16a34a',
      AtlasDependency: '#7c3aed', AtlasInsight: '#d97706', AtlasTeam: '#0891b2',
      AtlasPerson: '#0d9488', AtlasBudget: '#65a30d', AtlasKpi: '#9333ea',
    };
    return map[atlasType] || '#64748b';
  };

  const centerAtlasType = center.type.startsWith('Atlas')
    ? center.type
    : `Atlas${center.type.charAt(0).toUpperCase()}${center.type.slice(1)}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={H} className="mx-auto" data-testid="svg-graph">
        {items.map((_, i) => (
          <line
            key={`edge-${i}`}
            x1={cx} y1={cy}
            x2={positions[i].x} y2={positions[i].y}
            stroke="#cbd5e1"
            strokeWidth={1.5}
          />
        ))}
        {items.map((n, i) => {
          const mx = (cx + positions[i].x) / 2;
          const my = (cy + positions[i].y) / 2;
          return (
            <text key={`elabel-${i}`} x={mx} y={my} fontSize="9" fill="#64748b" textAnchor="middle" className="select-none">
              {inferRelationship(n.type)}
            </text>
          );
        })}
        <g>
          <circle cx={cx} cy={cy} r={42} fill={colorFor(centerAtlasType)} opacity={0.15} stroke={colorFor(centerAtlasType)} strokeWidth={2} />
          <text x={cx} y={cy - 2} fontSize="11" fontWeight="600" textAnchor="middle" fill="#0f172a">
            {truncate(center.label, 16)}
          </text>
          <text x={cx} y={cy + 12} fontSize="9" textAnchor="middle" fill="#64748b">
            {nodeTypeShort(center.type)}
          </text>
        </g>
        {items.map((n, i) => (
          <g
            key={`node-${i}-${n.id}`}
            onClick={() => onSelectNeighbor(typeToFriendly(n.type), n.id)}
            style={{ cursor: 'pointer' }}
            data-testid={`graph-node-${n.id}`}
          >
            <circle cx={positions[i].x} cy={positions[i].y} r={28} fill={colorFor(n.type)} opacity={0.18} stroke={colorFor(n.type)} strokeWidth={1.5} />
            <text x={positions[i].x} y={positions[i].y - 1} fontSize="9" fontWeight="600" textAnchor="middle" fill="#0f172a">
              {truncate(n.label || n.id, 12)}
            </text>
            <text x={positions[i].x} y={positions[i].y + 10} fontSize="8" textAnchor="middle" fill="#64748b">
              {nodeTypeShort(n.type)}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Click any neighbor to re-center the view. Showing first {items.length} of {neighbors.length}.
      </p>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

// ─── Pattern Runner Tab ───────────────────────────────────────────────────────
function PatternRunner({ onDrillDown }: { onDrillDown: (type: string, id: string) => void }) {
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const { data, isLoading } = useQuery({
    queryKey: ['/api/graph/insights'],
    queryFn: async () => {
      const res = await fetch('/api/graph/insights');
      if (!res.ok) throw new Error('failed');
      return res.json() as Promise<{ insights: CrossDomainInsight[] }>;
    },
  });

  const filtered = useMemo(() => {
    if (!selectedPattern || !data) return [];
    return data.insights.filter(i => i.type === selectedPattern);
  }, [selectedPattern, data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Run a saved pattern</CardTitle>
          <CardDescription>
            Pick one of the eight pre-built graph patterns. Each one walks the ontology looking for a specific structural signal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPattern} onValueChange={setSelectedPattern}>
            <SelectTrigger data-testid="select-pattern">
              <SelectValue placeholder="Select a pattern…" />
            </SelectTrigger>
            <SelectContent>
              {PATTERNS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPattern && (
        <div className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm" data-testid="text-no-pattern-results">
                No matches for this pattern in the current portfolio.
              </CardContent>
            </Card>
          ) : (
            filtered.map((ins, i) => (
              <InsightCard
                key={`${ins.type}-${i}`}
                insight={ins}
                onDrillDown={(nodeId) => onDrillDown('project', nodeId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function GraphExplorer() {
  const [activeTab, setActiveTab] = useState<string>('insights');
  const [drillType, setDrillType] = useState<string | undefined>();
  const [drillId, setDrillId] = useState<string | undefined>();

  const drillDown = (type: string, id: string) => {
    setDrillType(type);
    setDrillId(id);
    setActiveTab('explorer');
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Network className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Connections — Graph Explorer</h1>
          <Badge variant="outline" className="ml-2">Powered by Neo4j</Badge>
        </div>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Walk the knowledge graph that sits over Palantir Foundry. Find structural patterns the ontology alone can't easily render.
        </p>
      </div>

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

        <TabsContent value="insights" className="mt-6">
          <InsightsFeed onDrillDown={drillDown} />
        </TabsContent>
        <TabsContent value="explorer" className="mt-6">
          <NodeExplorer initialType={drillType} initialId={drillId} onSelect={(t, id) => { setDrillType(t); setDrillId(id); }} />
        </TabsContent>
        <TabsContent value="patterns" className="mt-6">
          <PatternRunner onDrillDown={drillDown} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
