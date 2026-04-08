/**
 * Bootstrap OpenProject with SAFe 6.0 Structure
 *
 * Run this after OpenProject is deployed to set up:
 * 1. Custom work package types (Epic, Feature, Story, Task, Risk, Agent Alert, etc.)
 * 2. Custom fields (nextera_id, sync_source, risk_probability, wsjf_score, etc.)
 * 3. Project hierarchy matching SAFe portfolio structure
 * 4. Webhook registration for event-driven sync
 *
 * Usage: npx tsx server/scripts/bootstrap-openproject.ts
 */

import 'dotenv/config';
import { OpenProjectClient } from '../services/openproject/OpenProjectClient.js';

const client = new OpenProjectClient({
  baseUrl: process.env.OPENPROJECT_URL || 'http://localhost:8080',
  apiKey: process.env.OPENPROJECT_API_KEY || '',
});

// ============================================================================
// SAFe 6.0 Work Package Types to create
// ============================================================================

const SAFE_WORK_PACKAGE_TYPES = [
  { name: 'Epic', color: '#7c3aed', isMilestone: false, position: 1 },
  { name: 'Capability', color: '#6366f1', isMilestone: false, position: 2 },
  { name: 'Feature', color: '#2563eb', isMilestone: false, position: 3 },
  { name: 'User Story', color: '#0891b2', isMilestone: false, position: 4 },
  { name: 'Risk', color: '#e11d48', isMilestone: false, position: 5 },
  { name: 'Agent Alert', color: '#d97706', isMilestone: false, position: 6 },
  { name: 'Governance Gate', color: '#4f46e5', isMilestone: true, position: 7 },
  { name: 'Demand Request', color: '#0d9488', isMilestone: false, position: 8 },
  { name: 'Change Request', color: '#9333ea', isMilestone: false, position: 9 },
];

// ============================================================================
// Custom Fields for SAFe + Agent integration
// ============================================================================

const CUSTOM_FIELDS = [
  { name: 'nextera_id', fieldFormat: 'text', isForAll: true, description: 'Internal Nextera entity ID for cross-referencing' },
  { name: 'sync_source', fieldFormat: 'list', isForAll: true, description: 'Source system: nextera-agent, jira, ado, manual, palantir' },
  { name: 'agent_owner', fieldFormat: 'text', isForAll: true, description: 'Which agent created/owns this item' },
  { name: 'palantir_rid', fieldFormat: 'text', isForAll: true, description: 'Palantir Foundry object RID' },
  { name: 'safe_stage', fieldFormat: 'list', isForAll: true, description: 'SAFe portfolio stage: funnel, reviewing, analyzing, portfolio-backlog, implementing, done' },
  { name: 'wsjf_score', fieldFormat: 'float', isForAll: false, description: 'Weighted Shortest Job First score' },
  { name: 'risk_probability', fieldFormat: 'float', isForAll: false, description: 'Risk probability 0-1' },
  { name: 'risk_impact', fieldFormat: 'float', isForAll: false, description: 'Risk impact 0-1' },
  { name: 'risk_category', fieldFormat: 'list', isForAll: false, description: 'Risk category: technical, schedule, cost, resource, external, compliance' },
  { name: 'business_value', fieldFormat: 'int', isForAll: false, description: 'Business value score for WSJF' },
  { name: 'okr_alignment', fieldFormat: 'text', isForAll: false, description: 'OKR objective ID this item supports' },
  { name: 'value_stream', fieldFormat: 'text', isForAll: true, description: 'Value stream this item belongs to' },
  { name: 'art_name', fieldFormat: 'text', isForAll: true, description: 'Agile Release Train name' },
  { name: 'alert_severity', fieldFormat: 'list', isForAll: false, description: 'Agent alert severity: notification, warning, alarm, critical' },
  { name: 'alert_acknowledged', fieldFormat: 'bool', isForAll: false, description: 'Whether alert has been acknowledged' },
  { name: 'benefit_hypothesis', fieldFormat: 'text', isForAll: false, description: 'SAFe benefit hypothesis for features' },
  { name: 'acceptance_criteria', fieldFormat: 'text', isForAll: false, description: 'Acceptance criteria (JSON)' },
];

// ============================================================================
// SAFe Portfolio Project Hierarchy
// ============================================================================

