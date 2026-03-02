-- ============================================================================
-- ADD AGENT ATTRIBUTES & WIDGET TABLES
-- Run this script to add the new tables for dynamic agent attributes
-- ============================================================================

-- Agent Attributes - Dynamic attributes for agents (widget data sources)
CREATE TABLE IF NOT EXISTS agent_attributes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR NOT NULL,

  -- Attribute Definition
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,

  -- Data Type & Format
  data_type TEXT NOT NULL DEFAULT 'number',
  unit TEXT,
  format TEXT,

  -- Value Source
  value_source TEXT NOT NULL DEFAULT 'calculated',
  calculation_rule TEXT,
  aggregation_method TEXT,
  source_query TEXT,

  -- Current Value (cached)
  current_value TEXT,
  previous_value TEXT,
  target_value TEXT,
  thresholds TEXT,

  -- Metadata
  refresh_interval INTEGER DEFAULT 300,
  last_calculated_at TIMESTAMP,
  palantir_property_name TEXT,
  external_system_mapping TEXT,

  -- UI Hints
  default_widget_type TEXT DEFAULT 'stat-card',
  chart_config TEXT,

  -- Permissions
  visibility TEXT DEFAULT 'all',
  is_editable BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Widget Definitions - Dashboard widget configurations
CREATE TABLE IF NOT EXISTS widget_definitions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Widget Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Widget Type & Display
  widget_type TEXT NOT NULL,
  size TEXT DEFAULT 'medium',
  default_width INTEGER DEFAULT 1,
  default_height INTEGER DEFAULT 1,

  -- Data Binding
  primary_attribute_id VARCHAR,
  secondary_attribute_ids TEXT,
  agent_id VARCHAR,

  -- Visualization Config
  config TEXT,
  drilldown_config TEXT,

  -- Conditional Display
  show_conditions TEXT,
  highlight_conditions TEXT,

  -- Layout & Grouping
  category TEXT,
  tags TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Permissions
  roles TEXT,
  is_default BOOLEAN DEFAULT false,
  is_customizable BOOLEAN DEFAULT true,

  -- Palantir Integration
  palantir_object_type TEXT,
  palantir_query TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Dashboard Layouts - User-specific widget arrangements
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  dashboard_id VARCHAR NOT NULL,

  -- Layout Configuration
  layout TEXT NOT NULL,
  hidden_widgets TEXT,
  custom_widgets TEXT,

  -- Filters & Preferences
  default_filters TEXT,
  refresh_interval INTEGER DEFAULT 60,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attribute Value History - Time series for trending
CREATE TABLE IF NOT EXISTS attribute_value_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id VARCHAR NOT NULL,

  value TEXT NOT NULL,
  calculated_at TIMESTAMP NOT NULL,

  -- Context
  triggered_by TEXT,
  metadata TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_attributes_agent_id ON agent_attributes(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_attributes_category ON agent_attributes(category);
CREATE INDEX IF NOT EXISTS idx_widget_definitions_agent_id ON widget_definitions(agent_id);
CREATE INDEX IF NOT EXISTS idx_widget_definitions_category ON widget_definitions(category);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_id ON user_dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_attribute_value_history_attribute_id ON attribute_value_history(attribute_id);
CREATE INDEX IF NOT EXISTS idx_attribute_value_history_calculated_at ON attribute_value_history(calculated_at);

-- Add unique constraint for widget slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_definitions_slug ON widget_definitions(slug);

COMMENT ON TABLE agent_attributes IS 'Dynamic attributes for agents - each attribute can power a dashboard widget';
COMMENT ON TABLE widget_definitions IS 'Dashboard widget configurations - maps attributes to UI widgets for liquid dashboards';
COMMENT ON TABLE user_dashboard_layouts IS 'User-specific dashboard layouts and widget arrangements';
COMMENT ON TABLE attribute_value_history IS 'Historical values for attributes to enable trending and time-series analysis';
