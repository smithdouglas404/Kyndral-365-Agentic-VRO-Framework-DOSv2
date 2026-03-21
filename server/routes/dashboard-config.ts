/**
 * DASHBOARD CONFIG API ROUTES
 *
 * Endpoints for user dashboard configurations, custom widgets, and app config.
 */

import type { Express, Request, Response } from 'express';
import { authenticate } from '../auth/authMiddleware.js';
import { storage } from '../storage.js';

export function registerDashboardConfigRoutes(app: Express): void {
  /**
   * GET /api/dashboard/config/:type
   * Get user's dashboard configuration for a specific dashboard type
   */
  app.get('/api/dashboard/config/:type', authenticate, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const userId = req.user?.id || 'anonymous';

      const config = await storage.getUserDashboardConfig(userId, type);

      if (!config) {
        return res.json({
          success: true,
          config: null,
          isDefault: true,
        });
      }

      res.json({
        success: true,
        config: {
          id: config.id,
          dashboardType: config.dashboardType,
          layouts: JSON.parse(config.layouts || '{}'),
          visibleWidgets: JSON.parse(config.visibleWidgets || '[]'),
          widgetSizes: config.widgetSizes ? JSON.parse(config.widgetSizes) : {},
          widgetConfigs: config.widgetConfigs ? JSON.parse(config.widgetConfigs) : {},
          isDefault: config.isDefault,
        },
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Get config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/dashboard/config/:type
   * Save user's dashboard configuration
   */
  app.put('/api/dashboard/config/:type', authenticate, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const userId = req.user?.id || 'anonymous';
      const { layouts, visibleWidgets, widgetSizes, widgetConfigs, isDefault } = req.body;

      const config = await storage.saveUserDashboardConfig({
        userId,
        dashboardType: type,
        layouts: JSON.stringify(layouts || {}),
        visibleWidgets: JSON.stringify(visibleWidgets || []),
        widgetSizes: widgetSizes ? JSON.stringify(widgetSizes) : undefined,
        widgetConfigs: widgetConfigs ? JSON.stringify(widgetConfigs) : undefined,
        isDefault: isDefault || false,
      });

      res.json({
        success: true,
        config: {
          id: config.id,
          dashboardType: config.dashboardType,
          layouts: JSON.parse(config.layouts || '{}'),
          visibleWidgets: JSON.parse(config.visibleWidgets || '[]'),
          widgetSizes: config.widgetSizes ? JSON.parse(config.widgetSizes) : {},
          widgetConfigs: config.widgetConfigs ? JSON.parse(config.widgetConfigs) : {},
          isDefault: config.isDefault,
        },
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Save config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/dashboard/config/:type
   * Reset user's dashboard configuration to defaults
   */
  app.delete('/api/dashboard/config/:type', authenticate, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const userId = req.user?.id || 'anonymous';

      const config = await storage.getUserDashboardConfig(userId, type);
      if (config) {
        await storage.deleteUserDashboardConfig(config.id);
      }

      res.json({
        success: true,
        message: 'Dashboard configuration reset to defaults',
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Delete config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/user/widgets
   * Get user's custom widgets
   */
  app.get('/api/user/widgets', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || 'anonymous';

      const widgets = await storage.getUserWidgets(userId);

      res.json({
        success: true,
        widgets: widgets.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          templateId: w.templateId,
          dataSourceConfig: JSON.parse(w.dataSourceConfig || '{}'),
          visualizationConfig: JSON.parse(w.visualizationConfig || '{}'),
          size: w.size,
          refreshInterval: w.refreshInterval,
          isShared: w.isShared,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })),
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Get widgets error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/user/widgets
   * Create a custom widget
   */
  app.post('/api/user/widgets', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || 'anonymous';
      const {
        name,
        description,
        templateId,
        dataSourceConfig,
        visualizationConfig,
        size,
        refreshInterval,
        isShared,
      } = req.body;

      if (!name || !dataSourceConfig || !visualizationConfig) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, dataSourceConfig, visualizationConfig',
        });
      }

      const widget = await storage.createUserWidget({
        userId,
        name,
        description,
        templateId,
        dataSourceConfig: JSON.stringify(dataSourceConfig),
        visualizationConfig: JSON.stringify(visualizationConfig),
        size: size || 'medium',
        refreshInterval: refreshInterval || 60000,
        isShared: isShared || false,
      });

      res.json({
        success: true,
        widget: {
          id: widget.id,
          name: widget.name,
          description: widget.description,
          templateId: widget.templateId,
          dataSourceConfig: JSON.parse(widget.dataSourceConfig || '{}'),
          visualizationConfig: JSON.parse(widget.visualizationConfig || '{}'),
          size: widget.size,
          refreshInterval: widget.refreshInterval,
          isShared: widget.isShared,
          createdAt: widget.createdAt,
          updatedAt: widget.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Create widget error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/user/widgets/:id
   * Update a custom widget
   */
  app.put('/api/user/widgets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        templateId,
        dataSourceConfig,
        visualizationConfig,
        size,
        refreshInterval,
        isShared,
      } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (templateId !== undefined) updates.templateId = templateId;
      if (dataSourceConfig !== undefined) updates.dataSourceConfig = JSON.stringify(dataSourceConfig);
      if (visualizationConfig !== undefined) updates.visualizationConfig = JSON.stringify(visualizationConfig);
      if (size !== undefined) updates.size = size;
      if (refreshInterval !== undefined) updates.refreshInterval = refreshInterval;
      if (isShared !== undefined) updates.isShared = isShared;

      const widget = await storage.updateUserWidget(id, updates);

      if (!widget) {
        return res.status(404).json({
          success: false,
          error: 'Widget not found',
        });
      }

      res.json({
        success: true,
        widget: {
          id: widget.id,
          name: widget.name,
          description: widget.description,
          templateId: widget.templateId,
          dataSourceConfig: JSON.parse(widget.dataSourceConfig || '{}'),
          visualizationConfig: JSON.parse(widget.visualizationConfig || '{}'),
          size: widget.size,
          refreshInterval: widget.refreshInterval,
          isShared: widget.isShared,
          createdAt: widget.createdAt,
          updatedAt: widget.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Update widget error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/user/widgets/:id
   * Delete a custom widget
   */
  app.delete('/api/user/widgets/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteUserWidget(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Widget not found',
        });
      }

      res.json({
        success: true,
        message: 'Widget deleted successfully',
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Delete widget error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/config/:key
   * Get app configuration value
   */
  app.get('/api/config/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const tenantId = req.query.tenantId as string | undefined;

      const config = await storage.getAppConfig(key, tenantId);

      if (!config) {
        return res.json({
          success: true,
          configValue: null,
        });
      }

      // Try to parse JSON, otherwise return as string
      let parsedValue;
      try {
        parsedValue = JSON.parse(config.configValue);
      } catch {
        parsedValue = config.configValue;
      }

      res.json({
        success: true,
        configKey: config.configKey,
        configValue: parsedValue,
        category: config.category,
        description: config.description,
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Get app config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PUT /api/config/:key
   * Set app configuration value (admin only)
   */
  app.put('/api/config/:key', authenticate, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value, description, category, tenantId } = req.body;

      // Serialize value to JSON if it's an object
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      const config = await storage.setAppConfig(key, stringValue, description, category, tenantId);

      // Parse value back for response
      let parsedValue;
      try {
        parsedValue = JSON.parse(config.configValue);
      } catch {
        parsedValue = config.configValue;
      }

      res.json({
        success: true,
        configKey: config.configKey,
        configValue: parsedValue,
        category: config.category,
        description: config.description,
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Set app config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/config
   * Get all app configuration values (optionally filtered by category)
   */
  app.get('/api/config', async (req: Request, res: Response) => {
    try {
      const { category } = req.query;

      const configs = await storage.getAllAppConfig(category as string | undefined);

      res.json({
        success: true,
        configs: configs.map((c) => {
          let parsedValue;
          try {
            parsedValue = JSON.parse(c.configValue);
          } catch {
            parsedValue = c.configValue;
          }
          return {
            id: c.id,
            configKey: c.configKey,
            configValue: parsedValue,
            category: c.category,
            description: c.description,
          };
        }),
      });
    } catch (error: any) {
      console.error('[DashboardConfig] Get all config error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[DashboardConfig] Dashboard config routes registered');
}
