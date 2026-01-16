import type { TourDefinition } from "@/components/GuidedTour";
export type { TourDefinition };

export const TUTORIALS: Record<string, TourDefinition> = {
  dashboard_tour: {
    id: "dashboard_tour",
    name: "Dashboard Overview",
    description: "Learn how to navigate the main dashboard and understand key metrics.",
    steps: [
      {
        target: "[data-testid='nav-dashboard']",
        title: "Dashboard Navigation",
        content: "This is your main dashboard. Click here anytime to return to this overview of your portfolio.",
        placement: "bottom",
      },
      {
        target: "[data-testid='portfolio-health-card']",
        title: "Portfolio Health",
        content: "Monitor your portfolio's overall health with real-time metrics including schedule performance, budget tracking, and risk indicators.",
        placement: "bottom",
      },
      {
        target: "[data-testid='notifications-dropdown']",
        title: "Notifications",
        content: "Stay informed with real-time alerts about sync status, system events, and important updates.",
        placement: "bottom",
      },
      {
        target: "[data-testid='admin-dropdown']",
        title: "Admin Menu",
        content: "Access administrative features including Settings, MCP Configuration, and Data Ingestion tools.",
        placement: "bottom",
      },
      {
        target: "[data-testid='kpi-section']",
        title: "Key Performance Indicators",
        content: "Track critical KPIs at a glance. These metrics update in real-time based on your connected data sources.",
        placement: "top",
      },
    ],
  },

  mcp_integration: {
    id: "mcp_integration",
    name: "MCP Integration Setup",
    description: "Learn how to connect external tools like Jira, Azure DevOps, and ServiceNow.",
    steps: [
      {
        target: "[data-testid='mcp-config-link']",
        title: "MCP Configuration",
        content: "Access the MCP Configuration page to set up integrations with your external project management tools.",
        placement: "bottom",
      },
      {
        target: "[data-testid='adapter-list']",
        title: "Available Adapters",
        content: "View and manage your MCP adapters. Each adapter connects to a specific external system like Jira or Azure DevOps.",
        placement: "right",
      },
      {
        target: "[data-testid='sync-jobs-section']",
        title: "Sync Jobs",
        content: "Configure scheduled sync jobs to automatically import data from your connected systems on a regular basis.",
        placement: "top",
      },
      {
        target: "[data-testid='webhook-section']",
        title: "Webhooks",
        content: "Set up webhooks to receive real-time updates when changes occur in your external systems.",
        placement: "top",
      },
    ],
  },

  data_ingestion: {
    id: "data_ingestion",
    name: "AI-Powered Data Ingestion",
    description: "Discover how to use AI to import and map data from various sources.",
    steps: [
      {
        target: "[data-testid='ingestion-wizard']",
        title: "Ingestion Wizard",
        content: "The AI-powered ingestion wizard guides you through importing data from CSV, Excel, or JSON files.",
        placement: "right",
      },
      {
        target: "[data-testid='file-upload']",
        title: "Upload Your Data",
        content: "Start by uploading your data file. The AI will analyze its structure and suggest the best mapping to SAFe entities.",
        placement: "bottom",
      },
      {
        target: "[data-testid='ai-analysis']",
        title: "AI Analysis",
        content: "Our AI examines your data and provides a summary, identifies entity types, and suggests field mappings.",
        placement: "left",
      },
      {
        target: "[data-testid='qa-gate']",
        title: "Quality Assurance",
        content: "Before importing, review the QA gate results to ensure data quality and mapping accuracy.",
        placement: "top",
      },
    ],
  },

  settings_tour: {
    id: "settings_tour",
    name: "Settings & Preferences",
    description: "Configure your dashboard preferences and manage system settings.",
    steps: [
      {
        target: "[data-testid='settings-general']",
        title: "General Settings",
        content: "Configure general application settings including timezone, language, and display preferences.",
        placement: "right",
      },
      {
        target: "[data-testid='settings-export']",
        title: "Data Export",
        content: "Export your data in various formats. Download project portfolios, metrics, and reports as CSV, Excel, or JSON.",
        placement: "right",
      },
      {
        target: "[data-testid='settings-notifications']",
        title: "Notification Preferences",
        content: "Customize which notifications you receive and how you want to be alerted about important events.",
        placement: "right",
      },
    ],
  },

  safe_ontology: {
    id: "safe_ontology",
    name: "SAFe Ontology Explorer",
    description: "Understand the SAFe framework hierarchy and how your data maps to it.",
    steps: [
      {
        target: "[data-testid='portfolio-level']",
        title: "Portfolio Level",
        content: "At the top level, Portfolios contain strategic themes and value streams that align with business objectives.",
        placement: "bottom",
      },
      {
        target: "[data-testid='art-level']",
        title: "Agile Release Trains",
        content: "ARTs are long-lived teams of teams that plan, commit, and execute together. They deliver value through Program Increments.",
        placement: "bottom",
      },
      {
        target: "[data-testid='team-level']",
        title: "Team Level",
        content: "Teams work on Features and Stories within Sprints, delivering incremental value aligned with the PI objectives.",
        placement: "bottom",
      },
    ],
  },
};

export function getTutorial(id: string): TourDefinition | undefined {
  return TUTORIALS[id];
}

export function getAllTutorials(): TourDefinition[] {
  return Object.values(TUTORIALS);
}
