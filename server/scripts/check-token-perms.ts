import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const token = process.env.PALANTIR_TOKEN;
  const host = 'https://ssg.usw-17.palantirfoundry.com';
  
  // Try to check token info
  console.log('Checking token permissions...\n');
  
  const endpoints = [
    host + '/multipass/api/me',
    host + '/api/v1/me',
    host + '/api/v2/users/getCurrent',
    host + '/multipass/api/service-accounts/me',
  ];
  
  for (const url of endpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 1000));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }
  
  // Try the ontology SDK API (TypeScript SDK pattern)
  console.log('\n--- Trying ontology SDK pattern ---');
  const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;
  
  // Check if there's an object type registration endpoint
  const sdkEndpoints = [
    { method: 'GET', url: host + '/ontology-sdk/api/ontologies/' + ontologyRid + '/objectTypes' },
    { method: 'GET', url: host + '/type-registry/api/objectTypes' },
    { method: 'GET', url: host + '/foundry-sdk/api/ontologies/' + ontologyRid },
  ];
  
  for (const { method, url } of sdkEndpoints) {
    console.log(method + ' ' + url);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const text = await response.text();
        console.log('  Response:', text.slice(0, 500));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);

export {};
