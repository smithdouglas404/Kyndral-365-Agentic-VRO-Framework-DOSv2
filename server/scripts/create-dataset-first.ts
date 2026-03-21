const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Step 1: Find or Create a Dataset ===\n');
  
  // Try to create a dataset first
  const datasetEndpoints = [
    { method: 'POST', url: host + '/api/v2/datasets', body: { name: 'atlas_divisions' } },
    { method: 'POST', url: host + '/foundry-data/api/datasets/create', body: { name: 'atlas_divisions' } },
    { method: 'POST', url: host + '/catalog/api/datasets', body: { name: 'atlas_divisions' } },
  ];
  
  for (const { method, url, body } of datasetEndpoints) {
    console.log(method + ' ' + url);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 400));
      }
      if (response.ok) {
        console.log('\n*** DATASET CREATED! ***');
        const data = JSON.parse(text);
        console.log('Dataset RID:', data.rid || data.datasetRid || 'check response');
        break;
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
  
  // Try to find the ontology's backing datasets
  console.log('\n\n=== Looking for existing ontology datasources ===\n');
  
  // The v2 API might expose datasource info in a different way
  const infoEndpoints = [
    host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/AtlasProject/page',
    host + '/api/v2/ontologies/' + ontologyRid + '/objects/AtlasProject?pageSize=1',
  ];
  
  for (const url of infoEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        // Look for any dataset references in the response
        const text = JSON.stringify(data);
        const datasetMatch = text.match(/ri\.foundry\.main\.dataset\.[a-f0-9-]+/);
        if (datasetMatch) {
          console.log('  Found dataset RID: ' + datasetMatch[0]);
        }
        console.log('  Sample response:', JSON.stringify(data, null, 2).slice(0, 500));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);

export {};
