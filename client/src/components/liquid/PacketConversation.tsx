import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Text,
  Flex,
  Badge,
  type Color,
} from '@tremor/react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  BarChart3,
  Table2,
  PieChart,
  TrendingUp,
  LayoutGrid,
  X,
  RotateCcw,
  History,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UIBlockRenderer } from './UIBlockRenderer';
import { useLiquidCanvas } from '@/contexts/LiquidCanvasContext';
import type { AgentUIPacket, UIBlock } from '@shared/agentUIPacket';

// ============================================================================
// Quick reshaping actions — common things users ask
// ============================================================================

interface QuickAction {
  label: string;
  icon: typeof BarChart3;
  prompt: string;
}

function getQuickActions(packet: AgentUIPacket): QuickAction[] {
  const actions: QuickAction[] = [];

  // If packet has charts, offer alternative visualizations
  const hasBarChart = packet.blocks.some(b => b.type === 'bar-chart');
  const hasAreaChart = packet.blocks.some(b => b.type === 'area-chart');
  const hasDonut = packet.blocks.some(b => b.type === 'donut-chart');
  const hasTable = packet.blocks.some(b => b.type === 'table');
  const hasKPI = packet.blocks.some(b => b.type === 'kpi' || b.type === 'kpi-row');

  if (hasBarChart || hasAreaChart || hasDonut) {
    actions.push({
      label: 'Show as table',
      icon: Table2,
      prompt: 'Reshape this data as a table instead of a chart. Show all the underlying numbers.',
    });
  }

  if (hasTable) {
    actions.push({
      label: 'Show as chart',
      icon: BarChart3,
      prompt: 'Visualize this table data as a chart. Pick the best chart type for this data.',
    });
  }

  if (hasBarChart && !hasDonut) {
    actions.push({
      label: 'Show proportions',
      icon: PieChart,
      prompt: 'Show this data as a donut/pie chart to emphasize proportions.',
    });
  }

  if (!hasAreaChart && (hasBarChart || hasTable)) {
    actions.push({
      label: 'Show trend',
      icon: TrendingUp,
      prompt: 'Show this as a time series / area chart to emphasize the trend over time.',
    });
  }

  // Always offer drill-down and summary
  actions.push({
    label: 'Drill deeper',
    icon: LayoutGrid,
    prompt: 'Break this down further. Show me the next level of detail behind these numbers.',
  });

  return actions.slice(0, 4); // Max 4 quick actions
}

// ============================================================================
// Conversation Message
// ============================================================================

interface ConversationMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  /** If the agent responds with a revised packet */
  revisedPacket?: AgentUIPacket;
}

// ============================================================================
// PacketConversation — the collaborative dialogue around a packet
// ============================================================================

interface PacketConversationProps {
  packet: AgentUIPacket;
  onClose: () => void;
  onPacketRevised?: (revised: AgentUIPacket) => void;
  className?: string;
}