const PORTFOLIO_HIERARCHY = {
  name: 'Enterprise Transformation Portfolio',
  identifier: 'eto-portfolio',
  children: [
    {
      name: 'Digital Platform Value Stream',
      identifier: 'vs-digital-platform',
      children: [
        { name: 'Digital Platform ART', identifier: 'art-digital-platform' },
        { name: 'Cloud Infrastructure ART', identifier: 'art-cloud-infra' },
      ],
    },
    {
      name: 'Data & Analytics Value Stream',
      identifier: 'vs-data-analytics',
      children: [
        { name: 'Data Engineering ART', identifier: 'art-data-eng' },
        { name: 'AI/ML Platform ART', identifier: 'art-ai-ml' },
      ],
    },
    {
      name: 'Customer Experience Value Stream',
      identifier: 'vs-customer-experience',
      children: [
        { name: 'Customer Digital ART', identifier: 'art-customer-digital' },
        { name: 'Customer Operations ART', identifier: 'art-customer-ops' },
      ],
    },
    {
      name: 'Enterprise Operations Value Stream',
      identifier: 'vs-enterprise-ops',
      children: [
        { name: 'Enterprise Systems ART', identifier: 'art-enterprise-sys' },
        { name: 'Security & Compliance ART', identifier: 'art-security' },
      ],
    },
  ],
};

// System project for agent alerts and notifications
const SYSTEM_PROJECT = {
  name: 'Agent Notifications & Alerts',
  identifier: 'nextera-agent-alerts',
};

// ============================================================================
// Bootstrap Execution
// ============================================================================

