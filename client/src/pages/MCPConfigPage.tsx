import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Settings, Link2, FileJson, ShieldCheck, Activity,
  RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  Play, Pause, Database, GitBranch, Loader2, Brain, Sparkles,
  Upload, Download, ArrowRightLeft, Layers, Target
} from 'lucide-react';
import nexteraLogo from "@assets/nextera_logo.png";
import { toast } from 'sonner';

interface SourceSystem {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  status: string;
  syncDirection: string;
  syncFrequency: string;
  lastConnectedAt: string | null;
  capabilities: string;
}

interface IngestionJob {
  id: string;
  sourceSystemId: string;
  jobType: string;
  status: string;
  triggeredBy: string;
  entityTypes: string;
  itemsProcessed: string | null;
  itemsCreated: string | null;
  itemsUpdated: string | null;
  itemsFailed: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface FieldMapping {
  id: string;
  sourceSystemId: string;
  sourceEntityType: string;
  targetEntityType: string;
  sourceField: string;
  targetField: string;
  transformType: string;
}

const toolsMenu = [
  { 
    id: 'connect', 
    name: 'Connect & Analyze', 
    icon: Link2, 
    description: 'Connect to external PPM tools and analyze data structure',
    color: 'bg-blue-500'
  },
  { 
    id: 'mapping', 
    name: 'Field Mapping', 
    icon: GitBranch, 
    description: 'Configure field mappings between source and SAFe ontology',
    color: 'bg-purple-500'
  },
  { 
    id: 'qa-gate', 
    name: 'Data QA Gate', 
    icon: ShieldCheck, 
    description: 'AI-powered quality assurance and approval workflow',
    color: 'bg-green-500'
  },
  { 
    id: 'sync-status', 
    name: 'Sync Status', 
    icon: Activity, 
    description: 'Monitor sync jobs and view history',
    color: 'bg-orange-500'
  },
  { 
    id: 'ai-analysis', 
    name: 'AI Data Analysis', 
    icon: Brain, 
    description: 'Anthropic-powered data summarization and POV generation',
    color: 'bg-indigo-500'
  },
];

export default function MCPConfigPage() {
  const [activeTool, setActiveTool] = useState('connect');
  const [sampleData, setSampleData] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: sourceSystems } = useQuery<{ sourceSystems: SourceSystem[] }>({
    queryKey: ['source-systems'],
    queryFn: () => fetch('/api/integrations/source-systems').then(r => r.json()),
  });

  const { data: ingestionJobs } = useQuery<{ ingestionJobs: IngestionJob[] }>({
    queryKey: ['ingestion-jobs'],
    queryFn: () => fetch('/api/integrations/ingestion-jobs').then(r => r.json()),
  });

  const { data: fieldMappings } = useQuery<{ fieldMappings: FieldMapping[] }>({
    queryKey: ['field-mappings'],
    queryFn: () => fetch('/api/integrations/field-mappings').then(r => r.json()),
  });

  const { data: syncMappings } = useQuery<{ mappings: string[] }>({
    queryKey: ['sync-mappings'],
    queryFn: () => fetch('/api/sync/mappings').then(r => r.json()),
  });

