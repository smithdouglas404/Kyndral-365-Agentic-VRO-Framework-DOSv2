const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Checking all possible ontology management endpoints ===\n');
  
  // Check the root of various services to see what's available
  const discoverEndpoints = [
    host + '/api/v2',
    host + '/api/v1', 
    host + '/ontology-metadata/api',
    host + '/phonograph2/api',
    host + '/ontology/api',
    host + '/oma/api',
    host + '/builder/api',
  ];
  
  for (const url of discoverEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (response.ok && text) {
        console.log('  Response: ' + text.slice(0, 200));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
  
  // Try OPTIONS to see allowed methods
  console.log('\n\n=== Checking OPTIONS on objectTypes endpoint ===\n');
  const optionsUrl = host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes';
  try {
    const response = await fetch(optionsUrl, {
      method: 'OPTIONS',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Status: ' + response.status);
    console.log('Allow header: ' + response.headers.get('allow'));
    console.log('Access-Control-Allow-Methods: ' + response.headers.get('access-control-allow-methods'));
  } catch (e: any) {
    console.log('Error: ' + e.message);
  }
  
  // Check if there's an /admin path
  console.log('\n\n=== Checking admin endpoints ===\n');
  const adminUrl = host + '/api/v2/admin/ontologies/' + ontologyRid;
  try {
    const response = await fetch(adminUrl, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('Status: ' + response.status);
    if (response.ok) {
      const text = await response.text();
      console.log('Response: ' + text.slice(0, 300));
    }
  } catch (e: any) {
    console.log('Error: ' + e.message);
  }
}
main().catch(console.error);

export {};
