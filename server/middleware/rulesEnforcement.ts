/**
 * RULES ENFORCEMENT MIDDLEWARE
 *
 * SOURCE OF TRUTH: PALANTIR FOUNDRY
 *
 * Intercepts entity create/update operations and enforces governance rules.
 * Uses PalantirRulesEngine for evaluation and Palantir for audit logging.
 */

import type { Request, Response, NextFunction } from 'express';
import { enforceRules, hasPendingApproval } from '../services/PalantirRulesEngine.js';

/**
 * Middleware to enforce rules on entity operations
 *
 * Usage:
 * router.post('/api/projects', enforceRulesMiddleware('project', 'create'), async (req, res) => { ... });
 * router.put('/api/projects/:id', enforceRulesMiddleware('project', 'update'), async (req, res) => { ... });
 */
export function enforceRulesMiddleware(
  entityType: string,
  operation: 'create' | 'update' | 'delete'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rules enforcement for certain routes or users if needed
      if (req.headers['x-skip-rules'] === 'true') {
        return next();
      }

      // Get entity ID from params or generate for create operations
      const entityId = req.params.id || req.body.id || generateTempId();

      // Get company ID from request (from auth or body)
      const companyId = req.user?.companyId || req.body.companyId;

      if (!companyId) {
        return res.status(400).json({
          error: 'Company ID required for rules enforcement'
        });
      }

      // Check if entity already has a pending approval
      if (operation === 'update') {
        const hasPending = await hasPendingApproval(entityType, entityId);
        if (hasPending) {
          return res.status(409).json({
            error: 'Pending approval exists',
            message: `This ${entityType} has a pending approval request. Please wait for approval or cancel the pending request.`
          });
        }
      }

      // Enforce rules
      const result = await enforceRules({
        entityType: entityType as any,
        entityId,
        entityData: req.body,
        operation,
        userId: req.user?.id,
        companyId
      });

      // Store enforcement result in request for later use
      req.rulesEnforcement = result;

      // Handle enforcement decision
      if (!result.allowed) {
        if (result.requiresApproval) {
          return res.status(202).json({
            status: 'pending_approval',
            message: 'Operation requires approval before it can proceed',
            approvalRequestId: result.approvalRequestId,
            warnings: result.warnings
          });
        } else {
          return res.status(403).json({
            status: 'blocked',
            message: 'Operation blocked by governance rules',
            blockedBy: result.blockedBy
          });
        }
      }

      // Operation allowed - continue with warnings if any
      if (result.warnings && result.warnings.length > 0) {
        req.rulesWarnings = result.warnings;
      }

      next();
    } catch (error: any) {
      console.error('[Rules Enforcement] Error:', error);
      // On error, fail open (allow operation) to prevent system lockup
      // But log the error for investigation
      next();
    }
  };
}

/**
 * Generate temporary ID for create operations
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extend Express Request type to include rules enforcement results
 */
declare global {
  namespace Express {
    interface Request {
      rulesEnforcement?: any;
      rulesWarnings?: any[];
    }
  }
}
