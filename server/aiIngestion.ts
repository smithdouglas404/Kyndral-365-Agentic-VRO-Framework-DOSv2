import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

interface DataAnalysisResult {
  summary: string;
  pov: string;
  dataQualityScore: number;
  recordCount: number;
  fieldAnalysis: {
    field: string;
    type: string;
    coverage: number;
    issues: string[];
  }[];
  safeMapping: {
    sourceEntity: string;
    targetEntity: string;
    confidence: number;
    mappedFields: { source: string; target: string; transform?: string }[];
  }[];
  issues: string[];
  recommendations: string[];
}

interface ClarifyingQuestionGeneration {
  questions: {
    question: string;
    context: string;
    questionType: "text" | "choice" | "confirmation";
    options?: string[];
    impactArea: string;
    priority: "critical" | "high" | "normal" | "low";
  }[];
}

const SAFE_ONTOLOGY = `
SAFe 6.0 PPM-ART Ontology:
- Portfolio: Top-level container for strategic initiatives, contains value streams
- Strategic Theme: Business objective that guides portfolio decisions
- Value Stream: Flow of value delivery, contains ARTs
- ART (Agile Release Train): Team of teams working on a solution
- Team: Agile team within an ART
- Program Increment (PI): Planning/delivery cadence (8-12 weeks)
- Epic: Large initiative spanning multiple PIs
- Capability: Functionality delivered across multiple teams
- Feature: User-facing functionality delivered by a team
- Story: Small piece of value delivered in a sprint
- Task: Work breakdown of a story
- Sprint: 2-week iteration
- Milestone: Key date or deliverable
- Dependency: Cross-team/cross-ART relationship
- Risk: Identified threat to delivery
- OKR: Objective and Key Results
- KPI: Key Performance Indicator

Entity Relationships:
Portfolio → Value Streams → ARTs → Teams
Portfolio → Epics → Capabilities → Features → Stories → Tasks
ART → Program Increments → Sprints
`;

const CUSTOM_ONTOLOGY_MAPPING = `
If source data does NOT use SAFe terminology, map using these equivalencies:

Traditional PMO → SAFe:
- Program/Initiative → Portfolio or Epic
- Project → Feature or Capability
- Workstream → Value Stream
- Department/Division → ART or Team
- Phase/Gate → Program Increment or Sprint
- Deliverable → Story or Feature
- Action Item/Task → Task
- Risk/Issue → Risk
- Objective/Goal → Strategic Theme or OKR
- Metric/Measure → KPI

PRINCE2 → SAFe:
- Programme → Portfolio
- Project → Epic or Feature
- Stage → Program Increment
- Work Package → Story
- Product → Capability

Waterfall → SAFe:
- Phase → Program Increment
- Milestone → Milestone
- Task → Task
- Requirement → Story
- Module/Component → Feature

Kanban/Generic → SAFe:
- Board → Team
- Column/Status → Sprint Status
- Card/Item → Story or Task
- Epic/Initiative → Epic
- Theme → Strategic Theme

Custom/Unknown:
- If terminology is unfamiliar, analyze the data structure and semantics
- Map based on hierarchy level (top=Portfolio, bottom=Task)
- Map based on scope (large=Epic, small=Story)
- Ask clarifying questions when mapping confidence is below 70%
`;

export type OntologyType = 'safe' | 'pmo' | 'prince2' | 'waterfall' | 'kanban' | 'custom';

export interface OntologyDetectionResult {
  detectedOntology: OntologyType;
  confidence: number;
  indicators: string[];
  suggestedMappingStrategy: string;
}

