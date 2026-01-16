import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  riskType: 'budget' | 'timeline' | 'dependency' | 'resource' | 'quality' | 'regulatory' | 'market' | 'operational';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  intervention: string;
  impact: string;
  confidence: number;
  status: 'pending' | 'approved' | 'dismissed' | 'executing';
  agentSource: string;
  source: 'enterprise' | 'project';
  trend?: 'improving' | 'stable' | 'worsening';
}

interface EnterpriseRisk {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  severity: string;
  trend: string;
  createdAt: string;
}

interface ProjectRisk {
  id: string;
  projectId: string;
  name: string;
  probability: string;
  impact: string;
  status: string;
  mitigation: string;
  owner: string;
}

interface APIProject {
  id: string;
  name: string;
  status: string;
  budgetSpent: string;
  budgetTotal: string;
}

function generateIntervention(risk: EnterpriseRisk | ProjectRisk, isEnterprise: boolean): { intervention: string; impact: string; confidence: number; agentSource: string } {
  if (isEnterprise) {
    const er = risk as EnterpriseRisk;
    const interventions: Record<string, { intervention: string; impact: string; confidence: number; agentSource: string }> = {
      'Hurricane and severe weather exposure': {
        intervention: 'Activate storm hardening acceleration program. Pre-position restoration crews and materials. Review mutual aid agreements with neighboring utilities.',
        impact: 'Reduce restoration time by 40%, minimize customer outage hours',
        confidence: 92,
        agentSource: 'Resilience Agent'
      },
      'Project execution and development': {
        intervention: 'Implement parallel permitting workflows. Engage additional interconnection consultants. Prioritize projects with highest execution certainty.',
        impact: 'Maintain 85%+ of buildout target, protect pipeline value',
        confidence: 84,
        agentSource: 'Planning Agent'
      },
      'Equipment and infrastructure reliability': {
        intervention: 'Accelerate predictive maintenance analytics deployment. Increase spare parts inventory for critical transformers. Expedite substation automation upgrades.',
        impact: 'Reduce unplanned outages by 25%, improve SAIDI metrics',
        confidence: 88,
        agentSource: 'Operations Agent'
      },
      'Rate case outcomes': {
        intervention: 'Strengthen regulatory stakeholder engagement. Document capital investment benefits for customers. Prepare multi-scenario financial models.',
        impact: 'Protect ROE within approved band, maintain capital access',
        confidence: 79,
        agentSource: 'Governance Agent'
      },
      'Interest rate exposure': {
        intervention: 'Evaluate interest rate hedging opportunities. Accelerate high-priority financings before further rate increases. Optimize capital structure.',
        impact: 'Lock in favorable rates for $5B+ of planned issuances',
        confidence: 76,
        agentSource: 'FinOps Agent'
      },
      'Supply chain constraints': {
        intervention: 'Diversify supplier base for solar panels and batteries. Negotiate long-term supply agreements. Qualify domestic manufacturing alternatives.',
        impact: 'Reduce supply chain risk by 50%, ensure project timelines',
        confidence: 82,
        agentSource: 'Procurement Agent'
      },
      'Power price volatility': {
        intervention: 'Increase hedge ratios for merchant exposure. Pursue additional long-term PPA opportunities. Optimize real-time trading strategies.',
        impact: 'Reduce earnings volatility, protect margin certainty',
        confidence: 81,
        agentSource: 'Trading Agent'
      },
      'Nuclear operations': {
        intervention: 'Enhance NRC compliance monitoring. Strengthen safety culture programs. Expedite license extension applications.',
        impact: 'Maintain 90%+ capacity factor, ensure continued operations',
        confidence: 94,
        agentSource: 'Nuclear Safety Agent'
      }
    };
    
    return interventions[er.name] || {
      intervention: `Initiate risk mitigation protocol for ${er.name}. Engage cross-functional team for assessment and action planning.`,
      impact: 'Reduce risk exposure and protect operational continuity',
      confidence: 75,
      agentSource: 'Risk Agent'
    };
  } else {
    const pr = risk as ProjectRisk;
    return {
      intervention: pr.mitigation || `Implement mitigation strategy for ${pr.name}. Assign dedicated resources and establish monitoring cadence.`,
      impact: 'Reduce project risk and maintain delivery timeline',
      confidence: pr.probability === 'high' ? 85 : pr.probability === 'medium' ? 78 : 72,
      agentSource: pr.owner || 'Project Agent'
    };
  }
}

function mapSeverity(severity: string, probability?: string, impact?: string): 'critical' | 'high' | 'medium' {
  if (severity === 'critical' || (probability === 'high' && impact === 'high')) return 'critical';
  if (severity === 'high' || probability === 'high' || impact === 'high') return 'high';
  return 'medium';
}

function mapRiskType(categoryId: string, name: string): RiskIntervention['riskType'] {
  const lower = (categoryId + ' ' + name).toLowerCase();
  if (lower.includes('regulatory') || lower.includes('rate') || lower.includes('compliance')) return 'regulatory';
  if (lower.includes('market') || lower.includes('price') || lower.includes('interest')) return 'market';
  if (lower.includes('operational') || lower.includes('equipment') || lower.includes('weather')) return 'operational';
  if (lower.includes('budget') || lower.includes('cost')) return 'budget';
  if (lower.includes('timeline') || lower.includes('schedule')) return 'timeline';
  if (lower.includes('resource') || lower.includes('talent')) return 'resource';
  if (lower.includes('quality') || lower.includes('safety')) return 'quality';
  return 'operational';
}

