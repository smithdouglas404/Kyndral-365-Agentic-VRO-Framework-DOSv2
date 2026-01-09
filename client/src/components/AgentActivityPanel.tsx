import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Brain, AlertTriangle, CheckCircle2, Clock, 
  ArrowRight, MessageCircle, Zap, ChevronDown, ChevronUp,
  DollarSign, GitBranch, Repeat, Calculator, Target, Shield, Calendar, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  AgentAction, 
  AgentMessage, 
  getActionLog, 
  getMessageLog, 
  subscribeToActions, 
  subscribeToMessages,
  ActionType,
  ActionPriority
} from '@/lib/agentActionEngine';
import { AgentType } from '@/lib/dataHub';

const AGENT_ICONS: Record<AgentType, React.ElementType> = {
  vro: DollarSign,
  pmo: GitBranch,
  tmo: Repeat,
  finops: Calculator,
  okr: Target,
  governance: Shield,
  planning: Calendar,
  ocm: Users
};

const AGENT_COLORS: Record<AgentType, string> = {
  vro: 'bg-blue-500',
  pmo: 'bg-purple-500',
  tmo: 'bg-teal-500',
  finops: 'bg-green-500',
  okr: 'bg-orange-500',
  governance: 'bg-red-500',
  planning: 'bg-indigo-500',
  ocm: 'bg-pink-500'
};

const ACTION_ICONS: Record<ActionType, React.ElementType> = {
  escalate: AlertTriangle,
  notify: MessageCircle,
  'update-status': Activity,
  'create-task': Zap,
  reassign: ArrowRight,
  approve: CheckCircle2,
  reject: AlertTriangle,
  investigate: Brain,
  mitigate: Shield,
  accelerate: Zap,
  defer: Clock,
  close: CheckCircle2
};

const PRIORITY_COLORS: Record<ActionPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700'
};

interface ActivityItem {
  id: string;
  type: 'action' | 'message';
  timestamp: Date;
  agentId: AgentType;
  agentName: string;
  title: string;
  description: string;
  priority: ActionPriority;
  status?: string;
  icon: React.ElementType;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

interface AgentActivityPanelProps {
  compact?: boolean;
  maxItems?: number;
  filterAgent?: AgentType;
}

export function AgentActivityPanel({ compact = false, maxItems = 15, filterAgent }: AgentActivityPanelProps) {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [thinkingAgents, setThinkingAgents] = useState<Set<AgentType>>(new Set());

  useEffect(() => {
    setActions(getActionLog());
    setMessages(getMessageLog());

    const unsubActions = subscribeToActions((action) => {
      setActions(prev => [action, ...prev].slice(0, 50));
      
      setThinkingAgents(prev => new Set([...Array.from(prev), action.agentId]));
      setTimeout(() => {
        setThinkingAgents(prev => {
          const next = new Set(prev);
          next.delete(action.agentId);
          return next;
        });
      }, 2000);
    });

    const unsubMessages = subscribeToMessages((message) => {
      setMessages(prev => [message, ...prev].slice(0, 50));
    });

    return () => {
      unsubActions();
      unsubMessages();
    };
  }, []);

  const activityItems: ActivityItem[] = [
    ...actions.map(a => ({
      id: a.id,
      type: 'action' as const,
      timestamp: a.timestamp,
      agentId: a.agentId,
      agentName: a.agentName,
      title: `${a.actionType.charAt(0).toUpperCase() + a.actionType.slice(1)}: ${a.targetEntityName}`,
      description: a.reasoning,
      priority: a.priority,
      status: a.status,
      icon: ACTION_ICONS[a.actionType] || Activity
    })),
    ...messages.map(m => ({
      id: m.id,
      type: 'message' as const,
      timestamp: m.timestamp,
      agentId: m.fromAgent,
      agentName: m.fromAgent.toUpperCase(),
      title: m.subject,
      description: m.content,
      priority: m.priority,
      icon: MessageCircle
    }))
  ]
    .filter(item => !filterAgent || item.agentId === filterAgent)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Agent Activity</span>
            {thinkingAgents.size > 0 && (
              <Badge variant="outline" className="text-xs animate-pulse bg-purple-50">
                {thinkingAgents.size} thinking...
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">{activityItems.length}</Badge>
        </div>
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {activityItems.slice(0, 5).map(item => {
              const AgentIcon = AGENT_ICONS[item.agentId];
              return (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-xs">
                  <div className={cn("p-1 rounded", AGENT_COLORS[item.agentId])}>
                    <AgentIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="truncate flex-1">{item.title}</span>
                  <span className="text-gray-400">{formatTime(item.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            Agent Activity Feed
            {thinkingAgents.size > 0 && (
              <Badge variant="outline" className="ml-2 text-xs animate-pulse bg-purple-50 border-purple-200">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                  {thinkingAgents.size} agent{thinkingAgents.size > 1 ? 's' : ''} processing
                </span>
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            data-testid="button-toggle-activity"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {activityItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No agent activity yet</p>
                      <p className="text-xs">Agents will appear here when they take actions</p>
                    </div>
                  ) : (
                    activityItems.map((item, index) => {
                      const AgentIcon = AGENT_ICONS[item.agentId];
                      const ItemIcon = item.icon;
                      const isThinking = thinkingAgents.has(item.agentId);
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "relative p-3 rounded-lg border transition-all",
                            item.type === 'action' ? "bg-white border-gray-200" : "bg-blue-50 border-blue-100",
                            isThinking && "ring-2 ring-purple-300 ring-opacity-50"
                          )}
                          data-testid={`activity-item-${item.id}`}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
                               style={{ backgroundColor: AGENT_COLORS[item.agentId].replace('bg-', '#').replace('-500', '') }} />
                          
                          <div className="flex items-start gap-3 pl-2">
                            <div className={cn("p-1.5 rounded-lg shrink-0", AGENT_COLORS[item.agentId])}>
                              <AgentIcon className="h-4 w-4 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{item.agentName}</span>
                                <ItemIcon className="h-3 w-3 text-gray-400" />
                                <Badge className={cn("text-[10px]", PRIORITY_COLORS[item.priority])}>
                                  {item.priority}
                                </Badge>
                                {item.status && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {item.status}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm font-medium text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                              
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <Clock className="h-3 w-3" />
                                {formatTime(item.timestamp)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
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

export function AgentThinkingIndicator({ agentId }: { agentId: AgentType }) {
  const [isThinking, setIsThinking] = useState(false);
  const AgentIcon = AGENT_ICONS[agentId];

  useEffect(() => {
    const unsub = subscribeToActions((action) => {
      if (action.agentId === agentId) {
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 2000);
      }
    });
    return unsub;
  }, [agentId]);

  if (!isThinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full"
    >
      <div className={cn("p-1 rounded-full", AGENT_COLORS[agentId])}>
        <AgentIcon className="h-3 w-3 text-white" />
      </div>
      <span className="text-xs font-medium text-purple-700">Processing</span>
      <div className="flex gap-0.5">
        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </motion.div>
  );
}
