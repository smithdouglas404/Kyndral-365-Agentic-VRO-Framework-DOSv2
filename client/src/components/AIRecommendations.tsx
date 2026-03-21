import { motion } from 'framer-motion';
import {
  AlertTriangle, TrendingUp, DollarSign, Sparkles,
  ChevronRight, CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { executeAction, ActionType } from '@/lib/agentActionEngine';
import { AgentType as AgentTypeFromHub } from '@/lib/dataHub';
import { routeToCommandCenter, AgentAction } from '@/lib/commandCenterBridge';

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
type AgentType = 'integrated-management' | 'tmo' | 'finops' | 'governance' | 'okr' | 'planning' | 'ocm';

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
  'Activate Automation': { title: 'Automation Activated', description: 'Processing workflow accelerated. Volume tracking enabled.' },
  'Review AI Actions': { title: 'AI Actions Under Review', description: 'Risk mitigation strategies are being evaluated by the system.' },
  'View Synergy Map': { title: 'Synergy Analysis Started', description: 'Cross-division synergy mapping initiated. Results in 2-3 minutes.' },
  'Schedule Review': { title: 'Review Scheduled', description: 'Cost review meeting has been added to the calendar.' },
  'View Forecast': { title: 'Forecast Loaded', description: 'Volume forecast analysis is now available.' },
  'Request Study': { title: 'Study Requested', description: 'Efficiency study request submitted. ETA: 6-8 weeks.' },
  'View Risks': { title: 'Risk Register Opened', description: 'Displaying 12 pending risks for review.' },
  'View Impact': { title: 'Impact Analysis', description: 'Viewing dependency impact across workstreams.' },
  'Analyze': { title: 'Analysis Started', description: 'Way of Working analysis in progress.' },
  'Apply': { title: 'Recommendation Applied', description: 'Resource allocation changes queued for approval.' },
  'Optimize Now': { title: 'Optimization Started', description: 'Cloud resource optimization in progress.' },
  'Calculate Savings': { title: 'Savings Calculated', description: 'Reserved instance savings analysis ready.' },
  'Rebalance': { title: 'Rebalancing', description: 'Budget reallocation proposal generated.' },
  'Schedule Reviews': { title: 'Reviews Scheduled', description: 'Security review sessions booked.' },
  'Review Policy': { title: 'Policy Review', description: 'Opening policy documentation for update.' },
  'View Findings': { title: 'Audit Findings', description: 'Displaying open audit findings.' },
  'View Actions': { title: 'Action Plan', description: 'Displaying recovery actions for at-risk KRs.' },
  'Set Stretch': { title: 'Stretch Goal Set', description: 'Stretch target has been updated.' },
  'Align OKRs': { title: 'OKR Alignment', description: 'Initiating OKR cascade review.' },
  'Balance Load': { title: 'Load Balancing', description: 'Capacity planning optimization started.' },
  'View Chain': { title: 'Dependency Chain', description: 'Critical path dependencies displayed.' },
  'Plan Training': { title: 'Training Planned', description: 'Cross-training schedule created.' },
  'Schedule Training': { title: 'Training Scheduled', description: 'Bootcamp sessions added to calendar.' },
  'Engage Sponsors': { title: 'Sponsor Engagement', description: 'Executive briefing request sent.' }
};

const agentLabels: Record<AgentType, string> = {
  'integrated-management': 'IMA',
  tmo: 'TMO',
  finops: 'FinOps',
  governance: 'Governance',
  okr: 'OKR',
  planning: 'Planning',
  ocm: 'OCM'
};

interface AIRecommendationsProps {
  dataMode?: DataMode;
  agentType?: AgentType;
}

export function AIRecommendations({ dataMode = 'VRO', agentType }: AIRecommendationsProps) {
  const effectiveAgent = agentType || 'integrated-management';
  const displayLabel = agentLabels[effectiveAgent];
  const { toast } = useToast();
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  // ✅ Fetch recommendations from API instead of hardcoded arrays
  const { data: recommendationsData, isLoading } = useQuery({
    queryKey: ['recommendations', effectiveAgent],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations?agentType=${effectiveAgent}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const recommendations = recommendationsData?.recommendations || [];

  // Show loading state
  if (isLoading && recommendations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Recommendations
            <Badge variant="default" className="text-xs ml-2">{displayLabel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          <span className="ml-2 text-sm text-muted-foreground">Loading recommendations...</span>
        </CardContent>
      </Card>
    );
  }
  
  const handleActionClick = async (rec: Recommendation) => {
    const actionKey = `${effectiveAgent}-${rec.id}`;
    
    if (completedActions.has(actionKey)) return;
    
    setActiveActions(prev => new Set(prev).add(actionKey));
    
    // Execute real agent action
    executeAction(
      effectiveAgent as AgentTypeFromHub,
      rec.actionType as ActionType,
      'project',
      `rec-${rec.id}`,
      rec.title,
      rec.description,
      rec.confidence
    );
    
    // Route to Command Center for unified tracking
    const action: AgentAction = {
      actionType: rec.actionType === 'mitigate' ? 'acknowledge' : 
                  rec.actionType === 'escalate' ? 'escalate' : 'approve',
      sourceComponent: 'AI Recommendations',
      interventionData: {
        type: rec.type === 'risk' ? 'quality' : rec.type === 'savings' ? 'budget' : 'timeline',
        severity: rec.confidence >= 90 ? 'critical' : rec.confidence >= 75 ? 'high' : 'medium',
        title: rec.title,
        description: rec.description,
        projectId: `rec-${rec.id}`,
        projectName: rec.title,
        confidence: rec.confidence,
        suggestedAction: rec.actionLabel,
        impact: rec.impact || 'Impact analysis pending',
        agentSource: `${effectiveAgent.charAt(0).toUpperCase() + effectiveAgent.slice(1).replace('-', ' ')} Agent`
      }
    };
    
    routeToCommandCenter(action);
    
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
    }, 1500);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Recommendations
            <Badge variant="default" className="text-xs ml-2">
              {displayLabel}
            </Badge>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {recommendations.length} insights
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Proactive AI-driven insights with predictive analytics and automated interventions
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const config = typeConfig[rec.type];
            const Icon = config.icon;
            const actionKey = `${effectiveAgent}-${rec.id}`;
            const isActive = activeActions.has(actionKey);
            const isCompleted = completedActions.has(actionKey);
            
            return (
              <motion.div
                key={`${effectiveAgent}-${rec.id}`}
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
