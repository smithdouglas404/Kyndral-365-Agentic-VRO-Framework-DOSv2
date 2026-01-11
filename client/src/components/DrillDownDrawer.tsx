import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, CheckCircle2, TrendingUp, Users, Zap, Brain, ChevronRight, Sparkles, FileText, Link2, ExternalLink, History, Database, Activity, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useEntityDrilldown } from '@/hooks/useAgentData';
import { AgentType } from '@/lib/dataHub';
import { AICoPilot } from './AICoPilot';
import { getActionLog, subscribeToActions, AgentAction } from '@/lib/agentActionEngine';
import { enrichedProjects, getProjectById, getStageLabel, type EnrichedProject } from '@/lib/projects';

interface DrillDownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  dataMode?: 'VRO' | 'PMO';
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
      summary: "Cost variance is over budget at 40.8%. FinOps agent flagged this as critical. VRO agent estimates £2.3M value at risk if not addressed. 4 projects are contributing to the overrun."
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
      aiInsight: "Value realization trending positive. VRO agent calculates portfolio ROI at 127%, exceeding 100% target. FinOps agent confirms cost savings of £4.2M realized YTD. Recommend accelerating high-performing initiatives.",
      summary: "ROI performance is strong at 127%. VRO agent identified 3 initiatives exceeding expectations. FinOps validates financial impact. 8 projects driving positive returns."
    };
  }
  
  if (entityName.includes('risk') || entityName.includes('mitigation')) {
    return {
      aiInsight: "Risk mitigation actions required. Governance agent identified 12 active risks, 3 rated as critical. VRO agent estimates £1.8M potential value impact. Recommend immediate risk review with stakeholders.",
      summary: "Risk exposure is elevated with 3 critical items. Governance agent tracking mitigation progress at 67%. OCM agent flagged change resistance as emerging risk factor."
    };
  }
  
  // Default insight for other entity types
  return {
    aiInsight: `This ${entityType} has been analyzed by multiple AI agents. The VRO agent identified key value implications while the PMO agent assessed delivery impact. Confidence level is high based on cross-validation of multiple data sources.`,
    summary: `Comprehensive analysis of this ${entityType} entity shows active monitoring by 3 agents. The system has identified 4 recommended actions based on current state and historical patterns.`
  };
}

