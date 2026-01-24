/**
 * MCP SERVER MANAGEMENT API (ADMIN)
 *
 * Endpoints for activating and managing MCP server integrations
 * Users can browse available MCP servers and activate them with proper credentials
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../auth/authMiddleware.js';
import { db } from '../../db.js';
import { integrations } from '../../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import {
  MCP_SERVER_REGISTRY,
  getAllMCPServers,
  getMCPServersByCategory,
  getMCPServersByOffice,
  getMCPServer,
  getOfficialMCPServers,
  MCP_CATEGORIES,
  type MCPServerCategory,
} from '../../mcp/MCPServerRegistry.js';
import { encryptFields, decryptFields } from '../../lib/encryption.js';
import { MCPConnectionTester } from '../../mcp/MCPConnectionTester.js';
import { getMCPSyncScheduler } from '../../mcp/MCPSyncScheduler.js';

/**
 * Register MCP server management routes
 */
export function registerMCPServerRoutes(app: Express): void {
  /**
   * GET /api/admin/mcp-servers
   * List all available MCP servers in the registry
   */
  app.get('/api/admin/mcp-servers', authenticate, async (req: Request, res: Response) => {
    try {
      const { category, office, official } = req.query;

      let servers;

      if (category) {
        servers = getMCPServersByCategory(category as MCPServerCategory);
      } else if (office) {
        servers = getMCPServersByOffice(office as string);
      } else if (official === 'true') {
        servers = getOfficialMCPServers();
      } else {
        servers = getAllMCPServers();
      }

      res.json({
        success: true,
        totalServers: servers.length,
        servers,
        categories: MCP_CATEGORIES,
      });
    } catch (error: any) {
      console.error('[MCPServers] Error fetching MCP servers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch MCP servers',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/mcp-servers/:id
   * Get details for a specific MCP server
   */
  app.get('/api/admin/mcp-servers/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const server = getMCPServer(id);

      if (!server) {
        return res.status(404).json({
          success: false,
          error: 'MCP server not found',
        });
      }

      res.json({
        success: true,
        server,
      });
    } catch (error: any) {
      console.error('[MCPServers] Error fetching MCP server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch MCP server',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/mcp-servers/active/list
   * List all active (configured) MCP server integrations
   */
  app.get('/api/admin/mcp-servers/active/list', authenticate, async (req: Request, res: Response) => {
    try {
      const activeIntegrations = await db
        .select()
        .from(integrations)
        .where(eq(integrations.status, 'connected'))
        .orderBy(desc(integrations.lastSyncAt));

      // Decrypt credentials for display (masked)
      const integrationsWithMaskedCreds = activeIntegrations.map((integration) => {
        const decrypted = decryptFields(integration, ['credentials']);

        // Mask sensitive credentials
        if (decrypted.credentials && typeof decrypted.credentials === 'object') {
          const masked: Record<string, any> = {};
          for (const [key, value] of Object.entries(decrypted.credentials)) {
            if (typeof value === 'string' && value.length > 4) {
              masked[key] = '****' + value.slice(-4);
            } else {
              masked[key] = '****';
            }
          }
          decrypted.credentials = masked;
        }

        // Enrich with MCP server metadata
        const mcpServer = getMCPServer(integration.type);

        return {
          ...decrypted,
          mcpServer: mcpServer
            ? {
                displayName: mcpServer.displayName,
                category: mcpServer.category,
                officialMCP: mcpServer.officialMCP,
                capabilities: mcpServer.capabilities,
              }
            : null,
        };
      });

      res.json({
        success: true,
        totalActive: integrationsWithMaskedCreds.length,
        integrations: integrationsWithMaskedCreds,
      });
    } catch (error: any) {
      console.error('[MCPServers] Error fetching active integrations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active integrations',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/admin/mcp-servers/:id/activate
   * Activate an MCP server with configuration
   */
  app.post('/api/admin/mcp-servers/:id/activate', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configData = req.body;

      // Get MCP server definition
      const mcpServer = getMCPServer(id);

      if (!mcpServer) {
        return res.status(404).json({
          success: false,
          error: 'MCP server not found',
        });
      }

      // Validate required fields
      const missingFields = mcpServer.configFields
        .filter((field) => field.required && !configData[field.name])
        .map((field) => field.label);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields,
        });
      }

      // Prepare credentials object (all config fields)
      const credentials: Record<string, any> = {};
      for (const field of mcpServer.configFields) {
        if (configData[field.name]) {
          credentials[field.name] = configData[field.name];
        }
      }

      // Check if integration already exists
      const existingIntegrations = await db
        .select()
        .from(integrations)
        .where(eq(integrations.type, id));

      let integration;

      if (existingIntegrations.length > 0) {
        // Update existing integration
        const existingId = existingIntegrations[0].id;

        // Encrypt credentials
        const encrypted = encryptFields({ credentials }, ['credentials']);

        const updated = await db
          .update(integrations)
          .set({
            name: configData.name || mcpServer.displayName,
            status: 'connected',
            credentials: encrypted.credentials,
            connectionDetails: {
              mcpServerId: id,
              category: mcpServer.category,
              officialMCP: mcpServer.officialMCP,
              activatedAt: new Date().toISOString(),
              activatedBy: req.user?.email || 'unknown',
            },
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existingId))
          .returning();

        integration = updated[0];

        console.log(`[MCPServers] Updated MCP integration: ${mcpServer.displayName}`);
      } else {
        // Create new integration
        // Encrypt credentials
        const encrypted = encryptFields({ credentials }, ['credentials']);

        const created = await db
          .insert(integrations)
          .values({
            name: configData.name || mcpServer.displayName,
            type: id,
            status: 'connected',
            credentials: encrypted.credentials,
            connectionDetails: {
              mcpServerId: id,
              category: mcpServer.category,
              officialMCP: mcpServer.officialMCP,
              activatedAt: new Date().toISOString(),
              activatedBy: req.user?.email || 'unknown',
            },
            syncSchedule: configData.syncSchedule || 'manual',
            fieldMappings: {},
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
          })
          .returning();

        integration = created[0];

        console.log(`[MCPServers] Activated MCP integration: ${mcpServer.displayName}`);
      }

      res.status(201).json({
        success: true,
        message: `${mcpServer.displayName} activated successfully`,
        integration: {
          ...integration,
          credentials: '****', // Never return raw credentials
        },
      });
    } catch (error: any) {
      console.error('[MCPServers] Error activating MCP server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate MCP server',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/admin/mcp-servers/:id/test
   * Test MCP server connection
   */
  app.post('/api/admin/mcp-servers/:id/test', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configData = req.body;

      const mcpServer = getMCPServer(id);

      if (!mcpServer) {
        return res.status(404).json({
          success: false,
          error: 'MCP server not found',
        });
      }

      // Validate required fields
      const missingFields = mcpServer.configFields
        .filter((field) => field.required && !configData[field.name])
        .map((field) => field.label);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot test connection with missing required fields',
          missingFields,
        });
      }

      // Prepare credentials object (all config fields)
      const credentials: Record<string, any> = {};
      for (const field of mcpServer.configFields) {
        if (configData[field.name]) {
          credentials[field.name] = configData[field.name];
        }
      }

      // Perform real connection test
      console.log(`[MCPServers] Testing connection to ${mcpServer.displayName}...`);
      const testResult = await MCPConnectionTester.testConnection(id, credentials);

      // Add additional metadata
      const enrichedResult = {
        ...testResult,
        details: {
          ...testResult.details,
          server: mcpServer.displayName,
          category: mcpServer.category,
          officialMCP: mcpServer.officialMCP,
          timestamp: new Date().toISOString(),
        },
      };

      if (testResult.success) {
        console.log(`[MCPServers] Connection test successful for ${mcpServer.displayName}`);
      } else {
        console.error(`[MCPServers] Connection test failed for ${mcpServer.displayName}: ${testResult.error}`);
      }

      res.json(enrichedResult);
    } catch (error: any) {
      console.error('[MCPServers] Error testing MCP server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test MCP server connection',
        message: error.message,
      });
    }
  });

  /**
   * DELETE /api/admin/mcp-servers/:integrationId/deactivate
   * Deactivate an MCP server integration
   */
  app.delete('/api/admin/mcp-servers/:integrationId/deactivate', authenticate, async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params;

      // Check if integration exists
      const existing = await db.select().from(integrations).where(eq(integrations.id, integrationId)).limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found',
        });
      }

      // Delete the integration
      await db.delete(integrations).where(eq(integrations.id, integrationId));

      console.log(`[MCPServers] Deactivated integration: ${existing[0].name}`);

      res.json({
        success: true,
        message: 'MCP server integration deactivated successfully',
      });
    } catch (error: any) {
      console.error('[MCPServers] Error deactivating MCP server:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate MCP server',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/admin/mcp-servers/:integrationId/sync
   * Trigger manual sync for an integration
   */
  app.post('/api/admin/mcp-servers/:integrationId/sync', authenticate, async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params;

      // Check if integration exists
      const existing = await db.select().from(integrations).where(eq(integrations.id, integrationId)).limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found',
        });
      }

      // Trigger manual sync
      const syncScheduler = getMCPSyncScheduler();
      if (!syncScheduler) {
        return res.status(503).json({
          success: false,
          error: 'Sync scheduler not available',
        });
      }

      console.log(`[MCPServers] Manual sync triggered for ${existing[0].name} by ${req.user?.email}`);

      // Trigger sync asynchronously (don't wait for completion)
      syncScheduler.triggerManualSync(integrationId).catch(err => {
        console.error(`[MCPServers] Manual sync failed for ${existing[0].name}:`, err);
      });

      res.json({
        success: true,
        message: 'Sync started successfully',
      });
    } catch (error: any) {
      console.error('[MCPServers] Error triggering manual sync:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger sync',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/admin/mcp-servers/categories/list
   * Get all MCP server categories
   */
  app.get('/api/admin/mcp-servers/categories/list', authenticate, async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        categories: MCP_CATEGORIES,
      });
    } catch (error: any) {
      console.error('[MCPServers] Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
        message: error.message,
      });
    }
  });

  console.log('[MCPServers] MCP server management routes registered');
}
