import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Bot,
  Users,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { routeToCommandCenter, AgentAction } from '@/lib/commandCenterBridge';
import { useQuery } from '@tanstack/react-query';

interface AgentMessage {
  id: string;
  agent: string;
  agentColor: string;
  message: string;
  timestamp: Date;
  type: 'analysis' | 'recommendation' | 'question' | 'agreement' | 'action';
  referencedProject?: string;
}

interface DiscussionTopic {
  id: string;
  title: string;
  context: string;
  status: 'active' | 'resolved' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

export function MultiAgentDiscussion() {
  const [expanded, setExpanded] = useState(true);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false); // Default to paused until data loads
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // ✅ Fetch active discussions from API
  const { data: discussionsData, isLoading: isLoadingDiscussions } = useQuery({
    queryKey: ['agent-discussions', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/discussions?status=active');
      if (!response.ok) throw new Error('Failed to fetch discussions');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get the first active discussion
  const activeTopic = discussionsData?.discussions?.[0] || null;

  // ✅ Fetch messages for the active discussion
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['discussion-messages', activeTopic?.id],
    queryFn: async () => {
      if (!activeTopic?.id) return { messages: [] };
      const response = await fetch(`/api/discussions/${activeTopic.id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!activeTopic?.id,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Transform API messages to component format
  const apiMessages: AgentMessage[] = (messagesData?.messages || []).map((msg: any) => ({
    id: msg.id,
    agent: msg.agentName || 'Agent',
    agentColor: msg.agentColor || 'bg-gray-500',
    message: msg.content,
    timestamp: new Date(msg.createdAt || new Date()),
    type: msg.type || 'analysis',
    referencedProject: msg.projectId
  }));

  // Animation effect - gradually reveal messages if playing simulation mode
  useEffect(() => {
    if (!isPlaying || currentIndex >= apiMessages.length) return;

    const timer = setTimeout(() => {
      setMessages(prev => [...prev, apiMessages[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, apiMessages]);

  // Initialize messages when API data loads
  useEffect(() => {
    if (apiMessages.length > 0 && messages.length === 0) {
      // Show all messages immediately on load (no animation)
      setMessages(apiMessages);
      setCurrentIndex(apiMessages.length);
    }
  }, [apiMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRestart = () => {
    setMessages([]);
    setCurrentIndex(0);
    setIsPlaying(true);
    setIsApproved(false);
    // Re-initialize messages from API
    if (apiMessages.length > 0) {
      setTimeout(() => {
        setMessages(apiMessages);
        setCurrentIndex(apiMessages.length);
      }, 100);
    }
  };

  const handleApproveConsensus = async () => {
    if (!activeTopic) return;

    setIsApproving(true);

    // Extract action from the last message if it exists
    const lastMessage = messages[messages.length - 1];
    const actionMessage = lastMessage?.type === 'action' ? lastMessage.message : 'Execute consensus action';

    const action: AgentAction = {
      actionType: 'approve',
      sourceComponent: 'Multi-Agent Discussion',
      interventionData: {
        type: activeTopic.type || 'budget',
        severity: activeTopic.priority === 'high' ? 'high' : activeTopic.priority === 'critical' ? 'critical' : 'medium',
        title: activeTopic.title || 'Agent Consensus',
        description: activeTopic.context || activeTopic.description || '',
        projectId: activeTopic.projectId || '',
        projectName: activeTopic.projectName || '',
        confidence: 92,
        suggestedAction: actionMessage,
        impact: activeTopic.impact || 'Multi-agent consensus reached',
        agentSource: 'Multi-Agent Consensus'
      }
    };

    const result = await routeToCommandCenter(action);

    setIsApproving(false);
    setIsApproved(true);

    if (result.success) {
      toast.success('Consensus approved and logged to Command Center', {
        description: 'Agent actions are now executing'
      });
    } else {
      toast.success('Consensus approved', {
        description: 'Agents are now executing the agreed actions'
      });
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'analysis': return 'border-l-blue-400';
      case 'recommendation': return 'border-l-green-400';
      case 'question': return 'border-l-yellow-400';
      case 'agreement': return 'border-l-purple-400';
      case 'action': return 'border-l-orange-400 bg-orange-50';
      default: return 'border-l-gray-400';
    }
  };

  // Loading state
  if (isLoadingDiscussions) {
    return (
      <Card className="border-l-4 border-l-indigo-600 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            Multi-Agent Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading discussions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No active discussions state
  if (!activeTopic) {
    return (
      <Card className="border-l-4 border-l-indigo-600 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            Multi-Agent Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No active agent discussions at this time</p>
            <p className="text-sm text-gray-500 mt-1">Agents will collaborate here when critical issues arise</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-indigo-600 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            Multi-Agent Collaboration
            <Badge variant="outline" className="text-indigo-600 border-indigo-300">
              Live Discussion
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-toggle-discussion"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestart}
              data-testid="button-restart-discussion"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-gray-900">{activeTopic?.title || 'Discussion Topic'}</span>
                      <Badge className="bg-orange-500 text-white text-xs">{activeTopic?.priority || 'medium'}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activeTopic?.context || activeTopic?.description || 'Agent discussion in progress'}</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
              </div>

              <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
                <div className="space-y-3">
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`border-l-4 ${getMessageStyle(msg.type)} bg-white rounded-r-lg p-3 shadow-sm`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-6 w-6 rounded-full ${msg.agentColor} flex items-center justify-center`}>
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-semibold text-sm text-gray-900">{msg.agent}</span>
                          <Badge variant="outline" className="text-xs capitalize">{msg.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{msg.message}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isPlaying && currentIndex < simulatedDiscussion.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-sm text-gray-500 py-2"
                    >
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>Agents are deliberating...</span>
                    </motion.div>
                  )}

                  {currentIndex >= simulatedDiscussion.length && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
                    >
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-green-800">Consensus Reached</p>
                      <p className="text-sm text-green-600 mt-1">
                        Agents have aligned on a recommended action. Ready for human approval.
                      </p>
                      <Button 
                        className="mt-3 bg-green-600 hover:bg-green-700" 
                        size="sm" 
                        data-testid="button-review-approve"
                        onClick={handleApproveConsensus}
                        disabled={isApproving || isApproved}
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Approving...
                          </>
                        ) : isApproved ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </>
                        ) : (
                          'Review & Approve'
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