export function DrillDownDrawer({ isOpen, onClose, entityType, entityId, dataMode = 'VRO' }: DrillDownDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [agentActivities, setAgentActivities] = useState<AgentAction[]>([]);
  
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
      ? getProjectById(entityId) || enrichedProjects.find(p => 
          p.id === entityId ||
          p.name.toLowerCase() === entityId.toLowerCase()
        )
      : undefined;

  // Don't render if drawer is not open or entity is not selected
  if (!isOpen || !entityType || !entityId) return null;
  
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
      'Budget': `${enrichedProject.budget.spent}/${enrichedProject.budget.total} ${enrichedProject.budget.unit}`,
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
        { name: 'PRT Digital Intake', value: '+£8.2M', budget: '£12.4M' },
        { name: 'Claims Automation', value: '+£5.7M', budget: '£7.2M' },
        { name: 'Customer Portal', value: '+£4.1M', budget: '£6.8M' }
      ],
      insight: 'ROI is trending positive at 64% against an 85% target. VRO agent analysis shows 3 initiatives exceeding expectations, with Claims Automation delivering the highest marginal return. FinOps agent recommends reallocating £2.1M from underperforming initiatives to accelerate top performers.',
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
        'Total Utilized': '£41.2M',
        'Total Budget': '£43.8M',
        'Utilization Rate': '94%',
        'Baseline (2024)': '£0',
        'Target (2026)': '£41.2M',
        'Remaining': '£2.6M',
        'Variance': '+6% efficiency gain'
      },
      projectBreakdown: [
        { name: 'Claims', value: '£12.2M', budget: '£14.2M' },
        { name: 'Digital', value: '£9.8M', budget: '£10.5M' },
        { name: 'Infrastructure', value: '£8.4M', budget: '£8.9M' },
        { name: 'Analytics', value: '£5.2M', budget: '£5.6M' },
        { name: 'Other', value: '£5.6M', budget: '£4.6M' }
      ],
      insight: 'Budget utilization is healthy at 94% with £2.6M remaining. FinOps agent detected 6% efficiency gains through vendor consolidation. Recommend reallocating £1.2M surplus to high-priority initiatives in Q4.',
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
        { name: 'Claims Digital Transformation', value: '+£12.4M', budget: '£18.2M' },
        { name: 'Customer Experience Platform', value: '+£8.7M', budget: '£12.1M' },
        { name: 'Operational Excellence', value: '+£5.2M', budget: '£7.8M' }
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
        { name: 'Group Technology', value: '62 pts', budget: 'High' },
        { name: 'LGRI', value: '51 pts', budget: 'Medium' },
        { name: 'LGC', value: '48 pts', budget: 'Medium' },
        { name: 'LGIM', value: '45 pts', budget: 'Medium' }
      ],
      insight: 'Portfolio velocity at 53 points is near target. Group Technology leads with highest velocity. Planning agent recommends cross-team knowledge sharing to improve velocity across business units.',
      summary: 'Velocity trending positive with 26% improvement from baseline. Sprint commitment at 96% indicates healthy capacity planning.'
    }
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
    actions: [
      { id: 'analyze', label: 'Deep Dive Analysis', type: 'investigate' },
      { id: 'forecast', label: 'Run Forecast Scenario', type: 'accelerate' },
      { id: 'alert', label: 'Set Alert Threshold', type: 'mitigate' },
      { id: 'report', label: 'Generate Report', type: 'escalate' }
    ],
    history: [
      { timestamp: new Date(Date.now() - 300000), action: 'Metric data refreshed from source systems', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 180000), action: 'Cross-validated with historical trends', agent: 'finops' as AgentType },
      { timestamp: new Date(Date.now() - 60000), action: 'AI analysis and recommendations generated', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(), action: 'Dashboard updated with latest values', agent: 'integrated-management' as AgentType }
    ],
    aiInsight: metricConfig.insight,
    summary: metricConfig.summary,
    relatedEntities: [
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
  
  // Create a fallback for unsupported entity types with rich traceability data
  const fallbackDrilldown = !drilldownData && !projectDrilldown && !metricDrilldown ? {
    entityType: entityType as 'project' | 'program' | 'risk' | 'portfolio',
    entityId,
    entityName: entityType === 'agent-activity' 
      ? 'Agent Activity Details' 
      : entityType === 'challenge' 
        ? 'Challenge Analysis'
        : `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Details`,
    bu: 'VRO Co-Pilot',
    relatedAgents: ['integrated-management' as AgentType, 'finops' as AgentType],
    events: [],
    metrics: {
      'Entity Type': entityType.charAt(0).toUpperCase() + entityType.slice(1),
      'Entity ID': entityId.slice(0, 16) + '...',
      'Status': 'Active',
      'Priority': 'High',
      'Confidence': '87%',
      'Last Updated': new Date().toLocaleTimeString()
    },
    actions: [
      { id: 'investigate', label: 'Investigate Further', type: 'investigate' },
      { id: 'escalate', label: 'Escalate to Team', type: 'escalate' },
      { id: 'accelerate', label: 'Fast-track Resolution', type: 'accelerate' },
      { id: 'mitigate', label: 'Apply Mitigation', type: 'mitigate' }
    ],
    history: [
      { timestamp: new Date(Date.now() - 5000), action: 'Data collected from source systems', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 3000), action: 'Cross-referenced with historical patterns', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(Date.now() - 1000), action: 'AI analysis completed', agent: 'integrated-management' as AgentType },
      { timestamp: new Date(), action: 'Action triggered and recorded', agent: 'integrated-management' as AgentType }
    ],
    aiInsight: generateEntityInsight(entityType, entityId).aiInsight,
    summary: generateEntityInsight(entityType, entityId).summary,
    relatedEntities: [
      { type: 'Project', id: 'PRJ-' + entityId.slice(-4), name: 'Digital Transformation Initiative' },
      { type: 'OKR', id: 'OKR-Q4-' + entityId.slice(-2), name: 'Improve Operational Efficiency' },
      { type: 'Risk', id: 'RSK-' + entityId.slice(-3), name: 'Integration Dependency Risk' }
    ],
    traceability: {
      sourceSystem: entityType === 'project' ? 'Jira' : entityType === 'metric' ? 'PowerBI' : 'ServiceNow',
      sourceId: 'SRC-' + entityId.slice(-8).toUpperCase(),
      triggeredBy: 'Threshold Alert',
      dataInputs: [
        { source: 'Real-time metrics', freshness: '< 1 min' },
        { source: 'Historical trends (30 days)', freshness: 'Daily refresh' },
        { source: 'Cross-agent insights', freshness: '< 5 min' }
      ],
      linkedProjects: [
        { id: 'PRJ-001', name: 'PRT Digital Intake', status: 'green' },
        { id: 'PRJ-002', name: 'Longevity Model', status: 'amber' }
      ]
    }
  } : null;
  
  // Priority: metricDrilldown first (for configured metrics), then projectDrilldown, then drilldownData, then fallback
  const displayData = metricDrilldown || projectDrilldown || drilldownData || fallbackDrilldown;
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
              <AICoPilot 
                drilldown={displayData} 
                agentId={displayData.relatedAgents[0] || 'integrated-management'}
                dataMode={dataMode}
              />
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="traceability" className="flex-1">Traceability</TabsTrigger>
                  <TabsTrigger value="agents" className="flex-1">Agents</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-4">
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
                            Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 leading-relaxed">{displayData.summary}</p>
                        </CardContent>
                      </Card>
                    )}

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

                    {/* Project Breakdown for Metric entities */}
                    {entityType === 'metric' && metricDrilldown?.projectBreakdown && (
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
