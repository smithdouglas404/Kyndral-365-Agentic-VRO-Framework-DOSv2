import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;
  const token = process.env.PALANTIR_TOKEN;
  const host = 'https://ssg.usw-17.palantirfoundry.com';

  console.log('Attempting to create AtlasDivision via different API endpoints...\n');

  const definition = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    pluralDisplayName: '[Atlas] Divisions',
    primaryKey: 'divisionId',
    status: 'EXPERIMENTAL',
    properties: {
      divisionId: { displayName: 'Division ID', dataType: { type: 'string' } },
      name: { displayName: 'Name', dataType: { type: 'string' } },
      head: { displayName: 'Division Head', dataType: { type: 'string' } },
      description: { displayName: 'Description', dataType: { type: 'string' } },
      color: { displayName: 'Color', dataType: { type: 'string' } },
      portfolioId: { displayName: 'Portfolio ID', dataType: { type: 'string' } },
    }
  };

  // Try various Palantir API endpoints
  const endpoints = [
    // V2 standard
    { method: 'POST', url: host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes' },
    // V2 admin
    { method: 'POST', url: host + '/api/v2/admin/ontologies/' + ontologyRid + '/objectTypes' },
    // Ontology management API
    { method: 'POST', url: host + '/ontology-management/api/ontologies/' + ontologyRid + '/objectTypes' },
    // Ontology edit API
    { method: 'POST', url: host + '/ontology-edit/api/ontologies/' + ontologyRid + '/objectTypes' },
    // Builder API
    { method: 'POST', url: host + '/builder/api/v1/ontology/' + ontologyRid + '/objectTypes' },
    // Multipass internal
    { method: 'POST', url: host + '/multipass/api/internal/ontology/' + ontologyRid + '/objectTypes' },
  ];

  for (const { method, url } of endpoints) {
    console.log('Trying: ' + method + ' ' + url);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(definition)
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text) {
        console.log('  Response: ' + text.slice(0, 300));
      }
      if (response.ok) {
        console.log('\n  *** SUCCESS! ***\n');
        break;
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }
}
main().catch(console.error);
