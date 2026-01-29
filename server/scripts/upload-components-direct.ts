/**
 * Direct component upload to Langflow
 * Try different authentication methods
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const LANGFLOW_API_URL = process.env.LANGFLOW_API_URL;
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY;
const LANGFLOW_ORG_ID = process.env.LANGFLOW_ORG_ID;

async function uploadWithBearer() {
  const componentPath = path.join(process.cwd(), 'langflow-components', 'threshold_evaluator.py');
  const code = fs.readFileSync(componentPath, 'utf-8');

  try {
    const response = await fetch(`${LANGFLOW_API_URL}/custom_component`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGFLOW_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DataStax-Current-Org': LANGFLOW_ORG_ID || ''
      },
      body: JSON.stringify({ code, name: 'threshold_evaluator' })
    });

    console.log('Bearer auth response:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    return response.ok;
  } catch (error: any) {
    console.error('Bearer auth error:', error.message);
    return false;
  }
}

async function uploadWithAPIKey() {
  const componentPath = path.join(process.cwd(), 'langflow-components', 'threshold_evaluator.py');
  const code = fs.readFileSync(componentPath, 'utf-8');

  try {
    const response = await fetch(`${LANGFLOW_API_URL}/custom_component`, {
      method: 'POST',
      headers: {
        'x-api-key': LANGFLOW_API_KEY || '',
        'Content-Type': 'application/json',
        'X-DataStax-Current-Org': LANGFLOW_ORG_ID || ''
      },
      body: JSON.stringify({ code, name: 'threshold_evaluator' })
    });

    console.log('API key response:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    return response.ok;
  } catch (error: any) {
    console.error('API key error:', error.message);
    return false;
  }
}

async function main() {
  console.log('Testing component upload methods...\n');

  console.log('Method 1: Bearer token');
  await uploadWithBearer();

  console.log('\nMethod 2: API key header');
  await uploadWithAPIKey();
}

main();
