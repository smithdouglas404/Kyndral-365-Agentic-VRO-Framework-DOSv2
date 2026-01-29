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
import { UniversalMCPConnector } from '../../mcp/UniversalMCPConnector.js';
// DISABLED: MCPSyncScheduler file removed
// import { getMCPSyncScheduler } from '../../mcp/MCPSyncScheduler.js';

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

      // Perform real connection test using UniversalMCPConnector
      console.log(`[MCPServers] Testing connection to ${mcpServer.displayName}...`);

      // Create mock integration for testing
      const mockIntegration: any = {
        id: 'test-connection',
        type: id,
        name: mcpServer.displayName,
        status: 'testing',
        credentials: credentials,
        connectionDetails: {
          mcpServerId: id,
          baseUrl: credentials.baseUrl || credentials.apiUrl || credentials.url,
          authType: mcpServer.authType || 'bearer',
          apiType: mcpServer.apiType || 'rest',
          endpoints: mcpServer.endpoints || {},
        },
        fieldMappings: {},
      };

      try {
        // Encrypt credentials for connector (it will decrypt them)
        const encrypted = encryptFields(mockIntegration, ['credentials']);
        mockIntegration.credentials = encrypted.credentials;

        const connector = new UniversalMCPConnector(mockIntegration);
        const testResult = await connector.testConnection();

        // Add additional metadata
        const enrichedResult = {
          success: testResult.success,
          message: testResult.message,
          latency: testResult.latency,
          details: {
            server: mcpServer.displayName,
            category: mcpServer.category,
            officialMCP: mcpServer.officialMCP,
            timestamp: new Date().toISOString(),
          },
        };

        if (testResult.success) {
          console.log(`[MCPServers] Connection test successful for ${mcpServer.displayName} (${testResult.latency}ms)`);
        } else {
          console.error(`[MCPServers] Connection test failed for ${mcpServer.displayName}: ${testResult.message}`);
        }

        res.json(enrichedResult);
      } catch (connectorError: any) {
        console.error(`[MCPServers] Error creating connector for ${mcpServer.displayName}:`, connectorError);
        res.json({
          success: false,
          message: `Connection test failed: ${connectorError.message}`,
          latency: 0,
          details: {
            server: mcpServer.displayName,
            category: mcpServer.category,
            officialMCP: mcpServer.officialMCP,
            timestamp: new Date().toISOString(),
          },
        });
      }
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

      // Trigger manual sync using UniversalMCPConnector
      const integration = existing[0];
      console.log(`[MCPServers] Manual sync requested for ${integration.name} by ${req.user?.email}`);

      try {
        const connector = new UniversalMCPConnector(integration);
        const syncResult = await connector.syncProjects();

        console.log(`[MCPServers] Manual sync completed for ${integration.name}: ${syncResult.recordsImported} records imported`);

        res.json({
          success: true,
          message: 'Manual sync completed successfully',
          result: {
            recordsImported: syncResult.recordsImported,
            duration: syncResult.duration,
            errors: syncResult.errors,
          },
        });
      } catch (syncError: any) {
        console.error(`[MCPServers] Manual sync failed for ${integration.name}:`, syncError);
        res.status(500).json({
          success: false,
          error: 'Manual sync failed',
          message: syncError.message,
        });
      }
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

  /**
   * GET /api/admin/mcp/status
   * Get status of all MCP integrations (connected vs not configured)
   */
  app.get('/api/admin/mcp/status', authenticate, async (req: Request, res: Response) => {
    try {
      // Check which MCPs are configured via environment variables
      const mcpStatuses = [
        {
          id: 'jira',
          name: 'Jira',
          connected: !!(process.env.JIRA_DOMAIN && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN),
          required: false,
          optional: true,
          usedByAgents: ['FinOps', 'PMO', 'Risk', 'Governance'],
          configUrl: '/admin/integrations/jira',
          errorMessage: process.env.JIRA_DOMAIN
            ? undefined
            : 'Not configured - Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN in .env'
        },
        {
          id: 'servicenow',
          name: 'ServiceNow',
          connected: !!(process.env.SERVICENOW_INSTANCE && process.env.SERVICENOW_USERNAME && process.env.SERVICENOW_PASSWORD),
          required: false,
          optional: true,
          usedByAgents: ['TMO', 'Risk', 'OCM'],
          configUrl: '/admin/integrations/servicenow',
          errorMessage: process.env.SERVICENOW_INSTANCE
            ? undefined
            : 'Not configured - Set SERVICENOW_INSTANCE, SERVICENOW_USERNAME, SERVICENOW_PASSWORD in .env'
        },
        {
          id: 'slack',
          name: 'Slack',
          connected: !!(process.env.SLACK_WEBHOOK_URL),
          required: false,
          optional: true,
          usedByAgents: ['All Agents'],
          configUrl: '/admin/integrations/slack',
          errorMessage: process.env.SLACK_WEBHOOK_URL
            ? undefined
            : 'Not configured - Set SLACK_WEBHOOK_URL in .env'
        },
        {
          id: 'langflow',
          name: 'Langflow',
          connected: !!(process.env.LANGFLOW_API_KEY && process.env.LANGFLOW_API_KEY !== 'YOUR_KEY_HERE'),
          required: true,
          optional: false,
          usedByAgents: ['All Agents'],
          configUrl: '/admin/integrations/langflow',
          errorMessage: (process.env.LANGFLOW_API_KEY && process.env.LANGFLOW_API_KEY !== 'YOUR_KEY_HERE')
            ? undefined
            : 'REQUIRED - Run ./START_LANGFLOW.sh and set LANGFLOW_API_KEY in .env'
        },
        {
          id: 'monday',
          name: 'Monday.com',
          connected: !!(process.env.MONDAY_API_KEY),
          required: false,
          optional: true,
          usedByAgents: ['PMO', 'Planning'],
          configUrl: '/admin/integrations/monday',
          errorMessage: process.env.MONDAY_API_KEY
            ? undefined
            : 'Not configured - Set MONDAY_API_KEY in .env'
        },
        {
          id: 'azure-devops',
          name: 'Azure DevOps',
          connected: !!(process.env.AZURE_DEVOPS_ORG && process.env.AZURE_DEVOPS_PAT),
          required: false,
          optional: true,
          usedByAgents: ['TMO', 'PMO'],
          configUrl: '/admin/integrations/azure-devops',
          errorMessage: process.env.AZURE_DEVOPS_ORG
            ? undefined
            : 'Not configured - Set AZURE_DEVOPS_ORG and AZURE_DEVOPS_PAT in .env'
        }
      ];

      res.json({
        success: true,
        mcps: mcpStatuses,
        connectedCount: mcpStatuses.filter(m => m.connected).length,
        totalCount: mcpStatuses.length,
        allOptionalMCPsConfigured: mcpStatuses.filter(m => m.optional).every(m => m.connected),
        requiredMCPsConfigured: mcpStatuses.filter(m => m.required).every(m => m.connected)
      });
    } catch (error: any) {
      console.error('[MCPServers] Error getting MCP status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get MCP status',
        message: error.message,
      });
    }
  });

  console.log('[MCPServers] MCP server management routes registered');
}
