import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { safeProjects } from "@/lib/safeProjectData";
import { useLocation } from "wouter";
import { usePageContext, getSuggestedQuestions } from "@/contexts/PageContext";
import { parseActionIntent, buildScenario, dispatchAgentCascade, type ActionScenario } from "@/lib/agentCascade";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionScenario?: ActionScenario;
  isActionConfirmation?: boolean;
}

function MarkdownRenderer({ content, onNavigate }: { content: string; onNavigate: (path: string) => void }) {
  const lines = content.split('\n');
  
  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyCounter = 0;
    
    while (remaining.length > 0) {
      // Check for project links first: [Project Name](proj-id)
      const linkMatch = remaining.match(/\[([^\]]+)\]\((proj-[a-z0-9-]+)\)/);
      if (linkMatch && linkMatch.index !== undefined) {
        if (linkMatch.index > 0) {
          // Process any bold text in the prefix
          const prefix = remaining.slice(0, linkMatch.index);
          parts.push(...renderTextWithBold(prefix, keyCounter));
          keyCounter += 10;
        }
        const projectName = linkMatch[1];
        const projectId = linkMatch[2];
        parts.push(
          <button
            key={`link${keyCounter++}`}
            onClick={() => onNavigate(`/project/${projectId}`)}
            className="text-purple-600 hover:text-purple-800 underline font-medium cursor-pointer bg-purple-50 hover:bg-purple-100 px-1 py-0.5 rounded transition-colors"
          >
            {projectName}
          </button>
        );
        remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
        continue;
      }
      
      // Check for bold text: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={`t${keyCounter++}`}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={`b${keyCounter++}`} className="font-bold text-gray-900">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }
      
      parts.push(<span key={`r${keyCounter++}`}>{remaining}</span>);
      break;
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
  };
  
  const renderTextWithBold = (text: string, startKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyCounter = startKey;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={`pre${keyCounter++}`}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={`bold${keyCounter++}`} className="font-bold text-gray-900">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }
      parts.push(<span key={`txt${keyCounter++}`}>{remaining}</span>);
      break;
    }
    return parts;
  };
  
  const renderLine = (line: string, index: number): React.ReactNode => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('### ')) {
      return <h4 key={index} className="font-bold text-purple-700 mt-3 mb-1 text-base">{renderInline(trimmed.slice(4))}</h4>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={index} className="font-bold text-purple-800 mt-4 mb-2 text-base">{renderInline(trimmed.slice(3))}</h3>;
    }
    if (trimmed.startsWith('# ')) {
      return <h2 key={index} className="font-bold text-purple-900 text-lg mt-3 mb-2 border-b border-purple-200 pb-1">{renderInline(trimmed.slice(2))}</h2>;
    }
    
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.slice(2);
      const leadingSpaces = line.length - line.trimStart().length;
      const indentLevel = Math.floor(leadingSpaces / 2);
      return (
        <div key={index} className="flex gap-2 my-1" style={{ marginLeft: indentLevel * 16 }}>
          <span className="text-purple-500 flex-shrink-0">•</span>
          <span className="flex-1">{renderInline(bulletContent)}</span>
        </div>
      );
    }
    
    if (trimmed === '') {
      return <div key={index} className="h-2" />;
    }
    
    return <p key={index} className="my-1">{renderInline(trimmed)}</p>;
  };
  
  return (
    <div className="text-sm leading-relaxed">
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
}

export function AskPMChat() {
  const [, setLocation] = useLocation();
  const { context } = usePageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionScenario | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const suggestedQuestions = getSuggestedQuestions(context);
  
  const handleNavigate = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    
    const confirmMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: 'Yes, confirm',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmMessage]);
    
    const executingMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `Executing: ${pendingAction.trigger}...\n\nWatch the notifications as agents coordinate the changes.`,
      timestamp: new Date(),
      isActionConfirmation: true
    };
    setMessages(prev => [...prev, executingMessage]);
    
    await dispatchAgentCascade(pendingAction);
    
    const completedMessage: Message = {
      id: `assistant-complete-${Date.now()}`,
      role: 'assistant',
      content: `All agent actions completed successfully. The changes have been applied and all stakeholders have been notified.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, completedMessage]);
    
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    if (!pendingAction) return;
    
    const cancelMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: 'Cancel',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
    
    const cancelledMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: 'Action cancelled. No changes were made.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelledMessage]);
    
    setPendingAction(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const actionIntent = parseActionIntent(messageText, { entityName: context.entityName, entityId: context.entityId });
    
    if (actionIntent) {
      const scenario = buildScenario(actionIntent.scenarioType, actionIntent.params);
      if (scenario) {
        const confirmMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `**Action Detected:** ${scenario.trigger}\n\n${scenario.confirmMessage}\n\n**This will trigger the following agent actions:**\n${scenario.actions.map(a => `• ${a.icon} ${a.agentName}: ${a.action}`).join('\n')}\n\nWould you like me to proceed?`,
          timestamp: new Date(),
          actionScenario: scenario
        };
        setMessages(prev => [...prev, confirmMessage]);
        setPendingAction(scenario);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/ai/ask-pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: messageText,
          pageContext: {
            pageType: context.pageType,
            entityId: context.entityId,
            entityName: context.entityName,
            businessUnit: context.businessUnit
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => setIsOpen(true)}
        data-testid="button-open-ask-pm"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          AI
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`fixed z-50 ${
        isExpanded 
          ? 'inset-4' 
          : 'bottom-20 right-4 w-[420px] h-[600px]'
      } transition-all duration-300`}
    >
      <Card className="h-full flex flex-col shadow-2xl border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              Ask the PM
              <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                AI Powered
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsExpanded(!isExpanded)}
                data-testid="button-toggle-expand"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-ask-pm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800 mb-2">Welcome to Ask the PM</h3>
                  <p className="text-sm text-gray-600">
                    I have access to all {safeProjects.length} projects in your portfolio. 
                    Ask me about dependencies, status, risks, or anything else!
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Suggested Questions</p>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left p-3 text-sm bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                      onClick={() => handleSend(q)}
                      data-testid={`suggested-question-${idx}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                    }`}>
                      {message.role === 'user' 
                        ? <User className="h-4 w-4 text-white" />
                        : <Bot className="h-4 w-4 text-white" />
                      }
                    </div>
                    <div className={`flex-1 p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.actionScenario 
                          ? 'bg-amber-50 border-2 border-amber-300 text-gray-800 shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                    }`}>
                      {message.role === 'assistant' ? (
                        <MarkdownRenderer content={message.content} onNavigate={handleNavigate} />
                      ) : (
                        <div className="text-sm">{message.content}</div>
                      )}
                      {message.actionScenario && pendingAction && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-amber-200">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleConfirmAction}
                            data-testid="button-confirm-action"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Yes, Proceed
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={handleCancelAction}
                            data-testid="button-cancel-action"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing portfolio data...
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about projects, dependencies, risks..."
                className="flex-1"
                disabled={isLoading}
                data-testid="input-ask-pm"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-send-ask-pm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
