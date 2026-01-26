-- ============================================================================
-- Seed SAFe 6.0 Ontology Classes
-- Based on server/ontology/schema/safe.ttl
-- ============================================================================

-- Insert Core SAFe Classes
INSERT INTO ontology_classes (class_name, parent_class_id, namespace, description, properties, default_visualization) VALUES
-- Portfolio Level
('Portfolio', NULL, 'SAFe', 'Highest level of SAFe containing value streams and strategic themes',
 '{"required": ["name", "budget"], "optional": ["strategic_themes", "description"], "data_types": {"budget": "decimal", "name": "string"}}',
 '{"chart_type": "hierarchy", "aggregation": "sum", "color_scheme": "categorical"}'),

('StrategicTheme', NULL, 'SAFe', 'Differentiated business objectives that connect a portfolio to enterprise strategy',
 '{"required": ["name", "description"], "optional": ["priority", "timeline"], "data_types": {"name": "string", "priority": "integer"}}',
 '{"chart_type": "list", "color_scheme": "priority"}'),

-- Value Stream Level
('ValueStream', NULL, 'SAFe', 'Long-lived series of steps that deliver continuous value',
 '{"required": ["name", "type"], "optional": ["owner", "flow_efficiency"], "data_types": {"name": "string", "type": "enum[operational,development]", "flow_efficiency": "decimal"}}',
 '{"chart_type": "kanban_board", "aggregation": "count", "color_scheme": "sequential"}'),

-- ART Level
('ART', NULL, 'SAFe', 'Agile Release Train - long-lived team of agile teams',
 '{"required": ["name", "value_stream"], "optional": ["release_train_engineer", "product_manager", "system_architect", "team_count", "velocity", "predictability"], "data_types": {"name": "string", "team_count": "integer", "velocity": "integer", "predictability": "decimal"}}',
 '{"chart_type": "grouped_bar", "aggregation": "average", "color_scheme": "diverging"}'),

-- Team Level
('Team', NULL, 'SAFe', 'Agile team within an ART',
 '{"required": ["name", "art"], "optional": ["scrum_master", "product_owner", "tech_lead", "member_count", "capacity", "velocity"], "data_types": {"name": "string", "member_count": "integer", "capacity": "decimal", "velocity": "integer"}}',
 '{"chart_type": "card", "aggregation": "sum"}'),

-- Work Items
('Epic', NULL, 'SAFe', 'Large solution development initiative spanning multiple PIs',
 '{"required": ["name", "epic_type"], "optional": ["business_value", "wsjf_score", "mvp_statement", "lean_business_case"], "data_types": {"name": "string", "epic_type": "enum[business,enabler]", "business_value": "integer", "wsjf_score": "decimal"}}',
 '{"chart_type": "funnel", "aggregation": "count", "color_scheme": "status"}'),

('Capability', NULL, 'SAFe', 'Higher-level solution behavior spanning multiple ARTs',
 '{"required": ["name", "epic"], "optional": ["description", "acceptance_criteria"], "data_types": {"name": "string", "epic": "string"}}',
 '{"chart_type": "gantt", "color_scheme": "timeline"}'),

('Feature', NULL, 'SAFe', 'Service fulfilling stakeholder need within an ART',
 '{"required": ["name"], "optional": ["business_value", "time_criticality", "risk_reduction", "job_size", "wsjf_score", "hypothesis_statement"], "data_types": {"name": "string", "business_value": "integer", "wsjf_score": "decimal"}}',
 '{"chart_type": "prioritization_matrix", "aggregation": "count"}'),

('Story', NULL, 'SAFe', 'Short description of desired functionality from user perspective',
 '{"required": ["name", "story_points"], "optional": ["acceptance_criteria", "description", "sprint"], "data_types": {"name": "string", "story_points": "integer"}}',
 '{"chart_type": "burndown", "aggregation": "sum"}'),

('Task', NULL, 'SAFe', 'Work breakdown of a story',
 '{"required": ["name", "story"], "optional": ["estimated_hours", "actual_hours", "assignee"], "data_types": {"name": "string", "estimated_hours": "decimal", "actual_hours": "decimal"}}',
 '{"chart_type": "list", "aggregation": "sum"}'),

('Enabler', NULL, 'SAFe', 'Work items supporting architectural runway and exploration',
 '{"required": ["name", "enabler_type"], "optional": ["description", "architectural_runway"], "data_types": {"name": "string", "enabler_type": "enum[architectural,infrastructure,compliance,exploration]"}}',
 '{"chart_type": "stacked_bar"}'),

-- Time Boxes
('ProgramIncrement', NULL, 'SAFe', 'Timebox during which an ART delivers incremental value (typically 8-12 weeks)',
 '{"required": ["name", "start_date", "end_date"], "optional": ["pi_number", "planned_velocity", "actual_velocity", "predictability", "pi_objectives"], "data_types": {"name": "string", "pi_number": "integer", "planned_velocity": "integer", "actual_velocity": "integer", "predictability": "decimal"}}',
 '{"chart_type": "timeline", "aggregation": "average"}'),