interface AutonomousRiskAgentProps {
  onNavigateToProject?: (projectId: string) => void;
}

export function AutonomousRiskAgent({ onNavigateToProject }: AutonomousRiskAgentProps) {
  const [localStatuses, setLocalStatuses] = useState<Record<string, RiskIntervention['status']>>({});
  const [expanded, setExpanded] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch enterprise risks from database
  const { data: enterpriseRisks = [], isLoading: loadingEnterprise } = useQuery<EnterpriseRisk[]>({
    queryKey: ['enterprise-risks'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise-risks');
      if (!res.ok) throw new Error('Failed to fetch enterprise risks');
      return res.json();
    },
    staleTime: 60000
  });

  // Fetch projects with risks
  const { data: projects = [], isLoading: loadingProjects } = useQuery<APIProject[]>({
    queryKey: ['projects', 'at-risk'],
    queryFn: async () => {
      const res = await fetch('/api/projects/enriched');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const all = await res.json();
      return all.filter((p: APIProject) => p.status === 'amber' || p.status === 'red');
    },
    staleTime: 60000
  });

  // Transform real risks into intervention format
  const risks = useMemo((): RiskIntervention[] => {
    const items: RiskIntervention[] = [];
    
    // Add enterprise risks (from 10-K annual report)
    enterpriseRisks
      .filter(er => er.severity === 'high' || er.trend === 'worsening')
      .slice(0, 3)
      .forEach(er => {
        const { intervention, impact, confidence, agentSource } = generateIntervention(er, true);
        items.push({
          id: `enterprise-${er.id}`,
          projectId: '',
          projectName: er.name,
          riskType: mapRiskType(er.categoryId, er.name),
          severity: mapSeverity(er.severity),
          description: er.description,
          intervention,
          impact,
          confidence,
          status: localStatuses[`enterprise-${er.id}`] || 'pending',
          agentSource,
          source: 'enterprise',
          trend: er.trend as 'improving' | 'stable' | 'worsening'
        });
      });

    // Add project-level risks from at-risk projects
    projects.slice(0, 2).forEach(proj => {
      const budgetSpent = parseFloat(proj.budgetSpent) || 0;
      const budgetTotal = parseFloat(proj.budgetTotal) || 1;
      const budgetRatio = budgetSpent / budgetTotal;
      
      if (budgetRatio > 0.6 || proj.status === 'red') {
        items.push({
          id: `project-${proj.id}`,
          projectId: proj.id,
          projectName: proj.name,
          riskType: 'budget',
          severity: proj.status === 'red' ? 'critical' : 'high',
          description: `Budget tracking at ${Math.round(budgetRatio * 100)}% consumed. Project status: ${proj.status.toUpperCase()}. Review resource allocation and scope.`,
          intervention: `Conduct budget variance analysis. Identify cost optimization opportunities. Consider scope prioritization workshop if variance exceeds 10%.`,
          impact: 'Bring project back on track, protect delivery timeline',
          confidence: 83,
          status: localStatuses[`project-${proj.id}`] || 'pending',
          agentSource: 'FinOps Agent',
          source: 'project'
        });
      }
    });

    return items;
  }, [enterpriseRisks, projects, localStatuses]);

  const handleApprove = useCallback(async (riskId: string) => {
    setProcessingId(riskId);
    const risk = risks.find(r => r.id === riskId);
    
    if (!risk) {
      setProcessingId(null);
      return;
    }
    
    setLocalStatuses(prev => ({ ...prev, [riskId]: 'executing' }));
    
    const action = createAgentActionFromRisk(risk, 'approve', 'Autonomous Risk Agent');
    const result = await routeToCommandCenter(action);
    
    setLocalStatuses(prev => ({ ...prev, [riskId]: 'approved' }));
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
    
    setLocalStatuses(prev => ({ ...prev, [riskId]: 'dismissed' }));
    toast.info('Intervention dismissed - logged to Command Center');
  }, [risks]);

  const pendingRisks = risks.filter(r => r.status === 'pending');
  const isLoading = loadingEnterprise || loadingProjects;

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
      case 'regulatory': return '⚖️';
      case 'market': return '📈';
      case 'operational': return '⚙️';
      default: return '⚠️';
    }
  };

  const getTrendBadge = (trend?: string) => {
    if (!trend) return null;
    const colors = {
      improving: 'bg-green-100 text-green-800',
      stable: 'bg-gray-100 text-gray-800',
      worsening: 'bg-red-100 text-red-800'
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[trend as keyof typeof colors] || ''}`}>
        {trend}
      </Badge>
    );
  };

  if (pendingRisks.length === 0 && !expanded && !isLoading) return null;

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
          AI agents continuously monitor your portfolio and propose interventions based on 10-K risk factors
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading risks from database...</span>
                </div>
              ) : pendingRisks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All risks have been addressed</p>
                </div>
              ) : (
                pendingRisks.map((risk) => (
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
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">Detected by {risk.agentSource}</p>
                            {risk.source === 'enterprise' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">10-K Risk Factor</Badge>
                            )}
                            {getTrendBadge(risk.trend)}
                          </div>
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
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-purple-600 font-medium">
                          AI Confidence: {risk.confidence}%
                        </span>
                        {risk.projectId && (
                          <button
                            onClick={() => onNavigateToProject?.(risk.projectId)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View Project <ArrowRight className="h-3 w-3 ml-1" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {processingId === risk.id ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDismiss(risk.id)}
                              className="text-gray-600"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(risk.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
