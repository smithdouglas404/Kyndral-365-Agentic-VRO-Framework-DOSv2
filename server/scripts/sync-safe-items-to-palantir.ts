/**
 * SYNC SAFe WORK ITEMS TO PALANTIR
 *
 * Creates Features, Stories, and Tasks in Palantir using proper object types.
 * These are linked to the existing Projects in the ontology.
 *
 * Actions used:
 * - atlas-create-feature (AtlasFeature)
 * - atlas-create-story (AtlasStory)
 * - atlas-create-task (AtlasTask)
 *
 * Usage: npx tsx server/scripts/sync-safe-items-to-palantir.ts
 */

import { PALANTIR_ACTIONS } from '../constants/palantirOntology.js';

const PALANTIR_HOST = process.env.PALANTIR_HOSTNAME?.replace(/\/$/, '') || '';
const PALANTIR_TOKEN = process.env.PALANTIR_TOKEN || '';
const ONTOLOGY_RID = process.env.PALANTIR_ONTOLOGY_RID || '';

if (!PALANTIR_HOST || !PALANTIR_TOKEN || !ONTOLOGY_RID) {
  console.error('Missing Palantir configuration. Set PALANTIR_HOSTNAME, PALANTIR_TOKEN, PALANTIR_ONTOLOGY_RID');
  process.exit(1);
}

// ============================================================================
// PALANTIR API HELPERS
// ============================================================================

async function palantirRequest(method: string, path: string, body?: any): Promise<any> {
  const url = `${PALANTIR_HOST}/api/v2${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${PALANTIR_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Palantir API error (${response.status}): ${text}`);
  }

  return response.json();
}

