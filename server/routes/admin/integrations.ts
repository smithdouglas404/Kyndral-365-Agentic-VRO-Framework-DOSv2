/**
 * INTEGRATION MANAGEMENT API
 * Admin endpoints for configuring external data source integrations
 * (Jira, Azure DevOps, ServiceNow, SAP, etc.)
 */

import type { Express, Request, Response } from "express";
import { db } from "../../db.js";
import {
  integrations,
  insertIntegrationSchema,
  type Integration
} from "../../../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export function registerIntegrationRoutes(app: Express) {

  // GET /api/integrations - List all integrations
  app.get("/api/integrations", async (req: Request, res: Response) => {
    try {
      const allIntegrations = await db
        .select()
        .from(integrations)
        .orderBy(desc(integrations.createdAt));

      res.json({
        success: true,
        integrations: allIntegrations
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
  app.get("/api/integrations/:id", async (req: Request, res: Response) => {
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

      res.json({
        success: true,
        integration: integration[0]
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
  app.post("/api/integrations", async (req: Request, res: Response) => {
    try {
      const integrationData = req.body;

      // Validate required fields
      if (!integrationData.name || !integrationData.type) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: name, type"
        });
      }

      // Encrypt credentials before storing (TODO: Implement proper encryption)
      // For now, just store as-is with a warning
      if (integrationData.credentials) {
        console.warn("⚠️  Credentials stored without encryption. TODO: Implement encryption.");
      }

      const newIntegration = await db
        .insert(integrations)
        .values({
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
        })
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
  app.put("/api/integrations/:id", async (req: Request, res: Response) => {
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

      // Update integration
      const updated = await db
        .update(integrations)
        .set({
          name: updateData.name,
          type: updateData.type,
          status: updateData.status,
          connectionDetails: updateData.connectionDetails,
          credentials: updateData.credentials,
          syncSchedule: updateData.syncSchedule,
          fieldMappings: updateData.fieldMappings,
          updatedAt: new Date(),
        })
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
  app.delete("/api/integrations/:id", async (req: Request, res: Response) => {
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
  app.post("/api/integrations/:id/test", async (req: Request, res: Response) => {
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

      // TODO: Implement actual connection testing logic per integration type
      // For now, simulate a test
      const testResult = {
        success: true,
        message: "Connection test successful (simulated)",
        details: {
          type: integration[0].type,
          latency: Math.floor(Math.random() * 200) + 50,
          timestamp: new Date().toISOString(),
        }
      };

      // Update integration status
      await db
        .update(integrations)
        .set({
          status: testResult.success ? 'connected' : 'error',
          lastSyncAt: new Date(),
          lastSyncStatus: testResult.success ? 'success' : 'failed',
          errorMessage: testResult.success ? null : testResult.message,
        })
        .where(eq(integrations.id, id));

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
  app.post("/api/integrations/:id/sync", async (req: Request, res: Response) => {
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

      // TODO: Implement actual sync logic per integration type
      // For now, simulate a sync
      const syncResult = {
        success: true,
        message: "Sync triggered successfully (simulated)",
        details: {
          recordsImported: Math.floor(Math.random() * 100) + 10,
          recordsUpdated: Math.floor(Math.random() * 50),
          errors: 0,
          duration: Math.floor(Math.random() * 5000) + 1000,
          timestamp: new Date().toISOString(),
        }
      };

      // Update last sync info
      await db
        .update(integrations)
        .set({
          lastSyncAt: new Date(),
          lastSyncStatus: syncResult.success ? 'success' : 'failed',
          errorMessage: syncResult.success ? null : syncResult.message,
        })
        .where(eq(integrations.id, id));

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
  app.get("/api/integrations/sync-history", async (req: Request, res: Response) => {
    try {
      // TODO: Implement proper sync history tracking
      // For now, return mock data based on integrations
      const allIntegrations = await db
        .select()
        .from(integrations)
        .orderBy(desc(integrations.lastSyncAt));

      const history = allIntegrations
        .filter(i => i.lastSyncAt !== null)
        .map(i => ({
          id: `${i.id}-sync-${Date.now()}`,
          integrationId: i.id,
          integrationName: i.name,
          startTime: i.lastSyncAt,
          endTime: i.lastSyncAt,
          status: i.lastSyncStatus,
          recordsImported: Math.floor(Math.random() * 100),
          recordsUpdated: Math.floor(Math.random() * 50),
          errors: i.lastSyncStatus === 'failed' ? 1 : 0,
          errorMessage: i.errorMessage,
        }));

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
