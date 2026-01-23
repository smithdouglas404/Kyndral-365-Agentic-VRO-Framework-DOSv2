import { Router } from "express";
import type { IStorage } from "../storage";
import { DataIngestionOrchestrator, JiraAdapter, AzureDevOpsAdapter, MSProjectAdapter } from "../lib/DataIngestionAdapter";

export function createDataIngestionRoutes(storage: IStorage): Router {
  const router = Router();
  const orchestrator = new DataIngestionOrchestrator(storage);

  // Trigger sync for all configured systems
  router.post("/sync/all", async (req, res) => {
    try {
      const config = req.body.config || {};
      await orchestrator.syncAllProjects(config);
      res.json({ success: true, message: "Data ingestion sync triggered" });
    } catch (error: any) {
      console.error("Data ingestion sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sync Jira project
  router.post("/sync/jira", async (req, res) => {
    try {
      const { jiraUrl, authToken, projectKey } = req.body;

      if (!jiraUrl || !authToken || !projectKey) {
        return res.status(400).json({ error: "Missing required fields: jiraUrl, authToken, projectKey" });
      }

      const adapter = new JiraAdapter(jiraUrl, authToken, storage);
      const success = await adapter.syncSprintData(projectKey);

      res.json({ success, message: success ? "Jira sync complete" : "Jira sync failed" });
    } catch (error: any) {
      console.error("Jira sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sync Azure DevOps
  router.post("/sync/azure", async (req, res) => {
    try {
      const { organization, project, pat, iterationPath } = req.body;

      if (!organization || !project || !pat || !iterationPath) {
        return res.status(400).json({ error: "Missing required fields: organization, project, pat, iterationPath" });
      }

      const adapter = new AzureDevOpsAdapter(organization, project, pat, storage);
      const success = await adapter.syncSprintData(iterationPath);

      res.json({ success, message: success ? "Azure DevOps sync complete" : "Azure DevOps sync failed" });
    } catch (error: any) {
      console.error("Azure DevOps sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload MS Project XML
  router.post("/sync/msproject", async (req, res) => {
    try {
      const { xmlContent } = req.body;

      if (!xmlContent) {
        return res.status(400).json({ error: "Missing XML content" });
      }

      const adapter = new MSProjectAdapter(storage);
      const evmDataArray = await adapter.parseXMLExport(xmlContent);

      let syncedCount = 0;
      for (const evmData of evmDataArray) {
        const success = await adapter.syncEVMData(evmData);
        if (success) syncedCount++;
      }

      res.json({
        success: true,
        message: `Synced ${syncedCount}/${evmDataArray.length} projects from MS Project`,
        syncedCount,
        totalCount: evmDataArray.length
      });
    } catch (error: any) {
      console.error("MS Project sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get sync status
  router.get("/sync/status", async (_req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT
          COUNT(*) as total_projects,
          COUNT(*) FILTER (WHERE cpi_value IS NOT NULL) as with_evm,
          COUNT(*) FILTER (WHERE velocity IS NOT NULL) as with_sprint,
          COUNT(*) FILTER (WHERE cpi_value IS NULL) as missing_evm,
          COUNT(*) FILTER (WHERE velocity IS NULL) as missing_sprint
        FROM projects
        WHERE status = 'active'
      `);

      res.json({ success: true, status: result.rows[0] });
    } catch (error: any) {
      console.error("Sync status error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
