/**
 * Knowledge Base API Routes
 *
 * Endpoints for managing knowledge base articles (PMBOK, Prince2, PMI, SAFe, SOPs, etc.)
 */

import { Router, type Request, type Response } from "express";
import {
  getKnowledgeBaseRepository,
  initKnowledgeBaseRepository,
  type KnowledgeArticle,
  type KnowledgeCategory,
  type KnowledgeSearchOptions
} from "../lib/KnowledgeBaseRepository.js";
import type { IStorage } from "../storage.js";

export function createKnowledgeBaseRoutes(storage: IStorage): Router {
  const router = Router();

  // Initialize KB Repository
  initKnowledgeBaseRepository(storage);
  const kbRepo = getKnowledgeBaseRepository();

  /**
   * GET /api/knowledge-base
   * Search/list articles with filters
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const options: KnowledgeSearchOptions = {
        category: req.query.category as KnowledgeCategory,
        subcategory: req.query.subcategory as string,
        tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
        query: req.query.query as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        includeArchived: req.query.includeArchived === "true",
        sortBy: (req.query.sortBy as any) || "date",
      };

      const articles = await kbRepo.searchArticles(options);

      res.json({ success: true, articles, count: articles.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/knowledge-base/search
   * Semantic search using vector embeddings
   */
  router.post("/search", async (req: Request, res: Response) => {
    try {
      const { query, category, limit = 10 } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Query is required"
        });
      }

      const results = await kbRepo.semanticSearch(query, category, limit);

      res.json({
        success: true,
        results,
        count: results.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/knowledge-base/categories
   * List all categories with article counts
   */
  router.get("/categories", async (req: Request, res: Response) => {
    try {
      const categories = await kbRepo.listCategories();
      res.json({ success: true, categories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/knowledge-base/categories/:category/subcategories
   * List subcategories for a category
   */
  router.get("/categories/:category/subcategories", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const subcategories = await kbRepo.listSubcategories(category as KnowledgeCategory);

      res.json({ success: true, subcategories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/knowledge-base/tags
   * Get popular tags
   */
  router.get("/tags", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const tags = await kbRepo.getPopularTags(limit);

      res.json({ success: true, tags });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/knowledge-base/:id
   * Get article by ID
   */
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const article = await kbRepo.getArticleById(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          error: "Article not found"
        });
      }

      res.json({ success: true, article });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/knowledge-base
   * Create a new article
   */
  router.post("/", async (req: Request, res: Response) => {
    try {
      const articleData = req.body;

      // Validate required fields
      if (!articleData.title || !articleData.content || !articleData.category) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: title, content, category"
        });
      }

      const article = await kbRepo.createArticle({
        title: articleData.title,
        category: articleData.category,
        subcategory: articleData.subcategory,
        content: articleData.content,
        summary: articleData.summary,
        tags: articleData.tags || [],
        source: articleData.source || "Internal",
        version: articleData.version || "1.0",
        author: articleData.author,
        metadata: articleData.metadata || {},
        status: articleData.status || "published",
      });

      res.status(201).json({
        success: true,
        article,
        message: "Article created successfully"
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/knowledge-base/:id
   * Update an existing article
   */
  router.put("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const article = await kbRepo.updateArticle(id, updates);

      res.json({
        success: true,
        article,
        message: "Article updated successfully"
      });
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/knowledge-base/:id
   * Delete (archive) an article
   */
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await kbRepo.deleteArticle(id);

      res.json({
        success: true,
        message: "Article archived successfully"
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/knowledge-base/:id/metrics
   * Get usage metrics for an article
   */
  router.get("/:id/metrics", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const metrics = await kbRepo.getUsageMetrics(id);

      if (!metrics) {
        return res.json({
          success: true,
          metrics: {
            articleId: id,
            totalReferences: 0,
            referencedByAgents: [],
            averageRelevanceScore: 0,
            lastReferenced: null,
            successfulApplications: 0,
            totalApplications: 0,
          }
        });
      }

      res.json({ success: true, metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/knowledge-base/bulk-import
   * Bulk import articles
   */
  router.post("/bulk-import", async (req: Request, res: Response) => {
    try {
      const { articles } = req.body;

      if (!Array.isArray(articles)) {
        return res.status(400).json({
          success: false,
          error: "Articles must be an array"
        });
      }

      const imported = await kbRepo.bulkImport(articles);

      res.json({
        success: true,
        imported,
        total: articles.length,
        message: `Successfully imported ${imported} of ${articles.length} articles`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/knowledge-base/analytics/overview
   * Get knowledge base analytics overview
   */
  router.get("/analytics/overview", async (req: Request, res: Response) => {
    try {
      const result = await storage.db.query(`
        SELECT * FROM kb_analytics
        ORDER BY usage_count DESC NULLS LAST
        LIMIT 100
      `);

      // Get category distribution
      const categoryDistribution = await storage.db.query(`
        SELECT category, COUNT(*) as count
        FROM knowledge_base
        WHERE status = 'published'
        GROUP BY category
      `);

      // Get top referenced articles
      const topReferenced = await storage.db.query(`
        SELECT
          kb.id,
          kb.title,
          kb.category,
          COUNT(kul.id) as reference_count,
          AVG(kul.relevance_score) as avg_relevance
        FROM knowledge_base kb
        LEFT JOIN knowledge_usage_log kul ON kb.id = kul.article_id
        WHERE kb.status = 'published'
        GROUP BY kb.id, kb.title, kb.category
        ORDER BY reference_count DESC
        LIMIT 10
      `);

      // Get agent usage statistics
      const agentUsage = await storage.db.query(`
        SELECT
          agent_name,
          COUNT(DISTINCT article_id) as unique_articles,
          COUNT(*) as total_references,
          AVG(relevance_score) as avg_relevance
        FROM knowledge_usage_log
        GROUP BY agent_name
        ORDER BY total_references DESC
      `);

      res.json({
        success: true,
        analytics: {
          articles: result.rows,
          categoryDistribution: categoryDistribution.rows,
          topReferenced: topReferenced.rows,
          agentUsage: agentUsage.rows,
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
