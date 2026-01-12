import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, FileJson, ChevronRight, ChevronLeft, Check, Loader2, 
  Bot, MessageSquare, Sparkles, Users, Calendar, DollarSign,
  Target, Layers, Milestone, Link2, AlertTriangle, CheckCircle2,
  Building2, ArrowRight
} from 'lucide-react';
import { usePageContext } from '@/contexts/PageContext';
import { toast } from 'sonner';

interface ProjectTemplate {
  id: string;
  name: string;
  bu: string;
  description: string;
  expectedROI: string;
  roiValue: number;
  priority: string;
  status: string;
  budget: { spent: number; total: number; unit: string };
  timeline: { elapsed: number; total: number; unit: string };
  artName?: string;
  portfolioTheme?: string;
  safe?: any;
  features?: any[];
  resources?: any[];
  milestones?: any[];
  safeDependencies?: any[];
  financials?: any;
  currentPI?: number;
  totalPIs?: number;
  velocity?: number;
  burndownHealth?: number;
  qualityScore?: number;
}

interface AgentQuestion {
  id: string;
  agent: string;
  agentColor: string;
  question: string;
  field: string;
  options?: string[];
  answered?: boolean;
  answer?: string;
}

const agentQuestions: AgentQuestion[] = [
  {
    id: 'q1',
    agent: 'Governance Agent',
    agentColor: 'bg-purple-500',
    question: 'Please confirm the project sponsor and approval authority level required.',
    field: 'sponsor',
    options: ['Executive Sponsor Required', 'Director Approval', 'Manager Approval']
  },
  {
    id: 'q2',
    agent: 'FinOps Agent',
    agentColor: 'bg-green-500',
    question: 'What is the budget contingency percentage for this project?',
    field: 'contingency',
    options: ['5%', '10%', '15%', '20%']
  },
  {
    id: 'q3',
    agent: 'Planning Agent',
    agentColor: 'bg-blue-500',
    question: 'When should the kickoff meeting be scheduled?',
    field: 'kickoff',
    options: ['This Week', 'Next Week', 'In 2 Weeks', 'Custom Date']
  },
  {
    id: 'q4',
    agent: 'TMO Agent',
    agentColor: 'bg-teal-500',
    question: 'What is the expected change impact level?',
    field: 'changeImpact',
    options: ['Low - Process Only', 'Medium - Team Restructure', 'High - Organization Wide']
  }
];

const postSaveAgentActions = [
  { agent: 'TMO Agent', action: 'Notifying 12 team members of project initiation...', delay: 0 },
  { agent: 'Planning Agent', action: 'Scheduling kickoff meeting for next Tuesday...', delay: 1500 },
  { agent: 'FinOps Agent', action: 'Creating budget allocation and cost centers...', delay: 3000 },
  { agent: 'Governance Agent', action: 'Initiating approval workflow and compliance checks...', delay: 4500 },
  { agent: 'OKR Agent', action: 'Linking project to strategic objectives...', delay: 6000 },
  { agent: 'OCM Agent', action: 'Preparing change communication plan...', delay: 7500 }
];

