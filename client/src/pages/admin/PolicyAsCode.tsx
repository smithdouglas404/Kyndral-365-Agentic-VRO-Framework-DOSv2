import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Eye,
  FileCode,
  Activity,
  Shield,
  AlertTriangle,
  Trash2,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { TableSkeleton, CardSkeleton } from '@/components/SkeletonLoaders';
import { NoDataEmptyState } from '@/components/EmptyStates';
import { LastUpdated } from '@/components/LastUpdated';

/**
 * POLICY AS CODE ADMIN PAGE
 *
 * Complete UI for policy-as-code workflow:
 * 1. Document upload
 * 2. Extraction queue/progress
 * 3. HITL review (approve/reject)
 * 4. Active policies list
 * 5. Audit trail
 */

interface Policy {
  id: string;
  sourceDocumentId: string;
  documentName: string;
  documentType: string;
  policyName: string;
  policyDescription: string;
  sectionsCovered: string[];
  policySummary: string;
  fullPolicyCode: {
    customAttributes: any[];
    rules: any[];
    sections: any[];
  };
  customAttributesCreated: number;
  rulesGenerated: number;
  status: 'pending_review' | 'approved' | 'active' | 'scheduled' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  effectiveDate?: string;
  activatedAt?: string;
  llmModelUsed: string;
  extractionConfidence: number;
  extractionTokensUsed: number;
  extractionCost: number;
  complianceFramework: string;
  enforcementLevel: string;
  mandatory: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  name: string;
  documentType: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
}

