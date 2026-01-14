import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  MessageSquare,
  AlertTriangle,
  Users,
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  Activity,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Target,
  FileCheck,
  Leaf
} from "lucide-react";

const LG = {
  blue: "#005EB8",
  teal: "#00843D",
  red: "#D50032",
  yellow: "#FFD700",
  grey: "#757575",
};

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
  isAutonomous: boolean;
  triggerSource: 'metric_breach' | 'agent_detection' | 'agent_escalation' | 'manual';
  escalatedFromAgentId?: string;
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

async function fetchInterventions(): Promise<RiskIntervention[]> {
  const response = await fetch('/api/interventions');
  if (!response.ok) throw new Error('Failed to fetch interventions');
  const data = await response.json();
  if (!data.interventions) return [];
  return data.interventions.map((i: any) => {
    let confidence = 75;
    if (i.confidence) {
      const parsed = parseFloat(i.confidence);
      confidence = parsed <= 1 ? Math.round(parsed * 100) : parsed;
    }
    return {
      id: i.id,
      type: i.type || 'dependency',
      severity: i.severity || 'medium',
      title: i.title,
      description: i.description,
      projectId: i.projectId,
      projectName: i.projectName || 'Unknown Project',
      confidence,
      suggestedAction: i.suggestedAction,
      impact: i.impact || '',
      timestamp: new Date(i.createdAt),
      status: i.status || 'pending',
      agentSource: i.agentSource || 'System',
      isAutonomous: i.isAutonomous === 'true' || i.isAutonomous === true || i.title?.includes('[AUTONOMOUS]') || i.title?.includes('[AGENT'),
      triggerSource: i.triggerSource || 'manual',
      escalatedFromAgentId: i.escalatedFromAgentId
    };
  });
}

const AGENT_COLORS: Record<string, string> = {
  'finops': 'bg-blue-500',
  'governance': 'bg-purple-500',
  'integrated-management': 'bg-green-500',
  'tmo': 'bg-orange-500',
  'ocm': 'bg-pink-500',
  'okr': 'bg-indigo-500',
  'planning': 'bg-cyan-500',
  'pm-chat': 'bg-indigo-500',
  'autonomous-risk': 'bg-red-500',
  'multi-agent': 'bg-amber-500'
};

function getAgentColor(agentId: string): string {
  return AGENT_COLORS[agentId] || 'bg-blue-500';
}

interface AgentActivity {
  id: string;
  eventType: 'detection' | 'escalation' | 'autonomous_action' | 'agent_to_agent' | 'approval_executed';
  primaryAgentId: string;
  primaryAgentName: string;
  secondaryAgentId?: string;
  secondaryAgentName?: string;
  interventionId?: string;
  summary: string;
  details?: string;
  createdAt: Date;
}

async function fetchAgentActivity(): Promise<AgentActivity[]> {
  const response = await fetch('/api/agent-activity?limit=50');
  if (!response.ok) return [];
  const data = await response.json();
  return (data.activities || []).map((a: any) => ({
    ...a,
    createdAt: new Date(a.createdAt)
  }));
}

async function fetchDiscussions(): Promise<AgentMessage[]> {
  const response = await fetch('/api/agent-discussions');
  if (!response.ok) throw new Error('Failed to fetch discussions');
  const data = await response.json();
  if (!data.discussions || data.discussions.length === 0) return [];
  const latestDiscussion = data.discussions[0];
  const messagesResponse = await fetch(`/api/agent-discussions/${latestDiscussion.id}/messages`);
  if (!messagesResponse.ok) return [];
  const messagesData = await messagesResponse.json();
  return (messagesData.messages || []).map((m: any) => ({
    id: m.id,
    agent: m.agentName,
    agentColor: getAgentColor(m.agentId || 'finops'),
    message: m.content,
    type: m.messageType || 'analysis'
  }));
}

