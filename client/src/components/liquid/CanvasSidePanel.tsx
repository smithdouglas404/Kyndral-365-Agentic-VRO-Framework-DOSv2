import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Text,
  Flex,
  Badge,
  type Color,
} from '@tremor/react';
import {
  Brain,
  Database,
  Clock,
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  Activity,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MemoryCoreRenderer, MemoryFactsRenderer, MemoryTimelineRenderer, MemoryStatsRenderer } from './MemoryBlockRenderers';
import type {
  MemoryCoreBlock,
  MemoryFactsBlock,
  MemoryTimelineBlock,
  MemoryStatsBlock,
} from '@shared/agentUIPacket';

// ============================================================================
// Types
// ============================================================================

type PanelTab = 'chat' | 'memory' | 'facts' | 'timeline' | 'stats';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CanvasSidePanelProps {
  /** Which agent this panel is for (null = executive/cross-agent) */
  agentId?: string;
  agentName?: string;
  agentColor?: Color;

  /** Memory data from API */
  coreMemory?: MemoryCoreBlock;
  factsData?: MemoryFactsBlock;
  timelineData?: MemoryTimelineBlock;
  statsData?: MemoryStatsBlock;

  /** Canvas context for AI chat */
  canvasContext?: string;

  /** Collapsed state */
  defaultCollapsed?: boolean;

  className?: string;
}

// ============================================================================
// Canvas Side Panel — Memory + Generative AI Chat
// ============================================================================