const STATUS_COLORS = {
  pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  active: 'bg-blue-100 text-blue-800 border-blue-300',
  scheduled: 'bg-purple-100 text-purple-800 border-purple-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function PolicyAsCodePage() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [complianceFramework, setComplianceFramework] = useState('ISO27001');
  const [extractionModel, setExtractionModel] = useState('gpt-4');

  const queryClient = useQueryClient();

  // Fetch policies
  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await fetch('/api/policy');
      if (!response.ok) throw new Error('Failed to fetch policies');
      return response.json();
    },
  });

  // Fetch policy-tagged documents
  const { data: documentsData } = useQuery({
    queryKey: ['documents', 'policy_compliance'],
    queryFn: async () => {
      const response = await fetch('/api/documents?documentType=policy_compliance');
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  // Fetch audit trail
  const { data: auditData } = useQuery({
    queryKey: ['policy-audit', selectedPolicy?.id],
    queryFn: async () => {
      if (!selectedPolicy) return null;
      const response = await fetch(`/api/policy/${selectedPolicy.id}/audit`);
      if (!response.ok) throw new Error('Failed to fetch audit trail');
      return response.json();
    },
    enabled: !!selectedPolicy && auditDialogOpen,
  });

  // Upload document
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'policy_compliance');
      formData.append('category', 'Compliance');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
      setUploadDialogOpen(false);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // Extract policy
  const extractMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/policy/extract/${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: extractionModel,
          complianceFramework,
        }),
      });

      if (!response.ok) throw new Error('Extraction failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy extracted successfully', {
        description: `Policy ID: ${data.policyId}`,
      });
    },
    onError: (error: any) => {
      toast.error(`Extraction failed: ${error.message}`);
    },
  });

  // Approve policy
  const approveMutation = useMutation({
    mutationFn: async ({ policyId, reviewNotes }: { policyId: string; reviewNotes: string }) => {
      const response = await fetch(`/api/policy/${policyId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activateImmediately: true,
          reviewNotes,
        }),
      });

      if (!response.ok) throw new Error('Approval failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy approved and activated');
      setReviewDialogOpen(false);
      setSelectedPolicy(null);
    },
    onError: (error: any) => {
      toast.error(`Approval failed: ${error.message}`);
    },
  });

  // Reject policy
  const rejectMutation = useMutation({
    mutationFn: async ({ policyId, reviewNotes }: { policyId: string; reviewNotes: string }) => {
      const response = await fetch(`/api/policy/${policyId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes }),
      });

      if (!response.ok) throw new Error('Rejection failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy rejected');
      setReviewDialogOpen(false);
      setSelectedPolicy(null);
    },
    onError: (error: any) => {
      toast.error(`Rejection failed: ${error.message}`);
    },
  });

  // Delete policy
  const deleteMutation = useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch(`/api/policy/${policyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast.success('Policy deleted');
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const policies: Policy[] = policiesData?.policies || [];
  const documents: Document[] = documentsData?.documents || [];

  const pendingPolicies = policies.filter(p => p.status === 'pending_review');
  const activePolicies = policies.filter(p => p.status === 'active');
  const scheduledPolicies = policies.filter(p => p.status === 'scheduled');
  const rejectedPolicies = policies.filter(p => p.status === 'rejected');

  return (
    <>
      <GlobalHeader title="Policy as Code" subtitle="LLM-powered compliance automation" />

      <main className="container mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingPolicies.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activePolicies.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${policies.reduce((sum, p) => sum + (p.extractionCost || 0), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pending">
                Pending Review ({pendingPolicies.length})
              </TabsTrigger>
              <TabsTrigger value="active">Active ({activePolicies.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
              <TabsTrigger value="all">All Policies</TabsTrigger>
            </TabsList>

            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Policy Document
            </Button>
          </div>

          {/* Pending Review Tab */}
          <TabsContent value="pending" className="space-y-4">
            {policiesLoading ? (
              <CardSkeleton count={3} />
            ) : pendingPolicies.length === 0 ? (
              <NoDataEmptyState onRefresh={() => queryClient.invalidateQueries({ queryKey: ['policies'] })} />
            ) : (
              pendingPolicies.map((policy) => (
                <PolicyReviewCard
                  key={policy.id}
                  policy={policy}
                  onReview={() => {
                    setSelectedPolicy(policy);
                    setReviewDialogOpen(true);
                  }}
                  onViewAudit={() => {
                    setSelectedPolicy(policy);
                    setAuditDialogOpen(true);
                  }}
                />
              ))
            )}
          </TabsContent>

          {/* Active Policies Tab */}
          <TabsContent value="active" className="space-y-4">
            {activePolicies.length === 0 ? (
              <NoDataEmptyState />
            ) : (
              activePolicies.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onViewAudit={() => {
                    setSelectedPolicy(policy);
                    setAuditDialogOpen(true);
                  }}
                  onDelete={() => {
                    if (confirm('Are you sure you want to delete this policy? This will remove all associated rules and attributes.')) {
                      deleteMutation.mutate(policy.id);
                    }
                  }}
                />
              ))
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No policy documents uploaded yet</p>
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Policy Documents</CardTitle>
                  <CardDescription>
                    Documents tagged as 'policy_compliance' ready for extraction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded {formatDistanceToNow(new Date(doc.createdAt))} ago
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => extractMutation.mutate(doc.id)}
                          disabled={extractMutation.isPending}
                        >
                          {extractMutation.isPending ? (
                            <>
                              <Activity className="h-4 w-4 mr-2 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Extract Policy
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Policies Tab */}
          <TabsContent value="all" className="space-y-4">
            {policiesLoading ? (
              <TableSkeleton rows={10} columns={6} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Policies</CardTitle>
                  <LastUpdated
                    timestamp={new Date()}
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['policies'] })}
                  />
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {policies.map((policy) => (
                        <div
                          key={policy.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{policy.policyName}</p>
                              <Badge className={STATUS_COLORS[policy.status]}>{policy.status}</Badge>
                              <Badge variant="outline">{policy.complianceFramework}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {policy.customAttributesCreated} attributes · {policy.rulesGenerated} rules · {(policy.extractionConfidence * 100).toFixed(0)}% confidence
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPolicy(policy);
                                setAuditDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {policy.status === 'pending_review' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPolicy(policy);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Policy Document</DialogTitle>
            <DialogDescription>
              Upload a compliance policy document (PDF, Word, Text). It will be tagged as 'policy_compliance' for LLM extraction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Document</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework">Compliance Framework</Label>
              <Select value={complianceFramework} onValueChange={setComplianceFramework}>
                <SelectTrigger id="framework">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISO27001">ISO 27001</SelectItem>
                  <SelectItem value="SOX">Sarbanes-Oxley (SOX)</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                  <SelectItem value="PCI-DSS">PCI-DSS</SelectItem>
                  <SelectItem value="SOC2">SOC 2</SelectItem>
                  <SelectItem value="NIST">NIST</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">LLM Model</Label>
              <Select value={extractionModel} onValueChange={setExtractionModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4 (Most Accurate)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Faster)</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro (Cheaper)</SelectItem>
                  <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {selectedPolicy && (
        <ReviewDialog
          policy={selectedPolicy}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          onApprove={(reviewNotes) => approveMutation.mutate({ policyId: selectedPolicy.id, reviewNotes })}
          onReject={(reviewNotes) => rejectMutation.mutate({ policyId: selectedPolicy.id, reviewNotes })}
          isPending={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      {/* Audit Dialog */}
      {selectedPolicy && (
        <AuditDialog
          policy={selectedPolicy}
          auditData={auditData}
          open={auditDialogOpen}
          onOpenChange={setAuditDialogOpen}
        />
      )}
    </>
  );
}

// Helper Components
function PolicyReviewCard({
  policy,
  onReview,
  onViewAudit,
}: {
  policy: Policy;
  onReview: () => void;
  onViewAudit: () => void;
}) {
  return (
    <Card className="border-2 border-yellow-200 bg-yellow-50/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{policy.policyName}</CardTitle>
              <Badge className={STATUS_COLORS[policy.status]}>Pending Review</Badge>
              <Badge variant="outline">{policy.complianceFramework}</Badge>
            </div>
            <CardDescription>{policy.policyDescription}</CardDescription>
          </div>
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Custom Attributes</p>
            <p className="text-2xl font-bold">{policy.customAttributesCreated}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rules</p>
            <p className="text-2xl font-bold">{policy.rulesGenerated}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Confidence</p>
            <p className="text-2xl font-bold">{(policy.extractionConfidence * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Cost</p>
            <p className="text-2xl font-bold">${policy.extractionCost.toFixed(2)}</p>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Extracted {formatDistanceToNow(new Date(policy.createdAt))} ago</p>
            <p>Model: {policy.llmModelUsed} · {policy.extractionTokensUsed.toLocaleString()} tokens</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onViewAudit}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button onClick={onReview}>
              <Shield className="h-4 w-4 mr-2" />
              Review & Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PolicyCard({
  policy,
  onViewAudit,
  onDelete,
}: {
  policy: Policy;
  onViewAudit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{policy.policyName}</CardTitle>
              <Badge className={STATUS_COLORS[policy.status]}>{policy.status}</Badge>
              <Badge variant="outline">{policy.complianceFramework}</Badge>
            </div>
            <CardDescription>{policy.policyDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attributes</p>
              <p className="text-xl font-bold">{policy.customAttributesCreated}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rules</p>
              <p className="text-xl font-bold">{policy.rulesGenerated}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Activated</p>
              <p className="text-sm">
                {policy.activatedAt ? formatDistanceToNow(new Date(policy.activatedAt)) + ' ago' : 'Not activated'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onViewAudit}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewDialog({
  policy,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isPending,
}: {
  policy: Policy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (reviewNotes: string) => void;
  onReject: (reviewNotes: string) => void;
  isPending: boolean;
}) {
  const [reviewNotes, setReviewNotes] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Policy: {policy.policyName}</DialogTitle>
          <DialogDescription>
            Review extracted attributes and rules before activation. This is the Human-in-the-Loop (HITL) approval step.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Policy Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Compliance Framework</p>
              <p className="text-lg">{policy.complianceFramework}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Confidence Score</p>
              <p className="text-lg">{(policy.extractionConfidence * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Extraction Cost</p>
              <p className="text-lg">${policy.extractionCost.toFixed(4)}</p>
            </div>
          </div>

          {/* Custom Attributes */}
          <div>
            <h3 className="font-semibold mb-3">Custom Attributes ({policy.fullPolicyCode.customAttributes.length})</h3>
            <ScrollArea className="h-[200px] border rounded-lg p-4">
              <div className="space-y-3">
                {policy.fullPolicyCode.customAttributes.map((attr, idx) => (
                  <div key={idx} className="p-3 bg-background border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{attr.label}</p>
                      <Badge variant="outline">{attr.dataType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{attr.description}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Owner: {attr.ownerAgent}</span>
                      <span>·</span>
                      <span>Section: {attr.policySection}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Rules */}
          <div>
            <h3 className="font-semibold mb-3">Collaboration Rules ({policy.fullPolicyCode.rules.length})</h3>
            <ScrollArea className="h-[200px] border rounded-lg p-4">
              <div className="space-y-3">
                {policy.fullPolicyCode.rules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-background border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{rule.name}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                        {rule.mandatory && <Badge variant="destructive">Mandatory</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Agent: {rule.sourceAgent}</span>
                      <span>·</span>
                      <span>Section: {rule.policySection}</span>
                      <span>·</span>
                      <span>Type: {rule.complianceType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Review Notes */}
          <div>
            <Label htmlFor="review-notes">Review Notes</Label>
            <Textarea
              id="review-notes"
              placeholder="Add any notes about this policy extraction..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              if (!reviewNotes) {
                toast.error('Review notes are required for rejection');
                return;
              }
              onReject(reviewNotes);
            }}
            disabled={isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => onApprove(reviewNotes || 'Approved for activation')}
            disabled={isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuditDialog({
  policy,
  auditData,
  open,
  onOpenChange,
}: {
  policy: Policy;
  auditData: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Policy Details & Audit Trail</DialogTitle>
          <DialogDescription>
            Complete audit trail for {policy.policyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Policy Details */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Source Document</p>
              <p className="font-medium">{policy.documentName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p>{policy.createdBy}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p>{new Date(policy.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Audit Trail */}
          <div>
            <h3 className="font-semibold mb-4">Extraction Audit Trail</h3>
            {auditData?.auditTrail?.length > 0 ? (
              <div className="space-y-3">
                {auditData.auditTrail.map((entry: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge>{entry.extractionPhase}</Badge>
                      <Badge variant={entry.status === 'success' ? 'default' : 'destructive'}>
                        {entry.status}
                      </Badge>
                    </div>
                    {entry.tokensUsed && (
                      <p className="text-sm text-muted-foreground">
                        Tokens: {entry.tokensUsed.toLocaleString()} · Processing time: {entry.processingTimeMs}ms
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No audit trail available</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
