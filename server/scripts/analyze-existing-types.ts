const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  // Get full metadata to see if there's any datasource info
  console.log('=== Analyzing existing Atlas types for datasource info ===\n');
  
  const url = host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/AtlasProject/fullMetadata';
  const response = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await response.json();
  
  // Check all keys for any datasource or backing info
  console.log('All keys in fullMetadata:');
  const printKeys = (obj: any, prefix = '') => {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        console.log(prefix + key + ':');
        printKeys(obj[key], prefix + '  ');
      } else {
        console.log(prefix + key + ': ' + JSON.stringify(obj[key]).slice(0, 100));
      }
    }
  };
  printKeys(data);
  
  // Also check the action type to see how it references the object type
  console.log('\n\n=== Checking atlas-create-project action ===\n');
  const actionUrl = host + '/api/v2/ontologies/' + ontologyRid + '/actionTypes/atlas-create-project';
  const actionResponse = await fetch(actionUrl, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const actionData = await actionResponse.json();
  console.log(JSON.stringify(actionData, null, 2));
}
main().catch(console.error);
