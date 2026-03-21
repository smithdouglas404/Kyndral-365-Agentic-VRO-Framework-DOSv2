const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Creating AtlasDivision the proper way ===\n');
  
  // Step 1: Find a folder/project to create the dataset in
  console.log('Step 1: Finding a folder for the dataset...\n');
  
  // Try to get the user's home folder or project list
  let parentFolderRid = null;
  
  // Try filesystem API
  const fsEndpoints = [
    host + '/api/v2/filesystem/projects',
    host + '/api/v2/filesystem/folders',
    host + '/api/v1/filesystem/folders',
  ];
  
  for (const url of fsEndpoints) {
    console.log('GET ' + url);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Data: ' + JSON.stringify(data).slice(0, 300));
        if (data.data && data.data[0]) {
          parentFolderRid = data.data[0].rid;
          console.log('  Found folder RID: ' + parentFolderRid);
          break;
        }
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
  
  // If no folder found, try to create one or use compass
  if (!parentFolderRid) {
    console.log('\nTrying to find root/default folder...');
    
    // Try getting info about the ontology to find its backing project
    const ontologyUrl = host + '/api/v2/ontologies/' + ontologyRid;
    const ontResponse = await fetch(ontologyUrl + '/fullMetadata', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (ontResponse.ok) {
      const ontData = await ontResponse.json();
      console.log('Ontology metadata keys: ' + Object.keys(ontData).join(', '));
    }
  }
  
  // Step 2: If we have a folder, create the dataset
  if (parentFolderRid) {
    console.log('\n\nStep 2: Creating dataset...\n');
    
    const datasetPayload = {
      name: 'atlas_divisions',
      parentFolderRid: parentFolderRid
    };
    
    console.log('POST /api/v2/datasets');
    console.log('Payload: ' + JSON.stringify(datasetPayload));
    
    const dsResponse = await fetch(host + '/api/v2/datasets', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datasetPayload)
    });
    console.log('Status: ' + dsResponse.status);
    const dsText = await dsResponse.text();
    console.log('Response: ' + dsText);
    
    if (dsResponse.ok) {
      const dsData = JSON.parse(dsText);
      const datasetRid = dsData.rid;
      
      // Step 3: Create the object type with the dataset
      console.log('\n\nStep 3: Creating object type with dataSource...\n');
      
      const objectTypePayload = {
        apiName: 'AtlasDivision',
        displayName: '[Atlas] Division',
        description: 'Business Unit / Division / Segment',
        primaryKey: 'divisionId',
        dataSource: {
          type: 'dataset',
          datasetRid: datasetRid,
          columnMapping: {
            divisionId: 'division_id',
            name: 'name',
            head: 'head',
            description: 'description'
          }
        },
        properties: {
          divisionId: { type: 'string' },
          name: { type: 'string' },
          head: { type: 'string' },
          description: { type: 'string' }
        }
      };
      
      console.log('POST /api/v2/ontologies/' + ontologyRid + '/objectTypes');
      console.log('Payload: ' + JSON.stringify(objectTypePayload, null, 2));
      
      const otResponse = await fetch(host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(objectTypePayload)
      });
      console.log('Status: ' + otResponse.status);
      const otText = await otResponse.text();
      console.log('Response: ' + otText);
    }
  } else {
    console.log('\nCould not find a parent folder. Need to locate a folder RID first.');
  }
}
main().catch(console.error);

export {};
