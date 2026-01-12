import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
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
  return data.interventions.map((i: any) => ({
    id: i.id,
    type: i.type || 'dependency',
    severity: i.severity || 'medium',
    title: i.title,
    description: i.description,
    projectId: i.projectId,
    projectName: i.projectName || 'Unknown Project',
    confidence: i.confidence || 75,
    suggestedAction: i.suggestedAction,
    impact: i.impact || '',
    timestamp: new Date(i.createdAt),
    status: i.status || 'pending',
    agentSource: i.agentSource || 'System'
  }));
}

const AGENT_COLORS: Record<string, string> = {
  'finops': 'bg-blue-500',
  'governance': 'bg-purple-500',
  'integrated-management': 'bg-green-500',
  'tmo': 'bg-orange-500',
  'ocm': 'bg-pink-500',
  'okr': 'bg-indigo-500',
  'planning': 'bg-cyan-500',
  'pm-chat': 'bg-indigo-500'
};

function getAgentColor(agentId: string): string {
  return AGENT_COLORS[agentId] || 'bg-blue-500';
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("interventions");
  const [selectedProject, setSelectedProject] = useState("all");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const pendingInterventions = interventions.filter(i => i.status === 'pending');
  const filteredInterventions = selectedProject === 'all' 
    ? pendingInterventions 
    : pendingInterventions.filter(i => i.projectId === selectedProject);
  const approvedCount = interventions.filter(i => i.status === 'approved').length;

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
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Critical Alerts</p>
                  <p className="text-3xl font-bold">{interventions.filter(i => i.severity === 'critical' && i.status === 'pending').length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">High Priority</p>
                  <p className="text-3xl font-bold">{interventions.filter(i => i.severity === 'high' && i.status === 'pending').length}</p>
                </div>
                <Shield className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Agent Actions</p>
                  <p className="text-3xl font-bold">{approvedCount}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Discussions</p>
                  <p className="text-3xl font-bold">{discussionMessages.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="interventions" className="flex items-center gap-2 py-3" data-testid="tab-interventions">
              <AlertTriangle className="h-4 w-4" />
              Risk Interventions
              {pendingInterventions.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{pendingInterventions.length}</Badge>
              )}
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
                    <p className="font-medium text-lg">No pending interventions</p>
                    <p className="text-sm">All risks are being managed autonomously</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInterventions.map((intervention) => (
                      <motion.div
                        key={intervention.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                        data-testid={`intervention-${intervention.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full ${getSeverityColor(intervention.severity)}`}>
                            {getTypeIcon(intervention.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{intervention.title}</h4>
                              <Badge className={getSeverityColor(intervention.severity)}>{intervention.severity}</Badge>
                              <Badge variant="outline">{intervention.confidence}% confidence</Badge>
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
                      </motion.div>
                    ))}
                  </div>
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
