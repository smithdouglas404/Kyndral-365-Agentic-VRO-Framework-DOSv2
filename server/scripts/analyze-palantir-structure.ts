const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== PALANTIR ONTOLOGY STRUCTURE ANALYSIS ===\n');

  // Get all object types
  const otResponse = await fetch(host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const otData = await otResponse.json();
  const objectTypes = otData.data || [];

  // Get all actions
  const actResponse = await fetch(host + '/api/v2/ontologies/' + ontologyRid + '/actionTypes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const actData = await actResponse.json();
  const actions = actData.data || [];

  console.log('Object Types:', objectTypes.length);
  console.log('Action Types:', actions.length);
  console.log('');

  // Analyze Atlas object types
  console.log('=== ATLAS OBJECT TYPES ===');
  const atlasTypes = objectTypes.filter((ot: any) => ot.apiName.startsWith('Atlas'));
  for (const ot of atlasTypes) {
    console.log('\n' + ot.apiName + ' (' + ot.displayName + ')');
    console.log('  Description: ' + (ot.description || 'none'));
    console.log('  Status: ' + (ot.status || 'unknown'));
    console.log('  Primary Key: ' + JSON.stringify(ot.primaryKey));

    // Find matching action
    const matchingAction = actions.find((a: any) =>
      a.apiName.toLowerCase().includes(ot.apiName.toLowerCase().replace('atlas', '')) ||
      a.apiName.includes('atlas-create-' + ot.apiName.replace('Atlas', '').toLowerCase())
    );
    if (matchingAction) {
      console.log('  Action: ' + matchingAction.apiName);
    } else {
      console.log('  Action: NO MATCHING ACTION FOUND');
    }
  }

  // Check for fullMetadata to understand data source
  console.log('\n\n=== CHECKING DATA SOURCES ===');
  const sampleType = atlasTypes[0];
  if (sampleType) {
    const metaResponse = await fetch(
      host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/' + sampleType.apiName + '/fullMetadata',
      { headers: { 'Authorization': 'Bearer ' + token } }
    );
    if (metaResponse.ok) {
      const meta = await metaResponse.json();
      console.log('\nSample metadata for ' + sampleType.apiName + ':');
      console.log(JSON.stringify(meta, null, 2).slice(0, 1500));
    } else {
      // Try regular metadata
      const typeResponse = await fetch(
        host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/' + sampleType.apiName,
        { headers: { 'Authorization': 'Bearer ' + token } }
      );
      const typeData = await typeResponse.json();
      console.log('\nMetadata for ' + sampleType.apiName + ':');
      console.log(JSON.stringify(typeData, null, 2).slice(0, 1500));
    }
  }

  // Check ontology full metadata for creation hints
  console.log('\n\n=== ONTOLOGY METADATA ===');
  const ontMetaResponse = await fetch(
    host + '/api/v2/ontologies/' + ontologyRid + '/fullMetadata',
    { headers: { 'Authorization': 'Bearer ' + token } }
  );
  if (ontMetaResponse.ok) {
    const ontMeta = await ontMetaResponse.json();
    console.log('Keys in ontology metadata:', Object.keys(ontMeta));
    if (ontMeta.objectTypes) {
      const sampleOT = Object.values(ontMeta.objectTypes)[0] as any;
      if (sampleOT) {
        console.log('\nSample object type structure:');
        console.log(JSON.stringify(sampleOT, null, 2).slice(0, 2000));
      }
    }
  }
}

main().catch(console.error);
