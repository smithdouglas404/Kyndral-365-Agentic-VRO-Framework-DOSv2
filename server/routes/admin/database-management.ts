/**
 * ADMIN DATABASE MANAGEMENT ROUTES
 * API endpoints for database operations including seeding
 */

import type { Express } from 'express';
import type { IStorage } from '../../storage.js';
import { readFileSync } from 'fs';
import { divisions, teams, projects, tasks, risks, okrs, kpis } from '../../../shared/schema.js';

const SEED_DIR = '/tmp/seed-export';

function loadJSONFile(filename: string) {
  try {
    const content = readFileSync(`${SEED_DIR}/${filename}`, 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`⚠️  Could not load ${filename}:`, error);
    return [];
  }
}

async function clearDatabase(storage: IStorage) {
  console.log('[DatabaseManagement] Clearing existing data...');

  try {
    await storage.db.delete(kpis);
    await storage.db.delete(okrs);
    await storage.db.delete(risks);
    await storage.db.delete(tasks);
    await storage.db.delete(projects);
    await storage.db.delete(teams);
    await storage.db.delete(divisions);

    console.log('[DatabaseManagement] Database cleared');
  } catch (error) {
    console.error('[DatabaseManagement] Error clearing database:', error);
    throw error;
  }
}

async function seedDivisions(storage: IStorage) {
  console.log('[DatabaseManagement] Seeding divisions...');
  const data = loadJSONFile('divisions.json');

  if (data.length === 0) {
    console.log('[DatabaseManagement] No divisions data found');
    return 0;
  }

  for (const item of data) {
    await storage.db.insert(divisions).values({
      id: item.id,
      name: item.name,
      ceo: item.ceo,
      profit2023: item.profit_2023,
      profit2024: item.profit_2024,
      changePercent: item.change_percent,
      description: item.description,
      color: item.color,
      portfolioId: item.portfolio_id,
      companyId: item.company_id || 'nee',
    }).onConflictDoNothing();
  }

  console.log(`[DatabaseManagement] Seeded ${data.length} divisions`);
  return data.length;
}

async function seedTeams(storage: IStorage) {
  console.log('[DatabaseManagement] Seeding teams...');
  const data = loadJSONFile('teams.json');

  if (data.length === 0) {
    console.log('[DatabaseManagement] No teams data found');
    return 0;
  }

  for (const item of data) {
    await storage.db.insert(teams).values({
      id: item.id,
      name: item.name,
      lead: item.lead,
      memberCount: item.member_count,
      divisionId: item.division_id,
      portfolioId: item.portfolio_id,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    }).onConflictDoNothing();
  }

  console.log(`[DatabaseManagement] Seeded ${data.length} teams`);
  return data.length;
}

async function seedProjects(storage: IStorage) {
  console.log('[DatabaseManagement] Seeding projects...');
  const data = loadJSONFile('projects.json');

  if (data.length === 0) {
    console.log('[DatabaseManagement] No projects data found');
    return 0;
  }

  for (const item of data) {
    await storage.db.insert(projects).values({
      id: item.id,
      name: item.name,
      description: item.description,
      status: item.status,
      priority: item.priority,
      startDate: item.start_date ? new Date(item.start_date) : null,
      endDate: item.end_date ? new Date(item.end_date) : null,
      budget: item.budget,
      spent: item.spent,
      progress: item.progress,
      owner: item.owner,
      divisionId: item.division_id,
      portfolioId: item.portfolio_id,
      teamId: item.team_id,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    }).onConflictDoNothing();
  }

  console.log(`[DatabaseManagement] Seeded ${data.length} projects`);
  return data.length;
}

