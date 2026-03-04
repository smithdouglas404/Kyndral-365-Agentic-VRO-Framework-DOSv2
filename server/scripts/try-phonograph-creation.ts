const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Trying Phonograph-style object type creation ===\n');
  
  // Try the phonograph2 API which returned a JSON error earlier (not HTML 404)
  // This suggests the service exists
  
  const phonographEndpoints = [
    host + '/phonograph2/api/objectTypes',
    host + '/phonograph2/api/ontology/' + ontologyRid + '/objectTypes',
    host + '/phonograph2/api/v1/objectTypes',
    host + '/ontology-metadata/api/objectTypes',
    host + '/ontology-builder/api/objectTypes',
  ];
  
  const objectTypeDefinition = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    status: 'EXPERIMENTAL',
    primaryKey: 'divisionId',
    properties: {
      divisionId: {
        displayName: 'Division ID',
        dataType: { type: 'string' },
        required: true
      },
      name: {
        displayName: 'Name',
        dataType: { type: 'string' },
        required: true
      },
      head: {
        displayName: 'Division Head',
        dataType: { type: 'string' }
      },
      description: {
        displayName: 'Description',
        dataType: { type: 'string' }
      }
    },
    ontologyRid: ontologyRid
  };
  
  for (const url of phonographEndpoints) {
    console.log('POST ' + url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(objectTypeDefinition)
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 300));
        if (response.ok) {
          console.log('\n*** SUCCESS! ***');
          break;
        }
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }
  
  // Try the ri.actions endpoint pattern (since actions have ri.actions.main prefix)
  console.log('\n\n=== Trying ri.actions pattern ===\n');
  const actionsEndpoints = [
    host + '/actions/api/ontologies/' + ontologyRid + '/actionTypes',
    host + '/ri.actions.main/api/actionTypes',
  ];
  
  for (const url of actionsEndpoints) {
    console.log('POST ' + url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiName: 'atlas-create-division',
          displayName: '[Atlas] Create Division',
          description: 'Creates a division',
          parameters: {
            division_id: { dataType: { type: 'string' }, required: true },
            name: { dataType: { type: 'string' }, required: true }
          },
          operations: [{ type: 'createObject', objectTypeApiName: 'AtlasDivision' }]
        })
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 200));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
}
main().catch(console.error);
