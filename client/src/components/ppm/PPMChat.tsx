/**
 * PPM Chat Sidebar
 *
 * Persistent chat interface for:
 * - Quick questions to agents
 * - Command execution
 * - Context-aware suggestions
 * - Multi-agent conversations
 */

import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lightbulb,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Zap,
  DollarSign,
  Shield,
  TrendingUp,
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Card, Text, Badge, Flex } from '@tremor/react';

// ============================================================================
// Types
// ============================================================================

interface Agent {
  id: string;
  name: string;
  icon: typeof Bot;
  color: string;
  specialties: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  timestamp: Date;
  isStreaming?: boolean;
  reasoning?: string;
  toolCalls?: { name: string; result: string }[];
}

interface SuggestedPrompt {
  id: string;
  text: string;
  agentId?: string;
  category: 'quick' | 'analysis' | 'action';
}

// ============================================================================
// Available Agents
// ============================================================================

const AGENTS: Agent[] = [
  {
    id: 'orchestrator',
    name: 'PPM Assistant',
    icon: Sparkles,
    color: 'violet',
    specialties: ['general', 'routing', 'summary'],
  },
  {
    id: 'finops',
    name: 'FinOps Agent',
    icon: DollarSign,
    color: 'emerald',
    specialties: ['budget', 'cost', 'forecast'],
  },
  {
    id: 'risk',
    name: 'Risk Agent',
    icon: Shield,
    color: 'rose',
    specialties: ['risk', 'mitigation', 'compliance'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio Agent',
    icon: TrendingUp,
    color: 'blue',
    specialties: ['projects', 'status', 'dependencies'],
  },
  {
    id: 'governance',
    name: 'Governance Agent',
    icon: Users,
    color: 'amber',
    specialties: ['approvals', 'compliance', 'audit'],
  },
];

// ============================================================================
// Suggested Prompts
// ============================================================================

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: '1',
    text: 'Show me projects at risk this week',
    agentId: 'risk',
    category: 'quick',
  },
  {
    id: '2',
    text: "What's the budget status for Q1?",
    agentId: 'finops',
    category: 'quick',
  },
  {
    id: '3',
    text: 'Generate executive summary',
    agentId: 'orchestrator',
    category: 'analysis',
  },
  {
    id: '4',
    text: 'List pending approvals',
    agentId: 'governance',
    category: 'action',
  },
];

// ============================================================================
// Message Component
// ============================================================================

interface MessageBubbleProps {
  message: ChatMessage;
  agent?: Agent;
}

