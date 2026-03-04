import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const token = process.env.PALANTIR_TOKEN;
  const host = 'https://ssg.usw-17.palantirfoundry.com';
  const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;
  
  console.log('Attempting to create a backing dataset for AtlasDivision...\n');
  
  // Try to find a project/folder to create dataset in
  const folderEndpoints = [
    host + '/compass/api/resources?type=project&pageSize=5',
    host + '/compass/api/projects',
    host + '/api/v2/third-party-applications/atlas-management',
  ];
  
  for (const url of folderEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 800));
      } else {
        const text = await response.text();
        if (!text.includes('<!DOCTYPE')) {
          console.log('  Response:', text.slice(0, 200));
        }
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }
  
  // Try to find existing datasets related to Atlas
  console.log('\n--- Looking for existing Atlas datasets ---');
  const searchEndpoints = [
    host + '/compass/api/search?query=Atlas',
    host + '/foundry-catalog/api/catalog/search?query=Atlas',
  ];
  
  for (const url of searchEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 1200));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);
