/**
 * Test creating divisions with correct parameters
 */

const token = process.env.PALANTIR_TOKEN!;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

async function applyAction(actionName: string, params: Record<string, any>): Promise<any> {
  const url = `${host}/api/v2/ontologies/${ontologyRid}/actions/${actionName}/apply`;

  console.log(`\nCalling ${actionName} with:`, JSON.stringify(params, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parameters: params }),
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  if (text) {
    try {
      const json = JSON.parse(text);
      console.log('Response:', JSON.stringify(json, null, 2));
      return json;
    } catch {
      console.log('Response:', text.slice(0, 300));
    }
  }
  return null;
}

async function listObjects(): Promise<number> {
  const url = `${host}/api/v2/ontologies/${ontologyRid}/objects/AtlasDivision?pageSize=20`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  return data.data?.length || 0;
}

async function main() {
  console.log('='.repeat(60));
  console.log('TESTING ATLASDIVISION CREATION');
  console.log('='.repeat(60));

  // Check initial count
  const initialCount = await listObjects();
  console.log(`\nInitial division count: ${initialCount}`);

  // The create action needs these params - let's ensure id gets mapped to primaryKey_
  // by checking what happens when we call it

  const testParams = {
    id: 'test-div-' + Date.now(),
    name: 'Test Division API',
    head: 'API Test',
    description: 'Created via API',
    color: '#00FF00',
    changePercent: 15.0,
    portfolioId: 'test-portfolio',
    profit2024: 200.0,
    source: 'api-test',
    syncedAt: new Date().toISOString(),
  };

  await applyAction('create-atlas-division', testParams);

  // Check count after
  const afterCount = await listObjects();
  console.log(`\nDivision count after create: ${afterCount}`);

  if (afterCount > initialCount) {
    console.log('\n*** SUCCESS! Division was created! ***');
  } else {
    console.log('\n*** Division not created - checking edit action ***');

    // Maybe we need to use edit with the AtlasDivision parameter
    const editParams = {
      AtlasDivision: 'test-div-edit-' + Date.now(),
      id: 'test-div-edit-' + Date.now(),
      name: 'Test Division Edit',
      head: 'Edit Test',
      description: 'Created via edit action',
      color: '#0000FF',
      changePercent: 20.0,
      portfolioId: 'test-portfolio',
      profit2024: 300.0,
      source: 'api-test',
      syncedAt: new Date().toISOString(),
    };

    await applyAction('edit-atlas-division', editParams);

    const finalCount = await listObjects();
    console.log(`\nFinal division count: ${finalCount}`);
  }
}

main().catch(console.error);
