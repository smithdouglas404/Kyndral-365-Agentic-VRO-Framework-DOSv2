/**
 * LIST LANGFLOW MCP TOOLS
 *
 * Connects to Langflow MCP endpoint and lists available flows/tools
 */

import { LangflowMCPClient } from '../lib/LangflowMCPClient.js';

async function main() {
  console.log('🔌 Connecting to Langflow MCP...\n');

  const mcpUrl = process.env.LANGFLOW_API_URL!.replace('/api/v1', '/api/v1/mcp/sse');

  console.log('MCP URL:', mcpUrl);
  console.log('Org ID:', process.env.LANGFLOW_ORG_ID);

  const client = new LangflowMCPClient({
    mcpUrl,
    token: process.env.LANGFLOW_API_KEY!,
    orgId: process.env.LANGFLOW_ORG_ID!
  });

  const connected = await client.connect();

  if (!connected) {
    console.error('❌ Failed to connect to Langflow MCP');
    process.exit(1);
  }

  console.log('✅ Connected to Langflow MCP\n');

  const tools = await client.listTools();

  console.log(`📊 Available Flows/Tools: ${tools.length}\n`);

  if (tools.length === 0) {
    console.log('No flows found. You need to create flows in Langflow UI first.');
    console.log('Once created, they will automatically be exposed as MCP tools here.');
  } else {
    tools.forEach((tool, idx) => {
      console.log(`${idx + 1}. ${tool.name}`);
      if (tool.description) {
        console.log(`   ${tool.description}`);
      }
    });
  }

  console.log('\n💡 Tip: Import the 4 scenario JSON files from /langflow-flows/ folder');
  console.log('   They will then appear in this list as MCP tools.');
}

main().catch(console.error);
