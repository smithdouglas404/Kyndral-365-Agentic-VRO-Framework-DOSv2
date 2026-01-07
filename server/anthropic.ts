import Anthropic from '@anthropic-ai/sdk';

// Using claude-sonnet-4-20250514 as the latest model
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parsePolicyDocument(policyText: string): Promise<string> {
  const systemPrompt = `You are a Policy as Code expert. Your task is to analyze insurance/legal policy documents and convert them into structured YAML code that can be used by automated systems.

For each policy, extract and structure:
1. policy_metadata: provider, document_id, last_updated
2. eligibility_rules: age limits, minimum terms, requirements
3. coverage_logic: what triggers payouts, conditions, survival periods
4. exclusion_logic: what is NOT covered, waiting periods, penalties
5. benefits: additional benefits, special conditions

Output ONLY valid YAML code with no additional explanation. Include comments in the YAML to cite specific policy sections where rules come from.`;

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL_STR,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Please convert this policy document into Policy as Code (YAML format):\n\n${policyText}`
      }
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    let yaml = content.text;
    if (yaml.startsWith('```yaml')) {
      yaml = yaml.slice(7);
    }
    if (yaml.startsWith('```')) {
      yaml = yaml.slice(3);
    }
    if (yaml.endsWith('```')) {
      yaml = yaml.slice(0, -3);
    }
    return yaml.trim();
  }
  
  throw new Error('Unexpected response format from Claude');
}

export async function suggestPolicyImprovements(policyCode: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL_STR,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Analyze this Policy as Code and suggest improvements for clarity, completeness, and automation potential:\n\n${policyCode}`
      }
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  
  throw new Error('Unexpected response format from Claude');
}
