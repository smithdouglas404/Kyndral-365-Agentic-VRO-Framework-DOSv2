/**
 * SYSTEM ADMIN PORTAL
 * Tenant provisioning, demo request management, analytics (Kyndryl staff only)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Sparkles,
  Building2,
  Users,
  TrendingUp,
  Plus,
  ExternalLink,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

export default function SystemAdminPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showProvisionDialog, setShowProvisionDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedDemoRequest, setSelectedDemoRequest] = useState<any>(null);

  // Provision tenant form
  const [provisionForm, setProvisionForm] = useState({
    name: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    subscriptionTier: 'professional' as 'demo' | 'professional' | 'enterprise',
  });

  // Convert demo form
  const [convertForm, setConvertForm] = useState({
    tenantName: '',
    subscriptionTier: 'professional' as 'demo' | 'professional' | 'enterprise',
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['system-admin', 'analytics'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/system-admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  // Fetch tenants
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ['system-admin', 'tenants'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/system-admin/tenants', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tenants');
      return res.json();
    },
  });

  // Fetch demo requests
  const { data: demoRequests, isLoading: loadingDemoRequests } = useQuery({
    queryKey: ['system-admin', 'demo-requests'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/system-admin/demo-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch demo requests');
      return res.json();
    },
  });

  // Provision tenant mutation
  const provisionMutation = useMutation({
    mutationFn: async (data: typeof provisionForm) => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/system-admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to provision tenant');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Tenant Provisioned',
        description: `${data.tenant.name} has been created. Invitation sent to ${data.invitation.email}.`,
      });
      setShowProvisionDialog(false);
      setProvisionForm({
        name: '',
        adminEmail: '',
        adminFirstName: '',
        adminLastName: '',
        subscriptionTier: 'professional',
      });
      queryClient.invalidateQueries({ queryKey: ['system-admin'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Provisioning Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Convert demo request mutation
  const convertMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof convertForm }) => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/system-admin/demo-requests/${id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert demo request');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Demo Converted',
        description: `Tenant "${data.tenant.name}" has been created.`,
      });
      setShowConvertDialog(false);
      setSelectedDemoRequest(null);
      setConvertForm({ tenantName: '', subscriptionTier: 'professional' });
      queryClient.invalidateQueries({ queryKey: ['system-admin'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Conversion Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">System Admin Portal</h1>
              <p className="text-xs text-gray-600">Kyndryl Clarity - Internal Admin</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="demo-requests">Demo Requests</TabsTrigger>
            <TabsTrigger value="provision">Provision New</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics?.tenants.byStatus.reduce((acc: number, t: any) => acc + Number(t.count), 0) || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Tenants</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{analytics?.users.total || 0}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics?.demoRequests.byStatus.reduce((acc: number, d: any) => acc + Number(d.count), 0) || 0}
                      </div>
                      <div className="text-sm text-gray-600">Demo Requests</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics?.tenants.byStatus.find((t: any) => t.status === 'active')?.count || 0}
                      </div>
                      <div className="text-sm text-gray-600">Active Tenants</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tenants */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>Recently provisioned organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.tenants.recent.map((tenant: any) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-semibold">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.slug}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status}
                        </Badge>
                        <div className="text-sm text-gray-500">{formatDate(tenant.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Demo Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Demo Requests</CardTitle>
                <CardDescription>Latest leads from demo form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.demoRequests.recent.slice(0, 5).map((demo: any) => (
                    <div key={demo.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        <div>
                          <div className="font-semibold">
                            {demo.firstName} {demo.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {demo.email} • {demo.companyName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge>{demo.status}</Badge>
                        <div className="text-sm text-gray-500">{formatDate(demo.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Tenants</CardTitle>
                <CardDescription>Manage customer organizations</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTenants ? (
                  <div className="text-center py-8 text-gray-500">Loading tenants...</div>
                ) : (
                  <div className="space-y-4">
                    {tenants?.map((item: any) => (
                      <div key={item.tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-semibold">{item.tenant.name}</div>
                            <div className="text-sm text-gray-500">
                              {item.tenant.slug} • {Number(item.userCount)} users
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={item.tenant.status === 'active' ? 'default' : 'secondary'}
                          >
                            {item.tenant.status}
                          </Badge>
                          <Badge variant="outline">{item.tenant.subscriptionTier}</Badge>
                          <div className="text-sm text-gray-500">{formatDate(item.tenant.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demo Requests Tab */}
          <TabsContent value="demo-requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Demo Requests</CardTitle>
                <CardDescription>Leads from demo request form</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDemoRequests ? (
                  <div className="text-center py-8 text-gray-500">Loading demo requests...</div>
                ) : (
                  <div className="space-y-4">
                    {demoRequests?.map((demo: any) => (
                      <div key={demo.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Sparkles className="w-5 h-5 text-orange-500" />
                          <div>
                            <div className="font-semibold">
                              {demo.firstName} {demo.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {demo.email} • {demo.companyName || 'No company'}
                            </div>
                            {demo.demoIndustry && (
                              <div className="text-xs text-gray-400 mt-1">
                                Industry: {demo.demoIndustry}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              demo.status === 'converted'
                                ? 'default'
                                : demo.status === 'demo_active'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {demo.status}
                          </Badge>
                          <div className="text-sm text-gray-500">{formatDate(demo.createdAt)}</div>
                          {demo.status !== 'converted' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDemoRequest(demo);
                                setConvertForm({
                                  tenantName: demo.companyName || `${demo.firstName} ${demo.lastName}`,
                                  subscriptionTier: 'professional',
                                });
                                setShowConvertDialog(true);
                              }}
                            >
                              Convert to Tenant
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Provision New Tab */}
          <TabsContent value="provision" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Provision New Tenant</CardTitle>
                <CardDescription>
                  Create a new organization and send invitation to admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    provisionMutation.mutate(provisionForm);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      value={provisionForm.name}
                      onChange={(e) =>
                        setProvisionForm({ ...provisionForm, name: e.target.value })
                      }
                      placeholder="ACME Corporation"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName">Admin First Name *</Label>
                      <Input
                        id="adminFirstName"
                        value={provisionForm.adminFirstName}
                        onChange={(e) =>
                          setProvisionForm({ ...provisionForm, adminFirstName: e.target.value })
                        }
                        placeholder="John"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminLastName">Admin Last Name *</Label>
                      <Input
                        id="adminLastName"
                        value={provisionForm.adminLastName}
                        onChange={(e) =>
                          setProvisionForm({ ...provisionForm, adminLastName: e.target.value })
                        }
                        placeholder="Smith"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={provisionForm.adminEmail}
                      onChange={(e) =>
                        setProvisionForm({ ...provisionForm, adminEmail: e.target.value })
                      }
                      placeholder="admin@company.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscriptionTier">Subscription Tier *</Label>
                    <Select
                      value={provisionForm.subscriptionTier}
                      onValueChange={(value: any) =>
                        setProvisionForm({ ...provisionForm, subscriptionTier: value })
                      }
                    >
                      <SelectTrigger id="subscriptionTier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <AlertDescription>
                      An invitation email will be sent to the admin email address with a secure link
                      to set their password and access the tenant.
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={provisionMutation.isPending}
                  >
                    {provisionMutation.isPending ? 'Provisioning...' : 'Provision Tenant'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Convert Demo Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Demo to Tenant</DialogTitle>
            <DialogDescription>
              Create a production tenant for {selectedDemoRequest?.email}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedDemoRequest) {
                convertMutation.mutate({ id: selectedDemoRequest.id, data: convertForm });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="tenantName">Tenant Name *</Label>
              <Input
                id="tenantName"
                value={convertForm.tenantName}
                onChange={(e) => setConvertForm({ ...convertForm, tenantName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="convertTier">Subscription Tier *</Label>
              <Select
                value={convertForm.subscriptionTier}
                onValueChange={(value: any) =>
                  setConvertForm({ ...convertForm, subscriptionTier: value })
                }
              >
                <SelectTrigger id="convertTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={convertMutation.isPending}>
              {convertMutation.isPending ? 'Converting...' : 'Convert to Tenant'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
