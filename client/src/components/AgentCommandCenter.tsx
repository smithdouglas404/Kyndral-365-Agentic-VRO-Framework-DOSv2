import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Bot, 
  MessageSquare, 
  AlertTriangle, 
  Users, 
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Brain,
  Shield,
  TrendingUp,
  Activity,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { routeToCommandCenter, AgentAction } from '@/lib/commandCenterBridge';

interface RiskIntervention {
  id: string;
  type: 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  confidence: number;
  suggestedAction: string;
  impact: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'dismissed' | 'executing';
  agentSource: string;
}

interface AgentMessage {
  id: string;
  agent: string;
  agentColor: string;
  message: string;
  type: 'analysis' | 'recommendation' | 'question' | 'agreement' | 'action';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const initialInterventions: RiskIntervention[] = [
  {
    id: 'int-001',
    type: 'dependency',
    severity: 'critical',
    title: 'Cross-ART Dependency Blocking',
    description: 'Enterprise Data Platform API delivery delayed by 3 sprints, blocking Climate Analytics data ingestion.',
    projectId: 'pmo-lgc-002',
    projectName: 'Climate Transition Analytics',
    confidence: 94,
    suggestedAction: 'Escalate to RTE and implement interim mock API for parallel development',
    impact: '$1.2M schedule cost if unresolved',
    timestamp: new Date(),
    status: 'pending',
    agentSource: 'Planning Agent'
  },
  {
    id: 'int-002',
    type: 'budget',
    severity: 'high',
    title: 'Budget Overrun Trajectory',
    description: 'Current burn rate projects $850K overrun by PI 25.1. Primary driver: unplanned infrastructure costs.',
    projectId: 'pmo-grp-001',
    projectName: 'Enterprise Data Platform',
    confidence: 87,
    suggestedAction: 'Defer AI/ML Infrastructure feature to Phase 2, release $400K contingency',
    impact: 'Saves $1.1M, maintains core deliverables',
    timestamp: new Date(),
    status: 'pending',
    agentSource: 'FinOps Agent'
  },
  {
    id: 'int-003',
    type: 'timeline',
    severity: 'high',
    title: 'Regulatory Deadline Risk',
    description: 'TCFD Reporting Automation may miss Q1 2025 compliance deadline based on current velocity.',
    projectId: 'pmo-lgc-002',
    projectName: 'Climate Transition Analytics',
    confidence: 82,
    suggestedAction: 'Add 2 contractors for TCFD feature, parallel track with Net-Zero Tracker',
    impact: 'Regulatory compliance maintained',
    timestamp: new Date(),
    status: 'pending',
    agentSource: 'Governance Agent'
  },
  {
    id: 'int-004',
    type: 'resource',
    severity: 'medium',
    title: 'Key Resource Allocation Conflict',
    description: 'Lead architect assigned to 3 overlapping projects with 150% allocation.',
    projectId: 'pmo-rt-002',
    projectName: 'AI Chatbot Implementation',
    confidence: 78,
    suggestedAction: 'Reassign secondary architect from Client Portal; defer non-critical design reviews',
    impact: 'Prevents burnout, maintains quality',
    timestamp: new Date(),
    status: 'pending',
    agentSource: 'Resource Agent'
  },
  {
    id: 'int-005',
    type: 'quality',
    severity: 'high',
    title: 'Technical Debt Threshold Exceeded',
    description: 'Bulk Annuity Pricing Engine has 23 critical code quality issues blocking deployment.',
    projectId: 'pmo-ir-003',
    projectName: 'Bulk Annuity Pricing Engine',
    confidence: 91,
    suggestedAction: 'Allocate 1 sprint for tech debt remediation before next feature release',
    impact: 'Reduces production incident risk by 65%',
    timestamp: new Date(),
    status: 'pending',
    agentSource: 'Quality Agent'
  }
];

const agentDiscussion: AgentMessage[] = [
  { id: 'msg-1', agent: 'FinOps Agent', agentColor: 'bg-green-500', message: "I've analyzed the Enterprise Data Foundation budget trajectory. Current burn rate suggests $850K overrun by PI 25.1.", type: 'analysis' },
  { id: 'msg-2', agent: 'Planning Agent', agentColor: 'bg-blue-500', message: "Looking at the feature backlog, AI/ML Infrastructure could be deferred to Phase 2 without impacting dependent projects. This would reduce scope by ~25%.", type: 'recommendation' },
  { id: 'msg-3', agent: 'TMO Agent', agentColor: 'bg-teal-500', message: "Change impact assessment: Deferring AI/ML affects 8 stakeholders. I can prepare communications if we proceed.", type: 'analysis' },
  { id: 'msg-4', agent: 'Governance Agent', agentColor: 'bg-purple-500', message: "Scope reduction requires steering committee approval. I can fast-track through CAB with proper documentation.", type: 'question' },
  { id: 'msg-5', agent: 'FinOps Agent', agentColor: 'bg-green-500', message: "Deferral saves $1.1M. Combined with $400K contingency release, we're back within budget tolerance.", type: 'analysis' },
  { id: 'msg-6', agent: 'OKR Agent', agentColor: 'bg-orange-500', message: "This aligns with Q4 objective 'Optimize Portfolio Delivery'. Key result KR2.3 would improve from 65% to 78% achievement.", type: 'agreement' },
  { id: 'msg-7', agent: 'Planning Agent', agentColor: 'bg-blue-500', message: "Consensus reached. Proposed: 1) Defer AI/ML to Phase 2, 2) Release contingency, 3) Fast-track CAB. Ready for human approval.", type: 'action' }
];

const projects = [
  { id: 'pmo-grp-001', name: 'Enterprise Data Platform', status: 'amber' },
  { id: 'pmo-lgc-002', name: 'Climate Transition Analytics', status: 'green' },
  { id: 'pmo-ir-003', name: 'Bulk Annuity Pricing Engine', status: 'green' },
  { id: 'pmo-am-003', name: 'Client Portal Modernization', status: 'green' },
  { id: 'pmo-rc-003', name: 'Regulatory Change Management', status: 'green' },
  { id: 'pmo-rt-002', name: 'AI Chatbot Implementation', status: 'green' },
  { id: 'pmo-lgim-001', name: 'ESG Analytics Dashboard', status: 'green' },
  { id: 'pmo-lgc-003', name: 'Operational Resilience Framework', status: 'amber' }
];

interface AgentCommandCenterProps {
  onNavigateToProject?: (projectId: string) => void;
}

export function AgentCommandCenter({ onNavigateToProject }: AgentCommandCenterProps) {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [interventions, setInterventions] = useState<RiskIntervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<RiskIntervention | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [discussionMessages, setDiscussionMessages] = useState<AgentMessage[]>([]);
  const [isDiscussionPlaying, setIsDiscussionPlaying] = useState(true);
  const [discussionIndex, setDiscussionIndex] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch interventions from database
  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const response = await fetch('/api/interventions');
        if (response.ok) {
          const data = await response.json();
          const dbInterventions = data.interventions || [];
          
          // Map database interventions to component format
          const mappedInterventions: RiskIntervention[] = dbInterventions.map((i: any) => ({
            id: i.id,
            type: i.type as 'dependency' | 'budget' | 'timeline' | 'resource' | 'quality',
            severity: i.severity as 'critical' | 'high' | 'medium',
            title: i.title,
            description: i.description,
            projectId: i.projectId || '',
            projectName: i.projectName || 'Unknown Project',
            confidence: parseFloat(i.confidence) * 100 || 85,
            suggestedAction: i.suggestedAction,
            impact: i.impact || 'Impact assessment pending',
            timestamp: new Date(i.createdAt),
            status: i.status as 'pending' | 'approved' | 'dismissed' | 'executing',
            agentSource: i.agentSource
          }));
          
          // Combine with initial demo data for richer display if DB is sparse
          if (mappedInterventions.length < 3) {
            setInterventions([...mappedInterventions, ...initialInterventions.slice(0, 3 - mappedInterventions.length)]);
          } else {
            setInterventions(mappedInterventions);
          }
        } else {
          // Fallback to demo data
          setInterventions(initialInterventions);
        }
      } catch (error) {
        console.error('Failed to fetch interventions:', error);
        setInterventions(initialInterventions);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInterventions();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchInterventions, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDiscussionPlaying || discussionIndex >= agentDiscussion.length) return;
    const timer = setTimeout(() => {
      setDiscussionMessages(prev => [...prev, agentDiscussion[discussionIndex]]);
      setDiscussionIndex(prev => prev + 1);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isDiscussionPlaying, discussionIndex]);

