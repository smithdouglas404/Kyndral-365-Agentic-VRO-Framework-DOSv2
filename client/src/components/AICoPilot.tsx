import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, AlertTriangle, Lightbulb, MessageCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EntityDrilldown, AgentType } from '@/lib/dataHub';

interface AICoPilotProps {
  drilldown: EntityDrilldown;
  agentId?: AgentType;
}

interface CoPilotInsights {
  greeting: string;
  situation: string;
  concerns: string[];
  recommendations: string[];
  questions: string[];
}

const agentPersonalities: Record<AgentType, { name: string; style: string; focus: string }> = {
  vro: { name: 'VRO Agent', style: 'strategic', focus: 'value realization and ROI optimization' },
  pmo: { name: 'PMO Agent', style: 'operational', focus: 'project delivery and timeline management' },
  tmo: { name: 'TMO Agent', style: 'transformational', focus: 'change adoption and initiative success' },
  finops: { name: 'FinOps Agent', style: 'analytical', focus: 'cost optimization and financial efficiency' },
  okr: { name: 'OKR Agent', style: 'strategic', focus: 'objective alignment and key results tracking' },
  governance: { name: 'Governance Agent', style: 'risk-aware', focus: 'compliance and risk mitigation' },
  planning: { name: 'Planning Agent', style: 'forward-looking', focus: 'capacity planning and roadmap management' },
  ocm: { name: 'OCM Agent', style: 'people-focused', focus: 'stakeholder readiness and change adoption' }
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

export function AICoPilot({ drilldown, agentId = 'vro' }: AICoPilotProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<CoPilotInsights | null>(null);
  const personality = agentPersonalities[agentId];

  useEffect(() => {
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
            agentId,
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
            setInsights(generateFallbackInsights(drilldown, agentId));
          }
        } else {
          setInsights(generateFallbackInsights(drilldown, agentId));
        }
      } catch {
        setInsights(generateFallbackInsights(drilldown, agentId));
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [drilldown.entityId, agentId]);

  const currentInsights = insights || generateFallbackInsights(drilldown, agentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Brain className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-800">{personality.name}</span>
                  <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                    <Sparkles size={10} className="mr-1" />
                    AI Co-Pilot
                  </Badge>
                  {isLoading && (
                    <span className="text-xs text-purple-500 animate-pulse">Analyzing...</span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>

              {isExpanded && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-purple-900">{currentInsights.greeting}</p>
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

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => setShowQuestions(!showQuestions)}
                      data-testid="copilot-expand-questions"
                    >
                      <HelpCircle size={12} className="mr-1" />
                      {showQuestions ? 'Hide Questions' : 'What would you like to explore?'}
                    </Button>
                  </div>

                  {showQuestions && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle size={14} className="text-blue-500" />
                        <span className="text-xs font-semibold text-blue-700">I can help you with:</span>
                      </div>
                      <div className="space-y-2">
                        {currentInsights.questions.map((q, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs text-blue-700 hover:bg-blue-100 h-auto py-2"
                            data-testid={`copilot-question-${i}`}
                          >
                            <span className="text-blue-400 mr-2">?</span>
                            {q}
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
