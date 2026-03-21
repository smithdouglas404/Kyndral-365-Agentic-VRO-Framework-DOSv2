import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const palantir = getPalantirService() as any;
  if (!palantir) {
    console.log('Palantir not configured');
    return;
  }
  
  const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;
  console.log('Ontology RID:', ontologyRid);
  console.log('');
  
  // Try to get more details about the existing AtlasProject to understand its backing
  console.log('Fetching full metadata for AtlasProject...');
  const baseUrl = 'https://ssg.usw-17.palantirfoundry.com/api/v2';
  const token = process.env.PALANTIR_TOKEN;
  
  // Try the admin endpoint to see object type definition with datasource
  const adminUrls = [
    `${baseUrl}/ontologies/${ontologyRid}/objectTypes/AtlasProject/fullMetadata`,
    `${baseUrl}/admin/ontologies/${ontologyRid}/objectTypes/AtlasProject`,
    `https://ssg.usw-17.palantirfoundry.com/ontology-metadata/api/ontology/${ontologyRid}/objectType/AtlasProject`,
  ];
  
  for (const url of adminUrls) {
    console.log(`
Trying: ${url}`);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 1000));
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }
  }
}
main().catch(console.error);
