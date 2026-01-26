/**
 * KNOWLEDGE BASE MANAGEMENT
 *
 * Admin interface for managing organizational knowledge that agents can leverage.
 * Features:
 * - Document upload (PDF, DOCX, TXT, MD)
 * - Agent tagging (assign documents to specific agents)
 * - Document type classification (SOP, guideline, RCA, form, template)
 * - Trigger rules (auto-attach documents on conditions)
 * - Form builder (create fillable forms)
 * - Search and filter
 */

import { AdminLayout } from '@/components/AdminLayout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Bot,
  Tag,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  documentType: string;
  relevantAgents: string[];
  tags: string[];
  content: string;
  summary?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

const DOCUMENT_TYPES = [
  { value: 'guideline', label: 'Guideline', description: 'Best practice guidelines' },
  { value: 'manual', label: 'Manual', description: 'User manuals and how-tos' },
  { value: 'sop', label: 'SOP', description: 'Standard Operating Procedures' },
  { value: 'rca', label: 'RCA', description: 'Root Cause Analysis documents' },
  { value: 'form', label: 'Form', description: 'Fillable forms' },
  { value: 'template', label: 'Template', description: 'Document templates' },
  { value: 'policy', label: 'Policy', description: 'Organizational policies' },
];

const AVAILABLE_AGENTS = [
  { id: 'governance', name: 'Governance Agent', color: 'blue' },
  { id: 'risk', name: 'Risk Agent', color: 'red' },
  { id: 'finops', name: 'FinOps Agent', color: 'green' },
  { id: 'tmo', name: 'TMO Agent', color: 'purple' },
  { id: 'vro', name: 'VRO Agent', color: 'orange' },
  { id: 'planning', name: 'Planning Agent', color: 'indigo' },
  { id: 'ocm', name: 'OCM Agent', color: 'pink' },
  { id: 'pmo', name: 'PMO Agent', color: 'teal' },
  { id: 'okr', name: 'OKR Agent', color: 'yellow' },
];

