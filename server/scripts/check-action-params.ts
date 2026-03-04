/**
 * Check detailed parameters for key actions
 */

const token = process.env.PALANTIR_TOKEN!;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

async function getActionDetails(actionName: string) {
  const resp = await fetch(
    `${host}/api/v2/ontologies/${ontologyRid}/actionTypes/${actionName}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (resp.status !== 200) {
    return null;
  }
  return await resp.json();
}

async function main() {
  const actions = [
    'atlas-create-project',
    'atlas-create-insight',
    'atlas-create-kpi',
    'atlas-create-risk',
    'atlas-create-objective',
    'create-atlas-division',
  ];

  for (const action of actions) {
    console.log('\n' + '='.repeat(60));
    console.log(`ACTION: ${action}`);
    console.log('='.repeat(60));

    const data = await getActionDetails(action);
    if (!data) {
      console.log('NOT FOUND');
      continue;
    }

    console.log('\nParameters:');
    for (const [key, value] of Object.entries(data.parameters || {})) {
      const p = value as any;
      const required = p.required ? '(REQUIRED)' : '(optional)';
      console.log(`  ${key}: ${p.dataType?.type || 'unknown'} ${required}`);
    }

    console.log('\nOperations:');
    for (const op of data.operations || []) {
      console.log(`  ${op.type}: ${op.objectTypeApiName || op.linkTypeApiName || 'unknown'}`);
    }
  }
}

main().catch(console.error);
