/**
 * AGENT MEMORY VIEWER
 *
 * Admin interface for viewing and exploring agent memory systems:
 * - Mem0 Facts: Shared agent observations and facts
 * - Letta Core Memory: Agent personas and human context
 * - Letta Archival Memory: Long-term storage with embeddings
 * - Subscriptions: What agents observe from other agents
 * - Statistics: Overall memory system metrics
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  Brain,
  Archive,
  Bell,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface Fact {
  id: number;
  entity: string;
  attribute: string;
  value: any;
  sourceAgent: string;
  confidence: number;
  supersedes: number | null;
  createdAt: string;
}

interface CoreMemory {
  id: number;
  agentId: string;
  persona: string;
  humanContext: string;
  updatedAt: string;
}

interface ArchivalMemory {
  id: number;
  agentId: string;
  memoryKey: string;
  content: string;
  hasEmbedding: boolean;
  createdAt: string;
}

interface Subscription {
  id: number;
  agentId: string;
  attribute: string;
  sourceAgent: string | null;
  createdAt: string;
}

interface MemoryStats {
  totalFacts: number;
  totalMemories: number;
  factsByAgent: Array<{ agent: string; count: number }>;
  memoriesByAgent: Array<{ agent: string; count: number }>;
  recentActivity: number;
}

export default function AgentMemoryViewer() {
  const [activeTab, setActiveTab] = useState('facts');

  // Mem0 Facts state
  const [entityFilter, setEntityFilter] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');
  const [sourceAgentFilter, setSourceAgentFilter] = useState('');
  const [factsPage, setFactsPage] = useState(0);
  const factsLimit = 20;

  // Letta Archival state
  const [selectedAgentForArchival, setSelectedAgentForArchival] = useState('');
  const [archivalSearch, setArchivalSearch] = useState('');
  const [archivalPage, setArchivalPage] = useState(0);
  const archivalLimit = 20;

  // Letta Core state
  const [selectedAgentForCore, setSelectedAgentForCore] = useState('');

  // Subscriptions state
  const [subscriptionAgentFilter, setSubscriptionAgentFilter] = useState('');

  // Fetch Mem0 Facts
  const { data: factsData, refetch: refetchFacts, isLoading: factsLoading } = useQuery({
    queryKey: ['agent-memory-facts', entityFilter, attributeFilter, sourceAgentFilter, factsPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: factsLimit.toString(),
        offset: (factsPage * factsLimit).toString(),
      });
      if (entityFilter) params.append('entity', entityFilter);
      if (attributeFilter) params.append('attribute', attributeFilter);
      if (sourceAgentFilter) params.append('sourceAgent', sourceAgentFilter);

      const response = await fetch(`/api/admin/agent-memory/facts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch facts');
      return response.json();
    },
  });

  // Fetch entities list
  const { data: entitiesData } = useQuery({
    queryKey: ['agent-memory-entities'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agent-memory/facts/entities');
      if (!response.ok) throw new Error('Failed to fetch entities');
      return response.json();
    },
  });

  // Fetch attributes list
  const { data: attributesData } = useQuery({
    queryKey: ['agent-memory-attributes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agent-memory/facts/attributes');
      if (!response.ok) throw new Error('Failed to fetch attributes');
      return response.json();
    },
  });

  // Fetch Letta Core Memory
  const { data: coreMemoryData, refetch: refetchCore, isLoading: coreLoading } = useQuery({
    queryKey: ['agent-core-memory', selectedAgentForCore],
    queryFn: async () => {
      if (!selectedAgentForCore) return null;
      const response = await fetch(`/api/admin/agent-memory/letta/core/${selectedAgentForCore}`);
      if (!response.ok) throw new Error('Failed to fetch core memory');
      return response.json();
    },
    enabled: !!selectedAgentForCore,
  });

  // Fetch Letta Archival Memory
  const { data: archivalData, refetch: refetchArchival, isLoading: archivalLoading } = useQuery({
    queryKey: ['agent-archival-memory', selectedAgentForArchival, archivalSearch, archivalPage],
    queryFn: async () => {
      if (!selectedAgentForArchival) return null;
      const params = new URLSearchParams({
        limit: archivalLimit.toString(),
        offset: (archivalPage * archivalLimit).toString(),
      });
      if (archivalSearch) params.append('search', archivalSearch);

      const response = await fetch(
        `/api/admin/agent-memory/letta/archival/${selectedAgentForArchival}?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch archival memory');
      return response.json();
    },
    enabled: !!selectedAgentForArchival,
  });

  // Fetch Subscriptions
  const { data: subscriptionsData, refetch: refetchSubscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['agent-subscriptions', subscriptionAgentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (subscriptionAgentFilter) params.append('agentId', subscriptionAgentFilter);

      const response = await fetch(`/api/admin/agent-memory/subscriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    },
  });

  // Fetch Statistics
  const { data: statsData, refetch: refetchStats, isLoading: statsLoading } = useQuery({
    queryKey: ['agent-memory-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agent-memory/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const agentTypes = ['PMOAgent', 'FinOpsAgent', 'TMOAgent', 'RiskAgent', 'VROAgent', 'OCMAgent', 'GovernanceAgent'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Memory Viewer</h1>
          <p className="text-muted-foreground mt-2">
            Explore Mem0 facts and Letta memories across all agents
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="facts" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Mem0 Facts
            </TabsTrigger>
            <TabsTrigger value="core" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Core Memory
            </TabsTrigger>
            <TabsTrigger value="archival" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archival Memory
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Mem0 Facts Tab */}
          <TabsContent value="facts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Mem0 Shared Facts
                  </span>
                  <Button variant="outline" size="sm" onClick={() => refetchFacts()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View agent observations and facts from the Mem0 shared ledger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Entity</Label>
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All entities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All entities</SelectItem>
                        {entitiesData?.entities?.map((e: any) => (
                          <SelectItem key={e.entity} value={e.entity}>
                            {e.entity} ({e.factCount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Attribute</Label>
                    <Select value={attributeFilter} onValueChange={setAttributeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All attributes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All attributes</SelectItem>
                        {attributesData?.attributes?.map((a: any) => (
                          <SelectItem key={a.attribute} value={a.attribute}>
                            {a.attribute} ({a.usageCount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Source Agent</Label>
                    <Select value={sourceAgentFilter} onValueChange={setSourceAgentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All agents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All agents</SelectItem>
                        {agentTypes.map((agent) => (
                          <SelectItem key={agent} value={agent}>
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Facts Table */}
                {factsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading facts...</div>
                ) : factsData?.facts?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No facts found</div>
                ) : (
                  <>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity</TableHead>
                            <TableHead>Attribute</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Source Agent</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {factsData?.facts?.map((fact: Fact) => (
                            <TableRow key={fact.id}>
                              <TableCell className="font-medium">{fact.entity}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{fact.attribute}</Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {typeof fact.value === 'object'
                                  ? JSON.stringify(fact.value)
                                  : String(fact.value)}
                              </TableCell>
                              <TableCell>
                                <Badge>{fact.sourceAgent}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={fact.confidence > 0.8 ? 'default' : 'secondary'}
                                >
                                  {(fact.confidence * 100).toFixed(0)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {format(new Date(fact.createdAt), 'MMM d, yyyy HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {factsPage * factsLimit + 1} -{' '}
                        {Math.min((factsPage + 1) * factsLimit, factsData?.total || 0)} of{' '}
                        {factsData?.total || 0} facts
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFactsPage((p) => Math.max(0, p - 1))}
                          disabled={factsPage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFactsPage((p) => p + 1)}
                          disabled={
                            !factsData?.total ||
                            (factsPage + 1) * factsLimit >= factsData.total
                          }
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Letta Core Memory Tab */}
          <TabsContent value="core" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Letta Core Memory
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchCore()}
                    disabled={!selectedAgentForCore}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View agent persona and human context (Letta core memory)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Agent</Label>
                  <Select value={selectedAgentForCore} onValueChange={setSelectedAgentForCore}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTypes.map((agent) => (
                        <SelectItem key={agent} value={agent}>
                          {agent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {coreLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading core memory...</div>
                ) : !selectedAgentForCore ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select an agent to view core memory
                  </div>
                ) : !coreMemoryData?.coreMemory ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No core memory found for {selectedAgentForCore}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Persona</Label>
                        <p className="mt-1 whitespace-pre-wrap">{coreMemoryData.coreMemory.persona}</p>
                      </div>
                      <div className="border-t pt-3">
                        <Label className="text-xs text-muted-foreground">Human Context</Label>
                        <p className="mt-1 whitespace-pre-wrap">
                          {coreMemoryData.coreMemory.humanContext}
                        </p>
                      </div>
                      <div className="border-t pt-3">
                        <Label className="text-xs text-muted-foreground">Last Updated</Label>
                        <p className="mt-1 text-sm">
                          {format(
                            new Date(coreMemoryData.coreMemory.updatedAt),
                            'MMM d, yyyy HH:mm:ss'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Letta Archival Memory Tab */}
          <TabsContent value="archival" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Letta Archival Memory
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchArchival()}
                    disabled={!selectedAgentForArchival}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View long-term agent memories with embeddings (Letta archival storage)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Agent</Label>
                    <Select
                      value={selectedAgentForArchival}
                      onValueChange={setSelectedAgentForArchival}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agentTypes.map((agent) => (
                          <SelectItem key={agent} value={agent}>
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search memories..."
                        value={archivalSearch}
                        onChange={(e) => setArchivalSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {archivalLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading archival memory...
                  </div>
                ) : !selectedAgentForArchival ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select an agent to view archival memory
                  </div>
                ) : archivalData?.memories?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No memories found</div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {archivalData?.memories?.map((memory: ArchivalMemory) => (
                        <div key={memory.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{memory.memoryKey}</Badge>
                                {memory.hasEmbedding && (
                                  <Badge variant="secondary">
                                    <Brain className="w-3 h-3 mr-1" />
                                    Embedded
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{memory.content}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(memory.createdAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {archivalPage * archivalLimit + 1} -{' '}
                        {Math.min((archivalPage + 1) * archivalLimit, archivalData?.total || 0)} of{' '}
                        {archivalData?.total || 0} memories
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setArchivalPage((p) => Math.max(0, p - 1))}
                          disabled={archivalPage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setArchivalPage((p) => p + 1)}
                          disabled={
                            !archivalData?.total ||
                            (archivalPage + 1) * archivalLimit >= archivalData.total
                          }
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Agent Fact Subscriptions
                  </span>
                  <Button variant="outline" size="sm" onClick={() => refetchSubscriptions()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View what facts each agent observes from the Mem0 shared ledger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filter by Agent</Label>
                  <Select
                    value={subscriptionAgentFilter}
                    onValueChange={setSubscriptionAgentFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All agents</SelectItem>
                      {agentTypes.map((agent) => (
                        <SelectItem key={agent} value={agent}>
                          {agent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {subscriptionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading subscriptions...
                  </div>
                ) : subscriptionsData?.subscriptions?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No subscriptions found
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead>Observing Attribute</TableHead>
                          <TableHead>From Source Agent</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionsData?.subscriptions?.map((sub: Subscription) => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <Badge>{sub.agentId}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{sub.attribute}</Badge>
                            </TableCell>
                            <TableCell>
                              {sub.sourceAgent ? (
                                <Badge variant="secondary">{sub.sourceAgent}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">All agents</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(sub.createdAt), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Mem0 Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">
                        {statsData?.stats?.totalFacts || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total facts stored</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {statsData?.stats?.recentActivity || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">New in last hour</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Letta Memories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-3xl font-bold">
                      {statsData?.stats?.totalMemories || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total archival memories</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Facts by Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statsLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading...</div>
                    ) : statsData?.stats?.factsByAgent?.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">No data</div>
                    ) : (
                      statsData?.stats?.factsByAgent?.map((item: any) => (
                        <div key={item.agent} className="flex items-center justify-between">
                          <Badge>{item.agent}</Badge>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memories by Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statsLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading...</div>
                    ) : statsData?.stats?.memoriesByAgent?.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">No data</div>
                    ) : (
                      statsData?.stats?.memoriesByAgent?.map((item: any) => (
                        <div key={item.agent} className="flex items-center justify-between">
                          <Badge variant="secondary">{item.agent}</Badge>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
