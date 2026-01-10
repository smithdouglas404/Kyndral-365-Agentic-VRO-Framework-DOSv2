import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, AlertTriangle, Lightbulb, MessageCircle, ChevronDown, ChevronUp, Loader2, Zap, X, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PageContext {
  pageName: string;
  pageType: 'dashboard' | 'division' | 'overview' | 'tool' | 'framework';
  entityId?: string;
  metrics?: Record<string, string | number>;
  alertCount?: number;
  riskCount?: number;
  projectCount?: number;
}

interface WizardInsights {
  greeting: string;
  situation: string;
  concerns: string[];
  recommendations: string[];
  questions: string[];
}

interface PageAgentWizardProps {
  context: PageContext;
  agentName?: string;
  onDrillDown?: (type: string, id: string) => void;
}

function generateLocalInsights(context: PageContext): WizardInsights {
  const concerns: string[] = [];
  const recommendations: string[] = [];
  const questions: string[] = [];

  if (context.alertCount && context.alertCount > 0) {
    concerns.push(`${context.alertCount} active alerts require your attention`);
    recommendations.push('Review and address high-priority alerts first');
  }

  if (context.riskCount && context.riskCount > 0) {
    concerns.push(`${context.riskCount} risks are being monitored`);
    recommendations.push('Ensure mitigation strategies are in place for high-risk items');
  }

  if (context.metrics) {
    Object.entries(context.metrics).forEach(([key, value]) => {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (key.toLowerCase().includes('risk') && numValue > 0) {
        concerns.push(`${numValue} at-risk items detected`);
      }
      if (key.toLowerCase().includes('confidence') && numValue < 70) {
        concerns.push(`Confidence at ${numValue}% is below threshold`);
        recommendations.push('Investigate factors affecting confidence levels');
      }
      if (key.toLowerCase().includes('overrun') || key.toLowerCase().includes('over budget')) {
        concerns.push('Budget overrun detected');
        recommendations.push('Review spending and consider cost optimization measures');
      }
    });
  }

  if (concerns.length === 0) {
    recommendations.push('Continue monitoring - all systems operating normally');
  }

  questions.push(`Would you like me to analyze any specific area in detail?`);
  questions.push(`Should I compare current performance with historical trends?`);

  const hasCriticalIssues = concerns.length > 2;
  const greeting = hasCriticalIssues
    ? `⚠️ I've identified ${concerns.length} areas that need your attention on this page.`
    : concerns.length > 0
    ? `I'm monitoring this page and have some observations to share.`
    : `✓ Everything looks healthy. Here's your current status overview.`;

  const situation = context.pageType === 'division'
    ? `You're viewing the ${context.pageName} division. I'm analyzing all KPIs, OKRs, projects, risks, and alerts across this business unit.`
    : context.pageType === 'dashboard'
    ? `This is your ${context.pageName}. I'm tracking real-time metrics, cross-agent activity, and potential issues.`
    : `You're on the ${context.pageName} page. I'm here to help you understand the data and take action.`;

  return { greeting, situation, concerns, recommendations, questions };
}

