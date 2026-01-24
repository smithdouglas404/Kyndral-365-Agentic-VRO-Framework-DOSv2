/**
 * USER PERMISSIONS MANAGEMENT
 *
 * Granular permission management for each user
 * Admins can toggle specific access rights beyond role-based control
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface Permissions {
  // Workspace Access
  canAccessExecutiveDashboard: boolean;
  canAccessPMWorkspace: boolean;
  canAccessFinOpsWorkspace: boolean;
  canAccessTMOWorkspace: boolean;
  canAccessPlanningWorkspace: boolean;
  canAccessGovernanceWorkspace: boolean;
  canAccessOCMWorkspace: boolean;
  canAccessAdminWorkspace: boolean;

  // Feature Permissions
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canApproveChanges: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;

  // Agent Controls
  canTriggerAgents: boolean;
  canConfigureAgents: boolean;
  canViewAgentLogs: boolean;

  // Reports & Exports
  canExportData: boolean;
  canViewFinancialReports: boolean;
  canViewExecutiveReports: boolean;
}

export default function UserPermissions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/auth/firebase/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      return data.users || [];
    },
  });

  // Fetch permissions for a specific user
  const { data: userPermissions, isLoading: loadingPermissions } = useQuery<Permissions>({
    queryKey: ['permissions', editingUser?.id],
    queryFn: async () => {
      if (!editingUser) return null;
      const res = await fetch(`/api/admin/permissions/${editingUser.id}`);
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const data = await res.json();
      return data.permissions;
    },
    enabled: !!editingUser,
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { userId: string; permissions: Partial<Permissions> }) => {
      const res = await fetch(`/api/admin/permissions/${data.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.permissions),
      });
      if (!res.ok) throw new Error('Failed to update permissions');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setEditingUser(null);
      setPermissions(null);
    },
  });

  // Filter users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handlePermissionChange = (key: keyof Permissions, value: boolean) => {
    if (userPermissions) {
      setPermissions({ ...userPermissions, [key]: value });
    }
  };

  const handleSavePermissions = () => {
    if (editingUser && permissions) {
      updatePermissionsMutation.mutate({
        userId: editingUser.id,
        permissions,
      });
    }
  };

  // Set initial permissions when userPermissions loads
  useState(() => {
    if (userPermissions && !permissions) {
      setPermissions(userPermissions);
    }
  });

  const currentPermissions = permissions || userPermissions || {} as Permissions;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">User Permissions</h1>
            </div>
            <p className="text-muted-foreground">
              Manage granular access controls for each user
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName || ''} {user.lastName || ''}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Manage Permissions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Manage Permissions - {editingUser?.email}
            </DialogTitle>
            <DialogDescription>
              Grant or revoke specific access rights for this user
            </DialogDescription>
          </DialogHeader>

          {loadingPermissions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="workspaces" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="agents">Agents</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="workspaces" className="space-y-4">
                <PermissionToggle
                  label="Executive Dashboard"
                  description="Access to executive-level dashboard and metrics"
                  checked={currentPermissions.canAccessExecutiveDashboard}
                  onChange={(val) => handlePermissionChange('canAccessExecutiveDashboard', val)}
                />
                <PermissionToggle
                  label="PM Workspace"
                  description="Access to project management workspace"
                  checked={currentPermissions.canAccessPMWorkspace}
                  onChange={(val) => handlePermissionChange('canAccessPMWorkspace', val)}
                />
                <PermissionToggle
                  label="FinOps Workspace"
                  description="Access to financial operations workspace"
                  checked={currentPermissions.canAccessFinOpsWorkspace}
                  onChange={(val) => handlePermissionChange('canAccessFinOpsWorkspace', val)}
                />
                <PermissionToggle
                  label="TMO Workspace"
                  description="Access to transformation management workspace"
                  checked={currentPermissions.canAccessTMOWorkspace}
                  onChange={(val) => handlePermissionChange('canAccessTMOWorkspace', val)}
                />
                <PermissionToggle
                  label="Planning Workspace"
                  description="Access to planning workspace"
                  checked={currentPermissions.canAccessPlanningWorkspace}
                  onChange={(val) => handlePermissionChange('canAccessPlanningWorkspace', val)}
                />
                <PermissionToggle
                  label="Governance Workspace"
                  description="Access to governance workspace"
                  checked={currentPermissions.canAccessGovernanceWorkspace}
                  onChange={(val) => handlePermissionChange('canAccessGovernanceWorkspace', val)}
                />
                <PermissionToggle
                  label="OCM Workspace"
                  description="Access to organizational change management workspace"
                  checked={currentPermissions.canAccessOCMWorkspace}
                  onChange={(val) => handlePermissionChange('canAccessOCMWorkspace', val)}
                />
                <PermissionToggle
                  label="Admin Workspace"
                  description="Access to administrative workspace and settings"
                  checked={currentPermissions.canAccessAdminWorkspace}
                  onChange={(val) => handlePermissionChange('canAccessAdminWorkspace', val)}
                />
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <PermissionToggle
                  label="Edit Projects"
                  description="Can modify project details, timelines, and budgets"
                  checked={currentPermissions.canEditProjects}
                  onChange={(val) => handlePermissionChange('canEditProjects', val)}
                />
                <PermissionToggle
                  label="Delete Projects"
                  description="Can permanently delete projects"
                  checked={currentPermissions.canDeleteProjects}
                  onChange={(val) => handlePermissionChange('canDeleteProjects', val)}
                />
                <PermissionToggle
                  label="Approve Changes"
                  description="Can approve project changes and budget requests"
                  checked={currentPermissions.canApproveChanges}
                  onChange={(val) => handlePermissionChange('canApproveChanges', val)}
                />
                <PermissionToggle
                  label="Manage Users"
                  description="Can create, edit, and delete user accounts"
                  checked={currentPermissions.canManageUsers}
                  onChange={(val) => handlePermissionChange('canManageUsers', val)}
                />
                <PermissionToggle
                  label="Manage Integrations"
                  description="Can configure and manage external integrations"
                  checked={currentPermissions.canManageIntegrations}
                  onChange={(val) => handlePermissionChange('canManageIntegrations', val)}
                />
              </TabsContent>

              <TabsContent value="agents" className="space-y-4">
                <PermissionToggle
                  label="Trigger Agents"
                  description="Can manually trigger AI agent execution"
                  checked={currentPermissions.canTriggerAgents}
                  onChange={(val) => handlePermissionChange('canTriggerAgents', val)}
                />
                <PermissionToggle
                  label="Configure Agents"
                  description="Can modify agent settings and thresholds"
                  checked={currentPermissions.canConfigureAgents}
                  onChange={(val) => handlePermissionChange('canConfigureAgents', val)}
                />
                <PermissionToggle
                  label="View Agent Logs"
                  description="Can view agent execution logs and history"
                  checked={currentPermissions.canViewAgentLogs}
                  onChange={(val) => handlePermissionChange('canViewAgentLogs', val)}
                />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <PermissionToggle
                  label="Export Data"
                  description="Can export project and portfolio data"
                  checked={currentPermissions.canExportData}
                  onChange={(val) => handlePermissionChange('canExportData', val)}
                />
                <PermissionToggle
                  label="View Financial Reports"
                  description="Can access detailed financial reports and metrics"
                  checked={currentPermissions.canViewFinancialReports}
                  onChange={(val) => handlePermissionChange('canViewFinancialReports', val)}
                />
                <PermissionToggle
                  label="View Executive Reports"
                  description="Can access executive-level reports and analytics"
                  checked={currentPermissions.canViewExecutiveReports}
                  onChange={(val) => handlePermissionChange('canViewExecutiveReports', val)}
                />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={updatePermissionsMutation.isPending}
            >
              {updatePermissionsMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// Helper component for permission toggle
function PermissionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="flex-1 space-y-1">
        <Label className="text-base font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {checked ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        )}
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );
}