export default function ProjectIngestionPage() {
  const [, navigate] = useLocation();
  const { setPageContext } = usePageContext();
  const [step, setStep] = useState<'upload' | 'questions' | 'editor' | 'saving'>('upload');
  const [projectData, setProjectData] = useState<ProjectTemplate | null>(null);
  const [questions, setQuestions] = useState<AgentQuestion[]>(agentQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentCascadeIndex, setAgentCascadeIndex] = useState(-1);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    setPageContext({
      pageType: 'other',
      entityId: 'project-ingestion',
      entityName: 'Project Ingestion',
      breadcrumb: ['Dashboard', 'Project Ingestion']
    });
  }, [setPageContext]);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setAvailableTemplates(data.templates || []))
      .catch(() => setAvailableTemplates([]));
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setProjectData(json);
        setTimeout(() => {
          setIsProcessing(false);
          setStep('questions');
        }, 1500);
      } catch (error) {
        toast.error('Invalid JSON file. Please upload a valid project template.');
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleTemplateSelect = useCallback(async (templateName: string) => {
    if (!templateName) return;
    setSelectedTemplate(templateName);
    setIsProcessing(true);
    
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(templateName)}`);
      const data = await res.json();
      setProjectData(data);
      setTimeout(() => {
        setIsProcessing(false);
        setStep('questions');
      }, 1500);
    } catch (error) {
      toast.error('Failed to load template');
      setIsProcessing(false);
    }
  }, []);

  const handleAnswerQuestion = (answer: string) => {
    const newQuestions = questions.map((q, i) => 
      i === currentQuestionIndex ? { ...q, answered: true, answer } : q
    );
    setQuestions(newQuestions);
    
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 500);
    } else {
      setTimeout(() => setStep('editor'), 800);
    }
  };

  const handleSaveProject = useCallback(() => {
    setStep('saving');
    setAgentCascadeIndex(0);
    
    const runCascade = (index: number) => {
      if (index < postSaveAgentActions.length) {
        setTimeout(() => {
          setAgentCascadeIndex(index + 1);
          toast.success(`${postSaveAgentActions[index].agent}: ${postSaveAgentActions[index].action.replace('...', '')}`, {
            duration: 3000
          });
          runCascade(index + 1);
        }, 1500);
      } else {
        setTimeout(() => {
          toast.success('Project created successfully!');
          navigate('/dashboard');
        }, 2000);
      }
    };
    
    runCascade(0);
  }, [navigate]);

  const updateProjectField = useCallback((field: string, value: any) => {
    setProjectData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="h-16 border-b border-border bg-white flex items-center px-8 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-xl font-bold text-foreground">Project Ingestion</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={step === 'upload' ? 'default' : 'secondary'} className="gap-1">
            <Upload className="h-3 w-3" /> Upload
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={step === 'questions' ? 'default' : 'secondary'} className="gap-1">
            <MessageSquare className="h-3 w-3" /> Review
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={step === 'editor' ? 'default' : 'secondary'} className="gap-1">
            <Layers className="h-3 w-3" /> Edit
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={step === 'saving' ? 'default' : 'secondary'} className="gap-1">
            <Check className="h-3 w-3" /> Create
          </Badge>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-6xl">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Upload Project Template</h2>
                <p className="text-muted-foreground">Select an existing project template or upload a new one</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-8 text-center">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      data-testid="input-file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      {isProcessing ? (
                        <div className="space-y-4">
                          <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
                          <p className="text-lg font-medium">Processing template...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-lg font-medium">Upload JSON Template</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Drag and drop or click to browse
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-primary" />
                      Select Existing Template
                    </CardTitle>
                    <CardDescription>
                      Choose from pre-loaded project templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger data-testid="select-template">
                        <SelectValue placeholder="Select a project template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map(template => (
                          <SelectItem key={template} value={template}>
                            {template.replace(/_/g, ' ').replace('.json', '')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableTemplates.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No templates available. Upload a JSON file instead.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 'questions' && projectData && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">AI Agent Review</h2>
                <p className="text-muted-foreground">
                  Our agents are reviewing "{projectData.name}" and have some questions
                </p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
                    
                    <AnimatePresence mode="wait">
                      {questions.map((q, i) => i === currentQuestionIndex && (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full ${q.agentColor} flex items-center justify-center`}>
                              <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">{q.agent}</p>
                              <p className="text-sm text-muted-foreground">Question {i + 1} of {questions.length}</p>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-primary">
                            <p className="text-lg">{q.question}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {q.options?.map(option => (
                              <Button
                                key={option}
                                variant="outline"
                                className="h-auto py-3 justify-start"
                                onClick={() => handleAnswerQuestion(option)}
                                data-testid={`button-answer-${option.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center gap-2">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      q.answered ? 'bg-green-500' : i === currentQuestionIndex ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'editor' && projectData && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{projectData.name}</h2>
                  <p className="text-muted-foreground">{projectData.bu} • {projectData.priority} priority</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('questions')}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleSaveProject} className="gap-2" data-testid="button-save-project">
                    <Sparkles className="h-4 w-4" /> Create Project
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="info" className="gap-1">
                    <Building2 className="h-4 w-4" /> Info
                  </TabsTrigger>
                  <TabsTrigger value="safe" className="gap-1">
                    <Layers className="h-4 w-4" /> SAFe
                  </TabsTrigger>
                  <TabsTrigger value="features" className="gap-1">
                    <Target className="h-4 w-4" /> Features
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="gap-1">
                    <Users className="h-4 w-4" /> Resources
                  </TabsTrigger>
                  <TabsTrigger value="milestones" className="gap-1">
                    <Milestone className="h-4 w-4" /> Milestones
                  </TabsTrigger>
                  <TabsTrigger value="financials" className="gap-1">
                    <DollarSign className="h-4 w-4" /> Financials
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-6">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Project Name</Label>
                          <Input 
                            value={projectData.name} 
                            onChange={e => updateProjectField('name', e.target.value)}
                            data-testid="input-project-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Business Unit</Label>
                          <Input 
                            value={projectData.bu} 
                            onChange={e => updateProjectField('bu', e.target.value)}
                            data-testid="input-bu"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          value={projectData.description} 
                          onChange={e => updateProjectField('description', e.target.value)}
                          rows={4}
                          data-testid="input-description"
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Expected ROI</Label>
                          <Input 
                            value={projectData.expectedROI} 
                            onChange={e => updateProjectField('expectedROI', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select 
                            value={projectData.priority} 
                            onValueChange={v => updateProjectField('priority', v)}
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
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select 
                            value={projectData.status} 
                            onValueChange={v => updateProjectField('status', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="green">On Track</SelectItem>
                              <SelectItem value="amber">At Risk</SelectItem>
                              <SelectItem value="red">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="safe" className="mt-6">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Agile Release Train (ART)</Label>
                          <Input 
                            value={projectData.artName || ''} 
                            onChange={e => updateProjectField('artName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Portfolio Theme</Label>
                          <Input 
                            value={projectData.portfolioTheme || ''} 
                            onChange={e => updateProjectField('portfolioTheme', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Current PI</Label>
                          <Input 
                            type="number"
                            value={projectData.currentPI || 1} 
                            onChange={e => updateProjectField('currentPI', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total PIs</Label>
                          <Input 
                            type="number"
                            value={projectData.totalPIs || 4} 
                            onChange={e => updateProjectField('totalPIs', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Velocity</Label>
                          <Input 
                            type="number"
                            value={projectData.velocity || 40} 
                            onChange={e => updateProjectField('velocity', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Quality Score</Label>
                          <Input 
                            type="number"
                            value={projectData.qualityScore || 80} 
                            onChange={e => updateProjectField('qualityScore', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      {projectData.safe && (
                        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                          <div className="space-y-2">
                            <Label>Epic ID</Label>
                            <Input value={projectData.safe.epicId || ''} readOnly className="bg-slate-50" />
                          </div>
                          <div className="space-y-2">
                            <Label>Epic Name</Label>
                            <Input value={projectData.safe.epicName || ''} readOnly className="bg-slate-50" />
                          </div>
                          <div className="space-y-2">
                            <Label>Epic Progress</Label>
                            <div className="flex items-center gap-2">
                              <Progress value={projectData.safe.epicProgress || 0} className="flex-1" />
                              <span className="text-sm font-medium">{projectData.safe.epicProgress || 0}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      {projectData.features && projectData.features.length > 0 ? (
                        <div className="space-y-4">
                          {projectData.features.map((feature, idx) => (
                            <div key={feature.id || idx} className="p-4 border rounded-lg bg-slate-50">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{feature.name}</h4>
                                <Badge variant={feature.status === 'done' ? 'default' : 'secondary'}>
                                  {feature.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{feature.completedPoints || 0} / {feature.storyPoints} points</span>
                                <span>Priority: {feature.priority}</span>
                              </div>
                              <Progress 
                                value={(feature.completedPoints / feature.storyPoints) * 100} 
                                className="mt-2 h-2" 
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No features defined yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      {projectData.resources && projectData.resources.length > 0 ? (
                        <div className="space-y-3">
                          {projectData.resources.map((resource, idx) => (
                            <div key={resource.id || idx} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{resource.name}</p>
                                  <p className="text-sm text-muted-foreground">{resource.role} • {resource.team}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{resource.allocation}%</p>
                                <p className="text-xs text-muted-foreground">allocation</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No resources assigned yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="milestones" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      {projectData.milestones && projectData.milestones.length > 0 ? (
                        <div className="space-y-4">
                          {projectData.milestones.map((milestone, idx) => (
                            <div key={milestone.id || idx} className="flex items-start gap-4 p-4 border rounded-lg">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                milestone.status === 'completed' ? 'bg-green-100' : 
                                milestone.status === 'in-progress' ? 'bg-blue-100' : 'bg-slate-100'
                              }`}>
                                {milestone.status === 'completed' ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : milestone.status === 'at-risk' ? (
                                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                                ) : (
                                  <Milestone className="h-5 w-5 text-slate-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">{milestone.name}</h4>
                                  <Badge variant="outline">{milestone.date}</Badge>
                                </div>
                                {milestone.deliverables && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {milestone.deliverables.map((d: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Milestone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No milestones defined yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="financials" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="font-semibold flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Budget
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Spent</Label>
                              <Input 
                                type="number"
                                step="0.1"
                                value={projectData.budget?.spent || 0} 
                                onChange={e => updateProjectField('budget', { ...projectData.budget, spent: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Total</Label>
                              <Input 
                                type="number"
                                step="0.1"
                                value={projectData.budget?.total || 0} 
                                onChange={e => updateProjectField('budget', { ...projectData.budget, total: parseFloat(e.target.value) })}
                              />
                            </div>
                          </div>
                          <Progress 
                            value={((projectData.budget?.spent || 0) / (projectData.budget?.total || 1)) * 100} 
                            className="h-3"
                          />
                        </div>
                        
                        {projectData.financials && (
                          <div className="space-y-4">
                            <h3 className="font-semibold">Financial Metrics</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">NPV</p>
                                <p className="text-xl font-bold">£{projectData.financials.npv}m</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">IRR</p>
                                <p className="text-xl font-bold">{projectData.financials.irr}%</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Payback</p>
                                <p className="text-xl font-bold">{projectData.financials.paybackMonths}mo</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Contingency</p>
                                <p className="text-xl font-bold">£{projectData.financials.contingency}m</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {step === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Creating Project</h2>
                <p className="text-muted-foreground">AI agents are setting up your project...</p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {postSaveAgentActions.map((action, idx) => (
                      <motion.div
                        key={action.agent}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: idx <= agentCascadeIndex ? 1 : 0.3,
                          x: 0 
                        }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          idx < agentCascadeIndex ? 'bg-green-50 border-green-200' : 
                          idx === agentCascadeIndex ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          idx < agentCascadeIndex ? 'bg-green-500' : 
                          idx === agentCascadeIndex ? 'bg-blue-500' : 'bg-slate-300'
                        }`}>
                          {idx < agentCascadeIndex ? (
                            <Check className="h-5 w-5 text-white" />
                          ) : idx === agentCascadeIndex ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          ) : (
                            <Bot className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{action.agent}</p>
                          <p className="text-sm text-muted-foreground">{action.action}</p>
                        </div>
                        {idx < agentCascadeIndex && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
