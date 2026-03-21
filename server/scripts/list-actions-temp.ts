import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const palantir = getPalantirService();
  if (!palantir) {
    console.log('Palantir not configured');
    return;
  }
  
  const actions = await palantir.listActions();
  console.log('Available actions:');
  for (const a of actions) {
    const params = a.parameters ? a.parameters.map((p: any) => p.name).join(', ') : 'none';
    console.log('  - ' + a.apiName + ': ' + a.displayName + ' [' + params + ']');
  }
  console.log('');
  console.log('Total: ' + actions.length + ' actions');
}
main().catch(console.error);

export {};
