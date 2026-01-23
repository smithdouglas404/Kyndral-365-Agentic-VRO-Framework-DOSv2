/**
 * CHANGE REQUEST MANAGEMENT PAGE
 *
 * Manage project change requests - critical for scope control and governance
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, FileEdit, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChangeRequest {
  id: string;
  projectId: string;
  title: string;
  description: string;
  requestedBy: string;
  changeType: 'scope' | 'schedule' | 'budget' | 'quality' | 'resource' | 'technical' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'implemented' | 'cancelled';
  estimatedCost?: number;
  estimatedDuration?: number;
  businessJustification?: string;
  impactAssessment?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalNotes?: string;
}

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-500', icon: FileEdit },
  under_review: { label: 'Under Review', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  implemented: { label: 'Implemented', color: 'bg-purple-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: XCircle },
};

const priorityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

export default function ChangeRequestManagement() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch change requests
  const { data: changeRequests = [] } = useQuery({
    queryKey: ['change-requests', selectedProject, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProject !== 'all') params.set('projectId', selectedProject);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/change-requests?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch change requests');
      const data = await res.json();
      return data.changeRequests as ChangeRequest[];
    },
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Create change request mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<ChangeRequest>) => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create change request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('Change request created successfully');
      setShowCreateDialog(false);
    },
    onError: () => {
      toast.error('Failed to create change request');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/change-requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approvalNotes: notes }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('Change request approved');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/change-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
      toast.success('Change request rejected');
    },
  });

  // Group by status
  const byStatus = {
    submitted: changeRequests.filter(cr => cr.status === 'submitted'),
    under_review: changeRequests.filter(cr => cr.status === 'under_review'),
    approved: changeRequests.filter(cr => cr.status === 'approved'),
    rejected: changeRequests.filter(cr => cr.status === 'rejected'),
    implemented: changeRequests.filter(cr => cr.status === 'implemented'),
  };

  const ChangeRequestCard = ({ cr }: { cr: ChangeRequest }) => {
    const statusInfo = statusConfig[cr.status];
    const StatusIcon = statusInfo.icon;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base">{cr.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2 text-xs">
                {cr.description}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={cn("text-white", priorityColors[cr.priority])}>
                {cr.priority}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {cr.changeType}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <StatusIcon className="h-4 w-4" />
            <span>{statusInfo.label}</span>
          </div>

          {(cr.estimatedCost || cr.estimatedDuration) && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              {cr.estimatedCost && <span>Cost: ${cr.estimatedCost.toLocaleString()}</span>}
              {cr.estimatedDuration && <span>Duration: {cr.estimatedDuration} days</span>}
            </div>
          )}

          {cr.status === 'under_review' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => approveMutation.mutate({ id: cr.id, notes: 'Approved' })}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => rejectMutation.mutate({ id: cr.id, reason: 'Rejected' })}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const CreateDialog = () => {
    const [formData, setFormData] = useState<Partial<ChangeRequest>>({
      changeType: 'scope',
      priority: 'medium',
      status: 'submitted',
    });

    return (
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Change Request</DialogTitle>
            <DialogDescription>
              Submit a formal change request for project governance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Project *</Label>
              <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
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
              <Label>Title *</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief summary of the change"
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the requested change..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Change Type</Label>
                <Select value={formData.changeType} onValueChange={(value: any) => setFormData({ ...formData, changeType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scope">Scope</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Cost ($)</Label>
                <Input
                  type="number"
                  value={formData.estimatedCost || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <Label>Estimated Duration (days)</Label>
                <Input
                  type="number"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Business Justification</Label>
              <Textarea
                value={formData.businessJustification || ''}
                onChange={(e) => setFormData({ ...formData, businessJustification: e.target.value })}
                placeholder="Why is this change necessary?"
                rows={2}
              />
            </div>

            <div>
              <Label>Impact Assessment</Label>
              <Textarea
                value={formData.impactAssessment || ''}
                onChange={(e) => setFormData({ ...formData, impactAssessment: e.target.value })}
                placeholder="What is the impact if we don't make this change?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ ...formData, requestedBy: 'current-user' })}
              disabled={!formData.title || !formData.description || !formData.projectId}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Change Request Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and approve project change requests for scope control
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Change Request
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
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
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Requests by Status */}
      <Tabs defaultValue="submitted" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submitted">Submitted ({byStatus.submitted.length})</TabsTrigger>
          <TabsTrigger value="under_review">Review ({byStatus.under_review.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({byStatus.approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({byStatus.rejected.length})</TabsTrigger>
          <TabsTrigger value="implemented">Implemented ({byStatus.implemented.length})</TabsTrigger>
        </TabsList>

        {Object.entries(byStatus).map(([status, requests]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No {status.replace('_', ' ')} change requests
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((cr) => (
                  <ChangeRequestCard key={cr.id} cr={cr} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateDialog />
    </div>
  );
}