('Sprint', NULL, 'SAFe', 'Standard two-week iteration timebox',
 '{"required": ["name", "start_date", "end_date", "program_increment"], "optional": ["velocity_target", "committed_points", "completed_points"], "data_types": {"name": "string", "velocity_target": "integer", "committed_points": "integer", "completed_points": "integer"}}',
 '{"chart_type": "burndown", "aggregation": "sum"}'),

-- Milestones & Dependencies
('Milestone', NULL, 'SAFe', 'Key date or deliverable in the program',
 '{"required": ["name", "date"], "optional": ["type", "description", "owner"], "data_types": {"name": "string", "type": "enum[pi_milestone,fixed_date,learning_milestone]"}}',
 '{"chart_type": "timeline", "color_scheme": "categorical"}'),

('Dependency', NULL, 'SAFe', 'Cross-team or cross-ART relationship',
 '{"required": ["from_entity", "to_entity", "dependency_type"], "optional": ["status", "mitigation_plan"], "data_types": {"dependency_type": "enum[hard,soft]", "status": "enum[identified,accepted,resolved,blocked]"}}',
 '{"chart_type": "network_graph", "color_scheme": "status"}'),

-- Risk & Issues
('Risk', NULL, 'SAFe', 'Identified threat to delivery',
 '{"required": ["name", "severity"], "optional": ["category", "mitigation", "owner", "probability", "impact"], "data_types": {"name": "string", "severity": "enum[critical,high,medium,low]", "probability": "decimal", "impact": "decimal"}}',
 '{"chart_type": "heat_map", "color_scheme": "risk"}'),

-- Metrics
('KPI', NULL, 'Metrics', 'Key Performance Indicator',
 '{"required": ["name", "unit", "metric_type"], "optional": ["target", "current_value", "frequency", "calculation"], "data_types": {"name": "string", "metric_type": "enum[financial,operational,strategic,customer]", "unit": "string", "target": "decimal", "current_value": "decimal", "frequency": "enum[daily,weekly,monthly,quarterly,annually]"}}',
 '{"chart_type": "gauge", "aggregation": "average", "color_scheme": "traffic_light"}'),

('OKR', NULL, 'Metrics', 'Objective and Key Results',
 '{"required": ["objective", "key_results"], "optional": ["progress", "status", "owner", "timeline"], "data_types": {"objective": "string", "progress": "decimal", "status": "enum[not-started,on-track,at-risk,behind,completed]"}}',
 '{"chart_type": "progress_bar", "color_scheme": "status"}');

-- ============================================================================
-- Seed SAFe Ontology Relationships
-- ============================================================================

-- Portfolio → Value Stream
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'Portfolio'),
    (SELECT id FROM ontology_classes WHERE class_name = 'ValueStream'),
    'contains', 'one-to-many', false;

-- Portfolio → Strategic Theme
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'Portfolio'),
    (SELECT id FROM ontology_classes WHERE class_name = 'StrategicTheme'),
    'has_strategic_theme', 'one-to-many', false;

-- Portfolio → Epic
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'Portfolio'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Epic'),
    'contains', 'one-to-many', false;

-- Value Stream → ART
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'ValueStream'),
    (SELECT id FROM ontology_classes WHERE class_name = 'ART'),
    'contains', 'one-to-many', false;

-- ART → Team
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'ART'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Team'),
    'contains', 'one-to-many', true;

-- ART → Program Increment
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'ART'),
    (SELECT id FROM ontology_classes WHERE class_name = 'ProgramIncrement'),
    'executes', 'one-to-many', false;

-- Epic → Capability
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'Epic'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Capability'),
    'contains', 'one-to-many', false;

-- Capability → Feature
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'Capability'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Feature'),
    'contains', 'one-to-many', false;

-- Feature → Story
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'Feature'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Story'),
    'contains', 'one-to-many', false;

-- Story → Task
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'Story'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Task'),
    'contains', 'one-to-many', false;

-- Program Increment → Sprint
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'ProgramIncrement'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Sprint'),
    'contains', 'one-to-many', false;

-- KPI → Value Stream (KPIs measure Value Streams)
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'KPI'),
    (SELECT id FROM ontology_classes WHERE class_name = 'ValueStream'),
    'measures', 'many-to-many', false;

-- OKR → Portfolio (OKRs belong to Portfolio)
INSERT INTO ontology_relationships (from_class_id, to_class_id, relationship_type, cardinality, is_required)
SELECT
    (SELECT id FROM ontology_classes WHERE class_name = 'OKR'),
    (SELECT id FROM ontology_classes WHERE class_name = 'Portfolio'),
    'belongs_to', 'many-to-one', false;

-- ============================================================================
-- Seed Industry Profiles
-- ============================================================================

