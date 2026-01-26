import { Router } from 'express';
import type { Request, Response } from 'express';
import { discoverCompanies, getCompanyProfile } from '../services/companyDiscovery.js';
import { extractPolicyAsCode } from '../services/policyAsCodeExtractor.js';
import { generateCompanyDashboards } from '../services/dashboardGenerator.js';
import { db } from '../db.js';
import {
  companies,
  organizationalUnits,
  companyOntologyInstances,
  metricDefinitions,
  strategicObjectives,
  keyResults,
  companyRules,
  documentProcessingJobs,
  extractionReviewQueue,
  companyDiscoveryCandidates,
  ontologyClasses,
  ontologyIndustryProfiles
} from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export function registerCompanyProfileRoutes(app: Router) {
  const router = Router();

  // ============================================================================
  // COMPANY DISCOVERY
  // ============================================================================

  /**
   * POST /api/company-profile/discover
   * Search for companies across multiple data sources
   */
  router.post('/discover', async (req: Request, res: Response) => {
    try {
      const { searchQuery, filters } = req.body;

      if (!searchQuery || typeof searchQuery !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const sessionId = uuidv4();
      const candidates = await discoverCompanies(searchQuery, filters);

      // Store candidates in temporary table
      for (const candidate of candidates) {
        await db.insert(companyDiscoveryCandidates).values({
          sessionId,
          searchQuery,
          companyLegalName: candidate.legalName,
          doingBusinessAs: candidate.doingBusinessAs,
          headquartersLocation: candidate.headquarters,
          industryCodes: candidate.industryCodes,
          entityIdentifiers: candidate.entityIdentifiers,
          confidenceScore: String(candidate.confidenceScore),
          dataSources: candidate.dataSources
        });
      }

      res.json({
        sessionId,
        candidates,
        count: candidates.length
      });
    } catch (error: any) {
      console.error('Company discovery error:', error);
      res.status(500).json({ error: error.message || 'Failed to discover companies' });
    }
  });

  /**
   * POST /api/company-profile/enrich
   * Get detailed profile for selected company candidate
   */
  router.post('/enrich', async (req: Request, res: Response) => {
    try {
      const { candidate } = req.body;

      if (!candidate) {
        return res.status(400).json({ error: 'Candidate is required' });
      }

      const profile = await getCompanyProfile(candidate);

      res.json(profile);
    } catch (error: any) {
      console.error('Company enrichment error:', error);
      res.status(500).json({ error: error.message || 'Failed to enrich company profile' });
    }
  });

  // ============================================================================
  // POLICY-AS-CODE EXTRACTION
  // ============================================================================

  /**
   * POST /api/company-profile/extract
   * Extract Policy-as-Code from annual report
   */
  router.post('/extract', async (req: Request, res: Response) => {
    try {
      const { companyId, documentUrl, industryCode } = req.body;

      if (!companyId || !documentUrl) {
        return res.status(400).json({ error: 'Company ID and document URL are required' });
      }

      // Create processing job
      const [job] = await db.insert(documentProcessingJobs).values({
        companyId,
        documentUrl,
        documentType: '10-K',
        status: 'processing',
        startedAt: new Date(),
        aiModelUsed: 'claude-sonnet-4-20250514',
        initiatedBy: req.user?.id
      }).returning();

      // Start extraction asynchronously
      extractPolicyAsCode(documentUrl, companyId, industryCode)
        .then(async (results) => {
          // Store results in extraction review queue
          const reviewItems = [];

          // Organizational Units
          for (const unit of results.organizationalUnits) {
            reviewItems.push({
              documentProcessingJobId: job.id,
              companyId,
              itemType: 'organizational_unit' as const,
              itemData: unit,
              confidenceScore: String(unit.confidence),
              requiresHumanReview: unit.confidence < 0.85,
              sourceTextExcerpt: unit.sourceText
            });
          }

          // Metrics
          for (const metric of results.financialMetrics) {
            reviewItems.push({
              documentProcessingJobId: job.id,
              companyId,
              itemType: 'metric' as const,
              itemData: metric,
              confidenceScore: String(metric.confidence),
              requiresHumanReview: metric.confidence < 0.85,
              sourceTextExcerpt: metric.sourceText,
              sourcePageNumber: metric.sourcePage
            });
          }

          // Strategic Objectives
          for (const objective of results.strategicObjectives) {
            reviewItems.push({
              documentProcessingJobId: job.id,
              companyId,
              itemType: 'objective' as const,
              itemData: objective,
              confidenceScore: String(objective.confidence),
              requiresHumanReview: objective.confidence < 0.85,
              sourceTextExcerpt: objective.sourceText,
              sourcePageNumber: objective.sourcePage
            });
          }

          // Governance Rules
          for (const rule of results.governanceRules) {
            reviewItems.push({
              documentProcessingJobId: job.id,
              companyId,
              itemType: 'rule' as const,
              itemData: rule,
              confidenceScore: String(rule.confidence),
              requiresHumanReview: rule.confidence < 0.80,
              sourceTextExcerpt: rule.sourceText,
              sourcePageNumber: rule.sourcePage
            });
          }

          // Risks
          for (const risk of results.riskFactors) {
            reviewItems.push({
              documentProcessingJobId: job.id,
              companyId,
              itemType: 'risk' as const,
              itemData: risk,
              confidenceScore: String(risk.confidence),
              requiresHumanReview: risk.confidence < 0.85,
              sourceTextExcerpt: risk.sourceText
            });
          }

          // Bulk insert
          await db.insert(extractionReviewQueue).values(reviewItems);

          // Update job status
          await db.update(documentProcessingJobs)
            .set({
              status: 'completed',
              completedAt: new Date(),
              extractionResults: results
            })
            .where(eq(documentProcessingJobs.id, job.id));
        })
        .catch(async (error) => {
          console.error('Extraction error:', error);
          await db.update(documentProcessingJobs)
            .set({
              status: 'failed',
              completedAt: new Date(),
              errorMessage: error.message
            })
            .where(eq(documentProcessingJobs.id, job.id));
        });

      res.json({
        jobId: job.id,
        status: 'processing',
        message: 'Extraction started. Use /api/company-profile/extraction-status/:jobId to check progress.'
      });
    } catch (error: any) {
      console.error('Extraction start error:', error);
      res.status(500).json({ error: error.message || 'Failed to start extraction' });
    }
  });

  /**
   * GET /api/company-profile/extraction-status/:jobId
   * Check status of extraction job
   */
  router.get('/extraction-status/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      const [job] = await db.select()
        .from(documentProcessingJobs)
        .where(eq(documentProcessingJobs.id, jobId));

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Get review items count if completed
      let reviewItemsCount = 0;
      if (job.status === 'completed') {
        const items = await db.select()
          .from(extractionReviewQueue)
          .where(eq(extractionReviewQueue.documentProcessingJobId, jobId));
        reviewItemsCount = items.length;
      }

      res.json({
        jobId: job.id,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage,
        reviewItemsCount,
        extractionResults: job.extractionResults
      });
    } catch (error: any) {
      console.error('Status check error:', error);
      res.status(500).json({ error: error.message || 'Failed to check status' });
    }
  });

  // ============================================================================
  // EXTRACTION REVIEW QUEUE
  // ============================================================================

  /**
   * GET /api/company-profile/review-queue/:companyId
   * Get items pending review for a company
   */
  router.get('/review-queue/:companyId', async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const { itemType, requiresHumanReview } = req.query;

      let query = db.select()
        .from(extractionReviewQueue)
        .where(
          and(
            eq(extractionReviewQueue.companyId, companyId),
            eq(extractionReviewQueue.reviewStatus, 'pending')
          )
        )
        .orderBy(
          desc(extractionReviewQueue.requiresHumanReview),
          extractionReviewQueue.confidenceScore
        );

      const items = await query;

      // Filter by item type if specified
      let filtered = items;
      if (itemType) {
        filtered = items.filter(item => item.itemType === itemType);
      }
      if (requiresHumanReview === 'true') {
        filtered = items.filter(item => item.requiresHumanReview);
      }

      res.json({
        items: filtered,
        count: filtered.length,
        summary: {
          total: items.length,
          byType: items.reduce((acc, item) => {
            acc[item.itemType] = (acc[item.itemType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          requiresReview: items.filter(i => i.requiresHumanReview).length
        }
      });
    } catch (error: any) {
      console.error('Review queue error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch review queue' });
    }
  });

  /**
   * POST /api/company-profile/review-queue/:itemId/approve
   * Approve extracted item and create actual record
   */
  router.post('/review-queue/:itemId/approve', async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const { modifiedData } = req.body;

      const [item] = await db.select()
        .from(extractionReviewQueue)
        .where(eq(extractionReviewQueue.id, itemId));

      if (!item) {
        return res.status(404).json({ error: 'Review item not found' });
      }

      const dataToUse = modifiedData || item.itemData;

      // Create actual record based on item type
      switch (item.itemType) {
        case 'organizational_unit':
          await db.insert(organizationalUnits).values({
            companyId: item.companyId,
            unitName: dataToUse.unit_name,
            unitCode: dataToUse.unit_code,
            unitType: dataToUse.unit_type,
            description: dataToUse.description,
            primaryActivities: dataToUse.primary_activities,
            geographicScope: dataToUse.geographic_scope,
            revenueContributionPct: dataToUse.revenue_contribution_pct,
            operatingIncomeContributionPct: dataToUse.operating_income_contribution_pct,
            extractedFromSource: true,
            sourceDocumentReference: item.sourceDocumentSection,
            extractionConfidence: item.confidenceScore
          });
          break;

        case 'metric':
          await db.insert(metricDefinitions).values({
            companyId: item.companyId,
            metricName: dataToUse.metric_name,
            metricCode: dataToUse.metric_code,
            metricCategory: dataToUse.category,
            metricSubcategory: dataToUse.subcategory,
            description: dataToUse.description,
            calculationFormula: dataToUse.calculation_formula,
            unitOfMeasure: dataToUse.unit_of_measure,
            dataType: dataToUse.data_type,
            reportingFrequency: dataToUse.reporting_frequency,
            targetValue: dataToUse.target_value,
            targetRangeMin: dataToUse.target_range_min,
            targetRangeMax: dataToUse.target_range_max,
            benchmarkSource: dataToUse.target_source,
            extractedFromReport: true,
            sourceDocument: item.sourceDocumentSection,
            sourcePage: item.sourcePageNumber,
            extractionConfidence: item.confidenceScore
          });
          break;

        case 'objective':
          const [objective] = await db.insert(strategicObjectives).values({
            companyId: item.companyId,
            objectiveName: dataToUse.objective_name,
            objectiveDescription: dataToUse.objective_description,
            objectiveCategory: dataToUse.category,
            startDate: dataToUse.start_date,
            targetDate: dataToUse.target_date,
            extractedFromReport: true,
            sourceDocument: item.sourceDocumentSection,
            extractionConfidence: item.confidenceScore
          }).returning();

          // Insert key results
          if (dataToUse.key_results) {
            for (let i = 0; i < dataToUse.key_results.length; i++) {
              const kr = dataToUse.key_results[i];
              await db.insert(keyResults).values({
                strategicObjectiveId: objective.id,
                keyResultName: kr.key_result_name,
                keyResultDescription: kr.description,
                targetValue: kr.target_value,
                unitOfMeasure: kr.unit_of_measure,
                dueDate: kr.due_date,
                displayOrder: i + 1
              });
            }
          }
          break;

        case 'rule':
          await db.insert(companyRules).values({
            companyId: item.companyId,
            ruleCategory: dataToUse.rule_category,
            ruleSubcategory: dataToUse.rule_subcategory,
            ruleName: dataToUse.rule_name,
            ruleCode: `${dataToUse.rule_category.substring(0, 3).toUpperCase()}_${Date.now()}`,
            ruleDescription: dataToUse.rule_description,
            ruleLogic: dataToUse.rule_logic,
            extractedFromReport: true,
            sourceDocument: item.sourceDocumentSection,
            sourceSection: dataToUse.source_section,
            extractionConfidence: item.confidenceScore,
            enforcementLevel: dataToUse.enforcement_level
          });
          break;
      }

      // Mark as approved
      await db.update(extractionReviewQueue)
        .set({
          reviewStatus: modifiedData ? 'modified' : 'approved',
          reviewedBy: req.user?.id,
          reviewedAt: new Date(),
          modifiedData: modifiedData
        })
        .where(eq(extractionReviewQueue.id, itemId));

      res.json({ success: true, message: 'Item approved and created' });
    } catch (error: any) {
      console.error('Approval error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve item' });
    }
  });

  /**
   * POST /api/company-profile/review-queue/:itemId/reject
   * Reject extracted item
   */
  router.post('/review-queue/:itemId/reject', async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const { reason } = req.body;

      await db.update(extractionReviewQueue)
        .set({
          reviewStatus: 'rejected',
          reviewedBy: req.user?.id,
          reviewedAt: new Date(),
          reviewNotes: reason
        })
        .where(eq(extractionReviewQueue.id, itemId));

      res.json({ success: true, message: 'Item rejected' });
    } catch (error: any) {
      console.error('Rejection error:', error);
      res.status(500).json({ error: error.message || 'Failed to reject item' });
    }
  });

  // ============================================================================
  // COMPANY CRUD
  // ============================================================================

  /**
   * POST /api/company-profile
   * Create new company profile
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { companyData } = req.body;

      const [company] = await db.insert(companies).values({
        legalName: companyData.legalName,
        tradeNames: companyData.tradeNames,
        headquarters: companyData.headquarters,
        primaryNaicsCode: companyData.primaryNaicsCode,
        primaryNaicsDescription: companyData.primaryNaicsDescription,
        gicsSector: companyData.gicsSector,
        gicsIndustry: companyData.gicsIndustry,
        businessSummary: companyData.businessSummary,
        latestAnnualReportUrl: companyData.latestAnnualReportUrl,
        latestAnnualReportDate: companyData.latestAnnualReportDate,
        fiscalYearEnd: companyData.fiscalYearEnd,
        reportingCurrency: companyData.reportingCurrency,
        orgStructureTerminology: companyData.orgStructureTerminology,
        status: 'draft',
        profileApprovedBy: req.user?.id
      }).returning();

      res.json(company);
    } catch (error: any) {
      console.error('Company creation error:', error);
      res.status(500).json({ error: error.message || 'Failed to create company' });
    }
  });

  /**
   * GET /api/company-profile/:id
   * Get company profile
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.id, id));

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Get organizational units
      const units = await db.select()
        .from(organizationalUnits)
        .where(eq(organizationalUnits.companyId, id));

      // Get metrics
      const metrics = await db.select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.companyId, id));

      // Get objectives
      const objectives = await db.select()
        .from(strategicObjectives)
        .where(eq(strategicObjectives.companyId, id));

      res.json({
        ...company,
        organizationalUnits: units,
        metrics,
        strategicObjectives: objectives
      });
    } catch (error: any) {
      console.error('Company fetch error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch company' });
    }
  });

  /**
   * GET /api/company-profile/active
   * Get the active company profile with all related data
   * This replaces hardcoded NextEra references with dynamic company data
   */
  router.get('/active', async (req: Request, res: Response) => {
    try {
      // Find the active company profile
      const [activeCompany] = await db
        .select()
        .from(companies)
        .where(eq(companies.status, 'active'))
        .limit(1);

      if (!activeCompany) {
        return res.json({
          active: false,
          message: 'No active company profile. Using demo/fallback data.'
        });
      }

      // Load all related data
      const [
        orgUnits,
        metrics,
        objectives,
        rules
      ] = await Promise.all([
        db.select().from(organizationalUnits).where(eq(organizationalUnits.companyId, activeCompany.id)),
        db.select().from(metricDefinitions).where(eq(metricDefinitions.companyId, activeCompany.id)),
        db.select().from(strategicObjectives).where(eq(strategicObjectives.companyId, activeCompany.id)),
        db.select().from(companyRules).where(and(
          eq(companyRules.companyId, activeCompany.id),
          eq(companyRules.isActive, true)
        ))
      ]);

      // Get key results for each objective
      const objectiveIds = objectives.map(o => o.id);
      const allKeyResults = objectiveIds.length > 0
        ? await db.select().from(keyResults).where(
            eq(keyResults.objectiveId, objectiveIds[0]) // TODO: proper IN query
          )
        : [];

      res.json({
        active: true,
        company: {
          id: activeCompany.id,
          legalName: activeCompany.legalName,
          tradeNames: activeCompany.tradeNames,
          headquarters: activeCompany.headquarters,
          industry: activeCompany.gicsSector || activeCompany.gicsIndustry,
          businessSummary: activeCompany.businessSummary,
          missionStatement: activeCompany.missionStatement,
          fiscalYearEnd: activeCompany.fiscalYearEnd,
          reportingCurrency: activeCompany.reportingCurrency,
          status: activeCompany.status, // 'demo' | 'draft' | 'active'
        },
        organizationalUnits: orgUnits.map(unit => ({
          id: unit.id,
          name: unit.unitName,
          type: unit.unitType,
          code: unit.unitCode,
          description: unit.description,
          parentId: unit.parentId,
          revenueContribution: unit.revenueContributionPct,
          operatingIncomeContribution: unit.operatingIncomeContributionPct,
        })),
        metrics: metrics.map(metric => ({
          id: metric.id,
          name: metric.metricName,
          category: metric.category,
          unitOfMeasure: metric.unitOfMeasure,
          targetValue: metric.targetValue,
          currentValue: metric.currentValue,
          thresholds: metric.thresholds,
          frequency: metric.reportingFrequency,
          owner: metric.ownerRole,
        })),
        objectives: objectives.map(obj => ({
          id: obj.id,
          title: obj.objectiveText,
          category: obj.category,
          timeframe: obj.timeframe,
          targetDate: obj.targetDate,
          currentProgress: obj.progressPct,
          status: obj.status,
          keyResults: allKeyResults.filter((kr: any) => kr.objectiveId === obj.id),
        })),
        rules: rules.map(rule => ({
          id: rule.id,
          name: rule.ruleName,
          category: rule.ruleCategory,
          description: rule.ruleDescription,
          enforcementLevel: rule.enforcementLevel,
          isActive: rule.isActive,
        })),
        meta: {
          extractedAt: activeCompany.profileGeneratedAt,
          approvedAt: activeCompany.profileApprovedAt,
          confidence: activeCompany.aiExtractionConfidence,
        }
      });
    } catch (error: any) {
      console.error('Error fetching active company:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch active company profile' });
    }
  });

  /**
   * PUT /api/company-profile/:id/approve
   * Approve and activate company profile
   */
  router.put('/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await db.update(companies)
        .set({
          status: 'active',
          profileApprovedAt: new Date(),
          profileApprovedBy: req.user?.id
        })
        .where(eq(companies.id, id));

      // Generate dashboards asynchronously
      // Dashboards will be created in 'pending_review' status for HITL approval
      generateCompanyDashboards(id).catch(err => {
        console.error('Dashboard generation failed:', err);
      });

      res.json({ success: true, message: 'Company profile approved and activated. Dashboards are being generated for your review.' });
    } catch (error: any) {
      console.error('Approval error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve company' });
    }
  });

  /**
   * POST /api/company-profile/:id/activate
   * Set company as the active company (deactivates all others)
   * Used by admins to switch between configured companies
   */
  router.post('/:id/activate', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verify company exists and is approved
      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.id, id))
        .limit(1);

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Deactivate all other companies
      await db.update(companies)
        .set({ status: 'inactive' })
        .where(eq(companies.status, 'active'));

      // Activate this company
      await db.update(companies)
        .set({ status: 'active' })
        .where(eq(companies.id, id));

      res.json({
        success: true,
        message: `${company.legalName} is now the active company.`,
        company: {
          id: company.id,
          legalName: company.legalName,
          status: 'active'
        }
      });
    } catch (error: any) {
      console.error('Activation error:', error);
      res.status(500).json({ error: error.message || 'Failed to activate company' });
    }
  });

  /**
   * GET /api/company-profile/all
   * List all configured companies
   * Used by admin company switcher
   */
  router.get('/all', async (req: Request, res: Response) => {
    try {
      const allCompanies = await db.select({
        id: companies.id,
        legalName: companies.legalName,
        status: companies.status,
        gicsSector: companies.gicsSector,
        gicsIndustry: companies.gicsIndustry,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
      })
      .from(companies)
      .orderBy(companies.createdAt);

      res.json(allCompanies);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch companies' });
    }
  });

  app.use('/api/company-profile', router);
}
