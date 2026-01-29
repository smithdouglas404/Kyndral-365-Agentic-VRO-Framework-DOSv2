/**
 * POLICY-AS-CODE MCP SERVER ROUTES
 *
 * HTTP endpoints that expose Policy MCP Server tools for Langflow agents to call.
 * All agents can connect to these endpoints to query compliance/regulatory/SOP rules.
 *
 * Endpoints:
 * - POST /api/policy-mcp/query - Query policies by filters
 * - GET /api/policy-mcp/:policyId - Get detailed policy
 * - POST /api/policy-mcp/check-compliance - Check compliance for entity/action
 * - GET /api/policy-mcp/agent/:agentType/rules - Get rules for agent
 * - GET /api/policy-mcp/applicable/:domain - Get applicable policies for domain
 * - GET /api/policy-mcp/stats - Get policy system statistics
 * - GET /api/policy-mcp/health - Get MCP server health
 */

import type { Express, Request, Response } from 'express';
import { getPolicyMCPServer } from '../mcp/PolicyMCPServer.js';
import type { IStorage } from '../storage.js';

export function registerPolicyMCPRoutes(app: Express, storage: IStorage): void {
  const policyMCP = getPolicyMCPServer(storage);

  /**
   * POST /api/policy-mcp/query
   * Query policies by filters (status, framework, type, search term)
   */
  app.post('/api/policy-mcp/query', async (req: Request, res: Response) => {
    try {
      const query = req.body;

      console.log(`[PolicyMCP] Query policies:`, query);

      const policies = await policyMCP.queryPolicies(query);

      res.json({
        success: true,
        policies,
        count: policies.length,
      });
    } catch (error: any) {
      console.error('[PolicyMCP] Query error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy-mcp/:policyId
   * Get detailed policy by ID with full code and associated rules/attributes
   */
  app.get('/api/policy-mcp/:policyId', async (req: Request, res: Response) => {
    try {
      const { policyId } = req.params;

      console.log(`[PolicyMCP] Get policy: ${policyId}`);

      const policy = await policyMCP.getPolicy(policyId);

      res.json({
        success: true,
        policy,
      });
    } catch (error: any) {
      console.error('[PolicyMCP] Get policy error:', error.message);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/policy-mcp/check-compliance
   * Check if entity/action complies with active policies
   */
  app.post('/api/policy-mcp/check-compliance', async (req: Request, res: Response) => {
    try {
      const check = req.body;

      if (!check.entity || !check.entityType || !check.action) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: entity, entityType, action',
        });
      }

      console.log(`[PolicyMCP] Check compliance: ${check.entity} - ${check.action}`);

      const complianceResult = await policyMCP.checkCompliance(check);

      res.json({
        success: true,
        compliance: complianceResult,
      });
    } catch (error: any) {
      console.error('[PolicyMCP] Compliance check error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy-mcp/agent/:agentType/rules
   * Get all active rules for a specific agent type
   */
  app.get('/api/policy-mcp/agent/:agentType/rules', async (req: Request, res: Response) => {
    try {
      const { agentType } = req.params;

      console.log(`[PolicyMCP] Get rules for agent: ${agentType}`);

      const rules = await policyMCP.getRulesForAgent(agentType);

      res.json({
        success: true,
        agentType,
        rules,
        count: rules.length,
      });
    } catch (error: any) {
      console.error('[PolicyMCP] Get agent rules error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy-mcp/applicable/:domain
   * Get policies applicable to a specific domain/entity type
   */
  app.get('/api/policy-mcp/applicable/:domain', async (req: Request, res: Response) => {
    try {
      const { domain } = req.params;
      const { entityType } = req.query;

      console.log(`[PolicyMCP] Get applicable policies for domain: ${domain}`);

      const policies = await policyMCP.getApplicablePolicies(domain, entityType as string | undefined);

      res.json({
        success: true,
        domain,
        entityType,
        policies,
        count: policies.length,
      });
    } catch (error: any) {
      console.error('[PolicyMCP] Get applicable policies error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy-mcp/stats
   * Get policy system statistics
   */
  app.get('/api/policy-mcp/stats', async (req: Request, res: Response) => {
    try {
      console.log(`[PolicyMCP] Get policy stats`);

      const stats = await policyMCP.getPolicyStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error('[PolicyMCP] Get stats error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/policy-mcp/health
   * Get MCP server health status
   */
  app.get('/api/policy-mcp/health', async (req: Request, res: Response) => {
    try {
      const health = policyMCP.getHealth();
      const metrics = policyMCP.getMetrics();

      res.json({
        success: true,
        health,
        metrics,
        serverName: 'PolicyMCPServer',
      });
    } catch (error: any) {
      console.error('[PolicyMCP] Health check error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  console.log('[PolicyMCP] Routes registered');
}