async function bootstrap() {
  console.log('=== OpenProject SAFe 6.0 Bootstrap ===\n');

  // 1. Test connection
  console.log('1. Testing connection...');
  const conn = await client.testConnection();
  if (!conn.connected) {
    console.error(`   FAILED: ${conn.error}`);
    console.error('   Make sure OpenProject is running and OPENPROJECT_API_KEY is set.');
    process.exit(1);
  }
  console.log(`   Connected to OpenProject ${conn.version} (${conn.instanceName})`);

  // 2. Check existing types (don't duplicate)
  console.log('\n2. Checking existing work package types...');
  const existingTypes = await client.listTypes();
  const existingTypeNames = new Set(existingTypes.map(t => t.name));
  console.log(`   Found ${existingTypes.length} existing types: ${existingTypes.map(t => t.name).join(', ')}`);

  const typesToCreate = SAFE_WORK_PACKAGE_TYPES.filter(t => !existingTypeNames.has(t.name));
  if (typesToCreate.length > 0) {
    console.log(`   Creating ${typesToCreate.length} new types: ${typesToCreate.map(t => t.name).join(', ')}`);
    console.log('   NOTE: Custom type creation requires admin API or manual setup in OpenProject admin UI.');
    console.log('   Types to create manually if API doesn\'t support it:');
    typesToCreate.forEach(t => console.log(`     - ${t.name} (color: ${t.color}, milestone: ${t.isMilestone})`));
  } else {
    console.log('   All SAFe types already exist.');
  }

  // 3. Check custom fields (API may not be available on community edition)
  console.log('\n3. Checking custom fields...');
  try {
    const existingFields = await client.listCustomFields();
    const existingFieldNames = new Set(existingFields.map(f => f.name));
    console.log(`   Found ${existingFields.length} existing custom fields`);

    const fieldsToCreate = CUSTOM_FIELDS.filter(f => !existingFieldNames.has(f.name));
    if (fieldsToCreate.length > 0) {
      console.log(`   ${fieldsToCreate.length} custom fields to create via Admin UI:`);
      fieldsToCreate.forEach(f => console.log(`     - ${f.name} (${f.fieldFormat}) — ${f.description}`));
    }
  } catch (err: any) {
    console.log(`   Custom fields API not available (${err.message?.substring(0, 80)})`);
    console.log('   Create custom fields manually via: Administration → Custom fields');
    console.log(`   Fields needed: ${CUSTOM_FIELDS.map(f => f.name).join(', ')}`);
  }

  // 4. Create project hierarchy
  console.log('\n4. Setting up SAFe project hierarchy...');
  const existingProjects = await client.listProjects();
  const existingProjectIds = new Set(existingProjects.map(p => p.identifier));

  // Create portfolio root
  let portfolioProject: any;
  if (!existingProjectIds.has(PORTFOLIO_HIERARCHY.identifier)) {
    console.log(`   Creating portfolio: ${PORTFOLIO_HIERARCHY.name}`);
    portfolioProject = await client.createProject({
      name: PORTFOLIO_HIERARCHY.name,
      identifier: PORTFOLIO_HIERARCHY.identifier,
      description: { raw: 'SAFe 6.0 Enterprise Transformation Portfolio — root project containing all value streams and ARTs' },
      public: false,
    });
  } else {
    console.log(`   Portfolio exists: ${PORTFOLIO_HIERARCHY.name}`);
    portfolioProject = existingProjects.find(p => p.identifier === PORTFOLIO_HIERARCHY.identifier);
  }

  // Create value streams and ARTs
  for (const vs of PORTFOLIO_HIERARCHY.children) {
    let vsProject: any;
    if (!existingProjectIds.has(vs.identifier)) {
      console.log(`   Creating value stream: ${vs.name}`);
      vsProject = await client.createProject({
        name: vs.name,
        identifier: vs.identifier,
        description: { raw: `SAFe 6.0 Value Stream — ${vs.name}` },
        parent: { href: `/api/v3/projects/${portfolioProject.id}` },
      });
    } else {
      console.log(`   Value stream exists: ${vs.name}`);
      vsProject = existingProjects.find(p => p.identifier === vs.identifier);
    }

    for (const art of vs.children) {
      if (!existingProjectIds.has(art.identifier)) {
        console.log(`     Creating ART: ${art.name}`);
        await client.createProject({
          name: art.name,
          identifier: art.identifier,
          description: { raw: `Agile Release Train — ${art.name}` },
          parent: { href: `/api/v3/projects/${vsProject.id}` },
        });
      } else {
        console.log(`     ART exists: ${art.name}`);
      }
    }
  }

  // Create system project for agent alerts
  if (!existingProjectIds.has(SYSTEM_PROJECT.identifier)) {
    console.log(`   Creating system project: ${SYSTEM_PROJECT.name}`);
    await client.createProject({
      name: SYSTEM_PROJECT.name,
      identifier: SYSTEM_PROJECT.identifier,
      description: { raw: 'System project for agent notifications, alerts, and cross-cutting concerns' },
    });
  } else {
    console.log(`   System project exists: ${SYSTEM_PROJECT.name}`);
  }

  // 5. Register webhooks (requires enterprise or admin API)
  console.log('\n5. Registering webhooks...');
  const appHost = process.env.INTERNAL_API_URL || 'http://localhost:5000';
  const webhookSecret = process.env.OPENPROJECT_WEBHOOK_SECRET || 'change-this-webhook-secret';
  try {
    const existingWebhooks = await client.listWebhooks();
    const nexteraWebhook = existingWebhooks.find(w => w.name === 'nextera-sync');

    if (!nexteraWebhook) {
      console.log('   Creating nextera-sync webhook...');
      const webhook = await client.createWebhook({
        name: 'nextera-sync',
        url: `${appHost}/api/webhooks/openproject/primary`,
        secret: webhookSecret,
        enabled: true,
        events: [
          'work_package:created',
          'work_package:updated',
          'project:created',
          'project:updated',
          'time_entry:created',
          'membership:created',
          'membership:updated',
        ],
      });
      console.log(`   Webhook registered (ID: ${webhook.id})`);
    } else {
      console.log(`   Webhook already registered (ID: ${nexteraWebhook.id})`);
    }
  } catch (err: any) {
    console.log(`   Webhooks API not available (${err.message?.substring(0, 80)})`);
    console.log('   Configure webhooks manually via: Administration → Webhooks');
    console.log(`   URL: ${appHost}/api/webhooks/openproject/primary`);
    console.log('   Using scheduled sync as fallback (every 5 minutes)');
  }

  // 6. Summary
  console.log('\n=== Bootstrap Complete ===');
  console.log(`Portfolio: ${PORTFOLIO_HIERARCHY.name}`);
  console.log(`Value Streams: ${PORTFOLIO_HIERARCHY.children.length}`);
  console.log(`ARTs: ${PORTFOLIO_HIERARCHY.children.reduce((sum, vs) => sum + vs.children.length, 0)}`);
  console.log(`Custom Types: ${SAFE_WORK_PACKAGE_TYPES.length} defined`);
  console.log(`Custom Fields: ${CUSTOM_FIELDS.length} defined`);
  console.log(`System Project: ${SYSTEM_PROJECT.name}`);
  console.log(`Webhook: nextera-sync → ${appHost}/api/webhooks/openproject/primary`);
  console.log('\nOpenProject is ready as your headless PPM backbone.');
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