export function PacketConversation({
  packet,
  onClose,
  onPacketRevised,
  className,
}: PacketConversationProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState<AgentUIPacket[]>([packet]);
  const [activeRevision, setActiveRevision] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { pushPacket } = useLiquidCanvas();

  const currentPacket = revisionHistory[activeRevision];
  const quickActions = getQuickActions(currentPacket);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Send message to agent for refinement ----
  const handleSend = useCallback(async (promptOverride?: string) => {
    const text = promptOverride || input.trim();
    if (!text || isThinking) return;

    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptOverride) setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/copilot/refine-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packetId: currentPacket.id,
          agentId: currentPacket.agentId,
          userPrompt: text,
          // Send the original data so the agent can re-visualize
          sourceData: currentPacket.sourceData,
          currentBlocks: currentPacket.blocks,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Refinement request failed');

      const data = await response.json();

      // The agent returns a revised packet or a text response
      if (data.revisedPacket) {
        const revised: AgentUIPacket = {
          ...data.revisedPacket,
          conversationId: currentPacket.conversationId || currentPacket.id,
          parentPacketId: currentPacket.id,
          revision: (currentPacket.revision || 0) + 1,
          userPrompt: text,
          sourceData: currentPacket.sourceData, // preserve original data
        };

        setRevisionHistory(prev => [...prev, revised]);
        setActiveRevision(revisionHistory.length); // point to the new one

        // Push to canvas so it shows up
        pushPacket(revised);
        onPacketRevised?.(revised);

        const agentMsg: ConversationMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: data.explanation || "I've updated the visualization based on your request.",
          timestamp: new Date().toISOString(),
          revisedPacket: revised,
        };
        setMessages(prev => [...prev, agentMsg]);
      } else {
        // Text-only response (insight, explanation, no re-render needed)
        const agentMsg: ConversationMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: data.response || data.message || 'Let me look into that.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, agentMsg]);
      }
    } catch (err) {
      const errorMsg: ConversationMessage = {
        id: `error-${Date.now()}`,
        role: 'agent',
        content: 'Sorry, I had trouble processing that. Try rephrasing your request.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, currentPacket, messages, revisionHistory, pushPacket, onPacketRevised]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const agentColor = (currentPacket.agentColor || 'violet') as Color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      className={cn(
        'border rounded-xl shadow-xl bg-tremor-background overflow-hidden flex flex-col',
        'max-h-[80vh] w-full max-w-2xl',
        className
      )}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 border-b', `bg-${agentColor}-50 dark:bg-${agentColor}-900/20`)}>
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" className="gap-2">
            <Sparkles className={cn('h-4 w-4', `text-${agentColor}-600`)} />
            <Text className="font-semibold">{currentPacket.title}</Text>
            <Badge color={agentColor} size="xs">{currentPacket.agentName}</Badge>
          </Flex>
          <Flex alignItems="center" className="gap-2">
            {/* Revision history */}
            {revisionHistory.length > 1 && (
              <Flex alignItems="center" className="gap-1">
                <History className="h-3.5 w-3.5 text-tremor-content-subtle" />
                {revisionHistory.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveRevision(i)}
                    className={cn(
                      'h-5 w-5 rounded-full text-xs flex items-center justify-center transition-colors',
                      i === activeRevision
                        ? `bg-${agentColor}-500 text-white`
                        : 'bg-tremor-background-subtle hover:bg-tremor-border'
                    )}
                  >
                    {i}
                  </button>
                ))}
              </Flex>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </Flex>
        </Flex>
        {currentPacket.revision && currentPacket.revision > 0 && (
          <Text className="text-xs text-tremor-content-subtle mt-1">
            Revision {currentPacket.revision} — "{currentPacket.userPrompt}"
          </Text>
        )}
      </div>

      {/* Current visualization (live preview) */}
      <div className="px-4 py-3 border-b bg-tremor-background-subtle max-h-72 overflow-y-auto">
        <div className="space-y-3">
          {currentPacket.blocks.map((block, i) => (
            <UIBlockRenderer key={i} block={block} />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 border-b flex gap-1.5 overflow-x-auto">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => handleSend(action.prompt)}
              disabled={isThinking}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap',
                'hover:bg-tremor-background-subtle transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Icon className="h-3 w-3" />
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Conversation thread */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px]">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <Text className="text-sm text-tremor-content-subtle">
              Ask the agent to reshape this data, drill deeper, or explain the insights
            </Text>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id}>
            <div className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}>
              <div className={cn(
                'max-w-[85%] rounded-lg px-3 py-2',
                msg.role === 'user'
                  ? 'bg-tremor-background-subtle border'
                  : `bg-${agentColor}-50 dark:bg-${agentColor}-900/20 border border-${agentColor}-200 dark:border-${agentColor}-800`
              )}>
                {msg.role === 'agent' && (
                  <Flex alignItems="center" className="gap-1 mb-1">
                    <Sparkles className={cn('h-3 w-3', `text-${agentColor}-500`)} />
                    <Text className="text-xs font-medium">{currentPacket.agentName}</Text>
                  </Flex>
                )}
                <Text className="text-sm whitespace-pre-wrap">{msg.content}</Text>
              </div>
            </div>

            {/* If agent responded with a revised visualization, show preview */}
            {msg.revisedPacket && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 ml-8 p-3 rounded-lg border bg-tremor-background-subtle"
              >
                <Flex alignItems="center" className="gap-1.5 mb-2">
                  <RotateCcw className="h-3 w-3 text-emerald-500" />
                  <Text className="text-xs font-medium text-emerald-700">Revised Visualization</Text>
                  <Badge color="emerald" size="xs">v{msg.revisedPacket.revision}</Badge>
                </Flex>
                <div className="space-y-2">
                  {msg.revisedPacket.blocks.slice(0, 3).map((block, i) => (
                    <UIBlockRenderer key={i} block={block} />
                  ))}
                  {msg.revisedPacket.blocks.length > 3 && (
                    <Text className="text-xs text-tremor-content-subtle text-center">
                      +{msg.revisedPacket.blocks.length - 3} more blocks
                    </Text>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ))}

        {isThinking && (
          <Flex alignItems="center" className="gap-2">
            <Loader2 className={cn('h-4 w-4 animate-spin', `text-${agentColor}-500`)} />
            <Text className="text-xs text-tremor-content-subtle">
              {currentPacket.agentName} is rethinking the visualization...
            </Text>
          </Flex>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Show me this differently... break it down by... explain why..."
            rows={2}
            className="w-full resize-none rounded-lg border border-tremor-border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-tremor-brand bg-tremor-background"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1.5 bottom-1.5 h-7 w-7"
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
          >
            <Send className={cn('h-4 w-4', input.trim() ? `text-${agentColor}-600` : 'text-tremor-content-subtle')} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default PacketConversation;
