import { useState } from 'react';
import {
  Text,
  Flex,
  Badge,
  ProgressBar,
  type Color,
} from '@tremor/react';
import {
  Brain,
  Database,
  BookOpen,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  Radio,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Archive,
  MessageSquare,
  Eye,
  Activity,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MemoryCoreBlock,
  MemoryFactsBlock,
  MemoryTimelineBlock,
  MemoryStatsBlock,
} from '@shared/agentUIPacket';

// ============================================================================
// Memory Core Renderer — Shows the agent's "mind"
// Persona, policies, what it's learned, what it's working on
// ============================================================================

export function MemoryCoreRenderer({ block, className }: { block: MemoryCoreBlock; className?: string }) {
  const [expandedSection, setExpandedSection] = useState<string | null>('learnedFacts');

  const sections = [
    {
      id: 'persona',
      label: 'Identity & Role',
      icon: Brain,
      color: 'violet' as Color,
      count: null,
    },
    {
      id: 'policies',
      label: 'Active Policies',
      icon: Shield,
      color: 'blue' as Color,
      count: block.policies.length,
    },
    {
      id: 'learnedFacts',
      label: 'Learned Facts',
      icon: BookOpen,
      color: 'emerald' as Color,
      count: block.learnedFacts.length,
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <Flex alignItems="center" className="gap-2 mb-3">
        <Brain className="h-4 w-4 text-violet-500" />
        <Text className="font-semibold">Core Memory — {block.agentName}</Text>
        <Badge color="violet" size="xs">Letta</Badge>
      </Flex>

      {/* Current Context */}
      {block.currentContext && (
        <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 mb-3">
          <Flex alignItems="center" className="gap-1.5 mb-1">
            <Activity className="h-3.5 w-3.5 text-violet-500" />
            <Text className="text-xs font-medium text-violet-700 dark:text-violet-300">Currently Focused On</Text>
          </Flex>
          <Text className="text-sm">{block.currentContext}</Text>
        </div>
      )}

      {/* Expandable sections */}
      {sections.map(section => {
        const isExpanded = expandedSection === section.id;
        const Icon = section.icon;

        return (
          <div key={section.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-tremor-background-subtle transition-colors"
            >
              <Icon className={cn('h-4 w-4', `text-${section.color}-500`)} />
              <Text className="text-sm font-medium flex-1 text-left">{section.label}</Text>
              {section.count !== null && (
                <Badge color={section.color} size="xs">{section.count}</Badge>
              )}
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 border-t">
                {section.id === 'persona' && (
                  <Text className="text-sm mt-2 text-tremor-content whitespace-pre-wrap">
                    {block.persona}
                  </Text>
                )}

                {section.id === 'policies' && (
                  <div className="mt-2 space-y-1">
                    {block.policies.length === 0 ? (
                      <Text className="text-xs text-tremor-content-subtle">No active policies</Text>
                    ) : (
                      block.policies.map((policy, i) => (
                        <Flex key={i} alignItems="start" className="gap-2 py-1">
                          <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <Text className="text-sm">{policy}</Text>
                        </Flex>
                      ))
                    )}
                  </div>
                )}

                {section.id === 'learnedFacts' && (
                  <div className="mt-2 space-y-1.5">
                    {block.learnedFacts.length === 0 ? (
                      <Text className="text-xs text-tremor-content-subtle">No learned facts yet</Text>
                    ) : (
                      block.learnedFacts.map((fact, i) => (
                        <div key={i} className="flex items-start gap-2 py-1 px-2 rounded bg-emerald-50/50 dark:bg-emerald-900/10">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <Text className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              {fact.key}
                            </Text>
                            <Text className="text-sm">
                              {typeof fact.value === 'object' ? JSON.stringify(fact.value) : String(fact.value)}
                            </Text>
                            {fact.learnedAt && (
                              <Text className="text-xs text-tremor-content-subtle">
                                Learned {new Date(fact.learnedAt).toLocaleDateString()}
                              </Text>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pending Actions */}
      {block.pendingActions && block.pendingActions.length > 0 && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Flex alignItems="center" className="gap-1.5 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <Text className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Pending Actions ({block.pendingActions.length})
            </Text>
          </Flex>
          <div className="space-y-1">
            {block.pendingActions.map((action, i) => (
              <Flex key={i} alignItems="center" className="gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <Text className="text-sm">{action}</Text>
              </Flex>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Memory Facts Renderer — Shows Mem0 shared facts broadcast/received
// ============================================================================

export function MemoryFactsRenderer({ block, className }: { block: MemoryFactsBlock; className?: string }) {
  const [showSubscriptions, setShowSubscriptions] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      <Flex alignItems="center" className="gap-2">
        <Database className="h-4 w-4 text-blue-500" />
        <Text className="font-semibold">
          Shared Facts — {block.direction === 'broadcast' ? 'Broadcast' : block.direction === 'received' ? 'Received' : 'All'}
        </Text>
        <Badge color="blue" size="xs">Mem0</Badge>
        <Badge color="gray" size="xs">{block.facts.length} facts</Badge>
      </Flex>

      {/* Facts list */}
      <div className="border rounded-lg overflow-hidden divide-y divide-tremor-border max-h-64 overflow-y-auto">
        {block.facts.length === 0 ? (
          <div className="p-4 text-center">
            <Text className="text-sm text-tremor-content-subtle">No facts yet</Text>
          </div>
        ) : (
          block.facts.map((fact) => {
            const isOutgoing = fact.sourceAgent === block.facts[0]?.sourceAgent;
            return (
              <div key={fact.id} className={cn(
                'px-3 py-2 hover:bg-tremor-background-subtle transition-colors',
                fact.superseded && 'opacity-50'
              )}>
                <Flex alignItems="start" className="gap-2">
                  {isOutgoing ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Flex alignItems="center" className="gap-1.5">
                      <Text className="text-xs font-mono text-tremor-content-subtle">
                        {fact.entity}:{fact.attribute}
                      </Text>
                      <Badge
                        color={fact.confidence >= 0.8 ? 'emerald' : fact.confidence >= 0.5 ? 'amber' : 'gray'}
                        size="xs"
                      >
                        {Math.round(fact.confidence * 100)}%
                      </Badge>
                      {fact.superseded && <Badge color="gray" size="xs">superseded</Badge>}
                    </Flex>
                    <Text className="text-sm font-medium mt-0.5">
                      {typeof fact.value === 'object' ? JSON.stringify(fact.value) : String(fact.value)}
                    </Text>
                    <Flex alignItems="center" className="gap-2 mt-0.5">
                      <Text className="text-xs text-tremor-content-subtle">
                        from {fact.sourceAgentName}
                      </Text>
                      <Text className="text-xs text-tremor-content-subtle">
                        {new Date(fact.timestamp).toLocaleTimeString()}
                      </Text>
                    </Flex>
                  </div>
                </Flex>
              </div>
            );
          })
        )}
      </div>

      {/* Subscriptions */}
      {block.subscriptions && block.subscriptions.length > 0 && (
        <div>
          <button
            onClick={() => setShowSubscriptions(!showSubscriptions)}
            className="flex items-center gap-2 text-xs text-tremor-content-subtle hover:text-tremor-content-emphasis"
          >
            {showSubscriptions ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Radio className="h-3 w-3" />
            Active Subscriptions ({block.subscriptions.length})
          </button>
          {showSubscriptions && (
            <div className="mt-2 space-y-1">
              {block.subscriptions.map((sub, i) => (
                <Flex key={i} alignItems="center" className="gap-2 px-2 py-1 rounded bg-tremor-background-subtle">
                  <Eye className="h-3.5 w-3.5 text-blue-400" />
                  <Text className="text-xs font-mono flex-1">{sub.pattern}</Text>
                  <Badge color="gray" size="xs">{sub.matchCount} matches</Badge>
                </Flex>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Memory Timeline Renderer — Temporal view of all memory activity
// ============================================================================

export function MemoryTimelineRenderer({ block, className }: { block: MemoryTimelineBlock; className?: string }) {
  const eventConfig: Record<string, { icon: typeof Zap; color: Color; label: string }> = {
    'fact-broadcast': { icon: ArrowUpRight, color: 'blue', label: 'Broadcast' },
    'fact-received': { icon: ArrowDownLeft, color: 'emerald', label: 'Received' },
    'learned': { icon: Sparkles, color: 'violet', label: 'Learned' },
    'archived': { icon: Archive, color: 'gray', label: 'Archived' },
    'policy-added': { icon: Shield, color: 'blue', label: 'Policy Added' },
    'policy-removed': { icon: Shield, color: 'rose', label: 'Policy Removed' },
    'context-changed': { icon: Brain, color: 'amber', label: 'Context Changed' },
    'a2a-message': { icon: MessageSquare, color: 'indigo', label: 'A2A Message' },
  };

  const sourceColors: Record<string, Color> = {
    mem0: 'blue',
    letta: 'violet',
    conversation: 'gray',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Flex alignItems="center" className="gap-2">
        <Clock className="h-4 w-4 text-tremor-content-subtle" />
        {block.title && <Text className="font-semibold">{block.title}</Text>}
        {!block.title && <Text className="font-semibold">Memory Timeline</Text>}
      </Flex>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-tremor-border" />

        <div className="space-y-0.5">
          {block.events.map((event, i) => {
            const config = eventConfig[event.eventType] || { icon: Zap, color: 'gray' as Color, label: event.eventType };
            const EventIcon = config.icon;

            return (
              <div key={i} className="flex gap-3 py-1.5 relative">
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10',
                  `bg-${config.color}-100 dark:bg-${config.color}-900/30`
                )}>
                  <EventIcon className={cn('h-3 w-3', `text-${config.color}-600`)} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <Flex alignItems="center" className="gap-1.5">
                    <Text className="text-sm">{event.description}</Text>
                  </Flex>
                  <Flex alignItems="center" className="gap-1.5 mt-0.5">
                    <Badge color={sourceColors[event.source] || 'gray'} size="xs">
                      {event.source}
                    </Badge>
                    {event.agentName && (
                      <Text className="text-xs text-tremor-content-subtle">{event.agentName}</Text>
                    )}
                    <Text className="text-xs text-tremor-content-subtle ml-auto">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </Text>
                  </Flex>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Memory Stats Renderer — Usage metrics at a glance
// ============================================================================

export function MemoryStatsRenderer({ block, className }: { block: MemoryStatsBlock; className?: string }) {
  const { stats } = block;

  const memoryLayers = [
    {
      label: 'Shared Facts (Mem0)',
      icon: Database,
      color: 'blue' as Color,
      items: [
        { label: 'Facts Broadcast', value: stats.totalFactsBroadcast },
        { label: 'Facts Received', value: stats.totalFactsReceived },
        { label: 'Active Subscriptions', value: stats.activeSubscriptions },
      ],
    },
    {
      label: 'Core Memory (Letta)',
      icon: Brain,
      color: 'violet' as Color,
      items: [
        { label: 'Learned Facts', value: stats.learnedFactsCount },
        { label: 'Active Policies', value: stats.policiesCount },
        { label: 'Archival Entries', value: stats.archivalEntries },
      ],
    },
    {
      label: 'Conversation Memory',
      icon: MessageSquare,
      color: 'gray' as Color,
      items: [
        { label: 'Messages', value: stats.conversationMessages },
        { label: 'Semantic Facts', value: stats.semanticFacts },
      ],
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <Flex alignItems="center" className="gap-2">
        <Activity className="h-4 w-4 text-tremor-content-subtle" />
        <Text className="font-semibold">Memory Usage — {block.agentName}</Text>
      </Flex>

      {/* Utilization bar */}
      <div>
        <Flex justifyContent="between" className="mb-1">
          <Text className="text-xs text-tremor-content-subtle">Memory Utilization</Text>
          <Text className="text-xs font-medium">{stats.memoryUtilization}%</Text>
        </Flex>
        <ProgressBar
          value={stats.memoryUtilization}
          color={stats.memoryUtilization > 80 ? 'rose' : stats.memoryUtilization > 60 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Memory layers */}
      {memoryLayers.map((layer) => {
        const LayerIcon = layer.icon;
        return (
          <div key={layer.label} className="space-y-1">
            <Flex alignItems="center" className="gap-1.5">
              <LayerIcon className={cn('h-3.5 w-3.5', `text-${layer.color}-500`)} />
              <Text className="text-xs font-medium">{layer.label}</Text>
            </Flex>
            <div className="grid grid-cols-3 gap-2">
              {layer.items.map((item) => (
                <div key={item.label} className="text-center p-1.5 rounded bg-tremor-background-subtle">
                  <Text className="text-lg font-semibold">{item.value}</Text>
                  <Text className="text-xs text-tremor-content-subtle">{item.label}</Text>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Last activity */}
      <Flex alignItems="center" className="gap-1.5 pt-1 border-t">
        <Clock className="h-3 w-3 text-tremor-content-subtle" />
        <Text className="text-xs text-tremor-content-subtle">
          Last activity: {new Date(stats.lastActivityAt).toLocaleString()}
        </Text>
      </Flex>
    </div>
  );
}
