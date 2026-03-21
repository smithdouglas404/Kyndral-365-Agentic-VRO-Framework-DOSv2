const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Attempting to create atlas-create-division action ===\n');
  
  // Try to create a new action type that references an existing object type
  const actionPayload = {
    apiName: 'atlas-create-division',
    displayName: '[Atlas] Create Division',
    description: 'Create or update a business division',
    parameters: {
      division_id: { dataType: { type: 'string' }, required: true },
      name: { dataType: { type: 'string' }, required: true },
      head: { dataType: { type: 'string' }, required: false },
      description: { dataType: { type: 'string' }, required: false },
      color: { dataType: { type: 'string' }, required: false },
      portfolio_id: { dataType: { type: 'string' }, required: false },
      profit_2023: { dataType: { type: 'double' }, required: false },
      profit_2024: { dataType: { type: 'double' }, required: false },
      change_percent: { dataType: { type: 'double' }, required: false },
    }
  };
  
  // Try creating action type
  const actionEndpoints = [
    host + '/api/v2/ontologies/' + ontologyRid + '/actionTypes',
    host + '/phonograph2/api/ontologies/' + ontologyRid + '/actionTypes',
  ];
  
  for (const url of actionEndpoints) {
    console.log('POST ' + url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(actionPayload)
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 500));
      }
      if (response.ok) {
        console.log('\n*** ACTION CREATED! ***');
        break;
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }

  // Since action creation likely also fails, let's check if we can use
  // an EXISTING action with different parameters
  console.log('\n\n=== Testing existing atlas-create-transformation for divisions ===\n');
  
  // Try using atlas-create-transformation to store division data
  const divisionData = {
    transformation_id: 'div-test-001',
    name: '[Division] Test Business Unit',
    status: 'Active',
    vision: 'Test division created via API',
    executive_sponsor: 'John Smith',
    // Add custom fields that might work
    created_at: new Date().toISOString(),
  };
  
  console.log('Applying atlas-create-transformation with division data:');
  console.log(JSON.stringify(divisionData, null, 2));
  
  const applyUrl = host + '/api/v2/ontologies/' + ontologyRid + '/actions/atlas-create-transformation/apply';
  console.log('\nPOST ' + applyUrl);
  
  try {
    const response = await fetch(applyUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parameters: divisionData })
    });
    console.log('Status: ' + response.status);
    const text = await response.text();
    console.log('Response: ' + text);
    
    if (response.ok) {
      console.log('\n*** SUCCESS! Division created using atlas-create-transformation ***');
    }
  } catch (e: any) {
    console.log('Error: ' + e.message);
  }
}
main().catch(console.error);

export {};
