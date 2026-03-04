import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;
  const token = process.env.PALANTIR_TOKEN;
  const host = 'https://ssg.usw-17.palantirfoundry.com';

  console.log('Attempting phonograph/managed object type creation...\n');

  // Try the phonograph API - used for action-backed objects
  const endpoints = [
    host + '/phonograph/api/ontology/' + ontologyRid + '/objectTypes',
    host + '/phonograph2/api/ontologies/' + ontologyRid + '/objectTypes',
    host + '/phonograph/api/v1/ontology/' + ontologyRid + '/objectTypes',
    host + '/oma/api/ontologies/' + ontologyRid + '/objectTypes',
    host + '/ontology-manager/api/ontologies/' + ontologyRid + '/objectTypes',
    host + '/ontology/api/ontologies/' + ontologyRid + '/objectTypes',
    host + '/api/ontologies/' + ontologyRid + '/objectTypes',
  ];

  const definition = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    primaryKey: 'divisionId',
    properties: {
      divisionId: { displayName: 'Division ID', dataType: { type: 'string' } },
      name: { displayName: 'Name', dataType: { type: 'string' } },
    }
  };

  for (const url of endpoints) {
    console.log('POST ' + url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(definition)
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 200));
      }
      if (response.ok) {
        console.log('\n  *** SUCCESS! ***\n');
        break;
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }

  // Also try to list what API routes are available
  console.log('\n\n--- Checking available API routes ---');
  const checkUrls = [
    host + '/api',
    host + '/api/v2',
    host + '/gateway-internal/api/gateway',
  ];

  for (const url of checkUrls) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);
