#!/usr/bin/env node
/**
 * ACME Agent Interventions Generator
 * Creates realistic agent interventions for problematic projects
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intervention templates by agent type
const interventionTemplates = {
  DeepFinOps: {
    critical: [
      'Budget overrun detected: CPI {cpi} vs threshold 0.85. Current variance: {variance}%. Recommend immediate reforecast and cost reduction review.',
      'Cost trajectory analysis shows continued deterioration. At current burn rate, forecast will exceed {forecast} by {overrun}%. Recommend executive budget review.',
      'Multiple cost categories over budget: {categories}. Root cause analysis indicates {rootCause}. Recommend corrective action plan.',
      'Financial risk assessment: Project financial health critical. Recommend reserve funding activation and stakeholder notification.'
    ],
    warning: [
      'Budget variance trending negative: CPI {cpi}. Monitor closely for potential threshold breach. Consider contingency activation.',
      'Cost efficiency declining: {trend}% degradation over past 4 weeks. Recommend cost control measures.',
      'Forecast-to-complete analysis shows risk of overrun. Current trajectory: {forecast}. Recommend mitigation planning.',
      'Spending velocity {velocity}% above plan. Recommend procurement review and spend controls.'
    ],
    healthy: [],
    risk: [
      'Financial risk identified: {risk}. Potential budget impact: {impact}. Recommend risk response plan.',
      'Cost uncertainty high due to {factor}. Recommend cost contingency analysis and reserve allocation.'
    ],
    governance: []
  },
  DeepTMO: {
    critical: [
      'Schedule delay critical: SPI {spi} vs threshold 0.80. Project {weeks} weeks late. Recommend recovery plan with resource acceleration.',
      'Critical path analysis shows {delay} week delay. Key blockers: {blockers}. Recommend fast-track approach and parallel execution.',
      'Milestone variance severe: {milestones} key dates missed. Impact to delivery date: {impact}. Recommend schedule re-baseline.',
      'Resource constraints causing cascading delays. Current velocity: {velocity}% of plan. Recommend workforce augmentation.'
    ],
    warning: [
      'Schedule slippage detected: SPI {spi}. Current trend shows {weeks} weeks at risk. Recommend acceleration planning.',
      'Task completion rate {rate}% below plan. Recommend resource reallocation and priority adjustment.',
      'Dependencies causing schedule pressure. {count} tasks delayed due to predecessor delays. Recommend dependency management review.',
      'Schedule buffer consumed: {buffer}% utilized. Recommend proactive schedule management and risk mitigation.'
    ],
    healthy: [],
    risk: [
      'Schedule risk identified: {risk}. Potential impact: {impact} weeks. Recommend mitigation strategy.',
      'External dependencies present schedule uncertainty. Recommend contingency planning and buffer allocation.'
    ],
    governance: []
  },
  DeepRisk: {
    critical: [
      'Triple Threat Pattern detected: Budget + Schedule + Quality risks converging. Historical data shows 78% probability of further deterioration. Recommend executive intervention.',
      'High-severity risk materialized: {risk}. Impact assessment: {impact}. Recommend immediate response and escalation.',
      'Risk velocity increasing: {count} new risks identified in past 2 weeks. Overall risk score: {score}. Recommend risk response workshop.',
      'Compound risk scenario: {scenario}. Probability: {probability}%. Impact: {impact}. Recommend mitigation prioritization.'
    ],
    warning: [
      'Medium-severity risks trending upward: {risks}. Recommend proactive mitigation before escalation.',
      'Risk exposure increased by {percent}% this period. Primary drivers: {drivers}. Recommend risk response review.',
      'Early warning indicators detected: {indicators}. Recommend preventive action.',
      'Risk interdependencies identified: {dependencies}. Potential cascade effect. Recommend integrated risk management.'
    ],
    healthy: [],
    risk: [
      'Strategic risk identified: {risk}. Current likelihood: {likelihood}. Current impact: {impact}. Recommend risk response plan development.',
      'Technical risk assessment: {assessment}. Mitigation strategy: {strategy}. Monitor risk indicators closely.',
      'External risk factor: {factor}. Outside project control. Recommend contingency planning and stakeholder communication.',
      'Risk pattern recognition: Similar to {historical} project. Recommend lessons learned application.'
    ],
    governance: []
  },
  DeepGovernance: {
    critical: [
      'Stage gate approval overdue by {days} days. Gate criteria: {criteria}. Recommend immediate governance committee escalation.',
      'Regulatory compliance at risk: {requirement}. Deadline: {deadline}. Recommend compliance audit and remediation plan.',
      'Governance violation detected: {violation}. Severity: High. Recommend corrective action and control enhancement.',
      'Multiple governance controls bypassed: {controls}. Recommend governance review and process enforcement.'
    ],
    warning: [
      'Governance review approaching: {review}. Preparation status: {status}%. Recommend readiness assessment.',
      'Policy compliance gap identified: {gap}. Recommend control implementation and validation.',
      'Approval workflow delayed: {workflow}. Current status: {status}. Recommend stakeholder engagement.',
      'Documentation incomplete: {missing} artifacts required for gate approval. Recommend documentation completion.'
    ],
    healthy: [],
    risk: [
      'Regulatory approval pending: {approval}. Uncertainty on timeline. Recommend regulatory engagement and contingency.',
      'Compliance framework gap: {framework}. Potential impact: {impact}. Recommend compliance enhancement.'
    ],
    governance: [
      'Stage gate approval required: {gate}. Review scheduled: {date}. Ensure all criteria met.',
      'Governance committee review pending: {topic}. Preparation checklist: {items}.',
      'Policy approval workflow initiated: {policy}. Approvers: {approvers}. Expected completion: {date}.',
      'Compliance validation in progress: {validation}. Auditor: {auditor}. Status: {status}.'
    ]
  },
  DeepOCM: {
    critical: [
      'Change adoption critically low: {adoption}% vs target {target}%. Stakeholder resistance high. Recommend change acceleration program.',
      'User adoption failing: {metric} significantly below plan. Impact on benefits realization: {impact}. Recommend intervention.',
      'Stakeholder engagement breakdown: Key stakeholders disengaged. Risk to project success: High. Recommend stakeholder reset.',
      'Change fatigue detected: Multiple concurrent changes overwhelming organization. Recommend change sequencing review.'
    ],
    warning: [
      'Change adoption below target: {adoption}% vs {target}%. Recommend targeted training and communication.',
      'Stakeholder concerns emerging: {concerns}. Recommend stakeholder engagement enhancement.',
      'Training effectiveness suboptimal: {metric}. Recommend training approach review and reinforcement.',
      'Communication gaps identified: {gaps}. Recommend communication plan enhancement.'
    ],
    healthy: [],
    risk: [
      'Change risk identified: {risk}. Potential adoption impact. Recommend change strategy adjustment.',
      'Cultural barriers to adoption: {barriers}. Recommend change management intensification.'
    ],
    governance: [
      'Stakeholder approval required: {approval}. Status: Pending. Recommend stakeholder alignment session.',
      'Change impact assessment needed: {change}. Affected stakeholders: {count}. Recommend impact analysis.'
    ]
  }
};

// Generate intervention text with actual project data
function generateInterventionText(agentType, healthStatus, projectData) {
  const templates = interventionTemplates[agentType]?.[healthStatus];
  if (!templates || templates.length === 0) return null;

  const template = templates[Math.floor(Math.random() * templates.length)];

  // Replace placeholders with actual data
  let text = template
    .replace('{cpi}', projectData.budget.cpi.toFixed(2))
    .replace('{spi}', projectData.schedule.spi.toFixed(2))
    .replace('{variance}', ((1 - projectData.budget.cpi) * 100).toFixed(1))
    .replace('{weeks}', Math.abs(projectData.schedule.weeksLate))
    .replace('{forecast}', `$${(projectData.budget.forecast / 1000000).toFixed(1)}M`)
    .replace('{overrun}', ((projectData.budget.forecast / projectData.budget.planned - 1) * 100).toFixed(1))
    .replace('{days}', Math.floor(Math.random() * 20) + 5)
    .replace('{adoption}', Math.floor(Math.random() * 20) + 30)
    .replace('{target}', Math.floor(Math.random() * 15) + 65);

  // Generic replacements
  text = text
    .replace('{categories}', 'Labor, Materials, Equipment')
    .replace('{rootCause}', projectData.tasks.find(t => t.rootCause !== 'None')?.rootCause || 'resource constraints')
    .replace('{trend}', Math.floor(Math.random() * 15) + 10)
    .replace('{velocity}', Math.floor(Math.random() * 25) + 15)
    .replace('{risk}', 'technical complexity, external dependencies')
    .replace('{impact}', 'schedule delay, cost increase')
    .replace('{blockers}', projectData.tasks.filter(t => t.status === 'blocked' || t.status === 'pending').map(t => t.name).join(', ') || 'resource availability')
    .replace('{milestones}', Math.floor(Math.random() * 3) + 2)
    .replace('{rate}', Math.floor(Math.random() * 20) + 70)
    .replace('{count}', Math.floor(Math.random() * 5) + 3)
    .replace('{buffer}', Math.floor(Math.random() * 30) + 70)
    .replace('{scenario}', 'budget + schedule convergence')
    .replace('{probability}', Math.floor(Math.random() * 20) + 60)
    .replace('{score}', Math.floor(Math.random() * 20) + 70)
    .replace('{percent}', Math.floor(Math.random() * 20) + 15)
    .replace('{drivers}', 'technical complexity, resource constraints')
    .replace('{indicators}', 'velocity decline, quality issues')
    .replace('{dependencies}', 'schedule → budget → quality')
    .replace('{likelihood}', 'Medium-High')
    .replace('{assessment}', 'integration complexity, performance requirements')
    .replace('{strategy}', 'phased rollout, extensive testing')
    .replace('{factor}', 'vendor dependency, market conditions')
    .replace('{historical}', 'similar past implementation')
    .replace('{requirement}', projectData.triggeredRules[0] || 'regulatory requirement')
    .replace('{deadline}', '45 days')
    .replace('{violation}', 'approval workflow bypass')
    .replace('{controls}', 'stage gate, budget approval')
    .replace('{review}', 'quarterly governance review')
    .replace('{status}', Math.floor(Math.random() * 30) + 60)
    .replace('{gap}', 'documentation completeness')
    .replace('{workflow}', 'budget approval')
    .replace('{missing}', Math.floor(Math.random() * 5) + 3)
    .replace('{approval}', 'regulatory certification')
    .replace('{framework}', 'ISO 27001')
    .replace('{gate}', 'Design Gate 3')
    .replace('{date}', 'next week')
    .replace('{topic}', 'risk escalation')
    .replace('{items}', 'metrics, risks, issues')
    .replace('{policy}', 'security policy update')
    .replace('{approvers}', 'CISO, CTO')
    .replace('{validation}', 'SOC 2 Type II')
    .replace('{auditor}', 'External Auditor')
    .replace('{metric}', 'training completion rate')
    .replace('{concerns}', 'timeline, resource impact')
    .replace('{gaps}', 'field team communication')
    .replace('{barriers}', 'legacy process attachment');

  return text;
}

// Determine severity based on health status and agent type
function getSeverity(healthStatus, agentType) {
  if (healthStatus === 'critical') return 'critical';
  if (healthStatus === 'warning') return 'high';
  if (healthStatus === 'risk') return 'medium';
  if (healthStatus === 'governance') return 'medium';
  return 'low';
}

// Generate interventions for a project
function generateInterventions(project, industryId, companyId) {
  if (!project.interventionTypes || project.interventionTypes.length === 0) {
    return [];
  }

  const interventions = [];
  const now = new Date();

  // Generate 3-5 interventions per problematic project
  const interventionCount = project.healthStatus === 'critical' ? 5 :
                           project.healthStatus === 'warning' ? 4 : 3;

  for (let i = 0; i < Math.min(interventionCount, project.interventionTypes.length); i++) {
    const agentType = project.interventionTypes[i];
    const text = generateInterventionText(agentType, project.healthStatus, project);

    if (text) {
      // Create intervention 1-4 weeks ago
      const daysAgo = Math.floor(Math.random() * 28) + 1;
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

      interventions.push({
        projectName: project.name,
        projectHealthStatus: project.healthStatus,
        industryId,
        companyId,
        agentType,
        severity: getSeverity(project.healthStatus, agentType),
        message: text,
        createdAt: createdAt.toISOString(),
        status: 'active',
        actionItems: generateActionItems(agentType, project.healthStatus),
        metrics: {
          cpi: project.budget.cpi,
          spi: project.schedule.spi,
          weeksLate: project.schedule.weeksLate,
          budgetVariance: ((project.budget.forecast - project.budget.planned) / project.budget.planned * 100).toFixed(1)
        }
      });
    }
  }

  return interventions;
}

// Generate action items for intervention
function generateActionItems(agentType, healthStatus) {
  const actionSets = {
    DeepFinOps: ['Review cost breakdown', 'Identify cost reduction opportunities', 'Prepare budget reforecast', 'Present to steering committee'],
    DeepTMO: ['Analyze critical path', 'Assess resource availability', 'Develop recovery schedule', 'Implement acceleration measures'],
    DeepRisk: ['Document risk details', 'Assess probability and impact', 'Develop mitigation strategy', 'Assign risk owner'],
    DeepGovernance: ['Complete missing documentation', 'Schedule governance review', 'Prepare approval materials', 'Obtain stakeholder sign-off'],
    DeepOCM: ['Conduct stakeholder analysis', 'Develop targeted communications', 'Schedule training sessions', 'Measure adoption metrics']
  };

  const actions = actionSets[agentType] || ['Review situation', 'Develop action plan', 'Execute plan', 'Monitor results'];

  // Return 2-3 action items
  const count = healthStatus === 'critical' ? 3 : 2;
  return actions.slice(0, count);
}

// Main execution
console.log('═══════════════════════════════════════════════════');
console.log('   ACME Agent Interventions Generator');
console.log('═══════════════════════════════════════════════════\n');

const projectsPath = path.join(__dirname, '../seed-data/acme-project-templates.json');
const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

let totalInterventions = 0;
const allInterventions = [];

for (const industry of projects) {
  let industryInterventions = 0;

  for (const project of industry.projects) {
    const interventions = generateInterventions(project, industry.industryId, industry.companyId);
    allInterventions.push(...interventions);
    industryInterventions += interventions.length;
  }

  if (industryInterventions > 0) {
    console.log(`  ✓ ${industry.industryId.padEnd(30)} ${industryInterventions} interventions`);
    totalInterventions += industryInterventions;
  }
}

// Write interventions file
const interventionsPath = path.join(__dirname, '../seed-data/acme-interventions.json');
fs.writeFileSync(interventionsPath, JSON.stringify(allInterventions, null, 2));

console.log('\n═══════════════════════════════════════════════════');
console.log(`✅ Complete! Generated ${totalInterventions} agent interventions`);
console.log(`📁 Saved to: acme-interventions.json`);
console.log('═══════════════════════════════════════════════════');
