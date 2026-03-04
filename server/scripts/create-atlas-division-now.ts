/**
 * CREATE ATLAS DIVISION - DIRECT API ATTEMPT
 */

const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Creating AtlasDivision Object Type ===\n');

  const objectType = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    pluralDisplayName: '[Atlas] Divisions',
    status: 'EXPERIMENTAL',
    primaryKey: 'divisionId',
    titleProperty: 'name',
    visibility: 'NORMAL',
    icon: {
      type: 'blueprint',
      color: '#4A90D9',
      name: 'office'
    },
    properties: {
      divisionId: {
        displayName: 'Division ID',
        description: 'Unique identifier',
        dataType: { type: 'string' }
      },
      name: {
        displayName: 'Name',
        description: 'Division name',
        dataType: { type: 'string' }
      },
      head: {
        displayName: 'Head',
        description: 'Division leader',
        dataType: { type: 'string' }
      },
      description: {
        displayName: 'Description',
        dataType: { type: 'string' }
      }
    }
  };

  // Try every possible endpoint
  const endpoints = [
    '/ontology-metadata/api/ontologies/' + ontologyRid + '/objectTypes',
    '/api/v2/ontologies/' + ontologyRid + '/objectTypes',
    '/api/v1/ontologies/' + ontologyRid + '/objectTypes',
    '/ontology/api/objectTypes/create',
    '/foundry-backend/api/ontology/' + ontologyRid + '/objectTypes',
    '/ontology-registry/api/objectTypes',
    '/type-registry/api/types',
    '/schema-registry/api/objectTypes',
    '/ontology-manager/api/objectTypes',
    '/api/v2/admin/ontologies/' + ontologyRid + '/objectTypes',
  ];

  for (const ep of endpoints) {
    console.log('POST ' + ep);
    try {
      const response = await fetch(host + ep, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(objectType)
      });
      console.log('  Status: ' + response.status);

      if (response.ok || response.status === 201) {
        console.log('\n*** SUCCESS! ***');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      if (response.status === 400 || response.status === 403 || response.status === 500) {
        const text = await response.text();
        if (text && text.length < 500) console.log('  ' + text);
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }

  // Try ontology websocket/streaming API
  console.log('\n=== Trying alternative methods ===');

  // Check if there's an ontology editing session API
  const sessionEndpoints = [
    '/ontology-metadata/api/sessions/create',
    '/api/v2/ontologies/' + ontologyRid + '/edit/start',
  ];

  for (const ep of sessionEndpoints) {
    console.log('POST ' + ep);
    try {
      const response = await fetch(host + ep, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Session: ' + JSON.stringify(data));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }

  console.log('\n=== Result ===');
  console.log('No working endpoint found for creating object types via API.');
}

main().catch(console.error);
