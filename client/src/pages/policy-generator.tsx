import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCode, Upload, Sparkles, Library, Copy, Download, 
  Trash2, ChevronRight, FileText, Clock, Building2,
  CheckCircle2, Loader2, AlertCircle, ArrowLeft, Users, Eye
} from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BusinessRulesViewer } from '@/components/BusinessRulesViewer';
import { WhatIfPanel } from '@/components/WhatIfPanel';

interface Policy {
  id: string;
  name: string;
  provider: string | null;
  documentId: string | null;
  sourceText: string | null;
  generatedCode: string;
  codeFormat: string | null;
  createdAt: string | null;
}

const EXAMPLE_POLICY = `LIFE INSURANCE AND CRITICAL ILLNESS COVER
POLICY SUMMARY
This policy is provided by Legal & General Assurance Society Limited.

OVERVIEW
These policies are designed for people who want to help protect against the impact of death or terminal illness or critical illness.

WHAT IS COVERED?
Life insurance
You will be covered if before the end of the policy:
- you die
- you are diagnosed as being terminally ill, and in the opinion of your hospital consultant and our medical officer, the illness is expected to lead to death within 12 months.

Critical illness cover
You will be covered if before the end of the policy:
- You are diagnosed with or undergo a medical procedure for one of the critical illnesses we cover and you survive for 14 days from diagnosis.

WHAT IS NOT COVERED?
Life insurance - We won't pay out:
- If within the first year of the policy, your death is caused by suicide or intentional self-injury
- If the length of the policy is less than two years for Terminal Illness claims

Critical illness cover - We won't pay out:
- If death occurs within 14 days of diagnosis
- If you die

AGE LIMITS
- Life Insurance: Maximum age 77, policy must end before age 90
- Critical Illness: Maximum age 67, policy must end before age 75
- Minimum age to take out a policy is 18
- Policy must not end before your 29th birthday

PREMIUMS
Your premiums will remain the same during the length of the policy unless you make any changes.
If you stop paying your premiums your cover will end 60 days after the first missed premium.`;