export async function detectSourceOntology(
  sampleData: any[],
  sourceSystem: string
): Promise<OntologyDetectionResult> {
  const prompt = `Analyze this sample data and detect the project management methodology/ontology being used.

Source System: ${sourceSystem}
Sample Data: ${JSON.stringify(sampleData.slice(0, 5), null, 2)}

Detect if the data uses:
- "safe": SAFe terminology (Epic, Feature, Story, ART, PI, Value Stream)
- "pmo": Traditional PMO (Program, Project, Workstream, Phase, Deliverable)
- "prince2": PRINCE2 (Programme, Stage, Work Package, Product)
- "waterfall": Waterfall (Phase, Milestone, Requirement, Module)
- "kanban": Kanban/Agile generic (Board, Card, Sprint, Backlog)
- "custom": Unknown/Custom terminology

Respond in JSON:
{
  "detectedOntology": "safe|pmo|prince2|waterfall|kanban|custom",
  "confidence": 0-100,
  "indicators": ["list of field names or values that indicate this ontology"],
  "suggestedMappingStrategy": "description of how to map this data to SAFe"
}`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error("Failed to parse AI response");
  } catch (error: any) {
    console.error("Ontology detection error:", error);
    return {
      detectedOntology: 'custom',
      confidence: 0,
      indicators: [],
      suggestedMappingStrategy: 'Manual mapping required'
    };
  }
}

