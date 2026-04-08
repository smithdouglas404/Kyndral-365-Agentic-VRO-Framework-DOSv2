/**
 * AI Conversation Components
 *
 * Inspired by shadcn.io AI components - provides chat-style interfaces
 * for agent discussions, recommendations, and insights.
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
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
  User,
  Bot,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Send,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface AgentIdentity {
  id: string;
  name: string;
  role?: string;
  icon?: LucideIcon;
  color?: Color;
  avatar?: string;
}

export interface MessageSource {
  id: string;
  title: string;
  type: 'database' | 'api' | 'document' | 'calculation' | 'external';
  url?: string;
  confidence?: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  agent?: AgentIdentity;
  content: ReactNode;
  reasoning?: string;
  sources?: MessageSource[];
  toolCalls?: ToolCall[];
  timestamp: string;
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative';
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
}

// ============================================================================
// Message Component
// ============================================================================

interface AIMessageProps {
  message: ConversationMessage;
  showReasoning?: boolean;
  showSources?: boolean;
  showTools?: boolean;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  onRetry?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

export function AIMessage({
  message,
  showReasoning = true,
  showSources = true,
  showTools = true,
  onFeedback,
  onRetry,
  onCopy,
}: AIMessageProps) {
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAssistant = message.role === 'assistant';
  const AgentIcon = message.agent?.icon || (isAssistant ? Bot : User);

  const handleCopy = () => {
    const textContent = typeof message.content === 'string'
      ? message.content
      : 'Content copied';
    onCopy?.(textContent);
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isAssistant ? 'bg-tremor-background' : 'bg-tremor-background-subtle'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'p-2 rounded-full shrink-0 h-fit',
          isAssistant
            ? `bg-${message.agent?.color || 'violet'}-100 dark:bg-${message.agent?.color || 'violet'}-900/30`
            : 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <AgentIcon
          className={cn(
            'h-4 w-4',
            isAssistant
              ? `text-${message.agent?.color || 'violet'}-600`
              : 'text-gray-600'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <Flex alignItems="center" className="gap-2">
          <Text className="font-medium">
            {isAssistant ? message.agent?.name || 'Assistant' : 'You'}
          </Text>
          {message.agent?.role && (
            <Badge color={message.agent.color || 'gray'} size="xs">
              {message.agent.role}
            </Badge>
          )}
          <Text className="text-xs text-tremor-content-subtle">
            {message.timestamp}
          </Text>
          {message.isStreaming && (
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse delay-75" />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse delay-150" />
            </div>
          )}
        </Flex>

        {/* Tool Calls (before content) */}
        {showTools && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallsDisplay
            toolCalls={message.toolCalls}
            expanded={toolsExpanded}
            onToggle={() => setToolsExpanded(!toolsExpanded)}
          />
        )}

        {/* Main Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content}
        </div>

        {/* Reasoning */}
        {showReasoning && message.reasoning && (
          <ReasoningDisplay
            reasoning={message.reasoning}
            expanded={reasoningExpanded}
            onToggle={() => setReasoningExpanded(!reasoningExpanded)}
            color={message.agent?.color}
          />
        )}

        {/* Sources */}
        {showSources && message.sources && message.sources.length > 0 && (
          <SourcesDisplay sources={message.sources} />
        )}

        {/* Actions */}
        {isAssistant && (
          <Flex className="gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            {onFeedback && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2',
                    message.feedback === 'positive' && 'text-emerald-500'
                  )}
                  onClick={() => onFeedback(message.id, 'positive')}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2',
                    message.feedback === 'negative' && 'text-rose-500'
                  )}
                  onClick={() => onFeedback(message.id, 'negative')}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => onRetry(message.id)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </Flex>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Reasoning Display
// ============================================================================

interface ReasoningDisplayProps {
  reasoning: string;
  expanded: boolean;
  onToggle: () => void;
  color?: Color;
  duration?: string;
}

