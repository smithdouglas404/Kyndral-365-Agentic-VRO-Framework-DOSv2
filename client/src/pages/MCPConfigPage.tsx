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
  Upload, Download, ArrowRightLeft, Layers, Target, MessageSquare,
  Send, Gauge, Shield, Workflow, Search, FileSearch, Zap, BarChart3,
  History, AlertCircle, Wrench
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
    id: 'ingestion-wizard', 
    name: 'AI Ingestion Wizard', 
    icon: Sparkles, 
    description: 'AI-powered data connection, analysis, and approval workflow',
    color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    isNew: true
  },
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
  { 
    id: 'schema-explorer', 
    name: 'Schema Explorer', 
    icon: FileSearch, 
    description: 'Browse and visualize SAFe ontology and entity relationships',
    color: 'bg-cyan-500'
  },
  { 
    id: 'conflict-resolver', 
    name: 'Conflict Resolver', 
    icon: AlertCircle, 
    description: 'Manage and resolve data conflicts during sync',
    color: 'bg-red-500'
  },
  { 
    id: 'health-monitor', 
    name: 'Health Monitor', 
    icon: Gauge, 
    description: 'Monitor MCP adapter health and connection status',
    color: 'bg-emerald-500'
  },
  { 
    id: 'batch-import', 
    name: 'Batch Import', 
    icon: Upload, 
    description: 'Import data from CSV, Excel, or JSON files',
    color: 'bg-amber-500'
  },
];

interface IngestionSession {
  id: string;
  name: string;
  status: string;
  aiSummary: string | null;
  aiPov: string | null;
  qualityScore: number | null;
  totalRecords: number | null;
  mappedRecords: number | null;
  createdAt: string;
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  context: string | null;
  questionType: string;
  options: string | null;
  answer: string | null;
  status: string;
  priority: string;
  impactArea: string | null;
}

