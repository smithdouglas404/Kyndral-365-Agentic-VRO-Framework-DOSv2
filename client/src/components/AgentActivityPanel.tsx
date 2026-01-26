import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Brain, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, MessageCircle, Zap, ChevronDown, ChevronUp,
  DollarSign, GitBranch, Repeat, Calculator, Target, Shield, Calendar, Users,
  Link2, FileText, History, Building2, User, ExternalLink, X, TrendingUp, Folder
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  AgentAction, 
  AgentMessage, 
  getActionLog, 
  getMessageLog, 
  subscribeToActions, 
  subscribeToMessages,
  executeAction,
  ActionType,
  ActionPriority
} from '@/lib/agentActionEngine';
import { AgentType } from '@/lib/dataHub';

const AGENT_ICONS: Record<AgentType, React.ElementType> = {
  'integrated-management': Brain,
  vro: TrendingUp,
  pmo: Folder,
  tmo: Repeat,
  finops: Calculator,
  okr: Target,
  governance: Shield,
  planning: Calendar,
  ocm: Users
};

const AGENT_COLORS: Record<AgentType, string> = {
  'integrated-management': 'bg-gradient-to-r from-teal-500 to-blue-500',
  vro: 'bg-green-500',
  pmo: 'bg-purple-500',
  tmo: 'bg-teal-500',
  finops: 'bg-amber-500',
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

export interface ActivityItem {
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
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  toAgents?: string[];
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

// Activity Detail Flyout with Traceability Tab (slides in from right)
function ActivityDetailFlyout({ 
  item, 
  open, 
  onClose 
}: { 
  item: ActivityItem | null; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!item) return null;

  const AgentIcon = AGENT_ICONS[item.agentId];
  const ActionIcon = item.icon;

  // Generate simulated traceability data
  const traceabilityData = {
    sourceSystem: item.targetType === 'project' ? 'Jira' : item.targetType === 'metric' ? 'PowerBI' : 'ServiceNow',
    sourceId: `SRC-${item.id.slice(-8).toUpperCase()}`,
    triggeredBy: item.agentId === 'integrated-management' ? 'Scheduled Analysis' : 'Threshold Alert',
    parentAction: Math.random() > 0.5 ? `ACT-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : null,
    linkedEntities: [
      { type: 'Project', id: 'PRJ-001', name: 'Digital Transformation' },
      { type: 'OKR', id: 'OKR-Q4-02', name: 'Improve operational efficiency' },
      { type: 'Risk', id: 'RSK-045', name: 'Integration delay risk' }
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    auditTrail: [
      { time: new Date(item.timestamp.getTime() - 5000), action: 'Data collected', agent: item.agentId },
      { time: new Date(item.timestamp.getTime() - 3000), action: 'Analysis initiated', agent: item.agentId },
      { time: new Date(item.timestamp.getTime() - 1000), action: 'Confidence calculated', agent: item.agentId },
      { time: item.timestamp, action: 'Action executed', agent: item.agentId },
    ],
    dataInputs: [
      { source: 'Real-time metrics', freshness: '< 1 min' },
      { source: 'Historical trends (30 days)', freshness: 'Daily refresh' },
      { source: 'Cross-agent insights', freshness: '< 5 min' }
    ],
    impactedAgents: ['integrated-management', 'finops', 'governance'].filter(() => Math.random() > 0.3) as AgentType[]
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          {/* Flyout panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", AGENT_COLORS[item.agentId])}>
                    <AgentIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{item.title}</h2>
                    <p className="text-sm text-gray-500">{item.agentName} Agent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn(PRIORITY_COLORS[item.priority])}>
                    {item.priority}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="traceability" className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Traceability
                  </TabsTrigger>
                </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto mt-4 space-y-4">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <ActionIcon className="h-4 w-4" />
                  Action Summary
                </h4>
                <p className="text-sm text-gray-700">{item.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Type</p>
                  <p className="font-semibold capitalize">{item.type}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Status</p>
                  <p className="font-semibold capitalize">{item.status || 'Completed'}</p>
                </div>
              </div>

              {item.targetType && item.targetId && (
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Target Entity</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{item.targetType}</Badge>
                    <span className="font-mono text-xs text-gray-600">{item.targetId}</span>
                  </div>
                </div>
              )}

              {item.toAgents && item.toAgents.length > 0 && (
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Notified Agents</p>
                  <div className="flex flex-wrap gap-2">
                    {item.toAgents.map(agent => (
                      <Badge key={agent} variant="secondary" className="uppercase">{agent}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Metadata</p>
                  <div className="bg-gray-100 rounded p-2 font-mono text-xs">
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500">{key}:</span>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 pt-2 border-t">
                Full timestamp: {item.timestamp.toLocaleString()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="traceability" className="flex-1 overflow-auto mt-4 space-y-4">
            <div className="space-y-4">
              {/* Source Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  Source Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Source System</p>
                    <p className="font-medium">{traceabilityData.sourceSystem}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Source ID</p>
                    <p className="font-mono text-xs">{traceabilityData.sourceId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Triggered By</p>
                    <p className="font-medium">{traceabilityData.triggeredBy}</p>
                  </div>
                  {traceabilityData.parentAction && (
                    <div>
                      <p className="text-gray-500 text-xs">Parent Action</p>
                      <p className="font-mono text-xs text-blue-600">{traceabilityData.parentAction}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Entities */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-purple-600" />
                  Linked Entities
                </h4>
                <div className="space-y-2">
                  {traceabilityData.linkedEntities.map((entity, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <Badge variant="outline" className="text-xs">{entity.type}</Badge>
                      <span className="font-mono text-xs text-gray-500">{entity.id}</span>
                      <span className="text-sm flex-1">{entity.name}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Inputs */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Data Inputs
                </h4>
                <div className="space-y-2">
                  {traceabilityData.dataInputs.map((input, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-green-50 rounded">
                      <span>{input.source}</span>
                      <Badge variant="secondary" className="text-xs">{input.freshness}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Trail */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-orange-600" />
                  Audit Trail
                </h4>
                <div className="space-y-2">
                  {traceabilityData.auditTrail.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-gray-400 text-xs w-20">{entry.time.toLocaleTimeString()}</span>
                      <span className="flex-1">{entry.action}</span>
                      <Badge variant="outline" className="text-xs uppercase">{entry.agent}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impacted Agents */}
              {traceabilityData.impactedAgents.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-pink-600" />
                    Impacted Agents
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {traceabilityData.impactedAgents.map(agent => {
                      const Icon = AGENT_ICONS[agent];
                      return (
                        <div key={agent} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm", AGENT_COLORS[agent])}>
                          <Icon className="h-3 w-3" />
                          <span className="uppercase">{agent}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
  );
}

interface AgentActivityPanelProps {
  compact?: boolean;
  maxItems?: number;
  filterAgent?: AgentType;
  onViewDetails?: (item: ActivityItem) => void;
}

export function AgentActivityPanel({ compact = false, maxItems = 15, filterAgent, onViewDetails }: AgentActivityPanelProps) {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [thinkingAgents, setThinkingAgents] = useState<Set<AgentType>>(new Set());
  const [detailModalItem, setDetailModalItem] = useState<ActivityItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch real agent activity from API
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Fetch recent agent activity
        const activityRes = await fetch('/api/agent-activity/recent?limit=50');
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          if (activityData.activities && Array.isArray(activityData.activities)) {
            // Transform API data to AgentAction format
            const transformedActions: AgentAction[] = activityData.activities.map((a: any) => ({
              id: a.id || `activity-${Date.now()}-${Math.random()}`,
              agentId: a.primaryAgentId || 'integrated-management',
              agentName: a.primaryAgentName || 'Agent',
              actionType: a.eventType === 'detection' ? 'investigate' :
                         a.eventType === 'autonomous_action' ? 'notify' :
                         a.eventType === 'escalation' ? 'escalate' : 'notify',
              targetEntityType: 'project',
              targetEntityId: a.interventionId || 'unknown',
              targetEntityName: a.summary || 'Unknown Target',
              reasoning: a.details || a.summary || '',
              priority: a.severity === 'critical' ? 'critical' as ActionPriority :
                       a.severity === 'high' ? 'high' as ActionPriority :
                       'medium' as ActionPriority,
              aiConfidence: 85,
              timestamp: new Date(a.createdAt),
              status: 'completed',
              result: a.summary
            }));
            setActions(transformedActions);
          }
        }

        // Fetch A2A messages
        const messagesRes = await fetch('/api/agent-activity/a2a-messages?limit=20');
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          if (messagesData.messages && Array.isArray(messagesData.messages)) {
            // Transform API data to AgentMessage format
            const transformedMessages: AgentMessage[] = messagesData.messages.map((m: any) => ({
              id: m.id || `msg-${Date.now()}-${Math.random()}`,
              fromAgent: m.fromAgentId || 'integrated-management',
              toAgents: m.toAgentIds || [],
              subject: m.title || 'Agent Communication',
              content: m.message || '',
              priority: 'medium' as ActionPriority,
              timestamp: new Date(m.timestamp),
              requiresResponse: false
            }));
            setMessages(transformedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agent activity:', error);
      }
    };

    // Initial fetch
    fetchActivity();

    // Subscribe to local action events (for any UI-triggered actions)
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

    // Poll for new activity every 5 seconds
    const pollInterval = setInterval(fetchActivity, 5000);

    return () => {
      unsubActions();
      unsubMessages();
      clearInterval(pollInterval);
    };
  }, []);

  // Deduplicate actions by creating a unique key from agent + action + target name (ignoring timestamp-based IDs)
  const deduplicatedActions = actions.reduce((acc, action) => {
    // Use target entity NAME not ID to prevent showing same action with different timestamps
    const key = `${action.agentId}-${action.actionType}-${action.targetEntityName}`;
    if (!acc.seen.has(key)) {
      acc.seen.add(key);
      acc.actions.push(action);
    }
    return acc;
  }, { seen: new Set<string>(), actions: [] as typeof actions }).actions;

  const activityItems: ActivityItem[] = [
    ...deduplicatedActions.map(a => ({
      id: a.id,
      type: 'action' as const,
      timestamp: a.timestamp,
      agentId: a.agentId,
      agentName: a.agentName,
      title: `${a.actionType.charAt(0).toUpperCase() + a.actionType.slice(1)}: ${a.targetEntityName}`,
      description: a.reasoning,
      priority: a.priority,
      status: a.status,
      icon: ACTION_ICONS[a.actionType] || Activity,
      targetType: a.targetEntityType,
      targetId: a.targetEntityId,
      metadata: a.result ? { result: a.result, confidence: `${Math.round(a.aiConfidence)}%` } : { confidence: `${Math.round(a.aiConfidence)}%` }
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
      icon: MessageCircle,
      toAgents: m.toAgents
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
                        <div
                          key={item.id}
                          className={cn(
                            "relative p-3 rounded-lg border transition-all hover:shadow-md hover:bg-gray-50",
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
                                <button 
                                  type="button"
                                  className="ml-auto text-blue-500 font-medium hover:text-blue-700 hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails?.(item);
                                    setDetailModalItem(item);
                                    setDetailModalOpen(true);
                                  }}
                                  aria-label={`View details for ${item.title}`}
                                  data-testid={`link-view-details-${item.id}`}
                                >
                                  ▼ View details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Detail Flyout */}
      <ActivityDetailFlyout 
        item={detailModalItem} 
        open={detailModalOpen} 
        onClose={() => {
          setDetailModalOpen(false);
          setDetailModalItem(null);
        }} 
      />
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
