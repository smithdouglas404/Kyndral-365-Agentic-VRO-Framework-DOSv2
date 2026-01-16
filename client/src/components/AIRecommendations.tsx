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

const vroRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'AI-Driven Cost Optimization',
    confidence: 92,
    description: 'VRO predictive analytics identified $8.2M savings through intelligent resource reallocation. Proactive intervention recommended within 2 weeks.',
    actionLabel: 'Deploy AI Model',
    type: 'savings',
    impact: '$8.2M savings',
    actionType: 'accelerate'
  },
  {
    id: '2',
    title: 'Renewable Project Acceleration',
    confidence: 94,
    description: 'VRO market sensing detects favorable ITC/PTC conditions. Automated workflow can accelerate project approvals by 40%, targeting 8 GW additions.',
    actionLabel: 'Activate Automation',
    type: 'opportunity',
    impact: '+$2.8bn potential',
    actionType: 'accelerate'
  },
  {
    id: '3',
    title: 'Proactive Risk Mitigation',
    confidence: 89,
    description: 'VRO early warning system flagged 3 emerging risks before impact. AI-recommended interventions have 89% success rate.',
    actionLabel: 'Review AI Actions',
    type: 'risk',
    impact: 'Prevented $3.1M loss',
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
    description: 'Technology modernization costs running 18% above baseline at $52.4M. Manual review required to identify root causes.',
    actionLabel: 'Schedule Review',
    type: 'risk',
    impact: '$9.4M at risk',
    actionType: 'escalate'
  },
  {
    id: '2',
    title: 'Renewable Capacity Tracking',
    confidence: 72,
    description: 'Current project pipeline at 32 GW, below 46.5 GW target. Traditional forecasting shows gap widening without intervention.',
    actionLabel: 'View Forecast',
    type: 'risk',
    impact: '14.5 GW gap',
    actionType: 'investigate'
  },
  {
    id: '3',
    title: 'Operational Efficiency Review Needed',
    confidence: 65,
    description: 'Manual analysis suggests potential savings in Retail operations. Detailed study required - estimated 6-8 weeks.',
    actionLabel: 'Request Study',
    type: 'savings',
    impact: '$28M potential',
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

const tmoRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Workstream Dependency Risk',
    confidence: 92,
    description: 'Inventory Optimization workstream is at risk due to dependency on ERP Upgrade Phase 2 which is currently blocked.',
    actionLabel: 'View Impact',
    type: 'risk',
    impact: '$2.3M at risk',
    actionType: 'mitigate'
  },
  {
    id: '2',
    title: 'WoW Mismatch Detected',
    confidence: 85,
    description: 'Product Innovation team context suggests Lean Kanban may be more effective than Scrum for Data Analytics stream.',
    actionLabel: 'Analyze',
    type: 'opportunity',
    impact: '+23% throughput',
    actionType: 'investigate'
  },
  {
    id: '3',
    title: 'Epic Acceleration Opportunity',
    confidence: 88,
    description: 'Adding 2 more developers to Demand Forecasting AI epic could reduce delivery time by 3 weeks.',
    actionLabel: 'Apply',
    type: 'opportunity',
    impact: '3 weeks faster',
    actionType: 'accelerate'
  }
];

const finopsRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Cloud Cost Spike Detected',
    confidence: 96,
    description: 'AWS spending increased 42% this month. 23 unused EC2 instances detected across 3 environments.',
    actionLabel: 'Optimize Now',
    type: 'savings',
    impact: '$45K/month savings',
    actionType: 'accelerate'
  },
  {
    id: '2',
    title: 'Reserved Instance Opportunity',
    confidence: 91,
    description: 'Converting 15 on-demand instances to reserved could save $180K annually.',
    actionLabel: 'Calculate Savings',
    type: 'savings',
    impact: '$180K annual',
    actionType: 'investigate'
  },
  {
    id: '3',
    title: 'Budget Reallocation Needed',
    confidence: 84,
    description: 'Infrastructure budget 15% under-utilized while Application Development is at 120%.',
    actionLabel: 'Rebalance',
    type: 'opportunity',
    impact: 'Optimize $2.1M',
    actionType: 'accelerate'
  }
];

const governanceRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Compliance Gap Identified',
    confidence: 100,
    description: '3 projects missing required security reviews before go-live date. InfoSec approval backlog is 2 weeks.',
    actionLabel: 'Schedule Reviews',
    type: 'risk',
    impact: 'Go-live at risk',
    actionType: 'escalate'
  },
  {
    id: '2',
    title: 'Policy Update Required',
    confidence: 88,
    description: 'Data retention policy needs update to reflect new GDPR requirements effective next quarter.',
    actionLabel: 'Review Policy',
    type: 'risk',
    impact: '12 systems affected',
    actionType: 'mitigate'
  },
  {
    id: '3',
    title: 'Audit Finding Resolution',
    confidence: 79,
    description: '4 open audit findings from Q3 require remediation plans. 2 are high priority.',
    actionLabel: 'View Findings',
    type: 'risk',
    impact: 'Audit compliance',
    actionType: 'investigate'
  }
];

const okrRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Key Result At Risk',
    confidence: 89,
    description: 'Q1 customer satisfaction KR trending 15% below target with 4 weeks remaining. NPS at 42 vs target 55.',
    actionLabel: 'View Actions',
    type: 'risk',
    impact: 'KR miss likely',
    actionType: 'mitigate'
  },
  {
    id: '2',
    title: 'Stretch Goal Achievable',
    confidence: 82,
    description: 'Revenue growth KR on track to exceed target by 8% if current momentum continues.',
    actionLabel: 'Set Stretch',
    type: 'opportunity',
    impact: '+$6M potential',
    actionType: 'accelerate'
  },
  {
    id: '3',
    title: 'OKR Alignment Gap',
    confidence: 76,
    description: '5 team OKRs not properly cascaded from company objectives. Manual alignment review needed.',
    actionLabel: 'Align OKRs',
    type: 'risk',
    impact: 'Strategy drift',
    actionType: 'investigate'
  }
];

const planningRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Capacity Conflict Detected',
    confidence: 93,
    description: 'Q2 portfolio demand exceeds available capacity by 25%. 29 FTE shortfall identified.',
    actionLabel: 'Balance Load',
    type: 'risk',
    impact: '145 vs 116 FTEs',
    actionType: 'escalate'
  },
  {
    id: '2',
    title: 'Dependency Chain Risk',
    confidence: 87,
    description: 'Critical path shows 6 sequential dependencies. Single delay could impact 4 downstream projects.',
    actionLabel: 'View Chain',
    type: 'risk',
    impact: 'Schedule risk',
    actionType: 'investigate'
  },
  {
    id: '3',
    title: 'Resource Optimization',
    confidence: 81,
    description: 'Cross-training 8 developers could reduce critical resource bottlenecks by 40%.',
    actionLabel: 'Plan Training',
    type: 'opportunity',
    impact: '40% flexibility',
    actionType: 'accelerate'
  }
];

const ocmRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Change Fatigue Detected',
    confidence: 85,
    description: 'Operations team experiencing 3 concurrent major changes. Survey scores dropped 18 points.',
    actionLabel: 'View Impact',
    type: 'risk',
    impact: 'Resistance rising',
    actionType: 'mitigate'
  },
  {
    id: '2',
    title: 'Training Gap Analysis',
    confidence: 92,
    description: '340 users need upskilling before Phase 2 launch. Only 45% completed required training.',
    actionLabel: 'Schedule Training',
    type: 'risk',
    impact: '55% gap',
    actionType: 'escalate'
  },
  {
    id: '3',
    title: 'Stakeholder Engagement Low',
    confidence: 78,
    description: 'Executive sponsorship visibility declining. 2 key sponsors missed last 3 steering committees.',
    actionLabel: 'Engage Sponsors',
    type: 'risk',
    impact: 'Support at risk',
    actionType: 'investigate'
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

const recommendationsByAgent: Record<AgentType, Recommendation[]> = {
  'integrated-management': [...vroRecommendations, ...pmoRecommendations].slice(0, 4),
  tmo: tmoRecommendations,
  finops: finopsRecommendations,
  governance: governanceRecommendations,
  okr: okrRecommendations,
  planning: planningRecommendations,
  ocm: ocmRecommendations
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
  const recommendations = recommendationsByAgent[effectiveAgent] || vroRecommendations;
  const displayLabel = agentLabels[effectiveAgent];
  const { setSelectedEvent } = useSimulation();
  const { toast } = useToast();
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  
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
      
      // Create a simulation event for this action
      const simulationEvent = {
        id: `rec-${Date.now()}`,
        type: rec.type === 'risk' ? 'action_required' as const : 'opportunity' as const,
        priority: 'medium' as const,
        timestamp: new Date(),
        title: actionInfo.title,
        message: actionInfo.description,
        detail: `Action initiated from ${displayLabel} recommendation: ${rec.title}. ${rec.description}`,
        confidence: rec.confidence,
        source: `${displayLabel} AI Agent`,
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