  const startSyncMutation = useMutation({
    mutationFn: async (params: { sourceSystemId: string; entityTypes: string[]; direction: string }) => {
      const res = await fetch('/api/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-jobs'] });
      toast.success('Sync job started successfully');
    },
    onError: () => {
      toast.error('Failed to start sync job');
    },
  });

  const analyzeData = async () => {
    if (!sampleData.trim()) {
      toast.error('Please paste sample data to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const parsed = JSON.parse(sampleData);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      
      const res = await fetch('/api/sync/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSystemId: 'analysis',
          sampleRecords: records,
          sourceEntityType: 'jira_epic',
        }),
      });
      
      const result = await res.json();
      setAnalysisResult(result.analysis);
      toast.success('Data analyzed successfully');
    } catch (e) {
      toast.error('Invalid JSON data');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      connected: 'bg-green-100 text-green-700',
      disconnected: 'bg-gray-100 text-gray-700',
      error: 'bg-red-100 text-red-700',
      running: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    };
    return variants[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-200 bg-white flex items-center px-8 justify-between z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <img src={nexteraLogo} alt="NextEra Energy" className="h-10 cursor-pointer" />
          </Link>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#0072CE]" />
            <span className="font-semibold text-lg">MCP Configuration</span>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" data-testid="button-back-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </header>

      <div className="pt-20 px-8 pb-8">
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">MCP Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {toolsMenu.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      activeTool === tool.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    data-testid={`tool-${tool.id}`}
                  >
                    <div className={`p-1.5 rounded ${tool.color} text-white`}>
                      <tool.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{tool.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connected Systems</span>
                  <Badge variant="secondary">
                    {sourceSystems?.sourceSystems?.filter(s => s.status === 'connected').length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Field Mappings</span>
                  <Badge variant="secondary">{fieldMappings?.fieldMappings?.length || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recent Jobs</span>
                  <Badge variant="secondary">{ingestionJobs?.ingestionJobs?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTool === 'connect' && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-blue-500" />
                        Connect & Analyze External Systems
                      </CardTitle>
                      <CardDescription>
                        Connect to PPM tools like Jira, Azure DevOps, ServiceNow and analyze their data structure
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {sourceSystems?.sourceSystems?.map((system) => (
                          <div 
                            key={system.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              {getStatusIcon(system.status)}
                              <div>
                                <div className="font-medium">{system.name}</div>
                                <div className="text-sm text-gray-500">{system.baseUrl}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusBadge(system.status)}>
                                {system.status}
                              </Badge>
                              <Badge variant="outline">{system.type}</Badge>
                              <Button 
                                size="sm" 
                                variant={system.status === 'connected' ? 'outline' : 'default'}
                                onClick={() => {
                                  if (system.status !== 'connected') {
                                    toast.info('Connection wizard would open here');
                                  }
                                }}
                                data-testid={`connect-${system.id}`}
                              >
                                {system.status === 'connected' ? 'Reconnect' : 'Connect'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'mapping' && (
                <motion.div
                  key="mapping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-purple-500" />
                        Field Mapping Configuration
                      </CardTitle>
                      <CardDescription>
                        Map fields from external systems to SAFe ontology entities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Entity Mappings</h4>
                        <div className="flex flex-wrap gap-2">
                          {syncMappings?.mappings?.map((mapping) => (
                            <Badge key={mapping} variant="outline" className="text-sm">
                              {mapping}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Configured Field Mappings</h4>
                        <div className="space-y-2">
                          {fieldMappings?.fieldMappings?.map((fm) => (
                            <div 
                              key={fm.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-4">
                                <Badge variant="outline">{fm.sourceEntityType}</Badge>
                                <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                                <Badge className="bg-purple-100 text-purple-700">{fm.targetEntityType}</Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {fm.sourceField} → {fm.targetField}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'qa-gate' && (
                <motion.div
                  key="qa-gate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        Data Quality Assurance Gate
                      </CardTitle>
                      <CardDescription>
                        AI-powered validation and approval workflow before data ingestion
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            AI-Powered QA Process
                          </h4>
                          <ol className="text-sm text-green-700 space-y-2 ml-6 list-decimal">
                            <li>Connect to external PPM system via MCP</li>
                            <li>AI analyzes data structure and generates summary</li>
                            <li>Initial POV on data quality and completeness</li>
                            <li>SAFe ontology mapping recommendations</li>
                            <li>AI asks clarifying questions based on analysis</li>
                            <li>User approves or requests modifications</li>
                            <li>Data ingested into SAFe hierarchy</li>
                          </ol>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">98.5%</div>
                            <div className="text-sm text-gray-600">Data Quality Score</div>
                          </div>
                          <div className="p-4 border rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">142</div>
                            <div className="text-sm text-gray-600">Records Validated</div>
                          </div>
                          <div className="p-4 border rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">3</div>
                            <div className="text-sm text-gray-600">Pending Approvals</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'sync-status' && (
                <motion.div
                  key="sync-status"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-orange-500" />
                        Sync Status & History
                      </CardTitle>
                      <CardDescription>
                        Monitor active sync jobs and view historical sync operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {ingestionJobs?.ingestionJobs?.slice(0, 10).map((job) => (
                          <div 
                            key={job.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              {getStatusIcon(job.status)}
                              <div>
                                <div className="font-medium">{job.jobType}</div>
                                <div className="text-sm text-gray-500">
                                  {job.sourceSystemId} • {new Date(job.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {job.status === 'completed' && (
                                <div className="text-sm text-gray-600">
                                  {job.itemsProcessed} processed • {job.itemsCreated} created • {job.itemsUpdated} updated
                                </div>
                              )}
                              <Badge className={getStatusBadge(job.status)}>
                                {job.status}
                              </Badge>
                            </div>
                          </div>
                        ))}

                        {(!ingestionJobs?.ingestionJobs || ingestionJobs.ingestionJobs.length === 0) && (
                          <div className="text-center py-8 text-gray-500">
                            No sync jobs found. Start a sync to see history here.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'ai-analysis' && (
                <motion.div
                  key="ai-analysis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-500" />
                        AI Data Analysis & POV Generation
                      </CardTitle>
                      <CardDescription>
                        Paste sample data from your PPM tool for AI-powered analysis and SAFe mapping recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Paste Sample JSON Data
                          </label>
                          <Textarea
                            value={sampleData}
                            onChange={(e) => setSampleData(e.target.value)}
                            placeholder='{"key": "PROJ-123", "summary": "Epic title", "status": {"name": "In Progress"}...}'
                            rows={8}
                            className="font-mono text-sm"
                            data-testid="input-sample-data"
                          />
                        </div>

                        <Button 
                          onClick={analyzeData} 
                          disabled={isAnalyzing}
                          className="w-full"
                          data-testid="button-analyze-data"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing with AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Analyze Data Structure
                            </>
                          )}
                        </Button>

                        {analysisResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 space-y-4"
                          >
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                              <h4 className="font-medium text-indigo-800 mb-3">Analysis Results</h4>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-white rounded border">
                                  <div className="text-sm text-gray-600">Match Confidence</div>
                                  <div className="text-xl font-bold text-indigo-600">
                                    {Math.round(analysisResult.matchConfidence * 100)}%
                                  </div>
                                </div>
                                <div className="p-3 bg-white rounded border">
                                  <div className="text-sm text-gray-600">Detected Fields</div>
                                  <div className="text-xl font-bold text-indigo-600">
                                    {analysisResult.detectedFields?.length || 0}
                                  </div>
                                </div>
                              </div>

                              {analysisResult.suggestedMapping && (
                                <div className="mb-4">
                                  <div className="text-sm font-medium text-indigo-700 mb-2">Suggested Mapping</div>
                                  <Badge className="bg-indigo-100 text-indigo-700">
                                    {analysisResult.suggestedMapping.sourceEntityType} → {analysisResult.suggestedMapping.targetEntityType}
                                  </Badge>
                                </div>
                              )}

                              {analysisResult.recommendations?.length > 0 && (
                                <div>
                                  <div className="text-sm font-medium text-indigo-700 mb-2">Recommendations</div>
                                  <ul className="text-sm text-indigo-600 space-y-1">
                                    {analysisResult.recommendations.map((rec: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div className="p-4 bg-gray-50 border rounded-lg">
                              <h4 className="font-medium text-gray-700 mb-2">Detected Fields</h4>
                              <div className="flex flex-wrap gap-1">
                                {analysisResult.detectedFields?.slice(0, 20).map((field: string) => (
                                  <Badge key={field} variant="outline" className="text-xs">
                                    {field}
                                  </Badge>
                                ))}
                                {analysisResult.detectedFields?.length > 20 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{analysisResult.detectedFields.length - 20} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
