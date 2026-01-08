import { motion } from 'framer-motion';
import { 
  AlertTriangle, TrendingUp, DollarSign, Sparkles, 
  ChevronRight, CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSimulation } from '@/contexts/SimulationContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  id: string;
  title: string;
  confidence: number;
  description: string;
  actionLabel: string;
  type: 'risk' | 'opportunity' | 'savings';
  impact?: string;
  actionType: 'mitigate' | 'accelerate' | 'investigate' | 'escalate';
}

type DataMode = 'VRO' | 'PMO';

const vroRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'AI-Driven Cost Optimization',
    confidence: 92,
    description: 'VRO predictive analytics identified £8.2M savings through intelligent resource reallocation. Proactive intervention recommended within 2 weeks.',
    actionLabel: 'Deploy AI Model',
    type: 'savings',
    impact: '£8.2M savings',
    actionType: 'accelerate'
  },
  {
    id: '2',
    title: 'PRT Volume Acceleration',
    confidence: 94,
    description: 'VRO market sensing detects favorable conditions. Automated workflow can accelerate PRT processing by 40%, targeting £12bn volume.',
    actionLabel: 'Activate Automation',
    type: 'opportunity',
    impact: '+£2.8bn potential',
    actionType: 'accelerate'
  },
  {
    id: '3',
    title: 'Proactive Risk Mitigation',
    confidence: 89,
    description: 'VRO early warning system flagged 3 emerging risks before impact. AI-recommended interventions have 89% success rate.',
    actionLabel: 'Review AI Actions',
    type: 'risk',
    impact: 'Prevented £3.1M loss',
    actionType: 'mitigate'
  },
  {
    id: '4',
    title: 'Cross-Division Synergy Detection',
    confidence: 87,
    description: 'VRO pattern recognition identified untapped synergies between Retail and Institutional. Projected efficiency gain: 35%.',
    actionLabel: 'View Synergy Map',
    type: 'opportunity',
    impact: '35% efficiency gain',
    actionType: 'investigate'
  }
];

const pmoRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Digital Platform Cost Overrun',
    confidence: 68,
    description: 'Technology modernization costs running 18% above baseline at £52.4M. Manual review required to identify root causes.',
    actionLabel: 'Schedule Review',
    type: 'risk',
    impact: '£9.4M at risk',
    actionType: 'escalate'
  },
  {
    id: '2',
    title: 'PRT Volume Tracking',
    confidence: 72,
    description: 'Current PRT volume at £7.1bn, below £10bn target. Traditional forecasting shows gap widening without intervention.',
    actionLabel: 'View Forecast',
    type: 'risk',
    impact: '£2.9bn gap',
    actionType: 'investigate'
  },
  {
    id: '3',
    title: 'Operational Efficiency Review Needed',
    confidence: 65,
    description: 'Manual analysis suggests potential savings in Retail operations. Detailed study required - estimated 6-8 weeks.',
    actionLabel: 'Request Study',
    type: 'savings',
    impact: '£28M potential',
    actionType: 'investigate'
  },
  {
    id: '4',
    title: 'Risk Register Update Required',
    confidence: 61,
    description: 'Quarterly risk assessment due. 12 risks pending review. Manual escalation process taking 3-4 weeks on average.',
    actionLabel: 'View Risks',
    type: 'risk',
    impact: 'Review pending',
    actionType: 'escalate'
  }
];

