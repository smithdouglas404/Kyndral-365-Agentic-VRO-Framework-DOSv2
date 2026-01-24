/**
 * INTEGRATION MANAGEMENT API
 * Admin endpoints for configuring external data source integrations
 * (Jira, Azure DevOps, ServiceNow, SAP, etc.)
 */

import type { Express, Request, Response } from "express";
import { db } from "../../db.js";
import {
  integrations,
  integrationSyncHistory,
  insertIntegrationSchema,
  type Integration,
  type InsertIntegrationSyncHistory
} from "../../../shared/schema.js";
import { eq, desc } from "drizzle-orm";
import { encryptFields, decryptFields } from "../../lib/encryption.js";
import { IntegrationSyncService } from "../../services/IntegrationSyncService.js";
import type { IStorage } from "../../storage.js";

export function registerIntegrationRoutes(app: Express, storage: IStorage) {
  const syncService = new IntegrationSyncService(storage);

  // GET /api/integrations - List all integrations
  app.get("/api/integrations", authenticate, async (req: Request, res: Response) => {
    try {
      const allIntegrations = await db
        .select()
        .from(integrations)
        .orderBy(desc(integrations.createdAt));

      // Decrypt credentials for response (but mask sensitive parts)
      const integrationsWithMaskedCreds = allIntegrations.map(integration => {
        const decrypted = decryptFields(integration, ['credentials']);
        // Mask credentials - only show last 4 chars for security
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
        return decrypted;
      });

      res.json({
        success: true,
        integrations: integrationsWithMaskedCreds
      });
    } catch (error: any) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch integrations",
        message: error.message
      });
    }
  });

  // GET /api/integrations/:id - Get single integration
  app.get("/api/integrations/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const integration = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id))
        .limit(1);

      if (integration.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Integration not found"
        });
      }

      // Decrypt credentials for response
      const decrypted = decryptFields(integration[0], ['credentials']);

      res.json({
        success: true,
        integration: decrypted
      });
    } catch (error: any) {
      console.error("Error fetching integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch integration",
        message: error.message
      });
    }
  });

  // POST /api/integrations - Create new integration
  app.post("/api/integrations", authenticate, async (req: Request, res: Response) => {
    try {
      const integrationData = req.body;

      // Validate required fields
      if (!integrationData.name || !integrationData.type) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: name, type"
        });
      }

      // Encrypt credentials before storing
      const dataToStore = {
        name: integrationData.name,
        type: integrationData.type,
        status: integrationData.status || 'disconnected',
        connectionDetails: integrationData.connectionDetails || {},
        credentials: integrationData.credentials || {},
        syncSchedule: integrationData.syncSchedule || 'manual',
        fieldMappings: integrationData.fieldMappings || {},
        lastSyncAt: null,
        lastSyncStatus: null,
        errorMessage: null,
      };

      // Encrypt credentials field
      const encrypted = encryptFields(dataToStore, ['credentials']);

      const newIntegration = await db
        .insert(integrations)
        .values(encrypted)
        .returning();

      res.status(201).json({
        success: true,
        integration: newIntegration[0],
        message: "Integration created successfully"
      });
    } catch (error: any) {
      console.error("Error creating integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create integration",
        message: error.message
      });
    }
  });

  // PUT /api/integrations/:id - Update integration
  app.put("/api/integrations/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if integration exists
      const existing = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Integration not found"
        });
      }

      // Encrypt credentials before updating
      const dataToUpdate = {
        name: updateData.name,
        type: updateData.type,
        status: updateData.status,
        connectionDetails: updateData.connectionDetails,
        credentials: updateData.credentials,
        syncSchedule: updateData.syncSchedule,
        fieldMappings: updateData.fieldMappings,
        updatedAt: new Date(),
      };

      // Encrypt credentials field if present
      const encrypted = updateData.credentials
        ? encryptFields(dataToUpdate, ['credentials'])
        : dataToUpdate;

      const updated = await db
        .update(integrations)
        .set(encrypted)
        .where(eq(integrations.id, id))
        .returning();

      res.json({
        success: true,
        integration: updated[0],
        message: "Integration updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update integration",
        message: error.message
      });
    }
  });

  // DELETE /api/integrations/:id - Delete integration
  app.delete("/api/integrations/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if integration exists
      const existing = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Integration not found"
        });
      }

      await db
        .delete(integrations)
        .where(eq(integrations.id, id));

      res.json({
        success: true,
        message: "Integration deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete integration",
        message: error.message
      });
    }
  });

  // POST /api/integrations/:id/test - Test connection
  app.post("/api/integrations/:id/test", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const integration = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id))
        .limit(1);

      if (integration.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Integration not found"
        });
      }

      const startTime = new Date();

      // Test connection using sync service
      const testResult = await syncService.testConnection(integration[0]);

      const endTime = new Date();

      // Update integration status
      await db
        .update(integrations)
        .set({
          status: testResult.success ? 'connected' : 'error',
          lastSyncAt: endTime,
          lastSyncStatus: testResult.success ? 'success' : 'failed',
          errorMessage: testResult.success ? null : testResult.message,
        })
        .where(eq(integrations.id, id));

      // Save test history
      await db
        .insert(integrationSyncHistory)
        .values({
          integrationId: id,
          integrationName: integration[0].name,
          startTime,
          endTime,
          status: testResult.success ? 'success' : 'failed',
          recordsImported: 0,
          recordsUpdated: 0,
          recordsDeleted: 0,
          errors: testResult.success ? 0 : 1,
          errorMessage: testResult.message,
          metadata: JSON.stringify({ type: 'connection_test' }),
        });

      res.json(testResult);
    } catch (error: any) {
      console.error("Error testing integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to test integration",
        message: error.message
      });
    }
  });

  // POST /api/integrations/:id/sync - Trigger manual sync
  app.post("/api/integrations/:id/sync", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const integration = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id))
        .limit(1);

      if (integration.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Integration not found"
        });
      }

      const startTime = new Date();

      // Sync data using sync service
      const syncResult = await syncService.syncIntegration(integration[0]);

      const endTime = new Date();

      // Update last sync info
      await db
        .update(integrations)
        .set({
          lastSyncAt: endTime,
          lastSyncStatus: syncResult.success ? 'success' : 'failed',
          errorMessage: syncResult.success ? null : syncResult.message,
        })
        .where(eq(integrations.id, id));

      // Save sync history
      await db
        .insert(integrationSyncHistory)
        .values({
          integrationId: id,
          integrationName: integration[0].name,
          startTime,
          endTime,
          status: syncResult.success ? 'success' : 'failed',
          recordsImported: syncResult.recordsImported || 0,
          recordsUpdated: syncResult.recordsUpdated || 0,
          recordsDeleted: syncResult.recordsDeleted || 0,
          errors: syncResult.success ? 0 : 1,
          errorMessage: syncResult.message,
          metadata: JSON.stringify(syncResult.metadata || {}),
        });

      res.json(syncResult);
    } catch (error: any) {
      console.error("Error syncing integration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync integration",
        message: error.message
      });
    }
  });

  // GET /api/integrations/sync-history - Get sync history
  app.get("/api/integrations/sync-history", authenticate, async (req: Request, res: Response) => {
    try {
      const { integrationId, limit = 50 } = req.query;

      let query = db
        .select()
        .from(integrationSyncHistory)
        .orderBy(desc(integrationSyncHistory.startTime));

      // Filter by integration if specified
      if (integrationId) {
        query = query.where(eq(integrationSyncHistory.integrationId, integrationId as string));
      }

      // Apply limit
      const history = await query.limit(Number(limit));

      res.json({
        success: true,
        history
      });
    } catch (error: any) {
      console.error("Error fetching sync history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch sync history",
        message: error.message
      });
    }
  });
}