export async function analyzeDataForIngestion(
  sampleData: any[],
  sourceSystem: string,
  sourceEntityType: string
): Promise<DataAnalysisResult> {
  const prompt = `You are an expert in SAFe (Scaled Agile Framework) and enterprise PPM (Project Portfolio Management) data.

Analyze this sample data from ${sourceSystem} (entity type: ${sourceEntityType}) and provide:

1. **Summary**: A concise summary of what this data represents and its structure
2. **POV (Point of View)**: Your professional assessment of the data quality, completeness, and readiness for import
3. **Data Quality Score**: 0-100 score based on completeness, consistency, and accuracy
4. **Field Analysis**: For each field, identify type, coverage %, and any issues
5. **SAFe Mapping**: How each source entity/field maps to our SAFe ontology. IMPORTANT: If the source data does NOT use SAFe terminology, use these mapping equivalencies to translate:
${CUSTOM_ONTOLOGY_MAPPING}

Target SAFe Ontology:
${SAFE_ONTOLOGY}

6. **Issues**: Any data quality issues, missing required fields, inconsistencies
7. **Recommendations**: Specific actions to improve data before ingestion

Sample Data (${sampleData.length} records):
${JSON.stringify(sampleData.slice(0, 10), null, 2)}

Respond in JSON format:
{
  "summary": "string",
  "pov": "string",
  "dataQualityScore": number,
  "recordCount": ${sampleData.length},
  "fieldAnalysis": [{ "field": "string", "type": "string", "coverage": number, "issues": ["string"] }],
  "safeMapping": [{ "sourceEntity": "string", "targetEntity": "string", "confidence": number, "mappedFields": [{ "source": "string", "target": "string", "transform": "string optional" }] }],
  "issues": ["string"],
  "recommendations": ["string"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error("Failed to parse AI response");
  } catch (error: any) {
    console.error("AI analysis error:", error);
    return {
      summary: "Analysis failed - unable to process data",
      pov: "Manual review required",
      dataQualityScore: 0,
      recordCount: sampleData.length,
      fieldAnalysis: [],
      safeMapping: [],
      issues: [error.message || "Unknown error"],
      recommendations: ["Please review the data manually and ensure it is valid JSON"],
    };
  }
}

export async function generateClarifyingQuestions(
  sessionData: {
    sampleData: any[];
    sourceSystem: string;
    sourceEntityType: string;
    analysisResult: DataAnalysisResult;
    existingQuestions?: { question: string; answer?: string }[];
  }
): Promise<ClarifyingQuestionGeneration> {
  const existingQA = sessionData.existingQuestions?.length
    ? `Already Asked:\n${sessionData.existingQuestions.map(q => `Q: ${q.question}\nA: ${q.answer || "(not yet answered)"}`).join("\n\n")}`
    : "";

  const prompt = `You are an expert data integration specialist helping to import data into a SAFe PPM system.

Based on this data analysis, generate clarifying questions to ensure accurate data mapping and quality.

Source System: ${sessionData.sourceSystem}
Entity Type: ${sessionData.sourceEntityType}

Analysis Summary: ${sessionData.analysisResult.summary}

Current Issues:
${sessionData.analysisResult.issues.map(i => `- ${i}`).join("\n")}

SAFe Mapping Status:
${sessionData.analysisResult.safeMapping.map(m => `- ${m.sourceEntity} → ${m.targetEntity} (${m.confidence}% confidence)`).join("\n")}

${existingQA}

${SAFE_ONTOLOGY}

Generate 2-5 clarifying questions that would help:
1. Resolve mapping ambiguities
2. Clarify data quality issues
3. Confirm intended hierarchy placement in SAFe
4. Validate field transformations

Respond in JSON:
{
  "questions": [
    {
      "question": "Clear question text",
      "context": "Why this question is important",
      "questionType": "text|choice|confirmation",
      "options": ["only for choice type"],
      "impactArea": "mapping|quality|schema|hierarchy",
      "priority": "critical|high|normal|low"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error("Failed to parse AI response");
  } catch (error: any) {
    console.error("Question generation error:", error);
    return { questions: [] };
  }
}

export async function runQaReview(
  sessionData: {
    sampleData: any[];
    sourceSystem: string;
    analysisResult: DataAnalysisResult;
    answeredQuestions: { question: string; answer: string }[];
  },
  reviewType: "data_quality" | "mapping_accuracy" | "schema_validation" | "completeness"
): Promise<{
  status: "passed" | "failed" | "needs_attention";
  score: number;
  analysis: string;
  issues: string[];
  recommendations: string[];
}> {
  const reviewFocus = {
    data_quality: "Focus on data completeness, consistency, null values, format issues, and duplicates",
    mapping_accuracy: "Focus on how well source fields map to SAFe entities and if any mappings are incorrect or missing",
    schema_validation: "Focus on data types, required fields, and schema compliance with SAFe ontology",
    completeness: "Focus on whether all required data is present for successful ingestion",
  };

  const prompt = `You are a QA specialist reviewing data for import into a SAFe PPM system.

Review Type: ${reviewType}
Focus: ${reviewFocus[reviewType]}

Source System: ${sessionData.sourceSystem}
Records: ${sessionData.sampleData.length}

Previous Analysis:
- Quality Score: ${sessionData.analysisResult.dataQualityScore}%
- Issues: ${sessionData.analysisResult.issues.join(", ")}

User Clarifications:
${sessionData.answeredQuestions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n")}

Provide a QA review with:
1. Status: passed (>80 score), needs_attention (50-80), or failed (<50)
2. Score: 0-100
3. Analysis: Detailed review findings
4. Issues: Specific problems found
5. Recommendations: How to fix issues

Respond in JSON:
{
  "status": "passed|failed|needs_attention",
  "score": number,
  "analysis": "string",
  "issues": ["string"],
  "recommendations": ["string"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error("Failed to parse AI response");
  } catch (error: any) {
    console.error("QA review error:", error);
    return {
      status: "needs_attention",
      score: 50,
      analysis: "Unable to complete automated review - manual inspection required",
      issues: [error.message || "Unknown error during review"],
      recommendations: ["Please review the data manually"],
    };
  }
}

export async function suggestAdditionalTools(
  currentCapabilities: string[],
  userContext: string
): Promise<{
  tools: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    priority: "high" | "medium" | "low";
    implementationNotes: string;
  }[];
}> {
  const prompt = `You are an enterprise integration architect. Based on the user's current MCP (Model Context Protocol) integration capabilities, suggest additional tools that would enhance their PPM data management.

Current Tools: ${currentCapabilities.join(", ")}
User Context: ${userContext}

Suggest 5-10 additional tools that would be valuable. Consider:
1. Data governance tools
2. Analytics and reporting
3. Workflow automation
4. Quality monitoring
5. Integration utilities

Respond in JSON:
{
  "tools": [
    {
      "id": "kebab-case-id",
      "name": "Display Name",
      "description": "What the tool does",
      "icon": "lucide icon name (e.g., Gauge, Shield, Workflow)",
      "category": "data-governance|analytics|automation|quality|utility",
      "priority": "high|medium|low",
      "implementationNotes": "Brief notes on how to implement"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    throw new Error("Failed to parse AI response");
  } catch (error: any) {
    console.error("Tool suggestion error:", error);
    return { tools: [] };
  }
}
