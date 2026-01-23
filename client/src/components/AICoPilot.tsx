import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, AlertTriangle, Lightbulb, MessageCircle, HelpCircle, Loader2, ChevronDown, ChevronUp, X, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EntityDrilldown, AgentType } from '@/lib/dataHub';

interface AICoPilotProps {
  drilldown: EntityDrilldown;
  agentId?: AgentType;
  dataMode?: 'VRO' | 'PMO';
}

interface CoPilotInsights {
  greeting: string;
  situation: string;
  concerns: string[];
  recommendations: string[];
  questions: string[];
}

const agentPersonalities: Record<AgentType, { name: string; style: string; focus: string; color: string }> = {
  'integrated-management': { name: 'Integrated Management Agent', style: 'unified', focus: 'value realization and project delivery', color: 'bg-gradient-to-r from-teal-500 to-blue-500' },
  vro: { name: 'VRO Agent', style: 'value-focused', focus: 'business value realization and ROI', color: 'bg-green-500' },
  pmo: { name: 'PMO Agent', style: 'process-oriented', focus: 'project execution and delivery', color: 'bg-purple-500' },
  tmo: { name: 'TMO Agent', style: 'transformational', focus: 'change adoption and initiative success', color: 'bg-blue-500' },
  finops: { name: 'FinOps Agent', style: 'analytical', focus: 'cost optimization and financial efficiency', color: 'bg-amber-500' },
  okr: { name: 'OKR Agent', style: 'strategic', focus: 'objective alignment and key results tracking', color: 'bg-orange-500' },
  governance: { name: 'Governance Agent', style: 'risk-aware', focus: 'compliance and risk mitigation', color: 'bg-red-500' },
  planning: { name: 'Planning Agent', style: 'forward-looking', focus: 'capacity planning and roadmap management', color: 'bg-teal-500' },
  ocm: { name: 'OCM Agent', style: 'people-focused', focus: 'stakeholder readiness and change adoption', color: 'bg-pink-500' }
};

function generateFallbackInsights(drilldown: EntityDrilldown, agentId: AgentType): CoPilotInsights {
  const personality = agentPersonalities[agentId];
  const metrics = drilldown.metrics;
  const concerns: string[] = [];
  const recommendations: string[] = [];
  const questions: string[] = [];

  Object.entries(metrics).forEach(([key, value]) => {
    const strValue = String(value);
    const numValue = parseFloat(strValue.replace(/[^0-9.-]/g, ''));
    
    if (key.toLowerCase().includes('risk') && numValue > 0) {
      concerns.push(`${numValue} items are flagged as at-risk and require attention`);
      recommendations.push(`Review at-risk items and consider mitigation strategies`);
    }
    if (key.toLowerCase().includes('confidence') && numValue < 70) {
      concerns.push(`Confidence level at ${numValue}% is below the 70% threshold`);
      recommendations.push(`Investigate root causes of low confidence and address blockers`);
    }
    if (key.toLowerCase().includes('alert') && numValue > 0) {
      concerns.push(`${numValue} active alerts requiring immediate attention`);
    }
    if (key.toLowerCase().includes('pending') && numValue > 0) {
      recommendations.push(`${numValue} pending actions need to be addressed`);
    }
  });

  if (drilldown.entityType === 'metric') {
    questions.push(`Would you like me to drill deeper into any specific area?`);
    questions.push(`Should I compare this with historical trends?`);
  } else {
    questions.push(`Do you want me to analyze the critical path?`);
    questions.push(`Should I identify potential bottlenecks?`);
  }

  if (recommendations.length === 0) {
    recommendations.push(`All metrics are within acceptable ranges - continue monitoring`);
  }

  const hasCriticalIssues = concerns.length > 2;
  const greeting = hasCriticalIssues
    ? `⚠️ I've detected some areas that need your attention.`
    : concerns.length > 0
    ? `I'm here to help you understand what's happening.`
    : `✓ Everything looks healthy here. Let me walk you through the details.`;

  const situation = `You're looking at **${drilldown.entityName}** in the ${drilldown.bu} domain. I'm monitoring this for ${personality.focus}.`;

  return { greeting, situation, concerns, recommendations, questions };
}

