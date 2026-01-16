import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, CheckCircle2, TrendingUp, Users, Zap, Brain, ChevronRight, Sparkles, FileText, Link2, ExternalLink, History, Database, Activity, GitBranch, Bot, ArrowRight, MessageSquare } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useEntityDrilldown } from '@/hooks/useAgentData';
import { AgentType } from '@/lib/dataHub';
import { AICoPilot } from './AICoPilot';
import { getActionLog, subscribeToActions, AgentAction } from '@/lib/agentActionEngine';
import { getStageLabel, type EnrichedProject } from '@/lib/projects';
import { useEnrichedProjects } from '@/hooks/useProjects';
import { buPortfolios, type BUPortfolio } from '@/lib/buPrograms';
import { 
  strategicThemes, valueStreams, portfolioEpics, features, stories, tasks, teams, teamMembers
} from '@/lib/safe6Data';
import type { Feature, Story, Task } from '@/lib/safe6Model';
import { getDrilldownContent, type DrilldownContent } from '@/lib/drilldownRegistry';
import { formatValueWithUnit } from '@/lib/formatters';

interface DrillDownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  dataMode?: 'VRO' | 'PMO';
  onNavigate?: (entityType: string, entityId: string) => void;
}

const agentColors: Record<AgentType, string> = {
  'integrated-management': 'bg-gradient-to-r from-teal-500 to-blue-500',
  tmo: 'bg-blue-500',
  finops: 'bg-amber-500',
  okr: 'bg-orange-500',
  governance: 'bg-red-500',
  planning: 'bg-teal-500',
  ocm: 'bg-pink-500'
};

const agentNames: Record<AgentType, string> = {
  'integrated-management': 'Integrated Management Agent',
  tmo: 'TMO Agent',
  finops: 'FinOps Agent',
  okr: 'OKR Agent',
  governance: 'Governance Agent',
  planning: 'Planning Agent',
  ocm: 'OCM Agent'
};

// Generate unique AI insights based on entity name/type
function generateEntityInsight(entityType: string, entityId: string): { aiInsight: string; summary: string } {
  const entityName = entityId.toLowerCase();
  
  // KPI-specific insights
  if (entityName.includes('estimation') || entityName.includes('accuracy')) {
    return {
      aiInsight: "Strong forecasting performance detected. VRO agent analysis shows 89% estimation accuracy, a 3% improvement from last quarter. PMO agent correlates this with better requirements clarity and sprint planning maturity. Recommend maintaining current estimation practices.",
      summary: "Estimation accuracy is on track at 89%. The VRO agent identified positive trends in forecasting precision, while PMO agent confirms improved sprint predictability. 2 projects are contributing to this improvement."
    };
  }
  
  if (entityName.includes('cost') || entityName.includes('variance') || entityName.includes('budget')) {
    return {
      aiInsight: "Budget overrun alert. FinOps agent detected 40.8% cost variance against 5% target threshold. Root cause analysis points to scope changes in Q3 and unplanned infrastructure costs. Recommend immediate cost control measures and scope freeze.",
      summary: "Cost variance is over budget at 40.8%. FinOps agent flagged this as critical. VRO agent estimates $2.3M value at risk if not addressed. 4 projects are contributing to the overrun."
    };
  }
  
  if (entityName.includes('dependency') || entityName.includes('health')) {
    return {
      aiInsight: "Critical dependency risk identified. PMO agent flagged 4 blocking dependencies affecting 6 downstream projects. TMO agent analysis shows 58% dependency health score, below the 85% threshold. Immediate escalation recommended to unblock critical path.",
      summary: "Dependency health is at risk at 58%. PMO agent identified integration delays as primary cause. Planning agent recommends parallel workstreams to mitigate impact. 6 projects affected."
    };
  }
  
  if (entityName.includes('status') || entityName.includes('confidence')) {
    return {
      aiInsight: "High confidence in reported project status. VRO agent cross-validated data from 3 source systems (Jira, ServiceNow, PowerBI). Status confidence at 87% indicates reliable reporting. Governance agent confirms audit trail integrity.",
      summary: "Status confidence is high at 87%. Multiple agents validated this through cross-system analysis. Data freshness is within acceptable thresholds. 12 projects contribute to this metric."
    };
  }
  
  if (entityName.includes('roi') || entityName.includes('value')) {
    return {
      aiInsight: "Value realization trending positive. VRO agent calculates portfolio ROI at 127%, exceeding 100% target. FinOps agent confirms cost savings of $4.2M realized YTD. Recommend accelerating high-performing initiatives.",
      summary: "ROI performance is strong at 127%. VRO agent identified 3 initiatives exceeding expectations. FinOps validates financial impact. 8 projects driving positive returns."
    };
  }
  
  if (entityName.includes('risk') || entityName.includes('mitigation')) {
    return {
      aiInsight: "Risk mitigation actions required. Governance agent identified 12 active risks, 3 rated as critical. VRO agent estimates $1.8M potential value impact. Recommend immediate risk review with stakeholders.",
      summary: "Risk exposure is elevated with 3 critical items. Governance agent tracking mitigation progress at 67%. OCM agent flagged change resistance as emerging risk factor."
    };
  }
  
  // Default insight for other entity types
  return {
    aiInsight: `This ${entityType} has been analyzed by multiple AI agents. The VRO agent identified key value implications while the PMO agent assessed delivery impact. Confidence level is high based on cross-validation of multiple data sources.`,
    summary: `Comprehensive analysis of this ${entityType} entity shows active monitoring by 3 agents. The system has identified 4 recommended actions based on current state and historical patterns.`
  };
}

// Helper function to look up SAFe entities by ID
function lookupSAFeEntity(entityType: string, entityId: string) {
  switch (entityType) {
    case 'feature':
      return features.find(f => f.id === entityId);
    case 'story':
      return stories.find(s => s.id === entityId);
    case 'task':
      return tasks.find(t => t.id === entityId);
    case 'epic':
      return portfolioEpics.find(e => e.id === entityId);
    case 'theme':
      return strategicThemes.find(t => t.id === entityId);
    case 'value-stream':
      return valueStreams.find(vs => vs.id === entityId);
    case 'team':
      return teams.find(t => t.id === entityId);
    case 'resource':
      return teamMembers.find(m => m.id === entityId);
    default:
      return null;
  }
}

// Build drill-down data for SAFe entities
function buildSAFeDrilldown(entityType: string, entityId: string, entity: any) {
  const baseData = {
    entityType,
    entityId,
    entityName: entity.name || entity.title || entityId,
    bu: 'Enterprise',
    relatedAgents: ['integrated-management', 'planning'] as AgentType[],
    events: [],
    actions: [],
    history: [],
  };

  switch (entityType) {
    case 'feature':
      const feature = entity as Feature;
      const parentEpic = portfolioEpics.find(e => e.linkedFeatures.includes(feature.id));
      const featureStories = stories.filter(s => s.featureId === feature.id);
      return {
        ...baseData,
        entityName: feature.title,
        metrics: {
          'Status': feature.status,
          'Story Points': feature.storyPoints.toString(),
          'Progress': `${feature.completedPoints}/${feature.storyPoints} pts`,
          'Stories': featureStories.length.toString(),
          'Parent Epic': parentEpic?.name || 'None'
        },
        aiInsight: `Feature "${feature.title}" is ${feature.status}. ${featureStories.length} stories attached with ${feature.completedPoints}/${feature.storyPoints} story points completed.`,
        summary: feature.description || 'Feature in the SAFe portfolio.',
        relatedEntities: featureStories.map(s => ({
          type: 'Story',
          id: s.id,
          name: s.title,
          status: s.status === 'done' ? 'green' : s.status === 'in-progress' ? 'amber' : 'yellow'
        })),
        traceability: {
          sourceSystem: 'SAFe Portfolio',
          sourceId: feature.id,
          triggeredBy: 'Feature Drilldown',
          dataInputs: [{ source: 'Agile Backlog', freshness: '< 1 min' }],
          linkedProjects: parentEpic ? [{ id: parentEpic.id, name: parentEpic.name, status: parentEpic.status === 'implementing' ? 'green' : 'amber' }] : []
        }
      };

    case 'story':
      const story = entity as Story;
      const storyTasks = tasks.filter(t => t.storyId === story.id);
      const parentFeature = features.find(f => f.id === story.featureId);
      return {
        ...baseData,
        entityName: story.title,
        metrics: {
          'Status': story.status,
          'Story Points': story.storyPoints.toString(),
          'Tasks': storyTasks.length.toString(),
          'Priority': story.priority,
          'Parent Feature': parentFeature?.title || 'None'
        },
        aiInsight: `Story "${story.title}" is ${story.status}. ${storyTasks.length} tasks attached.`,
        summary: story.acceptanceCriteria?.join('; ') || 'User story in the backlog.',
        relatedEntities: storyTasks.map(t => ({
          type: 'Task',
          id: t.id,
          name: t.title,
          status: t.status === 'done' ? 'green' : t.status === 'in-progress' ? 'amber' : 'yellow'
        })),
        traceability: {
          sourceSystem: 'SAFe Portfolio',
          sourceId: story.id,
          triggeredBy: 'Story Drilldown',
          dataInputs: [{ source: 'Sprint Backlog', freshness: '< 1 min' }],
          linkedProjects: parentFeature ? [{ id: parentFeature.id, name: parentFeature.title, status: 'green' }] : []
        }
      };

    case 'task':
      const task = entity as Task;
      const parentStory = stories.find(s => s.id === task.storyId);
      const assignee = teamMembers.find(m => m.id === task.assigneeId);
      return {
        ...baseData,
        entityName: task.title,
        metrics: {
          'Status': task.status,
          'Estimated Hours': task.estimatedHours.toString(),
          'Actual Hours': task.actualHours?.toString() || '0',
          'Assignee': assignee?.name || 'Unassigned',
          'Parent Story': parentStory?.title || 'None'
        },
        aiInsight: `Task "${task.title}" is ${task.status}. Estimated ${task.estimatedHours}h, actual ${task.actualHours || 0}h.`,
        summary: task.description || 'Development task.',
        relatedEntities: assignee ? [{
          type: 'Resource',
          id: assignee.id,
          name: assignee.name,
          status: 'green'
        }] : [],
        traceability: {
          sourceSystem: 'SAFe Portfolio',
          sourceId: task.id,
          triggeredBy: 'Task Drilldown',
          dataInputs: [{ source: 'Task Board', freshness: '< 1 min' }],
          linkedProjects: parentStory ? [{ id: parentStory.id, name: parentStory.title, status: 'green' }] : []
        }
      };

    case 'agent':
      return {
        ...baseData,
        entityName: agentNames[entityId as AgentType] || entityId,
        metrics: {
          'Status': 'Active',
          'Actions Today': Math.floor(Math.random() * 20 + 5).toString(),
          'Monitored Entities': Math.floor(Math.random() * 50 + 10).toString(),
          'Confidence': `${Math.floor(Math.random() * 15 + 80)}%`
        },
        aiInsight: `${agentNames[entityId as AgentType] || entityId} is actively monitoring portfolio health and generating insights.`,
        summary: `AI agent responsible for autonomous monitoring and recommendations.`,
        relatedEntities: [],
        traceability: {
          sourceSystem: 'Agent Engine',
          sourceId: entityId,
          triggeredBy: 'Agent Drilldown',
          dataInputs: [{ source: 'Real-time Metrics', freshness: '< 1 min' }],
          linkedProjects: []
        }
      };

    default:
      return {
        ...baseData,
        metrics: { 'Type': entityType, 'ID': entityId },
        aiInsight: `Entity ${entityId} is being monitored.`,
        summary: `SAFe entity of type ${entityType}.`,
        relatedEntities: [],
        traceability: {
          sourceSystem: 'SAFe Portfolio',
          sourceId: entityId,
          triggeredBy: 'Entity Drilldown',
          dataInputs: [],
          linkedProjects: []
        }
      };
  }
}

