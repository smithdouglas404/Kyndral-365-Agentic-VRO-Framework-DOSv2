/**
 * COMPLIANCE VALIDATION SERVICE
 *
 * Validates projects against industry-specific regulatory frameworks
 * Provides compliance checks, violation detection, and recommendations
 */

import type { IStorage } from '../storage.js';

export interface ComplianceViolation {
  frameworkId: string;
  frameworkName: string;
  requirement: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface ComplianceResult {
  projectId: string;
  projectName: string;
  industry: string;
  compliant: boolean;
  overallScore: number; // 0-100
  frameworks: string[];
  violations: ComplianceViolation[];
  recommendations: string[];
  lastChecked: Date;
}

export interface RegulatoryFramework {
  id: string;
  industry: string;
  frameworkName: string;
  requirements: string[];
  severity: string;
  authority: string;
}

export class ComplianceValidationService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Validate project against applicable regulatory frameworks
   */
  async validateProject(projectId: string): Promise<ComplianceResult> {
    // Get project details
    const project = await this.storage.getProject(projectId);

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const industry = project.industry || 'general';

    // Get applicable regulatory frameworks for this industry
    const frameworks = await this.getApplicableFrameworks(industry);

    if (frameworks.length === 0) {
      // No frameworks applicable - project is compliant by default
      return {
        projectId,
        projectName: project.name,
        industry,
        compliant: true,
        overallScore: 100,
        frameworks: [],
        violations: [],
        recommendations: [],
        lastChecked: new Date(),
      };
    }

    // Check compliance for each framework
    const violations: ComplianceViolation[] = [];

    for (const framework of frameworks) {
      const frameworkViolations = await this.checkFrameworkCompliance(project, framework);
      violations.push(...frameworkViolations);
    }

    // Calculate overall score
    const overallScore = this.calculateComplianceScore(violations, frameworks.length);

    // Generate recommendations
    const recommendations = this.generateRecommendations(violations);

    // Determine overall compliance
    const compliant = violations.filter(v => v.severity === 'critical').length === 0 && overallScore >= 70;

    return {
      projectId,
      projectName: project.name,
      industry,
      compliant,
      overallScore,
      frameworks: frameworks.map(f => f.frameworkName),
      violations,
      recommendations,
      lastChecked: new Date(),
    };
  }

  /**
   * Get applicable regulatory frameworks for an industry
   */
  private async getApplicableFrameworks(industry: string): Promise<RegulatoryFramework[]> {
    try {
      const result = await this.storage.db.query(
        `SELECT id, industry, framework_name, requirements, severity, authority
         FROM regulatory_frameworks
         WHERE industry = $1 OR industry = 'general'
         ORDER BY severity DESC`,
        [industry]
      );

      return result.rows.map(row => ({
        id: row.id,
        industry: row.industry,
        frameworkName: row.framework_name,
        requirements: JSON.parse(row.requirements || '[]'),
        severity: row.severity,
        authority: row.authority,
      }));
    } catch (error) {
      console.error('[ComplianceValidation] Failed to get frameworks:', error);
      return [];
    }
  }

  /**
   * Check project compliance against a specific framework
   */
  private async checkFrameworkCompliance(
    project: any,
    framework: RegulatoryFramework
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Banking/Finance - Basel III, KYC/AML, Dodd-Frank
    if (framework.industry === 'banking' || framework.industry === 'finance') {
      // Check for financial controls
      if (!project.budgetSpent || !project.budget) {
        violations.push({
          frameworkId: framework.id,
          frameworkName: framework.frameworkName,
          requirement: 'Financial controls and audit trails',
          severity: 'high',
          description: 'Project missing budget tracking data required for financial oversight',
          recommendation: 'Implement budget tracking and ensure all expenditures are recorded with proper audit trails',
        });
      }

      // Check CPI for cost control (Basel III capital adequacy analogy)
      const cpi = parseFloat(project.cpiValue || '1.0');
      if (cpi < 0.75) {
        violations.push({
          frameworkId: framework.id,
          frameworkName: framework.frameworkName,
          requirement: 'Cost performance and budget adequacy',
          severity: 'critical',
          description: `Cost Performance Index (${cpi.toFixed(2)}) indicates significant budget overruns that may violate capital adequacy requirements`,
          recommendation: 'Immediate cost reduction measures required. Review spending, renegotiate contracts, and implement tighter budget controls',
        });
      }
    }

    // Health - HIPAA
    if (framework.industry === 'health') {
      // Check for data privacy controls
      if (!project.riskLevel || project.riskLevel === 'high') {
        violations.push({
          frameworkId: framework.id,
          frameworkName: framework.frameworkName,
          requirement: 'PHI protection and access controls',
          severity: 'critical',
          description: 'High-risk project handling Protected Health Information requires enhanced security controls',
          recommendation: 'Implement encryption, access controls, audit logging, and regular security assessments for all PHI',
        });
      }
    }

    // Insurance - State regulations
    if (framework.industry === 'insurance') {
      // Check for regulatory reporting
      if (!project.status || project.status === 'planning') {
        violations.push({
          frameworkId: framework.id,
          frameworkName: framework.frameworkName,
          requirement: 'Regulatory reporting and compliance documentation',
          severity: 'medium',
          description: 'Projects in planning phase must document compliance strategy before proceeding',
          recommendation: 'Create compliance documentation including regulatory impact assessment and reporting plan',
        });
      }
    }

    // Energy - NERC CIP
    if (framework.industry === 'energy') {
      // Check for cybersecurity controls
      if (project.name.toLowerCase().includes('grid') || project.name.toLowerCase().includes('power')) {
        violations.push({
          frameworkId: framework.id,
          frameworkName: framework.frameworkName,
          requirement: 'Critical infrastructure cybersecurity (NERC CIP)',
          severity: 'critical',
          description: 'Power grid projects must comply with NERC CIP cybersecurity standards',
          recommendation: 'Implement NERC CIP controls: personnel training, access controls, incident response, and regular audits',
        });
      }
    }

    // Cross-industry - SOX (Sarbanes-Oxley)
    if (framework.frameworkName.includes('SOX')) {
      // Check for project documentation and controls
      if (!project.description || project.description.length < 50) {
        violations.push({
          frameworkId: framework.id,
          frameworkName: framework.frameworkName,
          requirement: 'Internal controls and documentation (SOX 404)',
          severity: 'high',
          description: 'Insufficient project documentation for SOX compliance and audit trails',
          recommendation: 'Document all internal controls, decision-making processes, and maintain comprehensive audit trails',
        });
      }
    }

    // Cross-industry - GDPR
    if (framework.frameworkName.includes('GDPR')) {
      // Check for data privacy considerations
      if (project.stakeholders && project.stakeholders.length > 0) {
        violations.push({
          frameworkId: framework.id,
          frameworkName: framework.frameworkName,
          requirement: 'Data privacy and consent management (GDPR)',
          severity: 'high',
          description: 'Projects handling EU citizen data must comply with GDPR requirements',
          recommendation: 'Implement data protection by design, obtain explicit consent, enable data portability, and establish data breach procedures',
        });
      }
    }

    return violations;
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(violations: ComplianceViolation[], frameworkCount: number): number {
    if (frameworkCount === 0) {
      return 100;
    }

    // Weight violations by severity
    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3,
    };

    const totalDeductions = violations.reduce((sum, v) => sum + severityWeights[v.severity], 0);

    // Start at 100 and deduct points
    const score = Math.max(0, 100 - totalDeductions);

    return Math.round(score);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];

