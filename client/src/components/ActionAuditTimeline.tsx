import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Brain, Zap, ArrowRight, MessageCircle, Shield, Target,
  DollarSign, GitBranch, Repeat, Calculator, Users, Calendar,
  X, Link2, FileText, ExternalLink, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const AGENT_ICONS: Record<string, React.ElementType> = {
  'integrated-management': Brain,
  tmo: Repeat,
  finops: Calculator,
  okr: Target,
  governance: Shield,
  planning: Calendar,
  ocm: Users
};

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'integrated-management': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  tmo: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  finops: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  okr: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  governance: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  planning: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  ocm: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' }
};

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  escalate: 'Escalated to higher authority',
  notify: 'Sent notification',
  'update-status': 'Updated status',
  'create-task': 'Created new task',
  reassign: 'Reassigned responsibility',
  approve: 'Approved request',
  reject: 'Rejected request',
  investigate: 'Initiated investigation',
  mitigate: 'Applied mitigation',
  accelerate: 'Accelerated timeline',
  defer: 'Deferred action',
  close: 'Closed item'
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

const DEFAULT_AGENT_COLORS = { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };

function isKnownAgentType(id: string): boolean {
  return id in AGENT_ICONS;
}

function getAgentIcon(agentId: string): React.ElementType {
  return AGENT_ICONS[agentId] ?? Brain;
}

function getAgentColors(agentId: string): { bg: string; text: string; border: string } {
  return AGENT_COLORS[agentId] ?? DEFAULT_AGENT_COLORS;
}

function safeUpperCase(value: unknown): string {
  if (typeof value === 'string') return value.toUpperCase();
  if (value === null || value === undefined) return 'UNKNOWN';
  return String(value).toUpperCase();
}

// Unified activity item for both actions and messages
interface ActivityItem {
  id: string;
  type: 'action' | 'message';
  timestamp: Date;
  agentId: string;
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
  reasoning?: string;
  confidence?: number;
}

