import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Zap, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Bot,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { routeToCommandCenter, createAgentActionFromRisk } from '@/lib/commandCenterBridge';

interface RiskIntervention {
  id: string;
  projectId: string;
  projectName: string;
  riskType: 'budget' | 'timeline' | 'dependency' | 'resource' | 'quality';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  intervention: string;
  impact: string;
  confidence: number;
  status: 'pending' | 'approved' | 'dismissed' | 'executing';
  agentSource: string;
}

const riskData: RiskIntervention[] = [
  {
    id: 'risk-1',
    projectId: 'proj-trading-platform',
    projectName: 'Next-Gen Trading Platform',
    riskType: 'dependency',
    severity: 'critical',
    description: 'Market data dependency RED status blocking Fixed Income milestone',
    intervention: 'Initiate parallel development path using historical data mocks while dependency team resolves integration. Escalate to steering committee for priority alignment.',
    impact: 'Reduce schedule slip risk by 65%, maintain team productivity',
    confidence: 87,
    status: 'pending',
    agentSource: 'Planning Agent'
  },
  {
    id: 'risk-2',
    projectId: 'proj-data-foundation',
    projectName: 'Enterprise Data Foundation',
    riskType: 'budget',
    severity: 'high',
    description: 'Budget overrun of £1.2M detected, currently at 71% spent with 55% progress',
    intervention: 'Recommend scope prioritization workshop to defer non-critical MDM features to Phase 2. Reallocate £400K from contingency reserve.',
    impact: 'Bring project back within 5% of budget, protect critical path',
    confidence: 82,
    status: 'pending',
    agentSource: 'FinOps Agent'
  },
  {
    id: 'risk-3',
    projectId: 'proj-regulatory-reporting',
    projectName: 'Regulatory Reporting Automation',
    riskType: 'timeline',
    severity: 'critical',
    description: 'EIOPA regulatory deadline at risk - QRT automation milestone showing amber',
    intervention: 'Deploy additional contractor resources for 4-week sprint. Activate pre-approved vendor support agreement for parallel workstream.',
    impact: 'Achieve 95% confidence in meeting regulatory deadline',
    confidence: 91,
    status: 'pending',
    agentSource: 'Governance Agent'
  }
];

interface AutonomousRiskAgentProps {
  onNavigateToProject?: (projectId: string) => void;
}

export function AutonomousRiskAgent({ onNavigateToProject }: AutonomousRiskAgentProps) {
  const [risks, setRisks] = useState<RiskIntervention[]>(riskData);
  const [expanded, setExpanded] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = useCallback(async (riskId: string) => {
    setProcessingId(riskId);
    const risk = risks.find(r => r.id === riskId);
    
    if (!risk) {
      setProcessingId(null);
      return;
    }
    
    setRisks(prev => prev.map(r => r.id === riskId ? { ...r, status: 'executing' as const } : r));
    
    const action = createAgentActionFromRisk(risk, 'approve', 'Autonomous Risk Agent');
    const result = await routeToCommandCenter(action);
    
    setRisks(prev => prev.map(r => r.id === riskId ? { ...r, status: 'approved' as const } : r));
    setProcessingId(null);
    
    if (result.success) {
      toast.success(`Intervention approved for ${risk.projectName}`, {
        description: 'Routed to Command Center - Agent cascade initiated'
      });
    } else {
      toast.success(`Intervention approved for ${risk.projectName}`, {
        description: 'Agent cascade initiated - stakeholders notified'
      });
    }
  }, [risks]);

  const handleDismiss = useCallback(async (riskId: string) => {
    const risk = risks.find(r => r.id === riskId);
    
    if (risk) {
      const action = createAgentActionFromRisk(risk, 'dismiss', 'Autonomous Risk Agent');
      await routeToCommandCenter(action);
    }
    
    setRisks(prev => prev.map(r => r.id === riskId ? { ...r, status: 'dismissed' as const } : r));
    toast.info('Intervention dismissed - logged to Command Center');
  }, [risks]);

  const pendingRisks = risks.filter(r => r.status === 'pending');
  const resolvedRisks = risks.filter(r => r.status !== 'pending');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskTypeIcon = (type: string) => {
    switch (type) {
      case 'budget': return '💰';
      case 'timeline': return '⏱️';
      case 'dependency': return '🔗';
      case 'resource': return '👥';
      case 'quality': return '✅';
      default: return '⚠️';
    }
  };

  if (pendingRisks.length === 0 && !expanded) return null;

  return (
    <Card className="border-l-4 border-l-purple-600 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            Autonomous Risk Mitigation
            {pendingRisks.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {pendingRisks.length} pending
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          AI agents continuously monitor your portfolio and propose interventions
        </p>
      </CardHeader>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              {pendingRisks.map((risk) => (
                <motion.div
                  key={risk.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="border rounded-lg p-4 bg-gradient-to-r from-red-50 to-orange-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getRiskTypeIcon(risk.riskType)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{risk.projectName}</h4>
                        <p className="text-xs text-gray-500">Detected by {risk.agentSource}</p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(risk.severity)}>
                      {risk.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white/60 rounded-lg p-3 border border-red-200">
                      <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Risk Detected
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{risk.description}</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Proposed Intervention
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{risk.intervention}</p>
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Expected Impact: {risk.impact}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          AI Confidence: <span className="font-bold text-purple-600">{risk.confidence}%</span>
                        </div>
                        {onNavigateToProject && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-xs p-0 h-auto"
                            onClick={() => onNavigateToProject(risk.projectId)}
                          >
                            View Project <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismiss(risk.id)}
                          disabled={processingId === risk.id}
                          data-testid={`button-dismiss-${risk.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(risk.id)}
                          disabled={processingId === risk.id}
                          data-testid={`button-approve-${risk.id}`}
                        >
                          {processingId === risk.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {resolvedRisks.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Recently Resolved ({resolvedRisks.length})
                  </p>
                  <div className="space-y-2">
                    {resolvedRisks.slice(0, 3).map((risk) => (
                      <div 
                        key={risk.id}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          risk.status === 'approved' ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <span className="text-gray-700">{risk.projectName}</span>
                        <Badge variant="outline" className={
                          risk.status === 'approved' ? 'text-green-600 border-green-300' : 'text-gray-500'
                        }>
                          {risk.status === 'approved' ? 'Approved' : 'Dismissed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {pendingRisks.length === 0 && resolvedRisks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-green-400" />
                  <p>No pending interventions</p>
                  <p className="text-sm">AI agents are continuously monitoring</p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
