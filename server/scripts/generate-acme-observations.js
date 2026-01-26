#!/usr/bin/env node
/**
 * ACME Agent Observations Generator
 * Creates agent observation logs showing pattern detection and collaboration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pattern detection templates
const patternTemplates = {
  'Triple Threat Pattern': {
    description: 'Budget + Schedule + Quality risks converging',
    confidence: 0.92,
    agents: ['DeepRisk', 'DeepFinOps', 'DeepTMO'],
    historicalContext: 'Similar pattern seen in 3 previous projects, all required executive intervention',
    recommendation: 'Immediate escalation and integrated recovery plan'
  },
  'Schedule-Budget Cascade': {
    description: 'Schedule delays causing budget overruns through extended overhead',
    confidence: 0.88,
    agents: ['DeepTMO', 'DeepFinOps'],
    historicalContext: 'Pattern observed in 5 projects, avg cost impact +15%',
    recommendation: 'Schedule acceleration to minimize financial impact'
  },
  'Resource Constraint Pattern': {
    description: 'Systematic resource shortages across multiple projects',
    confidence: 0.85,
    agents: ['DeepTMO', 'DeepRisk'],
    historicalContext: 'Portfolio-wide pattern indicating capacity planning issue',
    recommendation: 'Strategic resource capacity assessment needed'
  },
  'Vendor Dependency Risk': {
    description: 'Critical path dependency on single vendor with delivery issues',
    confidence: 0.90,
    agents: ['DeepRisk', 'DeepTMO'],
    historicalContext: 'Similar vendor caused 8-week delays in 2 past projects',
    recommendation: 'Alternative vendor evaluation and dual-sourcing strategy'
  },
  'Change Resistance Escalation': {
    description: 'Declining stakeholder engagement and adoption metrics',
    confidence: 0.87,
    agents: ['DeepOCM', 'DeepRisk'],
    historicalContext: 'Early indicator of project failure in 4 historical cases',
    recommendation: 'Intensive stakeholder engagement and change acceleration'
  },
  'Governance Gate Bottleneck': {
    description: 'Systematic delays in governance approvals impacting multiple projects',
    confidence: 0.91,
    agents: ['DeepGovernance', 'DeepTMO'],
    historicalContext: 'Governance process causing avg 3-week delays',
    recommendation: 'Governance process optimization and delegation framework'
  },
  'Technical Debt Accumulation': {
    description: 'Shortcuts being taken under schedule pressure, creating future risk',
    confidence: 0.84,
    agents: ['DeepRisk', 'DeepTMO'],
    historicalContext: 'Pattern leads to 40% increase in maintenance costs',
    recommendation: 'Technical review and quality gate enforcement'
  }
};

// Fact broadcast templates
const factBroadcastTemplates = {
  DeepFinOps: [
    'Budget variance trending negative: CPI {cpi}, trajectory suggests {trend}% overrun',
    'Cost efficiency declining: {metric}% degradation detected',
    'Spending velocity {velocity}% above baseline, burn rate critical',
    'Financial reserve activated: {amount} allocated for contingency'
  ],
  DeepTMO: [
    'Schedule buffer exhausted: critical path exposed to delays',
    'Resource utilization at {util}%: constraint identified',
    'Task completion velocity {velocity}% below plan',
    'Critical milestone at risk: {milestone} showing {delay} week slip'
  ],
  DeepRisk: [
    'Risk score elevated to {score}: probability and impact increasing',
    'New high-severity risk identified: {risk}',
    'Risk velocity accelerating: {count} new risks in 2-week period',
    'Risk materialization detected: {risk} impact realized'
  ],
  DeepGovernance: [
    'Compliance gap identified: {requirement} not met',
    'Governance gate criteria incomplete: {missing} artifacts required',
    'Policy violation detected: {policy} bypassed',
    'Regulatory deadline approaching: {days} days remaining'
  ],
  DeepOCM: [
    'Stakeholder sentiment declining: {metric} trending negative',
    'Change adoption at {percent}%: below {target}% target',
    'Resistance increasing: {count} stakeholder concerns raised',
    'Training effectiveness suboptimal: {metric} completion rate'
  ]
};

// A2A collaboration messages
const a2aMessageTemplates = [
  {
    from: 'DeepRisk',
    to: 'DeepFinOps',
    template: 'Risk analysis shows budget will exceed ${forecast}M if current trajectory continues. Recommend financial impact assessment and contingency activation.',
    urgency: 'high'
  },
  {
    from: 'DeepTMO',
    to: 'DeepRisk',
    template: 'Schedule delays in {task} creating cascade effect. Risk assessment needed for downstream impacts.',
    urgency: 'medium'
  },
  {
    from: 'DeepFinOps',
    to: 'DeepTMO',
    template: 'Budget constraints require schedule optimization. Current burn rate unsustainable. Recommend efficiency review.',
    urgency: 'high'
  },
  {
    from: 'DeepGovernance',
    to: 'DeepRisk',
    template: 'Regulatory approval delayed. Risk assessment required for compliance timeline impact.',
    urgency: 'high'
  },
  {
    from: 'DeepOCM',
    to: 'DeepTMO',
    template: 'Low stakeholder engagement impacting schedule. User acceptance testing at risk. Recommend stakeholder re-engagement.',
    urgency: 'medium'
  },
  {
    from: 'DeepRisk',
    to: ['DeepFinOps', 'DeepTMO', 'DeepPMO'],
    template: 'Triple Threat Pattern detected. Multi-agent collaboration required for integrated recovery plan.',
    urgency: 'critical'
  }
];

// Generate pattern detection observation
function generatePatternObservation(project, pattern, industryId, companyId) {
  const config = patternTemplates[pattern];
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 14) + 1;
  const observedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

  return {
    type: 'pattern_detection',
    projectName: project.name,
    industryId,
    companyId,
    pattern,
    description: config.description,
    confidence: config.confidence,
    observedAt: observedAt.toISOString(),
    detectingAgent: config.agents[0],
    broadcastTo: config.agents.slice(1),
    context: {
      cpi: project.budget.cpi,
      spi: project.schedule.spi,
      weeksLate: project.schedule.weeksLate,
      triggeredRules: project.triggeredRules
    },
    historicalContext: config.historicalContext,
    recommendation: config.recommendation
  };
}

// Generate fact broadcast
function generateFactBroadcast(project, agentType, industryId, companyId) {
  const templates = factBroadcastTemplates[agentType];
  if (!templates) return null;

  const template = templates[Math.floor(Math.random() * templates.length)];
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 21) + 1;
  const broadcastAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

  let fact = template
    .replace('{cpi}', project.budget.cpi.toFixed(2))
    .replace('{spi}', project.schedule.spi.toFixed(2))
    .replace('{trend}', Math.floor(Math.random() * 15) + 10)
    .replace('{metric}', Math.floor(Math.random() * 20) + 15)
    .replace('{velocity}', Math.floor(Math.random() * 25) + 15)
    .replace('{amount}', `$${Math.floor(Math.random() * 5) + 1}M`)
    .replace('{util}', Math.floor(Math.random() * 15) + 85)
    .replace('{milestone}', project.tasks.find(t => t.status === 'pending')?.name || 'key milestone')
    .replace('{delay}', Math.abs(project.schedule.weeksLate))
    .replace('{score}', Math.floor(Math.random() * 20) + 75)
    .replace('{risk}', project.triggeredRules[0] || 'technical complexity')
    .replace('{count}', Math.floor(Math.random() * 5) + 3)
    .replace('{requirement}', 'documentation completeness')
    .replace('{missing}', Math.floor(Math.random() * 3) + 2)
    .replace('{policy}', 'approval workflow')
    .replace('{days}', Math.floor(Math.random() * 30) + 15)
    .replace('{percent}', Math.floor(Math.random() * 20) + 40)
    .replace('{target}', Math.floor(Math.random() * 15) + 70);

  return {
    type: 'fact_broadcast',
    projectName: project.name,
    industryId,
    companyId,
    sourceAgent: agentType,
    fact,
    broadcastAt: broadcastAt.toISOString(),
    visibility: 'all_agents',
    priority: project.healthStatus === 'critical' ? 'high' : 'medium',
    metrics: {
      cpi: project.budget.cpi,
      spi: project.schedule.spi,
      weeksLate: project.schedule.weeksLate
    }
  };
}

// Generate A2A collaboration message
function generateA2AMessage(project, industryId, companyId) {
  const messageConfig = a2aMessageTemplates[Math.floor(Math.random() * a2aMessageTemplates.length)];
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 14) + 1;
  const sentAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

  let message = messageConfig.template
    .replace('{forecast}', (project.budget.forecast / 1000000).toFixed(1))
    .replace('{task}', project.tasks.find(t => t.status === 'in_progress')?.name || 'implementation phase');

  return {
    type: 'agent_collaboration',
    projectName: project.name,
    industryId,
    companyId,
    fromAgent: messageConfig.from,
    toAgent: Array.isArray(messageConfig.to) ? messageConfig.to : [messageConfig.to],
    message,
    sentAt: sentAt.toISOString(),
    urgency: messageConfig.urgency,
    requiresResponse: messageConfig.urgency === 'critical' || messageConfig.urgency === 'high',
    context: {
      projectHealth: project.healthStatus,
      triggeredRules: project.triggeredRules
    }
  };
}

// Main execution
console.log('═══════════════════════════════════════════════════');
console.log('   ACME Agent Observations Generator');
console.log('═══════════════════════════════════════════════════\n');

const projectsPath = path.join(__dirname, '../seed-data/acme-project-templates.json');
const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

const allObservations = [];
let patternCount = 0;
let factCount = 0;
let a2aCount = 0;

for (const industry of projects) {
  for (const project of industry.projects) {
    // Only generate observations for projects with issues
    if (project.healthStatus === 'healthy') continue;

    // Pattern detection for critical projects
    if (project.healthStatus === 'critical') {
      const patterns = Object.keys(patternTemplates);
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      allObservations.push(generatePatternObservation(project, pattern, industry.industryId, industry.companyId));
      patternCount++;
    }

    // Fact broadcasts from each involved agent
    for (const agentType of project.interventionTypes) {
      const fact = generateFactBroadcast(project, agentType, industry.industryId, industry.companyId);
      if (fact) {
        allObservations.push(fact);
        factCount++;
      }
    }

    // A2A messages for critical and warning projects
    if (project.healthStatus === 'critical' || project.healthStatus === 'warning') {
      allObservations.push(generateA2AMessage(project, industry.industryId, industry.companyId));
      a2aCount++;
    }
  }
}

// Sort by timestamp (oldest first)
allObservations.sort((a, b) => {
  const dateA = new Date(a.observedAt || a.broadcastAt || a.sentAt);
  const dateB = new Date(b.observedAt || b.broadcastAt || b.sentAt);
  return dateA - dateB;
});

// Write observations file
const observationsPath = path.join(__dirname, '../seed-data/acme-observations.json');
fs.writeFileSync(observationsPath, JSON.stringify(allObservations, null, 2));

console.log(`  ✓ Pattern Detections: ${patternCount}`);
console.log(`  ✓ Fact Broadcasts: ${factCount}`);
console.log(`  ✓ A2A Collaboration Messages: ${a2aCount}`);

console.log('\n═══════════════════════════════════════════════════');
console.log(`✅ Complete! Generated ${allObservations.length} agent observations`);
console.log(`📁 Saved to: acme-observations.json`);
console.log('═══════════════════════════════════════════════════');
