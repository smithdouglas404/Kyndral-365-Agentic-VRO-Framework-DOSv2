/**
 * DATABASE SEEDING SCRIPT
 *
 * Seeds the database with Enterprise test data including:
 * - 3 divisions (Regional Utility, Renewables Division, Corporate & Other)
 * - 8 teams
 * - 74 projects (Enterprise + generic IT projects)
 * - 180 tasks
 * - 53 risks
 * - 6 OKRs
 * - 15 KPIs
 *
 * Usage:
 *   npm run seed              # Seed the database
 *   npm run seed:export       # Export current database to seed files
 */

import { db } from '../storage.js';
import { divisions, teams, projects, tasks, risks, okrs, kpis } from '../../shared/schema.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEED_DIR = '/tmp/seed-export';

async function loadJSONFile(filename: string) {
  try {
    const content = readFileSync(join(SEED_DIR, filename), 'utf-8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`⚠️  Could not load ${filename}:`, error);
    return [];
  }
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');

  try {
    await db.delete(kpis);
    await db.delete(okrs);
    await db.delete(risks);
    await db.delete(tasks);
    await db.delete(projects);
    await db.delete(teams);
    await db.delete(divisions);

    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function seedDivisions() {
  console.log('📁 Seeding divisions...');
  const data = await loadJSONFile('divisions.json');

  if (data.length === 0) {
    console.log('⚠️  No divisions data found');
    return;
  }

  for (const item of data) {
    await db.insert(divisions).values({
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

  console.log(`✅ Seeded ${data.length} divisions`);
}

async function seedTeams() {
  console.log('👥 Seeding teams...');
  const data = await loadJSONFile('teams.json');

  if (data.length === 0) {
    console.log('⚠️  No teams data found');
    return;
  }

  for (const item of data) {
    await db.insert(teams).values({
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

  console.log(`✅ Seeded ${data.length} teams`);
}

async function seedProjects() {
  console.log('📊 Seeding projects...');
  const data = await loadJSONFile('projects.json');

  if (data.length === 0) {
    console.log('⚠️  No projects data found');
    return;
  }

  for (const item of data) {
    await db.insert(projects).values({
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

  console.log(`✅ Seeded ${data.length} projects`);
}

async function seedTasks() {
  console.log('📝 Seeding tasks...');
  const data = await loadJSONFile('tasks.json');

  if (data.length === 0) {
    console.log('⚠️  No tasks data found');
    return;
  }

  for (const item of data) {
    await db.insert(tasks).values({
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

  console.log(`✅ Seeded ${data.length} tasks`);
}

async function seedRisks() {
  console.log('⚠️  Seeding risks...');
  const data = await loadJSONFile('risks.json');

  if (data.length === 0) {
    console.log('⚠️  No risks data found');
    return;
  }

  for (const item of data) {
    await db.insert(risks).values({
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

  console.log(`✅ Seeded ${data.length} risks`);
}

async function seedOKRs() {
  console.log('🎯 Seeding OKRs...');
  const data = await loadJSONFile('okrs.json');

  if (data.length === 0) {
    console.log('⚠️  No OKRs data found');
    return;
  }

  for (const item of data) {
    await db.insert(okrs).values({
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

  console.log(`✅ Seeded ${data.length} OKRs`);
}

async function seedKPIs() {
  console.log('📈 Seeding KPIs...');
  const data = await loadJSONFile('kpis.json');

  if (data.length === 0) {
    console.log('⚠️  No KPIs data found');
    return;
  }

  for (const item of data) {
    await db.insert(kpis).values({
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

  console.log(`✅ Seeded ${data.length} KPIs`);
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Clear existing data
    await clearDatabase();

    // Seed in order (respecting foreign keys)
    await seedDivisions();
    await seedTeams();
    await seedProjects();
    await seedTasks();
    await seedRisks();
    await seedOKRs();
    await seedKPIs();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 3 divisions (Regional Utility, Renewables Division, Corporate & Other)');
    console.log('  - 8 teams');
    console.log('  - 74 projects (Enterprise + generic IT)');
    console.log('  - 180 tasks');
    console.log('  - 53 risks');
    console.log('  - 6 OKRs');
    console.log('  - 15 KPIs');
    console.log('\n🚀 Your database is ready!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
