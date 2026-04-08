import { useState, useEffect, type ReactNode } from 'react';
import {
  Card,
  Title,
  Text,
  Flex,
  Badge,
  type Color,
} from '@tremor/react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface StreamingWidgetState {
  status: 'idle' | 'thinking' | 'streaming' | 'complete' | 'error';
  thinkingMessage?: string;
  error?: string;
}

export interface AgentMeta {
  name: string;
  icon?: LucideIcon;
  color?: Color;
}

interface TremorAgentStreamWidgetProps {
  title: string;
  agent?: AgentMeta;
  state: StreamingWidgetState;
  children: ReactNode;
  onRefresh?: () => void;
  showReasoning?: boolean;
  reasoning?: string;
  timestamp?: string;
  className?: string;
}

// ============================================================================
// Agent Stream Widget
// ============================================================================

/**
 * A widget container for agent-generated UI components.
 * Supports streaming state, loading indicators, and agent reasoning display.
 *
 * Usage with Vercel AI SDK pattern:
 * ```tsx
 * const [agentUI, setAgentUI] = useState<ReactNode>();
 * const [state, setState] = useState<StreamingWidgetState>({ status: 'idle' });
 *
 * const runAgent = async () => {
 *   setState({ status: 'thinking', thinkingMessage: 'Analyzing data...' });
 *   const ui = await streamPPMInsight('PRJ-101');
 *   setAgentUI(ui);
 *   setState({ status: 'complete' });
 * };
 *
 * <TremorAgentStreamWidget
 *   title="Budget Analysis"
 *   agent={{ name: 'FinOps Agent' }}
 *   state={state}
 *   onRefresh={runAgent}
 * >
 *   {agentUI}
 * </TremorAgentStreamWidget>
 * ```
 */
