#!/usr/bin/env node
/**
 * ACME Battle Rhythm Events Generator
 * Creates 4 weeks of Battle Rhythm event history
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Battle Rhythm event types
const eventTypes = {
  sunday_recon: {
    name: 'Sunday Reconnaissance',
    description: 'Automated portfolio health scan and issue identification',
    time: '19:00:00'
  },
  monday_briefing: {
    name: 'Monday Morning Briefing',
    description: 'Executive summary of portfolio health and priorities',
    time: '07:00:00'
  },
  wednesday_checkpoint: {
    name: 'Wednesday Checkpoint',
    description: 'Mid-week progress review and emerging issues',
    time: '14:00:00'
  },
  friday_synthesis: {
    name: 'Friday Synthesis',
    description: 'Week-over-week comparison and lessons learned',
    time: '16:00:00'
  }
};

// Get date for specific day of week going back N weeks
function getWeekdayDate(weeksAgo, dayOfWeek, time) {
  const now = new Date();
  const daysToSubtract = (weeksAgo * 7) + (now.getDay() - dayOfWeek);
  const date = new Date(now - daysToSubtract * 24 * 60 * 60 * 1000);

  const [hours, minutes, seconds] = time.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);

  return date;
}

// Generate Sunday Recon event
function generateSundayRecon(industryId, weekNumber, projects) {
  const eventDate = getWeekdayDate(weekNumber, 0, eventTypes.sunday_recon.time); // 0 = Sunday

  const criticalProjects = projects.filter(p => p.healthStatus === 'critical').length;
  const warningProjects = projects.filter(p => p.healthStatus === 'warning').length;
  const riskProjects = projects.filter(p => p.healthStatus === 'risk').length;
  const governanceProjects = projects.filter(p => p.healthStatus === 'governance').length;
  const healthyProjects = projects.filter(p => p.healthStatus === 'healthy').length;

  const issuesIdentified = criticalProjects * 3 + warningProjects * 2 + riskProjects + governanceProjects;

  return {
    type: 'sunday_recon',
    industryId,
    eventName: eventTypes.sunday_recon.name,
    eventDate: eventDate.toISOString(),
    weekNumber: 4 - weekNumber,
    summary: {
      projectsScanned: projects.length,
      issuesIdentified,
      portfolioHealthScore: Math.round(((healthyProjects * 100 + warningProjects * 60 + riskProjects * 40) / projects.length)),
      criticalCount: criticalProjects,
      warningCount: warningProjects,
      riskCount: riskProjects,
      governanceCount: governanceProjects,
      healthyCount: healthyProjects
    },
    findings: [
      `${criticalProjects} projects require immediate attention`,
      `${warningProjects} projects showing warning indicators`,
      `${issuesIdentified} total issues identified for Monday briefing`,
      `Portfolio health score: ${Math.round((healthyProjects / projects.length) * 100)}% healthy projects`
    ]
  };
}

// Generate Monday Briefing event
function generateMondayBriefing(industryId, weekNumber, projects) {
  const eventDate = getWeekdayDate(weekNumber, 1, eventTypes.monday_briefing.time); // 1 = Monday

  const criticalProjects = projects.filter(p => p.healthStatus === 'critical');
  const budgetVariance = projects.reduce((sum, p) => sum + ((p.budget.forecast - p.budget.planned) / p.budget.planned), 0) / projects.length;
  const scheduleVariance = projects.filter(p => p.schedule.weeksLate > 0).length;

  const topIssues = [
    ...criticalProjects.slice(0, 3).map(p => `${p.name}: ${p.triggeredRules.join(', ')}`),
    scheduleVariance > 3 ? `${scheduleVariance} projects behind schedule` : null,
    budgetVariance > 0.1 ? `Portfolio budget variance: ${(budgetVariance * 100).toFixed(1)}%` : null
  ].filter(Boolean);

  return {
    type: 'monday_briefing',
    industryId,
    eventName: eventTypes.monday_briefing.name,
    eventDate: eventDate.toISOString(),
    weekNumber: 4 - weekNumber,
    executiveSummary: {
      portfolioHealth: criticalProjects.length === 0 ? 'Stable' : criticalProjects.length < 3 ? 'Attention Required' : 'Critical',
      criticalProjects: criticalProjects.length,
      budgetStatus: budgetVariance > 0.1 ? 'Over' : budgetVariance < -0.05 ? 'Under' : 'On Track',
      scheduleStatus: scheduleVariance > 3 ? 'Behind' : scheduleVariance === 0 ? 'On Track' : 'Minor Delays',
      topIssues,
      recommendedActions: [
        criticalProjects.length > 0 ? `Review ${criticalProjects.length} critical projects` : 'Continue monitoring',
        scheduleVariance > 3 ? 'Schedule recovery planning' : null,
        budgetVariance > 0.1 ? 'Budget reforecast required' : null
      ].filter(Boolean)
    },
    metrics: {
      avgCPI: (projects.reduce((sum, p) => sum + p.budget.cpi, 0) / projects.length).toFixed(2),
      avgSPI: (projects.reduce((sum, p) => sum + p.schedule.spi, 0) / projects.length).toFixed(2),
      portfolioBudgetVariance: (budgetVariance * 100).toFixed(1) + '%',
      projectsAtRisk: criticalProjects.length + projects.filter(p => p.healthStatus === 'warning').length
    },
    agentRecommendations: [
      criticalProjects.length > 0 ? {agent: 'DeepRisk', recommendation: `Escalation required for ${criticalProjects.length} critical projects`} : null,
      budgetVariance > 0.1 ? {agent: 'DeepFinOps', recommendation: 'Portfolio budget reforecast recommended'} : null,
      scheduleVariance > 3 ? {agent: 'DeepTMO', recommendation: 'Schedule recovery plans needed'} : null
    ].filter(Boolean)
  };
}

// Generate Wednesday Checkpoint event
function generateWednesdayCheckpoint(industryId, weekNumber, projects) {
  const eventDate = getWeekdayDate(weekNumber, 3, eventTypes.wednesday_checkpoint.time); // 3 = Wednesday

  const inProgressProjects = projects.filter(p => p.tasks.some(t => t.status === 'in_progress'));
  const newIssues = Math.floor(Math.random() * 5) + 2;
  const resolvedIssues = Math.floor(Math.random() * 3) + 1;

  return {
    type: 'wednesday_checkpoint',
    industryId,
    eventName: eventTypes.wednesday_checkpoint.name,
    eventDate: eventDate.toISOString(),
    weekNumber: 4 - weekNumber,
    progressUpdate: {
      activeProjects: inProgressProjects.length,
      newIssuesSinceMonday: newIssues,
      resolvedIssues,
      netIssueChange: newIssues - resolvedIssues,
      trendingDirection: newIssues > resolvedIssues ? 'Increasing' : 'Improving'
    },
    highlights: [
      `${inProgressProjects.length} projects with active work`,
      `${newIssues} new issues identified since Monday`,
      `${resolvedIssues} issues resolved this week`,
      newIssues > resolvedIssues ? 'Issue count trending up - attention needed' : 'Progress trending positive'
    ],
    criticalUpdates: projects
      .filter(p => p.healthStatus === 'critical')
      .slice(0, 2)
      .map(p => ({
        project: p.name,
        status: 'No significant improvement',
        recommendation: 'Escalation may be required if no progress by Friday'
      }))
  };
}

// Generate Friday Synthesis event
function generateFridaySynthesis(industryId, weekNumber, projects) {
  const eventDate = getWeekdayDate(weekNumber, 5, eventTypes.friday_synthesis.time); // 5 = Friday

  const improved = Math.floor(Math.random() * 3) + 1;
  const deteriorated = Math.floor(Math.random() * 2);
  const stable = projects.length - improved - deteriorated;

  const avgCPI = projects.reduce((sum, p) => sum + p.budget.cpi, 0) / projects.length;
  const avgSPI = projects.reduce((sum, p) => sum + p.schedule.spi, 0) / projects.length;

  return {
    type: 'friday_synthesis',
    industryId,
    eventName: eventTypes.friday_synthesis.name,
    eventDate: eventDate.toISOString(),
    weekNumber: 4 - weekNumber,
    weekOverWeekComparison: {
      projectsImproved: improved,
      projectsDeteriorated: deteriorated,
      projectsStable: stable,
      overallTrend: improved > deteriorated ? 'Positive' : improved === deteriorated ? 'Stable' : 'Negative',
      portfolioHealth: avgCPI > 0.95 && avgSPI > 0.95 ? 'Good' : avgCPI < 0.85 || avgSPI < 0.85 ? 'Poor' : 'Fair'
    },
    metrics: {
      weeklyAvgCPI: avgCPI.toFixed(2),
      weeklyAvgSPI: avgSPI.toFixed(2),
      cpiTrend: Math.random() > 0.5 ? '+0.02' : '-0.01',
      spiTrend: Math.random() > 0.5 ? '+0.01' : '-0.02'
    },
    lessonsLearned: [
      improved > 0 ? `${improved} projects showed improvement through targeted interventions` : null,
      deteriorated > 0 ? `${deteriorated} projects require enhanced oversight` : null,
      'Agent collaboration effectiveness: High - pattern detection preventing escalations',
      'Risk mitigation strategies proving effective across portfolio'
    ].filter(Boolean),
    nextWeekFocus: [
      `Monitor ${projects.filter(p => p.healthStatus === 'critical').length} critical projects`,
      'Continue proactive risk management',
      'Reinforce successful intervention strategies',
      'Prepare for Q-end governance reviews'
    ]
  };
}

// Main execution
console.log('═══════════════════════════════════════════════════');
console.log('   ACME Battle Rhythm Events Generator');
console.log('═══════════════════════════════════════════════════\n');

const projectsPath = path.join(__dirname, '../seed-data/acme-project-templates.json');
const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

const allEvents = [];

// Generate 4 weeks of history for each industry
for (const industry of projectsData) {
  for (let week = 0; week < 4; week++) {
    allEvents.push(generateSundayRecon(industry.industryId, week, industry.projects));
    allEvents.push(generateMondayBriefing(industry.industryId, week, industry.projects));
    allEvents.push(generateWednesdayCheckpoint(industry.industryId, week, industry.projects));
    allEvents.push(generateFridaySynthesis(industry.industryId, week, industry.projects));
  }
}

// Sort by date (oldest first)
allEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

// Write Battle Rhythm events file
const eventsPath = path.join(__dirname, '../seed-data/acme-battle-rhythm.json');
fs.writeFileSync(eventsPath, JSON.stringify(allEvents, null, 2));

console.log(`  ✓ Sunday Reconnaissance events: ${allEvents.filter(e => e.type === 'sunday_recon').length}`);
console.log(`  ✓ Monday Briefing events: ${allEvents.filter(e => e.type === 'monday_briefing').length}`);
console.log(`  ✓ Wednesday Checkpoint events: ${allEvents.filter(e => e.type === 'wednesday_checkpoint').length}`);
console.log(`  ✓ Friday Synthesis events: ${allEvents.filter(e => e.type === 'friday_synthesis').length}`);

console.log('\n═══════════════════════════════════════════════════');
console.log(`✅ Complete! Generated ${allEvents.length} Battle Rhythm events (4 weeks × 20 industries)`);
console.log(`📁 Saved to: acme-battle-rhythm.json`);
console.log('═══════════════════════════════════════════════════');