export default function KnowledgeBaseManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [deleteUsageInfo, setDeleteUsageInfo] = useState<any>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);

  // Form state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    documentType: 'guideline',
    category: 'sop',
    summary: '',
    content: '',
    tags: [] as string[],
    relevantAgents: [] as string[],
    triggerConditions: [] as any[],
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  // Fetch documents
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['knowledge-base', searchQuery, selectedType],
    queryFn: async () => {
      let url = '/api/admin/knowledge-base?';
      if (searchQuery) url += `query=${searchQuery}&`;
      if (selectedType !== 'all') url += `documentType=${selectedType}&`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
  });

  const documents: KnowledgeDocument[] = documentsData?.articles || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create document');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document uploaded successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      setShowUploadDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) throw new Error('No document selected');

      const res = await fetch(`/api/admin/knowledge-base/${selectedDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update document');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document updated successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      setShowEditDialog(false);
      setSelectedDocument(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check document usage before deletion
  const checkUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/knowledge-base/${id}/usage`);
      if (!res.ok) throw new Error('Failed to check document usage');
      return res.json();
    },
    onSuccess: (data) => {
      setDeleteUsageInfo(data.usage);
      setShowDeleteDialog(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation (with force option)
  const deleteMutation = useMutation({
    mutationFn: async ({ id, force }: { id: string; force: boolean }) => {
      const res = await fetch(`/api/admin/knowledge-base/${id}?force=${force}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete document');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document deleted successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      setShowDeleteDialog(false);
      setSelectedDocument(null);
      setDeleteUsageInfo(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Replace document mutation
  const replaceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument || !replacementFile) {
        throw new Error('No document or replacement file selected');
      }

      // Read file content
      const reader = new FileReader();
      const content = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(replacementFile);
      });

      // Replace document via API
      const res = await fetch(`/api/admin/knowledge-base/${selectedDocument.id}/replace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: replacementFile.name.replace(/\.[^/.]+$/, ''),
          content: content,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to replace document');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document replaced successfully! All references have been maintained.',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      setShowReplaceDialog(false);
      setShowDeleteDialog(false);
      setSelectedDocument(null);
      setReplacementFile(null);
      setDeleteUsageInfo(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      documentType: 'guideline',
      category: 'sop',
      summary: '',
      content: '',
      tags: [],
      relevantAgents: [],
      triggerConditions: [],
      status: 'draft',
    });
    setUploadedFile(null);
    setCurrentStep(1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    // Extract text content from file
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ''),
        content: content,
      }));
    };
    reader.readAsText(file);
  };

  const toggleAgent = (agentId: string) => {
    setFormData((prev) => ({
      ...prev,
      relevantAgents: prev.relevantAgents.includes(agentId)
        ? prev.relevantAgents.filter((id) => id !== agentId)
        : [...prev.relevantAgents, agentId],
    }));
  };

  const handleEditClick = (doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    setFormData({
      title: doc.title,
      documentType: doc.documentType,
      category: doc.category,
      summary: doc.summary || '',
      content: doc.content,
      tags: doc.tags,
      relevantAgents: doc.relevantAgents,
      triggerConditions: [],
      status: doc.status,
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    checkUsageMutation.mutate(doc.id);
  };

  const confirmDelete = (force: boolean) => {
    if (selectedDocument) {
      deleteMutation.mutate({ id: selectedDocument.id, force });
    }
  };

  const renderUploadWizard = () => {
    const isEditMode = showEditDialog;
    const isOpen = showUploadDialog || showEditDialog;
    const setIsOpen = isEditMode ? setShowEditDialog : setShowUploadDialog;

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit' : 'Upload'} Knowledge Document</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update document information and agent assignments'
                : 'Upload SOPs, guidelines, forms, or other documents for agents to use'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={`step${currentStep}`} onValueChange={(v) => setCurrentStep(parseInt(v.replace('step', '')))}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="step1">Document</TabsTrigger>
              <TabsTrigger value="step2">Agents & Tags</TabsTrigger>
              <TabsTrigger value="step3">Review</TabsTrigger>
            </TabsList>

            {/* Step 1: Upload Document */}
            <TabsContent value="step1" className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={handleFileUpload}
                  className="mt-2"
                />
                {uploadedFile && (
                  <Alert className="mt-2">
                    <FileCheck className="w-4 h-4" />
                    <AlertDescription>
                      Uploaded: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Compliance Violation Response Procedure"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief summary of what this document covers..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Document content..."
                  rows={10}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </TabsContent>

            {/* Step 2: Agent Tagging */}
            <TabsContent value="step2" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Assign to Agents</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which agents can access and use this document
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {AVAILABLE_AGENTS.map((agent) => {
                    const isSelected = formData.relevantAgents.includes(agent.id);
                    return (
                      <Card
                        key={agent.id}
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          isSelected && 'border-primary bg-primary/5'
                        )}
                        onClick={() => toggleAgent(agent.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSelected} />
                            <Bot className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{agent.name}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="compliance, risk, governance"
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Step 3: Review */}
            <TabsContent value="step3" className="space-y-4">
              <Alert>
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription>
                  Review your document configuration before uploading
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <div className="text-sm font-medium">{formData.title || '—'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Document Type</Label>
                    <Badge variant="outline" className="mt-1">
                      {DOCUMENT_TYPES.find((t) => t.value === formData.documentType)?.label}
                    </Badge>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {formData.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Assigned Agents ({formData.relevantAgents.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.relevantAgents.map((agentId) => {
                      const agent = AVAILABLE_AGENTS.find((a) => a.id === agentId);
                      return (
                        <Badge key={agentId} variant="outline">
                          <Bot className="w-3 h-3 mr-1" />
                          {agent?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {formData.summary && (
                  <div>
                    <Label>Summary</Label>
                    <div className="text-sm text-muted-foreground mt-1">{formData.summary}</div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
            ) : (
              <Button
                onClick={() => isEditMode ? editMutation.mutate() : uploadMutation.mutate()}
                disabled={
                  !formData.title ||
                  formData.relevantAgents.length === 0 ||
                  (isEditMode ? editMutation.isPending : uploadMutation.isPending)
                }
              >
                {isEditMode
                  ? editMutation.isPending
                    ? 'Updating...'
                    : 'Update Document'
                  : uploadMutation.isPending
                  ? 'Uploading...'
                  : 'Upload Document'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Knowledge Base</h1>
            </div>
            <p className="text-muted-foreground">
              Manage organizational documents that agents can use for decision-making
            </p>
          </div>

          <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-xs text-muted-foreground">Total Documents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {documents.filter((d) => d.status === 'published').length}
              </div>
              <div className="text-xs text-muted-foreground">Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(documents.flatMap((d) => d.relevantAgents)).size}
              </div>
              <div className="text-xs text-muted-foreground">Agents Using</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(documents.flatMap((d) => d.tags)).size}
              </div>
              <div className="text-xs text-muted-foreground">Unique Tags</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents List */}
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <Badge variant="outline">
                        {DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label}
                      </Badge>
                    </div>
                    {doc.summary && (
                      <CardDescription className="text-sm">{doc.summary}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(doc)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(doc)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Agents:</span>
                    <div className="flex flex-wrap gap-1">
                      {doc.relevantAgents.map((agentId) => {
                        const agent = AVAILABLE_AGENTS.find((a) => a.id === agentId);
                        return (
                          <Badge key={agentId} variant="secondary" className="text-xs">
                            {agent?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {renderUploadWizard()}

      {/* Delete Confirmation Dialog with Safety Check */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {deleteUsageInfo?.isInUse && (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Delete Document
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.title}
            </DialogDescription>
          </DialogHeader>

          {deleteUsageInfo?.isInUse ? (
            <Alert variant="destructive" className="border-red-600">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="font-semibold">
                    This document is currently in use and cannot be safely deleted!
                  </div>
                  <div className="text-sm">
                    <strong>Usage Summary:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {deleteUsageInfo.usageDetails.agentCount > 0 && (
                        <li>
                          Assigned to <strong>{deleteUsageInfo.usageDetails.agentCount}</strong> agent(s):
                          <div className="ml-4 mt-1 flex flex-wrap gap-1">
                            {deleteUsageInfo.usageDetails.agents.map((agent: any) => (
                              <Badge key={agent.agentId} variant="outline" className="text-xs">
                                {agent.agentName}
                              </Badge>
                            ))}
                          </div>
                        </li>
                      )}
                      {deleteUsageInfo.usageDetails.triggerRules.length > 0 && (
                        <li>
                          Used in <strong>{deleteUsageInfo.usageDetails.triggerRules.length}</strong> trigger rule(s)
                        </li>
                      )}
                      {deleteUsageInfo.usageDetails.relatedArticles.length > 0 && (
                        <li>
                          Referenced by <strong>{deleteUsageInfo.usageDetails.relatedArticles.length}</strong> other document(s)
                        </li>
                      )}
                      <li className="font-medium mt-2">
                        Total References: <strong>{deleteUsageInfo.usageDetails.totalReferences}</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription>
                This document is not currently in use and can be safely deleted.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedDocument(null);
                setDeleteUsageInfo(null);
              }}
            >
              Cancel
            </Button>
            {deleteUsageInfo?.isInUse && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowReplaceDialog(true);
                }}
              >
                Replace with Another Document
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => confirmDelete(deleteUsageInfo?.isInUse)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : deleteUsageInfo?.isInUse ? 'Force Delete Anyway' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
