import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const palantir = getPalantirService() as any;
  if (!palantir) {
    console.log('Palantir not configured');
    return;
  }

  const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;
  const baseUrl = 'https://ssg.usw-17.palantirfoundry.com/api/v2';
  const token = process.env.PALANTIR_TOKEN;

  console.log('Ontology RID:', ontologyRid);
  console.log('');
  console.log('Fetching AtlasProject full metadata...');

  const urls = [
    baseUrl + '/ontologies/' + ontologyRid + '/objectTypes/AtlasProject/fullMetadata',
    'https://ssg.usw-17.palantirfoundry.com/ontology-metadata/api/ontology/' + ontologyRid + '/objectType/AtlasProject',
  ];

  for (const url of urls) {
    console.log('\nTrying: ' + url);
    try {
      const response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 3000));
      } else {
        const text = await response.text();
        console.log('  Error response:', text.slice(0, 500));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }

  // Try to list datasets
  console.log('\n\n--- Trying to list datasets ---');
  const datasetUrls = [
    baseUrl + '/datasets',
    'https://ssg.usw-17.palantirfoundry.com/api/v1/datasets',
  ];

  for (const url of datasetUrls) {
    console.log('\nTrying: ' + url);
    try {
      const response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 1000));
      } else {
        const text = await response.text();
        console.log('  Error response:', text.slice(0, 300));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);
