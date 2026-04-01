-- ============================================================================
-- Semantic Views for K360 Ontology Computed Concepts
--
-- These views implement computed ontology concepts that span multiple domains
-- and enable cross-domain agent reasoning via semantic queries.
-- ============================================================================

-- ============================================================================
-- VIEW: Orphaned Projects (k360:OrphanedProject)
-- Projects not linked to any OKR or strategic objective
-- ============================================================================
CREATE OR REPLACE VIEW v_orphaned_projects AS
SELECT
    p.id,
    p.name,
    p.description,
    p.status,
    p.portfolio_id,
    p.art_id,
    p.budget_total,
    p.progress,
    p.created_at,
    'No OKR alignment detected' AS orphan_reason,
    'Review for strategic fit or deprecation' AS recommendation
FROM projects p
WHERE (p.okr_objective IS NULL OR p.okr_objective = '')
  AND (p.okr_key_result IS NULL OR p.okr_key_result = '')
  AND p.status != 'archived';

-- ============================================================================
-- VIEW: Over-Allocated Resources (k360:OverAllocatedResource)
-- Resources assigned to multiple projects exceeding 100% allocation
-- ============================================================================
CREATE OR REPLACE VIEW v_over_allocated_resources AS
SELECT
    r.name,
    r.role,
    r.team,
    COUNT(DISTINCT r.project_id) AS project_count,
    SUM(CAST(COALESCE(NULLIF(r.allocation, ''), '0') AS DECIMAL)) AS total_allocation,
    ARRAY_AGG(DISTINCT p.name) AS project_names,
    CASE
        WHEN SUM(CAST(COALESCE(NULLIF(r.allocation, ''), '0') AS DECIMAL)) > 150 THEN 'critical'
        WHEN SUM(CAST(COALESCE(NULLIF(r.allocation, ''), '0') AS DECIMAL)) > 120 THEN 'high'
        ELSE 'medium'
    END AS severity,
    'Rebalance workload across projects' AS recommendation
FROM resources r
JOIN projects p ON r.project_id = p.id
GROUP BY r.name, r.role, r.team
HAVING SUM(CAST(COALESCE(NULLIF(r.allocation, ''), '0') AS DECIMAL)) > 100;

-- ============================================================================
-- VIEW: At-Risk Projects (k360:AtRiskProject)
-- Projects with CPI < 0.9 or SPI < 0.9 indicating schedule/cost issues
-- ============================================================================
CREATE OR REPLACE VIEW v_at_risk_projects AS
SELECT
    p.id,
    p.name,
    p.status,
    p.cpi_value,
    p.spi_value,
    p.budget_total,
    p.budget_spent,
    p.progress,
    p.art_name,
    CASE
        WHEN p.cpi_value < 0.8 OR p.spi_value < 0.8 THEN 'critical'
        WHEN p.cpi_value < 0.9 OR p.spi_value < 0.9 THEN 'high'
        ELSE 'medium'
    END AS risk_level,
    CASE
        WHEN p.cpi_value < 0.9 AND p.spi_value < 0.9 THEN 'Both cost and schedule at risk'
        WHEN p.cpi_value < 0.9 THEN 'Cost overrun risk'
        WHEN p.spi_value < 0.9 THEN 'Schedule delay risk'
        ELSE 'Performance concern'
    END AS risk_type,
    'Immediate intervention required' AS recommendation
FROM projects p
WHERE (p.cpi_value IS NOT NULL AND p.cpi_value < 0.9)
   OR (p.spi_value IS NOT NULL AND p.spi_value < 0.9);

-- ============================================================================
-- VIEW: Unmitigated Critical Risks (k360:UnmitigatedCriticalRisk)
-- High-impact risks without mitigation plans
-- ============================================================================
CREATE OR REPLACE VIEW v_unmitigated_critical_risks AS
SELECT
    r.id,
    r.project_id,
    p.name AS project_name,
    r.title AS risk_title,
    r.description,
    r.category,
    r.severity,
    r.likelihood,
    r.impact,
    r.status,
    r.created_at,
    'Risk requires immediate mitigation plan' AS recommendation
FROM risks r
JOIN projects p ON r.project_id = p.id
WHERE (r.severity = 'critical' OR r.severity = 'high')
  AND (r.mitigation_plan IS NULL OR r.mitigation_plan = '')
  AND r.status != 'resolved'
  AND r.status != 'closed';

