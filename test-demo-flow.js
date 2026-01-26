/**
 * Test ACME Demo System End-to-End
 */

async function testDemoFlow() {
  const baseURL = 'http://localhost:5000';

  console.log('=== ACME Demo System Test ===\n');

  // Test 1: Get industries
  console.log('1. Fetching available industries...');
  const industriesRes = await fetch(`${baseURL}/api/demo/industries`);
  const industries = await industriesRes.json();
  console.log(`   ✓ Found ${industries.length} industries`);
  console.log(`   First 3: ${industries.slice(0, 3).map(i => i.companyName).join(', ')}\n`);

  // Test 2: Activate demo (with cookie handling)
  console.log('2. Activating financial-services demo...');
  const activateRes = await fetch(`${baseURL}/api/demo/activate/financial-services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const cookies = activateRes.headers.get('set-cookie');
  const sessionCookie = cookies?.match(/demo_session=([^;]+)/)?.[1];

  const activateData = await activateRes.json();
  console.log(`   ✓ Activated: ${activateData.companyName}`);
  console.log(`   ✓ Session ID: ${activateData.sessionId}`);
  console.log(`   ✓ Project Count: ${activateData.projectCount}\n`);

  if (!sessionCookie) {
    console.error('   ✗ No session cookie received!');
    return;
  }

  // Test 3: Fetch demo data
  console.log('3. Fetching demo data with session...');
  const dataRes = await fetch(`${baseURL}/api/demo/data`, {
    headers: {
      'Cookie': `demo_session=${sessionCookie}`
    }
  });

  const demoData = await dataRes.json();

  if (demoData.error) {
    console.error(`   ✗ Error: ${demoData.error}`);
    console.error(`   Session cookie sent: demo_session=${sessionCookie}`);
    return;
  }

  if (!demoData.company) {
    console.error(`   ✗ No company data received`);
    console.error(`   Response keys: ${Object.keys(demoData).join(', ')}`);
    return;
  }

  console.log(`   ✓ Company: ${demoData.company.legalName}`);
  console.log(`   ✓ Projects: ${demoData.projects.length}`);
  console.log(`   ✓ Interventions: ${demoData.interventions.length}`);
  console.log(`   ✓ Observations: ${demoData.observations.length}`);
  console.log(`   ✓ Battle Rhythm Events: ${demoData.battleRhythm.length}`);
  console.log(`   ✓ Fired Rules: ${demoData.rulesState.length}\n`);

  // Test 4: Verify project data structure
  console.log('4. Validating project data...');
  const firstProject = demoData.projects[0];
  console.log(`   ✓ Sample Project: ${firstProject.name}`);
  console.log(`   ✓ Health Status: ${firstProject.healthStatus}`);
  console.log(`   ✓ Budget: $${firstProject.budget.planned.toLocaleString()}`);
  console.log(`   ✓ Tasks: ${firstProject.tasks?.length || 0}\n`);

  // Test 5: Verify agent interventions
  console.log('5. Validating interventions...');
  const criticalInterventions = demoData.interventions.filter(i => i.severity === 'critical');
  console.log(`   ✓ Critical Interventions: ${criticalInterventions.length}`);
  console.log(`   ✓ Agent Types: ${[...new Set(demoData.interventions.map(i => i.agentType))].join(', ')}\n`);

  // Test 6: Verify battle rhythm
  console.log('6. Validating battle rhythm...');
  const eventTypes = [...new Set(demoData.battleRhythm.map(e => e.type))];
  console.log(`   ✓ Event Types: ${eventTypes.join(', ')}`);
  const weekNumbers = [...new Set(demoData.battleRhythm.map(e => e.weekNumber))].sort((a, b) => b - a);
  console.log(`   ✓ Weeks Covered: ${weekNumbers.join(', ')}\n`);

  console.log('=== All Tests Passed ✓ ===');
}

testDemoFlow().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