const typeConfig = {
  risk: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  opportunity: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  savings: {
    icon: DollarSign,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
};

const actionMessages: Record<string, { title: string; description: string }> = {
  'Deploy AI Model': { title: 'AI Model Deployed', description: 'Cost optimization model is now active. Monitoring for savings opportunities.' },
  'Activate Automation': { title: 'Automation Activated', description: 'PRT processing workflow accelerated. Volume tracking enabled.' },
  'Review AI Actions': { title: 'AI Actions Under Review', description: 'Risk mitigation strategies are being evaluated by the system.' },
  'View Synergy Map': { title: 'Synergy Analysis Started', description: 'Cross-division synergy mapping initiated. Results in 2-3 minutes.' },
  'Schedule Review': { title: 'Review Scheduled', description: 'Cost review meeting has been added to the calendar.' },
  'View Forecast': { title: 'Forecast Loaded', description: 'PRT volume forecast analysis is now available.' },
  'Request Study': { title: 'Study Requested', description: 'Efficiency study request submitted. ETA: 6-8 weeks.' },
  'View Risks': { title: 'Risk Register Opened', description: 'Displaying 12 pending risks for review.' }
};

interface AIRecommendationsProps {
  dataMode?: DataMode;
}

export function AIRecommendations({ dataMode = 'VRO' }: AIRecommendationsProps) {
  const recommendations = dataMode === 'VRO' ? vroRecommendations : pmoRecommendations;
  const { setSelectedEvent } = useSimulation();
  const { toast } = useToast();
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  
  const handleActionClick = (rec: Recommendation) => {
    const actionKey = `${dataMode}-${rec.id}`;
    
    if (completedActions.has(actionKey)) return;
    
    setActiveActions(prev => new Set(prev).add(actionKey));
    
    // Simulate action processing
    setTimeout(() => {
      setActiveActions(prev => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
      setCompletedActions(prev => new Set(prev).add(actionKey));
      
      const actionInfo = actionMessages[rec.actionLabel] || { 
        title: 'Action Triggered', 
        description: `${rec.actionLabel} is now in progress.` 
      };
      
      toast({
        title: actionInfo.title,
        description: actionInfo.description,
      });
      
      // Create a simulation event for this action
      const simulationEvent = {
        id: `rec-${Date.now()}`,
        type: rec.type === 'risk' ? 'action_required' as const : 'opportunity' as const,
        priority: 'medium' as const,
        timestamp: new Date(),
        title: actionInfo.title,
        message: actionInfo.description,
        detail: `Action initiated from ${dataMode} recommendation: ${rec.title}. ${rec.description}`,
        confidence: rec.confidence,
        source: dataMode === 'VRO' ? 'VRO AI Agent' : 'PMO System',
        relatedEntity: {
          type: 'program' as const,
          id: `rec-${rec.id}`,
          name: rec.title,
          bu: 'Transformation'
        },
        metrics: {
          impact: rec.impact || 'In progress',
          timeframe: 'This week'
        },
        actions: [],
        citations: ['AI Recommendations Dashboard'],
        read: false
      };
      
      setSelectedEvent(simulationEvent);
    }, 1500);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Recommendations
            <Badge variant={dataMode === 'VRO' ? 'default' : 'secondary'} className="text-xs ml-2">
              {dataMode}
            </Badge>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {recommendations.length} insights
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {dataMode === 'VRO' 
            ? 'Proactive AI-driven insights with predictive analytics and automated interventions'
            : 'Traditional analysis requiring manual review and escalation processes'
          }
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const config = typeConfig[rec.type];
            const Icon = config.icon;
            const actionKey = `${dataMode}-${rec.id}`;
            const isActive = activeActions.has(actionKey);
            const isCompleted = completedActions.has(actionKey);
            
            return (
              <motion.div
                key={`${dataMode}-${rec.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border",
                  config.bgColor,
                  config.borderColor
                )}
                data-testid={`recommendation-${rec.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm", config.borderColor, "border")}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-sm text-gray-900">{rec.title}</h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                          {rec.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      {rec.impact && (
                        <span className={cn(
                          "text-xs font-semibold",
                          rec.type === 'risk' ? 'text-amber-700' :
                          rec.type === 'opportunity' ? 'text-green-700' : 'text-blue-700'
                        )}>
                          {rec.impact}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant={isCompleted ? "outline" : "ghost"}
                    size="sm" 
                    className={cn(
                      "text-xs shrink-0",
                      isCompleted && "text-green-600 border-green-200"
                    )}
                    onClick={() => handleActionClick(rec)}
                    disabled={isActive || isCompleted}
                    data-testid={`rec-action-${rec.id}`}
                  >
                    {isActive ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : isCompleted ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Done
                      </>
                    ) : (
                      <>
                        {rec.actionLabel}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