// Registry-based content renderer for action playbooks, metric dossiers, etc.
interface RegistryContentProps {
  content: DrilldownContent;
  onNavigate?: (entityType: string, entityId: string) => void;
}

function RegistryContentRenderer({ content, onNavigate }: RegistryContentProps) {
  const handleActionClick = (action: { targetEntityType?: string; targetEntityId?: string; type: string }) => {
    if (onNavigate && action.targetEntityType && action.targetEntityId) {
      onNavigate(action.targetEntityType, action.targetEntityId);
    }
  };

  const handleRelatedItemClick = (item: { entityType: string; entityId: string }) => {
    if (onNavigate) {
      onNavigate(item.entityType, item.entityId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with AI insight */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600" />
            {content.title}
          </CardTitle>
          {content.subtitle && (
            <p className="text-xs text-teal-700">{content.subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{content.description}</p>
          {content.aiInsight && (
            <div className="mt-3 p-3 bg-white/80 rounded-lg border border-teal-100">
              <div className="flex items-start gap-2">
                <Brain size={14} className="text-teal-600 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600">{content.aiInsight}</p>
              </div>
              {content.agentSource && (
                <Badge className="mt-2 bg-teal-500 text-white text-xs">
                  {agentNames[content.agentSource] || content.agentSource}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      {content.metrics && content.metrics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {content.metrics.map((metric, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{metric.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: metric.color === 'teal' ? '#0d9488' : metric.color === 'blue' ? '#3b82f6' : undefined }}>
                      {metric.value}
                    </p>
                    {metric.trend && (
                      <span className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
                        {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {content.actions && content.actions.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              Available Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {content.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
                  onClick={() => handleActionClick(action)}
                  data-testid={`registry-action-${action.id}`}
                >
                  <div>
                    <p className="font-medium text-sm">{action.label}</p>
                    {action.description && (
                      <p className="text-xs text-gray-500">{action.description}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-amber-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Items */}
      {content.relatedItems && content.relatedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch size={16} className="text-indigo-500" />
              Related Items ({content.relatedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {content.relatedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleRelatedItemClick(item)}
                  data-testid={`registry-related-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'green' || item.status === 'on-track' ? 'bg-green-500' :
                      item.status === 'amber' || item.status === 'at-risk' ? 'bg-amber-500' :
                      item.status === 'red' || item.status === 'critical' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status && (
                      <Badge variant="outline" className="text-xs">
                        {item.status}
                      </Badge>
                    )}
                    <ChevronRight size={16} className="text-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation breadcrumb for deeper levels */}
      {content.level > 1 && content.parentEntity && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => onNavigate?.(content.parentEntity!.entityType, content.parentEntity!.entityId)}
          >
            ← Back to {content.parentEntity.entityType}
          </Button>
        </div>
      )}
    </div>
  );
}

export function DrillDownDrawer({ isOpen, onClose, entityType, entityId, dataMode = 'VRO', onNavigate }: DrillDownDrawerProps) {
  const [, setLocation] = useLocation();
  const { data: enrichedProjects = [] } = useEnrichedProjects();
  const [activeTab, setActiveTab] = useState('overview');
  const [agentActivities, setAgentActivities] = useState<AgentAction[]>([]);
  const [relatedInterventionId, setRelatedInterventionId] = useState<string | null>(null);
  
  // Fetch interventions to find one related to this entity for deep-linking
  useEffect(() => {
    if (!isOpen || !entityId) return;
    
    const fetchRelatedIntervention = async () => {
      try {
        const response = await fetch('/api/interventions');
        if (response.ok) {
          const interventions = await response.json();
          const entityLower = entityId.toLowerCase();
          
          // Find an intervention related to this entity with broad matching
          const match = interventions.find((i: any) => {
            // Match by project ID
            if (i.projectId === entityId) return true;
            // Match by project name
            if (i.projectName?.toLowerCase().includes(entityLower)) return true;
            if (entityLower.includes(i.projectName?.toLowerCase() || '')) return true;
            // Match by description
            if (i.description?.toLowerCase().includes(entityLower)) return true;
            // Match by agent ID or name containing entity
            if (i.agentId?.toLowerCase().includes(entityLower)) return true;
            return false;
          });
          
          if (match) {
            setRelatedInterventionId(match.id);
          } else {
            // Fallback: use the most recent pending intervention for visibility
            const pending = interventions.find((i: any) => i.status === 'pending');
            setRelatedInterventionId(pending?.id || null);
          }
        }
      } catch (e) {
        setRelatedInterventionId(null);
      }
    };
    fetchRelatedIntervention();
  }, [isOpen, entityId]);
  
  // Fetch and subscribe to agent activities for the History tab
  useEffect(() => {
    setAgentActivities(getActionLog().slice(0, 20));
    
    const unsubscribe = subscribeToActions((action) => {
      setAgentActivities(prev => [action, ...prev].slice(0, 20));
    });
    
    return () => unsubscribe();
  }, [entityId]);
  
  // Only call hook with valid entity type and id to prevent null returns
  const drilldownData = useEntityDrilldown(
    entityType || 'project', 
    entityId || ''
  );
  
  // Look up enriched project data by ID or exact name match only (no fuzzy matching)
  const enrichedProject: EnrichedProject | undefined = 
    entityType === 'project' 
      ? enrichedProjects.find(p => 
          p.id === entityId ||
          p.name.toLowerCase() === entityId.toLowerCase()
        )
      : undefined;
  
  // Look up portfolio data for Group Function entities
  const portfolioData: BUPortfolio | undefined = 
    entityType === 'portfolio'
      ? buPortfolios.find(p => p.id === entityId || p.name.toLowerCase() === entityId.toLowerCase())
      : undefined;
  
  // Look up SAFe entities for other entity types
  const safeEntity = lookupSAFeEntity(entityType, entityId);
  const safeDrilldown = safeEntity ? buildSAFeDrilldown(entityType, entityId, safeEntity) : null;

  // Look up registry content for actions, metrics, teams, agents, dependencies
  const registryContent = getDrilldownContent(entityType, entityId);

  // Don't render if drawer is not open or entity is not selected
  if (!isOpen || !entityType || !entityId) return null;
  
  // Determine if we should use registry-based rendering
  // Only use registry renderer for full dossiers (action playbooks, metrics, teams, etc.)
  // SAFe entities, projects, portfolios, and configured metrics use legacy renderer for richer detailed views
  const useRegistryRenderer = registryContent?.isFullDossier === true && 
    entityType !== 'project' && entityType !== 'portfolio' && entityType !== 'metric';
  
  // Create a fallback for project types using enriched project data
  const projectDrilldown = enrichedProject ? {
    entityType: 'project' as const,
    entityId: enrichedProject.id,
    entityName: enrichedProject.name,
    bu: enrichedProject.bu,
    relatedAgents: ['integrated-management' as AgentType, 'finops' as AgentType],
    events: [],
    metrics: {
      'Expected ROI': enrichedProject.expectedROI,
      'Priority': enrichedProject.priority.charAt(0).toUpperCase() + enrichedProject.priority.slice(1),
      'Status': enrichedProject.status === 'green' ? 'On Track' : enrichedProject.status === 'amber' ? 'At Risk' : 'Critical',
      'Stage': getStageLabel(enrichedProject.safeStage),
      'Budget': `${formatValueWithUnit(enrichedProject.budget.spent, enrichedProject.budget.unit)} / ${formatValueWithUnit(enrichedProject.budget.total, enrichedProject.budget.unit)}`,
      'Timeline': `${enrichedProject.timeline.elapsed}/${enrichedProject.timeline.total} ${enrichedProject.timeline.unit}`,
      'Deliverables': `${enrichedProject.deliverables.completed}/${enrichedProject.deliverables.total}`,
      'Velocity': enrichedProject.safe.velocity.toString(),
      'Predictability': `${enrichedProject.safe.predictability}%`
    },
    actions: enrichedProject.proactiveActions.map(a => ({
      id: a.id,
      label: a.action,
      type: a.type
    })),
    history: enrichedProject.aiSignals.map((s, i) => ({
      timestamp: new Date(Date.now() - i * 60000),
      action: s.message,
      agent: 'integrated-management' as AgentType
    })),
    aiInsight: enrichedProject.aiRecommendation,
    summary: enrichedProject.description,
    relatedEntities: enrichedProject.dependencies.map(d => ({
      type: d.type === 'blocks' ? 'Blocks' : d.type === 'blocked-by' ? 'Blocked By' : 'Related',
      id: d.projectId,
      name: d.projectName,
      status: d.health,
      description: d.description,
      impactIfDelayed: d.impactIfDelayed
    })),
    traceability: {
      sourceSystem: 'Enterprise PMO',
      sourceId: enrichedProject.id,
      triggeredBy: 'Project Dashboard',
      dataInputs: [
        { source: 'SAFe Metrics', freshness: '< 1 min' },
        { source: 'Budget Tracking', freshness: 'Daily' },
        { source: 'AI Analysis', freshness: '< 5 min' }
      ],
      linkedProjects: enrichedProject.dependencies.map(d => ({
        id: d.projectId,
        name: d.projectName,
        status: d.health
      }))
    }
  } : null;

  // Create specialized drilldown for metric entities
  const metricConfigs: Record<string, {
    label: string;
    category: 'VRO' | 'PMO';
    metrics: Record<string, string>;
    projectBreakdown: { name: string; value: string; budget: string }[];
    insight: string;
    summary: string;
  }> = {
    'current-roi': {
      label: 'Current ROI',
      category: 'VRO',
      metrics: {
        'Current Value': '64%',
        'Target': '85%',
        'Baseline (2024)': '0%',
        'Gap to Target': '-21%',
        'Variance': '+64% vs baseline',
        'Last Updated': new Date().toLocaleTimeString()
      },
      projectBreakdown: [
        { name: 'PRT Digital Intake', value: '+$8.2M', budget: '$12.4M' },
        { name: 'Claims Automation', value: '+$5.7M', budget: '$7.2M' },
        { name: 'Customer Portal', value: '+$4.1M', budget: '$6.8M' }
      ],
      insight: 'ROI is trending positive at 64% against an 85% target. VRO agent analysis shows 3 initiatives exceeding expectations, with Claims Automation delivering the highest marginal return. FinOps agent recommends reallocating $2.1M from underperforming initiatives to accelerate top performers.',
      summary: 'Portfolio ROI performance is on track. The VRO agent identified strong value realization from digital transformation initiatives, while FinOps validates cost efficiency improvements across 8 projects.'
    },
    'net-present-value': {
      label: 'Net Present Value',
      category: 'VRO',
      metrics: {
        'Current NPV': '$36.25M',
        'Target (5-year)': '$50M',
        'Discount Rate': '8.5%',
        'Confidence Level': '73%',
        'Variance': '+$36.25M',
        'Projection Period': '5 years'
      },
      projectBreakdown: [
        { name: 'Longevity Model Upgrade', value: '+$12.4M', budget: '$8.2M' },
        { name: 'Digital Workplace', value: '+$9.8M', budget: '$5.1M' },
        { name: 'API Gateway', value: '+$7.2M', budget: '$3.9M' }
      ],
      insight: 'NPV projection shows strong positive trajectory at $36.25M. VRO agent forecasts reaching $50M target within 18 months if current velocity is maintained. Risk-adjusted scenarios show 85% probability of achieving target.',
      summary: 'Net Present Value analysis indicates healthy portfolio value creation. FinOps agent confirms discount rate assumptions are conservative, suggesting actual returns may exceed projections.'
    },
    'timeline-progress': {
      label: 'Timeline Progress',
      category: 'VRO',
      metrics: {
        'Current Phase': 'Phase 2 of 4',
        'Progress': '69%',
        'Days Elapsed': '487 days',
        'Days Remaining': '243 days',
        'Variance': '-6% behind schedule',
        'Confidence': '82%'
      },
      projectBreakdown: [
        { name: 'Foundation Phase', value: 'Complete', budget: '100%' },
        { name: 'Build Phase', value: 'In Progress', budget: '68%' },
        { name: 'Integration Phase', value: 'Pending', budget: '0%' },
        { name: 'Rollout Phase', value: 'Pending', budget: '0%' }
      ],
      insight: 'Timeline is 6% behind target due to integration delays in Q3. TMO agent recommends parallel workstreams to recover schedule. Critical path analysis shows 3 blockers that need immediate attention.',
      summary: 'Phase 2 is 68% complete with key deliverables on track. Planning agent has identified opportunities to compress Phase 3 timeline through resource optimization.'
    },
    'budget-utilization': {
      label: 'Budget Utilization',
      category: 'VRO',
      metrics: {
        'Total Utilized': '$41.2M',
        'Total Budget': '$43.8M',
        'Utilization Rate': '94%',
        'Baseline (2024)': '$0',
        'Target (2026)': '$41.2M',
        'Remaining': '$2.6M',
        'Variance': '+6% efficiency gain'
      },
      projectBreakdown: [
        { name: 'Claims', value: '$12.2M', budget: '$14.2M' },
        { name: 'Digital', value: '$9.8M', budget: '$10.5M' },
        { name: 'Infrastructure', value: '$8.4M', budget: '$8.9M' },
        { name: 'Analytics', value: '$5.2M', budget: '$5.6M' },
        { name: 'Other', value: '$5.6M', budget: '$4.6M' }
      ],
      insight: 'Budget utilization is healthy at 94% with $2.6M remaining. FinOps agent detected 6% efficiency gains through vendor consolidation. Recommend reallocating $1.2M surplus to high-priority initiatives in Q4.',
      summary: 'Budget tracking shows strong fiscal discipline. FinOps agent confirms no overruns, with cost savings identified in infrastructure and licensing categories.'
    },
    'cycle-time': {
      label: 'Cycle Time',
      category: 'PMO',
      metrics: {
        'Current': '19 days',
        'Target': '10 days',
        'Baseline (2024)': '35 days',
        'Improvement': '46% reduction',
        'Gap to Target': '+9 days',
        'Trend': 'Improving'
      },
      projectBreakdown: [
        { name: 'Feature Development', value: '8.2 days', budget: '43%' },
        { name: 'Testing & QA', value: '4.8 days', budget: '25%' },
        { name: 'Code Review', value: '3.1 days', budget: '16%' },
        { name: 'Deployment', value: '2.9 days', budget: '15%' }
      ],
      insight: 'Cycle time has improved 46% from baseline but remains 9 days above target. TMO agent analysis shows testing bottleneck as primary cause. Recommend implementing parallel testing and automated regression suites.',
      summary: 'Cycle time trending positive with consistent week-over-week improvement. PMO agent forecasts reaching 15-day target by Q2 with current velocity.'
    },
    'flow-efficiency': {
      label: 'Flow Efficiency',
      category: 'PMO',
      metrics: {
        'Current': '69%',
        'Target': '50%',
        'Baseline (2024)': '45%',
        'Improvement': '+24%',
        'Active Time Ratio': '69:31',
        'Wait Time': '31%'
      },
      projectBreakdown: [
        { name: 'Development', value: '78%', budget: 'High' },
        { name: 'Testing', value: '62%', budget: 'Medium' },
        { name: 'Review', value: '54%', budget: 'Medium' },
        { name: 'Deployment', value: '82%', budget: 'High' }
      ],
      insight: 'Flow efficiency exceeds target at 69%, up from 45% baseline. Wait time reduced through improved handoff processes. TMO agent recommends maintaining current practices and focusing on testing phase optimization.',
      summary: 'Excellent flow efficiency performance. Lean/Agile metrics show reduced waste and improved value stream flow across all delivery teams.'
    },
    'throughput': {
      label: 'Throughput',
      category: 'PMO',
      metrics: {
        'Current': '11 items/week',
        'Target': '25 items/week',
        'Baseline (2024)': '8 items/week',
        'Improvement': '+38%',
        'Gap to Target': '-14 items',
        'Trend': 'Stable'
      },
      projectBreakdown: [
        { name: 'Features', value: '4 items', budget: '36%' },
        { name: 'Bug Fixes', value: '3 items', budget: '27%' },
        { name: 'Tech Debt', value: '2 items', budget: '18%' },
        { name: 'Enhancements', value: '2 items', budget: '18%' }
      ],
      insight: 'Throughput at 11 items/week shows 38% improvement from baseline. Gap to 25-item target requires capacity increase or scope reduction. TMO agent recommends team scaling and automation investments.',
      summary: 'Sprint analytics show consistent delivery with room for improvement. Planning agent identifies WIP limits as key lever for throughput gains.'
    },
    'wip-items': {
      label: 'WIP Items',
      category: 'PMO',
      metrics: {
        'Current WIP': '9 items',
        'WIP Limit': '12 items',
        'Utilization': '75%',
        'Available Slots': '3',
        'Baseline': '12 items',
        'Target': '8 items'
      },
      projectBreakdown: [
        { name: 'In Development', value: '4 items', budget: '44%' },
        { name: 'In Review', value: '2 items', budget: '22%' },
        { name: 'In Testing', value: '2 items', budget: '22%' },
        { name: 'Ready for Deploy', value: '1 item', budget: '11%' }
      ],
      insight: 'WIP is within healthy limits at 9/12 items. Kanban board shows balanced distribution across stages. TMO agent recommends maintaining current WIP limits to optimize flow.',
      summary: 'Work-in-progress management is effective. 3 slots available for new work intake without impacting flow efficiency.'
    },
    'vro-metric-001': {
      label: 'Strategic ROI',
      category: 'VRO',
      metrics: {
        'Current Value': '84%',
        'Target': '85%',
        'Baseline (2024)': '0%',
        'Gap to Target': '-1%',
        'Variance': '+84% vs baseline',
        'Last Updated': new Date().toLocaleTimeString()
      },
      projectBreakdown: [
        { name: 'Claims Digital Transformation', value: '+$12.4M', budget: '$18.2M' },
        { name: 'Customer Experience Platform', value: '+$8.7M', budget: '$12.1M' },
        { name: 'Operational Excellence', value: '+$5.2M', budget: '$7.8M' }
      ],
      insight: 'Strategic ROI is near target at 84%. VRO agent analysis shows digital transformation initiatives are driving the majority of returns. FinOps recommends continued investment in Claims and CX portfolios.',
      summary: 'Portfolio ROI performance is strong. The VRO agent identified 12 initiatives exceeding expectations with Claims Automation delivering the highest marginal return.'
    },
    'vro-metric-002': {
      label: 'Delivery Predictability',
      category: 'VRO',
      metrics: {
        'Current Value': '80%',
        'Target': '90%',
        'Baseline (2024)': '65%',
        'Gap to Target': '-10%',
        'Improvement': '+15% vs baseline',
        'Confidence': '89%'
      },
      projectBreakdown: [
        { name: 'Green Projects', value: '80%', budget: '65% of portfolio' },
        { name: 'Amber Projects', value: '72%', budget: '25% of portfolio' },
        { name: 'Red Projects', value: '58%', budget: '10% of portfolio' }
      ],
      insight: 'Delivery predictability at 80% shows 15% improvement from baseline. SAFe PI planning adoption has improved sprint commitment accuracy. TMO recommends focus on reducing scope volatility in amber projects.',
      summary: 'Predictability metrics trending positive with consistent quarter-over-quarter gains. Planning agent identifies capacity planning as key lever for improvement.'
    },
    'vro-metric-003': {
      label: 'OKR Achievement',
      category: 'VRO',
      metrics: {
        'Current Value': '88%',
        'Target': '80%',
        'Baseline (2024)': '60%',
        'Variance': '+28% vs baseline',
        'Objectives On Track': '3/4',
        'Key Results Met': '9/12'
      },
      projectBreakdown: [
        { name: 'Strategic Objective 1', value: '92%', budget: 'Critical' },
        { name: 'Strategic Objective 2', value: '87%', budget: 'High' },
        { name: 'Strategic Objective 3', value: '85%', budget: 'High' },
        { name: 'Strategic Objective 4', value: '78%', budget: 'Medium' }
      ],
      insight: 'OKR Achievement exceeds target at 88%. 3 of 4 strategic objectives are on track. OKR agent recommends focus on Objective 4 which is slightly behind target.',
      summary: 'Strong OKR performance with 9 of 12 Key Results at or above target. Cross-functional alignment has improved significantly.'
    },
    'vro-metric-004': {
      label: 'Delivery Success Rate',
      category: 'VRO',
      metrics: {
        'Current Value': '61%',
        'Target': '85%',
        'Baseline (2024)': '45%',
        'Gap to Target': '-24%',
        'Improvement': '+16% vs baseline',
        'Projects On Track': '14/23'
      },
      projectBreakdown: [
        { name: 'On Track (Green)', value: '14 projects', budget: '61%' },
        { name: 'At Risk (Amber)', value: '6 projects', budget: '26%' },
        { name: 'Critical (Red)', value: '3 projects', budget: '13%' }
      ],
      insight: 'Delivery success rate at 61% is improving but below target. 3 critical projects need immediate attention. TMO agent recommends focused intervention on red status initiatives.',
      summary: 'Project delivery showing improvement with 14 of 23 projects on track. Amber projects present recovery opportunities.'
    },
    'vro-metric-005': {
      label: 'Portfolio Velocity',
      category: 'VRO',
      metrics: {
        'Current Value': '53 pts',
        'Target': '55 pts',
        'Baseline (2024)': '42 pts',
        'Gap to Target': '-2 pts',
        'Improvement': '+11 pts vs baseline',
        'Sprint Commitment': '96%'
      },
      projectBreakdown: [
        { name: 'Enterprise Technology', value: '62 pts', budget: 'High' },
        { name: 'FPL', value: '51 pts', budget: 'Medium' },
        { name: 'Corporate', value: '48 pts', budget: 'Medium' },
        { name: 'NEER', value: '45 pts', budget: 'Medium' }
      ],
      insight: 'Portfolio velocity at 53 points is near target. Group Technology leads with highest velocity. Planning agent recommends cross-team knowledge sharing to improve velocity across business units.',
      summary: 'Velocity trending positive with 26% improvement from baseline. Sprint commitment at 96% indicates healthy capacity planning.'
    },
    'governance-decisions': {
      label: 'Decisions Complete',
      category: 'VRO',
      metrics: {
        'Completed': '3/4',
        'Pending Review': '1',
        'Avg Decision Time': '2.3 days',
        'On-Time Rate': '87%'
      },
      projectBreakdown: [
        { name: 'Grid Reliability Assessment', value: 'Complete', budget: 'On schedule' },
        { name: 'Energy Market Risk Review', value: 'Complete', budget: '1 day ahead' },
        { name: 'Regulatory Compliance Review', value: 'Complete', budget: 'On schedule' },
        { name: 'Environmental Compliance Audit', value: 'In Review', budget: 'Due in 4 days' }
      ],
      pendingAlerts: [],
      insight: '3 of 4 governance decisions completed this cycle. Environmental Compliance Audit is currently in review and expected to complete within SLA.',
      summary: 'Governance queue performing well with 87% on-time completion rate. One decision pending final review.'
    },
    'governance-pending': {
      label: 'Pending Actions',
      category: 'PMO',
      metrics: {
        'Pending Items': '4',
        'High Priority': '1',
        'Medium Priority': '2',
        'Low Priority': '1',
        'Oldest Item': '5 days'
      },
      projectBreakdown: [
        { name: 'Environmental Compliance Audit', value: 'High', budget: 'Due: 4 days' },
        { name: 'Q1 Rate Case Filing Review', value: 'Medium', budget: 'Due: 8 days' },
        { name: 'NERC CIP Attestation', value: 'Medium', budget: 'Due: 12 days' },
        { name: 'Board ESG Report Approval', value: 'Low', budget: 'Due: 20 days' }
      ],
      pendingAlerts: [
        { id: 'pending-1', title: 'Environmental Compliance Audit', severity: 'critical', description: 'EPA submission deadline approaching', dueDate: '4 days', actionLabel: 'Start Audit', agent: 'Governance Agent' },
        { id: 'pending-2', title: 'Q1 Rate Case Filing Review', severity: 'warning', description: 'Florida PSC rate case documentation', dueDate: '8 days', actionLabel: 'Begin Review', agent: 'Governance Agent' },
        { id: 'pending-3', title: 'NERC CIP Attestation', severity: 'warning', description: 'Annual cybersecurity compliance attestation', dueDate: '12 days', actionLabel: 'Schedule', agent: 'TMO Agent' },
        { id: 'pending-4', title: 'Board ESG Report Approval', severity: 'info', description: 'Q4 sustainability metrics for board', dueDate: '20 days', actionLabel: 'Prepare Report', agent: 'Integrated Management Agent' }
      ],
      insight: 'Environmental Compliance Audit requires immediate attention - currently 1 day from due date. NERC CIP Attestation on track but needs scheduling.',
      summary: '4 governance actions pending. Governance Agent recommends prioritizing Environmental Compliance Audit to maintain SLA compliance.'
    },
    'governance-compliance': {
      label: 'Compliance Score',
      category: 'VRO',
      metrics: {
        'Current Score': '93%',
        'Target': '95%',
        'FERC Compliance': '98%',
        'EPA Compliance': '91%',
        'NERC CIP': '94%',
        'State PSC': '89%'
      },
      projectBreakdown: [
        { name: 'FERC Regulatory Compliance', value: '98%', budget: 'Excellent' },
        { name: 'NERC CIP Cybersecurity', value: '94%', budget: 'On Track' },
        { name: 'EPA Environmental', value: '91%', budget: 'Needs Attention' },
        { name: 'Florida PSC Rate Case', value: '89%', budget: 'Under Review' }
      ],
      pendingAlerts: [
        { id: 'comp-1', title: 'EPA Environmental Gap', severity: 'warning', description: 'Emissions reporting 4% below target', dueDate: 'Ongoing', actionLabel: 'View Gap Analysis', agent: 'Governance Agent' },
        { id: 'comp-2', title: 'Florida PSC Rate Case', severity: 'info', description: 'Rate case filing under regulatory review', dueDate: 'Q2 2026', actionLabel: 'Track Status', agent: 'Risk Agent' }
      ],
      insight: 'Overall compliance at 93% with FERC leading at 98%. EPA and Florida PSC areas need focus to reach 95% target.',
      summary: 'Strong regulatory compliance posture. Governance Agent monitoring 4 active regulatory areas with automated tracking.'
    },
    'governance-high-risks': {
      label: 'High Risks',
      category: 'PMO',
      metrics: {
        'High Risks': '4',
        'Critical': '1',
        'Severe': '3',
        'Under Mitigation': '3',
        'New This Week': '1'
      },
      projectBreakdown: [
        { name: 'Hurricane Season Exposure', value: 'Critical', budget: '$1.2B potential impact' },
        { name: 'Renewable Project Delays', value: 'Severe', budget: '3 projects affected' },
        { name: 'NERC CIP Audit Finding', value: 'Severe', budget: 'Remediation in progress' },
        { name: 'Supply Chain Constraints', value: 'Severe', budget: 'Solar panel delays' }
      ],
      pendingAlerts: [
        { id: 'risk-1', title: 'Hurricane Season Exposure', severity: 'critical', description: 'Storm hardening 85% complete - accelerate remaining 15%', dueDate: 'June 1', actionLabel: 'View Mitigation Plan', agent: 'Risk Agent' },
        { id: 'risk-2', title: 'Renewable Project Delays', severity: 'warning', description: '3 solar projects delayed due to permitting', dueDate: 'Ongoing', actionLabel: 'Review Timeline', agent: 'TMO Agent' },
        { id: 'risk-3', title: 'NERC CIP Audit Finding', severity: 'warning', description: 'Substation access control remediation needed', dueDate: '30 days', actionLabel: 'Assign Resources', agent: 'Governance Agent' },
        { id: 'risk-4', title: 'Supply Chain Constraints', severity: 'warning', description: 'Solar panel delivery delays from suppliers', dueDate: 'Q2 2026', actionLabel: 'Contact Vendors', agent: 'Planning Agent' }
      ],
      insight: 'Hurricane Season Exposure is the highest risk with potential $1.2B impact. Storm hardening program 85% complete. 3 risks have active mitigation plans.',
      summary: '4 high-severity risks actively monitored. Risk Agent recommends accelerating storm hardening completion before peak season.'
    },
    'governance-cro': {
      label: 'CRO Overview',
      category: 'VRO',
      metrics: {
        'CRO': 'Rebecca Kujawa',
        'Risk Categories': '6',
        'Open Issues': '12',
        'Escalations': '2',
        'Last Review': 'Jan 15, 2026'
      },
      projectBreakdown: [
        { name: 'Operational Risk', value: '4 sub-risks', budget: 'Actively managed' },
        { name: 'Regulatory Risk', value: '4 sub-risks', budget: 'Under review' },
        { name: 'Market Risk', value: '4 sub-risks', budget: 'Monitored' },
        { name: 'Climate & Environmental', value: '3 sub-risks', budget: 'High priority' }
      ],
      pendingAlerts: [
        { id: 'cro-1', title: 'Executive Escalation: Grid Reliability', severity: 'critical', description: 'Requires CRO decision by end of week', dueDate: '3 days', actionLabel: 'Review & Decide', agent: 'Risk Agent' },
        { id: 'cro-2', title: 'Executive Escalation: Vendor Contract', severity: 'warning', description: 'Solar panel supplier renegotiation pending', dueDate: '7 days', actionLabel: 'Schedule Meeting', agent: 'FinOps Agent' }
      ],
      insight: 'Rebecca Kujawa oversees 6 risk categories with 12 open items. 2 items escalated to executive committee this week.',
      summary: 'Enterprise risk governance under CRO oversight. Next quarterly risk review scheduled for Feb 2026.'
    },
    'planning-phase': {
      label: 'Current Phase',
      category: 'PMO',
      metrics: {
        'Current Phase': '3/6',
        'Phase Name': 'Development',
        'Days Remaining': '45',
        'Milestones Complete': '8/12',
        'Critical Path Status': 'On Track'
      },
      projectBreakdown: [
        { name: 'Phase 1: Discovery', value: 'Complete', budget: 'On schedule' },
        { name: 'Phase 2: Design', value: 'Complete', budget: '2 days ahead' },
        { name: 'Phase 3: Development', value: 'In Progress', budget: '45 days remaining' },
        { name: 'Phase 4: Testing', value: 'Upcoming', budget: 'Starts Q2' }
      ],
      pendingAlerts: [
        { id: 'plan-1', title: 'Resource Constraint: Senior Developers', severity: 'warning', description: '3 senior devs needed for Phase 4 prep', dueDate: '14 days', actionLabel: 'Request Resources', agent: 'Planning Agent' },
        { id: 'plan-2', title: 'Dependency: API Integration', severity: 'info', description: 'Waiting on external API access from vendor', dueDate: '7 days', actionLabel: 'Follow Up', agent: 'TMO Agent' }
      ],
      insight: 'Development phase on track with 45 days remaining. Resource planning needed for upcoming testing phase.',
      summary: 'Phase 3 of 6 in progress. Planning Agent monitoring critical path and resource allocation.'
    },
    'planning-progress': {
      label: 'Overall Progress',
      category: 'VRO',
      metrics: {
        'Overall Progress': '67%',
        'Value Delivered': '$42M',
        'Remaining Work': '33%',
        'Sprint Velocity': '48 pts/sprint',
        'Projected Completion': 'Q3 2026'
      },
      projectBreakdown: [
        { name: 'FPL Projects', value: '72%', budget: 'Ahead' },
        { name: 'NEER Projects', value: '65%', budget: 'On Track' },
        { name: 'Corporate Projects', value: '61%', budget: 'Slight Delay' }
      ],
      pendingAlerts: [],
      insight: 'Portfolio progress at 67% with FPL leading. Corporate projects showing slight delay requiring attention.',
      summary: 'Overall program on track for Q3 2026 completion. VRO Agent validates $42M value delivered.'
    },
    'planning-budget': {
      label: 'Budget Status',
      category: 'VRO',
      metrics: {
        'Total Budget': '$156M',
        'YTD Spend': '$89.4M',
        'Utilization': '57%',
        'Forecast EOY': '$148M',
        'Variance': '-$8M under budget'
      },
      projectBreakdown: [
        { name: 'Technology Investments', value: '$52M', budget: '55% spent' },
        { name: 'Grid Modernization', value: '$64M', budget: '62% spent' },
        { name: 'Renewable Expansion', value: '$40M', budget: '48% spent' }
      ],
      pendingAlerts: [
        { id: 'budget-1', title: 'Underspend: Renewable Expansion', severity: 'info', description: 'Permitting delays causing budget lag', dueDate: 'Q2 review', actionLabel: 'Reallocate Funds', agent: 'FinOps Agent' }
      ],
      insight: 'Budget tracking $8M under plan. Renewable Expansion underspend due to permitting delays.',
      summary: 'Financial health strong with 57% utilization. FinOps Agent recommends reallocation review.'
    },
    'planning-deadlines': {
      label: 'Deadlines On Track',
      category: 'PMO',
      metrics: {
        'On Track': '8/12',
        'At Risk': '3',
        'Missed': '1',
        'Upcoming (30 days)': '4',
        'Critical Deadlines': '2'
      },
      projectBreakdown: [
        { name: 'Regulatory Filing', value: 'On Track', budget: 'Due: 21 days' },
        { name: 'System Cutover', value: 'At Risk', budget: 'Due: 35 days' },
        { name: 'Vendor Contract', value: 'At Risk', budget: 'Due: 14 days' },
        { name: 'Board Presentation', value: 'On Track', budget: 'Due: 28 days' }
      ],
      pendingAlerts: [
        { id: 'deadline-1', title: 'System Cutover at Risk', severity: 'critical', description: 'Integration testing behind schedule', dueDate: '35 days', actionLabel: 'Escalate to TMO', agent: 'Planning Agent' },
        { id: 'deadline-2', title: 'Vendor Contract Negotiation', severity: 'warning', description: 'Terms still under review', dueDate: '14 days', actionLabel: 'Schedule Call', agent: 'FinOps Agent' },
        { id: 'deadline-3', title: 'Q1 Milestone Missed', severity: 'warning', description: 'Data migration delayed 5 days', dueDate: 'Completed late', actionLabel: 'Document Lessons', agent: 'TMO Agent' }
      ],
      insight: '3 deadlines at risk requiring immediate attention. System Cutover is the most critical.',
      summary: '8 of 12 deadlines on track. Planning Agent recommending escalation for at-risk items.'
    },
    'planning-projects': {
      label: 'Active Projects',
      category: 'PMO',
      metrics: {
        'Active Projects': '18',
        'Green Status': '12',
        'Amber Status': '4',
        'Red Status': '2',
        'Resources Allocated': '142 FTEs'
      },
      projectBreakdown: [
        { name: 'Grid Modernization', value: 'Green', budget: '12 projects' },
        { name: 'Digital Transformation', value: 'Amber', budget: '4 projects' },
        { name: 'Regulatory Compliance', value: 'Green', budget: '2 projects' }
      ],
      pendingAlerts: [
        { id: 'proj-1', title: 'Red Project: Legacy Migration', severity: 'critical', description: 'Critical blocker on data validation', dueDate: 'Immediate', actionLabel: 'View Details', agent: 'TMO Agent' },
        { id: 'proj-2', title: 'Red Project: Customer Portal', severity: 'critical', description: 'Vendor resource gap impacting timeline', dueDate: '7 days', actionLabel: 'Request Support', agent: 'Planning Agent' }
      ],
      insight: '18 active projects with 2 in red status requiring executive attention.',
      summary: 'Portfolio health at 67% green. TMO Agent tracking 2 critical projects for recovery.'
    },
    'finops-budget': {
      label: 'Total Budget',
      category: 'VRO',
      metrics: {
        'Total Budget': '$2.4B',
        'Allocated': '$2.1B',
        'Unallocated': '$300M',
        'Contingency Reserve': '$180M',
        'Capital vs OpEx': '65% / 35%'
      },
      projectBreakdown: [
        { name: 'FPL Operations', value: '$1.2B', budget: '50% of total' },
        { name: 'NEER Investments', value: '$780M', budget: '33% of total' },
        { name: 'Corporate & Other', value: '$420M', budget: '17% of total' }
      ],
      pendingAlerts: [
        { id: 'fin-1', title: 'Budget Reallocation Request', severity: 'warning', description: 'NEER requesting $45M from contingency', dueDate: '10 days', actionLabel: 'Review Request', agent: 'FinOps Agent' },
        { id: 'fin-2', title: 'Quarterly Budget Review', severity: 'info', description: 'Q1 close-out variance analysis pending', dueDate: '5 days', actionLabel: 'Schedule Review', agent: 'FinOps Agent' }
      ],
      insight: '$2.4B total portfolio budget with strong allocation discipline. Contingency reserves healthy at $180M.',
      summary: 'Budget allocation on track. FinOps Agent monitoring reallocation request from NEER segment.'
    },
    'finops-spend': {
      label: 'YTD Spend',
      category: 'VRO',
      metrics: {
        'YTD Spend': '$892M',
        'Budget Utilization': '37%',
        'Monthly Run Rate': '$148M',
        'Projected EOY': '$2.2B',
        'Variance': '-$200M under'
      },
      projectBreakdown: [
        { name: 'Capital Projects', value: '$580M', budget: '65% of spend' },
        { name: 'Operating Expenses', value: '$312M', budget: '35% of spend' }
      ],
      pendingAlerts: [],
      insight: 'YTD spend at $892M with healthy utilization rate. Projected to finish $200M under budget.',
      summary: 'Spending discipline strong across all segments. FinOps Agent tracking monthly run rates.'
    },
    'finops-forecast': {
      label: 'Forecast',
      category: 'VRO',
      metrics: {
        'Current Forecast': '$2.2B',
        'Original Budget': '$2.4B',
        'Favorable Variance': '$200M',
        'Confidence Level': '87%',
        'Risk Adjustment': '-$50M'
      },
      projectBreakdown: [
        { name: 'Committed Spend', value: '$1.8B', budget: '82% of forecast' },
        { name: 'Planned Spend', value: '$320M', budget: '14% of forecast' },
        { name: 'Contingency', value: '$80M', budget: '4% of forecast' }
      ],
      pendingAlerts: [
        { id: 'fore-1', title: 'Forecast Model Update', severity: 'info', description: 'Incorporate Q1 actuals into projection', dueDate: '3 days', actionLabel: 'Run Update', agent: 'FinOps Agent' }
      ],
      insight: 'Forecast showing $200M favorable variance. High confidence at 87% based on committed spend.',
      summary: 'Financial outlook positive. FinOps Agent recommends updating model with Q1 actuals.'
    },
    'finops-savings': {
      label: 'Savings Identified',
      category: 'VRO',
      metrics: {
        'Total Savings': '$67M',
        'Realized': '$42M',
        'In Progress': '$18M',
        'Identified': '$7M',
        'ROI': '340%'
      },
      projectBreakdown: [
        { name: 'Procurement Optimization', value: '$28M', budget: 'Realized' },
        { name: 'Process Automation', value: '$22M', budget: 'In Progress' },
        { name: 'Vendor Consolidation', value: '$17M', budget: 'Identified' }
      ],
      pendingAlerts: [
        { id: 'save-1', title: 'Vendor Consolidation Opportunity', severity: 'info', description: '3 overlapping contracts identified', dueDate: '30 days', actionLabel: 'Review Contracts', agent: 'FinOps Agent' }
      ],
      insight: '$67M in savings identified with 63% already realized. Vendor consolidation next opportunity.',
      summary: 'Strong savings performance with 340% ROI. FinOps Agent tracking pipeline of opportunities.'
    },
    'finops-profit': {
      label: 'Group Profit',
      category: 'VRO',
      metrics: {
        'Total Profit': '$8.2B',
        'FPL Contribution': '$4.8B',
        'NEER Contribution': '$2.9B',
        'YoY Growth': '+12%',
        'Margin': '18.5%'
      },
      projectBreakdown: [
        { name: 'FPL Regulated', value: '$4.8B', budget: '59% of profit' },
        { name: 'NEER Clean Energy', value: '$2.9B', budget: '35% of profit' },
        { name: 'Corporate & Other', value: '$500M', budget: '6% of profit' }
      ],
      pendingAlerts: [],
      insight: '$8.2B group profit with strong 12% YoY growth. FPL regulated segment leading contribution.',
      summary: 'Profitability on track. VRO Agent monitoring value creation across all segments.'
    },
    'ocm-readiness': {
      label: 'Change Readiness',
      category: 'PMO',
      metrics: {
        'Overall Readiness': '72%',
        'Target': '85%',
        'Gap': '13%',
        'Trend': '+5% this month',
        'Survey Responses': '4,200'
      },
      projectBreakdown: [
        { name: 'Leadership Alignment', value: '89%', budget: 'Strong' },
        { name: 'Employee Awareness', value: '76%', budget: 'Good' },
        { name: 'Skill Readiness', value: '68%', budget: 'Developing' },
        { name: 'Cultural Adoption', value: '62%', budget: 'Needs Focus' }
      ],
      pendingAlerts: [
        { id: 'ocm-1', title: 'Cultural Adoption Gap', severity: 'warning', description: 'Field operations showing resistance', dueDate: 'Ongoing', actionLabel: 'Plan Intervention', agent: 'OCM Agent' },
        { id: 'ocm-2', title: 'Skill Training Needed', severity: 'info', description: '800 employees need digital skills training', dueDate: '45 days', actionLabel: 'Schedule Training', agent: 'OCM Agent' }
      ],
      insight: 'Change readiness at 72% with cultural adoption needing focused intervention.',
      summary: 'Positive trend at +5% monthly improvement. OCM Agent monitoring adoption barriers.'
    },
    'ocm-training': {
      label: 'Training Completion',
      category: 'PMO',
      metrics: {
        'Completion Rate': '78%',
        'Enrolled': '5,400',
        'Completed': '4,212',
        'In Progress': '890',
        'Not Started': '298'
      },
      projectBreakdown: [
        { name: 'Digital Tools Training', value: '92%', budget: 'Excellent' },
        { name: 'Process Change Training', value: '74%', budget: 'Good' },
        { name: 'Leadership Training', value: '85%', budget: 'Strong' },
        { name: 'Safety Compliance', value: '98%', budget: 'Complete' }
      ],
      pendingAlerts: [
        { id: 'train-1', title: 'Process Training Lag', severity: 'warning', description: '298 employees not started on mandatory training', dueDate: '21 days', actionLabel: 'Send Reminders', agent: 'OCM Agent' }
      ],
      insight: '78% training completion with Safety Compliance leading at 98%.',
      summary: 'Training program on track. OCM Agent tracking 298 employees needing completion reminders.'
    },
    'ocm-sentiment': {
      label: 'Stakeholder Sentiment',
      category: 'PMO',
      metrics: {
        'Positive Groups': '4/6',
        'NPS Score': '+42',
        'Engagement Rate': '78%',
        'Concerns Addressed': '156/180',
        'Open Feedback': '24 items'
      },
      projectBreakdown: [
        { name: 'Executive Sponsors', value: 'Positive', budget: 'NPS +65' },
        { name: 'Middle Management', value: 'Neutral', budget: 'NPS +12' },
        { name: 'Field Operations', value: 'Mixed', budget: 'NPS -8' },
        { name: 'Corporate Staff', value: 'Positive', budget: 'NPS +48' }
      ],
      pendingAlerts: [
        { id: 'sent-1', title: 'Field Operations Concerns', severity: 'critical', description: 'Negative sentiment in 3 service territories', dueDate: 'Immediate', actionLabel: 'Schedule Town Halls', agent: 'OCM Agent' },
        { id: 'sent-2', title: 'Middle Management Neutral', severity: 'warning', description: 'Need more change champion engagement', dueDate: '14 days', actionLabel: 'Activate Champions', agent: 'OCM Agent' }
      ],
      insight: 'Field Operations showing negative NPS requiring immediate intervention.',
      summary: '4 of 6 stakeholder groups positive. OCM Agent recommending town halls for field operations.'
    },
    'ocm-satisfaction': {
      label: 'Avg Satisfaction',
      category: 'PMO',
      metrics: {
        'Overall Score': '4.2/5',
        'Content Quality': '4.5/5',
        'Instructor Rating': '4.6/5',
        'Relevance': '4.0/5',
        'Accessibility': '4.1/5'
      },
      projectBreakdown: [
        { name: 'Leadership Programs', value: '4.6/5', budget: 'Excellent' },
        { name: 'Technical Training', value: '4.3/5', budget: 'Good' },
        { name: 'Compliance Training', value: '3.8/5', budget: 'Needs Refresh' }
      ],
      pendingAlerts: [
        { id: 'sat-1', title: 'Compliance Training Feedback', severity: 'info', description: 'Participants requesting updated content', dueDate: '30 days', actionLabel: 'Review Curriculum', agent: 'OCM Agent' }
      ],
      insight: 'Training satisfaction at 4.2/5 with instructor ratings leading at 4.6.',
      summary: 'High satisfaction overall. OCM Agent reviewing compliance training curriculum updates.'
    },
    'ocm-staff': {
      label: 'Impacted Staff',
      category: 'PMO',
      metrics: {
        'Total Impacted': '16,500',
        'High Impact': '3,200',
        'Medium Impact': '8,400',
        'Low Impact': '4,900',
        'Support Ratio': '1:85'
      },
      projectBreakdown: [
        { name: 'FPL Operations', value: '9,200', budget: '56% of total' },
        { name: 'NEER Staff', value: '4,100', budget: '25% of total' },
        { name: 'Corporate', value: '3,200', budget: '19% of total' }
      ],
      pendingAlerts: [],
      insight: '16,500 employees impacted with 3,200 in high-impact roles requiring intensive support.',
      summary: 'Change support team maintaining 1:85 ratio. OCM Agent monitoring high-impact group closely.'
    },
    'tmo-adoption': {
      label: 'Overall Adoption',
      category: 'PMO',
      metrics: {
        'Adoption Rate': '74%',
        'Target': '85%',
        'Gap': '11%',
        'Weekly Active Users': '12,400',
        'Trend': '+3% this week'
      },
      projectBreakdown: [
        { name: 'Digital Workflows', value: '82%', budget: 'Strong' },
        { name: 'Analytics Platform', value: '71%', budget: 'Growing' },
        { name: 'Collaboration Tools', value: '78%', budget: 'Good' },
        { name: 'Mobile Apps', value: '65%', budget: 'Emerging' }
      ],
      pendingAlerts: [
        { id: 'tmo-1', title: 'Mobile App Adoption Low', severity: 'warning', description: 'Field crews underutilizing mobile tools', dueDate: 'Ongoing', actionLabel: 'Plan Campaign', agent: 'TMO Agent' },
        { id: 'tmo-2', title: 'Analytics Training Gap', severity: 'info', description: '400 users need advanced analytics training', dueDate: '21 days', actionLabel: 'Schedule Sessions', agent: 'TMO Agent' }
      ],
      insight: 'Overall adoption at 74% with mobile apps showing lowest uptake at 65%.',
      summary: 'Positive adoption trend at +3% weekly. TMO Agent focusing on mobile app adoption campaign.'
    },
    'tmo-users': {
      label: 'Active Users',
      category: 'PMO',
      metrics: {
        'Total Users': '14,200',
        'Daily Active': '8,900',
        'Weekly Active': '12,400',
        'Power Users': '1,850',
        'New This Month': '420'
      },
      projectBreakdown: [
        { name: 'FPL Users', value: '8,100', budget: '57% of total' },
        { name: 'NEER Users', value: '3,800', budget: '27% of total' },
        { name: 'Corporate Users', value: '2,300', budget: '16% of total' }
      ],
      pendingAlerts: [],
      insight: '14,200 total users with 63% daily active rate indicating healthy engagement.',
      summary: 'User base growing with 420 new users this month. TMO Agent tracking power user growth.'
    },
    'tmo-initiatives': {
      label: 'Complete Initiatives',
      category: 'PMO',
      metrics: {
        'Complete': '8/12',
        'In Progress': '3',
        'At Risk': '1',
        'Value Delivered': '$86M',
        'Remaining Value': '$42M'
      },
      projectBreakdown: [
        { name: 'Workflow Automation', value: 'Complete', budget: '$32M value' },
        { name: 'Data Platform', value: 'Complete', budget: '$28M value' },
        { name: 'Customer Portal', value: 'In Progress', budget: '$18M value' },
        { name: 'Field Mobility', value: 'At Risk', budget: '$8M value' }
      ],
      pendingAlerts: [
        { id: 'init-1', title: 'Field Mobility at Risk', severity: 'critical', description: 'Device procurement delays impacting rollout', dueDate: '30 days', actionLabel: 'Expedite Procurement', agent: 'TMO Agent' }
      ],
      insight: '8 of 12 initiatives complete delivering $86M in value. Field Mobility at risk.',
      summary: '67% initiative completion rate. TMO Agent escalating Field Mobility procurement issue.'
    },
    'tmo-value': {
      label: 'Value Impact',
      category: 'VRO',
      metrics: {
        'Total Value': '$128M',
        'Realized': '$86M',
        'Projected': '$42M',
        'Cost Savings': '$62M',
        'Revenue Impact': '$66M'
      },
      projectBreakdown: [
        { name: 'Operational Efficiency', value: '$48M', budget: 'Realized' },
        { name: 'Customer Experience', value: '$38M', budget: 'Realized' },
        { name: 'New Capabilities', value: '$42M', budget: 'Projected' }
      ],
      pendingAlerts: [],
      insight: '$128M total value impact with 67% already realized. On track to exceed targets.',
      summary: 'Value realization exceeding expectations. VRO Agent validating projected value pipeline.'
    },
    'tmo-at-risk': {
      label: 'At Risk Items',
      category: 'PMO',
      metrics: {
        'At Risk Count': '3',
        'Critical': '1',
        'High': '1',
        'Medium': '1',
        'Value at Risk': '$12M'
      },
      projectBreakdown: [
        { name: 'Field Mobility', value: 'Critical', budget: '$8M at risk' },
        { name: 'Analytics Rollout', value: 'High', budget: '$3M at risk' },
        { name: 'Training Platform', value: 'Medium', budget: '$1M at risk' }
      ],
      pendingAlerts: [
        { id: 'atrisk-1', title: 'Field Mobility Critical', severity: 'critical', description: 'Device shortage blocking Phase 2 rollout', dueDate: 'Immediate', actionLabel: 'Emergency Meeting', agent: 'TMO Agent' },
        { id: 'atrisk-2', title: 'Analytics Rollout Delayed', severity: 'warning', description: 'Data quality issues in 2 regions', dueDate: '14 days', actionLabel: 'Assign Data Team', agent: 'TMO Agent' },
        { id: 'atrisk-3', title: 'Training Platform Upgrade', severity: 'info', description: 'Vendor timeline slipped by 2 weeks', dueDate: '30 days', actionLabel: 'Negotiate Timeline', agent: 'Planning Agent' }
      ],
      insight: '3 items at risk with $12M value exposure. Field Mobility is most critical.',
      summary: 'Risk exposure manageable. TMO Agent coordinating recovery actions across all at-risk items.'
    }
  };
  
  type GovernanceAlert = {
    id: string;
    title: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    dueDate: string;
    actionLabel: string;
    agent: string;
  };

  const metricConfig = entityType === 'metric' ? metricConfigs[entityId] : null;
  
  const metricDrilldown = metricConfig ? {
    entityType: 'metric' as const,
    entityId,
    entityName: `${metricConfig.label} - Full Traceability`,
    bu: metricConfig.category === 'VRO' ? 'Value Realization Office' : 'Project Management Office',
    relatedAgents: metricConfig.category === 'VRO' 
      ? ['integrated-management' as AgentType, 'finops' as AgentType, 'okr' as AgentType]
      : ['integrated-management' as AgentType, 'tmo' as AgentType, 'planning' as AgentType],
    events: [],
    metrics: metricConfig.metrics,
    projectBreakdown: metricConfig.projectBreakdown,
    actions: (metricConfig as any).pendingAlerts?.length > 0 ? [] : [
      { id: 'analyze', label: 'Deep Dive Analysis', type: 'investigate' },
      { id: 'forecast', label: 'Run Forecast Scenario', type: 'accelerate' },
      { id: 'alert', label: 'Set Alert Threshold', type: 'mitigate' },
      { id: 'report', label: 'Generate Report', type: 'escalate' }
    ],
    pendingAlerts: (metricConfig as any).pendingAlerts || [],
    history: [
      { timestamp: new Date(Date.now() - 300000), action: 'Metric data refreshed from source systems', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 180000), action: 'Cross-validated with historical trends', agent: 'finops' as AgentType },
      { timestamp: new Date(Date.now() - 60000), action: 'AI analysis and recommendations generated', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(), action: 'Dashboard updated with latest values', agent: 'integrated-management' as AgentType }
    ],
    aiInsight: metricConfig.insight,
    summary: metricConfig.summary,
    relatedEntities: (metricConfig as any).pendingAlerts?.length > 0 ? [] : [
      { type: 'Portfolio', id: 'PF-TMO', name: 'Transformation Office Portfolio' },
      { type: 'OKR', id: 'OKR-Q4-01', name: 'Improve Operational Efficiency' },
      { type: 'Project', id: 'PRJ-DIG-001', name: 'Digital Transformation Initiative' }
    ],
    traceability: {
      sourceSystem: metricConfig.category === 'VRO' ? 'VRO Analytics' : 'PMO Flow Metrics',
      sourceId: `MET-${entityId.toUpperCase().slice(0, 8)}`,
      triggeredBy: 'Dashboard Metric Card',
      dataInputs: [
        { source: metricConfig.category === 'VRO' ? 'Financial Systems' : 'Jira/Azure DevOps', freshness: '< 1 min' },
        { source: 'Historical Analytics', freshness: 'Daily refresh' },
        { source: 'AI Prediction Engine', freshness: '< 5 min' }
      ],
      linkedProjects: metricConfig.projectBreakdown.slice(0, 3).map((p, i) => ({
        id: `PRJ-${String(i + 1).padStart(3, '0')}`,
        name: p.name,
        status: i === 0 ? 'green' : i === 1 ? 'amber' : 'green'
      }))
    }
  } : null;
  
  // Create a fallback for unsupported entity types
  // Only create if registryContent exists (non-null) - otherwise show unavailable state
  const hasRegistryData = registryContent !== null;
  
  const registryMetrics = registryContent?.metrics?.reduce((acc, m) => ({
    ...acc,
    [m.label]: m.value
  }), {} as Record<string, string>) || {};
  
  const registryActions = registryContent?.actions?.map(a => ({
    id: a.id,
    label: a.label,
    type: a.type
  })) || [];
  
  // Only create fallback if we have registry data to populate it
  // This prevents fabricated content for unknown entities
  const fallbackDrilldown = (!drilldownData && !projectDrilldown && !metricDrilldown && hasRegistryData) ? {
    entityType: entityType as 'project' | 'program' | 'risk' | 'portfolio',
    entityId,
    entityName: registryContent?.title || `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Details`,
    bu: registryContent?.subtitle || 'VRO Strategy Dashboard',
    relatedAgents: [registryContent?.agentSource || 'integrated-management' as AgentType],
    events: [],
    metrics: registryMetrics,
    actions: registryActions,
    history: [
      { timestamp: new Date(Date.now() - 5000), action: 'Data collected from source systems', agent: registryContent?.agentSource || 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 1000), action: 'Analysis completed', agent: registryContent?.agentSource || 'integrated-management' as AgentType },
      { timestamp: new Date(), action: 'Content loaded from registry', agent: 'integrated-management' as AgentType }
    ],
    aiInsight: registryContent?.aiInsight || '',
    summary: registryContent?.description || '',
    relatedEntities: registryContent?.relatedItems?.slice(0, 5).map(item => ({
      type: item.type,
      id: item.id,
      name: item.name,
      status: item.status,
      entityType: item.entityType,
      entityId: item.entityId
    })) || [],
    traceability: {
      sourceSystem: 'VRO Registry',
      sourceId: `${entityType}-${String(entityId).slice(0, 8)}`,
      triggeredBy: 'Navigation',
      dataInputs: [
        { source: 'Registry Dossier', freshness: '< 1 min' }
      ],
      linkedProjects: []
    }
  } : null;
  
  // Unavailable state for entities without any data source
  const isContentUnavailable = !drilldownData && !projectDrilldown && !metricDrilldown && !safeDrilldown && !hasRegistryData;
  
  // Priority: metricDrilldown first (for configured metrics), then projectDrilldown, then drilldownData, then fallback
  const displayData = metricDrilldown || projectDrilldown || safeDrilldown || drilldownData || fallbackDrilldown;
  
  // Show explicit unavailable state when no content source exists
  if (isContentUnavailable) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b z-10">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <Badge variant="outline" className="mb-1 text-xs">
                      {entityType.toUpperCase()}
                    </Badge>
                    <h2 className="text-lg font-bold">{entityType.charAt(0).toUpperCase() + entityType.slice(1).replace(/-/g, ' ')}</h2>
                    <p className="text-sm text-gray-500">ID: {String(entityId).slice(0, 20)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X size={20} />
                  </Button>
                </div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <AlertTriangle size={32} className="text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Not Available</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm">
                  Detailed information for this {entityType.replace(/-/g, ' ')} is not yet configured in the system.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" onClick={onClose} className="w-full">
                    Close Panel
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
  
  if (!displayData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between p-4">
                <div>
                  <Badge variant="outline" className="mb-1 text-xs">
                    {entityType.toUpperCase()}
                  </Badge>
                  <h2 className="text-lg font-bold">{displayData.entityName}</h2>
                  <p className="text-sm text-gray-500">{displayData.bu}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>
            </div>

            <div className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="ai-analysis" className="flex-1">AI Analysis</TabsTrigger>
                  <TabsTrigger value="traceability" className="flex-1">Traceability</TabsTrigger>
                  <TabsTrigger value="agents" className="flex-1">Agents</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  {/* Use registry-based rendering for action/metric/team/dependency entities */}
                  {useRegistryRenderer && registryContent ? (
                    <RegistryContentRenderer content={registryContent} onNavigate={onNavigate} />
                  ) : (
                  <div className="space-y-4 drilldown-overview">
                    {/* PROJECT-SPECIFIC: VRO VALUE + PMO DELIVERY dual-lane metrics */}
                    {entityType === 'project' && enrichedProject && (
                      <>
                        {/* Dual-lane metrics matching project card */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* VRO VALUE section (teal) */}
                          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <div className="flex items-center gap-1 mb-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500" />
                              <span className="text-[10px] font-bold text-teal-700">VRO VALUE</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-teal-600">ROI</span>
                                <span className="text-sm font-bold text-teal-700">{enrichedProject.expectedROI}</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-teal-600">Realized</span>
                                <span className="text-sm font-bold text-emerald-700">${Math.round(enrichedProject.budget.spent * 0.6)}m</span>
                              </div>
                              <Progress value={60} className="h-1.5 mt-1" />
                            </div>
                          </div>
                          
                          {/* PMO DELIVERY section (blue) */}
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-1 mb-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-[10px] font-bold text-blue-700">PMO DELIVERY</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-blue-600">Budget</span>
                                <span className="text-sm font-bold text-blue-700">{Math.round((enrichedProject.budget.spent / enrichedProject.budget.total) * 100)}%</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-blue-600">Timeline</span>
                                <span className="text-sm font-bold text-blue-700">{Math.round((enrichedProject.timeline.elapsed / enrichedProject.timeline.total) * 100)}%</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-blue-600">Done</span>
                                <span className="text-sm font-bold text-gray-700">{enrichedProject.deliverables.completed}/{enrichedProject.deliverables.total}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SAFe 6.0 metrics row */}
                        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GitBranch size={14} className="text-purple-600" />
                              <span className="text-xs font-bold text-purple-700">SAFe 6.0 | {enrichedProject.safe.currentPI}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-purple-100 border-purple-300 text-purple-700">
                              {enrichedProject.safe.epicId}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-white rounded shadow-sm">
                              <p className="text-lg font-bold text-purple-700">{enrichedProject.safe.velocity}</p>
                              <p className="text-[10px] text-gray-500">Velocity</p>
                            </div>
                            <div className="p-2 bg-white rounded shadow-sm">
                              <p className="text-lg font-bold text-purple-700">{enrichedProject.safe.predictability}%</p>
                              <p className="text-[10px] text-gray-500">Predict.</p>
                            </div>
                            <div className="p-2 bg-white rounded shadow-sm">
                              <p className="text-lg font-bold text-purple-700">{enrichedProject.safe.flowEfficiency}%</p>
                              <p className="text-[10px] text-gray-500">Flow</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* PORTFOLIO-SPECIFIC: VRO VALUE + PMO DELIVERY dual-lane metrics for Group Functions */}
                    {entityType === 'portfolio' && portfolioData && (
                      <>
                        <div className="grid grid-cols-2 gap-3" data-testid="portfolio-metrics">
                          {/* VRO VALUE section (teal) */}
                          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <div className="flex items-center gap-1 mb-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500" />
                              <span className="text-[10px] font-bold text-teal-700">VRO VALUE</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-teal-600">Realized</span>
                                <span className="text-sm font-bold text-teal-700">${portfolioData.valueRealized}m</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-teal-600">Programs</span>
                                <span className="text-sm font-bold text-teal-700">{portfolioData.programCount}</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-teal-600">Value Score</span>
                                <span className="text-sm font-bold text-teal-700">{portfolioData.healthScore}%</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* PMO DELIVERY section (blue) */}
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-1 mb-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-[10px] font-bold text-blue-700">PMO DELIVERY</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-blue-600">Projects</span>
                                <span className="text-sm font-bold text-blue-700">{portfolioData.projectCount}</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-blue-600">On-Time</span>
                                <span className="text-sm font-bold text-blue-700">{portfolioData.predictability}%</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-blue-600">EPICs</span>
                                <span className="text-sm font-bold text-blue-700">{portfolioData.activeEpics}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SAFe 6.0 metrics row */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200" data-testid="portfolio-safe-metrics">
                          <div className="text-center p-2 bg-white rounded shadow-sm">
                            <p className="text-lg font-bold text-amber-600">{portfolioData.velocity}</p>
                            <p className="text-[10px] text-gray-500">Velocity</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded shadow-sm">
                            <p className="text-lg font-bold text-amber-600">{portfolioData.predictability}%</p>
                            <p className="text-[10px] text-gray-500">Predict.</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded shadow-sm">
                            <p className="text-lg font-bold text-purple-600">{portfolioData.currentPI}</p>
                            <p className="text-[10px] text-gray-500">Current PI</p>
                          </div>
                        </div>

                        {/* OKR Progress */}
                        {portfolioData.okrs.length > 0 && (
                          <div className="space-y-2" data-testid="portfolio-okrs">
                            {portfolioData.okrs.map((okr, idx) => (
                              <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-800">{okr.objective}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      okr.status === 'on-track' ? 'bg-green-100 text-green-700 border-green-300' :
                                      okr.status === 'at-risk' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                      'bg-red-100 text-red-700 border-red-300'
                                    }
                                  >
                                    {okr.status}
                                  </Badge>
                                </div>
                                <Progress value={okr.progress} className="h-1.5" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* AI Signal */}
                        {portfolioData.topAISignal && (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200" data-testid="portfolio-ai-signal">
                            <div className="flex items-start gap-2">
                              <Brain size={16} className="text-purple-600 mt-0.5" />
                              <p className="text-sm text-purple-800">{portfolioData.topAISignal.message}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {displayData.aiInsight && (
                      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-500" />
                            AI Insight
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 leading-relaxed">{displayData.aiInsight}</p>
                        </CardContent>
                      </Card>
                    )}

                    {displayData.summary && (
                      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <FileText size={16} className="text-blue-500" />
                            {enrichedProject ? 'Description' : 'Summary'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 leading-relaxed">{displayData.summary}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Show generic Key Metrics only for non-project entities */}
                    {entityType !== 'project' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp size={16} className="text-blue-500" />
                          Key Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(displayData.metrics).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">{key}</p>
                              <p className="text-lg font-bold">{value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    )}

                    {/* Project Breakdown for non-governance Metric entities */}
                    {entityType === 'metric' && metricDrilldown?.projectBreakdown && !entityId.startsWith('governance-') && (
                      <Card className="border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wide text-gray-600">
                            <Activity size={16} className="text-gray-500" />
                            Project Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {metricDrilldown.projectBreakdown.map((project, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <span className="font-medium text-sm">{project.name}</span>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-sm">{project.value}</p>
                                  <p className="text-xs text-gray-500">{project.budget}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Completed Items for governance-decisions */}
                    {entityType === 'metric' && entityId === 'governance-decisions' && metricDrilldown?.projectBreakdown && (
                      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                            <CheckCircle2 size={16} className="text-green-600" />
                            Governance Decisions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {metricDrilldown.projectBreakdown.map((item, index) => (
                              <div 
                                key={index} 
                                className={`p-3 rounded-lg border ${
                                  item.value === 'Complete' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {item.value === 'Complete' ? (
                                      <CheckCircle2 size={16} className="text-green-600" />
                                    ) : (
                                      <Clock size={16} className="text-amber-600" />
                                    )}
                                    <span className="font-medium text-sm">{item.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        item.value === 'Complete' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-amber-100 text-amber-700 border-amber-300'
                                      }`}
                                    >
                                      {item.value}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-6">{item.budget}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Pending Alerts for All Metrics with actionable items */}
                    {entityType === 'metric' && entityId !== 'governance-decisions' && metricDrilldown?.pendingAlerts && metricDrilldown.pendingAlerts.length > 0 && (
                      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                            <AlertTriangle size={16} className="text-amber-600" />
                            Pending Actions ({metricDrilldown.pendingAlerts.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {metricDrilldown.pendingAlerts.map((alert: GovernanceAlert) => (
                              <div 
                                key={alert.id} 
                                className={`p-3 rounded-lg border ${
                                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                                  alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                                  'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                      alert.severity === 'critical' ? 'bg-red-500' :
                                      alert.severity === 'warning' ? 'bg-amber-500' :
                                      'bg-blue-500'
                                    }`} />
                                    <span className="font-medium text-sm">{alert.title}</span>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      alert.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-300' :
                                      alert.severity === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                      'bg-blue-100 text-blue-700 border-blue-300'
                                    }`}
                                  >
                                    Due: {alert.dueDate}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">From: {alert.agent}</span>
                                  <Button 
                                    size="sm" 
                                    className={`${
                                      alert.severity === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                                      alert.severity === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                                      'bg-blue-600 hover:bg-blue-700'
                                    } text-white`}
                                    data-testid={`complete-${alert.id}`}
                                  >
                                    {alert.actionLabel}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {displayData.actions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            Recommended Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {displayData.actions.map((action) => (
                              <Button
                                key={action.id}
                                variant="outline"
                                className="w-full justify-between text-left h-auto py-3"
                                data-testid={`action-${action.id}`}
                                onClick={() => {
                                  if (onNavigate) {
                                    // Check if action.id is a known playbook key first (metric actions: analyze, forecast, etc.)
                                    // Otherwise fall back to action.type (project proactive actions: mitigate, accelerate, etc.)
                                    const knownPlaybookIds = ['analyze', 'forecast', 'alert', 'report', 'investigate', 'escalate', 'accelerate', 'mitigate'];
                                    const actionKey = knownPlaybookIds.includes(action.id) ? action.id : action.type;
                                    onNavigate('action', actionKey);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      action.type === 'mitigate' ? 'bg-red-50 text-red-700' :
                                      action.type === 'accelerate' ? 'bg-green-50 text-green-700' :
                                      action.type === 'escalate' ? 'bg-amber-50 text-amber-700' :
                                      'bg-blue-50 text-blue-700'
                                    }
                                  >
                                    {action.type}
                                  </Badge>
                                  <span className="text-sm">{action.label}</span>
                                </div>
                                <ChevronRight size={16} />
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {displayData.relatedEntities && displayData.relatedEntities.length > 0 && (
                      <Card className={entityType === 'project' 
                        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" 
                        : "border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50"}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {entityType === 'project' ? (
                              <>
                                <GitBranch size={16} className="text-amber-600" />
                                <span className="text-amber-900">Project Dependencies ({displayData.relatedEntities.length})</span>
                              </>
                            ) : (
                              <>
                                <Brain size={16} className="text-indigo-600" />
                                <span className="text-indigo-900">Related Entities ({displayData.relatedEntities.length})</span>
                              </>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {displayData.relatedEntities.map((entity, index) => {
                              const healthColor = entity.status === 'green' ? 'bg-green-500' : 
                                                  entity.status === 'yellow' ? 'bg-yellow-500' : 
                                                  entity.status === 'red' ? 'bg-red-500' : 
                                                  entity.status === 'amber' ? 'bg-amber-500' : 'bg-gray-400';
                              const borderColor = entity.status === 'green' ? 'border-green-200' : 
                                                  entity.status === 'yellow' ? 'border-yellow-200' : 
                                                  entity.status === 'red' ? 'border-red-200' : 
                                                  entity.status === 'amber' ? 'border-amber-200' : 'border-gray-200';
                              return (
                                <div
                                  key={entity.id}
                                  className={`flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border ${borderColor} shadow-sm`}
                                  data-testid={`related-entity-${entity.id}`}
                                  onClick={() => {
                                    if (onNavigate && entity.id) {
                                      onNavigate('project', entity.id);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    {entityType === 'project' ? (
                                      <span className={`w-3 h-3 rounded-full ${healthColor}`} title={`Health: ${entity.status}`} />
                                    ) : (
                                      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                      </span>
                                    )}
                                    <div className="flex-1">
                                      <span className="font-medium text-sm text-gray-900 block">{entity.name}</span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className={entityType === 'project' 
                                          ? "text-xs bg-amber-50 text-amber-700 border-amber-200" 
                                          : "text-xs bg-indigo-50 text-indigo-700 border-indigo-200"}>
                                          {entity.type}
                                        </Badge>
                                        {entityType === 'project' && entity.status && (
                                          <Badge variant="outline" className={
                                            entity.status === 'green' ? "text-xs bg-green-50 text-green-700 border-green-200" :
                                            entity.status === 'yellow' ? "text-xs bg-yellow-50 text-yellow-700 border-yellow-200" :
                                            entity.status === 'red' ? "text-xs bg-red-50 text-red-700 border-red-200" :
                                            entity.status === 'amber' ? "text-xs bg-amber-50 text-amber-700 border-amber-200" :
                                            "text-xs bg-gray-50 text-gray-700 border-gray-200"
                                          }>
                                            {entity.status === 'green' ? 'Healthy' : 
                                             entity.status === 'yellow' ? 'Warning' : 
                                             entity.status === 'red' ? 'Critical' :
                                             entity.status === 'amber' ? 'At Risk' : entity.status}
                                          </Badge>
                                        )}
                                      </div>
                                      {entityType === 'project' && (entity as any).description && (
                                        <p className="text-xs text-gray-500 mt-1">{(entity as any).description}</p>
                                      )}
                                      {entityType === 'project' && (entity as any).impactIfDelayed && (
                                        <p className="text-xs text-amber-600 mt-0.5 font-medium">Impact: {(entity as any).impactIfDelayed}</p>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight size={16} className={entityType === 'project' ? "text-amber-400" : "text-indigo-400"} />
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {displayData.events.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="text-orange-500" />
                            Recent Alerts ({displayData.events.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {displayData.events.slice(0, 3).map((event) => (
                              <div key={event.id} className="p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    className={
                                      event.priority === 'critical' ? 'bg-red-500' :
                                      event.priority === 'high' ? 'bg-amber-500' :
                                      'bg-blue-500'
                                    }
                                  >
                                    {event.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm font-medium">{event.title}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  )}
                </TabsContent>

                <TabsContent value="ai-analysis">
                  <AICoPilot 
                    drilldown={displayData} 
                    agentId={displayData.relatedAgents[0] || 'integrated-management'}
                    dataMode={dataMode}
                  />
                </TabsContent>

                <TabsContent value="traceability">
                  <div className="space-y-4">
                    {/* Source System */}
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database size={16} className="text-blue-600" />
                          Source System
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-xs text-gray-500">System</p>
                            <p className="font-semibold text-blue-700">
                              {(displayData as any).traceability?.sourceSystem || 'ServiceNow'}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-xs text-gray-500">Source ID</p>
                            <p className="font-mono text-sm">
                              {(displayData as any).traceability?.sourceId || 'SRC-' + displayData.entityId.slice(-8).toUpperCase()}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-blue-100 col-span-2">
                            <p className="text-xs text-gray-500">Triggered By</p>
                            <p className="font-medium">
                              {(displayData as any).traceability?.triggeredBy || 'Scheduled Monitoring'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Inputs */}
                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity size={16} className="text-purple-600" />
                          Data Inputs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {((displayData as any).traceability?.dataInputs || [
                            { source: 'Real-time metrics', freshness: '< 1 min' },
                            { source: 'Historical trends', freshness: 'Daily' },
                            { source: 'Agent insights', freshness: '< 5 min' }
                          ]).map((input: { source: string; freshness: string }, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100">
                              <span className="text-sm font-medium">{input.source}</span>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {input.freshness}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Linked Entities */}
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Link2 size={16} className="text-green-600" />
                          Linked Projects
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {((displayData as any).traceability?.linkedProjects || [
                            { id: 'PRJ-001', name: 'Digital Transformation', status: 'green' },
                            { id: 'PRJ-002', name: 'Platform Migration', status: 'amber' }
                          ]).map((project: { id: string; name: string; status: string }) => (
                            <div 
                              key={project.id} 
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                              onClick={() => {
                                if (onNavigate && project.id) {
                                  onNavigate('project', project.id);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  project.status === 'green' ? 'bg-green-500' : 
                                  project.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                                <div>
                                  <p className="font-medium text-sm">{project.name}</p>
                                  <p className="text-xs text-gray-500">{project.id}</p>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-green-400" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Audit Trail */}
                    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <History size={16} className="text-amber-600" />
                          Audit Trail
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[
                            { time: new Date(Date.now() - 5000).toLocaleTimeString(), action: 'Data ingested from source', user: 'System' },
                            { time: new Date(Date.now() - 3000).toLocaleTimeString(), action: 'AI analysis triggered', user: 'Integrated Management Agent' },
                            { time: new Date(Date.now() - 1000).toLocaleTimeString(), action: 'Cross-validation completed', user: 'Integrated Management Agent' },
                            { time: new Date().toLocaleTimeString(), action: 'Activity logged', user: 'System' }
                          ].map((entry, index) => (
                            <div key={index} className="flex gap-3 p-2 bg-white rounded-lg border border-amber-100">
                              <span className="text-xs text-gray-500 whitespace-nowrap">{entry.time}</span>
                              <div className="flex-1">
                                <p className="text-sm">{entry.action}</p>
                                <p className="text-xs text-amber-700">{entry.user}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Impacted Agents */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users size={16} className="text-indigo-500" />
                          Impacted Agents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {displayData.relatedAgents.map((agentId) => (
                            <Badge 
                              key={agentId}
                              className={`${agentColors[agentId]} text-white`}
                            >
                              {agentNames[agentId]}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="agents">
                  <div className="space-y-4">
                    {/* View in Command Center link */}
                    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Bot size={20} className="text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-purple-900">Agent Command Center</p>
                              <p className="text-xs text-purple-600">View interventions and agent activity</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                              onClose();
                              if (relatedInterventionId) {
                                setLocation(`/command-center?highlight=${relatedInterventionId}`);
                              } else {
                                setLocation('/command-center');
                              }
                            }}
                            data-testid="btn-view-command-center"
                          >
                            View <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Agent-to-Agent Communication Trail */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare size={16} className="text-indigo-500" />
                          Agent Communication Trail
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Simulated agent communication based on related agents */}
                          {displayData.relatedAgents.slice(0, 2).map((agentId, index) => {
                            const nextAgent = displayData.relatedAgents[(index + 1) % displayData.relatedAgents.length];
                            return (
                              <div key={`comm-${agentId}-${index}`} className="relative pl-4 border-l-2 border-indigo-200">
                                <div className="text-xs text-gray-500 mb-1">{new Date(Date.now() - (index * 3600000)).toLocaleTimeString()}</div>
                                <div className="flex items-start gap-2">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 ${agentColors[agentId]}`} />
                                  <div>
                                    <span className="font-medium text-sm">{agentNames[agentId]}</span>
                                    <span className="text-sm text-gray-600"> → </span>
                                    <span className="font-medium text-sm">{agentNames[nextAgent]}</span>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {index === 0 
                                        ? `Requested review of ${entityType} status and dependencies`
                                        : `Confirmed analysis complete, escalating to governance`
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {displayData.relatedAgents.length > 0 && (
                            <div className="relative pl-4 border-l-2 border-green-200">
                              <div className="text-xs text-gray-500 mb-1">{new Date(Date.now() - 7200000).toLocaleTimeString()}</div>
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full mt-1.5 bg-green-500" />
                                <div>
                                  <span className="font-medium text-sm text-green-700">System</span>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Action approved and executed autonomously
                                  </p>
                                  <Badge className="mt-1 bg-emerald-100 text-emerald-700 text-[10px]">
                                    <CheckCircle2 size={10} className="mr-1" />
                                    Completed
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Connected Agents */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users size={16} className="text-purple-500" />
                          Connected Agents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {displayData.relatedAgents.map((agentId) => (
                            <div
                              key={agentId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              data-testid={`agent-link-${agentId}`}
                              onClick={() => {
                                if (onNavigate) {
                                  onNavigate('agent', agentId);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${agentColors[agentId]}`} />
                                <span className="font-medium">{agentNames[agentId]}</span>
                              </div>
                              <Badge variant="outline">Active</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <div className="space-y-4">
                    {/* Entity-specific history */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock size={16} className="text-gray-500" />
                          Entity Activity History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {displayData.history.length > 0 ? (
                          <div className="space-y-3">
                            {displayData.history.map((item, index) => (
                              <div key={index} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-2 h-2 rounded-full ${agentColors[item.agent]}`} />
                                  {index < displayData.history.length - 1 && (
                                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium">{item.action}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {agentNames[item.agent]}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No entity-specific history yet
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Agent Activity Feed */}
                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity size={16} className="text-purple-600" />
                          Agent Activity Feed
                          <Badge variant="outline" className="ml-auto bg-purple-100 text-purple-700 border-purple-200">
                            {agentActivities.length} actions
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {agentActivities.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {agentActivities.map((activity, index) => (
                              <div 
                                key={activity.id} 
                                className="flex gap-3 p-2 bg-white rounded-lg border border-purple-100 hover:bg-purple-50 transition-colors cursor-pointer"
                                onClick={() => {
                                  if (onNavigate && activity.targetEntityId) {
                                    onNavigate(activity.targetEntityType || 'project', activity.targetEntityId);
                                  }
                                }}
                              >
                                <div className="flex flex-col items-center">
                                  <div className={`w-2 h-2 rounded-full ${agentColors[activity.agentId]}`} />
                                  {index < agentActivities.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-purple-200 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        activity.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                        activity.priority === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}
                                    >
                                      {activity.actionType}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {new Date(activity.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium truncate">{activity.targetEntityName}</p>
                                  <p className="text-xs text-gray-600 line-clamp-2">{activity.reasoning}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {agentNames[activity.agentId]}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      {Math.round(activity.aiConfidence)}% confidence
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No agent activities recorded yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
