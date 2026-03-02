/**
 * ONTOLOGY EXPLORER API
 *
 * Browse, search, and manage Palantir Ontology objects
 * Provides a user-friendly interface to the ontology
 */

import { Router } from "express";
import { OntologyDataProvider } from "../services/OntologyDataProvider.js";
import { getPalantirActionsService } from "../services/PalantirActionsService.js";
import { getPalantirService } from "../mcp/MCPServiceFactory.js";

const router = Router();

// ============================================================================
// OBJECT TYPES (Schema)
// ============================================================================

/**
 * GET /api/ontology-explorer/types
 * List all object types in the ontology
 */
router.get("/types", async (req, res) => {
  try {
    const palantir = getPalantirService();

    // Get object types from Palantir or use known types
    let objectTypes: any[] = [];

    if (palantir?.listObjectTypes) {
      objectTypes = await palantir.listObjectTypes();
    } else {
      // Fallback to known types from our ontology model
      objectTypes = [
        { apiName: "Project", displayName: "Project", description: "Project work items", category: "work" },
        { apiName: "Risk", displayName: "Risk", description: "Risk items", category: "governance" },
        { apiName: "Budget", displayName: "Budget", description: "Budget allocations", category: "financial" },
        { apiName: "Team", displayName: "Team", description: "Team definitions", category: "organization" },
        { apiName: "Objective", displayName: "Objective", description: "OKR Objectives", category: "strategy" },
        { apiName: "KeyResult", displayName: "Key Result", description: "OKR Key Results", category: "strategy" },
        { apiName: "Milestone", displayName: "Milestone", description: "Project milestones", category: "work" },
        { apiName: "Dependency", displayName: "Dependency", description: "Cross-project dependencies", category: "work" },
        { apiName: "Intervention", displayName: "Intervention", description: "Agent interventions", category: "governance" },
        { apiName: "Alert", displayName: "Alert", description: "System alerts", category: "governance" },
        { apiName: "Portfolio", displayName: "Portfolio", description: "Portfolio groupings", category: "organization" },
        { apiName: "ValueStream", displayName: "Value Stream", description: "Value streams", category: "organization" },
        { apiName: "ART", displayName: "ART", description: "Agile Release Train", category: "organization" },
        { apiName: "Epic", displayName: "Epic", description: "Large initiatives", category: "work" },
        { apiName: "Feature", displayName: "Feature", description: "Feature work items", category: "work" },
        { apiName: "Story", displayName: "Story", description: "User stories", category: "work" },
        { apiName: "Task", displayName: "Task", description: "Task work items", category: "work" },
        { apiName: "BusinessRule", displayName: "Business Rule", description: "Rule definitions", category: "governance" },
        { apiName: "Threshold", displayName: "Threshold", description: "Alert thresholds", category: "governance" },
        { apiName: "Workflow", displayName: "Workflow", description: "Workflow definitions", category: "automation" },
      ];
    }

    // Group by category
    const byCategory = objectTypes.reduce((acc: any, type: any) => {
      const cat = type.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(type);
      return acc;
    }, {});

    res.json({
      success: true,
      objectTypes,
      byCategory,
      total: objectTypes.length,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to list types:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ontology-explorer/types/:typeName/schema
 * Get schema/properties for an object type
 */
router.get("/types/:typeName/schema", async (req, res) => {
  try {
    const { typeName } = req.params;
    const palantir = getPalantirService();

    let schema: any = null;

    if (palantir?.getObjectTypeSchema) {
      schema = await palantir.getObjectTypeSchema(typeName);
    } else {
      // Fallback schemas
      const schemas: Record<string, any> = {
        Project: {
          properties: [
            { name: "projectId", type: "string", description: "Unique identifier" },
            { name: "name", type: "string", description: "Project name" },
            { name: "description", type: "string", description: "Project description" },
            { name: "status", type: "enum", values: ["green", "amber", "red"], description: "Health status" },
            { name: "priority", type: "enum", values: ["critical", "high", "medium", "low"] },
            { name: "budgetTotal", type: "number", description: "Total budget" },
            { name: "budgetSpent", type: "number", description: "Spent budget" },
            { name: "progress", type: "number", description: "Completion percentage" },
            { name: "startDate", type: "date", description: "Start date" },
            { name: "endDate", type: "date", description: "End date" },
            { name: "portfolioId", type: "link", linkType: "Portfolio" },
            { name: "teamId", type: "link", linkType: "Team" },
          ],
          links: ["Portfolio", "Team", "Risk", "Milestone", "Dependency"],
        },
        Risk: {
          properties: [
            { name: "riskId", type: "string", description: "Unique identifier" },
            { name: "title", type: "string", description: "Risk title" },
            { name: "description", type: "string", description: "Risk description" },
            { name: "severity", type: "enum", values: ["critical", "high", "medium", "low"] },
            { name: "probability", type: "number", description: "Probability (0-1)" },
            { name: "impact", type: "number", description: "Impact score" },
            { name: "status", type: "enum", values: ["open", "mitigating", "closed"] },
            { name: "projectId", type: "link", linkType: "Project" },
          ],
          links: ["Project"],
        },
      };
      schema = schemas[typeName] || { properties: [], links: [] };
    }

    res.json({
      success: true,
      typeName,
      schema,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to get schema:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// OBJECT QUERIES
// ============================================================================

/**
 * GET /api/ontology-explorer/objects/:typeName
 * Query objects of a specific type
 */
router.get("/objects/:typeName", async (req, res) => {
  try {
    const { typeName } = req.params;
    const { search, filters, orderBy, limit = 50, offset = 0 } = req.query;

    // Parse filters from query string
    let parsedFilters: any[] = [];
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters as string);
      } catch (e) {
        // Single filter format: field:operator:value
        const parts = (filters as string).split(":");
        if (parts.length === 3) {
          parsedFilters = [{ field: parts[0], operator: parts[1], value: parts[2] }];
        }
      }
    }

    // Add search filter if provided
    if (search) {
      parsedFilters.push({ field: "name", operator: "contains", value: search });
    }

    // Parse orderBy
    let parsedOrderBy: any[] = [];
    if (orderBy) {
      const [field, direction] = (orderBy as string).split(":");
      parsedOrderBy = [{ field, direction: direction || "asc" }];
    }

    const result = await OntologyDataProvider.query(typeName, {
      filters: parsedFilters,
      orderBy: parsedOrderBy,
      pageSize: Number(limit),
      pageToken: offset ? String(offset) : undefined,
    });

    res.json({
      success: true,
      typeName,
      objects: result.data,
      total: result.data.length,
      source: result.source,
      hasMore: result.data.length === Number(limit),
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to query objects:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ontology-explorer/objects/:typeName/:objectId
 * Get a single object by ID
 */
router.get("/objects/:typeName/:objectId", async (req, res) => {
  try {
    const { typeName, objectId } = req.params;

    // Determine the ID field name (usually typeName + 'Id' in camelCase)
    const idField = typeName.charAt(0).toLowerCase() + typeName.slice(1) + "Id";

    const result = await OntologyDataProvider.query(typeName, {
      filters: [{ field: idField, operator: "eq", value: objectId }],
      pageSize: 1,
    });

    if (result.data.length === 0) {
      return res.status(404).json({ success: false, error: "Object not found" });
    }

    res.json({
      success: true,
      typeName,
      object: result.data[0],
      source: result.source,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to get object:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ontology-explorer/objects/:typeName/:objectId/links
 * Get linked objects
 */
router.get("/objects/:typeName/:objectId/links", async (req, res) => {
  try {
    const { typeName, objectId } = req.params;
    const { linkType } = req.query;

    // Get the object first
    const idField = typeName.charAt(0).toLowerCase() + typeName.slice(1) + "Id";
    const objectResult = await OntologyDataProvider.query(typeName, {
      filters: [{ field: idField, operator: "eq", value: objectId }],
      pageSize: 1,
    });

    if (objectResult.data.length === 0) {
      return res.status(404).json({ success: false, error: "Object not found" });
    }

    const object = objectResult.data[0];
    const links: Record<string, any[]> = {};

    // Find linked objects based on foreign keys in the object
    const linkFields = Object.keys(object).filter(k => k.endsWith("Id") && k !== idField);

    for (const field of linkFields) {
      const linkedTypeName = field.replace("Id", "");
      const linkedTypeCapitalized = linkedTypeName.charAt(0).toUpperCase() + linkedTypeName.slice(1);

      if (linkType && linkedTypeCapitalized !== linkType) continue;

      try {
        const linkedResult = await OntologyDataProvider.query(linkedTypeCapitalized, {
          filters: [{ field: field, operator: "eq", value: object[field] }],
          pageSize: 10,
        });
        if (linkedResult.data.length > 0) {
          links[linkedTypeCapitalized] = linkedResult.data;
        }
      } catch (e) {
        // Type doesn't exist, skip
      }
    }

    // Also find objects that link TO this object
    const reverseLinks: Record<string, any[]> = {};
    const typesToCheck = ["Project", "Risk", "Milestone", "Task", "Feature", "Story"];

    for (const checkType of typesToCheck) {
      if (checkType === typeName) continue;
      if (linkType && checkType !== linkType) continue;

      try {
        const reverseField = typeName.charAt(0).toLowerCase() + typeName.slice(1) + "Id";
        const reverseResult = await OntologyDataProvider.query(checkType, {
          filters: [{ field: reverseField, operator: "eq", value: objectId }],
          pageSize: 20,
        });
        if (reverseResult.data.length > 0) {
          reverseLinks[checkType] = reverseResult.data;
        }
      } catch (e) {
        // Skip
      }
    }

    res.json({
      success: true,
      typeName,
      objectId,
      outgoingLinks: links,
      incomingLinks: reverseLinks,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to get links:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// OBJECT MUTATIONS (via Palantir Actions)
// ============================================================================

/**
 * POST /api/ontology-explorer/objects/:typeName
 * Create a new object
 */
router.post("/objects/:typeName", async (req, res) => {
  try {
    const { typeName } = req.params;
    const data = req.body;

    const actionsService = getPalantirActionsService();
    const actionName = `ri.actions..action.create-${typeName.toLowerCase()}`;

    const result = await actionsService.executeAction(actionName, {
      ...data,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: result.success,
      typeName,
      objectRid: result.objectRid,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to create object:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/ontology-explorer/objects/:typeName/:objectId
 * Update an object
 */
router.put("/objects/:typeName/:objectId", async (req, res) => {
  try {
    const { typeName, objectId } = req.params;
    const data = req.body;

    const actionsService = getPalantirActionsService();
    const actionName = `ri.actions..action.update-${typeName.toLowerCase()}`;
    const idField = typeName.charAt(0).toLowerCase() + typeName.slice(1) + "Id";

    const result = await actionsService.executeAction(actionName, {
      [idField]: objectId,
      ...data,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: result.success,
      typeName,
      objectId,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to update object:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/ontology-explorer/objects/:typeName/:objectId
 * Delete an object
 */
router.delete("/objects/:typeName/:objectId", async (req, res) => {
  try {
    const { typeName, objectId } = req.params;

    const actionsService = getPalantirActionsService();
    const actionName = `ri.actions..action.delete-${typeName.toLowerCase()}`;
    const idField = typeName.charAt(0).toLowerCase() + typeName.slice(1) + "Id";

    const result = await actionsService.executeAction(actionName, {
      [idField]: objectId,
    });

    res.json({
      success: result.success,
      typeName,
      objectId,
      deleted: result.success,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Failed to delete object:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SEARCH
// ============================================================================

/**
 * GET /api/ontology-explorer/search
 * Search across all object types
 */
router.get("/search", async (req, res) => {
  try {
    const { q, types, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: "Search query 'q' is required" });
    }

    const searchTypes = types
      ? (types as string).split(",")
      : ["Project", "Risk", "Team", "Objective", "Epic", "Feature"];

    const results: Record<string, any[]> = {};
    let totalCount = 0;

    for (const typeName of searchTypes) {
      try {
        const result = await OntologyDataProvider.query(typeName, {
          filters: [{ field: "name", operator: "contains", value: q }],
          pageSize: Math.ceil(Number(limit) / searchTypes.length),
        });

        if (result.data.length > 0) {
          results[typeName] = result.data;
          totalCount += result.data.length;
        }
      } catch (e) {
        // Type doesn't exist or search failed, skip
      }
    }

    res.json({
      success: true,
      query: q,
      results,
      totalCount,
      typesSearched: searchTypes,
    });
  } catch (error: any) {
    console.error("[OntologyExplorer] Search failed:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
