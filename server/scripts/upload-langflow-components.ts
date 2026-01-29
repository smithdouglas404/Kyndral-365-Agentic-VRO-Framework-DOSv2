/**
 * UPLOAD LANGFLOW COMPONENTS
 *
 * Script to upload custom Langflow components via REST API
 * Components: ThresholdEvaluator, WebSocketBroadcaster, DBPersister, AttributeMapper, A2AMessageSender
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LANGFLOW_API_URL = process.env.LANGFLOW_API_URL;
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY;

if (!LANGFLOW_API_URL || !LANGFLOW_API_KEY) {
  console.error('❌ Missing LANGFLOW_API_URL or LANGFLOW_API_KEY in environment');
  process.exit(1);
}

const components = [
  'threshold_evaluator.py',
  'websocket_broadcaster.py',
  'db_persister.py',
  'attribute_mapper.py',
  'a2a_message_sender.py'
];

async function uploadComponent(filename: string) {
  try {
    const componentPath = path.join(process.cwd(), 'langflow-components', filename);

    if (!fs.existsSync(componentPath)) {
      console.error(`❌ Component file not found: ${filename}`);
      return false;
    }

    const code = fs.readFileSync(componentPath, 'utf-8');
    const componentName = filename.replace('.py', '');

    console.log(`\n📤 Uploading ${componentName}...`);

    const orgId = process.env.LANGFLOW_ORG_ID;

    const headers: Record<string, string> = {
      'x-api-key': LANGFLOW_API_KEY,
      'Content-Type': 'application/json'
    };

    if (orgId) {
      headers['X-DataStax-Current-Org'] = orgId;
    }

    const response = await axios.post(
      `${LANGFLOW_API_URL}/custom_component`,
      {
        code: code,
        name: componentName
      },
      {
        headers
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Successfully uploaded ${componentName}`);
      console.log(`   Component ID: ${response.data.id || 'N/A'}`);
      return true;
    } else {
      console.error(`❌ Failed to upload ${componentName}: HTTP ${response.status}`);
      return false;
    }

  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Failed to upload ${filename}:`);
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`❌ Error uploading ${filename}:`, error.message);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Langflow component upload...');
  console.log(`   API URL: ${LANGFLOW_API_URL}`);
  console.log(`   Components to upload: ${components.length}`);

  let successCount = 0;
  let failCount = 0;

  for (const component of components) {
    const success = await uploadComponent(component);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n📊 Upload Summary:');
  console.log(`   ✅ Successful: ${successCount}/${components.length}`);
  console.log(`   ❌ Failed: ${failCount}/${components.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some components failed to upload. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All components uploaded successfully!');
    process.exit(0);
  }
}

main();