export default function PolicyGenerator() {
  const [activeTab, setActiveTab] = useState('generate');
  const [policyText, setPolicyText] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [provider, setProvider] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'technical' | 'business'>('technical');
  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/policies');
      if (res.ok) {
        const data = await res.json();
        setPolicies(data);
      }
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
  };

  const handleGenerate = async () => {
    if (!policyText.trim()) {
      setError('Please enter or paste policy text');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedCode('');

    try {
      const res = await fetch('/api/policies/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: policyText,
          name: policyName || 'Untitled Policy',
          provider: provider || null,
          documentId: documentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate policy code');
      }

      const policy = await res.json();
      setGeneratedCode(policy.generatedCode);
      setPolicies(prev => [policy, ...prev]);
      toast({
        title: "Policy Generated",
        description: "Your policy has been converted to code and saved to the library.",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Policy code copied to clipboard",
    });
  };

  const handleDownload = (policy: Policy) => {
    const blob = new Blob([policy.generatedCode], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policy.name.replace(/\s+/g, '_')}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/policies/${id}`, { method: 'DELETE' });
      setPolicies(prev => prev.filter(p => p.id !== id));
      if (selectedPolicy?.id === id) {
        setSelectedPolicy(null);
      }
      toast({
        title: "Deleted",
        description: "Policy removed from library",
      });
    } catch (err) {
      console.error('Failed to delete policy:', err);
    }
  };

  const loadExample = () => {
    setPolicyText(EXAMPLE_POLICY);
    setPolicyName('L&G Life Insurance & Critical Illness');
    setProvider('Legal & General Assurance Society Limited');
    setDocumentId('QGI14786');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#005EB8] to-[#00843D] text-white py-6 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2" data-testid="button-back-dashboard">
                <ArrowLeft size={16} />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <FileCode size={32} />
            <div>
              <h1 className="text-2xl font-bold">Policy as Code Generator</h1>
              <p className="text-white/80">Transform policy documents into machine-readable code using AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="generate" className="gap-2" data-testid="tab-generate">
              <Sparkles size={16} />
              Generate
            </TabsTrigger>
            <TabsTrigger 
              value="business" 
              className="gap-2" 
              data-testid="tab-business"
              disabled={!generatedCode && !selectedPolicy}
            >
              <Users size={16} />
              Business View
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2" data-testid="tab-library">
              <Library size={16} />
              Library ({policies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Upload size={20} />
                      Policy Document Input
                    </span>
                    <Button variant="outline" size="sm" onClick={loadExample} data-testid="button-load-example">
                      Load L&G Example
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Policy Name</label>
                      <Input 
                        placeholder="e.g., Life Insurance Policy"
                        value={policyName}
                        onChange={(e) => setPolicyName(e.target.value)}
                        data-testid="input-policy-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Provider</label>
                      <Input 
                        placeholder="e.g., Legal & General"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        data-testid="input-provider"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Document ID (optional)</label>
                    <Input 
                      placeholder="e.g., QGI14786"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      data-testid="input-document-id"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Policy Text</label>
                    <Textarea 
                      placeholder="Paste the policy document text here..."
                      className="min-h-[300px] font-mono text-sm"
                      value={policyText}
                      onChange={(e) => setPolicyText(e.target.value)}
                      data-testid="textarea-policy-text"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}
                  <Button 
                    className="w-full bg-[#005EB8] hover:bg-[#004a93] gap-2"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating with Claude AI...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Policy as Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileCode size={20} />
                      Generated YAML Code
                    </span>
                    {generatedCode && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopy(generatedCode)}
                        data-testid="button-copy-code"
                      >
                        <Copy size={14} className="mr-1" />
                        Copy
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-[400px] text-muted-foreground"
                      >
                        <Loader2 size={48} className="animate-spin text-[#005EB8] mb-4" />
                        <p className="font-medium">Analyzing policy document...</p>
                        <p className="text-sm">Claude AI is extracting rules and generating code</p>
                      </motion.div>
                    ) : generatedCode ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Policy successfully converted</span>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[400px] text-sm font-mono">
                          {generatedCode}
                        </pre>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg"
                      >
                        <FileCode size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">No code generated yet</p>
                        <p className="text-sm">Paste a policy document and click Generate</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business">
            {(generatedCode || selectedPolicy) ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="text-[#005EB8]" size={24} />
                    <div>
                      <h2 className="text-xl font-bold">Business User Lens</h2>
                      <p className="text-sm text-muted-foreground">
                        View policy rules as a business user - no code syntax, just the rules that matter
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'business' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('business')}
                      className={viewMode === 'business' ? 'bg-[#005EB8]' : ''}
                      data-testid="button-view-business"
                    >
                      <Users size={14} className="mr-1" />
                      Rules View
                    </Button>
                    <Button
                      variant={viewMode === 'technical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('technical')}
                      className={viewMode === 'technical' ? 'bg-[#005EB8]' : ''}
                      data-testid="button-view-technical"
                    >
                      <FileCode size={14} className="mr-1" />
                      Code View
                    </Button>
                  </div>
                </div>

                {viewMode === 'business' ? (
                  <div className="space-y-8">
                    <BusinessRulesViewer 
                      yamlCode={selectedPolicy?.generatedCode || generatedCode}
                      policyName={selectedPolicy?.name || policyName || 'Generated Policy'}
                    />
                    <WhatIfPanel 
                      yamlCode={selectedPolicy?.generatedCode || generatedCode}
                      policyName={selectedPolicy?.name || policyName || 'Generated Policy'}
                    />
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCode size={20} />
                        Technical YAML Code
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[600px] text-sm font-mono">
                        {selectedPolicy?.generatedCode || generatedCode}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No policy available</p>
                  <p className="text-sm">Generate a policy first or select one from the library</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="library">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-semibold text-lg">Saved Policies</h3>
                {policies.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Library size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No policies in library yet</p>
                      <p className="text-sm">Generate your first policy to see it here</p>
                    </CardContent>
                  </Card>
                ) : (
                  policies.map((policy) => (
                    <motion.div
                      key={policy.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedPolicy?.id === policy.id ? 'ring-2 ring-[#005EB8]' : ''
                        }`}
                        onClick={() => setSelectedPolicy(policy)}
                        data-testid={`card-policy-${policy.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{policy.name}</h4>
                              {policy.provider && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                  <Building2 size={12} />
                                  {policy.provider}
                                </div>
                              )}
                              {policy.createdAt && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock size={12} />
                                  {new Date(policy.createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="lg:col-span-2">
                {selectedPolicy ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedPolicy.name}</span>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCopy(selectedPolicy.generatedCode)}
                            data-testid="button-library-copy"
                          >
                            <Copy size={14} className="mr-1" />
                            Copy
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload(selectedPolicy)}
                            data-testid="button-library-download"
                          >
                            <Download size={14} className="mr-1" />
                            Download
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(selectedPolicy.id)}
                            data-testid="button-library-delete"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        {selectedPolicy.provider && (
                          <Badge variant="outline">
                            <Building2 size={12} className="mr-1" />
                            {selectedPolicy.provider}
                          </Badge>
                        )}
                        {selectedPolicy.documentId && (
                          <Badge variant="outline">
                            <FileText size={12} className="mr-1" />
                            {selectedPolicy.documentId}
                          </Badge>
                        )}
                        <Badge variant="secondary">{selectedPolicy.codeFormat?.toUpperCase()}</Badge>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono">
                        {selectedPolicy.generatedCode}
                      </pre>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <FileCode size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Select a policy to view</p>
                      <p className="text-sm">Click on a policy from the list to see its generated code</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