function MessageBubble({ message, agent }: MessageBubbleProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = agent?.icon || Bot;

  return (
    <div
      className={cn(
        'flex gap-3',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
          message.role === 'user'
            ? 'bg-tremor-brand text-white'
            : agent
            ? `bg-${agent.color}-500/10`
            : 'bg-violet-500/10'
        )}
      >
        {message.role === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Icon className={cn('h-4 w-4', agent && `text-${agent.color}-600`)} />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1', message.role === 'user' ? 'text-right' : '')}>
        {/* Agent name */}
        {message.role === 'assistant' && agent && (
          <Text className="text-xs text-tremor-content-subtle mb-1">
            {agent.name}
          </Text>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-3 py-2 inline-block max-w-[85%]',
            message.role === 'user'
              ? 'bg-tremor-brand text-white'
              : 'bg-tremor-background-subtle'
          )}
        >
          {message.isStreaming ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <Text className="text-sm whitespace-pre-wrap">{message.content}</Text>
          )}
        </div>

        {/* Reasoning toggle */}
        {message.reasoning && !message.isStreaming && (
          <div className="mt-1">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="text-xs text-tremor-content-subtle hover:text-tremor-content flex items-center gap-1"
            >
              <Lightbulb className="h-3 w-3" />
              {showReasoning ? 'Hide' : 'Show'} reasoning
              {showReasoning ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showReasoning && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-tremor-content">
                {message.reasoning}
              </div>
            )}
          </div>
        )}

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tool, idx) => (
              <div
                key={idx}
                className="text-xs bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1"
              >
                <Zap className="h-3 w-3 inline mr-1 text-blue-500" />
                <span className="font-mono">{tool.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {message.role === 'assistant' && !message.isStreaming && (
          <div className="mt-1 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <Text className="text-xs text-tremor-content-subtle">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Agent Selector
// ============================================================================

interface AgentSelectorProps {
  selectedAgent: Agent;
  onSelect: (agent: Agent) => void;
}

function AgentSelector({ selectedAgent, onSelect }: AgentSelectorProps) {
  const Icon = selectedAgent.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-8"
        >
          <Icon className={cn('h-3.5 w-3.5', `text-${selectedAgent.color}-600`)} />
          <span className="text-xs">{selectedAgent.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {AGENTS.map((agent) => {
          const AgentIcon = agent.icon;
          return (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => onSelect(agent)}
              className="gap-2"
            >
              <AgentIcon className={cn('h-4 w-4', `text-${agent.color}-600`)} />
              <div className="flex-1">
                <div className="text-sm">{agent.name}</div>
                <div className="text-xs text-muted-foreground">
                  {agent.specialties.slice(0, 2).join(', ')}
                </div>
              </div>
              {selectedAgent.id === agent.id && (
                <Check className="h-4 w-4 text-emerald-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Suggested Prompts
// ============================================================================

interface SuggestedPromptsProps {
  prompts: SuggestedPrompt[];
  onSelect: (prompt: SuggestedPrompt) => void;
}

function SuggestedPromptsSection({ prompts, onSelect }: SuggestedPromptsProps) {
  return (
    <div className="p-3 space-y-2">
      <Text className="text-xs text-tremor-content-subtle font-medium">
        Suggested
      </Text>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt)}
            className="px-2.5 py-1.5 bg-tremor-background-subtle hover:bg-tremor-background-emphasis rounded-full text-xs transition-colors"
          >
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Chat Component
// ============================================================================

interface PPMChatProps {
  onSendMessage?: (message: string, agentId: string) => void;
  className?: string;
}

export function PPMChat({ onSendMessage, className }: PPMChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add streaming placeholder
    const streamingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      agentId: selectedAgent.id,
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, streamingMessage]);

    // Simulate response (replace with actual API call)
    setTimeout(() => {
      const response: ChatMessage = {
        ...streamingMessage,
        content: getSimulatedResponse(input, selectedAgent),
        isStreaming: false,
        reasoning: 'Analyzed portfolio data, cross-referenced with risk assessments, and generated insights based on current trends.',
      };
      setMessages((prev) =>
        prev.map((m) => (m.id === streamingMessage.id ? response : m))
      );
      setIsLoading(false);
    }, 1500);

    onSendMessage?.(input.trim(), selectedAgent.id);
  };

  const handlePromptSelect = (prompt: SuggestedPrompt) => {
    setInput(prompt.text);
    if (prompt.agentId) {
      const agent = AGENTS.find((a) => a.id === prompt.agentId);
      if (agent) setSelectedAgent(agent);
    }
  };

  const getAgent = (agentId?: string) =>
    AGENTS.find((a) => a.id === agentId);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Sparkles className="h-10 w-10 text-violet-500 mb-4" />
            <Text className="font-semibold mb-1">PPM AI Assistant</Text>
            <Text className="text-sm text-tremor-content-subtle mb-4">
              Ask questions about your portfolio, get insights from agents, or
              execute commands.
            </Text>
            <SuggestedPromptsSection
              prompts={SUGGESTED_PROMPTS}
              onSelect={handlePromptSelect}
            />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                agent={getAgent(message.agentId)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-tremor-border p-3 space-y-2">
        {/* Agent Selector */}
        <Flex justifyContent="between" alignItems="center">
          <AgentSelector
            selectedAgent={selectedAgent}
            onSelect={setSelectedAgent}
          />
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setMessages([])}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </Flex>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${selectedAgent.name}...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Keyboard hint */}
        <Text className="text-xs text-tremor-content-subtle text-center">
          Press Enter to send
        </Text>
      </div>
    </div>
  );
}

// ============================================================================
// Simulated Response (replace with actual API)
// ============================================================================

function getSimulatedResponse(input: string, agent: Agent): string {
  const responses: Record<string, string[]> = {
    orchestrator: [
      "I've analyzed your portfolio and here's what I found:\n\n- 3 projects are currently at risk\n- Budget utilization is at 78%\n- 5 pending approvals require attention\n\nWould you like me to dive deeper into any of these areas?",
      "Based on my analysis of all agents' inputs, here's the executive summary:\n\nOverall portfolio health is good with 85% of projects on track. The main concerns are in the infrastructure domain where we're seeing schedule pressure.",
    ],
    finops: [
      "Q1 Budget Status:\n\n- Total Budget: $12.4M\n- Spent: $9.7M (78%)\n- Forecast: $11.8M by quarter end\n\nWe're tracking slightly under budget. The main variance is in contractor costs which came in 15% lower than expected.",
      "I've identified 3 cost optimization opportunities:\n\n1. Cloud infrastructure consolidation (-$45K/mo)\n2. License rationalization (-$22K/mo)\n3. Contractor rate renegotiation (-$35K/mo)",
    ],
    risk: [
      "Current Risk Summary:\n\n- High Risk: 2 projects (Alpha, Delta)\n- Medium Risk: 4 projects\n- Low Risk: 41 projects\n\nProject Alpha's main risk is resource availability. I recommend escalating to the resource committee.",
      "I've detected a new schedule risk:\n\nProject Beta's critical path has slipped by 5 days. This may impact the Q2 release date. Mitigation options are being analyzed.",
    ],
    portfolio: [
      "Portfolio Status:\n\n- 47 active projects\n- 12 in initiation\n- 8 in closing\n\nVelocity trend is positive with a 12% improvement over last quarter.",
      "Dependency Analysis:\n\nI found 3 cross-project dependencies that need attention:\n\n1. Platform API (blocks 4 projects)\n2. Data migration (blocks 2 projects)\n3. Security review (blocks 3 projects)",
    ],
    governance: [
      "Pending Approvals:\n\n- 5 change requests (2 urgent)\n- 3 budget amendments\n- 8 resource requests\n\nThe urgent items are past SLA. Would you like me to send reminder notifications?",
      "Compliance Status:\n\nAll projects are compliant with current policies. The next audit is scheduled for March 15th. I've prepared the required documentation.",
    ],
  };

  const agentResponses = responses[agent.id] || responses.orchestrator;
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

export default PPMChat;
