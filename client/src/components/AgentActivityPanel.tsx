import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Brain, AlertTriangle, CheckCircle2, Clock, 
  ArrowRight, MessageCircle, Zap, ChevronDown, ChevronUp,
  DollarSign, GitBranch, Repeat, Calculator, Target, Shield, Calendar, Users,
  Link2, FileText, History, Building2, User, ExternalLink, X
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
    triggeredBy: item.agentId === 'vro' ? 'Scheduled Analysis' : item.agentId === 'pmo' ? 'Sprint Event' : 'Threshold Alert',
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
    impactedAgents: ['pmo', 'finops', 'governance'].filter(() => Math.random() > 0.3) as AgentType[]
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
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [detailModalItem, setDetailModalItem] = useState<ActivityItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Continuous agent activity simulation data - all 8 agents with project focus
  const simulatedActivities = [
    { agent: 'vro' as AgentType, action: 'investigate' as ActionType, target: 'PRT Volume Forecast', targetType: 'metric' as const, reason: 'Analyzing Q4 volume trends against market conditions' },
    { agent: 'pmo' as AgentType, action: 'update-status' as ActionType, target: 'Digital Transformation Sprint', targetType: 'project' as const, reason: 'Sprint velocity improved 12% - updating health indicators' },
    { agent: 'finops' as AgentType, action: 'notify' as ActionType, target: 'Cloud Cost Allocation', targetType: 'metric' as const, reason: 'Detected 8% cost optimization opportunity in compute resources' },
    { agent: 'governance' as AgentType, action: 'approve' as ActionType, target: 'Platform Migration Project', targetType: 'project' as const, reason: 'Compliance review completed - project cleared for Phase 2' },
    { agent: 'okr' as AgentType, action: 'investigate' as ActionType, target: 'Customer NPS Objective', targetType: 'okr' as const, reason: 'Key result tracking ahead of schedule - analyzing drivers' },
    { agent: 'tmo' as AgentType, action: 'accelerate' as ActionType, target: 'API Migration Wave 3', targetType: 'project' as const, reason: 'Dependency cleared - recommending fast-track to capture Q4 window' },
    { agent: 'planning' as AgentType, action: 'create-task' as ActionType, target: 'Q1 Roadmap Review', targetType: 'task' as const, reason: 'Scheduling strategic alignment sessions with division leads' },
    { agent: 'ocm' as AgentType, action: 'notify' as ActionType, target: 'Longevity Platform Rollout', targetType: 'project' as const, reason: 'Change readiness assessment complete - 92% stakeholder alignment' },
    { agent: 'vro' as AgentType, action: 'escalate' as ActionType, target: 'Value Leakage Alert', targetType: 'alert' as const, reason: 'Identified £1.2M potential value at risk in delayed integrations' },
    { agent: 'pmo' as AgentType, action: 'reassign' as ActionType, target: 'Resource Optimization', targetType: 'task' as const, reason: 'Balancing workload across sprint teams' },
    { agent: 'finops' as AgentType, action: 'mitigate' as ActionType, target: 'Budget Variance', targetType: 'risk' as const, reason: 'Implementing cost controls to address 5% overspend' },
    { agent: 'governance' as AgentType, action: 'investigate' as ActionType, target: 'Data Privacy Compliance Project', targetType: 'project' as const, reason: 'Reviewing GDPR alignment for customer data handling' },
    { agent: 'vro' as AgentType, action: 'notify' as ActionType, target: 'ROI Achievement Update', targetType: 'metric' as const, reason: 'Portfolio ROI trending 3% above target' },
    { agent: 'tmo' as AgentType, action: 'notify' as ActionType, target: 'Milestone Completion', targetType: 'project' as const, reason: 'Phase 2 delivery completed - initiating Phase 3 prep' },
    { agent: 'pmo' as AgentType, action: 'investigate' as ActionType, target: 'Sprint Retrospective', targetType: 'project' as const, reason: 'Analyzing blockers from last iteration' },
    { agent: 'okr' as AgentType, action: 'update-status' as ActionType, target: 'Strategic Initiative KR', targetType: 'okr' as const, reason: 'Progress updated from stakeholder inputs' },
    { agent: 'ocm' as AgentType, action: 'create-task' as ActionType, target: 'Enterprise CRM Migration', targetType: 'project' as const, reason: 'Training program designed for 500+ end users' },
    { agent: 'planning' as AgentType, action: 'notify' as ActionType, target: 'Capacity Planning', targetType: 'metric' as const, reason: 'Resource availability updated for next quarter' },
    { agent: 'governance' as AgentType, action: 'escalate' as ActionType, target: 'Risk Register Update', targetType: 'project' as const, reason: 'Critical control gap identified in vendor management' },
    { agent: 'ocm' as AgentType, action: 'accelerate' as ActionType, target: 'Digital Workplace Initiative', targetType: 'project' as const, reason: 'Early adoption metrics exceeding targets - expanding rollout' },
    { agent: 'governance' as AgentType, action: 'notify' as ActionType, target: 'Regulatory Reporting System', targetType: 'project' as const, reason: 'Audit trail verification complete - no exceptions found' },
    { agent: 'ocm' as AgentType, action: 'investigate' as ActionType, target: 'User Adoption Analytics', targetType: 'project' as const, reason: 'Analyzing feature usage patterns across business units' },
    { agent: 'governance' as AgentType, action: 'mitigate' as ActionType, target: 'Third-Party Integration Project', targetType: 'project' as const, reason: 'Implementing additional security controls for external APIs' },
    { agent: 'ocm' as AgentType, action: 'escalate' as ActionType, target: 'Resistance Management', targetType: 'project' as const, reason: 'Flagging adoption barriers in Finance department' },
  ];

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

    // Continuous simulation - fire a new agent action every 12-20 seconds (slowed down)
    const usedIndices = new Set<number>();
    const simulationInterval = setInterval(() => {
      // Pick a random activity that hasn't been used recently
      let randomIndex: number;
      if (usedIndices.size >= simulatedActivities.length - 2) {
        usedIndices.clear(); // Reset when most activities have been used
      }
      do {
        randomIndex = Math.floor(Math.random() * simulatedActivities.length);
      } while (usedIndices.has(randomIndex));
      usedIndices.add(randomIndex);
      
      const activity = simulatedActivities[randomIndex];
      const uniqueId = `${activity.target}-${Date.now()}`;
      
      executeAction(
        activity.agent,
        activity.action,
        activity.targetType,
        uniqueId,
        activity.target,
        activity.reason,
        75 + Math.floor(Math.random() * 20) // 75-95% confidence
      );
    }, 12000 + Math.random() * 8000); // Random 12-20 second interval

    return () => {
      unsubActions();
      unsubMessages();
      clearInterval(simulationInterval);
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
      metadata: a.result ? { result: a.result, confidence: `${(a.aiConfidence * 100).toFixed(0)}%` } : { confidence: `${(a.aiConfidence * 100).toFixed(0)}%` }
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
                      const isSelected = selectedItem === item.id;
                      
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "relative p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md hover:bg-gray-50",
                            item.type === 'action' ? "bg-white border-gray-200" : "bg-blue-50 border-blue-100",
                            isThinking && "ring-2 ring-purple-300 ring-opacity-50",
                            isSelected && "ring-2 ring-blue-400 bg-blue-50/50"
                          )}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedItem(isSelected ? null : item.id)}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedItem(isSelected ? null : item.id)}
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
                                <ChevronDown className={cn(
                                  "h-3 w-3 text-gray-400 ml-auto transition-transform",
                                  isSelected && "rotate-180"
                                )} />
                              </div>
                              
                              <p className="text-sm font-medium text-gray-900">{item.title}</p>
                              <p className={cn(
                                "text-xs text-gray-500 mt-0.5",
                                !isSelected && "line-clamp-2"
                              )}>{item.description}</p>
                              
                              {isSelected && (
                                <div className="mt-3 pt-3 border-t border-gray-200 animate-in fade-in duration-200">
                                  <div className="space-y-2 text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-gray-400">Type:</span>
                                        <span className="ml-1 font-medium capitalize">{item.type}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Agent:</span>
                                        <span className="ml-1 font-medium uppercase">{item.agentId}</span>
                                      </div>
                                      {item.targetType && (
                                        <div>
                                          <span className="text-gray-400">Target:</span>
                                          <span className="ml-1 font-medium capitalize">{item.targetType}</span>
                                        </div>
                                      )}
                                      {item.targetId && (
                                        <div>
                                          <span className="text-gray-400">ID:</span>
                                          <span className="ml-1 font-mono text-[10px]">{item.targetId.slice(0, 12)}...</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {item.toAgents && item.toAgents.length > 0 && (
                                      <div>
                                        <span className="text-gray-400">Sent to:</span>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                          {item.toAgents.map(agent => (
                                            <Badge key={agent} variant="secondary" className="text-[10px] uppercase">
                                              {agent}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                                      <div>
                                        <span className="text-gray-400 block mb-1">Details:</span>
                                        <div className="bg-gray-100 rounded p-2 font-mono text-[10px] overflow-x-auto">
                                          {Object.entries(item.metadata).map(([key, value]) => (
                                            <div key={key}>
                                              <span className="text-gray-500">{key}:</span>{' '}
                                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="text-gray-400">
                                      Full timestamp: {item.timestamp.toLocaleString()}
                                    </div>
                                    
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDetailModalItem(item);
                                        setDetailModalOpen(true);
                                      }}
                                      data-testid={`button-view-details-${item.id}`}
                                    >
                                      <ArrowRight className="h-3 w-3 mr-2" />
                                      Open Full Details
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <Clock className="h-3 w-3" />
                                {formatTime(item.timestamp)}
                                <button 
                                  className="ml-auto text-blue-500 font-medium hover:text-blue-700 hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailModalItem(item);
                                    setDetailModalOpen(true);
                                  }}
                                  data-testid={`link-view-details-${item.id}`}
                                >
                                  {isSelected ? '▲ Hide details' : '▼ View details'}
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