async function applyAction(actionName: string, parameters: Record<string, any>): Promise<boolean> {
  try {
    await palantirRequest('POST', `/ontologies/${ONTOLOGY_RID}/actions/${actionName}/apply`, { parameters });
    return true;
  } catch (error: any) {
    console.error(`  ❌ ${actionName} failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// DATA DEFINITIONS - SAFe Work Items
// ============================================================================

// Features linked to Projects
const FEATURES = [
  // Customer Portal 2.0 (PRJ-101) Features
  { feature_id: 'FTR-101-001', name: 'User Authentication Redesign', description: 'Implement modern authentication with SSO, MFA, and biometric options', status: 'Done', priority: 'Critical', project_id: 'PRJ-101', story_points: 21, completed_points: 21, target_pi: 'PI-2024-Q1', owner: 'Sarah Chen' },
  { feature_id: 'FTR-101-002', name: 'Dashboard Personalization', description: 'Allow users to customize their dashboard layout and widgets', status: 'In Progress', priority: 'High', project_id: 'PRJ-101', story_points: 34, completed_points: 21, target_pi: 'PI-2024-Q2', owner: 'Mike Johnson' },
  { feature_id: 'FTR-101-003', name: 'Real-time Notifications', description: 'Push notifications and in-app alerts for important events', status: 'In Progress', priority: 'Medium', project_id: 'PRJ-101', story_points: 13, completed_points: 5, target_pi: 'PI-2024-Q2', owner: 'Sarah Chen' },
  { feature_id: 'FTR-101-004', name: 'Self-Service Portal', description: 'Customer self-service capabilities for account management', status: 'Backlog', priority: 'High', project_id: 'PRJ-101', story_points: 55, completed_points: 0, target_pi: 'PI-2024-Q3', owner: 'David Kim' },

  // Enterprise Data Lake (PRJ-201) Features
  { feature_id: 'FTR-201-001', name: 'Data Ingestion Pipeline', description: 'Real-time data ingestion from 50+ source systems', status: 'In Progress', priority: 'Critical', project_id: 'PRJ-201', story_points: 89, completed_points: 55, target_pi: 'PI-2024-Q2', owner: 'Alex Rivera' },
  { feature_id: 'FTR-201-002', name: 'Data Quality Framework', description: 'Automated data quality monitoring and alerting', status: 'In Progress', priority: 'High', project_id: 'PRJ-201', story_points: 34, completed_points: 13, target_pi: 'PI-2024-Q2', owner: 'Emma Watson' },
  { feature_id: 'FTR-201-003', name: 'Self-Service Analytics', description: 'Business user self-service analytics with governed datasets', status: 'Backlog', priority: 'High', project_id: 'PRJ-201', story_points: 55, completed_points: 0, target_pi: 'PI-2024-Q3', owner: 'James Lee' },

  // AWS Migration Wave 1 (PRJ-301) Features
  { feature_id: 'FTR-301-001', name: 'Application Containerization', description: 'Containerize 120 legacy applications for cloud deployment', status: 'In Progress', priority: 'Critical', project_id: 'PRJ-301', story_points: 144, completed_points: 89, target_pi: 'PI-2024-Q2', owner: 'Chris Taylor' },
  { feature_id: 'FTR-301-002', name: 'Infrastructure as Code', description: 'Terraform modules for AWS infrastructure provisioning', status: 'Done', priority: 'High', project_id: 'PRJ-301', story_points: 34, completed_points: 34, target_pi: 'PI-2024-Q1', owner: 'Lisa Park' },
  { feature_id: 'FTR-301-003', name: 'Cloud Cost Optimization', description: 'FinOps practices and cost monitoring dashboards', status: 'In Progress', priority: 'Medium', project_id: 'PRJ-301', story_points: 21, completed_points: 8, target_pi: 'PI-2024-Q2', owner: 'Tom Anderson' },

  // Contact Center Modernization (PRJ-401) Features
  { feature_id: 'FTR-401-001', name: 'AI Agent Assist', description: 'Real-time AI suggestions for customer service agents', status: 'In Progress', priority: 'High', project_id: 'PRJ-401', story_points: 55, completed_points: 21, target_pi: 'PI-2024-Q2', owner: 'Rachel Green' },
  { feature_id: 'FTR-401-002', name: 'Omnichannel Routing', description: 'Unified routing across voice, chat, email, and social', status: 'In Progress', priority: 'Critical', project_id: 'PRJ-401', story_points: 34, completed_points: 13, target_pi: 'PI-2024-Q2', owner: 'Monica Geller' },
];

// Stories linked to Features
const STORIES = [
  // Dashboard Personalization (FTR-101-002) Stories
  { story_id: 'STR-101-002-001', name: 'Widget Drag and Drop', description: 'As a user, I want to drag and drop widgets to customize my dashboard layout', status: 'Done', priority: 'High', feature_id: 'FTR-101-002', project_id: 'PRJ-101', story_points: 8, sprint: 'Sprint 2024-03', assignee: 'John Doe' },
  { story_id: 'STR-101-002-002', name: 'Widget Configuration Panel', description: 'As a user, I want to configure widget settings and data sources', status: 'Done', priority: 'High', feature_id: 'FTR-101-002', project_id: 'PRJ-101', story_points: 5, sprint: 'Sprint 2024-03', assignee: 'Jane Smith' },
  { story_id: 'STR-101-002-003', name: 'Dashboard Templates', description: 'As a user, I want to choose from pre-built dashboard templates', status: 'In Progress', priority: 'Medium', feature_id: 'FTR-101-002', project_id: 'PRJ-101', story_points: 8, sprint: 'Sprint 2024-04', assignee: 'John Doe' },
  { story_id: 'STR-101-002-004', name: 'Dashboard Sharing', description: 'As a user, I want to share my dashboard with team members', status: 'Backlog', priority: 'Medium', feature_id: 'FTR-101-002', project_id: 'PRJ-101', story_points: 13, sprint: null, assignee: null },

  // Real-time Notifications (FTR-101-003) Stories
  { story_id: 'STR-101-003-001', name: 'WebSocket Integration', description: 'Implement WebSocket connection for real-time updates', status: 'Done', priority: 'High', feature_id: 'FTR-101-003', project_id: 'PRJ-101', story_points: 5, sprint: 'Sprint 2024-04', assignee: 'Mike Chen' },
  { story_id: 'STR-101-003-002', name: 'Notification Preferences', description: 'Allow users to configure notification preferences', status: 'In Progress', priority: 'Medium', feature_id: 'FTR-101-003', project_id: 'PRJ-101', story_points: 5, sprint: 'Sprint 2024-04', assignee: 'Sarah Lee' },
  { story_id: 'STR-101-003-003', name: 'Mobile Push Notifications', description: 'Send push notifications to mobile devices', status: 'Backlog', priority: 'Medium', feature_id: 'FTR-101-003', project_id: 'PRJ-101', story_points: 3, sprint: null, assignee: null },

  // Data Ingestion Pipeline (FTR-201-001) Stories
  { story_id: 'STR-201-001-001', name: 'Kafka Producer Setup', description: 'Configure Kafka producers for each source system', status: 'Done', priority: 'Critical', feature_id: 'FTR-201-001', project_id: 'PRJ-201', story_points: 13, sprint: 'Sprint 2024-02', assignee: 'Alex Rivera' },
  { story_id: 'STR-201-001-002', name: 'Schema Registry Integration', description: 'Implement Confluent Schema Registry for data contracts', status: 'Done', priority: 'High', feature_id: 'FTR-201-001', project_id: 'PRJ-201', story_points: 8, sprint: 'Sprint 2024-02', assignee: 'Emma Watson' },
  { story_id: 'STR-201-001-003', name: 'CDC Implementation', description: 'Implement Change Data Capture for real-time sync', status: 'In Progress', priority: 'High', feature_id: 'FTR-201-001', project_id: 'PRJ-201', story_points: 21, sprint: 'Sprint 2024-04', assignee: 'James Lee' },
  { story_id: 'STR-201-001-004', name: 'Data Transformation Layer', description: 'Build Spark jobs for data transformation', status: 'In Progress', priority: 'High', feature_id: 'FTR-201-001', project_id: 'PRJ-201', story_points: 13, sprint: 'Sprint 2024-04', assignee: 'Alex Rivera' },

  // Application Containerization (FTR-301-001) Stories
  { story_id: 'STR-301-001-001', name: 'Docker Base Images', description: 'Create standardized Docker base images for each tech stack', status: 'Done', priority: 'Critical', feature_id: 'FTR-301-001', project_id: 'PRJ-301', story_points: 8, sprint: 'Sprint 2024-01', assignee: 'Chris Taylor' },
  { story_id: 'STR-301-001-002', name: 'Legacy App Assessment', description: 'Assess and document 120 legacy applications for migration', status: 'Done', priority: 'High', feature_id: 'FTR-301-001', project_id: 'PRJ-301', story_points: 21, sprint: 'Sprint 2024-01', assignee: 'Lisa Park' },
  { story_id: 'STR-301-001-003', name: 'Wave 1 Migration (30 apps)', description: 'Containerize and migrate first wave of 30 applications', status: 'Done', priority: 'Critical', feature_id: 'FTR-301-001', project_id: 'PRJ-301', story_points: 34, sprint: 'Sprint 2024-02', assignee: 'Chris Taylor' },
  { story_id: 'STR-301-001-004', name: 'Wave 2 Migration (50 apps)', description: 'Containerize and migrate second wave of 50 applications', status: 'In Progress', priority: 'Critical', feature_id: 'FTR-301-001', project_id: 'PRJ-301', story_points: 55, sprint: 'Sprint 2024-04', assignee: 'Tom Anderson' },

  // AI Agent Assist (FTR-401-001) Stories
  { story_id: 'STR-401-001-001', name: 'Knowledge Base Integration', description: 'Connect AI to internal knowledge base for suggestions', status: 'Done', priority: 'High', feature_id: 'FTR-401-001', project_id: 'PRJ-401', story_points: 8, sprint: 'Sprint 2024-03', assignee: 'Rachel Green' },
  { story_id: 'STR-401-001-002', name: 'Real-time Sentiment Analysis', description: 'Analyze customer sentiment during calls', status: 'In Progress', priority: 'High', feature_id: 'FTR-401-001', project_id: 'PRJ-401', story_points: 13, sprint: 'Sprint 2024-04', assignee: 'Monica Geller' },
  { story_id: 'STR-401-001-003', name: 'Next Best Action Engine', description: 'ML model for recommending next best actions', status: 'Backlog', priority: 'Medium', feature_id: 'FTR-401-001', project_id: 'PRJ-401', story_points: 21, sprint: null, assignee: null },
];

// Tasks linked to Stories
const TASKS = [
  // Widget Drag and Drop (STR-101-002-001) Tasks
  { task_id: 'TSK-101-002-001-01', name: 'Implement react-beautiful-dnd', description: 'Add drag and drop library to the project', status: 'Done', priority: 'High', story_id: 'STR-101-002-001', feature_id: 'FTR-101-002', project_id: 'PRJ-101', estimated_hours: 4, actual_hours: 3, task_type: 'Development', assignee: 'John Doe', sprint: 'Sprint 2024-03' },
  { task_id: 'TSK-101-002-001-02', name: 'Create widget container component', description: 'Build reusable widget container with drag handles', status: 'Done', priority: 'High', story_id: 'STR-101-002-001', feature_id: 'FTR-101-002', project_id: 'PRJ-101', estimated_hours: 8, actual_hours: 10, task_type: 'Development', assignee: 'John Doe', sprint: 'Sprint 2024-03' },
  { task_id: 'TSK-101-002-001-03', name: 'Persist layout to backend', description: 'Save user layout preferences to database', status: 'Done', priority: 'Medium', story_id: 'STR-101-002-001', feature_id: 'FTR-101-002', project_id: 'PRJ-101', estimated_hours: 4, actual_hours: 4, task_type: 'Development', assignee: 'Jane Smith', sprint: 'Sprint 2024-03' },
  { task_id: 'TSK-101-002-001-04', name: 'Write unit tests', description: 'Unit tests for drag and drop functionality', status: 'Done', priority: 'Medium', story_id: 'STR-101-002-001', feature_id: 'FTR-101-002', project_id: 'PRJ-101', estimated_hours: 4, actual_hours: 5, task_type: 'Testing', assignee: 'Jane Smith', sprint: 'Sprint 2024-03' },

  // Dashboard Templates (STR-101-002-003) Tasks
  { task_id: 'TSK-101-002-003-01', name: 'Design template system', description: 'Create architecture for dashboard templates', status: 'Done', priority: 'High', story_id: 'STR-101-002-003', feature_id: 'FTR-101-002', project_id: 'PRJ-101', estimated_hours: 4, actual_hours: 4, task_type: 'Development', assignee: 'John Doe', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-101-002-003-02', name: 'Build template gallery UI', description: 'Create UI for browsing and selecting templates', status: 'In Progress', priority: 'High', story_id: 'STR-101-002-003', feature_id: 'FTR-101-002', project_id: 'PRJ-101', estimated_hours: 8, actual_hours: 4, task_type: 'Development', assignee: 'John Doe', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-101-002-003-03', name: 'Create default templates', description: 'Design and implement 5 default templates', status: 'To Do', priority: 'Medium', story_id: 'STR-101-002-003', feature_id: 'FTR-101-002', project_id: 'PRJ-101', estimated_hours: 12, actual_hours: 0, task_type: 'Development', assignee: 'Jane Smith', sprint: 'Sprint 2024-04' },

  // WebSocket Integration (STR-101-003-001) Tasks
  { task_id: 'TSK-101-003-001-01', name: 'Set up WebSocket server', description: 'Configure Socket.io server with Redis adapter', status: 'Done', priority: 'High', story_id: 'STR-101-003-001', feature_id: 'FTR-101-003', project_id: 'PRJ-101', estimated_hours: 4, actual_hours: 5, task_type: 'Development', assignee: 'Mike Chen', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-101-003-001-02', name: 'Implement client connection', description: 'Create React hook for WebSocket connection', status: 'Done', priority: 'High', story_id: 'STR-101-003-001', feature_id: 'FTR-101-003', project_id: 'PRJ-101', estimated_hours: 4, actual_hours: 3, task_type: 'Development', assignee: 'Mike Chen', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-101-003-001-03', name: 'Add reconnection logic', description: 'Handle connection drops and reconnection', status: 'Done', priority: 'Medium', story_id: 'STR-101-003-001', feature_id: 'FTR-101-003', project_id: 'PRJ-101', estimated_hours: 2, actual_hours: 2, task_type: 'Development', assignee: 'Mike Chen', sprint: 'Sprint 2024-04' },

  // Notification Preferences (STR-101-003-002) Tasks
  { task_id: 'TSK-101-003-002-01', name: 'Design preferences schema', description: 'Create database schema for notification preferences', status: 'Done', priority: 'High', story_id: 'STR-101-003-002', feature_id: 'FTR-101-003', project_id: 'PRJ-101', estimated_hours: 2, actual_hours: 2, task_type: 'Development', assignee: 'Sarah Lee', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-101-003-002-02', name: 'Build preferences UI', description: 'Create settings page for notification preferences', status: 'In Progress', priority: 'High', story_id: 'STR-101-003-002', feature_id: 'FTR-101-003', project_id: 'PRJ-101', estimated_hours: 6, actual_hours: 3, task_type: 'Development', assignee: 'Sarah Lee', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-101-003-002-03', name: 'Implement preference filtering', description: 'Filter notifications based on user preferences', status: 'To Do', priority: 'Medium', story_id: 'STR-101-003-002', feature_id: 'FTR-101-003', project_id: 'PRJ-101', estimated_hours: 4, actual_hours: 0, task_type: 'Development', assignee: 'Sarah Lee', sprint: 'Sprint 2024-04' },

  // CDC Implementation (STR-201-001-003) Tasks
  { task_id: 'TSK-201-001-003-01', name: 'Configure Debezium connectors', description: 'Set up Debezium for PostgreSQL and MySQL sources', status: 'Done', priority: 'Critical', story_id: 'STR-201-001-003', feature_id: 'FTR-201-001', project_id: 'PRJ-201', estimated_hours: 8, actual_hours: 10, task_type: 'Development', assignee: 'James Lee', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-201-001-003-02', name: 'Build CDC event processor', description: 'Kafka Streams app to process CDC events', status: 'In Progress', priority: 'High', story_id: 'STR-201-001-003', feature_id: 'FTR-201-001', project_id: 'PRJ-201', estimated_hours: 16, actual_hours: 8, task_type: 'Development', assignee: 'James Lee', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-201-001-003-03', name: 'Implement dead letter queue', description: 'Handle failed events with retry mechanism', status: 'To Do', priority: 'High', story_id: 'STR-201-001-003', feature_id: 'FTR-201-001', project_id: 'PRJ-201', estimated_hours: 8, actual_hours: 0, task_type: 'Development', assignee: 'Emma Watson', sprint: 'Sprint 2024-04' },

  // Wave 2 Migration (STR-301-001-004) Tasks
  { task_id: 'TSK-301-001-004-01', name: 'Containerize batch 1 (10 apps)', description: 'First batch of 10 applications', status: 'Done', priority: 'Critical', story_id: 'STR-301-001-004', feature_id: 'FTR-301-001', project_id: 'PRJ-301', estimated_hours: 40, actual_hours: 45, task_type: 'Development', assignee: 'Tom Anderson', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-301-001-004-02', name: 'Containerize batch 2 (15 apps)', description: 'Second batch of 15 applications', status: 'In Progress', priority: 'Critical', story_id: 'STR-301-001-004', feature_id: 'FTR-301-001', project_id: 'PRJ-301', estimated_hours: 60, actual_hours: 30, task_type: 'Development', assignee: 'Chris Taylor', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-301-001-004-03', name: 'Containerize batch 3 (15 apps)', description: 'Third batch of 15 applications', status: 'To Do', priority: 'High', story_id: 'STR-301-001-004', feature_id: 'FTR-301-001', project_id: 'PRJ-301', estimated_hours: 60, actual_hours: 0, task_type: 'Development', assignee: 'Lisa Park', sprint: 'Sprint 2024-05' },
  { task_id: 'TSK-301-001-004-04', name: 'Containerize batch 4 (10 apps)', description: 'Final batch of 10 applications', status: 'To Do', priority: 'High', story_id: 'STR-301-001-004', feature_id: 'FTR-301-001', project_id: 'PRJ-301', estimated_hours: 40, actual_hours: 0, task_type: 'Development', assignee: 'Tom Anderson', sprint: 'Sprint 2024-05' },

  // Real-time Sentiment Analysis (STR-401-001-002) Tasks
  { task_id: 'TSK-401-001-002-01', name: 'Integrate sentiment API', description: 'Connect to cloud sentiment analysis service', status: 'Done', priority: 'High', story_id: 'STR-401-001-002', feature_id: 'FTR-401-001', project_id: 'PRJ-401', estimated_hours: 8, actual_hours: 6, task_type: 'Development', assignee: 'Monica Geller', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-401-001-002-02', name: 'Build sentiment dashboard', description: 'Real-time sentiment visualization for agents', status: 'In Progress', priority: 'High', story_id: 'STR-401-001-002', feature_id: 'FTR-401-001', project_id: 'PRJ-401', estimated_hours: 12, actual_hours: 6, task_type: 'Development', assignee: 'Monica Geller', sprint: 'Sprint 2024-04' },
  { task_id: 'TSK-401-001-002-03', name: 'Create alert rules', description: 'Trigger alerts for negative sentiment escalation', status: 'To Do', priority: 'Medium', story_id: 'STR-401-001-002', feature_id: 'FTR-401-001', project_id: 'PRJ-401', estimated_hours: 6, actual_hours: 0, task_type: 'Development', assignee: 'Rachel Green', sprint: 'Sprint 2024-04' },
];

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

async function syncFeatures() {
  console.log('\n📦 Creating Features...');
  let synced = 0;
  for (const feature of FEATURES) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_FEATURE, {
      ...feature,
      synced_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${feature.name}`);
    }
  }
  console.log(`  → ${synced}/${FEATURES.length} features created`);
  return synced;
}

