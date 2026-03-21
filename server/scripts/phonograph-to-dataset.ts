const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function main() {
  console.log('=== Attempting to export Phonograph to Dataset ===\n');
  
  // First, let's see if there's an export or sync endpoint
  const exportEndpoints = [
    host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes/AtlasProject/export',
    host + '/api/v2/ontologies/' + ontologyRid + '/objects/AtlasProject/export',
    host + '/phonograph2/api/export',
    host + '/api/v2/datasets/createFromOntology',
  ];
  
  for (const url of exportEndpoints) {
    console.log('POST ' + url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ objectType: 'AtlasProject' })
      });
      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 200));
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }
  
  // Try to create a dataset directly
  console.log('\n\n=== Trying to create a dataset with schema ===\n');
  
  // We know from earlier that POST /api/v2/datasets needs parentFolderRid
  // Let's try to find a folder first
  const folderResponse = await fetch(host + '/api/v2/filesystem/folders/root', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Root folder: ' + folderResponse.status);
  
  // Try compass to find project/folder
  const compassResponse = await fetch(host + '/compass/api/folders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      name: 'AtlasDivisions',
      parentRid: 'root'
    })
  });
  console.log('Compass create folder: ' + compassResponse.status);
  const compassText = await compassResponse.text();
  if (compassText && !compassText.includes('<!DOCTYPE')) {
    console.log('Response: ' + compassText.slice(0, 200));
  }
}
main().catch(console.error);

export {};