  const handleApproveIntervention = useCallback(async (id: string) => {
    setProcessingId(id);
    const intervention = interventions.find(i => i.id === id);
    
    if (!intervention) {
      setProcessingId(null);
      return;
    }
    
    setInterventions(prev => prev.map(i => i.id === id ? { ...i, status: 'executing' as const } : i));
    // Sync selected intervention if it's the one being approved
    if (selectedIntervention?.id === id) {
      setSelectedIntervention(prev => prev ? { ...prev, status: 'executing' as const } : null);
    }
    
    // Route to unified Command Center
    const action: AgentAction = {
      actionType: 'approve',
      sourceComponent: 'Agent Command Center',
      interventionData: {
        id: intervention.id,
        type: intervention.type,
        severity: intervention.severity,
        title: intervention.title,
        description: intervention.description,
        projectId: intervention.projectId,
        projectName: intervention.projectName,
        confidence: intervention.confidence,
        suggestedAction: intervention.suggestedAction,
        impact: intervention.impact,
        agentSource: intervention.agentSource
      }
    };
    
    await routeToCommandCenter(action);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setInterventions(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' as const } : i));
    // Sync selected intervention to approved status
    if (selectedIntervention?.id === id) {
      setSelectedIntervention(prev => prev ? { ...prev, status: 'approved' as const } : null);
    }
    setProcessingId(null);
    
    toast.success(`Intervention approved for ${intervention?.projectName}`, {
      description: `${intervention?.agentSource} executing: ${intervention?.suggestedAction.substring(0, 50)}...`
    });
  }, [interventions, selectedIntervention]);

  const handleDismissIntervention = useCallback(async (id: string) => {
    const intervention = interventions.find(i => i.id === id);
    
    if (intervention) {
      // Route to unified Command Center
      const action: AgentAction = {
        actionType: 'dismiss',
        sourceComponent: 'Agent Command Center',
        interventionData: {
          id: intervention.id,
          type: intervention.type,
          severity: intervention.severity,
          title: intervention.title,
          description: intervention.description,
          projectId: intervention.projectId,
          projectName: intervention.projectName,
          confidence: intervention.confidence,
          suggestedAction: intervention.suggestedAction,
          impact: intervention.impact,
          agentSource: intervention.agentSource
        }
      };
      
      await routeToCommandCenter(action);
    }
    
    setInterventions(prev => prev.map(i => i.id === id ? { ...i, status: 'dismissed' as const } : i));
    // Sync selected intervention to dismissed status
    if (selectedIntervention?.id === id) {
      setSelectedIntervention(prev => prev ? { ...prev, status: 'dismissed' as const } : null);
    }
    toast.info(`Intervention dismissed - logged to Command Center`);
  }, [interventions, selectedIntervention]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/ask-pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: chatInput, 
          projectContext: selectedProject !== 'all' ? projects.find(p => p.id === selectedProject)?.name : undefined 
        })
      });
      
      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I apologize, but I was unable to process your request.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRestartDiscussion = () => {
    setDiscussionMessages([]);
    setDiscussionIndex(0);
    setIsDiscussionPlaying(true);
  };

  // Filter by project, then sort pending first
  const filteredByProject = selectedProject === 'all' 
    ? interventions 
    : interventions.filter(i => i.projectId === selectedProject);
  
  // Sort: pending first, then by severity (critical > high > medium), then by timestamp
  const severityOrder = { critical: 0, high: 1, medium: 2 };
  const statusOrder = { pending: 0, executing: 1, approved: 2, dismissed: 3 };
  
  const filteredInterventions = [...filteredByProject].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const pendingInterventions = filteredInterventions.filter(i => i.status === 'pending');
  const approvedCount = filteredInterventions.filter(i => i.status === 'approved').length;
  const dismissedCount = filteredInterventions.filter(i => i.status === 'dismissed').length;

  // Auto-select first intervention when list changes
  useEffect(() => {
    if (filteredInterventions.length > 0 && !selectedIntervention) {
      setSelectedIntervention(filteredInterventions[0]);
    } else if (filteredInterventions.length > 0 && selectedIntervention) {
      // Check if selected is still in filtered list
      const stillExists = filteredInterventions.find(i => i.id === selectedIntervention.id);
      if (!stillExists) {
        setSelectedIntervention(filteredInterventions[0]);
      }
    } else if (filteredInterventions.length === 0) {
      setSelectedIntervention(null);
    }
  }, [filteredInterventions.length, selectedProject]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dependency': return <Activity className="h-4 w-4" />;
      case 'budget': return <TrendingUp className="h-4 w-4" />;
      case 'timeline': return <Clock className="h-4 w-4" />;
      case 'resource': return <Users className="h-4 w-4" />;
      case 'quality': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="agent-command-center">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-command-center-title">Agent Command Center</h2>
            <p className="text-sm text-gray-500">Autonomous AI agents managing your portfolio</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[280px]" data-testid="select-project-filter">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 px-3 py-1" data-testid="badge-agents-active">
              <Zap className="h-3 w-3 mr-1" />
              6 Agents Active
            </Badge>
            {approvedCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800 px-2 py-1" data-testid="badge-approved-count">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {approvedCount} Approved
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="interventions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interventions" className="flex items-center gap-2" data-testid="tab-interventions">
            <AlertTriangle className="h-4 w-4" />
            Risk Interventions
            {pendingInterventions.length > 0 && (
              <Badge className="bg-red-500 text-white text-xs">{pendingInterventions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex items-center gap-2" data-testid="tab-discussion">
            <Users className="h-4 w-4" />
            Agent Discussion
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2" data-testid="tab-chat">
            <MessageSquare className="h-4 w-4" />
            Ask PM Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interventions" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Intervention List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    All Interventions
                    <span className="text-sm font-normal text-gray-500">
                      — {filteredInterventions.length} shown ({pendingInterventions.length} pending)
                      {selectedProject !== 'all' && ` for ${projects.find(p => p.id === selectedProject)?.name || 'selected project'}`}
                    </span>
                  </CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['budget', 'timeline', 'dependency', 'resource', 'quality'].map(type => {
                      const count = filteredInterventions.filter(i => i.type === type).length;
                      if (count === 0) return null;
                      return (
                        <Badge key={type} variant="outline" className="capitalize">
                          {getTypeIcon(type)} <span className="ml-1">{type}: {count}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                      <p>Loading interventions...</p>
                    </div>
                  ) : filteredInterventions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500" data-testid="no-interventions-message">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p className="font-medium">No pending interventions</p>
                      <p className="text-sm">{selectedProject === 'all' ? 'All risks are being managed autonomously' : 'No pending items for this project'}</p>
                      {(approvedCount > 0 || dismissedCount > 0) && (
                        <p className="text-xs mt-2 text-gray-400">
                          {approvedCount} approved, {dismissedCount} dismissed this session
                        </p>
                      )}
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3 pr-4">
                        {filteredInterventions.map((intervention) => (
                          <motion.div
                            key={intervention.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelectedIntervention(intervention)}
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedIntervention?.id === intervention.id 
                                ? 'border-purple-500 bg-purple-50 shadow-md' 
                                : 'bg-white shadow-sm hover:shadow-md hover:border-gray-300'
                            }`}
                            data-testid={`intervention-card-${intervention.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${getSeverityColor(intervention.severity)}`}>
                                {getTypeIcon(intervention.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-semibold text-gray-900 truncate" data-testid={`intervention-title-${intervention.id}`}>{intervention.title}</h4>
                                  <Badge className={getSeverityColor(intervention.severity)} data-testid={`severity-${intervention.id}`}>{intervention.severity}</Badge>
                                  <Badge variant="outline" className={`text-xs ${
                                    intervention.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    intervention.status === 'dismissed' ? 'bg-gray-100 text-gray-600' :
                                    intervention.status === 'executing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>{intervention.status}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{intervention.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Bot className="h-3 w-3" />
                                    {intervention.agentSource}
                                  </span>
                                  <span>{intervention.projectName}</span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    Intervention Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedIntervention ? (
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(selectedIntervention.severity)}>
                            {selectedIntervention.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{selectedIntervention.type}</Badge>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{selectedIntervention.title}</h3>
                      </div>

                      {/* Status */}
                      <div className="p-3 rounded-lg bg-gray-50 border">
                        <div className="text-xs text-gray-500 mb-1">Current Status</div>
                        <div className={`font-semibold capitalize ${
                          selectedIntervention.status === 'approved' ? 'text-green-600' :
                          selectedIntervention.status === 'dismissed' ? 'text-gray-600' :
                          selectedIntervention.status === 'executing' ? 'text-blue-600' :
                          'text-yellow-600'
                        }`}>
                          {selectedIntervention.status === 'pending' && <Clock className="inline h-4 w-4 mr-1" />}
                          {selectedIntervention.status === 'approved' && <CheckCircle2 className="inline h-4 w-4 mr-1" />}
                          {selectedIntervention.status === 'executing' && <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />}
                          {selectedIntervention.status === 'dismissed' && <XCircle className="inline h-4 w-4 mr-1" />}
                          {selectedIntervention.status}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Description</div>
                        <p className="text-sm text-gray-700">{selectedIntervention.description}</p>
                      </div>

                      {/* Source */}
                      <div className="flex items-center gap-2 text-sm">
                        <Bot className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{selectedIntervention.agentSource}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">{selectedIntervention.confidence}% confidence</span>
                      </div>

                      {/* Project */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Project</div>
                        <button 
                          onClick={() => onNavigateToProject?.(selectedIntervention.projectId)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {selectedIntervention.projectName} <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>

                      {/* AI Recommendation */}
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-purple-800 text-sm">AI Recommendation</span>
                        </div>
                        <p className="text-sm text-purple-700">{selectedIntervention.suggestedAction}</p>
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <span className="text-xs text-purple-600 font-medium">Impact: </span>
                          <span className="text-xs text-purple-700">{selectedIntervention.impact}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {selectedIntervention.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDismissIntervention(selectedIntervention.id)}
                            disabled={processingId === selectedIntervention.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveIntervention(selectedIntervention.id)}
                            disabled={processingId === selectedIntervention.id}
                          >
                            {processingId === selectedIntervention.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Select an intervention</p>
                      <p className="text-sm">Click on any item to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Multi-Agent Collaboration
                  <Badge variant="outline" className="text-indigo-600 border-indigo-300">Live Discussion</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDiscussionPlaying(!isDiscussionPlaying)}
                    data-testid="button-toggle-discussion"
                  >
                    {isDiscussionPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRestartDiscussion}
                    data-testid="button-restart-discussion"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200 mb-4" data-testid="discussion-topic-banner">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-gray-900">Topic: Enterprise Data Platform Budget Overrun</span>
                  <Badge className="bg-orange-500 text-white text-xs">high priority</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">Agents deliberating on budget mitigation strategies</p>
              </div>

              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  <AnimatePresence>
                    {discussionMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border-l-4 ${
                          msg.type === 'action' ? 'border-l-orange-400 bg-orange-50' : 'border-l-blue-400 bg-white'
                        } rounded-r-lg p-3 shadow-sm`}
                        data-testid={`agent-message-${msg.id}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-6 w-6 rounded-full ${msg.agentColor} flex items-center justify-center`}>
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-semibold text-sm text-gray-900" data-testid={`agent-name-${msg.id}`}>{msg.agent}</span>
                          <Badge variant="outline" className="text-xs capitalize">{msg.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-700" data-testid={`agent-message-content-${msg.id}`}>{msg.message}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isDiscussionPlaying && discussionIndex < agentDiscussion.length && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2" data-testid="discussion-loading">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>Agents are deliberating...</span>
                    </div>
                  )}

                  {discussionIndex >= agentDiscussion.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
                      data-testid="discussion-consensus-reached"
                    >
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-green-800">Consensus Reached</p>
                      <p className="text-sm text-green-600 mt-1">Agents have aligned on a recommendation. Review in Interventions tab.</p>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                PM Assistant Chat
                <span className="text-sm font-normal text-gray-500">— Ask anything about your portfolio</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4 mb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500" data-testid="chat-empty-state">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-blue-400" />
                    <p className="font-medium">Start a conversation</p>
                    <p className="text-sm">Ask about project status, risks, or recommendations</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {['What are the top risks?', 'Which projects are behind?', 'Budget summary'].map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          onClick={() => setChatInput(q)}
                          data-testid={`button-quick-question-${q.replace(/\s+/g, '-').substring(0, 15)}`}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        data-testid={`chat-message-${msg.id}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start" data-testid="chat-typing-indicator">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your projects..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  data-testid="input-chat-message"
                />
                <Button onClick={handleSendChat} disabled={!chatInput.trim() || isTyping} data-testid="button-send-chat">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
