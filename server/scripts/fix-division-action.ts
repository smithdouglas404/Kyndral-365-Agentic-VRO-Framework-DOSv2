/**
 * Fix AtlasDivision - Add primaryKey_ parameter or try direct object creation
 */

const token = process.env.PALANTIR_TOKEN!;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

async function request(method: string, path: string, body?: any): Promise<any> {
  const url = host + path;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();
  console.log(`${method} ${path} -> ${response.status}`);

  if (!response.ok && text) {
    console.log(`  Error: ${text.slice(0, 300)}`);
  }

  return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function main() {
  console.log('='.repeat(60));
  console.log('FIXING ATLASDIVISION - TRYING MULTIPLE APPROACHES');
  console.log('='.repeat(60));

  // Approach 1: Try to directly create an object (bypass action)
  console.log('\n=== Approach 1: Direct object creation ===\n');

  const testDivision = {
    primaryKey_: 'test-div-001',
    id: 'test-div-001',
    name: 'Test Division',
    head: 'Test Head',
    description: 'Test description',
    color: '#4A90D9',
    changePercent: 10.5,
    portfolioId: 'default',
    profit2024: 100,
    source: 'nexus-ppm',
    syncedAt: new Date().toISOString(),
  };

  try {
    const result = await request(
      'POST',
      `/api/v2/ontologies/${ontologyRid}/objects/AtlasDivision`,
      testDivision
    );
    if (result.status === 200 || result.status === 201) {
      console.log('Direct object creation WORKED!');
    }
  } catch (e: any) {
    console.log('Direct creation failed:', e.message);
  }

  // Approach 2: Try edit-atlas-division action instead
  console.log('\n=== Approach 2: Try edit-atlas-division action ===\n');

  const editResult = await request(
    'GET',
    `/api/v2/ontologies/${ontologyRid}/actionTypes/edit-atlas-division`
  );
  if (editResult.status === 200) {
    console.log('edit-atlas-division parameters:', Object.keys(editResult.data.parameters || {}));
  }

  // Approach 3: List objects to see if any were created
  console.log('\n=== Approach 3: Check if any objects exist ===\n');

  const listResult = await request(
    'GET',
    `/api/v2/ontologies/${ontologyRid}/objects/AtlasDivision?pageSize=10`
  );
  if (listResult.status === 200) {
    console.log('Objects found:', listResult.data.data?.length || 0);
    if (listResult.data.data?.length > 0) {
      console.log('First object:', JSON.stringify(listResult.data.data[0], null, 2));
    }
  }

  // Approach 4: Try creating with action but include primaryKey_ anyway
  console.log('\n=== Approach 4: Call action with primaryKey_ included ===\n');

  const actionParams = {
    primaryKey_: 'div-test-002',
    id: 'div-test-002',
    name: 'Test Division 2',
    head: 'Test Head 2',
    description: 'Test',
    color: '#FF0000',
    changePercent: 5.0,
    portfolioId: 'default',
    profit2024: 50,
    source: 'nexus-ppm',
    syncedAt: new Date().toISOString(),
  };

  const actionResult = await request(
    'POST',
    `/api/v2/ontologies/${ontologyRid}/actions/create-atlas-division/apply`,
    { parameters: actionParams }
  );

  if (actionResult.status === 200) {
    console.log('Action with primaryKey_ succeeded!');
  }

  // Final check
  console.log('\n=== Final: List all divisions ===\n');
  const finalList = await request(
    'GET',
    `/api/v2/ontologies/${ontologyRid}/objects/AtlasDivision?pageSize=10`
  );
  console.log('Total divisions:', finalList.data?.data?.length || 0);
}

main().catch(console.error);