-- ============================================================================
-- VIEW: Dependency Bottlenecks (k360:DependencyBottleneck)
-- Items blocking multiple other items
-- ============================================================================
CREATE OR REPLACE VIEW v_dependency_bottlenecks AS
SELECT
    d.source_id AS blocking_item_id,
    d.source_type AS blocking_item_type,
    COUNT(*) AS blocked_count,
    ARRAY_AGG(d.target_id) AS blocked_items,
    MAX(d.severity) AS max_severity,
    CASE
        WHEN COUNT(*) >= 5 THEN 'critical'
        WHEN COUNT(*) >= 3 THEN 'high'
        ELSE 'medium'
    END AS bottleneck_severity,
    'Prioritize resolution to unblock dependent work' AS recommendation
FROM dependencies d
WHERE d.status = 'blocked' OR d.status = 'at_risk'
GROUP BY d.source_id, d.source_type
HAVING COUNT(*) >= 2;

-- ============================================================================
-- VIEW: Budget-Schedule Correlation (k360:BudgetScheduleCorrelation)
-- Projects where budget issues correlate with schedule delays
-- ============================================================================
CREATE OR REPLACE VIEW v_budget_schedule_correlation AS
SELECT
    p.id,
    p.name,
    p.cpi_value,
    p.spi_value,
    ABS(COALESCE(p.cpi_value, 1) - COALESCE(p.spi_value, 1)) AS variance_correlation,
    CASE
        WHEN p.cpi_value < 0.9 AND p.spi_value < 0.9 THEN 'Both budget and schedule impacted'
        WHEN p.cpi_value < p.spi_value THEN 'Budget-driven delays'
        ELSE 'Schedule-driven cost overruns'
    END AS correlation_type,
    p.budget_total,
    p.budget_spent,
    p.progress,
    'Investigate root cause of correlated issues' AS recommendation
FROM projects p
WHERE p.cpi_value IS NOT NULL
  AND p.spi_value IS NOT NULL
  AND (p.cpi_value < 0.95 OR p.spi_value < 0.95);

-- ============================================================================
-- VIEW: Low Velocity Teams (k360:LowVelocityTeam)
-- Teams consistently delivering below capacity
-- ============================================================================
CREATE OR REPLACE VIEW v_low_velocity_projects AS
SELECT
    p.id,
    p.name,
    p.art_name AS team,
    CAST(p.velocity AS INTEGER) AS velocity,
    CAST(p.predictability AS DECIMAL) AS predictability,
    CAST(p.flow_efficiency AS DECIMAL) AS flow_efficiency,
    CASE
        WHEN CAST(COALESCE(p.predictability, '100') AS DECIMAL) < 70 THEN 'critical'
        WHEN CAST(COALESCE(p.predictability, '100') AS DECIMAL) < 80 THEN 'high'
        ELSE 'medium'
    END AS severity,
    'Review team capacity and remove impediments' AS recommendation
FROM projects p
WHERE CAST(COALESCE(p.predictability, '100') AS DECIMAL) < 85
   OR CAST(COALESCE(p.flow_efficiency, '100') AS DECIMAL) < 50;

-- ============================================================================
-- VIEW: Strategic Alignment Scores (k360:AlignmentScore)
-- Projects with their strategic alignment metrics
-- ============================================================================
CREATE OR REPLACE VIEW v_strategic_alignment AS
SELECT
    p.id,
    p.name,
    p.portfolio_theme,
    p.okr_objective,
    p.okr_key_result,
    p.okr_progress,
    CASE
        WHEN p.okr_objective IS NOT NULL AND p.okr_key_result IS NOT NULL THEN
            LEAST(100, COALESCE(p.okr_progress, 0) +
                  CASE WHEN p.portfolio_theme IS NOT NULL THEN 20 ELSE 0 END)
        WHEN p.okr_objective IS NOT NULL THEN 50
        WHEN p.portfolio_theme IS NOT NULL THEN 30
        ELSE 0
    END AS alignment_score,
    CASE
        WHEN p.okr_objective IS NOT NULL AND p.okr_key_result IS NOT NULL THEN 'aligned'
        WHEN p.okr_objective IS NOT NULL OR p.portfolio_theme IS NOT NULL THEN 'partial'
        ELSE 'unaligned'
    END AS alignment_status,
    p.status,
    p.progress
