/**
 * OKR/KPI MANAGEMENT
 *
 * Comprehensive system for managing Objectives and Key Results at multiple levels:
 * - Company Level - Strategic objectives for entire organization
 * - Project Level - Project-specific goals and metrics
 * - Functional Level - VRO, TMO, PMO, FinOps, Governance, Planning, OCM, Risk
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Building2,
  FolderKanban,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  BarChart3,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OKR {
  id: string;
  title: string;
  description?: string;
  level: 'company' | 'project' | 'functional';
  levelId?: string;
  functionalArea?: string;
  owner?: string;
  parentOkrId?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'at_risk';
  progress: number;
  weight: number;
  keyResults?: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

interface KeyResult {
  id: string;
  okrId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  startValue: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface KPI {
  id: string;
  name: string;
  description?: string;
  level: 'company' | 'project' | 'functional';
  levelId?: string;
  functionalArea?: string;
  category?: string;
  metric: string;
  currentValue?: number;
  targetValue?: number;
  thresholdWarning?: number;
  thresholdCritical?: number;
  unit?: string;
  frequency: string;
  dataSource?: string;
  owner?: string;
  status: 'green' | 'yellow' | 'red';
  trend: 'improving' | 'stable' | 'declining';
  isActive: boolean;
  lastCalculated?: string;
  createdAt: string;
  updatedAt: string;
}

const functionalAreas = [
  { value: 'vro', label: 'VRO', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30' },
  { value: 'tmo', label: 'TMO', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' },
  { value: 'pmo', label: 'PMO', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30' },
  { value: 'finops', label: 'FinOps', color: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
  { value: 'governance', label: 'Governance', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30' },
  { value: 'planning', label: 'Planning', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' },
  { value: 'ocm', label: 'OCM', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30' },
  { value: 'risk', label: 'Risk', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
];

const statusColors = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30',
  at_risk: 'bg-red-100 text-red-700 dark:bg-red-900/30',
  on_track: 'bg-green-100 text-green-700 dark:bg-green-900/30',
  behind: 'bg-red-100 text-red-700 dark:bg-red-900/30',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30',
};

export default function OKRManagement() {
  const [view, setView] = useState<'okr' | 'kpi'>('okr');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [functionalFilter, setFunctionalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<OKR | KPI | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch OKRs
  const { data: okrs, isLoading: loadingOkrs } = useQuery<OKR[]>({
    queryKey: ['okrs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/okrs');
      if (!res.ok) throw new Error('Failed to fetch OKRs');
      const data = await res.json();
      return data.okrs || [];
    },
  });

  // Fetch KPIs
  const { data: kpis, isLoading: loadingKpis } = useQuery<KPI[]>({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await fetch('/api/admin/kpis');
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      const data = await res.json();
      return data.kpis || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'okr' | 'kpi'; id: string }) => {
      const res = await fetch(`/api/admin/${type}s/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete ${type}`);
    },
    onSuccess: (_, variables) => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: [variables.type === 'okr' ? 'okrs' : 'kpis'] });
    },
  });

  // Filter OKRs
  const filteredOkrs = okrs?.filter((okr) => {
    const matchesSearch =
      searchQuery === '' ||
      okr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === 'all' || okr.level === levelFilter;
    const matchesFunctional =
      functionalFilter === 'all' || okr.functionalArea === functionalFilter;

    return matchesSearch && matchesLevel && matchesFunctional;
  }) || [];

  // Filter KPIs
  const filteredKpis = kpis?.filter((kpi) => {
    const matchesSearch =
      searchQuery === '' ||
      kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === 'all' || kpi.level === levelFilter;
    const matchesFunctional =
      functionalFilter === 'all' || kpi.functionalArea === functionalFilter;

    return matchesSearch && matchesLevel && matchesFunctional;
  }) || [];

  // Calculate stats
  const okrStats = {
    total: okrs?.length || 0,
    active: okrs?.filter((o) => o.status === 'active').length || 0,
    completed: okrs?.filter((o) => o.status === 'completed').length || 0,
    atRisk: okrs?.filter((o) => o.status === 'at_risk').length || 0,
  };

  const kpiStats = {
    total: kpis?.length || 0,
    green: kpis?.filter((k) => k.status === 'green').length || 0,
    yellow: kpis?.filter((k) => k.status === 'yellow').length || 0,
    red: kpis?.filter((k) => k.status === 'red').length || 0,
  };

  const isLoading = loadingOkrs || loadingKpis;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">OKR & KPI Management</h1>
            </div>
            <p className="text-muted-foreground">
              Manage objectives, key results, and performance indicators across all levels
            </p>
          </div>

          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add {view === 'okr' ? 'OKR' : 'KPI'}
          </Button>
        </div>

        {/* View Toggle */}
        <Tabs value={view} onValueChange={(v) => setView(v as 'okr' | 'kpi')}>
          <TabsList>
            <TabsTrigger value="okr" className="gap-2">
              <Target className="w-4 h-4" />
              OKRs
            </TabsTrigger>
            <TabsTrigger value="kpi" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              KPIs
            </TabsTrigger>
          </TabsList>

          {/* OKR View */}
          <TabsContent value="okr" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total OKRs</p>
                      <p className="text-2xl font-bold">{okrStats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold">{okrStats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{okrStats.completed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                      <p className="text-2xl font-bold">{okrStats.atRisk}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search OKRs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="functional">Functional</SelectItem>
                </SelectContent>
              </Select>
              <Select value={functionalFilter} onValueChange={setFunctionalFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Functional area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {functionalAreas.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* OKR List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredOkrs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No OKRs found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || levelFilter !== 'all' || functionalFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first OKR'}
                  </p>
                  {searchQuery === '' && levelFilter === 'all' && functionalFilter === 'all' && (
                    <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add OKR
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOkrs.map((okr) => (
                  <Card key={okr.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {okr.level === 'company' && (
                              <Building2 className="w-4 h-4 text-blue-600" />
                            )}
                            {okr.level === 'project' && (
                              <FolderKanban className="w-4 h-4 text-purple-600" />
                            )}
                            {okr.level === 'functional' && (
                              <Users className="w-4 h-4 text-orange-600" />
                            )}
                            <Badge variant="outline" className="capitalize">
                              {okr.level}
                            </Badge>
                            {okr.functionalArea && (
                              <Badge
                                variant="outline"
                                className={
                                  functionalAreas.find((a) => a.value === okr.functionalArea)
                                    ?.color
                                }
                              >
                                {okr.functionalArea.toUpperCase()}
                              </Badge>
                            )}
                            <Badge className={statusColors[okr.status]}>{okr.status}</Badge>
                          </div>
                          <CardTitle className="text-xl mb-1">{okr.title}</CardTitle>
                          {okr.description && (
                            <CardDescription>{okr.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(okr)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(okr.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{okr.progress}%</span>
                        </div>
                        <Progress value={okr.progress} className="h-2" />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(okr.startDate), 'MMM d')} -{' '}
                            {format(new Date(okr.endDate), 'MMM d, yyyy')}
                          </div>
                          {okr.keyResults && okr.keyResults.length > 0 && (
                            <span>{okr.keyResults.length} Key Results</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* KPI View */}
          <TabsContent value="kpi" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total KPIs</p>
                      <p className="text-2xl font-bold">{kpiStats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">On Track</p>
                      <p className="text-2xl font-bold">{kpiStats.green}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Warning</p>
                      <p className="text-2xl font-bold">{kpiStats.yellow}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold">{kpiStats.red}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search KPIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="functional">Functional</SelectItem>
                </SelectContent>
              </Select>
              <Select value={functionalFilter} onValueChange={setFunctionalFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Functional area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {functionalAreas.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KPI Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredKpis.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No KPIs found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || levelFilter !== 'all' || functionalFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first KPI'}
                  </p>
                  {searchQuery === '' && levelFilter === 'all' && functionalFilter === 'all' && (
                    <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add KPI
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KPI Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKpis.map((kpi) => (
                      <TableRow key={kpi.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{kpi.name}</p>
                            {kpi.description && (
                              <p className="text-sm text-muted-foreground">{kpi.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {kpi.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {kpi.category || 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {kpi.currentValue !== null && kpi.currentValue !== undefined ? (
                            <span className="font-medium">
                              {kpi.currentValue}
                              {kpi.unit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {kpi.targetValue !== null && kpi.targetValue !== undefined ? (
                            <span>
                              {kpi.targetValue}
                              {kpi.unit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[kpi.status]}>{kpi.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {kpi.trend === 'improving' && (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            )}
                            {kpi.trend === 'declining' && (
                              <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                            )}
                            {kpi.trend === 'stable' && (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            <span className="text-sm capitalize">{kpi.trend}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(kpi)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(kpi.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog Placeholder */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {view === 'okr' ? 'OKR' : 'KPI'}</DialogTitle>
            <DialogDescription>
              Create a new {view === 'okr' ? 'objective' : 'key performance indicator'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">Form fields will be implemented next...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddDialog(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {view === 'okr' ? 'OKR' : 'KPI'}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {view === 'okr' ? 'objective and all associated key results' : 'KPI and its history'}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate({ type: view, id: deletingId });
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
