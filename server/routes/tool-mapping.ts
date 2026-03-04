/**
 * PROJECT TOOL MAPPING API ROUTES
 *
 * Manages project-to-tool mappings and multi-tool sync:
 * - View and configure tool mappings
 * - Sync individual projects
 * - Get tool capabilities
 * - Understand AIP value proposition
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  getProjectToolMappingService,
  TOOL_CAPABILITIES,
  DEFAULT_DATA_MAPPINGS,
  type PMTool,
  type Methodology,
} from '../services/ProjectToolMapping.js';
import { JiraClient, createJiraClientFromAdapter } from '../jiraClient.js';
import { MondayClient } from '../mondayClient.js';

const router = Router();
const mappingService = getProjectToolMappingService();

/**
 * GET /api/tools/mappings
 * Get all project-to-tool mappings
 */
router.get('/mappings', (req: Request, res: Response) => {
  try {
    const { tool, methodology } = req.query;

    let mappings = mappingService.getAllMappings();

    if (tool && typeof tool === 'string') {
      mappings = mappings.filter(m => m.tool === tool);
    }

    if (methodology && typeof methodology === 'string') {
      mappings = mappings.filter(m => m.methodology === methodology);
    }

    res.json({
      success: true,
      mappings,
      count: mappings.length,
      byTool: {
        jira: mappings.filter(m => m.tool === 'jira').length,
        monday: mappings.filter(m => m.tool === 'monday').length,
        openproject: mappings.filter(m => m.tool === 'openproject').length,
      },
      byMethodology: {
        safe: mappings.filter(m => m.methodology === 'safe').length,
        scrum: mappings.filter(m => m.methodology === 'scrum').length,
        kanban: mappings.filter(m => m.methodology === 'kanban').length,
        waterfall: mappings.filter(m => m.methodology === 'waterfall').length,
        hybrid: mappings.filter(m => m.methodology === 'hybrid').length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tools/mappings/:projectId
 * Get mapping for a specific project
 */
router.get('/mappings/:projectId', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const mapping = mappingService.getMapping(projectId);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: 'Project mapping not found',
      });
    }

    const capabilities = mappingService.getToolCapabilities(mapping.tool);
    const warnings = mappingService.getDataDeprecationWarnings(mapping.tool);

    res.json({
      success: true,
      mapping,
      toolCapabilities: capabilities,
      dataWarnings: warnings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tools/mappings
 * Create a new project-to-tool mapping
 */
router.post('/mappings', (req: Request, res: Response) => {
  try {
    const {
      projectId,
      projectName,
      tool,
      externalProjectId,
      externalProjectKey,
      adapterId,
      methodology,
      syncEnabled,
    } = req.body;

    if (!projectId || !projectName || !tool || !externalProjectId || !adapterId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, projectName, tool, externalProjectId, adapterId',
      });
    }

    const validTools: PMTool[] = ['jira', 'monday', 'openproject'];
    if (!validTools.includes(tool)) {
      return res.status(400).json({
        success: false,
        error: `Invalid tool. Must be one of: ${validTools.join(', ')}`,
      });
    }

    mappingService.addMapping({
      projectId,
      projectName,
      tool,
      externalProjectId,
      externalProjectKey,
      adapterId,
      methodology: methodology || 'scrum',
      syncEnabled: syncEnabled !== false,
      dataMapping: DEFAULT_DATA_MAPPINGS[tool as PMTool],
    });

    res.json({
      success: true,
      message: `Project ${projectId} mapped to ${tool}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tools/capabilities
 * Get capabilities for all tools
 */
router.get('/capabilities', (req: Request, res: Response) => {
  res.json({
    success: true,
    capabilities: TOOL_CAPABILITIES,
  });
});

/**
 * GET /api/tools/capabilities/:tool
 * Get capabilities for a specific tool
 */
router.get('/capabilities/:tool', (req: Request, res: Response) => {
  try {
    const { tool } = req.params;

    if (!TOOL_CAPABILITIES[tool as PMTool]) {
      return res.status(404).json({
        success: false,
        error: `Unknown tool: ${tool}`,
      });
    }

    const capabilities = TOOL_CAPABILITIES[tool as PMTool];
    const warnings = mappingService.getDataDeprecationWarnings(tool as PMTool);
    const defaultMapping = DEFAULT_DATA_MAPPINGS[tool as PMTool];

    res.json({
      success: true,
      tool,
      capabilities,
      dataWarnings: warnings,
      defaultDataMapping: defaultMapping,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tools/recommend
 * Get recommended tool for a methodology
 */
router.get('/recommend', (req: Request, res: Response) => {
  try {
    const { methodology } = req.query;

    if (!methodology || typeof methodology !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'methodology query parameter required',
      });
    }

    const validMethodologies: Methodology[] = ['safe', 'scrum', 'kanban', 'waterfall', 'hybrid'];
    if (!validMethodologies.includes(methodology as Methodology)) {
      return res.status(400).json({
        success: false,
        error: `Invalid methodology. Must be one of: ${validMethodologies.join(', ')}`,
      });
    }

    const recommended = mappingService.getRecommendedTool(methodology as Methodology);
    const capabilities = TOOL_CAPABILITIES[recommended];
    const warnings = mappingService.getDataDeprecationWarnings(recommended);

    res.json({
      success: true,
      methodology,
      recommendedTool: recommended,
      capabilities,
      dataWarnings: warnings,
      reasoning: getRecommendationReasoning(methodology as Methodology, recommended),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tools/sync/:projectId
 * Sync a project from its mapped tool
 */
router.post('/sync/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const mapping = mappingService.getMapping(projectId);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: 'Project mapping not found',
      });
    }

    if (!mapping.syncEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Sync is disabled for this project',
      });
    }

    let result;

    switch (mapping.tool) {
      case 'jira': {
        const client = await createJiraClientFromAdapter(mapping.adapterId);
        if (!client) {
          return res.status(500).json({ success: false, error: 'Failed to create Jira client' });
        }
        result = await client.syncProject(mapping.externalProjectId, mapping.adapterId);
        break;
      }

      case 'monday':
      case 'openproject':
        return res.status(501).json({
          success: false,
          error: `${mapping.tool} sync not yet implemented`,
        });

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown tool: ${mapping.tool}`,
        });
    }

    // Update last sync timestamp
    mapping.lastSyncAt = new Date();

    res.json({
      success: true,
      projectId,
      tool: mapping.tool,
      syncResult: result,
      syncedAt: mapping.lastSyncAt,
    });
  } catch (error: any) {
    console.error('Project sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tools/aip-value
 * Get explanation of AIP value proposition for multi-tool integration
 */
router.get('/aip-value', (req: Request, res: Response) => {
  res.json({
    success: true,
    explanation: mappingService.getAIPValueExplanation(),
    summary: {
      problem: 'Different teams use different PM tools with different data models',
      solution: 'Palantir AIP provides semantic translation layer',
      benefits: [
        'Single portfolio view across all tools',
        'Consistent metrics regardless of source',
        'Teams keep preferred tools',
        'AI-powered insights on unified data',
      ],
      supportedTools: ['Jira', 'Monday.com', 'OpenProject'],
      supportedMethodologies: ['SAFe 6.0', 'Scrum', 'Kanban', 'Waterfall', 'Hybrid'],
    },
  });
});

// Helper function
function getRecommendationReasoning(methodology: Methodology, tool: PMTool): string {
  const reasons: Record<string, string> = {
    'safe-openproject': 'OpenProject provides SAFe support with work packages, Epics, User Stories, and sprint planning capabilities.',
    'scrum-jira': 'Jira is the enterprise standard for Scrum with robust sprint planning, backlog management, and extensive integrations.',
    'kanban-monday': 'Monday.com excels at visual Kanban boards with intuitive drag-and-drop and beautiful visualizations.',
    'waterfall-openproject': 'OpenProject provides traditional Gantt charts and work package management ideal for waterfall projects.',
    'hybrid-jira': 'Jira supports both Scrum and Kanban boards, making it flexible for hybrid approaches.',
  };

  return reasons[`${methodology}-${tool}`] || `${tool} best supports ${methodology} methodology`;
}

export default router;
