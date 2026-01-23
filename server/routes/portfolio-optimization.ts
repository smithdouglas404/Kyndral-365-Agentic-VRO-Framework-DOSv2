/**
 * PORTFOLIO OPTIMIZATION API (TIER 3)
 * AI-powered portfolio optimization and scenario modeling
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { PortfolioOptimizationEngine } from '../engines/PortfolioOptimizationEngine.js';

export function registerPortfolioOptimizationRoutes(app: Express, storage: IStorage) {
  const optimizationEngine = new PortfolioOptimizationEngine(storage);

  // POST /api/portfolio/optimize - Optimize portfolio selection
  app.post('/api/portfolio/optimize', async (req: Request, res: Response) => {
    try {
      const {
        portfolioId,
        constraints,
        objectives,
        scenarios,
      } = req.body;

      if (!constraints || !objectives) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: constraints, objectives',
        });
      }

      const result = await optimizationEngine.optimizePortfolio({
        portfolioId,
        constraints,
        objectives,
        scenarios,
      });

      res.json({
        success: true,
        optimization: result,
      });
    } catch (error: any) {
      console.error('Error optimizing portfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize portfolio',
        message: error.message,
      });
    }
  });

  console.log('✅ Portfolio optimization routes registered (TIER 3)');
}