    // Group violations by severity
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');

    if (criticalViolations.length > 0) {
      recommendations.push(
        `URGENT: Address ${criticalViolations.length} critical compliance violations immediately to avoid regulatory penalties`
      );
    }

    if (highViolations.length > 0) {
      recommendations.push(
        `Remediate ${highViolations.length} high-priority compliance issues within 30 days`
      );
    }

    // Add specific framework recommendations
    const frameworkGroups = new Map<string, ComplianceViolation[]>();
    for (const violation of violations) {
      const existing = frameworkGroups.get(violation.frameworkName) || [];
      existing.push(violation);
      frameworkGroups.set(violation.frameworkName, existing);
    }

    for (const [frameworkName, frameworkViolations] of frameworkGroups.entries()) {
      recommendations.push(
        `${frameworkName}: Address ${frameworkViolations.length} compliance gaps (${frameworkViolations.filter(v => v.severity === 'critical').length} critical)`
      );
    }

    // General recommendations
    if (violations.length > 5) {
      recommendations.push('Consider engaging a compliance consultant to conduct comprehensive audit');
    }

    if (recommendations.length === 0) {
      recommendations.push('No compliance issues detected. Maintain current controls and documentation.');
    }

    return recommendations;
  }

  /**
   * Get compliance summary for all projects in a portfolio
   */
  async getPortfolioCompliance(portfolioId?: string): Promise<{
    totalProjects: number;
    compliantProjects: number;
    nonCompliantProjects: number;
    criticalViolations: number;
    industryBreakdown: Record<string, { compliant: number; total: number }>;
  }> {
    const projects = await this.storage.getProjects();
    const relevantProjects = portfolioId
      ? projects.filter(p => p.portfolioId === portfolioId)
      : projects;

    let compliantCount = 0;
    let criticalViolationsCount = 0;
    const industryBreakdown: Record<string, { compliant: number; total: number }> = {};

    for (const project of relevantProjects) {
      const result = await this.validateProject(project.id);

      if (result.compliant) {
        compliantCount++;
      }

      criticalViolationsCount += result.violations.filter(v => v.severity === 'critical').length;

      // Update industry breakdown
      const industry = result.industry;
      if (!industryBreakdown[industry]) {
        industryBreakdown[industry] = { compliant: 0, total: 0 };
      }
      industryBreakdown[industry].total++;
      if (result.compliant) {
        industryBreakdown[industry].compliant++;
      }
    }

    return {
      totalProjects: relevantProjects.length,
      compliantProjects: compliantCount,
      nonCompliantProjects: relevantProjects.length - compliantCount,
      criticalViolations: criticalViolationsCount,
      industryBreakdown,
    };
  }

  /**
   * Check if specific requirement is met
   */
  async checkRequirement(projectId: string, requirementText: string): Promise<boolean> {
    const result = await this.validateProject(projectId);

    // Check if any violation matches this requirement
    const hasViolation = result.violations.some(v =>
      v.requirement.toLowerCase().includes(requirementText.toLowerCase())
    );

    return !hasViolation;
  }
}

// Export singleton instance
export function createComplianceValidationService(storage: IStorage): ComplianceValidationService {
  return new ComplianceValidationService(storage);
}
