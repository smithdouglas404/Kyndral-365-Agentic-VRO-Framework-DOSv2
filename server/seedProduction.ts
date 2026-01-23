/**
 * PRODUCTION DATA SEEDING
 * Seeds the database with realistic production data
 * NO MORE HARDCODED CLIENT DATA
 */

import { db } from './db.js';
import type { IStorage } from './storage.js';
import {
  projects, programs, portfolios, businessUnits, valueStreams,
  features, stories, tasks, sprints, risks, issues,
  okrs, keyResults, kpis, milestones, dependencies,
  projectFinancials, resources, resourceAllocations
} from '../shared/schema.js';

export async function seedProductionData(storage: IStorage) {
  console.log('🌱 Seeding production data...');

  try {
    // Check if data already exists
    const existingProjects = await db.select().from(projects);
    if (existingProjects.length > 10) {
      console.log('⚠️  Database already has production data. Skipping seed.');
      console.log(`   Found ${existingProjects.length} projects already in database.`);
      return {
        success: true,
        skipped: true,
        businessUnits: [],
        portfolios: [],
        programs: [],
        projects: existingProjects,
      };
    }

    // 1. CREATE BUSINESS UNITS
    console.log('Creating business units...');
    const bu1 = await storage.createBusinessUnit({
      name: 'Enterprise Technology',
      description: 'Technology transformation and digital initiatives',
      code: 'ET',
      parentId: null,
      leader: 'CTO Office',
    });

    const bu2 = await storage.createBusinessUnit({
      name: 'Operations',
      description: 'Operational excellence and process improvement',
      code: 'OPS',
      parentId: null,
      leader: 'COO Office',
    });

    const bu3 = await storage.createBusinessUnit({
      name: 'Finance',
      description: 'Financial systems and reporting',
      code: 'FIN',
      parentId: null,
      leader: 'CFO Office',
    });

    // 2. CREATE PORTFOLIOS
    console.log('Creating portfolios...');
    const portfolio1 = await storage.createPortfolio({
      name: 'Digital Transformation',
      description: 'Enterprise-wide digital transformation initiatives',
      businessUnitId: bu1.id,
      owner: 'VP Digital',
      status: 'active',
      budgetTotal: '15000000',
      budgetAllocated: '12500000',
      budgetSpent: '8900000',
    });

    const portfolio2 = await storage.createPortfolio({
      name: 'Infrastructure Modernization',
      description: 'Cloud migration and infrastructure upgrades',
      businessUnitId: bu1.id,
      owner: 'VP Infrastructure',
      status: 'active',
      budgetTotal: '8500000',
      budgetAllocated: '7200000',
      budgetSpent: '4100000',
    });

    // 3. CREATE PROGRAMS
    console.log('Creating programs...');
    const program1Result = await db.insert(programs).values({
      name: 'Cloud Migration Initiative',
      description: 'Migrate legacy applications to cloud infrastructure',
      portfolioId: portfolio2.id,
      owner: 'Director Cloud',
      status: 'active',
      startDate: new Date('2025-01-15'),
      targetEndDate: new Date('2026-06-30'),
      budgetTotal: '4500000',
      budgetSpent: '1850000',
    }).returning();
    const program1 = program1Result[0];

    const program2Result = await db.insert(programs).values({
      name: 'Customer Experience Platform',
      description: 'Build unified customer engagement platform',
      portfolioId: portfolio1.id,
      owner: 'Director Customer Tech',
      status: 'active',
      startDate: new Date('2025-03-01'),
      targetEndDate: new Date('2026-09-30'),
      budgetTotal: '6200000',
      budgetSpent: '2100000',
    }).returning();
    const program2 = program2Result[0];

    // 4. CREATE VALUE STREAMS
    console.log('Creating value streams...');
    const vs1Result = await db.insert(valueStreams).values({
      name: 'Customer Onboarding',
      description: 'End-to-end customer onboarding experience',
      portfolioId: portfolio1.id,
      owner: 'VP Customer Success',
      leadTime: '14',
      cycleTime: '8',
      throughput: '45',
    }).returning();
    const vs1 = vs1Result[0];

    // 5. CREATE PROJECTS
    console.log('Creating projects...');
    const projects_created = [];

    const project1 = await storage.createProject({
      name: 'CRM System Upgrade',
      description: 'Upgrade to Salesforce Enterprise Edition with custom integrations',
      portfolioId: portfolio1.id,
      businessUnitId: bu1.id,
      programId: program2.id,
      owner: 'Sarah Chen',
      status: 'active',
      priority: 'high',
      startDate: new Date('2025-04-01'),
      targetEndDate: new Date('2025-12-31'),
      budget: '850000',
      actualCost: '320000',
      progress: 38,
      progressPercentage: 38.0,
      cpiValue: 0.92,
      spiValue: 1.05,
    });
    projects_created.push(project1);

    const project2 = await storage.createProject({
      name: 'Data Warehouse Migration',
      description: 'Migrate on-prem data warehouse to Snowflake',
      portfolioId: portfolio2.id,
      businessUnitId: bu1.id,
      programId: program1.id,
      owner: 'Michael Rodriguez',
      status: 'active',
      priority: 'critical',
      startDate: new Date('2025-02-15'),
      targetEndDate: new Date('2025-11-30'),
      budget: '1200000',
      actualCost: '580000',
      progress: 48,
      progressPercentage: 48.0,
      cpiValue: 1.02,
      spiValue: 0.96,
    });
    projects_created.push(project2);

    const project3 = await storage.createProject({
      name: 'Mobile App Redesign',
      description: 'Complete redesign of customer mobile application',
      portfolioId: portfolio1.id,
      businessUnitId: bu1.id,
      programId: program2.id,
      owner: 'Lisa Wang',
      status: 'active',
      priority: 'high',
      startDate: new Date('2025-05-01'),
      targetEndDate: new Date('2026-02-28'),
      budget: '650000',
      actualCost: '180000',
      progress: 28,
      progressPercentage: 28.0,
      cpiValue: 1.01,
      spiValue: 1.12,
    });
    projects_created.push(project3);

    const project4 = await storage.createProject({
      name: 'API Gateway Implementation',
      description: 'Deploy enterprise API gateway for microservices',
      portfolioId: portfolio2.id,
      businessUnitId: bu1.id,
      programId: program1.id,
      owner: 'David Kumar',
      status: 'active',
      priority: 'medium',
      startDate: new Date('2025-03-15'),
      targetEndDate: new Date('2025-10-31'),
      budget: '420000',
      actualCost: '195000',
      progress: 46,
      progressPercentage: 46.0,
      cpiValue: 0.99,
      spiValue: 1.08,
    });
    projects_created.push(project4);

    const project5 = await storage.createProject({
      name: 'Security Compliance Initiative',
      description: 'Implement SOC2 and ISO27001 compliance requirements',
      portfolioId: portfolio2.id,
      businessUnitId: bu2.id,
      owner: 'Amanda Foster',
      status: 'active',
      priority: 'critical',
      startDate: new Date('2025-01-15'),
      targetEndDate: new Date('2025-09-30'),
      budget: '580000',
      actualCost: '380000',
      progress: 65,
      progressPercentage: 65.0,
      cpiValue: 0.97,
      spiValue: 1.03,
    });
    projects_created.push(project5);

    // 6. CREATE FEATURES (SAFe)
    console.log('Creating features...');
    for (const project of projects_created) {
      for (let i = 1; i <= 3; i++) {
        await db.insert(features).values({
          projectId: project.id,
          name: `Feature ${i} - ${project.name}`,
          description: `Strategic feature for ${project.name}`,
          status: i === 1 ? 'done' : i === 2 ? 'in-progress' : 'planned',
          priority: 'high',
          storyPoints: 34,
          completedPoints: i === 1 ? 34 : i === 2 ? 18 : 0,
        });
      }
    }

    // 7. CREATE RISKS
    console.log('Creating risks...');
    await storage.createRisk({
      projectId: project1.id,
      name: 'Integration Complexity',
      description: 'Third-party API integrations more complex than estimated',
      status: 'active',
      probability: 'high',
      impact: 'high',
      mitigation: 'Engage vendor technical support, add contingency time',
      owner: 'Sarah Chen',
    });

    await storage.createRisk({
      projectId: project2.id,
      name: 'Data Quality Issues',
      description: 'Legacy data requires extensive cleaning before migration',
      status: 'active',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Implement automated data validation, add cleanup sprint',
      owner: 'Michael Rodriguez',
    });

    // 8. CREATE ISSUES
    console.log('Creating issues...');
    await storage.createIssue({
      projectId: project1.id,
      title: 'API Rate Limiting Blocking Progress',
      description: 'Salesforce API rate limits preventing bulk data migration',
      status: 'open',
      priority: 'high',
      category: 'technical',
      createdBy: 'dev-team',
    });

    await storage.createIssue({
      projectId: project2.id,
      title: 'Resource Conflict - DBA Availability',
      description: 'Database administrator split across multiple projects',
      status: 'open',
      priority: 'medium',
      category: 'resource',
      createdBy: 'pm-team',
    });

    // 9. CREATE OKRS
    console.log('Creating OKRs...');
    const okr1 = await storage.createOkr({
      id: 'okr-digital-transformation-2025',
      objective: 'Accelerate Digital Transformation',
      businessUnitId: bu1.id,
      strategicPriority: 'high',
      owner: 'VP Digital',
      overallProgress: '0',
      status: 'active',
      fiscalYear: '2025',
    });

    await storage.createKeyResult({
      id: 'kr-cloud-migration-2025',
      okrId: okr1.id,
      description: 'Migrate 80% of applications to cloud',
      metricName: 'Cloud Migration Progress',
      baselineValue: '35',
      targetValue: '80',
      currentValue: '52',
      unit: 'percentage',
      progress: '50',
      trend: 'up',
    });

    await storage.createKeyResult({
      id: 'kr-cost-reduction-2025',
      okrId: okr1.id,
      description: 'Reduce infrastructure costs by $2M',
      metricName: 'Infrastructure Cost Savings',
      baselineValue: '0',
      targetValue: '2000000',
      currentValue: '850000',
      unit: 'dollars',
      progress: '42',
      trend: 'up',
    });

    // 10. CREATE KPIS
    console.log('Creating KPIs...');
    await storage.createKpi({
      id: 'kpi-delivery-success-2025',
      name: 'Project Delivery Success Rate',
      description: 'Percentage of projects delivered on time and on budget',
      category: 'operational',
      baselineValue: '72',
      targetValue: '85',
      currentValue: '78',
      unit: 'percentage',
      trend: 'up',
      businessUnitId: bu1.id,
    });

    await storage.createKpi({
      id: 'kpi-portfolio-roi-2025',
      name: 'Portfolio ROI',
      description: 'Return on investment across entire portfolio',
      category: 'financial',
      baselineValue: '15',
      targetValue: '22',
      currentValue: '18.5',
      unit: 'percentage',
      trend: 'up',
      businessUnitId: bu1.id,
    });

    // 11. CREATE MILESTONES
    console.log('Creating milestones...');
    await storage.createMilestone({
      projectId: project1.id,
      name: 'Phase 1 Complete - Core Implementation',
      description: 'Complete core CRM functionality implementation',
      targetDate: new Date('2025-07-31'),
      status: 'active',
      deliverables: 'User management, Contact management, Basic reporting',
    });

    await storage.createMilestone({
      projectId: project2.id,
      name: 'Migration Milestone 1 - Historical Data',
      description: 'Complete migration of 5 years historical data',
      targetDate: new Date('2025-06-30'),
      status: 'active',
      deliverables: 'All historical records migrated and validated',
    });

    // 12. CREATE DEPENDENCIES
    console.log('Creating dependencies...');
    await storage.createDependency({
      projectId: project1.id,
      name: 'Data Warehouse Integration',
      description: 'CRM requires data warehouse to be operational for reporting',
      targetProjectId: project2.id,
      status: 'active',
      dependencyType: 'finish-to-start',
      impactIfDelayed: 'CRM reporting features cannot be completed',
    });

    // 13. CREATE FINANCIAL RECORDS
    console.log('Creating financial records...');
    await db.insert(projectFinancials).values({
      projectId: project1.id,
      category: 'labor',
      amount: '245000',
      date: new Date('2025-05-31'),
      description: 'Development team costs - May 2025',
    });

    await db.insert(projectFinancials).values({
      projectId: project1.id,
      category: 'software',
      amount: '42000',
      date: new Date('2025-05-15'),
      description: 'Salesforce licenses and add-ons',
    });

    // 14. CREATE RESOURCES
    console.log('Creating resources...');
    const resource1 = await db.insert(resources).values({
      name: 'John Smith',
      email: 'john.smith@company.com',
      role: 'Senior Developer',
      capacity: '40',
      costRate: '125',
    }).returning();

    const resource2 = await db.insert(resources).values({
      name: 'Emily Chen',
      email: 'emily.chen@company.com',
      role: 'UX Designer',
      capacity: '40',
      costRate: '95',
    }).returning();

    // 15. CREATE RESOURCE ALLOCATIONS
    console.log('Creating resource allocations...');
    await db.insert(resourceAllocations).values({
      resourceId: resource1[0].id,
      projectId: project1.id,
      allocationPercentage: '75',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-12-31'),
    });

    await db.insert(resourceAllocations).values({
      resourceId: resource2[0].id,
      projectId: project3.id,
      allocationPercentage: '100',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2026-02-28'),
    });

    console.log('✅ Production data seeding complete!');
    console.log(`   - ${3} Business Units`);
    console.log(`   - ${2} Portfolios`);
    console.log(`   - ${2} Programs`);
    console.log(`   - ${projects_created.length} Projects`);
    console.log(`   - ${projects_created.length * 3} Features`);
    console.log(`   - Risks, Issues, OKRs, KPIs, Milestones, Dependencies`);
    console.log(`   - Resource allocations and financials`);

    return {
      success: true,
      businessUnits: [bu1, bu2, bu3],
      portfolios: [portfolio1, portfolio2],
      programs: [program1, program2],
      projects: projects_created,
    };
  } catch (error) {
    console.error('❌ Error seeding production data:', error);
    throw error;
  }
}
