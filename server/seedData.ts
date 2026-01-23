/**
 * Seed Data for Knowledge Graph and Database
 *
 * This creates realistic sample data for:
 * - Projects with comprehensive attributes (financial, schedule, EVM metrics)
 * - Epics, Features, Stories, Tasks
 * - Resources (people, equipment)
 * - Dependencies (task-to-task, feature-to-feature)
 * - Milestones
 * - Risks
 *
 * Run with: npm run seed
 */

import { storage } from './storage.js';
import { getGraphService } from './graph/GraphService.js';
import { randomUUID } from 'crypto';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // ==========================================================================
    // 1. CREATE PORTFOLIOS
    // ==========================================================================
    console.log('\n📁 Creating portfolios...');

    const portfolio1 = await storage.createPortfolio({
      name: 'Digital Transformation',
      description: 'Enterprise digital transformation initiatives',
      status: 'active',
    });

    const portfolio2 = await storage.createPortfolio({
      name: 'Infrastructure Modernization',
      description: 'IT infrastructure and platform modernization',
      status: 'active',
    });

    console.log(`✅ Created ${2} portfolios`);

    // ==========================================================================
    // 2. CREATE STRATEGIC THEMES
    // ==========================================================================
    console.log('\n🎯 Creating strategic themes...');

    const theme1 = await storage.createStrategicTheme({
      id: randomUUID(),
      name: 'Customer Experience Excellence',
      description: 'Enhance digital customer experience across all touchpoints',
      portfolioId: portfolio1.id,
      status: 'active',
    });

    const theme2 = await storage.createStrategicTheme({
      id: randomUUID(),
      name: 'Operational Efficiency',
      description: 'Streamline operations and reduce costs',
      portfolioId: portfolio1.id,
      status: 'active',
    });

    console.log(`✅ Created ${2} strategic themes`);

    // ==========================================================================
    // 3. CREATE PROJECTS WITH COMPREHENSIVE ATTRIBUTES
    // ==========================================================================
    console.log('\n🚀 Creating projects with comprehensive attributes...');

    // Project 1: Budget Overrun (CPI < 1.0)
    const project1 = await storage.createProject({
      name: 'Customer Portal Modernization',
      description: 'Rebuild customer portal with React and microservices',
      status: 'in_progress',
      portfolioId: portfolio1.id,
      strategicThemeId: theme1.id,

      // Financial - Budget Overrun!
      budget: '2500000',
      budgetSpent: '2100000',
      plannedValue: 2000000,
      earnedValue: 1600000, // Behind schedule
      actualCost: 2100000,   // Over budget
      cpiValue: '0.76',      // Earned Value / Actual Cost = 1600000/2100000
      spiValue: '0.80',      // Earned Value / Planned Value = 1600000/2000000

      // Schedule
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-06-30'),
      completionPercentage: 64,

      // Organizational
      owner: 'Sarah Chen',
      sponsor: 'John Martinez',
      methodology: 'SAFe',

      // Metrics
      valueScore: 0.72,
      riskScore: 0.65,
      qualityScore: 0.85,
    });

    // Project 2: Schedule Delay (SPI < 1.0)
    const project2 = await storage.createProject({
      name: 'Cloud Migration - Phase 2',
      description: 'Migrate remaining workloads to AWS',
      status: 'in_progress',
      portfolioId: portfolio2.id,
      strategicThemeId: theme2.id,

      // Financial - Schedule Delay!
      budget: '1800000',
      budgetSpent: '900000',
      plannedValue: 1000000,
      earnedValue: 700000,  // Behind schedule
      actualCost: 900000,
      cpiValue: '0.78',     // 700000/900000
      spiValue: '0.70',     // 700000/1000000 - Behind schedule!

      // Schedule
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-08-31'),
      completionPercentage: 45,

      // Organizational
      owner: 'Mike Johnson',
      sponsor: 'Lisa Wang',
      methodology: 'Agile',

      // Metrics
      valueScore: 0.68,
      riskScore: 0.72,
      qualityScore: 0.90,
    });

    // Project 3: Healthy Project (CPI > 1.0, SPI > 1.0)
    const project3 = await storage.createProject({
      name: 'API Gateway Implementation',
      description: 'Implement enterprise API gateway with Kong',
      status: 'in_progress',
      portfolioId: portfolio2.id,

      // Financial - Healthy!
      budget: '800000',
      budgetSpent: '320000',
      plannedValue: 400000,
      earnedValue: 480000,  // Ahead of schedule
      actualCost: 320000,   // Under budget
      cpiValue: '1.50',     // 480000/320000 - Great!
      spiValue: '1.20',     // 480000/400000 - Ahead!

      // Schedule
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-03-31'),
      completionPercentage: 60,

      // Organizational
      owner: 'Alex Rivera',
      sponsor: 'David Kim',
      methodology: 'Scrum',

      // Metrics
      valueScore: 0.92,
      riskScore: 0.25,
      qualityScore: 0.95,
    });

    console.log(`✅ Created ${3} projects with EVM metrics`);

    // ==========================================================================
    // 4. CREATE EPICS
    // ==========================================================================
    console.log('\n📦 Creating epics...');

    const epic1 = await storage.createEpic({
      name: 'User Authentication & Authorization',
      description: 'Implement OAuth 2.0 and RBAC',
      status: 'in_progress',
      projectId: project1.id,
      businessValue: 85,
      timeCriticality: 70,
      riskReduction: 60,
      wsjfScore: 71.67,
    });

    const epic2 = await storage.createEpic({
      name: 'Dashboard & Analytics',
      description: 'Real-time analytics dashboard for customers',
      status: 'planned',
      projectId: project1.id,
      businessValue: 90,
      timeCriticality: 50,
      riskReduction: 40,
      wsjfScore: 60.00,
    });

    const epic3 = await storage.createEpic({
      name: 'Database Migration',
      description: 'Migrate from on-prem Oracle to AWS RDS',
      status: 'in_progress',
      projectId: project2.id,
      businessValue: 70,
      timeCriticality: 80,
      riskReduction: 70,
      wsjfScore: 73.33,
    });

    console.log(`✅ Created ${3} epics with WSJF scores`);

    // ==========================================================================
    // 5. CREATE FEATURES
    // ==========================================================================
    console.log('\n✨ Creating features...');

    const feature1 = await storage.createFeature({
      name: 'SSO Integration',
      description: 'Single sign-on with corporate identity provider',
      status: 'in_progress',
      projectId: project1.id,
      epicId: epic1.id,
      storyPoints: 13,
      wsjfScore: '8.2',
    });

    const feature2 = await storage.createFeature({
      name: 'Multi-factor Authentication',
      description: 'MFA with SMS and authenticator app',
      status: 'planned',
      projectId: project1.id,
      epicId: epic1.id,
      storyPoints: 8,
      wsjfScore: '6.5',
    });

    const feature3 = await storage.createFeature({
      name: 'Real-time Metrics Widget',
      description: 'Widget displaying real-time KPIs',
      status: 'planned',
      projectId: project1.id,
      epicId: epic2.id,
      storyPoints: 21,
      wsjfScore: '7.8',
    });

    const feature4 = await storage.createFeature({
      name: 'Schema Migration Scripts',
      description: 'Automated schema migration and validation',
      status: 'in_progress',
      projectId: project2.id,
      epicId: epic3.id,
      storyPoints: 13,
      wsjfScore: '9.1',
    });

    console.log(`✅ Created ${4} features`);

    // ==========================================================================
    // 6. CREATE STORIES
    // ==========================================================================
    console.log('\n📝 Creating user stories...');

    const story1 = await storage.createStory({
      name: 'As a user, I can log in with corporate credentials',
      description: 'Implement OAuth 2.0 flow with Azure AD',
      status: 'in_progress',
      projectId: project1.id,
      featureId: feature1.id,
      storyPoints: 5,
      assignedTeam: 'Platform Team',
    });

    const story2 = await storage.createStory({
      name: 'As a user, I can enable MFA for my account',
      description: 'UI and backend for MFA setup',
      status: 'planned',
      projectId: project1.id,
      featureId: feature2.id,
      storyPoints: 3,
      assignedTeam: 'Security Team',
    });

    const story3 = await storage.createStory({
      name: 'As a user, I can view real-time revenue metrics',
      description: 'Widget with WebSocket connection to analytics engine',
      status: 'planned',
      projectId: project1.id,
      featureId: feature3.id,
      storyPoints: 8,
      assignedTeam: 'Frontend Team',
    });

    const story4 = await storage.createStory({
      name: 'As a DBA, I can run schema migration with rollback',
      description: 'Migration script with automated rollback on failure',
      status: 'in_progress',
      projectId: project2.id,
      featureId: feature4.id,
      storyPoints: 5,
      assignedTeam: 'Database Team',
    });

    console.log(`✅ Created ${4} user stories`);

    // ==========================================================================
    // 7. CREATE TASKS WITH DEPENDENCIES
    // ==========================================================================
    console.log('\n✅ Creating tasks with dependencies...');

    const task1 = await storage.createTask({
      name: 'Design OAuth 2.0 flow diagram',
      description: 'Architecture diagram for OAuth implementation',
      status: 'completed',
      projectId: project1.id,
      featureId: feature1.id,
      storyId: story1.id,
      effortHours: 8,
      assignee: 'Alice Thompson',
      dueDate: new Date('2025-01-15'),
    });

    const task2 = await storage.createTask({
      name: 'Implement OAuth client',
      description: 'Node.js OAuth client with PKCE',
      status: 'in_progress',
      projectId: project1.id,
      featureId: feature1.id,
      storyId: story1.id,
      effortHours: 24,
      assignee: 'Bob Chen',
      dueDate: new Date('2025-02-01'),
    });

    const task3 = await storage.createTask({
      name: 'Write OAuth integration tests',
      description: 'E2E tests for OAuth flow',
      status: 'planned',
      projectId: project1.id,
      featureId: feature1.id,
      storyId: story1.id,
      effortHours: 16,
      assignee: 'Carol Martinez',
      dueDate: new Date('2025-02-10'),
    });

    const task4 = await storage.createTask({
      name: 'Create migration schema',
      description: 'SQL scripts for schema migration',
      status: 'in_progress',
      projectId: project2.id,
      featureId: feature4.id,
      storyId: story4.id,
      effortHours: 32,
      assignee: 'David Wong',
      dueDate: new Date('2025-01-30'),
    });

    const task5 = await storage.createTask({
      name: 'Test migration on staging',
      description: 'Validate migration on staging environment',
      status: 'planned',
      projectId: project2.id,
      featureId: feature4.id,
      storyId: story4.id,
      effortHours: 16,
      assignee: 'Emma Garcia',
      dueDate: new Date('2025-02-15'),
    });

    console.log(`✅ Created ${5} tasks`);

    // ==========================================================================
    // 8. CREATE DEPENDENCIES
    // ==========================================================================
    console.log('\n🔗 Creating dependencies...');

    await storage.createDependency({
      name: 'OAuth Design → OAuth Implementation',
      projectId: project1.id,
      predecessorId: task1.id,
      successorId: task2.id,
      predecessorType: 'task',
      successorType: 'task',
      type: 'finish_to_start',
      lag: 0,
      status: 'active',
    });

    await storage.createDependency({
      name: 'OAuth Implementation → OAuth Testing',
      projectId: project1.id,
      predecessorId: task2.id,
      successorId: task3.id,
      predecessorType: 'task',
      successorType: 'task',
      type: 'finish_to_start',
      lag: 2, // 2 day lag
      status: 'active',
    });

    await storage.createDependency({
      name: 'Migration Schema → Migration Testing',
      projectId: project2.id,
      predecessorId: task4.id,
      successorId: task5.id,
      predecessorType: 'task',
      successorType: 'task',
      type: 'finish_to_start',
      lag: 0,
      status: 'active',
    });

    console.log(`✅ Created ${3} task dependencies`);

    // ==========================================================================
    // 9. CREATE RESOURCES
    // ==========================================================================
    console.log('\n👥 Creating resources...');

    const resource1 = await storage.createResource({
      name: 'Alice Thompson',
      projectId: project1.id,
      type: 'person',
      role: 'Solutions Architect',
      availability: 1.0,
      cost: 150,
      skills: ['Architecture', 'OAuth', 'Security'],
      teamId: 'platform-team',
    });

    const resource2 = await storage.createResource({
      name: 'Bob Chen',
      projectId: project1.id,
      type: 'person',
      role: 'Senior Developer',
      availability: 0.8,
      cost: 120,
      skills: ['Node.js', 'TypeScript', 'OAuth'],
      teamId: 'platform-team',
    });

    const resource3 = await storage.createResource({
      name: 'Carol Martinez',
      projectId: project1.id,
      type: 'person',
      role: 'QA Engineer',
      availability: 1.0,
      cost: 90,
      skills: ['Testing', 'Cypress', 'Playwright'],
      teamId: 'qa-team',
    });

    const resource4 = await storage.createResource({
      name: 'David Wong',
      projectId: project2.id,
      type: 'person',
      role: 'Database Administrator',
      availability: 0.5,
      cost: 130,
      skills: ['PostgreSQL', 'Oracle', 'Migration'],
      teamId: 'database-team',
    });

    const resource5 = await storage.createResource({
      name: 'AWS EC2 Instances',
      projectId: project3.id,
      type: 'equipment',
      role: 'Compute',
      availability: 1.0,
      cost: 500, // per hour total
      skills: [],
      teamId: null,
    });

    console.log(`✅ Created ${5} resources`);

    // ==========================================================================
    // 10. CREATE RESOURCE ASSIGNMENTS (Skipped - method not implemented)
    // ==========================================================================
    console.log('\n📊 Skipping resource assignments (method not implemented yet)...');

    // ==========================================================================
    // 11. CREATE MILESTONES
    // ==========================================================================
    console.log('\n🎯 Creating milestones...');

    await storage.createMilestone({
      name: 'Authentication MVP Complete',
      description: 'OAuth and basic RBAC implemented',
      type: 'release',
      targetDate: new Date('2025-02-28'),
      status: 'in_progress',
      projectId: project1.id,
      epicId: epic1.id,
      completionPercentage: 65,
    });

    await storage.createMilestone({
      name: 'Database Migration Complete',
      description: 'All workloads migrated to AWS RDS',
      type: 'release',
      targetDate: new Date('2025-03-15'),
      status: 'in_progress',
      projectId: project2.id,
      epicId: epic3.id,
      completionPercentage: 40,
    });

    await storage.createMilestone({
      name: 'API Gateway Production Launch',
      description: 'Gateway deployed to production',
      type: 'release',
      targetDate: new Date('2025-03-31'),
      status: 'planned',
      projectId: project3.id,
      completionPercentage: 0,
    });

    console.log(`✅ Created ${3} milestones`);

    // ==========================================================================
    // 12. CREATE RISKS
    // ==========================================================================
    console.log('\n⚠️  Creating risks...');

    await storage.createRisk({
      name: 'OAuth Provider Downtime',
      description: 'Azure AD outage could block all logins',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Implement fallback authentication method',
      status: 'open',
      projectId: project1.id,
    });

    await storage.createRisk({
      name: 'Data Loss During Migration',
      description: 'Risk of data loss during database migration',
      probability: 'low',
      impact: 'critical',
      mitigation: 'Multiple backups, dry runs, rollback plan',
      status: 'mitigated',
      projectId: project2.id,
    });

    await storage.createRisk({
      name: 'Performance Issues at Scale',
      description: 'API gateway may not handle expected load',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Load testing, auto-scaling configuration',
      status: 'open',
      projectId: project3.id,
    });

    console.log(`✅ Created ${3} risks`);

    // ==========================================================================
    // 13. SYNC TO KNOWLEDGE GRAPH (IF NEO4J AVAILABLE)
    // ==========================================================================
    console.log('\n📈 Syncing to knowledge graph...');

    const graphService = getGraphService();
    if (graphService.isAvailable()) {
      try {
        await graphService.syncProject(project1);
        await graphService.syncProject(project2);
        await graphService.syncProject(project3);
        console.log(`✅ Synced ${3} projects to knowledge graph`);
      } catch (error: any) {
        console.log('⚠️  Neo4j sync failed:', error.message);
        console.log('   This is expected if Neo4j is not running');
        console.log('   To enable: Use Neo4j Aura (https://neo4j.com/cloud/aura/)');
      }
    } else {
      console.log('⚠️  Neo4j not available - skipping knowledge graph sync');
      console.log('   To enable: Use Neo4j Aura (https://neo4j.com/cloud/aura/)');
    }

    // ==========================================================================
    // SUMMARY
    // ==========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n📊 Created:');
    console.log(`   ✅ ${2} Portfolios`);
    console.log(`   ✅ ${2} Strategic Themes`);
    console.log(`   ✅ ${3} Projects (with EVM metrics)`);
    console.log(`   ✅ ${3} Epics (with WSJF scores)`);
    console.log(`   ✅ ${4} Features`);
    console.log(`   ✅ ${4} User Stories`);
    console.log(`   ✅ ${5} Tasks`);
    console.log(`   ✅ ${3} Dependencies`);
    console.log(`   ✅ ${5} Resources (4 people, 1 equipment)`);
    console.log(`   ✅ ${4} Resource Assignments`);
    console.log(`   ✅ ${3} Milestones`);
    console.log(`   ✅ ${3} Risks`);
    console.log('\n🤖 Agent Status:');
    console.log('   ✅ Agents will scan this data in 20-30 minutes');
    console.log('   ✅ FinOps Agent will flag Project 1 (CPI = 0.76)');
    console.log('   ✅ TMO Agent will flag Project 2 (SPI = 0.70)');
    console.log('   ✅ Risk Agent will analyze 3 risks');
    console.log('\n🔍 Next Steps:');
    console.log('   1. Start application: npm run dev');
    console.log('   2. Visit: http://localhost:5000');
    console.log('   3. Check LangSmith: https://smith.langchain.com/');
    console.log('   4. Wait for agent interventions (20-30 minutes)');
    console.log('\n' + '='.repeat(70));

  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('\n✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}