FROM projects p
WHERE p.status != 'archived';

-- ============================================================================
-- VIEW: Cross-Domain Insights Summary (k360:CrossDomainInsight)
-- Aggregated view for quick insight generation
-- ============================================================================
CREATE OR REPLACE VIEW v_cross_domain_summary AS
SELECT
    'orphaned_projects' AS insight_type,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) > 5 THEN 'high' WHEN COUNT(*) > 2 THEN 'medium' ELSE 'low' END AS severity,
    'VRO,OKR' AS affected_domains
FROM v_orphaned_projects
UNION ALL
SELECT
    'over_allocated_resources' AS insight_type,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) > 10 THEN 'critical' WHEN COUNT(*) > 5 THEN 'high' ELSE 'medium' END AS severity,
    'PMO,Planning' AS affected_domains
FROM v_over_allocated_resources
UNION ALL
SELECT
    'at_risk_projects' AS insight_type,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) > 5 THEN 'critical' WHEN COUNT(*) > 2 THEN 'high' ELSE 'medium' END AS severity,
    'FinOps,Risk,PMO' AS affected_domains
FROM v_at_risk_projects
UNION ALL
SELECT
    'unmitigated_risks' AS insight_type,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) > 3 THEN 'critical' WHEN COUNT(*) > 1 THEN 'high' ELSE 'medium' END AS severity,
    'Risk,Governance' AS affected_domains
FROM v_unmitigated_critical_risks
UNION ALL
SELECT
    'dependency_bottlenecks' AS insight_type,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) > 5 THEN 'high' WHEN COUNT(*) > 2 THEN 'medium' ELSE 'low' END AS severity,
    'Planning,PMO' AS affected_domains
FROM v_dependency_bottlenecks;

-- ============================================================================
-- VIEW: Agent Domain Entities (k360:AgentDomainEntity)
-- Maps entities to their owning agent domains
-- ============================================================================
CREATE OR REPLACE VIEW v_agent_domain_entities AS
SELECT
    'VRO' AS agent_domain,
    'project' AS entity_type,
    p.id AS entity_id,
    p.name AS entity_name,
    CASE
        WHEN p.expected_roi IS NOT NULL THEN CAST(p.expected_roi AS TEXT)
        ELSE 'Not calculated'
    END AS domain_metric
FROM projects p
WHERE p.status = 'active'
UNION ALL
SELECT
    'FinOps' AS agent_domain,
    'project' AS entity_type,
    p.id AS entity_id,
    p.name AS entity_name,
    CONCAT('CPI: ', COALESCE(CAST(p.cpi_value AS TEXT), 'N/A'), ', SPI: ', COALESCE(CAST(p.spi_value AS TEXT), 'N/A')) AS domain_metric
FROM projects p
WHERE p.cpi_value IS NOT NULL OR p.spi_value IS NOT NULL
UNION ALL
SELECT
    'Risk' AS agent_domain,
    'risk' AS entity_type,
    r.id AS entity_id,
    r.title AS entity_name,
    CONCAT(r.severity, ' - ', r.status) AS domain_metric
FROM risks r
WHERE r.status != 'closed'
UNION ALL
SELECT
    'OKR' AS agent_domain,
    'project' AS entity_type,
    p.id AS entity_id,
    p.name AS entity_name,
    CONCAT('OKR Progress: ', COALESCE(CAST(p.okr_progress AS TEXT), '0'), '%') AS domain_metric
FROM projects p
WHERE p.okr_objective IS NOT NULL;

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_okr_alignment ON projects(okr_objective, okr_key_result);
CREATE INDEX IF NOT EXISTS idx_projects_performance ON projects(cpi_value, spi_value);
CREATE INDEX IF NOT EXISTS idx_resources_allocation ON resources(name, allocation);
CREATE INDEX IF NOT EXISTS idx_risks_critical ON risks(severity, status) WHERE severity IN ('critical', 'high');
CREATE INDEX IF NOT EXISTS idx_dependencies_blocked ON dependencies(source_id, status) WHERE status IN ('blocked', 'at_risk');
