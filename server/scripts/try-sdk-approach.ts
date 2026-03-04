const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Trying SDK/Internal API patterns ===\n');
  
  // The SDK might use different endpoints or authentication
  // Try the Foundry SDK pattern with ontology edits
  
  const sdkEndpoints = [
    // Ontology edit APIs
    { 
      url: host + '/ontology-registry/api/typeService/objectTypes',
      method: 'POST'
    },
    {
      url: host + '/type-registry/api/types',
      method: 'POST'
    },
    // Try with ontology RID in body instead of URL
    {
      url: host + '/api/v2/ontologies/objectTypes',
      method: 'POST',
      bodyIncludesOntology: true
    },
    // Blueprint API (the icon type was "blueprint")
    {
      url: host + '/blueprint/api/objectTypes',
      method: 'POST'
    },
    // Multipass controlled endpoints
    {
      url: host + '/foundry/api/ontology/objectTypes',
      method: 'POST'
    }
  ];
  
  const payload = {
    ontologyRid: ontologyRid,
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division',
    primaryKey: 'divisionId',
    status: 'EXPERIMENTAL',
    icon: { type: 'blueprint', color: '#FF6B35', name: 'office' },
    properties: {
      divisionId: { displayName: 'Division ID', dataType: { type: 'string' } },
      name: { displayName: 'Name', dataType: { type: 'string' } }
    }
  };
  
  for (const ep of sdkEndpoints) {
    console.log(ep.method + ' ' + ep.url);
    try {
      const response = await fetch(ep.url, {
        method: ep.method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'X-Foundry-Ontology': ontologyRid
        },
        body: JSON.stringify(payload)
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE') && text.length < 500) {
        console.log('  Response: ' + text);
      }
      if (response.ok) {
        console.log('\n*** SUCCESS ***');
        break;
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
    console.log('');
  }
  
  // Last try - websocket or stream API
  console.log('\n=== Check if there is a different API version ===');
  const versions = ['v1', 'v2', 'v3', 'v1beta', 'v2beta'];
  for (const v of versions) {
    const url = host + '/api/' + v + '/ontologies/' + ontologyRid;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        console.log('API ' + v + ' exists!');
      }
    } catch {}
  }
}
main().catch(console.error);
