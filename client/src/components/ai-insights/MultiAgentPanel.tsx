/**
 * Multi-Agent Collaboration Panel
 *
 * Displays conversations between multiple AI agents working together
 * on complex PPM analysis tasks.
 */

import { useState, useMemo, type ReactNode } from 'react';
import {
  Card,
  Title,
  Text,
  Flex,
  Badge,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  type Color,
} from '@tremor/react';
import {
  Sparkles,
  DollarSign,
  Shield,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Network,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AIConversation,
  type AgentIdentity,
  type ConversationMessage,
} from './AIConversation';

// ============================================================================
// Types
// ============================================================================

export interface Agent extends AgentIdentity {
  description?: string;
  capabilities?: string[];
  status: 'idle' | 'thinking' | 'active' | 'complete';
  lastActive?: string;
}

export interface AgentCollaboration {
  id: string;
  title: string;
  description?: string;
  agents: Agent[];
  messages: ConversationMessage[];
  status: 'idle' | 'in_progress' | 'complete' | 'error';
  startedAt?: string;
  completedAt?: string;
  result?: ReactNode;
}

export interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  reason: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// Pre-defined Agents
// ============================================================================

export const PPM_AGENTS: Record<string, Omit<Agent, 'status'>> = {
  finops: {
    id: 'finops',
    name: 'FinOps Agent',
    role: 'Financial Analysis',
    icon: DollarSign,
    color: 'emerald',
    description: 'Analyzes budget, costs, and financial health',
    capabilities: ['Budget Analysis', 'Cost Forecasting', 'EVM Metrics'],
  },
  risk: {
    id: 'risk',
    name: 'Risk Agent',
    role: 'Risk Assessment',
    icon: Shield,
    color: 'rose',
    description: 'Identifies and assesses project risks',
    capabilities: ['Risk Identification', 'Impact Analysis', 'Mitigation Planning'],
  },
  schedule: {
    id: 'schedule',
    name: 'Schedule Agent',
    role: 'Timeline Analysis',
    icon: Calendar,
    color: 'blue',
    description: 'Analyzes schedules and dependencies',
    capabilities: ['Critical Path', 'Dependency Analysis', 'Milestone Tracking'],
  },
  resource: {
    id: 'resource',
    name: 'Resource Agent',
    role: 'Resource Management',
    icon: Users,
    color: 'amber',
    description: 'Optimizes team allocation and capacity',
    capabilities: ['Capacity Planning', 'Skill Matching', 'Utilization'],
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Agent',
    role: 'Data Analysis',
    icon: TrendingUp,
    color: 'violet',
    description: 'Performs deep data analysis and predictions',
    capabilities: ['Trend Analysis', 'Predictions', 'Anomaly Detection'],
  },
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'Coordination',
    icon: Network,
    color: 'gray',
    description: 'Coordinates multi-agent workflows',
    capabilities: ['Task Distribution', 'Result Aggregation', 'Conflict Resolution'],
  },
};

// ============================================================================
// Agent Card Component
// ============================================================================