// Detail Flyout Component for full traceability view
function ActivityDetailFlyout({ 
  item, 
  open, 
  onClose 
}: { 
  item: ActivityItem | null; 
  open: boolean; 
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!item) return null;

  const AgentIcon = getAgentIcon(item.agentId);
  const agentColors = getAgentColors(item.agentId);
  const ActionIcon = item.icon;

  const getSourceSystem = () => {
    if (item.type === 'message') return 'Agent Communication';
    if (item.targetType === 'project') return 'Project Registry';
    if (item.targetType === 'metric') return 'Analytics Engine';
    return 'Value Realization Co-pilot';
  };
  
  const getTriggerSource = () => {
    if (item.type === 'message') return 'Inter-Agent Communication';
    if (item.agentId === 'integrated-management') return 'Value & Delivery Analysis';
    if (item.agentId === 'tmo') return 'Sprint Event Listener';
    if (item.agentId === 'governance') return 'Compliance Monitor';
    return 'Threshold Alert';
  };

  const traceabilityData = {
    sourceSystem: getSourceSystem(),
    sourceId: item.targetId || item.id.slice(0, 12),
    triggeredBy: getTriggerSource(),
    activityType: item.type,
    agentSource: safeUpperCase(item.agentId),
    linkedEntities: [
      ...(item.targetType && item.targetId ? [{ type: item.targetType, id: item.targetId, name: item.title }] : []),
      ...(item.metadata?.relatedActionId ? [{ type: 'Action', id: item.metadata.relatedActionId, name: 'Related Action' }] : []),
    ]
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", agentColors.bg)}>
                    <AgentIcon className={cn("h-5 w-5", agentColors.text)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.agentName} • {item.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
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

                <TabsContent value="details" className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <ActionIcon className="h-4 w-4" />
                      Action Summary
                    </h4>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>

                  {item.reasoning && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        AI Reasoning
                      </h4>
                      <p className="text-sm text-gray-700">{item.reasoning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium">Type</p>
                      <p className="font-semibold capitalize">{item.type}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium">Priority</p>
                      <p className="font-semibold capitalize">{item.priority}</p>
                    </div>
                    {item.confidence && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium">Confidence</p>
                        <p className="font-semibold">{item.confidence}%</p>
                      </div>
                    )}
                    {item.status && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-amber-600 font-medium">Status</p>
                        <p className="font-semibold capitalize">{item.status}</p>
                      </div>
                    )}
                  </div>

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
                </TabsContent>

                <TabsContent value="traceability" className="space-y-4">
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
                      <div>
                        <p className="text-gray-500 text-xs">Originating Agent</p>
                        <p className="font-medium">{traceabilityData.agentSource}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-purple-600" />
                      Linked Entities
                    </h4>
                    {traceabilityData.linkedEntities.length > 0 ? (
                      <div className="space-y-2">
                        {traceabilityData.linkedEntities.map((entity, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <Badge variant="outline" className="text-xs capitalize">{entity.type}</Badge>
                            <span className="font-mono text-xs text-gray-500">{entity.id}</span>
                            <span className="text-sm flex-1">{entity.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No linked entities for this activity</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatDate(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ActionAuditTimelineProps {
  maxItems?: number;
  showHeader?: boolean;
}

// Convert action to unified ActivityItem
function actionToActivityItem(action: AgentAction): ActivityItem {
  return {
    id: action.id,
    type: 'action',
    timestamp: action.timestamp,
    agentId: action.agentId,
    agentName: action.agentName,
    title: action.targetEntityName,
    description: action.reasoning,
    priority: action.priority,
    status: action.status,
    icon: ACTION_ICONS[action.actionType] || Brain,
    targetType: action.targetEntityType,
    targetId: action.targetEntityId,
    toAgents: action.affectedAgents,
    reasoning: action.reasoning,
    confidence: action.aiConfidence
  };
}

// Convert message to unified ActivityItem  
function messageToActivityItem(message: AgentMessage): ActivityItem {
  const recipientText = message.toAgents && message.toAgents.length > 0 
    ? message.toAgents.map(a => String(a).toUpperCase()).join(', ')
    : 'All Agents';
  const defaultPriority: ActionPriority = 'medium';
  return {
    id: message.id,
    type: 'message',
    timestamp: message.timestamp,
    agentId: String(message.fromAgent),
    agentName: String(message.fromAgent).toUpperCase() + ' Agent',
    title: message.subject || `${message.messageType.charAt(0).toUpperCase() + message.messageType.slice(1)} to ${recipientText}`,
    description: message.content,
    priority: message.priority ?? defaultPriority,
    icon: MessageCircle,
    toAgents: (message.toAgents || []).map(a => String(a)),
    targetType: message.relatedEntityId ? 'entity' : undefined,
    targetId: message.relatedEntityId,
    metadata: { messageType: message.messageType, relatedActionId: message.relatedActionId }
  };
}

export function ActionAuditTimeline({ maxItems = 20, showHeader = true }: ActionAuditTimelineProps) {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [flyoutItem, setFlyoutItem] = useState<ActivityItem | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  useEffect(() => {
    setActions(getActionLog());
    setMessages(getMessageLog());
    
    const unsubActions = subscribeToActions((action) => {
      setActions(prev => [action, ...prev].slice(0, 50));
      setExpandedActions(prev => new Set([...Array.from(prev), action.id]));
    });

    const unsubMessages = subscribeToMessages((message) => {
      setMessages(prev => [message, ...prev].slice(0, 50));
    });

    return () => {
      unsubActions();
      unsubMessages();
    };
  }, []);

  // Combine actions and messages into unified activity items
  const activityItems: ActivityItem[] = [
    ...actions.map(actionToActivityItem),
    ...messages.map(messageToActivityItem)
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, maxItems);

  const toggleExpanded = (actionId: string) => {
    setExpandedActions(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const openFlyout = (item: ActivityItem) => {
    setFlyoutItem(item);
    setFlyoutOpen(true);
  };

  const groupedByDate = activityItems.reduce((acc, item) => {
    const dateKey = formatDate(item.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <>
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Agent Activity & Audit Trail
              <Badge variant="secondary" className="ml-2 text-xs">{activityItems.length} activities</Badge>
            </CardTitle>
          </CardHeader>
        )}
        
        <CardContent className={cn(!showHeader && "pt-4")}>
          <ScrollArea className="h-[500px] pr-4">
            {activityItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No activity recorded yet</p>
                <p className="text-xs mt-1">Agent actions and messages will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([dateKey, dateItems]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs font-medium text-gray-500 px-2">{dateKey}</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                      
                      <div className="space-y-4">
                        {dateItems.map((item, index) => {
                          const AgentIcon = getAgentIcon(item.agentId);
                          const colors = getAgentColors(item.agentId);
                          const isExpanded = expandedActions.has(item.id);
                          const isNew = index === 0 && item.status === 'executing';
                          const ItemIcon = item.icon;
                          
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="relative pl-12"
                            >
                              <div className={cn(
                                "absolute left-3 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white z-10",
                                colors.border,
                                isNew && "ring-2 ring-purple-300 ring-opacity-50 animate-pulse"
                              )}>
                                <AgentIcon className={cn("h-3 w-3", colors.text)} />
                              </div>
                              
                              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
                                <div className={cn(
                                  "rounded-lg border p-3 transition-all",
                                  colors.bg, colors.border,
                                  isNew && "shadow-md"
                                )}>
                                  <CollapsibleTrigger className="w-full text-left">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={cn("font-semibold text-sm", colors.text)}>
                                            {item.agentName}
                                          </span>
                                          <ItemIcon className="h-3 w-3 text-gray-400" />
                                          <Badge className={cn("text-[10px]", PRIORITY_COLORS[item.priority])}>
                                            {item.priority}
                                          </Badge>
                                          {item.type === 'message' && (
                                            <Badge variant="outline" className="text-[10px] bg-blue-50">
                                              Message
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                                          {item.title}
                                        </p>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-gray-400">{formatTime(item.timestamp)}</span>
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-gray-400" />
                                        )}
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                                      {item.reasoning && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-500 mb-1">AI Reasoning</p>
                                          <p className="text-sm text-gray-700 bg-white/50 p-2 rounded">
                                            {item.reasoning}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {item.type === 'message' && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-500 mb-1">Message Content</p>
                                          <p className="text-sm text-gray-700 bg-white/50 p-2 rounded">
                                            {item.description}
                                          </p>
                                        </div>
                                      )}
                                      
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        {item.confidence && (
                                          <div>
                                            <span className="text-gray-500">Confidence:</span>
                                            <span className="ml-1 font-medium">{item.confidence}%</span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-gray-500">Priority:</span>
                                          <Badge variant="outline" className="ml-1 text-[10px]">
                                            {item.priority}
                                          </Badge>
                                        </div>
                                        {item.status && (
                                          <div>
                                            <span className="text-gray-500">Status:</span>
                                            <Badge 
                                              variant={item.status === 'completed' ? 'default' : 'secondary'}
                                              className="ml-1 text-[10px]"
                                            >
                                              {item.status === 'completed' ? (
                                                <><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Completed</>
                                              ) : item.status}
                                            </Badge>
                                          </div>
                                        )}
                                        {item.targetType && (
                                          <div>
                                            <span className="text-gray-500">Target:</span>
                                            <span className="ml-1 font-medium">{item.targetType}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {item.toAgents && item.toAgents.length > 0 && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Notified Agents</p>
                                          <div className="flex flex-wrap gap-1">
                                            {item.toAgents.map(agentId => {
                                              if (isKnownAgentType(agentId)) {
                                                const AgentIconSmall = getAgentIcon(agentId);
                                                const toAgentColors = getAgentColors(agentId);
                                                return (
                                                  <Badge 
                                                    key={agentId} 
                                                    variant="outline" 
                                                    className={cn("text-[10px]", toAgentColors.bg, toAgentColors.text)}
                                                  >
                                                    <AgentIconSmall className="h-2.5 w-2.5 mr-0.5" />
                                                    {safeUpperCase(agentId)}
                                                  </Badge>
                                                );
                                              }
                                              return (
                                                <Badge key={agentId} variant="outline" className="text-[10px]">
                                                  {safeUpperCase(agentId)}
                                                </Badge>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <button 
                                        type="button"
                                        className="w-full mt-2 text-blue-600 text-xs font-medium hover:text-blue-800 hover:underline text-left"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openFlyout(item);
                                        }}
                                      >
                                        ▼ View full details & traceability
                                      </button>
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      <ActivityDetailFlyout 
        item={flyoutItem} 
        open={flyoutOpen} 
        onClose={() => {
          setFlyoutOpen(false);
          setFlyoutItem(null);
        }} 
      />
    </>
  );
}
