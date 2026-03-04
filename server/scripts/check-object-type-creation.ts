const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  // Get the full details of an existing object type to understand its structure
  console.log('=== Examining existing Atlas object type structure ===\n');
  
  const url = host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/AtlasProject';
  const response = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await response.json();
  
  console.log('AtlasProject full structure:');
  console.log(JSON.stringify(data, null, 2));
  
  // Now try to POST the exact same structure but with AtlasDivision name
  console.log('\n\n=== Trying to create AtlasDivision with same structure ===\n');
  
  const newType = {
    ...data,
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    primaryKey: 'divisionId',
    rid: undefined, // Remove the RID so it creates a new one
    properties: {
      divisionId: data.properties.projectId, // Copy structure from projectId
      name: data.properties.name,
      head: { ...data.properties.name, displayName: 'Division Head' },
      description: data.properties.description,
    }
  };
  
  // Clean up the rid from properties
  Object.keys(newType.properties).forEach(k => {
    if (newType.properties[k].rid) {
      delete newType.properties[k].rid;
    }
  });
  
  console.log('Payload:');
  console.log(JSON.stringify(newType, null, 2).slice(0, 1500));
  
  const createUrl = host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes';
  console.log('\nPOST ' + createUrl);
  
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newType)
  });
  
  console.log('Status:', createResponse.status);
  const text = await createResponse.text();
  console.log('Response:', text || '(empty)');
}
main().catch(console.error);
