/**
 * Test creating a single division with all required params
 */

const token = process.env.PALANTIR_TOKEN!;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

async function main() {
  const params = {
    id: 'test-div-final',
    name: 'Test Division Final',
    head: 'Test Head',
    description: 'Final test',
    color: '#4A90D9',
    changePercent: 10.0,
    portfolioId: 'default',
    profit2023: 100.0,
    profit2024: 150.0,
    source: 'nexus-ppm',
    syncedAt: new Date().toISOString(),
  };

  console.log('Calling create-atlas-division with:', JSON.stringify(params, null, 2));

  const response = await fetch(
    `${host}/api/v2/ontologies/${ontologyRid}/actions/create-atlas-division/apply`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parameters: params }),
    }
  );

  const text = await response.text();
  console.log(`\nStatus: ${response.status}`);
  console.log('Response:', text);

  // Check if it was created
  console.log('\n--- Checking objects ---');
  const listResp = await fetch(
    `${host}/api/v2/ontologies/${ontologyRid}/objects/AtlasDivision?pageSize=10`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const listData = await listResp.json();
  console.log('Objects found:', listData.data?.length || 0);
  if (listData.data?.length > 0) {
    console.log('Objects:', JSON.stringify(listData.data, null, 2));
  }
}

main().catch(console.error);
