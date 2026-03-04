const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Exploring v1 API ===\n');
  
  // Check what endpoints exist in v1
  const v1Endpoints = [
    host + '/api/v1/ontologies',
    host + '/api/v1/ontologies/' + ontologyRid,
    host + '/api/v1/ontologies/' + ontologyRid + '/objectTypes',
  ];
  
  for (const url of v1Endpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response: ' + JSON.stringify(data).slice(0, 300));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }
  
  // Try POST on v1 objectTypes
  console.log('\n=== Try POST on v1 ===\n');
  
  const postUrl = host + '/api/v1/ontologies/' + ontologyRid + '/objectTypes';
  console.log('POST ' + postUrl);
  
  // Try OPTIONS first
  let response = await fetch(postUrl, {
    method: 'OPTIONS',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('OPTIONS Status: ' + response.status);
  console.log('Allow: ' + response.headers.get('allow'));
  
  // Now try POST
  response = await fetch(postUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiName: 'AtlasDivision',
      displayName: '[Atlas] Division',
      primaryKey: 'divisionId',
      properties: {
        divisionId: { type: 'string' },
        name: { type: 'string' }
      }
    })
  });
  console.log('POST Status: ' + response.status);
  const text = await response.text();
  console.log('Response: ' + text.slice(0, 300));
}
main().catch(console.error);
