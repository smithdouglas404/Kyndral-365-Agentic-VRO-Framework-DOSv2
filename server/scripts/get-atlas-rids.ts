const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Getting RIDs from existing Atlas objects ===\n');
  
  // Get the full metadata for each Atlas object type to find their RIDs
  const objectTypes = ['AtlasProject', 'AtlasTransformation', 'AtlasRisk', 'AtlasKpi', 'AtlasInsight', 'AtlasAgent'];
  
  for (const objType of objectTypes) {
    const url = host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/' + objType;
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(objType + ':');
        console.log('  RID: ' + data.rid);
        console.log('  Primary Key: ' + data.primaryKey);
        console.log('');
      }
    } catch (e: any) {
      console.log(objType + ': Error - ' + e.message);
    }
  }
  
  // Get the ontology's full metadata to see datasource bindings
  console.log('\n=== Ontology Metadata ===\n');
  const metaUrl = host + '/api/v2/ontologies/' + ontologyRid;
  try {
    const response = await fetch(metaUrl, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (response.ok) {
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.log('Error: ' + e.message);
  }
}
main().catch(console.error);

export {};