interface AgentCardProps {
  agent: Agent;
  isActive?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function AgentCard({
  agent,
  isActive,
  onClick,
  compact = false,
}: AgentCardProps) {
  const Icon = agent.icon || Sparkles;

  const statusConfig = {
    idle: { color: 'gray', label: 'Idle' },
    thinking: { color: 'amber', label: 'Thinking...' },
    active: { color: 'emerald', label: 'Active' },
    complete: { color: 'blue', label: 'Done' },
  };

  const status = statusConfig[agent.status];

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          isActive
            ? `bg-${agent.color}-100 dark:bg-${agent.color}-900/30 border-2 border-${agent.color}-500`
            : 'bg-tremor-background-subtle hover:bg-tremor-background-muted'
        )}
      >
        <div className={cn(
          'p-1.5 rounded-full',
          `bg-${agent.color}-100 dark:bg-${agent.color}-900/30`
        )}>
          <Icon className={cn('h-4 w-4', `text-${agent.color}-600`)} />
        </div>
        <div className="text-left">
          <Text className="text-sm font-medium">{agent.name}</Text>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                agent.status === 'thinking' && 'animate-pulse',
                `bg-${status.color}-500`
              )}
            />
            <Text className="text-xs text-tremor-content-subtle">
              {status.label}
            </Text>
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all',
        isActive && `ring-2 ring-${agent.color}-500`
      )}
      onClick={onClick}
    >
      <Flex alignItems="start" className="gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          `bg-${agent.color}-100 dark:bg-${agent.color}-900/30`
        )}>
          <Icon className={cn('h-5 w-5', `text-${agent.color}-600`)} />
        </div>
        <div className="flex-1 min-w-0">
          <Flex justifyContent="between" alignItems="start">
            <div>
              <Text className="font-semibold">{agent.name}</Text>
              <Text className="text-xs text-tremor-content-subtle">
                {agent.role}
              </Text>
            </div>
            <Badge color={status.color as Color} size="xs">
              {status.label}
            </Badge>
          </Flex>
          {agent.description && (
            <Text className="text-sm text-tremor-content-subtle mt-2">
              {agent.description}
            </Text>
          )}
          {agent.capabilities && agent.capabilities.length > 0 && (
            <Flex className="gap-1 mt-2 flex-wrap">
              {agent.capabilities.map((cap) => (
                <Badge key={cap} color="gray" size="xs">
                  {cap}
                </Badge>
              ))}
            </Flex>
          )}
        </div>
      </Flex>
    </Card>
  );
}

// ============================================================================
// Agent Handoff Visualization
// ============================================================================

interface AgentHandoffDisplayProps {
  handoffs: AgentHandoff[];
  agents: Record<string, Agent>;
}

