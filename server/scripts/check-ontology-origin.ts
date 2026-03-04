const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Checking Ontology Origin ===\n');
  
  // Get ontology details
  let response = await fetch(host + '/api/v2/ontologies/' + ontologyRid, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  let data = await response.json();
  console.log('Ontology:', data.displayName);
  console.log('RID:', data.rid);
  
  // List ALL object types and check which are Example vs Atlas
  response = await fetch(host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await response.json();
  
  const example = data.data.filter((t: any) => t.apiName.startsWith('Example'));
  const atlas = data.data.filter((t: any) => t.apiName.startsWith('Atlas'));
  const other = data.data.filter((t: any) => !t.apiName.startsWith('Example') && !t.apiName.startsWith('Atlas'));
  
  console.log('\n--- Object Types by Category ---');
  console.log('\nEXAMPLE types (came with Palantir demo):');
  example.forEach((t: any) => console.log('  ' + t.apiName + ' (' + t.status + ')'));
  
  console.log('\nATLAS types (custom):');
  atlas.forEach((t: any) => console.log('  ' + t.apiName + ' (' + t.status + ')'));
  
  console.log('\nOTHER types:');
  other.forEach((t: any) => console.log('  ' + t.apiName + ' (' + t.status + ')'));
  
  // Check actions
  console.log('\n\n--- Atlas Actions ---');
  response = await fetch(host + '/api/v2/ontologies/' + ontologyRid + '/actionTypes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  data = await response.json();
  
  const atlasActions = (data.data || []).filter((a: any) => a.apiName.startsWith('atlas-'));
  atlasActions.forEach((a: any) => console.log('  ' + a.apiName));
  
  console.log('\n\nTotal: ' + example.length + ' Example, ' + atlas.length + ' Atlas, ' + other.length + ' Other');
}
main().catch(console.error);
