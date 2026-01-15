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

export interface ExtractedPolicyMetadata {
  policyName: string;
  provider: string;
  documentId: string;
}

export async function extractPolicyMetadata(policyText: string, filename?: string): Promise<ExtractedPolicyMetadata> {
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL_STR,
    max_tokens: 512,
    system: `You are an expert at extracting metadata from insurance and legal policy documents. 
Extract the following information and return ONLY a JSON object with these exact keys:
- policyName: A clear, descriptive name for this policy (e.g., "Life Insurance and Critical Illness Cover")
- provider: The company/organization that provides this policy (e.g., "NextEra Energy")
- documentId: Any document reference number, policy number, or version identifier found in the text. If none exists, generate a plausible one based on the provider and policy type (e.g., "NEE-POL-2024-001")

Return ONLY valid JSON, no additional text.`,
    messages: [
      {
        role: 'user',
        content: `Extract metadata from this policy document${filename ? ` (filename: ${filename})` : ''}:\n\n${policyText.slice(0, 3000)}`
      }
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    try {
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      const parsed = JSON.parse(jsonText.trim());
      return {
        policyName: parsed.policyName || 'Untitled Policy',
        provider: parsed.provider || '',
        documentId: parsed.documentId || '',
      };
    } catch (e) {
      return {
        policyName: filename?.replace('.pdf', '').replace(/_/g, ' ') || 'Untitled Policy',
        provider: '',
        documentId: '',
      };
    }
  }
  
  return {
    policyName: 'Untitled Policy',
    provider: '',
    documentId: '',
  };
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

export async function generateLifecycleInsight(
  metrics: { estimationAccuracy: { value: number; target: number }; costVariance: { value: number; target: number }; dependencyHealth: { value: number; target: number }; statusConfidence: { value: number; target: number }; greenProjects: number; amberProjects: number; redProjects: number; totalProjects: number },
  funnel: { stage: string; label: string; count: number }[],
  recentChanges: { entityName: string; field: string; oldValue: number; newValue: number; trend: string }[]
): Promise<string> {
  const systemPrompt = `You are the VRO (Value Realization Office) AI agent for NextEra Energy's Enterprise Transformation. Provide a concise, actionable insight about the project portfolio health based on the metrics provided. Be specific and executive-focused. Keep the response to 2-3 sentences maximum.`;

  const dataContext = `
Portfolio Metrics:
- Estimation Accuracy: ${metrics.estimationAccuracy.value}% (target: ${metrics.estimationAccuracy.target}%)
- Cost Variance: ${metrics.costVariance.value}% (target: <${metrics.costVariance.target}%)
- Dependency Health: ${metrics.dependencyHealth.value}% (target: ${metrics.dependencyHealth.target}%)
- Status Confidence: ${metrics.statusConfidence.value}% (target: ${metrics.statusConfidence.target}%)

Project Distribution: ${metrics.greenProjects} green, ${metrics.amberProjects} amber, ${metrics.redProjects} red (${metrics.totalProjects} total)

Innovation Funnel: ${funnel.map(f => `${f.label}: ${f.count}`).join(', ')}

Recent Changes: ${recentChanges.slice(0, 5).map(c => `${c.entityName} ${c.field} ${c.trend === 'up' ? 'improved' : 'declined'}`).join('; ') || 'None recorded'}
`;

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL_STR,
    max_tokens: 256,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a brief executive insight for this portfolio state:\n${dataContext}`
      }
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  
  throw new Error('Unexpected response format from Claude');
}
