const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  // Get all groups first
  console.log('Getting user groups...');
  let response = await fetch(host + '/multipass/api/me/groups', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (response.ok) {
    const data = await response.json();
    console.log('Groups:', JSON.stringify(data.groups.map((g: any) => g.name), null, 2));
  }
  
  // Try to find datasets backing the Atlas object types
  console.log('\n\nSearching for Atlas backing datasets...\n');
  
  // Try getting object type implementation details
  const objectTypes = ['AtlasProject', 'AtlasRisk', 'AtlasTransformation'];
  
  for (const objType of objectTypes) {
    console.log('Checking ' + objType + ' backing info...');
    
    // Try various endpoints to get implementation details
    const endpoints = [
      host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/' + objType + '/outgoingLinkTypes',
      host + '/ontology-registry/api/objectTypes/' + objType,
    ];
    
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('  ' + url.split('/').slice(-2).join('/') + ':', JSON.stringify(data, null, 2).slice(0, 400));
        }
      } catch (e) {}
    }
  }
  
  // Try to use the Foundry filesystem API to find datasets
  console.log('\n\nTrying Foundry filesystem API...');
  const fsEndpoints = [
    host + '/foundry-data/api/datasets',
    host + '/compass/api/user-home',
    host + '/foundry-catalog/api/user/recents',
  ];
  
  for (const url of fsEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 500));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);

export {};
