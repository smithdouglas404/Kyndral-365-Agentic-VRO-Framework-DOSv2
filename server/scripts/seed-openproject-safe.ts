/**
 * Seed OpenProject with SAFe Work Packages
 */

import 'dotenv/config';

const OPENPROJECT_URL = process.env.OPENPROJECT_URL!;
const OPENPROJECT_API_KEY = process.env.OPENPROJECT_API_KEY!;
const PROJECT_ID = process.env.OPENPROJECT_PROJECT_ID || 'atlas';

async function request(method: string, endpoint: string, body?: any): Promise<any> {
  const url = `${OPENPROJECT_URL}/api/v3${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${Buffer.from(`apikey:${OPENPROJECT_API_KEY}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenProject API error (${response.status}): ${error}`);
  }
  return response.json();
}

// SAFe projects mapped to OpenProject
const SAFE_PROJECTS = [
  {
    id: 'prj-008', name: 'Real-Time Analytics Engine',
    features: ['Kafka Streaming', 'Complex Event Processing', 'Operational Dashboards'],
    stories: ['Setup Kafka cluster', 'Implement Flink jobs', 'Create Grafana dashboards'],
  },
  {
    id: 'prj-009', name: 'Customer 360 Platform',
    features: ['Identity Resolution', 'Segmentation Engine', 'Journey Orchestration'],
    stories: ['Build identity graph', 'Implement ML clustering', 'Create journey builder'],
  },
  {
    id: 'prj-010', name: 'Sustainability Dashboard',
    features: ['Carbon Calculator', 'ESG Reporting', 'Sustainability KPIs'],
    stories: ['Implement GHG Protocol', 'Build ESG templates', 'Create sustainability dashboard'],
  },
  {
    id: 'prj-011', name: 'AWS Migration Wave 1',
    features: ['Assessment & Planning', 'Migration Execution', 'Optimization'],
    stories: ['Inventory assessment', 'Migration runbooks', 'Cost optimization'],
  },
  {
    id: 'prj-012', name: 'Kubernetes Platform',
    features: ['Cluster Setup', 'Service Mesh', 'Observability'],
    stories: ['Deploy EKS clusters', 'Configure Istio', 'Setup Prometheus/Grafana'],
  },
  {
    id: 'prj-013', name: 'Zero Trust Security',
    features: ['Identity & Access', 'Network Segmentation', 'Data Protection'],
    stories: ['Implement RBAC', 'Configure microsegmentation', 'Deploy DLP'],
  },
  {
    id: 'prj-014', name: 'DevOps Transformation',
    features: ['CI/CD Pipelines', 'IaC Implementation', 'GitOps'],
    stories: ['Setup Jenkins/GitHub Actions', 'Implement Terraform', 'Deploy ArgoCD'],
  },
  {
    id: 'prj-015', name: 'Governance Risk & Compliance',
    features: ['Policy Management', 'Risk Assessment', 'Audit Automation'],
    stories: ['Build policy engine', 'Create risk registry', 'Automate SOC2 audits'],
  },
  {
    id: 'prj-020', name: 'ERP Modernization SAP S/4HANA',
    features: ['Finance Module', 'Supply Chain Module', 'Data Migration'],
    stories: ['Configure chart of accounts', 'Setup procurement', 'Migrate master data'],
  },
  {
    id: 'prj-021', name: 'Supply Chain Optimization',
    features: ['Demand Forecasting', 'Inventory Optimization', 'Supplier Portal'],
    stories: ['Build forecasting model', 'Implement ABC analysis', 'Create supplier onboarding'],
  },
  {
    id: 'prj-022', name: 'Procurement Digital Transform',
    features: ['P2P Automation', 'Contract Management', 'Spend Analytics'],
    stories: ['Implement requisition workflow', 'Build contract repository', 'Create spend dashboards'],
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("SEEDING OPENPROJECT WITH SAFe WORK PACKAGES");
  console.log("=".repeat(60));

  // Test connection
  const root = await request('GET', '/');
  console.log(`Connected to OpenProject ${root.coreVersion}\n`);

  let totalCreated = 0;

  for (const proj of SAFE_PROJECTS) {
    console.log(`\n${proj.id}: ${proj.name}`);

    // Create parent task for the project
    try {
      const parent = await request('POST', `/projects/${PROJECT_ID}/work_packages`, {
        subject: `[${proj.id}] ${proj.name}`,
        description: { raw: `SAFe Project from Palantir` },
      });
      console.log(`  Created #${parent.id}: ${proj.name}`);
      totalCreated++;

      // Create features
      for (const feature of proj.features) {
        try {
          const wp = await request('POST', `/projects/${PROJECT_ID}/work_packages`, {
            subject: `[Feature] ${feature}`,
            description: { raw: `Feature for ${proj.name}` },
          });
          console.log(`    #${wp.id}: ${feature}`);
          totalCreated++;
        } catch (e: any) {
          console.log(`    Failed: ${feature}`);
        }
        await new Promise(r => setTimeout(r, 100));
      }

      // Create stories
      for (const story of proj.stories) {
        try {
          const wp = await request('POST', `/projects/${PROJECT_ID}/work_packages`, {
            subject: story,
            description: { raw: `User story for ${proj.name}` },
          });
          console.log(`    #${wp.id}: ${story}`);
          totalCreated++;
        } catch (e: any) {
          console.log(`    Failed: ${story}`);
        }
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e: any) {
      console.log(`  Failed: ${e.message.substring(0, 60)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`COMPLETE: Created ${totalCreated} work packages in OpenProject`);
  console.log("=".repeat(60));
}

main().catch(console.error);
