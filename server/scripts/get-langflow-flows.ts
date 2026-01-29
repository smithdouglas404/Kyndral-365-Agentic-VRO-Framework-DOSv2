/**
 * GET LANGFLOW FLOWS
 *
 * Script to retrieve flow definitions from Langflow
 */

import dotenv from 'dotenv';
import { LangflowService } from '../lib/LangflowService.js';

// Load environment variables
dotenv.config();

const LANGFLOW_API_URL = process.env.LANGFLOW_API_URL;
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY;
const LANGFLOW_ORG_ID = process.env.LANGFLOW_ORG_ID;
const LANGFLOW_PROJECT_ID = process.env.LANGFLOW_PROJECT_ID;

if (!LANGFLOW_API_URL || !LANGFLOW_API_KEY) {
  console.error('❌ Missing LANGFLOW_API_URL or LANGFLOW_API_KEY');
  process.exit(1);
}

// Flow IDs from ALL_AGENTS_WIRED.md
const flowIds = {
  finops: '70d569d8-3e9c-4684-9227-ee4743d4be09',
  tmo: 'be3ebfe5-ac51-456d-8b22-c7ff5d123ed4',
  risk: '9be34a7d-1a53-455e-ad22-6d94565c5a7e',
  vro: 'a5e06553-0e6b-42ed-9d68-5003b0c2a2be',
  pmo: '27bc79cd-2302-4356-a039-3238de8218b8',
  ocm: '06ef7ded-63df-4ed7-8a90-9ad3e8ddeef9',
  governance: '5d29ac9d-fd49-4400-bdf2-8f7877ff0fa4',
  planning: '6128dcc0-e61f-4853-96bc-42e483473059'
};

async function main() {
  console.log('🔍 Retrieving Langflow flow definitions...\n');

  const langflowService = new LangflowService({
    apiUrl: LANGFLOW_API_URL!,
    apiKey: LANGFLOW_API_KEY!,
    orgId: LANGFLOW_ORG_ID,
    projectId: LANGFLOW_PROJECT_ID
  });

  // Test connection first
  console.log('Testing connection...');
  const connected = await langflowService.testConnection();
  if (!connected) {
    console.error('❌ Failed to connect to Langflow');
    process.exit(1);
  }
  console.log('✅ Connected to Langflow\n');

  // Get FinOps flow as example
  console.log('📥 Retrieving FinOps flow definition...');
  const finopsFlow = await langflowService.getFlowById(flowIds.finops);

  if (finopsFlow) {
    console.log('✅ Successfully retrieved FinOps flow');
    console.log('Flow structure:');
    console.log(JSON.stringify(finopsFlow, null, 2));
  } else {
    console.log('❌ Failed to retrieve FinOps flow');
  }

  console.log('\n📊 Summary:');
  console.log(`Total flows configured: ${Object.keys(flowIds).length}`);
}

main().catch(console.error);
