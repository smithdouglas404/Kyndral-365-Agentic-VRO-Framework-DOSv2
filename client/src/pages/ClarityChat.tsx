import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, Wrench, Trash2, MessageSquare, Bot } from 'lucide-react';
import AgenticChat from '@/ai-sdk/AgenticChat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ name: string; input: any; result: any }>;
}

const SUGGESTED_PROMPTS = [
  { label: 'Cross-project blockers', text: 'Which projects have blocked dependencies on other projects right now? Show me the dependency chain.' },
  { label: 'Dependency hotspots', text: 'Which projects are dependency hotspots — meaning lots of other projects are waiting on them?' },
  { label: 'Aging dependencies', text: 'List all open dependencies that have been outstanding for more than 60 days.' },
  { label: 'Portfolio health', text: 'Give me a portfolio-level overview: what is at risk right now, ranked by severity?' },
  { label: 'Unmitigated risks', text: 'Which critical or high-severity risks have no mitigation plan?' },
  { label: 'Strategic alignment', text: 'Which active projects are not linked to any strategic objective (OKR)?' },
  { label: 'Project deep-dive', text: 'Tell me everything about the Customer Portal 2.0 project — risks, dependencies, KPIs, and budget.' },
  { label: 'Budget + schedule pressure', text: 'Which projects are simultaneously over budget AND behind schedule?' },
];

export default function ClarityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'clarity' | 'agentic'>('clarity');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-send question from ?q= query param (e.g. clicked from Question Bank tile)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q && messages.length === 0) {
      send(q);
      // Clean URL so refresh doesn't re-send
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/clarity-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([...next, { role: 'assistant', content: `Error: ${data.error || res.statusText}` }]);
      } else {
        setMessages([...next, { role: 'assistant', content: data.reply, toolCalls: data.toolCalls }]);
      }
    } catch (e: any) {
      setMessages([...next, { role: 'assistant', content: `Network error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    setInput('');
  }

  return (
    <div className="flex flex-col h-screen bg-background" data-testid="page-clarity-chat">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-chat-title">Clarity Assistant</h1>
            <p className="text-xs text-muted-foreground">Ask anything about your portfolio — projects, dependencies, risks, KPIs.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border bg-muted/30 p-0.5" data-testid="toggle-chat-mode">
            <Button
              variant={mode === 'clarity' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('clarity')}
              data-testid="button-mode-clarity"
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Clarity
            </Button>
            <Button
              variant={mode === 'agentic' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('agentic')}
              data-testid="button-mode-agentic"
            >
              <Bot className="h-4 w-4 mr-2" /> Agentic
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={clear} disabled={mode !== 'clarity' || messages.length === 0} data-testid="button-clear-chat">
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </header>

      {mode === 'agentic' ? (
        /* Agentic chat — Vercel AI SDK generative UI over the agent runtime */
        <div className="flex-1 overflow-hidden" data-testid="panel-agentic-chat">
          <AgenticChat />
        </div>
      ) : (
      /* Body */
      <div className="flex-1 overflow-hidden grid grid-cols-[280px_1fr]">
        {/* Suggested prompts sidebar */}
        <aside className="border-r bg-muted/30 overflow-auto p-4">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Suggested Questions</h2>
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => send(p.text)}
                disabled={loading}
                data-testid={`button-prompt-${i}`}
                className="w-full text-left p-3 rounded-md border bg-card hover:bg-accent hover:border-primary transition text-sm disabled:opacity-50"
              >
                <div className="font-medium text-sm mb-1">{p.label}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{p.text}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat thread */}
        <main className="flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef as any}>
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-center py-20" data-testid="text-empty-state">
                <div className="max-w-md">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Pick a suggested question on the left, or type your own. The assistant grounds every answer
                    in live Palantir Foundry data — projects, cross-project dependencies, risks, and KPIs.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((m, i) => (
                <div key={i} data-testid={`message-${m.role}-${i}`}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer text-muted-foreground flex items-center gap-1.5 hover:text-foreground">
                          <Wrench className="h-3 w-3" /> {m.toolCalls.length} data lookup{m.toolCalls.length === 1 ? '' : 's'}
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {m.toolCalls.map((tc, j) => (
                            <div key={j} className="bg-muted/50 rounded px-2 py-1.5 font-mono text-[11px]"
                                 data-testid={`tool-call-${i}-${j}`}>
                              <Badge variant="outline" className="mr-2 text-[10px]">{tc.name}</Badge>
                              <span className="text-muted-foreground">
                                {Object.entries(tc.input).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}
                              </span>
                              <span className="ml-2 text-emerald-600">
                                → {tc.result?.count !== undefined ? `${tc.result.count} results` : 'ok'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start" data-testid="text-loading-reply">
                  <div className="bg-card border rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Looking up portfolio data...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input bar */}
          <div className="border-t bg-card p-4">
            <div className="max-w-4xl mx-auto flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about projects, dependencies, risks, KPIs..."
                rows={2}
                className="resize-none"
                disabled={loading}
                data-testid="input-chat-message"
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="lg" data-testid="button-send-message">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Press Enter to send · Shift+Enter for newline · Answers grounded in Palantir Foundry data
            </p>
          </div>
        </main>
      </div>
      )}
    </div>
  );
}
