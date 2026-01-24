import { Router } from "express";
import type { IStorage } from "../storage";
import { MondayMCP } from "../mcp/MondayMCP";
import { authenticateFirebase } from "../auth/firebaseMiddleware";

export function createMondayMCPRoutes(storage: IStorage): Router {
  const router = Router();

  // Initialize Monday MCP (lazy initialization)
  let mondayMCP: MondayMCP | null = null;

  const getMondayMCP = () => {
    if (!mondayMCP) {
      mondayMCP = new MondayMCP(storage);
    }
    return mondayMCP;
  };

  // All routes require authentication
  router.use(authenticateFirebase);

  /**
   * Test Monday.com connection
   * GET /api/monday-mcp/test
   */
  router.get("/test", async (_req, res) => {
    try {
      const mcp = getMondayMCP();
      const isConnected = await mcp.testConnection();

      const health = mcp.getHealth();
      const metrics = mcp.getMetrics();

      res.json({
        success: isConnected,
        message: isConnected ? "Monday.com connection successful" : "Monday.com connection failed",
        health,
        metrics,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Connection test error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Fetch all boards
   * GET /api/monday-mcp/boards?limit=50&state=active
   */
  router.get("/boards", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const state = (req.query.state as any) || 'active';

      const mcp = getMondayMCP();
      const boards = await mcp.fetchBoards({ limit, state });

      res.json({
        success: true,
        count: boards.length,
        boards,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Fetch boards error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Fetch items from a board
   * GET /api/monday-mcp/boards/:boardId/items?limit=100&page=1
   */
  router.get("/boards/:boardId/items", async (req, res) => {
    try {
      const { boardId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const page = parseInt(req.query.page as string) || 1;

      const mcp = getMondayMCP();
      const items = await mcp.fetchBoardItems(boardId, { limit, page });

      res.json({
        success: true,
        count: items.length,
        items,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Fetch board items error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Fetch a specific item
   * GET /api/monday-mcp/items/:itemId
   */
  router.get("/items/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;

      const mcp = getMondayMCP();
      const item = await mcp.fetchItem(itemId);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json({
        success: true,
        item,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Fetch item error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Create a new item
   * POST /api/monday-mcp/items
   * Body: { boardId, groupId, itemName, columnValues }
   */
  router.post("/items", async (req, res) => {
    try {
      const { boardId, groupId, itemName, columnValues } = req.body;

      if (!boardId || !groupId || !itemName) {
        return res.status(400).json({
          error: "Missing required fields: boardId, groupId, itemName"
        });
      }

      const mcp = getMondayMCP();
      const item = await mcp.createItem(boardId, groupId, itemName, columnValues);

      if (!item) {
        return res.status(500).json({ error: "Failed to create item" });
      }

      res.status(201).json({
        success: true,
        item,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Create item error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Update item column values
   * PUT /api/monday-mcp/items/:itemId
   * Body: { boardId, columnValues }
   */
  router.put("/items/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;
      const { boardId, columnValues } = req.body;

      if (!boardId || !columnValues) {
        return res.status(400).json({
          error: "Missing required fields: boardId, columnValues"
        });
      }

      const mcp = getMondayMCP();
      const success = await mcp.updateItemColumnValues(itemId, boardId, columnValues);

      if (!success) {
        return res.status(500).json({ error: "Failed to update item" });
      }

      res.json({
        success: true,
        message: "Item updated successfully",
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Update item error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Archive an item
   * POST /api/monday-mcp/items/:itemId/archive
   */
  router.post("/items/:itemId/archive", async (req, res) => {
    try {
      const { itemId } = req.params;

      const mcp = getMondayMCP();
      const success = await mcp.archiveItem(itemId);

      if (!success) {
        return res.status(500).json({ error: "Failed to archive item" });
      }

      res.json({
        success: true,
        message: "Item archived successfully",
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Archive item error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Delete an item
   * DELETE /api/monday-mcp/items/:itemId
   */
  router.delete("/items/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;

      const mcp = getMondayMCP();
      const success = await mcp.deleteItem(itemId);

      if (!success) {
        return res.status(500).json({ error: "Failed to delete item" });
      }

      res.json({
        success: true,
        message: "Item deleted successfully",
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Delete item error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Fetch updates (comments) for an item
   * GET /api/monday-mcp/items/:itemId/updates?limit=10
   */
  router.get("/items/:itemId/updates", async (req, res) => {
    try {
      const { itemId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const mcp = getMondayMCP();
      const updates = await mcp.fetchUpdates(itemId, limit);

      res.json({
        success: true,
        count: updates.length,
        updates,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Fetch updates error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Create an update (comment) for an item
   * POST /api/monday-mcp/items/:itemId/updates
   * Body: { body }
   */
  router.post("/items/:itemId/updates", async (req, res) => {
    try {
      const { itemId } = req.params;
      const { body } = req.body;

      if (!body) {
        return res.status(400).json({ error: "Missing required field: body" });
      }

      const mcp = getMondayMCP();
      const update = await mcp.createUpdate(itemId, body);

      if (!update) {
        return res.status(500).json({ error: "Failed to create update" });
      }

      res.status(201).json({
        success: true,
        update,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Create update error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Search items across boards
   * GET /api/monday-mcp/search?q=project&boardIds=123,456&limit=50
   */
  router.get("/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const boardIds = req.query.boardIds
        ? (req.query.boardIds as string).split(',')
        : undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!query) {
        return res.status(400).json({ error: "Missing required parameter: q (search query)" });
      }

      const mcp = getMondayMCP();
      const items = await mcp.searchItems(query, { boardIds, limit });

      res.json({
        success: true,
        count: items.length,
        items,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Search items error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Fetch workspace boards
   * GET /api/monday-mcp/workspaces/:workspaceId/boards
   */
  router.get("/workspaces/:workspaceId/boards", async (req, res) => {
    try {
      const { workspaceId } = req.params;

      const mcp = getMondayMCP();
      const boards = await mcp.fetchWorkspaceBoards(workspaceId);

      res.json({
        success: true,
        count: boards.length,
        boards,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Fetch workspace boards error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Create a new board
   * POST /api/monday-mcp/boards
   * Body: { boardName, boardKind, workspaceId }
   */
  router.post("/boards", async (req, res) => {
    try {
      const { boardName, boardKind, workspaceId } = req.body;

      if (!boardName || !boardKind) {
        return res.status(400).json({
          error: "Missing required fields: boardName, boardKind"
        });
      }

      if (!['public', 'private', 'share'].includes(boardKind)) {
        return res.status(400).json({
          error: "Invalid boardKind. Must be: public, private, or share"
        });
      }

      const mcp = getMondayMCP();
      const board = await mcp.createBoard(boardName, boardKind, workspaceId);

      if (!board) {
        return res.status(500).json({ error: "Failed to create board" });
      }

      res.status(201).json({
        success: true,
        board,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Create board error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get current user info
   * GET /api/monday-mcp/me
   */
  router.get("/me", async (_req, res) => {
    try {
      const mcp = getMondayMCP();
      const user = await mcp.fetchCurrentUser();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Fetch current user error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get MCP health and metrics
   * GET /api/monday-mcp/health
   */
  router.get("/health", async (_req, res) => {
    try {
      const mcp = getMondayMCP();
      const health = mcp.getHealth();
      const metrics = mcp.getMetrics();

      res.json({
        success: true,
        health,
        metrics,
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Health check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Reset circuit breaker (admin only)
   * POST /api/monday-mcp/reset-circuit
   */
  router.post("/reset-circuit", async (_req, res) => {
    try {
      const mcp = getMondayMCP();
      mcp.resetCircuitBreaker();

      res.json({
        success: true,
        message: "Circuit breaker reset successfully",
      });
    } catch (error: any) {
      console.error("[MondayMCP Routes] Reset circuit error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
