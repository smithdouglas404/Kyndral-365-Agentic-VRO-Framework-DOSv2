const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('Trying Ontology Management Application (OMA) APIs...\n');

  // The user said createObjectType needs a Service Account with Ontology Admin role
  // Let's check if we have the right permissions
  
  // First, let's see what actions are available for managing ontology
  const omaEndpoints = [
    // Try the ontology admin/management endpoints
    { method: 'GET', url: host + '/ontology-management/api/ontologies/' + ontologyRid },
    { method: 'POST', url: host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/bulk' },
    // Try with different content type for object type creation
    { method: 'POST', url: host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes', 
      body: {
        objectTypes: [{
          apiName: 'AtlasDivision',
          displayName: '[Atlas] Division',
          description: 'Business Unit / Division',
          primaryKey: { apiName: 'divisionId', dataType: { type: 'string' } },
          properties: [
            { apiName: 'divisionId', displayName: 'Division ID', dataType: { type: 'string' } },
            { apiName: 'name', displayName: 'Name', dataType: { type: 'string' } }
          ]
        }]
      }
    },
    // Try SDK-style endpoint
    { method: 'PUT', url: host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/AtlasDivision',
      body: {
        apiName: 'AtlasDivision',
        displayName: '[Atlas] Division',
        description: 'Business Unit / Division',
        primaryKey: { apiName: 'divisionId', dataType: { type: 'string' } },
        properties: [
          { apiName: 'divisionId', displayName: 'Division ID', dataType: { type: 'string' } },
          { apiName: 'name', displayName: 'Name', dataType: { type: 'string' } }
        ]
      }
    },
  ];
  
  for (const { method, url, body } of omaEndpoints) {
    console.log(method + ' ' + url);
    try {
      const options: RequestInit = {
        method,
        headers: { 
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 400));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }
  
  // Check current user's groups/roles
  console.log('\n--- Checking user roles/permissions ---');
  const roleEndpoints = [
    host + '/multipass/api/me/groups',
    host + '/multipass/api/me/principals',
  ];
  
  for (const url of roleEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 600));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);