const projects = [
  { id: 'all', name: 'All Projects' },
  { id: 'proj-data-platform', name: 'Enterprise Data Platform' },
  { id: 'proj-climate-analytics', name: 'Climate Transition Analytics' },
  { id: 'proj-pricing-engine', name: 'Bulk Annuity Pricing Engine' },
  { id: 'proj-client-portal', name: 'Client Portal Modernization' },
  { id: 'proj-regulatory', name: 'Regulatory Change Management' },
  { id: 'proj-chatbot', name: 'AI Chatbot Implementation' },
  { id: 'proj-esg', name: 'ESG Analytics Dashboard' },
];

export default function AgentCommandCenterPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("interventions");
  const [selectedProject, setSelectedProject] = useState("all");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Handle deep-linking from URL query params
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const highlightParam = params.get('highlight');
    if (highlightParam) {
      setHighlightedId(highlightParam);
      setActiveTab('interventions');
      // Clear highlight after 5 seconds
      const timer = setTimeout(() => setHighlightedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchString]);

  const { data: interventions = [], isLoading: isLoadingInterventions, error: interventionsError } = useQuery({
    queryKey: ['interventions'],
    queryFn: fetchInterventions,
    refetchInterval: 5000
  });

  const { data: discussionMessages = [], isLoading: isLoadingDiscussions } = useQuery({
    queryKey: ['discussions'],
    queryFn: fetchDiscussions,
    refetchInterval: 5000
  });

  const { data: agentActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['agent-activity'],
    queryFn: fetchAgentActivity,
    refetchInterval: 3000
  });

  // Scroll to highlighted intervention (runs after data loads)
  useEffect(() => {
    if (highlightedId && interventions.length > 0) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        if (highlightRef.current) {
          highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedId, interventions]);

  const handleApproveIntervention = async (id: string) => {
    setProcessingId(id);
    const intervention = interventions.find(i => i.id === id);
    
    try {
      const response = await fetch('/api/interventions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interventionId: id, userId: 'current-user' })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.success(`Intervention approved`, {
        description: `${intervention?.agentSource} executing: ${intervention?.suggestedAction.substring(0, 50)}...`
      });
    } catch (error: any) {
      toast.error('Failed to approve intervention', {
        description: error.message || 'Please try again'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissIntervention = async (id: string) => {
    try {
      const response = await fetch('/api/interventions/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interventionId: id, userId: 'current-user' })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.info(`Intervention dismissed`);
    } catch (error: any) {
      toast.error('Failed to dismiss intervention', {
        description: error.message || 'Please try again'
      });
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/ask-pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: chatInput, 
          pageContext: { pageType: 'portfolio' }
        })
      });
      
      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.answer || 'I apologize, but I was unable to process your request.',
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

  const handleRefreshDiscussions = () => {
    queryClient.invalidateQueries({ queryKey: ['discussions'] });
    toast.info('Refreshing discussions...');
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'dismissed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  
  const pendingInterventions = interventions.filter(i => i.status === 'pending');
  const approvedCount = interventions.filter(i => i.status === 'approved').length;
  const criticalCount = interventions.filter(i => i.severity === 'critical' && i.status === 'pending').length;
  const highCount = interventions.filter(i => i.severity === 'high' && i.status === 'pending').length;
  
  const filteredInterventions = interventions
    .filter(i => selectedProject === 'all' || i.projectId === selectedProject)
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i => severityFilter === 'all' || i.severity === severityFilter)
    .sort((a, b) => {
      const statusOrder = { pending: 0, executing: 1, approved: 2, dismissed: 3 };
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation('/dashboard')}
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                Agent Command Center
              </h1>
              <p className="text-gray-500">Unified AI orchestration for autonomous portfolio management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[280px]" data-testid="select-project-filter">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge className="bg-green-100 text-green-800 px-3 py-1.5" data-testid="badge-agents-active">
              <Zap className="h-3 w-3 mr-1" />
              6 Agents Active
            </Badge>
            {approvedCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1.5" data-testid="badge-approved-count">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {approvedCount} Approved
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card 
            className={`bg-gradient-to-br from-red-500 to-red-600 text-white cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${severityFilter === 'critical' ? 'ring-4 ring-white ring-opacity-50' : ''}`}
            onClick={() => { setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical'); setStatusFilter('pending'); setActiveTab('interventions'); }}
            data-testid="card-critical-alerts"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Critical Alerts</p>
                  <p className="text-3xl font-bold">{criticalCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
              <p className="text-xs text-red-200 mt-2">Click to filter</p>
            </CardContent>
          </Card>
          <Card 
            className={`bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${severityFilter === 'high' ? 'ring-4 ring-white ring-opacity-50' : ''}`}
            onClick={() => { setSeverityFilter(severityFilter === 'high' ? 'all' : 'high'); setStatusFilter('pending'); setActiveTab('interventions'); }}
            data-testid="card-high-priority"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">High Priority</p>
                  <p className="text-3xl font-bold">{highCount}</p>
                </div>
                <Shield className="h-8 w-8 text-orange-200" />
              </div>
              <p className="text-xs text-orange-200 mt-2">Click to filter</p>
            </CardContent>
          </Card>
          <Card 
            className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${statusFilter === 'approved' ? 'ring-4 ring-white ring-opacity-50' : ''}`}
            onClick={() => { setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved'); setSeverityFilter('all'); setActiveTab('interventions'); }}
            data-testid="card-agent-actions"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Agent Actions</p>
                  <p className="text-3xl font-bold">{approvedCount}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-200" />
              </div>
              <p className="text-xs text-blue-200 mt-2">Click to view approved</p>
            </CardContent>
          </Card>
          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            onClick={() => setActiveTab('discussion')}
            data-testid="card-discussions"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Discussions</p>
                  <p className="text-3xl font-bold">{discussionMessages.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-200" />
              </div>
              <p className="text-xs text-green-200 mt-2">Click to view</p>
            </CardContent>
          </Card>
        </div>
        
        {(statusFilter !== 'all' || severityFilter !== 'all') && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Filtering by:</span>
            {severityFilter !== 'all' && (
              <Badge variant="outline" className="capitalize">{severityFilter} severity</Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="outline" className="capitalize">{statusFilter} status</Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setStatusFilter('all'); setSeverityFilter('all'); }}
              className="text-xs"
            >
              Clear filters
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="interventions" className="flex items-center gap-2 py-3" data-testid="tab-interventions">
              <AlertTriangle className="h-4 w-4" />
              Risk Interventions
              {pendingInterventions.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{pendingInterventions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 py-3" data-testid="tab-activity">
              <Activity className="h-4 w-4" />
              Live Activity
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="discussion" className="flex items-center gap-2 py-3" data-testid="tab-discussion">
              <Users className="h-4 w-4" />
              Multi-Agent Discussion
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2 py-3" data-testid="tab-chat">
              <MessageSquare className="h-4 w-4" />
              Ask PM Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interventions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Proactive Risk Interventions
                </CardTitle>
                <CardDescription>AI-detected issues requiring your decision</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInterventions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">Loading interventions...</span>
                  </div>
                ) : interventionsError ? (
                  <div className="text-center py-12 text-red-500" data-testid="interventions-error">
                    <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
                    <p className="font-medium text-lg">Failed to load interventions</p>
                    <p className="text-sm">Please try refreshing the page</p>
                  </div>
                ) : filteredInterventions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500" data-testid="no-interventions">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <p className="font-medium text-lg">
                      {statusFilter !== 'all' || severityFilter !== 'all' 
                        ? 'No interventions match your filters' 
                        : 'No pending interventions'}
                    </p>
                    <p className="text-sm">
                      {statusFilter !== 'all' || severityFilter !== 'all' 
                        ? 'Try adjusting your filter criteria' 
                        : 'All risks are being managed autonomously'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInterventions.map((intervention) => (
                      <motion.div
                        key={intervention.id}
                        ref={highlightedId === intervention.id ? highlightRef : undefined}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          scale: highlightedId === intervention.id ? [1, 1.02, 1] : 1,
                          boxShadow: highlightedId === intervention.id 
                            ? ['0 0 0 0 rgba(99, 102, 241, 0)', '0 0 0 4px rgba(99, 102, 241, 0.4)', '0 0 0 0 rgba(99, 102, 241, 0)']
                            : '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                        transition={{ 
                          duration: highlightedId === intervention.id ? 1.5 : 0.3,
                          repeat: highlightedId === intervention.id ? 2 : 0
                        }}
                        className={`border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow ${
                          highlightedId === intervention.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                        }`}
                        data-testid={`intervention-${intervention.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full ${getSeverityColor(intervention.severity)}`}>
                            {getTypeIcon(intervention.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900">{intervention.title.replace('[AUTONOMOUS] ', '').replace('[AGENT→AGENT] ', '')}</h4>
                              {intervention.isAutonomous && intervention.triggerSource === 'agent_escalation' ? (
                                <Badge className="bg-purple-600 text-white animate-pulse">
                                  <Zap className="h-3 w-3 mr-1" />
                                  AGENT→AGENT
                                </Badge>
                              ) : intervention.isAutonomous ? (
                                <Badge className="bg-indigo-600 text-white animate-pulse">
                                  <Bot className="h-3 w-3 mr-1" />
                                  AUTONOMOUS
                                </Badge>
                              ) : null}
                              <Badge className={getSeverityColor(intervention.severity)}>{intervention.severity}</Badge>
                              <Badge variant="outline">{intervention.confidence}% confidence</Badge>
                              {intervention.status === 'approved' && (
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {intervention.status === 'dismissed' && (
                                <Badge className="bg-gray-100 text-gray-600 border-gray-300">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Dismissed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{intervention.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                              <Bot className="h-3 w-3" />
                              <span>Source: {intervention.agentSource}</span>
                              <span className="mx-2">•</span>
                              <span>{intervention.projectName}</span>
                            </div>
                            
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                <span className="font-medium text-purple-800">AI Recommendation</span>
                              </div>
                              <p className="text-sm text-purple-700">{intervention.suggestedAction}</p>
                              <p className="text-xs text-purple-600 mt-2">Impact: {intervention.impact}</p>
                            </div>
                          </div>
                        </div>
                        
                        {intervention.status === 'pending' && (
                          <div className="flex items-center gap-3 mt-4 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => handleDismissIntervention(intervention.id)}
                              disabled={processingId === intervention.id}
                              data-testid={`btn-dismiss-${intervention.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveIntervention(intervention.id)}
                              disabled={processingId === intervention.id}
                              data-testid={`btn-approve-${intervention.id}`}
                            >
                              {processingId === intervention.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Executing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve Action
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <CardTitle className="flex items-center gap-2 text-green-400 font-mono text-sm">
                      <Activity className="h-4 w-4" />
                      AGENT_ACTIVITY_STREAM
                      <span className="relative flex h-2 w-2 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                    <span className="text-green-400">{agentActivities.length}</span> events
                    <span className="mx-1">|</span>
                    <span>polling: 3s</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingActivities ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                    <span className="ml-2 text-green-400 font-mono text-sm">Connecting to agent network...</span>
                  </div>
                ) : agentActivities.length === 0 ? (
                  <div className="text-center py-12 font-mono">
                    <Activity className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No agent activity detected</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Use Live Demo tab to trigger agent actions
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[550px]">
                    <div className="font-mono text-xs">
                      {agentActivities.slice().reverse().map((activity, index) => {
                        const time = activity.createdAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const msec = activity.createdAt.getMilliseconds().toString().padStart(3, '0');
                        
                        const eventColor = activity.eventType === 'detection' ? 'text-amber-400' :
                          activity.eventType === 'autonomous_action' ? 'text-green-400' :
                          activity.eventType === 'agent_to_agent' ? 'text-purple-400' :
                          'text-blue-400';
                        
                        const eventIcon = activity.eventType === 'detection' ? '🔍' :
                          activity.eventType === 'autonomous_action' ? '⚡' :
                          activity.eventType === 'agent_to_agent' ? '↔️' :
                          '🤖';
                        
                        const eventLabel = activity.eventType === 'detection' ? 'DETECT' :
                          activity.eventType === 'autonomous_action' ? 'ACTION' :
                          activity.eventType === 'agent_to_agent' ? 'A2A' :
                          'EVENT';

                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="px-4 py-2 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-gray-600 whitespace-nowrap">{time}.{msec}</span>
                              <span className={`${eventColor} font-bold w-16`}>[{eventLabel}]</span>
                              <div className="flex-1">
                                <span className="text-cyan-400">{activity.primaryAgentName}</span>
                                {activity.secondaryAgentName && (
                                  <>
                                    <span className="text-gray-500 mx-1">→</span>
                                    <span className="text-pink-400">{activity.secondaryAgentName}</span>
                                  </>
                                )}
                                <span className="text-gray-500 mx-2">:</span>
                                <span className="text-gray-300">{activity.summary}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div className="px-4 py-3 flex items-center gap-2 text-green-400">
                        <span className="animate-pulse">▋</span>
                        <span className="text-gray-500">Listening for agent activity...</span>
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      Multi-Agent Collaboration
                      <Badge variant="outline" className="text-indigo-600 border-indigo-300">Live</Badge>
                    </CardTitle>
                    <CardDescription>Agents deliberating on portfolio issues in real-time</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefreshDiscussions}
                      data-testid="btn-refresh-discussion"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDiscussions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-600">Loading discussions...</span>
                  </div>
                ) : discussionMessages.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium text-gray-700 mb-2">No Active Discussions</p>
                    <p className="text-sm text-gray-500">Agent discussions will appear here when they collaborate on portfolio issues.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200 mb-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-gray-900">Active Agent Discussion</span>
                        <Badge className="bg-orange-500 text-white">In Progress</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Agents deliberating on portfolio issues</p>
                    </div>

                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {discussionMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border-l-4 pl-4 py-3 rounded-r-lg bg-white shadow-sm`}
                            style={{ borderLeftColor: msg.agentColor?.includes('green') ? LG.teal : 
                                                       msg.agentColor?.includes('blue') ? LG.blue : 
                                                       msg.agentColor?.includes('purple') ? '#9333ea' :
                                                       msg.agentColor?.includes('orange') ? '#f97316' :
                                                       msg.agentColor?.includes('teal') ? '#14b8a6' : LG.grey }}
                            data-testid={`discussion-msg-${msg.id}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{msg.agent}</Badge>
                              <Badge variant="secondary" className="text-xs capitalize">{msg.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-700">{msg.message}</p>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Ask PM Assistant
                  <Badge className="bg-purple-100 text-purple-800">AI Powered</Badge>
                </CardTitle>
                <CardDescription>Ask questions about your portfolio, projects, dependencies, and risks</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-800 mb-2">Welcome to Ask PM</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        I have access to all 21 projects in your portfolio. Ask me anything!
                      </p>
                      <div className="space-y-2 max-w-md mx-auto">
                        {[
                          "Which projects have the highest risk exposure?",
                          "What are the critical dependencies blocking delivery?",
                          "Show me budget utilization across the portfolio"
                        ].map((q, i) => (
                          <button
                            key={i}
                            className="w-full text-left p-3 text-sm bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                            onClick={() => {
                              setChatInput(q);
                              handleSendChat();
                            }}
                            data-testid={`suggested-q-${i}`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map(message => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user' 
                              ? 'bg-blue-600' 
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                          }`}>
                            {message.role === 'user' 
                              ? <User className="h-5 w-5 text-white" />
                              : <Bot className="h-5 w-5 text-white" />
                            }
                          </div>
                          <div className={`flex-1 p-4 rounded-xl max-w-[80%] ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          </div>
                          <div className="p-4 rounded-xl bg-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Analyzing portfolio data...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="pt-4 border-t mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Ask about projects, dependencies, risks..."
                      className="flex-1"
                      disabled={isTyping}
                      data-testid="input-chat"
                    />
                    <Button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isTyping}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="btn-send-chat"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
