/**
 * COMPANY PROFILE ADMIN
 *
 * Comprehensive management interface for company profile configuration:
 * - Basic company information (legal name, industry, headquarters)
 * - Organizational units (value streams, business units, segments)
 * - Metrics and KPIs (extracted and custom)
 * - Strategic objectives (OKRs)
 * - Governance rules (policy-as-code)
 * - Document management and re-extraction
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  TrendingUp,
  Target,
  Shield,
  FileText,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Upload,
  Download,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CompanyProfile {
  id: string;
  legalName: string;
  tradeNames: string[];
  headquarters: {
    city: string;
    state?: string;
    country: string;
    fullAddress?: string;
  };
  primaryNaicsCode?: string;
  gicsSector?: string;
  gicsIndustry?: string;
  businessSummary?: string;
  latestAnnualReportUrl?: string;
  latestAnnualReportDate?: string;
  fiscalYearEnd?: string;
  reportingCurrency?: string;
  orgStructureTerminology: {
    primary: 'business_unit' | 'segment' | 'division';
    alternatives: string[];
  };
  status: 'draft' | 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface OrganizationalUnit {
  id: string;
  companyId: string;
  unitName: string;
  unitType: string;
  description?: string;
  parentUnitId?: string;
  extractedFromReport: boolean;
  createdAt: string;
}

interface Metric {
  id: string;
  companyId: string;
  metricName: string;
  metricType: string;
  description?: string;
  targetValue?: number;
  unitOfMeasure?: string;
  calculationFormula?: string;
  extractedFromReport: boolean;
  extractionConfidence?: number;
  createdAt: string;
}

interface StrategicObjective {
  id: string;
  companyId: string;
  objectiveName: string;
  description?: string;
  targetDate?: string;
  keyResults: Array<{
    description: string;
    targetValue?: string;
  }>;
  extractedFromReport: boolean;
  createdAt: string;
}

interface GovernanceRule {
  id: string;
  companyId: string;
  ruleName: string;
  ruleCategory: string;
  ruleConditions: any;
  ruleActions: any;
  extractedFromReport: boolean;
  isActive: boolean;
  createdAt: string;
}

interface ExtractionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
}

export default function CompanyProfile() {
  const [activeTab, setActiveTab] = useState('switcher');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  const [showAddMetricDialog, setShowAddMetricDialog] = useState(false);
  const [showReExtractionDialog, setShowReExtractionDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionJob | null>(null);
  const queryClient = useQueryClient();

  // Company activation mutation
  const activateCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await fetch(`/api/company-profile/${companyId}/activate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to activate company');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate company');
    },
  });

  // Fetch active company profile
  const { data: profile, isLoading: loadingProfile } = useQuery<CompanyProfile>({
    queryKey: ['company-profile', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/company-profile/active');
      if (!res.ok) throw new Error('Failed to fetch company profile');
      const data = await res.json();
      return data.company ? {
        ...data.company,
        id: data.company.id,
      } : null;
    },
  });

  // Fetch all companies for switcher
  const { data: allCompanies, isLoading: loadingAllCompanies } = useQuery<CompanyProfile[]>({
    queryKey: ['companies', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/company-profile/all');
      if (!res.ok) throw new Error('Failed to fetch companies');
      return res.json();
    },
  });

  // Fetch organizational units
  const { data: orgUnits, isLoading: loadingUnits } = useQuery<OrganizationalUnit[]>({
    queryKey: ['organizational-units'],
    queryFn: async () => {
      const res = await fetch('/api/company-profile/organizational-units');
      if (!res.ok) throw new Error('Failed to fetch organizational units');
      const data = await res.json();
      return data.units || [];
    },
  });

  // Fetch metrics
  const { data: metrics, isLoading: loadingMetrics } = useQuery<Metric[]>({
    queryKey: ['company-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/company-profile/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      return data.metrics || [];
    },
  });

  // Fetch strategic objectives
  const { data: objectives, isLoading: loadingObjectives } = useQuery<StrategicObjective[]>({
    queryKey: ['strategic-objectives'],
    queryFn: async () => {
      const res = await fetch('/api/company-profile/strategic-objectives');
      if (!res.ok) throw new Error('Failed to fetch objectives');
      const data = await res.json();
      return data.objectives || [];
    },
  });

  // Fetch governance rules
  const { data: rules, isLoading: loadingRules } = useQuery<GovernanceRule[]>({
    queryKey: ['governance-rules'],
    queryFn: async () => {
      const res = await fetch('/api/company-profile/governance-rules');
      if (!res.ok) throw new Error('Failed to fetch rules');
      const data = await res.json();
      return data.rules || [];
    },
  });

  // Update company profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<CompanyProfile>) => {
      const res = await fetch(`/api/company-profile/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Company profile updated');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Delete organizational unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/company-profile/organizational-units/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete unit');
    },
    onSuccess: () => {
      toast.success('Organizational unit deleted');
      queryClient.invalidateQueries({ queryKey: ['organizational-units'] });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete unit');
    },
  });

  // Start re-extraction mutation
  const reExtractMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/company-profile/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: profile?.id,
          documentUrl: profile?.latestAnnualReportUrl,
        }),
      });
      if (!res.ok) throw new Error('Failed to start extraction');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Extraction started');
      setExtractionStatus({
        id: data.jobId,
        status: 'processing',
        progress: 10,
        createdAt: new Date().toISOString(),
      });
      setShowReExtractionDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start extraction');
    },
  });

  const isLoading = loadingProfile || loadingUnits || loadingMetrics || loadingObjectives || loadingRules;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">No Company Profile Found</h3>
            <p className="text-muted-foreground mb-4">
              Complete the setup wizard to create your company profile
            </p>
            <Button onClick={() => window.location.href = '/setup'}>
              Start Setup Wizard
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Company Profile</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your organization's configuration and strategic information
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
              {profile.status}
            </Badge>
            <Button variant="outline" onClick={() => setShowReExtractionDialog(true)} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Re-Extract Data
            </Button>
          </div>
        </div>

        {/* Extraction Progress Banner */}
        {extractionStatus && extractionStatus.status === 'processing' && (
          <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">AI Extraction in Progress</p>
                  <Progress value={extractionStatus.progress} className="h-2" />
                </div>
                <span className="text-sm font-medium">{extractionStatus.progress}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="switcher" className="gap-2">
              <Building2 className="w-4 h-4" />
              Company Switcher
            </TabsTrigger>
            <TabsTrigger value="basic" className="gap-2">
              <FileText className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="org-units" className="gap-2">
              <Users className="w-4 h-4" />
              Org Units ({orgUnits?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Metrics ({metrics?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="objectives" className="gap-2">
              <Target className="w-4 h-4" />
              OKRs ({objectives?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Shield className="w-4 h-4" />
              Rules ({rules?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Company Switcher Tab */}
          <TabsContent value="switcher" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Switch Active Company</CardTitle>
                <CardDescription>
                  Select which company configuration to use across the system. Only one company can be active at a time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAllCompanies ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allCompanies?.map((company) => (
                      <Card
                        key={company.id}
                        className={`p-4 cursor-pointer transition-all ${
                          company.status === 'active'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => {
                          if (company.status !== 'active') {
                            activateCompanyMutation.mutate(company.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{company.legalName}</h3>
                              {company.status === 'active' && (
                                <Badge className="bg-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </div>
                            {company.gicsSector && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {company.gicsSector} • {company.gicsIndustry}
                              </p>
                            )}
                          </div>
                          {company.status !== 'active' && (
                            <Button size="sm" variant="outline">
                              Activate
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                    {allCompanies?.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No companies configured yet.</p>
                        <Button
                          className="mt-4"
                          onClick={() => (window.location.href = '/setup')}
                        >
                          Run Setup Wizard
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>
                      Core details about your organization
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">Legal Name</Label>
                    <p className="font-semibold mt-1">{profile.legalName}</p>
                  </div>
                  {profile.tradeNames && profile.tradeNames.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Trade Names</Label>
                      <div className="flex gap-2 mt-1">
                        {profile.tradeNames.map((name, i) => (
                          <Badge key={i} variant="outline">{name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Headquarters
                    </Label>
                    <p className="mt-1">
                      {profile.headquarters.fullAddress ||
                       `${profile.headquarters.city}, ${profile.headquarters.state || ''} ${profile.headquarters.country}`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Reporting Currency</Label>
                    <p className="font-semibold mt-1">{profile.reportingCurrency || 'USD'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">GICS Industry</Label>
                    <p className="mt-1">{profile.gicsIndustry || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">NAICS Code</Label>
                    <p className="mt-1">{profile.primaryNaicsCode || 'Not specified'}</p>
                  </div>
                </div>

                {profile.businessSummary && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Business Summary</Label>
                    <p className="mt-1 text-sm leading-relaxed">{profile.businessSummary}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground text-sm">Organizational Terminology</Label>
                  <p className="mt-1 capitalize">{profile.orgStructureTerminology.primary.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Org Units Tab */}
          <TabsContent value="org-units" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Manage your organizational structure and business units
              </p>
              <Button onClick={() => setShowAddUnitDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Unit
              </Button>
            </div>

            {orgUnits && orgUnits.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.unitName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{unit.unitType}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {unit.description || '-'}
                        </TableCell>
                        <TableCell>
                          {unit.extractedFromReport ? (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="w-3 h-3" />
                              Extracted
                            </Badge>
                          ) : (
                            <Badge variant="outline">Manual</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(unit)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(unit.id)}
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
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Organizational Units</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your business units, segments, or divisions
                  </p>
                  <Button onClick={() => setShowAddUnitDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Unit
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                KPIs and performance metrics tracked across your organization
              </p>
              <Button onClick={() => setShowAddMetricDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Metric
              </Button>
            </div>

            {metrics && metrics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric) => (
                  <Card key={metric.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <CardTitle className="text-base">{metric.metricName}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{metric.metricType}</Badge>
                            {metric.extractedFromReport && (
                              <Badge variant="secondary" className="gap-1">
                                <Sparkles className="w-3 h-3" />
                                {Math.round((metric.extractionConfidence || 0) * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {metric.description && (
                        <p className="text-sm text-muted-foreground mb-3">{metric.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        {metric.targetValue && (
                          <span>
                            Target: <strong>{metric.targetValue} {metric.unitOfMeasure}</strong>
                          </span>
                        )}
                        {metric.calculationFormula && (
                          <span className="text-muted-foreground">Has formula</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Metrics Defined</h3>
                  <p className="text-muted-foreground mb-4">
                    Add KPIs to track organizational performance
                  </p>
                  <Button onClick={() => setShowAddMetricDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Metric
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* OKRs Tab */}
          <TabsContent value="objectives" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Strategic objectives and key results for your organization
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Objective
              </Button>
            </div>

            {objectives && objectives.length > 0 ? (
              <div className="space-y-4">
                {objectives.map((objective) => (
                  <Card key={objective.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-orange-600" />
                            <CardTitle>{objective.objectiveName}</CardTitle>
                            {objective.extractedFromReport && (
                              <Badge variant="secondary" className="gap-1">
                                <Sparkles className="w-3 h-3" />
                                Extracted
                              </Badge>
                            )}
                          </div>
                          {objective.description && (
                            <CardDescription>{objective.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {objective.keyResults && objective.keyResults.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Key Results:</Label>
                          <ul className="space-y-1">
                            {objective.keyResults.map((kr, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>
                                  {kr.description}
                                  {kr.targetValue && (
                                    <span className="text-muted-foreground"> - Target: {kr.targetValue}</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {objective.targetDate && (
                        <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Target: {format(new Date(objective.targetDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Strategic Objectives</h3>
                  <p className="text-muted-foreground mb-4">
                    Define OKRs to guide your organization's strategy
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Objective
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Governance rules and policies enforced in your system
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/admin/policy-as-code'}>
                Manage Rules
              </Button>
            </div>

            {rules && rules.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.ruleName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.ruleCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rule.extractedFromReport ? (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="w-3 h-3" />
                              Extracted
                            </Badge>
                          ) : (
                            <Badge variant="outline">Manual</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Governance Rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Extract governance policies from your annual report
                  </p>
                  <Button onClick={() => setShowReExtractionDialog(true)} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Run Extraction
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Annual Report</CardTitle>
                <CardDescription>
                  Source document for Policy-as-Code extraction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.latestAnnualReportUrl ? (
                  <div className="border rounded-lg p-4 bg-accent/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-semibold">10-K Annual Report</p>
                          {profile.latestAnnualReportDate && (
                            <p className="text-sm text-muted-foreground">
                              Filed: {format(new Date(profile.latestAnnualReportDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.latestAnnualReportUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowReExtractionDialog(true)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Document Uploaded</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload an annual report to enable Policy-as-Code extraction
                    </p>
                    <Button className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">What Gets Extracted:</Label>
                  <ul className="text-sm space-y-1 ml-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Organizational structure and business units
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Financial metrics and KPIs by segment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Strategic objectives and goals
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Governance policies and approval thresholds
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Risk factors and mitigation strategies
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Re-Extraction Confirmation Dialog */}
      <Dialog open={showReExtractionDialog} onOpenChange={setShowReExtractionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Re-Run Policy-as-Code Extraction
            </DialogTitle>
            <DialogDescription>
              This will analyze your annual report again and extract updated strategic information.
              Existing data will not be overwritten unless you approve the changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              The AI will extract:
            </p>
            <ul className="text-sm space-y-1 mt-2 ml-4">
              <li>• Organizational units and structure</li>
              <li>• Financial metrics and KPIs</li>
              <li>• Strategic objectives (OKRs)</li>
              <li>• Governance rules and policies</li>
              <li>• Risk factors</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              You'll review all extracted items before they're added to your system.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReExtractionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => reExtractMutation.mutate()} disabled={reExtractMutation.isPending}>
              {reExtractMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Extraction
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this item from your system.
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
                  deleteUnitMutation.mutate(deletingId);
                }
              }}
              disabled={deleteUnitMutation.isPending}
            >
              {deleteUnitMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