export function AgentHandoffDisplay({
  handoffs,
  agents,
}: AgentHandoffDisplayProps) {
  return (
    <div className="space-y-2">
      {handoffs.map((handoff, idx) => {
        const fromAgent = agents[handoff.fromAgent];
        const toAgent = agents[handoff.toAgent];
        const FromIcon = fromAgent?.icon || Sparkles;
        const ToIcon = toAgent?.icon || Sparkles;

        return (
          <div
            key={idx}
            className="flex items-center gap-2 p-2 rounded-lg bg-tremor-background-subtle"
          >
            <div className={cn(
              'p-1.5 rounded-full',
              `bg-${fromAgent?.color || 'gray'}-100`
            )}>
              <FromIcon className={cn(
                'h-3 w-3',
                `text-${fromAgent?.color || 'gray'}-600`
              )} />
            </div>
            <ArrowRight className="h-3 w-3 text-tremor-content-subtle" />
            <div className={cn(
              'p-1.5 rounded-full',
              `bg-${toAgent?.color || 'gray'}-100`
            )}>
              <ToIcon className={cn(
                'h-3 w-3',
                `text-${toAgent?.color || 'gray'}-600`
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <Text className="text-xs truncate">{handoff.reason}</Text>
            </div>
            <Text className="text-xs text-tremor-content-subtle shrink-0">
              {handoff.timestamp}
            </Text>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Multi-Agent Panel
// ============================================================================

interface MultiAgentPanelProps {
  collaboration?: AgentCollaboration;
  availableAgents?: Agent[];
  onStartCollaboration?: (agentIds: string[], prompt: string) => void;
  onSendMessage?: (content: string) => void;
  className?: string;
}

export function MultiAgentPanel({
  collaboration,
  availableAgents = Object.values(PPM_AGENTS).map(a => ({ ...a, status: 'idle' as const })),
  onStartCollaboration,
  onSendMessage,
  className,
}: MultiAgentPanelProps) {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(0);

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const agentMap = useMemo(() => {
    const map: Record<string, Agent> = {};
    availableAgents.forEach(a => { map[a.id] = a; });
    return map;
  }, [availableAgents]);

  // Extract handoffs from messages
  const handoffs = useMemo(() => {
    if (!collaboration) return [];
    const result: AgentHandoff[] = [];
    let lastAgent: string | null = null;

    collaboration.messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.agent) {
        if (lastAgent && lastAgent !== msg.agent.id) {
          result.push({
            fromAgent: lastAgent,
            toAgent: msg.agent.id,
            reason: 'Analysis handoff',
            timestamp: msg.timestamp,
          });
        }
        lastAgent = msg.agent.id;
      }
    });

    return result;
  }, [collaboration]);

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-tremor-border bg-tremor-background-subtle">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" className="gap-2">
            <Network className="h-5 w-5 text-violet-500" />
            <Title className="text-base">
              {collaboration?.title || 'Multi-Agent Analysis'}
            </Title>
          </Flex>
          {collaboration && (
            <Badge
              color={
                collaboration.status === 'complete' ? 'emerald' :
                collaboration.status === 'in_progress' ? 'blue' :
                collaboration.status === 'error' ? 'rose' : 'gray'
              }
              size="sm"
            >
              {collaboration.status === 'in_progress' ? 'In Progress' :
               collaboration.status === 'complete' ? 'Complete' :
               collaboration.status === 'error' ? 'Error' : 'Idle'}
            </Badge>
          )}
        </Flex>
      </div>

      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="px-4 border-b border-tremor-border">
          <Tab>Conversation</Tab>
          <Tab>Agents ({collaboration?.agents.length || availableAgents.length})</Tab>
          {handoffs.length > 0 && <Tab>Handoffs ({handoffs.length})</Tab>}
        </TabList>

        <TabPanels>
          {/* Conversation Tab */}
          <TabPanel>
            {collaboration ? (
              <AIConversation
                messages={collaboration.messages}
                isLoading={collaboration.status === 'in_progress'}
                showInput={collaboration.status !== 'complete'}
                onSendMessage={onSendMessage}
                maxHeight="400px"
              />
            ) : (
              <div className="p-6 text-center">
                <Network className="h-12 w-12 mx-auto text-tremor-content-subtle mb-4" />
                <Text className="font-medium mb-2">
                  Select agents to start a collaboration
                </Text>
                <Text className="text-sm text-tremor-content-subtle mb-4">
                  Multiple agents can work together to analyze complex problems
                </Text>
                <Button
                  onClick={() => setActiveTab(1)}
                  variant="outline"
                >
                  Select Agents
                </Button>
              </div>
            )}
          </TabPanel>

          {/* Agents Tab */}
          <TabPanel>
            <div className="p-4">
              <Text className="text-sm text-tremor-content-subtle mb-3">
                {collaboration
                  ? 'Participating agents'
                  : 'Select agents for collaboration'}
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(collaboration?.agents || availableAgents).map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isActive={selectedAgents.has(agent.id)}
                    onClick={() => !collaboration && toggleAgent(agent.id)}
                    compact
                  />
                ))}
              </div>
              {!collaboration && selectedAgents.size > 0 && (
                <div className="mt-4">
                  <Button
                    onClick={() => onStartCollaboration?.(
                      Array.from(selectedAgents),
                      'Analyze portfolio health'
                    )}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Analysis with {selectedAgents.size} Agents
                  </Button>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Handoffs Tab */}
          {handoffs.length > 0 && (
            <TabPanel>
              <div className="p-4">
                <Text className="text-sm text-tremor-content-subtle mb-3">
                  Agent communication flow
                </Text>
                <AgentHandoffDisplay handoffs={handoffs} agents={agentMap} />
              </div>
            </TabPanel>
          )}
        </TabPanels>
      </TabGroup>

      {/* Result Display */}
      {collaboration?.status === 'complete' && collaboration.result && (
        <div className="p-4 border-t border-tremor-border bg-emerald-50 dark:bg-emerald-900/20">
          <Flex alignItems="center" className="gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <Text className="font-medium text-emerald-700 dark:text-emerald-300">
              Analysis Complete
            </Text>
          </Flex>
          {collaboration.result}
        </div>
      )}
    </Card>
  );
}

export default MultiAgentPanel;
