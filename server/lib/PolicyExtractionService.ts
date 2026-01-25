/**
 * POLICY EXTRACTION SERVICE
 *
 * Converts compliance documents to executable Policy-as-Code using LLM extraction.
 *
 * Flow:
 * 1. Document Upload → Tagged as "policy_compliance"
 * 2. LLM Extraction → Extract requirements, rules, validations
 * 3. Generate Code → Create custom attributes + collaboration rules
 * 4. HITL Review → Human approval with scheduled activation
 * 5. Activation → Rules become live, stored in Mem0/Letta
 *
 * This replaces expensive runtime RAG with one-time extraction + instant rule evaluation.
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db.js';
import {
  policyAsCode,
  policyExtractionAudit,
  customAttributes,
  agentCollaborationRules,
  documents,
  type InsertPolicyAsCode,
  type InsertPolicyExtractionAudit,
  type InsertCustomAttribute,
  type InsertAgentCollaborationRule
} from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface ExtractedPolicy {
  policyName: string;
  policyDescription: string;
  sections: PolicySection[];
  customAttributes: ExtractedAttribute[];
  rules: ExtractedRule[];
  metadata: {
    confidence: number;
    tokensUsed: number;
    model: string;
  };
}

interface PolicySection {
  sectionNumber: string;
  title: string;
  content: string;
  requirements: string[];
}

interface ExtractedAttribute {
  name: string;
  label: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  ownerAgent: string;
  visibleTo: string[];
  validationRules?: any;
  unit?: string;
  policySection: string;
}

interface ExtractedRule {
  name: string;
  description: string;
  sourceAgent: string;
  priority: number;
  conditions: any[];
  actions: any[];
  mandatory: boolean;
  complianceType: string;
  policySection: string;
}

// ============================================================================
// LLM CLIENTS (Lazy-loaded to avoid import-time errors)
// ============================================================================

let openai: OpenAI | null = null;
let gemini: GoogleGenerativeAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for policy extraction');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

function getGemini(): GoogleGenerativeAI | null {
  if (!gemini && process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return gemini;
}

// ============================================================================
// EXTRACTION PROMPT
// ============================================================================

const EXTRACTION_PROMPT = `You are a policy compliance expert. Extract requirements from this policy document and convert them to executable code.

DOCUMENT:
{documentContent}

DOCUMENT TYPE: {documentType}
COMPLIANCE FRAMEWORK: {complianceFramework}

Extract the following:

1. CUSTOM ATTRIBUTES - Measurable attributes that agents must track
   For each attribute, provide:
   - name: camelCase identifier
   - label: Human-readable name
   - description: What this measures
   - dataType: string, number, boolean, date
   - ownerAgent: Which agent owns this (finops, tmo, risk, vro, pmo, ocm, governance)
   - visibleTo: Array of agents that can see this
   - unit: If numeric (e.g., "%", "$", "days")
   - validationRules: min/max, required, etc.
   - policySection: Which section this comes from

2. COLLABORATION RULES - Executable rules for compliance
   For each rule, provide:
   - name: Clear rule name
   - description: What this rule enforces
   - sourceAgent: Which agent checks this rule
   - priority: 1-10 (higher = more important)
   - conditions: JSON-rules-engine conditions
   - actions: What happens when triggered (notify, escalate, block, etc.)
   - mandatory: true if this is required compliance
   - complianceType: Framework name (e.g., "ISO27001", "SOX")
   - policySection: Which section this comes from

3. VALIDATION RULES - Hard constraints that cannot be violated
   - Field validation rules
   - Workflow gates
   - Approval requirements

Respond in JSON format:
{
  "policyName": "string",
  "policyDescription": "string",
  "complianceFramework": "string",
  "customAttributes": [...],
  "rules": [...],
  "confidenceScore": 0.0-1.0
}

Be specific and actionable. Each rule should be immediately executable.`;

// ============================================================================
// MAIN EXTRACTION SERVICE
// ============================================================================

export class PolicyExtractionService {
  /**
   * Extract policy from a document and create Policy-as-Code
   */
  async extractPolicy(
    documentId: string,
    options: {
      model?: 'gpt-4' | 'gpt-4-turbo' | 'gemini-pro' | 'gemini-ultra';
      complianceFramework?: string;
      createdBy: string;
    }
  ): Promise<string> {
    const startTime = Date.now();
    let policyId: string | undefined;

    try {
      // 1. Get document
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (!doc) {
        throw new Error(`Document ${documentId} not found`);
      }

      if (doc.documentType !== 'policy_compliance') {
        throw new Error(`Document must be tagged as 'policy_compliance', got '${doc.documentType}'`);
      }

      // Log extraction start
      await this.logAudit({
        policyId: 'pending',
        documentId,
        extractionPhase: 'section_analysis',
        status: 'started',
        llmModel: options.model || 'gpt-4',
      });

      // 2. Read document content
      const documentContent = await this.readDocument(doc.filePath);

      // 3. Extract with LLM
      const extracted = await this.extractWithLLM(documentContent, {
        model: options.model || 'gpt-4',
        documentType: doc.documentType,
        complianceFramework: options.complianceFramework || 'Unknown',
      });

      // 4. Create Policy-as-Code record
      const [policy] = await db
        .insert(policyAsCode)
        .values({
          sourceDocumentId: documentId,
          documentName: doc.name,
          documentType: doc.documentType,
          policyName: extracted.policyName,
          policyDescription: extracted.policyDescription,
          sectionsCovered: JSON.stringify(extracted.sections.map(s => s.sectionNumber)),
          policySummary: extracted.policyDescription,
          fullPolicyCode: JSON.stringify({
            customAttributes: extracted.customAttributes,
            rules: extracted.rules,
            sections: extracted.sections,
          }),
          customAttributesCreated: extracted.customAttributes.length,
          rulesGenerated: extracted.rules.length,
          status: 'pending_review',
          llmModelUsed: extracted.metadata.model,
          extractionConfidence: extracted.metadata.confidence,
          extractionTokensUsed: extracted.metadata.tokensUsed,
          extractionCost: this.calculateCost(extracted.metadata.tokensUsed, extracted.metadata.model),
          complianceFramework: options.complianceFramework || 'Unknown',
          enforcementLevel: 'strict',
          mandatory: true,
          version: 1,
          createdBy: options.createdBy,
        })
        .returning();

      policyId = policy.id;

      // 5. Log successful extraction
      await this.logAudit({
        policyId: policy.id,
        documentId,
        extractionPhase: 'rule_generation',
        status: 'success',
        extractedContent: JSON.stringify(extracted),
        confidenceScores: JSON.stringify({
          overall: extracted.metadata.confidence,
          attributes: extracted.customAttributes.length,
          rules: extracted.rules.length,
        }),
        llmModel: extracted.metadata.model,
        tokensUsed: extracted.metadata.tokensUsed,
        processingTimeMs: Date.now() - startTime,
      });

      console.log(`[PolicyExtraction] Created policy ${policy.id} from document ${documentId}`);
      console.log(`  - ${extracted.customAttributes.length} custom attributes`);
      console.log(`  - ${extracted.rules.length} collaboration rules`);
      console.log(`  - Confidence: ${(extracted.metadata.confidence * 100).toFixed(1)}%`);
      console.log(`  - Cost: $${this.calculateCost(extracted.metadata.tokensUsed, extracted.metadata.model).toFixed(4)}`);

      return policy.id;
    } catch (error: any) {
      // Log failure
      if (policyId) {
        await this.logAudit({
          policyId,
          documentId,
          extractionPhase: 'validation',
          status: 'failed',
          errors: JSON.stringify([error.message]),
          processingTimeMs: Date.now() - startTime,
        });
      }

      throw error;
    }
  }

  /**
   * Approve policy and activate rules (HITL step)
   */
  async approvePolicy(
    policyId: string,
    options: {
      approvedBy: string;
      effectiveDate?: Date;
      activateImmediately?: boolean;
      reviewNotes?: string;
    }
  ): Promise<void> {
    try {
      // Get policy
      const [policy] = await db
        .select()
        .from(policyAsCode)
        .where(eq(policyAsCode.id, policyId))
        .limit(1);

      if (!policy) {
        throw new Error(`Policy ${policyId} not found`);
      }

      // Parse policy code
      const policyCode = JSON.parse(policy.fullPolicyCode);

      // Create custom attributes
      const createdAttributes: string[] = [];
      for (const attr of policyCode.customAttributes) {
        const [created] = await db
          .insert(customAttributes)
          .values({
            name: attr.name,
            label: attr.label,
            description: attr.description,
            dataType: attr.dataType,
            ownerAgent: attr.ownerAgent,
            visibleTo: JSON.stringify(attr.visibleTo),
            validationRules: attr.validationRules ? JSON.stringify(attr.validationRules) : null,
            unit: attr.unit || null,
            mcpToolName: `get_${attr.name}`,
            sourcePolicyId: policyId,
            autoGenerated: true,
            policySection: attr.policySection,
            createdBy: options.approvedBy,
          })
          .returning();

        createdAttributes.push(created.id);
      }

      // Create collaboration rules
      const createdRules: string[] = [];
      for (const rule of policyCode.rules) {
        const [created] = await db
          .insert(agentCollaborationRules)
          .values({
            name: rule.name,
            description: rule.description,
            enabled: true,
            priority: rule.priority,
            sourceAgent: rule.sourceAgent,
            conditions: JSON.stringify(rule.conditions),
            actions: JSON.stringify(rule.actions),
            sourcePolicyId: policyId,
            autoGenerated: true,
            policySection: rule.policySection,
            mandatory: rule.mandatory,
            complianceType: rule.complianceType,
            createdBy: options.approvedBy,
          })
          .returning();

        createdRules.push(created.id);
      }

      // Update policy status
      const effectiveDate = options.effectiveDate || new Date();
      const activatedAt = options.activateImmediately ? new Date() : null;

      await db
        .update(policyAsCode)
        .set({
          status: options.activateImmediately ? 'active' : 'scheduled',
          approvedBy: options.approvedBy,
          approvedAt: new Date(),
          reviewNotes: options.reviewNotes || null,
          effectiveDate,
          activatedAt,
          updatedAt: new Date(),
        })
        .where(eq(policyAsCode.id, policyId));

      console.log(`[PolicyApproval] Policy ${policyId} approved by ${options.approvedBy}`);
      console.log(`  - Created ${createdAttributes.length} custom attributes`);
      console.log(`  - Created ${createdRules.length} collaboration rules`);
      console.log(`  - Status: ${options.activateImmediately ? 'Active' : 'Scheduled for ' + effectiveDate.toISOString()}`);
    } catch (error: any) {
      console.error(`[PolicyApproval] Error approving policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Reject policy
   */
  async rejectPolicy(policyId: string, reviewedBy: string, reviewNotes: string): Promise<void> {
    await db
      .update(policyAsCode)
      .set({
        status: 'rejected',
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(policyAsCode.id, policyId));

    console.log(`[PolicyRejection] Policy ${policyId} rejected by ${reviewedBy}`);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async extractWithLLM(
    content: string,
    options: { model: string; documentType: string; complianceFramework: string }
  ): Promise<ExtractedPolicy> {
    const prompt = EXTRACTION_PROMPT
      .replace('{documentContent}', content)
      .replace('{documentType}', options.documentType)
      .replace('{complianceFramework}', options.complianceFramework);

    if (options.model.startsWith('gpt')) {
      return await this.extractWithOpenAI(prompt, options.model);
    } else if (options.model.startsWith('gemini')) {
      return await this.extractWithGemini(prompt, options.model);
    } else {
      throw new Error(`Unsupported model: ${options.model}`);
    }
  }

  private async extractWithOpenAI(prompt: string, model: string): Promise<ExtractedPolicy> {
    const openaiClient = getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: model === 'gpt-4-turbo' ? 'gpt-4-turbo-preview' : 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a policy compliance expert that extracts requirements and converts them to executable rules.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      policyName: result.policyName,
      policyDescription: result.policyDescription,
      sections: result.sections || [],
      customAttributes: result.customAttributes || [],
      rules: result.rules || [],
      metadata: {
        confidence: result.confidenceScore || 0.85,
        tokensUsed,
        model,
      },
    };
  }

  private async extractWithGemini(prompt: string, model: string): Promise<ExtractedPolicy> {
    const geminiClient = getGemini();
    if (!geminiClient) {
      throw new Error('Gemini API key not configured');
    }

    const geminiModel = geminiClient.getGenerativeModel({
      model: model === 'gemini-ultra' ? 'gemini-ultra' : 'gemini-pro',
    });

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const parsed = JSON.parse(text);

    return {
      policyName: parsed.policyName,
      policyDescription: parsed.policyDescription,
      sections: parsed.sections || [],
      customAttributes: parsed.customAttributes || [],
      rules: parsed.rules || [],
      metadata: {
        confidence: parsed.confidenceScore || 0.85,
        tokensUsed: text.length, // Rough estimate
        model,
      },
    };
  }

  private async readDocument(filePath: string): Promise<string> {
    // TODO: Add support for PDF, Word, Excel parsing
    // For now, assume text files
    return fs.readFileSync(filePath, 'utf-8');
  }

  private calculateCost(tokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
      'gemini-pro': { input: 0.00025 / 1000, output: 0.0005 / 1000 },
      'gemini-ultra': { input: 0.00125 / 1000, output: 0.0025 / 1000 },
    };

    const rate = pricing[model] || pricing['gpt-4'];
    // Assume 50/50 input/output split
    return (tokens / 2) * rate.input + (tokens / 2) * rate.output;
  }

  private async logAudit(audit: Partial<InsertPolicyExtractionAudit>): Promise<void> {
    try {
      await db.insert(policyExtractionAudit).values(audit as any);
    } catch (error) {
      console.error('[PolicyExtraction] Failed to log audit:', error);
    }
  }
}

// Singleton instance
export const policyExtractionService = new PolicyExtractionService();