async function seedTasks(storage: IStorage) {
  console.log('[DatabaseManagement] Seeding tasks...');
  const data = loadJSONFile('tasks.json');

  if (data.length === 0) {
    console.log('[DatabaseManagement] No tasks data found');
    return 0;
  }

  for (const item of data) {
    await storage.db.insert(tasks).values({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      assignee: item.assignee,
      projectId: item.project_id,
      dueDate: item.due_date ? new Date(item.due_date) : null,
      completedAt: item.completed_at ? new Date(item.completed_at) : null,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    }).onConflictDoNothing();
  }

  console.log(`[DatabaseManagement] Seeded ${data.length} tasks`);
  return data.length;
}

async function seedRisks(storage: IStorage) {
  console.log('[DatabaseManagement] Seeding risks...');
  const data = loadJSONFile('risks.json');

  if (data.length === 0) {
    console.log('[DatabaseManagement] No risks data found');
    return 0;
  }

  for (const item of data) {
    await storage.db.insert(risks).values({
      id: item.id,
      title: item.title,
      severity: item.severity,
      probability: item.probability,
      impact: item.impact,
      status: item.status,
      mitigation: item.mitigation,
      owner: item.owner,
      projectId: item.project_id,
      portfolioId: item.portfolio_id,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    }).onConflictDoNothing();
  }

  console.log(`[DatabaseManagement] Seeded ${data.length} risks`);
  return data.length;
}

async function seedOKRs(storage: IStorage) {
  console.log('[DatabaseManagement] Seeding OKRs...');
  const data = loadJSONFile('okrs.json');

  if (data.length === 0) {
    console.log('[DatabaseManagement] No OKRs data found');
    return 0;
  }

  for (const item of data) {
    await storage.db.insert(okrs).values({
      id: item.id,
      title: item.title,
      description: item.description,
      progress: item.progress,
      owner: item.owner,
      projectId: item.project_id,
      portfolioId: item.portfolio_id,
      quarter: item.quarter,
      year: item.year,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    }).onConflictDoNothing();
  }

  console.log(`[DatabaseManagement] Seeded ${data.length} OKRs`);
  return data.length;
}

async function seedKPIs(storage: IStorage) {
  console.log('[DatabaseManagement] Seeding KPIs...');
  const data = loadJSONFile('kpis.json');

  if (data.length === 0) {
    console.log('[DatabaseManagement] No KPIs data found');
    return 0;
  }

  for (const item of data) {
    await storage.db.insert(kpis).values({
      id: item.id,
      name: item.name,
      description: item.description,
      currentValue: item.current_value,
      targetValue: item.target_value,
      unit: item.unit,
      projectId: item.project_id,
      portfolioId: item.portfolio_id,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
    }).onConflictDoNothing();
  }

  console.log(`[DatabaseManagement] Seeded ${data.length} KPIs`);
  return data.length;
}

export function registerDatabaseManagementRoutes(app: Express, storage: IStorage): void {
  /**
   * POST /api/admin/seed-database
   * Seeds the database with Enterprise test data
   */
  app.post('/api/admin/seed-database', async (req, res) => {
    try {
      console.log('[DatabaseManagement] Starting database seeding...');

      // Clear existing data
      await clearDatabase(storage);

      // Seed in order (respecting foreign keys)
      const divisionsCount = await seedDivisions(storage);
      const teamsCount = await seedTeams(storage);
      const projectsCount = await seedProjects(storage);
      const tasksCount = await seedTasks(storage);
      const risksCount = await seedRisks(storage);
      const okrsCount = await seedOKRs(storage);
      const kpisCount = await seedKPIs(storage);

      const totalCount = divisionsCount + teamsCount + projectsCount + tasksCount + risksCount + okrsCount + kpisCount;

      console.log('[DatabaseManagement] Database seeding completed successfully');

      res.json({
        success: true,
        message: 'Database seeded successfully',
        summary: {
          divisions: divisionsCount,
          teams: teamsCount,
          projects: projectsCount,
          tasks: tasksCount,
          risks: risksCount,
          okrs: okrsCount,
          kpis: kpisCount,
          total: totalCount,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[DatabaseManagement] Seeding failed:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to seed database',
        error: error.toString(),
      });
    }
  });

  console.log('[DatabaseManagement] Database management routes registered');
}