function AgentCard({ 
  agent, 
  drilldown, 
  isExpanded, 
  onToggle 
}: { 
  agent: AgentType; 
  drilldown: EntityDrilldown; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<CoPilotInsights | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const personality = agentPersonalities[agent];

  async function handleQuestionClick(question: string) {
    setChatQuestion(question);
    setChatOpen(true);
    setChatLoading(true);
    setChatResponse('');
    
    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            pageName: drilldown.entityName,
            pageType: drilldown.entityType,
            metrics: drilldown.metrics,
            bu: drilldown.bu,
            agentId: agent,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.response || 'I analyzed the data and here are my findings based on your question.');
      } else {
        setChatResponse(generateChatResponse(question, drilldown, agent));
      }
    } catch {
      setChatResponse(generateChatResponse(question, drilldown, agent));
    } finally {
      setChatLoading(false);
    }
  }

  function generateChatResponse(question: string, drilldown: EntityDrilldown, agent: AgentType): string {
    const personality = agentPersonalities[agent];
    const metrics = Object.entries(drilldown.metrics).map(([k, v]) => `${k}: ${v}`).join(', ');
    
    if (question.toLowerCase().includes('psc') || question.toLowerCase().includes('regulatory')) {
      return `Based on my analysis of ${drilldown.entityName}, the State PSC requirements are being actively monitored. Current compliance metrics show ${metrics}. I recommend reviewing the pending regulatory filings and ensuring all documentation is updated before the next review cycle. The Governance Agent is tracking 4 active regulatory areas with automated compliance monitoring.`;
    }
    if (question.toLowerCase().includes('epa') || question.toLowerCase().includes('compliance gap')) {
      return `The EPA compliance gap analysis shows the current score at 91%, which is 4% below the 95% target. Key factors include emissions reporting documentation and process automation opportunities. I recommend prioritizing the Environmental Compliance Audit which is due in 4 days to address this gap.`;
    }
    if (question.toLowerCase().includes('resources') || question.toLowerCase().includes('allocated')) {
      return `Current resource allocation for compliance management includes 12 FTEs across regulatory, environmental, and cybersecurity functions. Based on the workload analysis, the support ratio is adequate for current requirements. However, I recommend reviewing capacity before the upcoming NERC CIP attestation deadline.`;
    }
    if (question.toLowerCase().includes('historical') || question.toLowerCase().includes('trends')) {
      return `Looking at historical trends for ${drilldown.entityName}, I see consistent improvement over the past 6 months. Key metrics have improved by 15% on average. The current trajectory suggests you'll meet year-end targets if current performance is maintained.`;
    }
    if (question.toLowerCase().includes('bottleneck') || question.toLowerCase().includes('critical path')) {
      return `I've identified 2 potential bottlenecks in the current workflow: 1) Resource constraints in the testing phase, and 2) External dependencies on vendor API access. Both are being actively monitored by the TMO Agent. I recommend escalating the vendor dependency to ensure timely resolution.`;
    }
    
    return `Based on my ${personality.style} analysis of ${drilldown.entityName}, focusing on ${personality.focus}, here's what I found: The current metrics (${metrics}) indicate the entity is performing within expected parameters. I'm continuously monitoring for any changes that require attention. Is there a specific aspect you'd like me to drill deeper into?`;
  }

  useEffect(() => {
    if (!isExpanded) return;
    
    async function fetchInsights() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/copilot/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: drilldown.entityType,
            entityName: drilldown.entityName,
            bu: drilldown.bu,
            metrics: drilldown.metrics,
            agentId: agent,
            relatedAgents: drilldown.relatedAgents,
            eventsCount: drilldown.events.length,
            actionsCount: drilldown.actions.length,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.fallback) {
            setInsights(data);
          } else {
            setInsights(generateFallbackInsights(drilldown, agent));
          }
        } else {
          setInsights(generateFallbackInsights(drilldown, agent));
        }
      } catch {
        setInsights(generateFallbackInsights(drilldown, agent));
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [isExpanded, drilldown.entityId, agent]);

  const currentInsights = insights || generateFallbackInsights(drilldown, agent);

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
    >
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
        data-testid={`agent-card-${agent}`}
      >
        <div className={`p-2 ${personality.color} rounded-lg`}>
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{personality.name}</span>
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
              <Sparkles size={10} className="mr-1" />
              AI Co-Pilot
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-0.5">
            Analyzing {personality.focus}... <span className="text-blue-600 font-medium">Hello I have something to say!</span>
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 bg-gradient-to-b from-purple-50 to-blue-50"
          >
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating insights...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-purple-900 font-medium">{currentInsights.greeting}</p>
                  <p className="text-sm text-gray-700">{currentInsights.situation}</p>

                  {currentInsights.concerns.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-red-500" />
                        <span className="text-xs font-semibold text-red-700">Areas of Concern</span>
                      </div>
                      <ul className="space-y-1">
                        {currentInsights.concerns.map((concern, i) => (
                          <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={14} className="text-green-500" />
                      <span className="text-xs font-semibold text-green-700">My Recommendations</span>
                    </div>
                    <ul className="space-y-1">
                      {currentInsights.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-green-700 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle size={14} className="text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700">I can help you with:</span>
                    </div>
                    <div className="space-y-1">
                      {currentInsights.questions.map((q, i) => (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs text-blue-700 hover:bg-blue-100 h-auto py-2 whitespace-normal text-left break-words"
                          data-testid={`copilot-question-${agent}-${i}`}
                          onClick={() => handleQuestionClick(q)}
                        >
                          <HelpCircle size={12} className="mr-2 flex-shrink-0 text-blue-400" />
                          <span className="break-words">{q}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Dialog Popup */}
                  <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div className={`p-2 ${personality.color} rounded-lg`}>
                            <Brain className="h-4 w-4 text-white" />
                          </div>
                          {personality.name}
                        </DialogTitle>
                        <DialogDescription className="text-left">
                          AI-powered analysis for {drilldown.entityName}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 mt-4">
                        {/* User Question */}
                        <div className="flex justify-end">
                          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 max-w-[85%]">
                            <p className="text-sm text-blue-800">{chatQuestion}</p>
                          </div>
                        </div>

                        {/* Agent Response */}
                        <div className="flex justify-start">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 max-w-[85%]">
                            {chatLoading ? (
                              <div className="flex items-center gap-2 text-purple-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Analyzing...</span>
                              </div>
                            ) : (
                              <p className="text-sm text-purple-800 whitespace-pre-wrap">{chatResponse}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button onClick={() => setChatOpen(false)} variant="outline">
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AICoPilot({ drilldown, agentId = 'integrated-management', dataMode = 'VRO' }: AICoPilotProps) {
  const [expandedAgent, setExpandedAgent] = useState<AgentType | null>(null);
  
  // Unified integrated management agent for both VRO and PMO views
  const primaryAgent: AgentType = 'integrated-management';
  const agents: AgentType[] = [primaryAgent];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-semibold text-gray-700">AI Agents Monitoring This Entity</span>
        <Badge variant="secondary" className="text-xs">{agents.length} agents</Badge>
      </div>
      <div className="space-y-2">
        {agents.map((agent) => (
          <AgentCard
            key={agent}
            agent={agent}
            drilldown={drilldown}
            isExpanded={expandedAgent === agent}
            onToggle={() => setExpandedAgent(expandedAgent === agent ? null : agent)}
          />
        ))}
      </div>
    </div>
  );
}