-- Utilities Industry Profile
INSERT INTO ontology_industry_profiles (industry_name, industry_code, primary_classes, class_extensions, standard_metrics) VALUES
('Electric Utilities', '551010',
 -- Primary ontology classes relevant to utilities
 '["Portfolio", "ValueStream", "Epic", "Feature", "KPI", "OKR", "Risk", "Milestone"]',
 -- Industry-specific extensions
 '{
   "KPI": {
     "additional_properties": {
       "regulatory_approved": "boolean",
       "rate_base_component": "boolean",
       "reliability_metric": "boolean",
       "saidi_saifi_category": "enum[saidi,saifi,caidi,maifi]"
     }
   },
   "Risk": {
     "additional_properties": {
       "weather_related": "boolean",
       "regulatory_risk": "boolean",
       "nerc_cip_compliance": "boolean"
     }
   },
   "Epic": {
     "additional_properties": {
       "generation_type": "enum[solar,wind,nuclear,natural_gas,coal,hydro,storage]",
       "environmental_review_required": "boolean",
       "mw_capacity": "decimal"
     }
   }
 }',
 -- Standard metrics for utilities
 '{
   "financial": [
     {"name": "Revenue", "unit": "$M", "frequency": "quarterly"},
     {"name": "Rate Base", "unit": "$B", "frequency": "annually"},
     {"name": "ROE", "unit": "%", "frequency": "quarterly"},
     {"name": "Operating Margin", "unit": "%", "frequency": "quarterly"},
     {"name": "Capital Expenditures", "unit": "$M", "frequency": "quarterly"}
   ],
   "operational": [
     {"name": "Generation Capacity", "unit": "MW", "frequency": "monthly"},
     {"name": "Customer Accounts", "unit": "count", "frequency": "monthly"},
     {"name": "System Reliability (SAIDI)", "unit": "minutes", "frequency": "monthly"},
     {"name": "System Reliability (SAIFI)", "unit": "interruptions", "frequency": "monthly"},
     {"name": "Peak Demand", "unit": "MW", "frequency": "daily"}
   ],
   "strategic": [
     {"name": "Renewable Energy Mix", "unit": "%", "frequency": "annually"},
     {"name": "Carbon Emissions", "unit": "MT CO2", "frequency": "annually"},
     {"name": "Net Zero Progress", "unit": "%", "frequency": "annually"}
   ]
 }');

-- Financial Services Industry Profile
INSERT INTO ontology_industry_profiles (industry_name, industry_code, primary_classes, class_extensions, standard_metrics) VALUES
('Financial Services', '4011',
 '["Portfolio", "ValueStream", "Epic", "Feature", "KPI", "OKR", "Risk"]',
 '{
   "KPI": {
     "additional_properties": {
       "regulatory_metric": "boolean",
       "basel_iii_compliance": "boolean",
       "risk_weighted": "boolean"
     }
   },
   "Risk": {
     "additional_properties": {
       "credit_risk": "boolean",
       "market_risk": "boolean",
       "operational_risk": "boolean",
       "compliance_risk": "boolean"
     }
   }
 }',
 '{
   "financial": [
     {"name": "Assets Under Management (AUM)", "unit": "$B", "frequency": "monthly"},
     {"name": "Net Interest Income (NII)", "unit": "$M", "frequency": "quarterly"},
     {"name": "Return on Equity (ROE)", "unit": "%", "frequency": "quarterly"},
     {"name": "Efficiency Ratio", "unit": "%", "frequency": "quarterly"}
   ],
   "operational": [
     {"name": "Client Retention Rate", "unit": "%", "frequency": "quarterly"},
     {"name": "Digital Adoption Rate", "unit": "%", "frequency": "monthly"}
   ]
 }');

-- Technology/SaaS Industry Profile
INSERT INTO ontology_industry_profiles (industry_name, industry_code, primary_classes, class_extensions, standard_metrics) VALUES
('Technology/SaaS', '4510',
 '["Portfolio", "ValueStream", "ART", "Team", "Epic", "Feature", "Story", "Sprint", "KPI", "OKR"]',
 '{
   "KPI": {
     "additional_properties": {
       "mrr_component": "boolean",
       "arr_component": "boolean",
       "user_metric": "boolean"
     }
   }
 }',
 '{
   "financial": [
     {"name": "Annual Recurring Revenue (ARR)", "unit": "$M", "frequency": "monthly"},
     {"name": "Monthly Recurring Revenue (MRR)", "unit": "$M", "frequency": "monthly"},
     {"name": "Net Revenue Retention", "unit": "%", "frequency": "quarterly"},
     {"name": "Customer Acquisition Cost (CAC)", "unit": "$", "frequency": "monthly"},
     {"name": "Lifetime Value (LTV)", "unit": "$", "frequency": "quarterly"},
     {"name": "Gross Margin", "unit": "%", "frequency": "quarterly"}
   ],
   "operational": [
     {"name": "Monthly Active Users (MAU)", "unit": "count", "frequency": "monthly"},
     {"name": "Daily Active Users (DAU)", "unit": "count", "frequency": "daily"},
     {"name": "Churn Rate", "unit": "%", "frequency": "monthly"},
     {"name": "System Uptime", "unit": "%", "frequency": "monthly"},
     {"name": "API Response Time", "unit": "ms", "frequency": "daily"}
   ]
 }');
