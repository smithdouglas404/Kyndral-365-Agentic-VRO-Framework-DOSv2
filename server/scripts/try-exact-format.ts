const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('User has roles: Foundry Administrators, Ontology Administrators\n');
  console.log('Trying the EXACT format from Palantir documentation...\n');
  
  // The Python example payload format
  const payload = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    primaryKey: 'divisionId',  // String, not array
    properties: {
      divisionId: { type: 'string' },
      name: { type: 'string' },
      head: { type: 'string' },
      description: { type: 'string' },
      color: { type: 'string' },
      portfolioId: { type: 'string' },
      profit2023: { type: 'double' },
      profit2024: { type: 'double' },
      changePercent: { type: 'double' },
      source: { type: 'string' },
      syncedAt: { type: 'timestamp' }
    }
    // Note: No dataSource field - we'll see if it can work without one
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');
  
  const url = host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes';
  console.log('POST ' + url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response:', text);
    
  } catch (e: any) {
    console.log('Error:', e.message);
  }
  
  // Also try the v1 API
  console.log('\n\nTrying v1 API...');
  const v1Url = host + '/api/v1/ontologies/' + ontologyRid + '/objectTypes';
  console.log('POST ' + v1Url);
  
  try {
    const response = await fetch(v1Url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log('Status:', response.status);
    const text = await response.text();
    if (!text.includes('<!DOCTYPE')) {
      console.log('Response:', text.slice(0, 500));
    }
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}
main().catch(console.error);