async function syncStories() {
  console.log('\n📝 Creating Stories...');
  let synced = 0;
  for (const story of STORIES) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_STORY, {
      ...story,
      synced_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${story.name}`);
    }
  }
  console.log(`  → ${synced}/${STORIES.length} stories created`);
  return synced;
}

async function syncTasks() {
  console.log('\n✅ Creating Tasks...');
  let synced = 0;
  for (const task of TASKS) {
    const success = await applyAction(PALANTIR_ACTIONS.UPSERT_TASK, {
      ...task,
      synced_at: new Date().toISOString(),
    });
    if (success) {
      synced++;
      console.log(`  ✅ ${task.name}`);
    }
  }
  console.log(`  → ${synced}/${TASKS.length} tasks created`);
  return synced;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Syncing SAFe Work Items to Palantir Foundry');
  console.log('='.repeat(60));
  console.log(`\nOntology: ${ONTOLOGY_RID}`);
  console.log(`Host: ${PALANTIR_HOST}`);
  console.log('\nThis script creates:');
  console.log(`  - ${FEATURES.length} Features (AtlasFeature)`);
  console.log(`  - ${STORIES.length} Stories (AtlasStory)`);
  console.log(`  - ${TASKS.length} Tasks (AtlasTask)`);

  const results = {
    features: 0,
    stories: 0,
    tasks: 0,
  };

  try {
    // Sync in dependency order (Features → Stories → Tasks)
    results.features = await syncFeatures();
    results.stories = await syncStories();
    results.tasks = await syncTasks();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC RESULTS');
    console.log('='.repeat(60));
    console.log(`  Features: ${results.features}/${FEATURES.length}`);
    console.log(`  Stories: ${results.stories}/${STORIES.length}`);
    console.log(`  Tasks: ${results.tasks}/${TASKS.length}`);

    const total = results.features + results.stories + results.tasks;
    const expected = FEATURES.length + STORIES.length + TASKS.length;

    console.log('\n' + '='.repeat(60));
    if (total === expected) {
      console.log(`✅ SUCCESS: All ${total} SAFe items synced to Palantir!`);
    } else {
      console.log(`⚠️  PARTIAL: ${total}/${expected} SAFe items synced`);
    }
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();