export function ReasoningDisplay({
  reasoning,
  expanded,
  onToggle,
  color = 'violet',
  duration,
}: ReasoningDisplayProps) {
  return (
    <div className={cn(
      'rounded-lg border',
      `border-${color}-200 dark:border-${color}-800`
    )}>
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm',
          `text-${color}-700 dark:text-${color}-300`,
          `hover:bg-${color}-50 dark:hover:bg-${color}-900/20`,
          'rounded-t-lg transition-colors'
        )}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Sparkles className="h-3 w-3" />
        <span>Reasoning</span>
        {duration && (
          <span className="text-xs opacity-70 ml-auto">{duration}</span>
        )}
      </button>
      {expanded && (
        <div className={cn(
          'px-3 py-2 text-sm border-t',
          `border-${color}-200 dark:border-${color}-800`,
          `bg-${color}-50/50 dark:bg-${color}-900/10`,
          'rounded-b-lg'
        )}>
          <Text className="text-tremor-content-subtle whitespace-pre-wrap">
            {reasoning}
          </Text>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sources Display
// ============================================================================

interface SourcesDisplayProps {
  sources: MessageSource[];
}

export function SourcesDisplay({ sources }: SourcesDisplayProps) {
  const getSourceIcon = (type: MessageSource['type']) => {
    switch (type) {
      case 'database': return '🗄️';
      case 'api': return '🔌';
      case 'document': return '📄';
      case 'calculation': return '🔢';
      case 'external': return '🌐';
      default: return '📎';
    }
  };

  return (
    <div className="mt-2">
      <Text className="text-xs text-tremor-content-subtle mb-1">Sources</Text>
      <Flex className="gap-2 flex-wrap">
        {sources.map((source) => (
          <Badge
            key={source.id}
            color="gray"
            size="xs"
            className="gap-1 cursor-pointer hover:opacity-80"
            onClick={() => source.url && window.open(source.url, '_blank')}
          >
            <span>{getSourceIcon(source.type)}</span>
            <span>{source.title}</span>
            {source.confidence && (
              <span className="opacity-70">({source.confidence}%)</span>
            )}
          </Badge>
        ))}
      </Flex>
    </div>
  );
}

// ============================================================================
// Tool Calls Display
// ============================================================================

interface ToolCallsDisplayProps {
  toolCalls: ToolCall[];
  expanded: boolean;
  onToggle: () => void;
}

export function ToolCallsDisplay({
  toolCalls,
  expanded,
  onToggle,
}: ToolCallsDisplayProps) {
  const completedCount = toolCalls.filter(t => t.status === 'completed').length;
  const runningCount = toolCalls.filter(t => t.status === 'running').length;

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-t-lg transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>Tool Calls</span>
        <Badge color="blue" size="xs">
          {completedCount}/{toolCalls.length}
        </Badge>
        {runningCount > 0 && (
          <Loader2 className="h-3 w-3 animate-spin ml-auto" />
        )}
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-b-lg space-y-2">
          {toolCalls.map((tool) => (
            <div key={tool.id} className="text-sm">
              <Flex alignItems="center" className="gap-2">
                {tool.status === 'running' ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                ) : tool.status === 'completed' ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : tool.status === 'error' ? (
                  <span className="text-rose-500">✕</span>
                ) : (
                  <span className="h-3 w-3 rounded-full bg-gray-300" />
                )}
                <code className="text-xs font-mono bg-tremor-background px-1 rounded">
                  {tool.name}
                </code>
                {tool.duration && (
                  <span className="text-xs text-tremor-content-subtle ml-auto">
                    {tool.duration}ms
                  </span>
                )}
              </Flex>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Conversation Container
// ============================================================================

interface AIConversationProps {
  title?: string;
  messages: ConversationMessage[];
  isLoading?: boolean;
  showInput?: boolean;
  inputPlaceholder?: string;
  onSendMessage?: (content: string) => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  onRetry?: (messageId: string) => void;
  className?: string;
  maxHeight?: string;
}

export function AIConversation({
  title,
  messages,
  isLoading,
  showInput = true,
  inputPlaceholder = 'Ask a question...',
  onSendMessage,
  onFeedback,
  onRetry,
  className,
  maxHeight = '500px',
}: AIConversationProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-tremor-border bg-tremor-background-subtle">
          <Flex alignItems="center" className="gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <Title className="text-base">{title}</Title>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-violet-500 ml-auto" />
            )}
          </Flex>
        </div>
      )}

      {/* Messages */}
      <ScrollArea
        ref={scrollRef}
        className="divide-y divide-tremor-border"
        style={{ maxHeight }}
      >
        {messages.map((message) => (
          <AIMessage
            key={message.id}
            message={message}
            onFeedback={onFeedback}
            onRetry={onRetry}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 p-4 bg-tremor-background">
            <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <Bot className="h-4 w-4 text-violet-600" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              <Text className="text-sm text-tremor-content-subtle">
                Thinking...
              </Text>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {showInput && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-tremor-border">
          <Flex className="gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              className="min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </Flex>
        </form>
      )}
    </Card>
  );
}

export default AIConversation;
