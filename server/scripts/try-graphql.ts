const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('Trying GraphQL API for object type creation...\n');
  
  const graphqlEndpoints = [
    host + '/graphql',
    host + '/api/graphql',
    host + '/api/v2/graphql',
    host + '/ontology/graphql',
  ];
  
  const mutation = `
    mutation CreateObjectType($input: CreateObjectTypeInput!) {
      createObjectType(input: $input) {
        apiName
        displayName
      }
    }
  `;
  
  const variables = {
    input: {
      ontologyRid,
      apiName: 'AtlasDivision',
      displayName: '[Atlas] Division',
      description: 'Business Unit / Division / Segment',
      primaryKey: 'divisionId',
      properties: {
        divisionId: { type: 'string' },
        name: { type: 'string' }
      }
    }
  };
  
  for (const url of graphqlEndpoints) {
    console.log('POST ' + url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: mutation, variables })
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
  
  // Try the gatekeeper/admin APIs
  console.log('\n\nTrying admin APIs...');
  const adminEndpoints = [
    { method: 'GET', url: host + '/gatekeeper/api/ontologies' },
    { method: 'GET', url: host + '/api/v2/ontologies/' + ontologyRid + '/bulkLoad' },
    { method: 'GET', url: host + '/ontology-admin/api/ontologies/' + ontologyRid },
  ];
  
  for (const { method, url } of adminEndpoints) {
    console.log(method + ' ' + url);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const text = await response.text();
        console.log('  Response:', text.slice(0, 400));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
  
  // Try to discover available endpoints by checking OpenAPI spec
  console.log('\n\nChecking for API documentation...');
  const docEndpoints = [
    host + '/api/v2/openapi.json',
    host + '/api/v2/swagger.json',
    host + '/docs/api',
  ];
  
  for (const url of docEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const text = await response.text();
        // Look for objectTypes endpoints
        if (text.includes('objectTypes')) {
          const idx = text.indexOf('objectTypes');
          console.log('  Found objectTypes reference at:', text.slice(Math.max(0, idx-50), idx+100));
        }
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);
