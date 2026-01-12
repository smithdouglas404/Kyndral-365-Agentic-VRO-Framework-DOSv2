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
  AlertTriangle
} from 'lucide-react';

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

const discussionTopics: DiscussionTopic[] = [
  {
    id: 'topic-1',
    title: 'Enterprise Data Foundation Budget Overrun',
    context: 'Data Foundation project £1.2M over budget, blocking 4 other initiatives',
    status: 'active',
    priority: 'high'
  }
];

const simulatedDiscussion: AgentMessage[] = [
  {
    id: 'msg-1',
    agent: 'FinOps Agent',
    agentColor: 'bg-green-500',
    message: "I've analyzed the Enterprise Data Foundation budget trajectory. Current burn rate suggests £2.3M overrun by PI 25.2 unless we intervene.",
    timestamp: new Date(),
    type: 'analysis',
    referencedProject: 'proj-data-foundation'
  },
  {
    id: 'msg-2',
    agent: 'Planning Agent',
    agentColor: 'bg-blue-500',
    message: "Looking at the feature backlog, MDM Phase 2 and Advanced Analytics could be deferred to Phase 2 without impacting the 4 dependent projects. This would reduce scope by ~30%.",
    timestamp: new Date(),
    type: 'recommendation'
  },
  {
    id: 'msg-3',
    agent: 'TMO Agent',
    agentColor: 'bg-teal-500',
    message: "Change impact assessment: Deferring MDM Phase 2 affects 12 stakeholders in Asset Management. I can prepare a communication plan if we proceed.",
    timestamp: new Date(),
    type: 'analysis'
  },
  {
    id: 'msg-4',
    agent: 'Governance Agent',
    agentColor: 'bg-purple-500',
    message: "Scope reduction requires steering committee approval. I can fast-track this through the Change Advisory Board if we have alignment.",
    timestamp: new Date(),
    type: 'question'
  },
  {
    id: 'msg-5',
    agent: 'FinOps Agent',
    agentColor: 'bg-green-500',
    message: "If we defer MDM Phase 2, projected savings are £1.4M. Combined with £400K contingency release, we're back within 5% of original budget.",
    timestamp: new Date(),
    type: 'analysis'
  },
  {
    id: 'msg-6',
    agent: 'OKR Agent',
    agentColor: 'bg-orange-500',
    message: "This aligns with Q4 objective 'Optimize Portfolio Delivery'. Key result KR2.3 (reduce at-risk projects) would improve from 65% to 78% achievement.",
    timestamp: new Date(),
    type: 'agreement'
  },
  {
    id: 'msg-7',
    agent: 'Planning Agent',
    agentColor: 'bg-blue-500',
    message: "Consensus reached. Proposed action: 1) Defer MDM Phase 2, 2) Release £400K contingency, 3) Fast-track CAB approval, 4) Notify stakeholders. Ready for human approval.",
    timestamp: new Date(),
    type: 'action'
  }
];

export function MultiAgentDiscussion() {
  const [expanded, setExpanded] = useState(true);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTopic] = useState(discussionTopics[0]);

  useEffect(() => {
    if (!isPlaying || currentIndex >= simulatedDiscussion.length) return;

    const timer = setTimeout(() => {
      setMessages(prev => [...prev, simulatedDiscussion[currentIndex]]);
      setCurrentIndex(prev => prev + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRestart = () => {
    setMessages([]);
    setCurrentIndex(0);
    setIsPlaying(true);
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
                      <span className="font-semibold text-gray-900">{activeTopic.title}</span>
                      <Badge className="bg-orange-500 text-white text-xs">{activeTopic.priority}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activeTopic.context}</p>
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
                      <Button className="mt-3 bg-green-600 hover:bg-green-700" size="sm" data-testid="button-review-approve">
                        Review & Approve
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