export function CanvasSidePanel({
  agentId,
  agentName = 'AI Assistant',
  agentColor = 'violet',
  coreMemory,
  factsData,
  timelineData,
  statsData,
  canvasContext,
  defaultCollapsed = false,
  className,
}: CanvasSidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Chat handler (calls OpenRouter via copilot endpoint) ----
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      // Build context-aware prompt
      const systemContext = [
        agentId ? `You are the ${agentName}, a specialized AI agent.` : 'You are an executive AI assistant.',
        canvasContext ? `Current canvas context: ${canvasContext}` : '',
        'Provide concise, actionable insights. Format with markdown when helpful.',
        'Focus on recommendations that improve productivity and project outcomes.',
      ].filter(Boolean).join(' ');

      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          systemPrompt: systemContext,
          agentId: agentId || 'executive',
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.message || 'No response received.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, agentId, agentName, canvasContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---- Tab config ----
  const tabs: { id: PanelTab; label: string; icon: typeof Brain; available: boolean }[] = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare, available: true },
    { id: 'memory', label: 'Core Memory', icon: Brain, available: !!coreMemory },
    { id: 'facts', label: 'Shared Facts', icon: Database, available: !!factsData },
    { id: 'timeline', label: 'Timeline', icon: Clock, available: !!timelineData },
    { id: 'stats', label: 'Stats', icon: Activity, available: !!statsData },
  ];

  if (isCollapsed) {
    return (
      <div className={cn('w-10 shrink-0 border-l border-tremor-border bg-tremor-background-subtle flex flex-col items-center py-4 gap-3', className)}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 rounded hover:bg-tremor-background transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {tabs.filter(t => t.available).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsCollapsed(false); }}
              className={cn(
                'p-1.5 rounded transition-colors',
                activeTab === tab.id ? `bg-${agentColor}-100 text-${agentColor}-600` : 'hover:bg-tremor-background'
              )}
              title={tab.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn(
      'w-80 shrink-0 border-l border-tremor-border bg-tremor-background flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-tremor-border bg-tremor-background-subtle">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" className="gap-2">
            <Sparkles className={cn('h-4 w-4', `text-${agentColor}-500`)} />
            <Text className="font-semibold text-sm">{agentName}</Text>
          </Flex>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded hover:bg-tremor-background transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </Flex>

        {/* Tabs */}
        <div className="flex gap-0.5 mt-2 -mb-0.5">
          {tabs.filter(t => t.available).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1.5 rounded-t text-xs transition-colors',
                  isActive
                    ? `bg-tremor-background text-${agentColor}-700 border border-tremor-border border-b-transparent font-medium`
                    : 'text-tremor-content-subtle hover:text-tremor-content'
                )}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* AI Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className={cn('h-8 w-8 mx-auto mb-3', `text-${agentColor}-300`)} />
                  <Text className="text-sm font-medium mb-1">
                    {agentId ? `Ask the ${agentName}` : 'Ask about this dashboard'}
                  </Text>
                  <Text className="text-xs text-tremor-content-subtle">
                    Get AI insights, recommendations, and analysis powered by OpenRouter
                  </Text>
                  {/* Quick prompts */}
                  <div className="mt-4 space-y-1.5">
                    {getQuickPrompts(agentId).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                        className="w-full text-left text-xs px-3 py-2 rounded border border-tremor-border hover:bg-tremor-background-subtle transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}>
                  <div className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2',
                    msg.role === 'user'
                      ? `bg-${agentColor}-100 dark:bg-${agentColor}-900/30`
                      : 'bg-tremor-background-subtle border border-tremor-border'
                  )}>
                    {msg.role === 'assistant' && (
                      <Flex alignItems="center" className="gap-1 mb-1">
                        <Sparkles className={cn('h-3 w-3', `text-${agentColor}-500`)} />
                        <Text className="text-xs font-medium">{agentName}</Text>
                      </Flex>
                    )}
                    <Text className="text-sm whitespace-pre-wrap">{msg.content}</Text>
                  </div>
                </div>
              ))}

              {isStreaming && (
                <Flex alignItems="center" className="gap-2 px-3">
                  <Loader2 className={cn('h-4 w-4 animate-spin', `text-${agentColor}-500`)} />
                  <Text className="text-xs text-tremor-content-subtle">Thinking...</Text>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-tremor-border">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${agentName}...`}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-tremor-border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-tremor-brand bg-tremor-background"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 bottom-1.5 h-7 w-7"
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                >
                  <Send className={cn('h-4 w-4', input.trim() ? `text-${agentColor}-600` : 'text-tremor-content-subtle')} />
                </Button>
              </div>
              <Text className="text-xs text-tremor-content-subtle mt-1 text-center">
                Powered by OpenRouter
              </Text>
            </div>
          </div>
        )}

        {/* Memory tabs */}
        {activeTab === 'memory' && coreMemory && (
          <div className="p-3">
            <MemoryCoreRenderer block={coreMemory} />
          </div>
        )}

        {activeTab === 'facts' && factsData && (
          <div className="p-3">
            <MemoryFactsRenderer block={factsData} />
          </div>
        )}

        {activeTab === 'timeline' && timelineData && (
          <div className="p-3">
            <MemoryTimelineRenderer block={timelineData} />
          </div>
        )}

        {activeTab === 'stats' && statsData && (
          <div className="p-3">
            <MemoryStatsRenderer block={statsData} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Quick prompts per agent type
// ============================================================================

function getQuickPrompts(agentId?: string): string[] {
  const prompts: Record<string, string[]> = {
    'pmo-agent': [
      'What projects are most at risk right now?',
      'Show me cross-project dependencies that concern you',
      'What should I escalate to the steering committee?',
    ],
    'finops-agent': [
      'Where are our biggest cost overruns?',
      'What savings can we realize this quarter?',
      'Which projects have the worst ROI trajectory?',
    ],
    'risk-agent': [
      'What are our top 3 risks right now?',
      'Which risks have worsened since last review?',
      'What mitigations should I prioritize?',
    ],
    'ocm-agent': [
      'Which teams have the lowest change readiness?',
      'What adoption blockers should I address?',
      'How is stakeholder sentiment trending?',
    ],
    'tmo-agent': [
      'What cutovers are coming up in the next 30 days?',
      'Which transitions have open blockers?',
      'Are we ready for the next go-live?',
    ],
    'vro-agent': [
      'Are we on track to realize our target value?',
      'Which value streams are underperforming?',
      'What OKRs need attention?',
    ],
    'governance-agent': [
      'Which gate reviews are pending?',
      'Are there any compliance violations?',
      'What audit findings are unresolved?',
    ],
    'planning-agent': [
      'What does our capacity look like next quarter?',
      'Which initiatives should we prioritize?',
      'Show me roadmap conflicts',
    ],
  };

  return prompts[agentId || ''] || [
    'What are the top issues across the portfolio?',
    'Give me an executive summary of current state',
    'What should I focus on this week?',
  ];
}

export default CanvasSidePanel;
