const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== ALL AVAILABLE PALANTIR ACTIONS ===\n');

  const response = await fetch(host + '/api/v2/ontologies/' + ontologyRid + '/actionTypes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (!response.ok) {
    console.log('Error:', response.status);
    const text = await response.text();
    console.log(text);
    return;
  }

  const data = await response.json();
  const actions = data.data || [];

  console.log('Total actions:', actions.length);
  console.log('');

  // Group by prefix
  const atlasActions: string[] = [];
  const otherActions: string[] = [];

  for (const action of actions) {
    const line = action.apiName + ' → ' + (action.displayName || 'no display name');
    if (action.apiName.startsWith('atlas-')) {
      atlasActions.push(line);
    } else {
      otherActions.push(line);
    }
  }

  console.log('--- Atlas Actions (' + atlasActions.length + ') ---');
  atlasActions.forEach(a => console.log('  ' + a));

  console.log('\n--- Other Actions (' + otherActions.length + ') ---');
  otherActions.forEach(a => console.log('  ' + a));

  // Check for any division-related
  console.log('\n--- Division-related actions ---');
  for (const action of actions) {
    if (action.apiName.toLowerCase().includes('division') ||
        action.displayName?.toLowerCase().includes('division')) {
      console.log('  FOUND: ' + action.apiName);
    }
  }
}

main().catch(console.error);

export {};
