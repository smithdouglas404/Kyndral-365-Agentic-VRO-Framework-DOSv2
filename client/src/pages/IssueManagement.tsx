/**
 * ISSUE MANAGEMENT PAGE
 *
 * Comprehensive issue/problem tracking - a critical feature many PM systems lack
 * This is a key differentiator for our AI PPM system
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Search, AlertTriangle, CheckCircle, Clock, Ban, Circle } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Issue {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'blocked';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags?: string[];
  impact?: 'high' | 'medium' | 'low';
  category?: 'technical' | 'business' | 'resource' | 'scope' | 'schedule' | 'quality' | 'risk' | 'other';
  resolution?: string;
  resolvedAt?: string;
}

const priorityConfig = {
  critical: { label: 'Critical', color: 'bg-red-500', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-500', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'bg-yellow-500', icon: AlertTriangle },
  low: { label: 'Low', color: 'bg-blue-500', icon: AlertTriangle },
};

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-500', icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-purple-500', icon: Clock },
  blocked: { label: 'Blocked', color: 'bg-red-500', icon: Ban },
  resolved: { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-500', icon: CheckCircle },
};

export default function IssueManagement() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Fetch issues
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', selectedProject, selectedStatus, selectedPriority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProject !== 'all') params.set('projectId', selectedProject);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedPriority !== 'all') params.set('priority', selectedPriority);

      const token = getAccessToken();
      const res = await fetch(`/api/issues?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch issues');
      const data = await res.json();
      return data.issues as Issue[];
    },
  });

  // Fetch projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = getAccessToken();
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      return data;
    },
  });

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (issueData: Partial<Issue>) => {
      const token = getAccessToken();
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(issueData),
      });
      if (!res.ok) throw new Error('Failed to create issue');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue created successfully');
      setShowCreateDialog(false);
    },
    onError: () => {
      toast.error('Failed to create issue');
    },
  });

  // Update issue mutation
  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Issue> }) => {
      const token = getAccessToken();
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update issue');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue updated successfully');
    },
    onError: () => {
      toast.error('Failed to update issue');
    },
  });

  // Filter issues by search query
  const filteredIssues = issues.filter(issue =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group issues by status
  const issuesByStatus = {
    open: filteredIssues.filter(i => i.status === 'open'),
    in_progress: filteredIssues.filter(i => i.status === 'in_progress'),
    blocked: filteredIssues.filter(i => i.status === 'blocked'),
    resolved: filteredIssues.filter(i => i.status === 'resolved'),
    closed: filteredIssues.filter(i => i.status === 'closed'),
  };

  const IssueCard = ({ issue }: { issue: Issue }) => {
    const priorityInfo = priorityConfig[issue.priority];
    const statusInfo = statusConfig[issue.status];
    const StatusIcon = statusInfo.icon;
    const PriorityIcon = priorityInfo.icon;

    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => {
          setSelectedIssue(issue);
          setShowDetailDialog(true);
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold line-clamp-2">
                {issue.title}
              </CardTitle>
              {issue.description && (
                <CardDescription className="mt-1 line-clamp-2 text-xs">
                  {issue.description}
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={cn("text-white", priorityInfo.color)}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {priorityInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-3 w-3" />
              <span>{statusInfo.label}</span>
            </div>
            {issue.dueDate && (
              <span className={cn(
                new Date(issue.dueDate) < new Date() && issue.status !== 'resolved' && issue.status !== 'closed'
                  ? 'text-red-500 font-semibold'
                  : ''
              )}>
                Due: {new Date(issue.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {issue.tags && issue.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {issue.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const CreateIssueDialog = () => {
    const [formData, setFormData] = useState<Partial<Issue>>({
      priority: 'medium',
      status: 'open',
      category: 'other',
      impact: 'medium',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title || !formData.projectId) {
        toast.error('Title and project are required');
        return;
      }
      createIssueMutation.mutate(formData);
    };

    return (
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Track problems, blockers, and issues that need resolution
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="project">Project *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the issue..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="scope">Scope</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="impact">Impact</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value: any) => setFormData({ ...formData, impact: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createIssueMutation.isPending}>
                {createIssueMutation.isPending ? 'Creating...' : 'Create Issue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Issue Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and resolve project issues and blockers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Issue
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues by Status */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Open ({issuesByStatus.open.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({issuesByStatus.in_progress.length})
          </TabsTrigger>
          <TabsTrigger value="blocked">
            Blocked ({issuesByStatus.blocked.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({issuesByStatus.resolved.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({issuesByStatus.closed.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(issuesByStatus).map(([status, statusIssues]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {statusIssues.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No {status.replace('_', ' ')} issues found
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateIssueDialog />
    </div>
  );
}
