import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Brain, Zap, ArrowRight, MessageCircle, Shield, Target,
  DollarSign, GitBranch, Repeat, Calculator, Users, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  AgentAction, 
  getActionLog, 
  subscribeToActions,
  ActionType
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

const AGENT_COLORS: Record<AgentType, { bg: string; text: string; border: string }> = {
  vro: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  pmo: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  tmo: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
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

export function ActionAuditTimeline({ maxItems = 20, showHeader = true }: ActionAuditTimelineProps) {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    setActions(getActionLog());
    
    const unsub = subscribeToActions((action) => {
      setActions(prev => [action, ...prev].slice(0, 50));
      setExpandedActions(prev => new Set([...Array.from(prev), action.id]));
    });

    return unsub;
  }, []);

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

  const groupedByDate = actions.slice(0, maxItems).reduce((acc, action) => {
    const dateKey = formatDate(action.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(action);
    return acc;
  }, {} as Record<string, AgentAction[]>);

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Action Audit Trail
            <Badge variant="secondary" className="ml-2 text-xs">{actions.length} actions</Badge>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={cn(!showHeader && "pt-4")}>
        <ScrollArea className="h-[500px] pr-4">
          {actions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No actions recorded yet</p>
              <p className="text-xs mt-1">Agent actions will appear here as they occur</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([dateKey, dateActions]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-medium text-gray-500 px-2">{dateKey}</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                    
                    <div className="space-y-4">
                      {dateActions.map((action, index) => {
                        const AgentIcon = AGENT_ICONS[action.agentId];
                        const colors = AGENT_COLORS[action.agentId];
                        const isExpanded = expandedActions.has(action.id);
                        const isNew = index === 0 && action.status === 'executing';
                        
                        return (
                          <motion.div
                            key={action.id}
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
                            
                            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(action.id)}>
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
                                          {action.agentName}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-gray-400" />
                                        <span className="text-sm text-gray-700">
                                          {ACTION_DESCRIPTIONS[action.actionType] || action.actionType}
                                        </span>
                                        {action.triggeredBy && (
                                          <Badge variant="outline" className="text-[10px]">
                                            via {action.triggeredBy.toUpperCase()}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                                        {action.targetEntityName}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs text-gray-400">{formatTime(action.timestamp)}</span>
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
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">AI Reasoning</p>
                                      <p className="text-sm text-gray-700 bg-white/50 p-2 rounded">
                                        {action.reasoning}
                                      </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <span className="text-gray-500">Confidence:</span>
                                        <span className="ml-1 font-medium">{action.aiConfidence}%</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Priority:</span>
                                        <Badge variant="outline" className="ml-1 text-[10px]">
                                          {action.priority}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Status:</span>
                                        <Badge 
                                          variant={action.status === 'completed' ? 'default' : 'secondary'}
                                          className="ml-1 text-[10px]"
                                        >
                                          {action.status === 'completed' ? (
                                            <><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Completed</>
                                          ) : action.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Target:</span>
                                        <span className="ml-1 font-medium">{action.targetEntityType}</span>
                                      </div>
                                    </div>
                                    
                                    {action.affectedAgents.length > 0 && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Notified Agents</p>
                                        <div className="flex flex-wrap gap-1">
                                          {action.affectedAgents.map(agentId => {
                                            const AgentIconSmall = AGENT_ICONS[agentId];
                                            const agentColors = AGENT_COLORS[agentId];
                                            return (
                                              <Badge 
                                                key={agentId} 
                                                variant="outline" 
                                                className={cn("text-[10px]", agentColors.bg, agentColors.text)}
                                              >
                                                <AgentIconSmall className="h-2.5 w-2.5 mr-0.5" />
                                                {agentId.toUpperCase()}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {action.result && (
                                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {action.result}
                                      </div>
                                    )}
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
  );
}
