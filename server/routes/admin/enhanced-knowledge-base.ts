/**
 * ENHANCED KNOWLEDGE BASE API ROUTES
 *
 * Admin endpoints for managing knowledge base with:
 * - Regulatory document support
 * - Document usage tracking
 * - Safe deletion with usage checking
 * - Document replacement
 */

import { Router, type Request, type Response } from 'express';
import { getEnhancedKnowledgeBase } from '../../lib/EnhancedKnowledgeBaseRepository.js';
import type { IStorage } from '../../storage.js';
import type { EnhancedSearchOptions } from '../../lib/EnhancedKnowledgeBaseRepository.js';

export function createEnhancedKnowledgeBaseRoutes(storage: IStorage): Router {
  const router = Router();
  const kbRepo = getEnhancedKnowledgeBase(storage);

  /**
   * GET /api/admin/knowledge-base
   * List/search knowledge base documents with filters
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const options: EnhancedSearchOptions = {
        category: req.query.category as any,
        subcategory: req.query.subcategory as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        query: req.query.query as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        includeArchived: req.query.includeArchived === 'true',
        sortBy: (req.query.sortBy as any) || 'date',
        agentId: req.query.agentId as string,
        documentType: req.query.documentType as any,
      };

      const articles = await kbRepo.searchArticles(options);

      res.json({
        success: true,
        articles,
        count: articles.length,
      });
    } catch (error: any) {
      console.error('[EnhancedKB API] Search failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/knowledge-base/:id
   * Get document by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const articles = await kbRepo.getArticlesByIds([id]);

      if (articles.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      res.json({ success: true, article: articles[0] });
    } catch (error: any) {
      console.error('[EnhancedKB API] Get document failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/admin/knowledge-base
   * Create new knowledge base document
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const articleData = req.body;

      // Validate required fields
      if (!articleData.title || !articleData.content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, content',
        });
      }

      if (!articleData.relevantAgents || articleData.relevantAgents.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one agent must be assigned to this document',
        });
      }

      const article = await kbRepo.createArticle({
        title: articleData.title,
        category: articleData.category || 'sop',
        subcategory: articleData.subcategory,
        content: articleData.content,
        summary: articleData.summary,
        tags: articleData.tags || [],
        source: articleData.source || 'User Upload',
        version: articleData.version || '1.0',
        author: articleData.author,
        relevantAgents: articleData.relevantAgents,
        documentType: articleData.documentType || 'guideline',
        triggerConditions: articleData.triggerConditions || [],
        countryCode: articleData.countryCode,
        industry: articleData.industry,
        standardName: articleData.standardName,
        isRegulatoryDoc: articleData.isRegulatoryDoc || false,
        isPredocumented: articleData.isPredocumented || false,
        applicablePhases: articleData.applicablePhases || [],
        formSchema: articleData.formSchema,
        requiredFields: articleData.requiredFields,
        metadata: articleData.metadata || {},
        status: articleData.status || 'published',
      });

      res.status(201).json({
        success: true,
        article,
        message: 'Document created successfully',
      });
    } catch (error: any) {
      console.error('[EnhancedKB API] Create failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/admin/knowledge-base/:id
   * Update knowledge base document
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if document exists
      const existing = await kbRepo.getArticlesByIds([id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      // Prevent updating predocumented regulatory documents
      if (existing[0].isPredocumented && !req.body.allowPredocumentedUpdate) {
        return res.status(403).json({
          success: false,
          error: 'Cannot modify system-predocumented regulatory documents',
        });
      }

      const article = await kbRepo.updateArticle(id, updates);

      res.json({
        success: true,
        article,
        message: 'Document updated successfully',
      });
    } catch (error: any) {
      console.error('[EnhancedKB API] Update failed:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/knowledge-base/:id/usage
   * Get document usage information (for deletion safety check)
   */
  router.get('/:id/usage', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const usage = await kbRepo.getDocumentUsage(id);

      res.json({
        success: true,
        usage,
      });
    } catch (error: any) {
      console.error('[EnhancedKB API] Get usage failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/admin/knowledge-base/:id
   * Delete document with safety check
   * Query params:
   *   - force=true: bypass usage check and force delete
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';

      // Check if document exists
      const existing = await kbRepo.getArticlesByIds([id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      // Get usage information
      const usage = await kbRepo.getDocumentUsage(id);

      // If in use and not forced, return usage info for user confirmation
      if (usage.isInUse && !force) {
        return res.status(409).json({
          success: false,
          error: 'Document is currently in use',
          usage: usage.usageDetails,
          requiresConfirmation: true,
          message: `This document is used by ${usage.usageDetails.totalReferences} reference(s). Confirm to delete anyway or replace with another document.`,
        });
      }

      // Delete document
      await kbRepo.deleteArticle(id, force);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      console.error('[EnhancedKB API] Delete failed:', error);
      if (error.message.includes('in use')) {
        return res.status(409).json({
          success: false,
          error: error.message,
          requiresConfirmation: true,
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/admin/knowledge-base/:oldId/replace/:newId
   * Replace a document with another document
   * Updates all references to point to the new document, then deletes the old one
   */
  router.post('/:oldId/replace/:newId', async (req: Request, res: Response) => {
    try {
      const { oldId, newId } = req.params;

      // Replace document
      await kbRepo.replaceDocument(oldId, newId);

      // Delete old document (force since we just transferred references)
      await kbRepo.deleteArticle(oldId, true);

      res.json({
        success: true,
        message: 'Document replaced and deleted successfully',
      });
    } catch (error: any) {
      console.error('[EnhancedKB API] Replace failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/admin/knowledge-base/regulatory/browse
   * Browse pre-documented regulatory documents by country/industry/standard
   */
  router.get('/regulatory/browse', async (req: Request, res: Response) => {
    try {
      const { countryCode, industry, standardName, agentId } = req.query;

      const articles = await kbRepo.searchArticles({
        agentId: agentId as string,
        limit: 200,
      });

      // Filter for regulatory documents
      const regulatoryDocs = articles.filter((article) => {
        if (!article.isPredocumented) return false;
        if (countryCode && article.countryCode !== countryCode) return false;
        if (industry && article.industry !== industry) return false;
        if (standardName && article.standardName !== standardName) return false;
        return true;
      });

      // Group by country/industry/standard
      const grouped = {
        byCountry: {} as Record<string, number>,
        byIndustry: {} as Record<string, number>,
        byStandard: {} as Record<string, number>,
        documents: regulatoryDocs,
      };

      regulatoryDocs.forEach((doc) => {
        if (doc.countryCode) {
          grouped.byCountry[doc.countryCode] = (grouped.byCountry[doc.countryCode] || 0) + 1;
        }
        if (doc.industry) {
          grouped.byIndustry[doc.industry] = (grouped.byIndustry[doc.industry] || 0) + 1;
        }
        if (doc.standardName) {
          grouped.byStandard[doc.standardName] = (grouped.byStandard[doc.standardName] || 0) + 1;
        }
      });

      res.json({
        success: true,
        grouped,
        count: regulatoryDocs.length,
      });
    } catch (error: any) {
      console.error('[EnhancedKB API] Regulatory browse failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/admin/knowledge-base/seed
   * Seed regulatory documents (called during wizard setup)
   */
  router.post('/seed', async (req: Request, res: Response) => {
    try {
      console.log('[Seed API] Starting document seeding...');

      // Import and run seeding function
      const { seedRegulatoryDocuments } = await import('../../scripts/seed-regulatory-documents.js');
      await seedRegulatoryDocuments();

      res.json({
        success: true,
        message: 'Regulatory documents seeded successfully',
      });
    } catch (error: any) {
      console.error('[Seed API] Seeding failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
