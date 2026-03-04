/**
 * Check all Palantir action parameters to find any issues
 */

const token = process.env.PALANTIR_TOKEN!;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

async function checkAction(actionName: string) {
  const resp = await fetch(
    `${host}/api/v2/ontologies/${ontologyRid}/actionTypes/${actionName}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (resp.status !== 200) {
    console.log(`❌ ${actionName}: NOT FOUND`);
    return null;
  }
  const data = await resp.json();
  const params = Object.entries(data.parameters || {})
    .map(([k, v]: [string, any]) => `${k}:${v.dataType?.type || 'unknown'}`)
    .join(', ');
  console.log(`✓ ${actionName}`);
  if (params) {
    console.log(`  Parameters: ${params}`);
  }
  return data;
}

async function main() {
  console.log('='.repeat(60));
  console.log('CHECKING ALL PALANTIR ACTIONS');
  console.log('='.repeat(60) + '\n');

  const actions = [
    'upsertProject',
    'upsertAgent',
    'upsertAgentAttribute',
    'upsertFeature',
    'upsertStory',
    'upsertTask',
    'upsertRisk',
    'upsertKPI',
    'upsertOKR',
    'upsertDivision',
    'create-atlas-division',
    'createIntervention',
    'createAlert',
    // Atlas-style actions that might exist
    'atlas-create-project',
    'atlas-create-agent',
    'atlas-create-division',
  ];

  for (const action of actions) {
    await checkAction(action);
  }

  console.log('\n' + '='.repeat(60));
  console.log('CHECKING DECIMAL TYPE ISSUES IN OBJECT TYPES');
  console.log('='.repeat(60) + '\n');

  // Check object types for decimal properties
  const objectTypes = ['AtlasDivision', 'Project', 'Feature', 'Risk', 'KPI', 'Agent'];

  for (const objType of objectTypes) {
    const resp = await fetch(
      `${host}/api/v2/ontologies/${ontologyRid}/objectTypes/${objType}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (resp.status !== 200) {
      console.log(`❌ ${objType}: NOT FOUND`);
      continue;
    }
    const data = await resp.json();
    const decimalProps = Object.entries(data.properties || {})
      .filter(([_, v]: [string, any]) => v.dataType?.type === 'decimal')
      .map(([k]) => k);

    if (decimalProps.length > 0) {
      console.log(`⚠️  ${objType}: Has DECIMAL properties (API unsupported): ${decimalProps.join(', ')}`);
    } else {
      console.log(`✓ ${objType}: No decimal issues`);
    }
  }
}

main().catch(console.error);
