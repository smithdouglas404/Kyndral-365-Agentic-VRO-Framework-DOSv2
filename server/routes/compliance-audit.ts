import { Router, Request, Response } from 'express';
import type { IStorage } from '../storage.js';

export function createComplianceAuditRoutes(storage: IStorage): Router {
  const router = Router();

  router.get('/overview', async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');

      const frameworks = [
        { id: 'iso27001', name: 'ISO 27001', category: 'Security', compliance: 87, controls: 114, passedControls: 99, lastAudit: '2026-03-15' },
        { id: 'sox', name: 'SOX', category: 'Financial', compliance: 92, controls: 68, passedControls: 63, lastAudit: '2026-03-01' },
        { id: 'gdpr', name: 'GDPR', category: 'Privacy', compliance: 85, controls: 45, passedControls: 38, lastAudit: '2026-02-20' },
        { id: 'nist', name: 'NIST CSF', category: 'Security', compliance: 78, controls: 98, passedControls: 76, lastAudit: '2026-03-10' },
        { id: 'itil', name: 'ITIL v4', category: 'Service Mgmt', compliance: 90, controls: 34, passedControls: 31, lastAudit: '2026-03-20' },
      ];

      const overallCompliance = Math.round(frameworks.reduce((s, f) => s + f.compliance, 0) / frameworks.length);

      const auditTrail = Array.from({ length: 20 }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - i * 4);
        const eventTypes = ['policy_check', 'rule_trigger', 'approval_request', 'governance_decision', 'exception_granted', 'compliance_scan'];
        const eventType = eventTypes[i % eventTypes.length];
        const agents = ['governance', 'risk', 'pmo', 'finops'];
        const agent = agents[i % agents.length];
        const statuses = ['passed', 'passed', 'passed', 'flagged', 'approved'];
        const status = statuses[i % statuses.length];
        const project = activeProjects[i % activeProjects.length];

        return {
          id: `audit-${Date.now()}-${i}`,
          timestamp: date.toISOString(),
          eventType,
          agent,
          projectId: project?.id || '',
          projectName: project?.name || 'System',
          description: getAuditDescription(eventType, project?.name || 'System'),
          status,
          framework: frameworks[i % frameworks.length].name,
          severity: status === 'flagged' ? 'medium' : 'low',
          details: `Automated ${eventType.replace('_', ' ')} by ${agent} agent`,
        };
      });

      const policyViolations = [
        { id: 'v1', policy: 'Budget Threshold Policy', severity: 'high', projectName: activeProjects[0]?.name || 'Project A', detectedAt: new Date(Date.now() - 86400000).toISOString(), status: 'open', description: 'Project exceeded 90% budget threshold without approval' },
        { id: 'v2', policy: 'Change Freeze Policy', severity: 'medium', projectName: activeProjects[1]?.name || 'Project B', detectedAt: new Date(Date.now() - 172800000).toISOString(), status: 'resolved', description: 'Deployment attempted during change freeze window' },
        { id: 'v3', policy: 'Data Retention Policy', severity: 'low', projectName: activeProjects[2]?.name || 'Project C', detectedAt: new Date(Date.now() - 259200000).toISOString(), status: 'investigating', description: 'Test data retained beyond 30-day policy limit' },
      ];

      const complianceTrend = Array.from({ length: 8 }, (_, i) => {
        const week = new Date();
        week.setDate(week.getDate() - (7 - i) * 7);
        return {
          week: week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          overall: overallCompliance - (7 - i) * 0.5 + Math.round(Math.sin(i) * 2),
          security: 85 + Math.round(Math.sin(i * 0.7) * 3),
          financial: 90 + Math.round(Math.sin(i * 0.5) * 2),
          privacy: 82 + Math.round(Math.sin(i * 0.8 + 1) * 4),
        };
      });

      res.json({
        success: true,
        generatedAt: new Date().toISOString(),
        overallCompliance,
        frameworks,
        auditTrail,
        policyViolations,
        complianceTrend,
        totalControls: frameworks.reduce((s, f) => s + f.controls, 0),
        passedControls: frameworks.reduce((s, f) => s + f.passedControls, 0),
        openViolations: policyViolations.filter(v => v.status === 'open').length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

function getAuditDescription(eventType: string, projectName: string): string {
  const descriptions: Record<string, string> = {
    'policy_check': `Automated policy compliance check on ${projectName}`,
    'rule_trigger': `Enterprise rule triggered for ${projectName}`,
    'approval_request': `Approval requested for ${projectName} scope change`,
    'governance_decision': `Governance board decision recorded for ${projectName}`,
    'exception_granted': `Policy exception granted for ${projectName}`,
    'compliance_scan': `Full compliance scan completed for ${projectName}`,
  };
  return descriptions[eventType] || `Audit event for ${projectName}`;
}