export function TremorAgentStreamWidget({
  title,
  agent,
  state,
  children,
  onRefresh,
  showReasoning = false,
  reasoning,
  timestamp,
  className,
}: TremorAgentStreamWidgetProps) {
  const [showReasoningPanel, setShowReasoningPanel] = useState(false);
  const AgentIcon = agent?.icon || Sparkles;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Header */}
      <Flex justifyContent="between" alignItems="start" className="mb-4">
        <div>
          <Flex alignItems="center" className="gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              `bg-${agent?.color || 'violet'}-100 dark:bg-${agent?.color || 'violet'}-900/30`
            )}>
              <AgentIcon className={cn(
                'h-4 w-4',
                `text-${agent?.color || 'violet'}-600`
              )} />
            </div>
            <Title className="text-base">{title}</Title>
          </Flex>
          {agent && (
            <Flex alignItems="center" className="gap-2 mt-1">
              <Badge color={agent.color || 'violet'} size="xs">
                {agent.name}
              </Badge>
              {timestamp && (
                <Text className="text-xs text-tremor-content-subtle">
                  {timestamp}
                </Text>
              )}
            </Flex>
          )}
        </div>

        <Flex className="gap-1">
          {state.status === 'complete' && (
            <Badge color="emerald" size="xs" icon={CheckCircle}>
              Ready
            </Badge>
          )}
          {state.status === 'error' && (
            <Badge color="rose" size="xs" icon={AlertTriangle}>
              Error
            </Badge>
          )}
          {onRefresh && state.status !== 'thinking' && state.status !== 'streaming' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Thinking State */}
      {state.status === 'thinking' && (
        <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg mb-4">
          <div className="relative">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="h-5 w-5 text-violet-400 opacity-50" />
            </div>
          </div>
          <div>
            <Text className="font-medium text-violet-700 dark:text-violet-300">
              {state.thinkingMessage || 'Agent is analyzing...'}
            </Text>
            <ThinkingDots />
          </div>
        </div>
      )}

      {/* Streaming State */}
      {state.status === 'streaming' && (
        <div className="mb-4">
          <Flex alignItems="center" className="gap-2 mb-2">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse delay-75" />
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse delay-150" />
            </div>
            <Text className="text-xs text-violet-600">Rendering widget...</Text>
          </Flex>
        </div>
      )}

      {/* Error State */}
      {state.status === 'error' && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg mb-4">
          <Flex alignItems="start" className="gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <Text className="font-medium text-rose-700 dark:text-rose-300">
                Failed to generate widget
              </Text>
              {state.error && (
                <Text className="text-sm text-rose-600 dark:text-rose-400">
                  {state.error}
                </Text>
              )}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </Flex>
        </div>
      )}

      {/* Main Content (Streamed Widget) */}
      {(state.status === 'complete' || state.status === 'streaming') && children && (
        <div className="min-h-[100px]">
          {children}
        </div>
      )}

      {/* Reasoning Panel */}
      {showReasoning && reasoning && state.status === 'complete' && (
        <div className="mt-4 border-t border-tremor-border pt-4">
          <button
            onClick={() => setShowReasoningPanel(!showReasoningPanel)}
            className="flex items-center gap-2 text-sm text-tremor-content-subtle hover:text-tremor-content-emphasis"
          >
            {showReasoningPanel ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Sparkles className="h-3 w-3" />
            Agent Reasoning
          </button>
          {showReasoningPanel && (
            <div className="mt-2 p-3 bg-tremor-background-subtle rounded-lg text-sm">
              <Text className="text-tremor-content-subtle whitespace-pre-wrap">
                {reasoning}
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Idle State Placeholder */}
      {state.status === 'idle' && !children && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-8 w-8 text-tremor-content-subtle mb-3" />
          <Text className="text-tremor-content-subtle mb-3">
            Click refresh to generate widget
          </Text>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <Sparkles className="h-4 w-4 mr-1" />
              Generate
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// Thinking Dots Animation
// ============================================================================

function ThinkingDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-violet-500 text-sm">{dots}</span>
  );
}

// ============================================================================
// Agent Message Component (for chat-style interactions)
// ============================================================================

interface AgentMessageProps {
  agent: AgentMeta;
  content: ReactNode;
  timestamp?: string;
  isStreaming?: boolean;
}

export function AgentMessage({
  agent,
  content,
  timestamp,
  isStreaming,
}: AgentMessageProps) {
  const AgentIcon = agent.icon || Sparkles;

  return (
    <div className="flex gap-3 p-4">
      <div className={cn(
        'p-2 rounded-full shrink-0 h-fit',
        `bg-${agent.color || 'violet'}-100 dark:bg-${agent.color || 'violet'}-900/30`
      )}>
        <AgentIcon className={cn(
          'h-4 w-4',
          `text-${agent.color || 'violet'}-600`
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <Flex alignItems="center" className="gap-2 mb-1">
          <Text className="font-medium">{agent.name}</Text>
          {timestamp && (
            <Text className="text-xs text-tremor-content-subtle">{timestamp}</Text>
          )}
          {isStreaming && (
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse delay-75" />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse delay-150" />
            </div>
          )}
        </Flex>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {content}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Multi-Agent Discussion Widget
// ============================================================================

interface AgentDiscussion {
  messages: {
    id: string;
    agent: AgentMeta;
    content: ReactNode;
    timestamp: string;
  }[];
}

interface TremorAgentDiscussionProps {
  title: string;
  discussion: AgentDiscussion;
  isLive?: boolean;
  className?: string;
}

export function TremorAgentDiscussion({
  title,
  discussion,
  isLive,
  className,
}: TremorAgentDiscussionProps) {
  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-tremor-border bg-tremor-background-subtle">
        <Flex justifyContent="between" alignItems="center">
          <Title className="text-base">{title}</Title>
          {isLive && (
            <Flex alignItems="center" className="gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Text className="text-xs text-emerald-600">Live</Text>
            </Flex>
          )}
        </Flex>
      </div>
      <div className="divide-y divide-tremor-border max-h-96 overflow-y-auto">
        {discussion.messages.map((message) => (
          <AgentMessage
            key={message.id}
            agent={message.agent}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// Export hook for agent streaming state management
// ============================================================================

export function useAgentStream() {
  const [state, setState] = useState<StreamingWidgetState>({ status: 'idle' });
  const [content, setContent] = useState<ReactNode>(null);
  const [reasoning, setReasoning] = useState<string>('');

  const startThinking = (message?: string) => {
    setState({ status: 'thinking', thinkingMessage: message });
  };

  const startStreaming = () => {
    setState({ status: 'streaming' });
  };

  const complete = (ui: ReactNode, agentReasoning?: string) => {
    setContent(ui);
    if (agentReasoning) setReasoning(agentReasoning);
    setState({ status: 'complete' });
  };

  const error = (errorMessage: string) => {
    setState({ status: 'error', error: errorMessage });
  };

  const reset = () => {
    setState({ status: 'idle' });
    setContent(null);
    setReasoning('');
  };

  return {
    state,
    content,
    reasoning,
    startThinking,
    startStreaming,
    complete,
    error,
    reset,
  };
}

export default TremorAgentStreamWidget;