export function PageAgentWizard({ context, agentName = 'AI Agent', onDrillDown }: PageAgentWizardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<WizardInsights | null>(null);
  const [showQuestions, setShowQuestions] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [userInput, setUserInput] = useState('');

  // Escape key handler for chat flyout
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [chatOpen]);

  const handleQuestionClick = async (question: string) => {
    setChatQuestion(question);
    setChatOpen(true);
    setChatLoading(true);
    setChatResponse('');
    
    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.response);
      } else {
        setChatResponse(`I'd be happy to help you explore that. Based on the current ${context.pageName} data, I recommend reviewing the metrics displayed and drilling into any areas showing concerning trends. Would you like me to highlight specific areas?`);
      }
    } catch {
      setChatResponse(`I'd be happy to help you explore that. Based on the current ${context.pageName} data, I recommend reviewing the metrics displayed and drilling into any areas showing concerning trends.`);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    await handleQuestionClick(userInput);
    setUserInput('');
  };

  useEffect(() => {
    async function fetchInsights() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/copilot/page-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(context),
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.fallback) {
            setInsights(data);
          } else {
            setInsights(generateLocalInsights(context));
          }
        } else {
          setInsights(generateLocalInsights(context));
        }
      } catch {
        setInsights(generateLocalInsights(context));
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [context.pageName, context.entityId]);

  const currentInsights = insights || generateLocalInsights(context);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-purple-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-md">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Brain className="h-6 w-6 text-white" />
              )}
            </div>
            
            <div className="flex-1">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-purple-800">{agentName}</span>
                  {!isExpanded && !isLoading && (
                    <span className="text-purple-600 italic animate-pulse">Hello I have something to say!</span>
                  )}
                  {isExpanded && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                      <Sparkles size={12} className="mr-1" />
                      Page Summary
                    </Badge>
                  )}
                  {isLoading && (
                    <span className="text-sm text-purple-500 animate-pulse">Analyzing page...</span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                  data-testid="wizard-toggle"
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </Button>
              </div>

              {!isLoading && (
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-3 bg-white/60 rounded-lg border border-purple-100">
                        <p className="text-purple-900 font-medium">{currentInsights.greeting}</p>
                        <p className="text-gray-700 text-sm mt-1">{currentInsights.situation}</p>
                      </div>

                      {currentInsights.concerns.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                            <AlertTriangle size={16} />
                            <span>Areas of Concern ({currentInsights.concerns.length})</span>
                          </div>
                          <div className="grid gap-2">
                            {currentInsights.concerns.map((concern, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                                onClick={() => handleQuestionClick(`Tell me more about this concern: ${concern}`)}
                                data-testid={`concern-${i}`}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                                <span className="text-sm text-amber-800">{concern}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                          <Lightbulb size={16} />
                          <span>Recommendations</span>
                        </div>
                        <div className="grid gap-2">
                          {currentInsights.recommendations.map((rec, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 + 0.2 }}
                              className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                              onClick={() => handleQuestionClick(`How do I implement this recommendation: ${rec}`)}
                              data-testid={`recommendation-${i}`}
                            >
                              <Zap size={14} className="text-green-600 mt-0.5" />
                              <span className="text-sm text-green-800">{rec}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQuestions(!showQuestions)}
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                          data-testid="show-questions"
                        >
                          <MessageCircle size={14} className="mr-1" />
                          {showQuestions ? 'Hide Questions' : 'Ask Me'}
                        </Button>
                      </div>

                      <AnimatePresence>
                        {showQuestions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            {currentInsights.questions.map((question, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-left text-purple-700 border-purple-200 hover:bg-purple-50"
                                onClick={() => handleQuestionClick(question)}
                                data-testid={`question-${i}`}
                              >
                                <MessageCircle size={14} className="mr-2 flex-shrink-0" />
                                {question}
                              </Button>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <Input
                                placeholder="Ask me anything..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="flex-1 border-purple-200"
                                data-testid="wizard-input"
                              />
                              <Button size="sm" onClick={handleSendMessage} className="bg-purple-600 hover:bg-purple-700">
                                <Send size={14} />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setChatOpen(false)}
            />
            
            {/* Flyout Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
              data-testid="flyout-agent-chat"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{agentName}</h2>
                    <p className="text-xs text-muted-foreground">AI-powered insights</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800 font-medium">Your Question:</p>
                    <p className="text-sm text-gray-700 mt-1">{chatQuestion}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 min-h-[100px]">
                    {chatLoading ? (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{chatResponse}</p>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Footer Input */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a follow-up question..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                    data-testid="chat-input"
                  />
                  <Button onClick={handleSendMessage} className="bg-purple-600 hover:bg-purple-700">
                    <Send size={14} className="mr-1" />
                    Ask
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