function SchemaExplorerContent() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const { data: schemaCounts } = useQuery({
    queryKey: ['schema-counts'],
    queryFn: async () => {
      const res = await fetch('/api/safe/schema-counts');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000
  });

  const schemaLevels = [
    {
      name: 'Portfolio Level',
      icon: Layers,
      color: 'blue',
      entities: [
        { id: 'portfolio', name: 'Portfolio', count: schemaCounts?.portfolios || 1, primary: true },
        { id: 'strategic-theme', name: 'Strategic Theme', count: schemaCounts?.themes || 4 },
        { id: 'epic', name: 'Epic', count: schemaCounts?.epics || 24 },
        { id: 'capability', name: 'Capability', count: schemaCounts?.capabilities || 8 },
      ]
    },
    {
      name: 'Value Stream Level',
      icon: Workflow,
      color: 'purple',
      entities: [
        { id: 'value-stream', name: 'Value Stream', count: schemaCounts?.valueStreams || 4, primary: true },
        { id: 'art', name: 'ART', count: schemaCounts?.arts || 6 },
        { id: 'team', name: 'Team', count: schemaCounts?.teams || 18 },
        { id: 'pi', name: 'PI', count: schemaCounts?.pis || 8 },
      ]
    },
    {
      name: 'Delivery Level',
      icon: Target,
      color: 'green',
      entities: [
        { id: 'feature', name: 'Feature', count: schemaCounts?.features || 67, primary: true },
        { id: 'story', name: 'Story', count: schemaCounts?.stories || 248 },
        { id: 'task', name: 'Task', count: schemaCounts?.tasks || 512 },
        { id: 'sprint', name: 'Sprint', count: schemaCounts?.sprints || 24 },
      ]
    },
    {
      name: 'Metrics Level',
      icon: BarChart3,
      color: 'orange',
      entities: [
        { id: 'okr', name: 'OKR', count: schemaCounts?.okrs || 12, primary: true },
        { id: 'kpi', name: 'KPI', count: schemaCounts?.kpis || 24 },
        { id: 'milestone', name: 'Milestone', count: schemaCounts?.milestones || 86 },
        { id: 'risk', name: 'Risk', count: schemaCounts?.risks || 32 },
      ]
    },
  ];

  const entityDetails: Record<string, { description: string; fields: string[]; relationships: string[] }> = {
    'portfolio': { 
      description: 'Top-level container for strategic themes and value streams',
      fields: ['name', 'strategicTheme', 'lpmCadence', 'budgetTotal', 'budgetAllocated'],
      relationships: ['Contains Value Streams', 'Has Strategic Themes', 'Owns Epics']
    },
    'strategic-theme': { 
      description: 'Business objective that connects portfolio vision to solutions',
      fields: ['name', 'description', 'timeHorizon', 'budgetAllocation', 'status'],
      relationships: ['Belongs to Portfolio', 'Guides Epics', 'Drives OKRs']
    },
    'capability': { 
      description: 'Higher-level solution behavior that spans multiple features',
      fields: ['name', 'description', 'status', 'enablers', 'targetPI'],
      relationships: ['Belongs to Epic', 'Contains Features', 'Has Enablers']
    },
    'value-stream': { 
      description: 'Sequence of steps delivering value to customers',
      fields: ['name', 'type', 'owner', 'flowEfficiency', 'leadTime'],
      relationships: ['Belongs to Portfolio', 'Contains ARTs', 'Delivers Features']
    },
    'art': { 
      description: 'Agile Release Train - cross-functional team of teams',
      fields: ['name', 'releaseTrainEngineer', 'productManager', 'piCadence', 'teamCount', 'velocity'],
      relationships: ['Part of Value Stream', 'Contains Teams', 'Delivers PIs']
    },
    'team': { 
      description: 'Cross-functional group delivering stories each sprint',
      fields: ['name', 'type', 'velocity', 'sprintCadence', 'scrumMaster', 'productOwner'],
      relationships: ['Belongs to ART', 'Delivers Stories', 'Participates in Sprints']
    },
    'pi': { 
      description: 'Program Increment - 8-12 week planning and delivery cycle',
      fields: ['name', 'startDate', 'endDate', 'objectives', 'status', 'predictability'],
      relationships: ['Belongs to ART', 'Contains Sprints', 'Delivers Features']
    },
    'feature': { 
      description: 'Customer-facing functionality delivered in a single PI',
      fields: ['name', 'status', 'wsjfScore', 'targetPI', 'benefitHypothesis', 'acceptanceCriteria'],
      relationships: ['Belongs to Epic', 'Contains Stories', 'Has Dependencies']
    },
    'story': { 
      description: 'User-centric requirement that fits in a sprint',
      fields: ['name', 'status', 'storyPoints', 'sprint', 'assignedTeam', 'acceptanceCriteria'],
      relationships: ['Belongs to Feature', 'Contains Tasks', 'Assigned to Team']
    },
    'task': { 
      description: 'Unit of work needed to complete a story',
      fields: ['name', 'status', 'estimatedHours', 'actualHours', 'assignee', 'type'],
      relationships: ['Belongs to Story', 'Assigned to Team Member', 'Tracked in Sprint']
    },
    'sprint': { 
      description: 'Time-boxed iteration (typically 2 weeks) for delivering stories',
      fields: ['name', 'startDate', 'endDate', 'goal', 'velocity', 'status'],
      relationships: ['Belongs to PI', 'Contains Stories', 'Executed by Team']
    },
    'epic': { 
      description: 'Large initiative spanning multiple PIs',
      fields: ['name', 'status', 'leanBusinessCase', 'mvp', 'outcomes', 'budgetRange'],
      relationships: ['Part of Portfolio', 'Contains Features', 'Has Capabilities']
    },
    'okr': { 
      description: 'Objective and Key Results - measurable goals',
      fields: ['objective', 'keyResults', 'owner', 'progress', 'targetDate', 'status'],
      relationships: ['Aligned to Theme', 'Measured by KPIs', 'Drives Projects']
    },
    'kpi': { 
      description: 'Key Performance Indicator - quantitative success metric',
      fields: ['name', 'currentValue', 'targetValue', 'unit', 'trend', 'frequency'],
      relationships: ['Measures OKR', 'Tracked by Dashboard', 'Alerts on Threshold']
    },
    'milestone': { 
      description: 'Significant checkpoint or deliverable date',
      fields: ['name', 'targetDate', 'status', 'deliverables', 'piNumber'],
      relationships: ['Belongs to Project', 'Tracks Deliverables']
    },
    'risk': { 
      description: 'Potential threat to project success',
      fields: ['name', 'probability', 'impact', 'status', 'mitigation', 'owner'],
      relationships: ['Belongs to Project', 'Has Mitigation Actions']
    },
  };

  const getColorClasses = (color: string, isPrimary: boolean) => {
    const colors: Record<string, string> = {
      blue: isPrimary ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
      purple: isPrimary ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200',
      green: isPrimary ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
      orange: isPrimary ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {schemaLevels.map((level) => {
          const Icon = level.icon;
          return (
            <div key={level.name} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 text-${level.color}-500`} />
                {level.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {level.entities.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => setSelectedEntity(selectedEntity === entity.id ? null : entity.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${getColorClasses(level.color, entity.primary || false)} ${selectedEntity === entity.id ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  >
                    {entity.name}
                    <span className="ml-1.5 opacity-75">({entity.count})</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedEntity && entityDetails[selectedEntity] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg capitalize">{selectedEntity.replace('-', ' ')} Entity</h4>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEntity(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-4">{entityDetails[selectedEntity].description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Fields</h5>
                  <div className="flex flex-wrap gap-1">
                    {entityDetails[selectedEntity].fields.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Relationships</h5>
                  <div className="space-y-1">
                    {entityDetails[selectedEntity].relationships.map((rel) => (
                      <div key={rel} className="text-xs text-gray-600 flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3" />
                        {rel}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MCPConfigPage() {
  const [activeTool, setActiveTool] = useState('ingestion-wizard');
  const [sampleData, setSampleData] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wizardStep, setWizardStep] = useState<'connect' | 'analyze' | 'questions' | 'review' | 'approve'>('connect');
  const [currentSession, setCurrentSession] = useState<IngestionSession | null>(null);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
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

  const [selectedSourceType, setSelectedSourceType] = useState('jira_epic');
  const [useAI, setUseAI] = useState(true);

  const analyzeData = async () => {
    if (!sampleData.trim()) {
      toast.error('Please paste sample data to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const parsed = JSON.parse(sampleData);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      
      if (useAI) {
        const res = await fetch('/api/sync/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sampleData: records,
            sourceSystem: selectedSourceType.split('_')[0],
            sourceEntityType: selectedSourceType,
          }),
        });
        
        const result = await res.json();
        if (result.success) {
          setAnalysisResult(result.analysis);
          toast.success('AI analysis completed');
        } else {
          toast.error('AI analysis failed');
        }
      } else {
        const res = await fetch('/api/sync/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceSystemId: 'analysis',
            sampleRecords: records,
            sourceEntityType: selectedSourceType,
          }),
        });
        
        const result = await res.json();
        setAnalysisResult(result.analysis);
        toast.success('Data analyzed successfully');
      }
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
              {activeTool === 'ingestion-wizard' && (
                <motion.div
                  key="ingestion-wizard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        AI-Powered Ingestion Wizard
                        <Badge className="ml-2 bg-blue-100 text-blue-700">New</Badge>
                      </CardTitle>
                      <CardDescription>
                        Connect to MCP server, analyze data with AI, get SAFe mapping recommendations, and approve before ingestion
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex gap-2 mb-6">
                        {['connect', 'analyze', 'questions', 'review', 'approve'].map((step, idx) => (
                          <div key={step} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              wizardStep === step 
                                ? 'bg-blue-600 text-white' 
                                : idx < ['connect', 'analyze', 'questions', 'review', 'approve'].indexOf(wizardStep)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                            }`}>
                              {idx < ['connect', 'analyze', 'questions', 'review', 'approve'].indexOf(wizardStep) ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span className={`text-sm capitalize ${wizardStep === step ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>
                              {step}
                            </span>
                            {idx < 4 && <div className="w-8 h-0.5 bg-gray-200" />}
                          </div>
                        ))}
                      </div>

                      {wizardStep === 'connect' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">Step 1: Connect to Data Source</h4>
                            <p className="text-sm text-blue-700 mb-4">
                              Select a PPM source system or paste sample JSON data to begin AI-powered analysis.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            {sourceSystems?.sourceSystems?.slice(0, 6).map((system) => (
                              <button
                                key={system.id}
                                onClick={() => {
                                  toast.info(`Connecting to ${system.name}...`);
                                }}
                                className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                                data-testid={`wizard-connect-${system.id}`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {getStatusIcon(system.status)}
                                  <span className="font-medium">{system.name}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">{system.type}</Badge>
                              </button>
                            ))}
                          </div>

                          <div className="border-t pt-4 mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Or paste sample JSON data for analysis:
                            </label>
                            <Textarea
                              value={sampleData}
                              onChange={(e) => setSampleData(e.target.value)}
                              placeholder='[{"key": "PROJ-123", "summary": "Epic Title", "type": "Epic", ...}]'
                              className="font-mono text-sm h-32"
                              data-testid="wizard-sample-data"
                            />
                            <Button
                              className="mt-4"
                              disabled={!sampleData.trim() || isAnalyzing}
                              onClick={async () => {
                                try {
                                  setIsAnalyzing(true);
                                  const parsed = JSON.parse(sampleData);
                                  const records = Array.isArray(parsed) ? parsed : [parsed];
                                  
                                  const sessionRes = await fetch('/api/ingestion/sessions', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      name: `Import ${new Date().toLocaleString()}`,
                                      sampleData: records
                                    })
                                  });
                                  if (!sessionRes.ok) {
                                    const err = await sessionRes.json();
                                    throw new Error(err.error || 'Failed to create session');
                                  }
                                  const { session } = await sessionRes.json();
                                  
                                  const analyzeRes = await fetch(`/api/ingestion/sessions/${session.id}/analyze`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      sourceSystem: 'manual',
                                      sourceEntityType: 'unknown'
                                    })
                                  });
                                  if (!analyzeRes.ok) {
                                    const err = await analyzeRes.json();
                                    throw new Error(err.error || 'Failed to analyze data');
                                  }
                                  const { analysis } = await analyzeRes.json();
                                  
                                  setCurrentSession(session);
                                  setAnalysisResult(analysis);
                                  setWizardStep('analyze');
                                  toast.success('Data analyzed successfully');
                                } catch (e: any) {
                                  toast.error(e.message || 'Failed to analyze data');
                                } finally {
                                  setIsAnalyzing(false);
                                }
                              }}
                              data-testid="wizard-analyze-btn"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Analyzing with AI...
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  Analyze Data
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {wizardStep === 'analyze' && analysisResult && (
                        <div className="space-y-4">
                          <div className="p-4 bg-indigo-50 rounded-lg">
                            <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                              <Brain className="h-4 w-4" />
                              AI Analysis Results
                            </h4>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="bg-white p-3 rounded border">
                                <div className="text-2xl font-bold text-indigo-600">{analysisResult.dataQualityScore}%</div>
                                <div className="text-sm text-gray-600">Quality Score</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-2xl font-bold text-blue-600">{analysisResult.recordCount}</div>
                                <div className="text-sm text-gray-600">Records</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-2xl font-bold text-green-600">{analysisResult.safeMapping?.length || 0}</div>
                                <div className="text-sm text-gray-600">SAFe Mappings</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Summary</h5>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{analysisResult.summary}</p>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Point of View</h5>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{analysisResult.pov}</p>
                            </div>
                            {analysisResult.safeMapping?.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-2">SAFe Mapping Recommendations</h5>
                                <div className="space-y-2">
                                  {analysisResult.safeMapping.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-purple-50 rounded">
                                      <Badge variant="outline">{m.sourceEntity}</Badge>
                                      <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                                      <Badge className="bg-purple-100 text-purple-700">{m.targetEntity}</Badge>
                                      <span className="text-sm text-gray-500 ml-auto">{m.confidence}% confidence</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setWizardStep('connect')}>
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Back
                            </Button>
                            <Button 
                              onClick={async () => {
                                if (!currentSession) return;
                                setIsGeneratingQuestions(true);
                                try {
                                  const res = await fetch(`/api/ingestion/sessions/${currentSession.id}/questions`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ sourceSystem: 'manual', sourceEntityType: 'unknown' })
                                  });
                                  const { questions: newQuestions } = await res.json();
                                  setQuestions(newQuestions || []);
                                  setWizardStep('questions');
                                } catch (e) {
                                  toast.error('Failed to generate questions');
                                } finally {
                                  setIsGeneratingQuestions(false);
                                }
                              }}
                              disabled={isGeneratingQuestions}
                            >
                              {isGeneratingQuestions ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating Questions...
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Continue to Clarifying Questions
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {wizardStep === 'questions' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              AI Clarifying Questions
                            </h4>
                            <p className="text-sm text-yellow-700">
                              Answer these questions to help the AI better understand your data and improve mapping accuracy.
                            </p>
                          </div>

                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {questions.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No clarifying questions needed. Your data looks good!</p>
                              </div>
                            ) : (
                              questions.map((q, idx) => (
                                <div key={q.id} className={`p-4 rounded-lg border ${q.status === 'answered' ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                                  <div className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                      q.status === 'answered' ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {q.status === 'answered' ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">{q.priority}</Badge>
                                        <span className="text-xs text-gray-500">{q.impactArea || 'general'}</span>
                                      </div>
                                      <p className="font-medium text-gray-800 mb-2">{q.question}</p>
                                      {q.context && <p className="text-sm text-gray-500 mb-3">{q.context}</p>}
                                      
                                      {q.status === 'answered' ? (
                                        <div className="bg-green-100 p-2 rounded text-sm text-green-800">
                                          {q.answer}
                                        </div>
                                      ) : (
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            placeholder="Type your answer..."
                                            className="flex-1 px-3 py-2 border rounded text-sm"
                                            value={currentAnswer}
                                            onChange={(e) => setCurrentAnswer(e.target.value)}
                                            data-testid={`question-input-${q.id}`}
                                          />
                                          <Button
                                            size="sm"
                                            onClick={async () => {
                                              if (!currentAnswer.trim()) return;
                                              try {
                                                await fetch(`/api/ingestion/questions/${q.id}/answer`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ answer: currentAnswer })
                                                });
                                                setQuestions(prev => prev.map(pq => 
                                                  pq.id === q.id ? { ...pq, status: 'answered', answer: currentAnswer } : pq
                                                ));
                                                setCurrentAnswer('');
                                                toast.success('Answer submitted');
                                              } catch (e) {
                                                toast.error('Failed to submit answer');
                                              }
                                            }}
                                            data-testid={`answer-btn-${q.id}`}
                                          >
                                            <Send className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setWizardStep('analyze')}>
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Back
                            </Button>
                            <Button onClick={() => setWizardStep('review')}>
                              Continue to QA Review
                              <ArrowRightLeft className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {wizardStep === 'review' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Quality Assurance Review
                            </h4>
                            <p className="text-sm text-green-700">
                              All QA checks have passed. Review the summary below before approving the ingestion.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {['data_quality', 'mapping_accuracy', 'schema_validation', 'completeness'].map((type) => (
                              <div key={type} className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                                </div>
                                <Progress value={analysisResult?.dataQualityScore || 85} className="h-2" />
                                <span className="text-sm text-gray-500 mt-1 block">
                                  {analysisResult?.dataQualityScore || 85}% passed
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setWizardStep('questions')}>
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Back
                            </Button>
                            <Button 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setWizardStep('approve')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve & Continue
                            </Button>
                          </div>
                        </div>
                      )}

                      {wizardStep === 'approve' && (
                        <div className="space-y-4 text-center py-8">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-green-800">Ready for Ingestion</h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            Your data has been analyzed, questions answered, and QA review passed.
                            Click below to begin importing {analysisResult?.recordCount || 0} records into your SAFe hierarchy.
                          </p>
                          
                          <div className="flex gap-3 justify-center pt-4">
                            <Button variant="outline" onClick={() => setWizardStep('review')}>
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Back to Review
                            </Button>
                            <Button 
                              size="lg"
                              className="bg-gradient-to-r from-blue-600 to-indigo-600"
                              onClick={async () => {
                                if (!currentSession) return;
                                try {
                                  await fetch(`/api/ingestion/sessions/${currentSession.id}/approve`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ approvedBy: 'user' })
                                  });
                                  
                                  const res = await fetch(`/api/ingestion/sessions/${currentSession.id}/ingest`, {
                                    method: 'POST'
                                  });
                                  const result = await res.json();
                                  
                                  toast.success(`Successfully imported ${result.stats?.mappedRecords || 0} records!`);
                                  setWizardStep('connect');
                                  setCurrentSession(null);
                                  setAnalysisResult(null);
                                  setQuestions([]);
                                  setSampleData('');
                                } catch (e) {
                                  toast.error('Failed to complete ingestion');
                                }
                              }}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Start Ingestion
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

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
                        Paste sample data from your PPM tool for Anthropic-powered analysis and SAFe mapping recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Source Entity Type
                            </label>
                            <select
                              value={selectedSourceType}
                              onChange={(e) => setSelectedSourceType(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              data-testid="select-source-type"
                            >
                              <option value="jira_epic">Jira Epic</option>
                              <option value="jira_story">Jira Story</option>
                              <option value="azure_work_item">Azure DevOps Work Item</option>
                              <option value="servicenow_project">ServiceNow Project</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={useAI}
                                onChange={(e) => setUseAI(e.target.checked)}
                                className="rounded"
                              />
                              Use AI-powered analysis (Anthropic)
                            </label>
                          </div>
                        </div>

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
                              {useAI ? 'Analyzing with Anthropic AI...' : 'Analyzing...'}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              {useAI ? 'Analyze with AI' : 'Analyze Data Structure'}
                            </>
                          )}
                        </Button>

                        {analysisResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 space-y-4"
                          >
                            {analysisResult.summary && (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">Summary</h4>
                                <p className="text-sm text-blue-700">{analysisResult.summary}</p>
                              </div>
                            )}

                            {analysisResult.pov && (
                              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <h4 className="font-medium text-purple-800 mb-2">AI Point of View</h4>
                                <p className="text-sm text-purple-700">{analysisResult.pov}</p>
                              </div>
                            )}

                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                              <h4 className="font-medium text-indigo-800 mb-3">Analysis Results</h4>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-white rounded border">
                                  <div className="text-sm text-gray-600">
                                    {analysisResult.safeMapping ? 'Mapping Confidence' : 'Match Confidence'}
                                  </div>
                                  <div className="text-xl font-bold text-indigo-600">
                                    {Math.round((analysisResult.safeMapping?.confidence || analysisResult.matchConfidence || 0) * 100)}%
                                  </div>
                                </div>
                                <div className="p-3 bg-white rounded border">
                                  <div className="text-sm text-gray-600">
                                    {analysisResult.dataQuality ? 'Data Quality Score' : 'Detected Fields'}
                                  </div>
                                  <div className="text-xl font-bold text-indigo-600">
                                    {analysisResult.dataQuality?.score || analysisResult.detectedFields?.length || 0}
                                    {analysisResult.dataQuality ? '/100' : ''}
                                  </div>
                                </div>
                              </div>

                              {analysisResult.safeMapping && (
                                <div className="mb-4">
                                  <div className="text-sm font-medium text-indigo-700 mb-2">SAFe Mapping Recommendation</div>
                                  <Badge className="bg-indigo-100 text-indigo-700">
                                    {selectedSourceType} → {analysisResult.safeMapping.suggestedEntityType}
                                  </Badge>
                                  {analysisResult.safeMapping.reasoning && (
                                    <p className="text-xs text-gray-600 mt-2">{analysisResult.safeMapping.reasoning}</p>
                                  )}
                                </div>
                              )}

                              {analysisResult.suggestedMapping && !analysisResult.safeMapping && (
                                <div className="mb-4">
                                  <div className="text-sm font-medium text-indigo-700 mb-2">Suggested Mapping</div>
                                  <Badge className="bg-indigo-100 text-indigo-700">
                                    {analysisResult.suggestedMapping.sourceEntityType} → {analysisResult.suggestedMapping.targetEntityType}
                                  </Badge>
                                </div>
                              )}

                              {analysisResult.dataQuality?.issues?.length > 0 && (
                                <div className="mb-4">
                                  <div className="text-sm font-medium text-red-700 mb-2">Data Quality Issues</div>
                                  <ul className="text-sm text-red-600 space-y-1">
                                    {analysisResult.dataQuality.issues.map((issue: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        {issue}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {(analysisResult.dataQuality?.recommendations?.length > 0 || analysisResult.recommendations?.length > 0) && (
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

                            {analysisResult.clarifyingQuestions?.length > 0 && (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-medium text-yellow-800 mb-2">Clarifying Questions</h4>
                                <p className="text-xs text-yellow-600 mb-3">Please answer these questions to proceed with QA Gate approval:</p>
                                <ol className="text-sm text-yellow-700 space-y-2 list-decimal ml-4">
                                  {analysisResult.clarifyingQuestions.map((q: string, i: number) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {analysisResult.detectedFields?.length > 0 && (
                              <div className="p-4 bg-gray-50 border rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">Detected Fields</h4>
                                <div className="flex flex-wrap gap-1">
                                  {analysisResult.detectedFields.slice(0, 20).map((field: string) => (
                                    <Badge key={field} variant="outline" className="text-xs">
                                      {field}
                                    </Badge>
                                  ))}
                                  {analysisResult.detectedFields.length > 20 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{analysisResult.detectedFields.length - 20} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'schema-explorer' && (
                <motion.div
                  key="schema-explorer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileSearch className="h-5 w-5 text-cyan-500" />
                        SAFe Ontology Schema Explorer
                      </CardTitle>
                      <CardDescription>
                        Browse and visualize the SAFe 6.0 entity hierarchy and relationships. Click any entity to see details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SchemaExplorerContent />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'conflict-resolver' && (
                <motion.div
                  key="conflict-resolver"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Data Conflict Resolver
                      </CardTitle>
                      <CardDescription>
                        Manage and resolve data conflicts during bidirectional sync operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-500">
                        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-400" />
                        <h3 className="text-lg font-medium text-gray-700">No Active Conflicts</h3>
                        <p className="text-sm">All data sync operations are running smoothly</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'health-monitor' && (
                <motion.div
                  key="health-monitor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-emerald-500" />
                        MCP Health Monitor
                      </CardTitle>
                      <CardDescription>
                        Real-time monitoring of MCP adapter connections and health status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-3xl font-bold text-green-600">3</div>
                          <div className="text-sm text-gray-600">Healthy</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-3xl font-bold text-yellow-600">1</div>
                          <div className="text-sm text-gray-600">Degraded</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-3xl font-bold text-gray-400">2</div>
                          <div className="text-sm text-gray-600">Inactive</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-3xl font-bold text-blue-600">99.8%</div>
                          <div className="text-sm text-gray-600">Uptime</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {['Jira MCP', 'Azure DevOps MCP', 'ServiceNow MCP'].map((adapter, i) => (
                          <div key={adapter} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${i === 1 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                              <span className="font-medium">{adapter}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">Last check: 2m ago</span>
                              <Badge className={i === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}>
                                {i === 1 ? 'Degraded' : 'Healthy'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTool === 'batch-import' && (
                <motion.div
                  key="batch-import"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-amber-500" />
                        Batch Import Tool
                      </CardTitle>
                      <CardDescription>
                        Import data from CSV, Excel, or JSON files into your SAFe hierarchy
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-amber-400 transition-colors cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Drop files here or click to upload</h3>
                        <p className="text-sm text-gray-500 mb-4">Supports CSV, Excel (.xlsx), and JSON files</p>
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Select Files
                        </Button>
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
