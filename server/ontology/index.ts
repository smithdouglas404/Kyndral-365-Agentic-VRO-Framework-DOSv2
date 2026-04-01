import { Store, DataFactory, Parser, Writer, Quad } from 'n3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { namedNode, literal, quad } = DataFactory;

// Get current directory for ES modules (with CommonJS fallback)
const __filename = typeof import.meta !== 'undefined' && import.meta.url
  ? fileURLToPath(import.meta.url)
  : join(process.cwd(), 'server', 'ontology', 'index.ts');
const __dirname = dirname(__filename);

/**
 * OntologyService
 * Manages the unified K360 enterprise ontology for multi-agent governance
 * Integrates SAFe 6.0, PMBOK, PRINCE2, and 11 agent domain ontologies
 * Provides semantic reconciliation and cross-domain query capabilities
 */
export class OntologyService {
  private store: Store;
  private baseIRI = 'https://kyndryl.com/k360/ontology#';
  private safeIRI = 'https://scaledagileframework.com/ontology#';
  private legacyIRI = 'http://nextera.energy/ontology/';
  private isLoaded = false;

  constructor() {
    this.store = new Store();
  }

  /**
   * Load all ontology files into the triple store
   */
  async loadOntologies(): Promise<void> {
    if (this.isLoaded) {
      console.log('[OntologyService] Ontologies already loaded');
      return;
    }

    console.log('[OntologyService] Loading ontologies...');

    const ontologyFiles = [
      'schema/k360.ttl',        // Primary K360 enterprise ontology (1543 lines)
      'schema/core.ttl',        // Legacy core PM ontology
      'schema/safe.ttl',        // Legacy SAFe extension
      'schema/pmbok.ttl',       // PMBOK mapping
      'schema/prince2.ttl',     // PRINCE2 mapping
      'schema/bridging.ttl',    // Cross-methodology bridging
    ];

    const parser = new Parser({ format: 'Turtle' });

    for (const file of ontologyFiles) {
      try {
        const filePath = join(__dirname, file);
        const content = readFileSync(filePath, 'utf-8');
        const quads = parser.parse(content);
        this.store.addQuads(quads);
        console.log(`[OntologyService] Loaded ${file}: ${quads.length} triples`);
      } catch (error) {
        console.error(`[OntologyService] Error loading ${file}:`, error);
        throw error;
      }
    }

    this.isLoaded = true;
    console.log(`[OntologyService] Total triples loaded: ${this.store.size}`);
  }

  /**
   * Get all classes defined in the ontology
   */
  getClasses(): string[] {
    const classes: Set<string> = new Set();

    // Find all subjects that are instances of owl:Class
    const classQuads = this.store.getQuads(
      null,
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('http://www.w3.org/2002/07/owl#Class'),
      null
    );

    for (const quad of classQuads) {
      classes.add(quad.subject.value);
    }

    return Array.from(classes);
  }

  /**
   * Get all properties defined in the ontology
   */
  getProperties(): { objectProperties: string[]; datatypeProperties: string[] } {
    const objectProperties: Set<string> = new Set();
    const datatypeProperties: Set<string> = new Set();

    // Object properties
    const objPropQuads = this.store.getQuads(
      null,
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('http://www.w3.org/2002/07/owl#ObjectProperty'),
      null
    );

    for (const quad of objPropQuads) {
      objectProperties.add(quad.subject.value);
    }

    // Datatype properties
    const dataPropQuads = this.store.getQuads(
      null,
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode('http://www.w3.org/2002/07/owl#DatatypeProperty'),
      null
    );

    for (const quad of dataPropQuads) {
      datatypeProperties.add(quad.subject.value);
    }

    return {
      objectProperties: Array.from(objectProperties),
      datatypeProperties: Array.from(datatypeProperties),
    };
  }

  /**
   * Get equivalent concepts across methodologies
   * E.g., safe:Epic equivalent to pmbok:Project
   */
  getEquivalentConcepts(conceptURI: string): string[] {
    const equivalents: Set<string> = new Set();

    // Find owl:equivalentClass relationships
    const equivalentQuads = this.store.getQuads(
      namedNode(conceptURI),
      namedNode('http://www.w3.org/2002/07/owl#equivalentClass'),
      null,
      null
    );

    for (const quad of equivalentQuads) {
      equivalents.add(quad.object.value);
    }

    // Also check reverse direction
    const reverseQuads = this.store.getQuads(
      null,
      namedNode('http://www.w3.org/2002/07/owl#equivalentClass'),
      namedNode(conceptURI),
      null
    );

    for (const quad of reverseQuads) {
      equivalents.add(quad.subject.value);
    }

    return Array.from(equivalents);
  }

  /**
   * Get all subclasses of a given class
   * E.g., all tasks: pm:Task, safe:Story, pmbok:Activity, prince2:Activity
   */
  getSubclasses(classURI: string, recursive = true): string[] {
    const subclasses: Set<string> = new Set();

    const directSubclasses = this.store.getQuads(
      null,
      namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      namedNode(classURI),
      null
    );

    for (const quad of directSubclasses) {
      const subclass = quad.subject.value;
      subclasses.add(subclass);

      // Recursively get subclasses of subclasses
      if (recursive) {
        const nested = this.getSubclasses(subclass, true);
        nested.forEach(n => subclasses.add(n));
      }
    }

    return Array.from(subclasses);
  }

  /**
   * Semantic reconciliation: Map external entity types to ontology concepts
   * This is the key function for OBDA query rewriting
   */
  reconcileEntity(sourceType: string, sourceSystem: string): string {
    // Normalize source type
    const normalizedType = sourceType.toLowerCase().replace(/[-_\s]/g, '');

    // Mapping rules based on source system and type
    const mappings: Record<string, string> = {
      // Jira
      'jira_epic': `${this.baseIRI}safe#Epic`,
      'jira_story': `${this.baseIRI}safe#Story`,
      'jira_task': `${this.baseIRI}pm#Task`,
      'jira_subtask': `${this.baseIRI}pm#Task`,
      'jira_issue': `${this.baseIRI}pm#Issue`,

      // Azure DevOps
      'azure_epic': `${this.baseIRI}safe#Epic`,
      'azure_feature': `${this.baseIRI}safe#Feature`,
      'azure_userstory': `${this.baseIRI}safe#Story`,
      'azure_task': `${this.baseIRI}pm#Task`,
      'azure_workitem': `${this.baseIRI}pm#Task`,
      'azure_bug': `${this.baseIRI}pm#Issue`,

      // Excel/Generic
      'excel_project': `${this.baseIRI}pm#Project`,
      'excel_deliverable': `${this.baseIRI}pm#Deliverable`,
      'excel_task': `${this.baseIRI}pm#Task`,
      'excel_activity': `${this.baseIRI}pmbok#Activity`,

      // ServiceNow
      'servicenow_project': `${this.baseIRI}pm#Project`,
      'servicenow_task': `${this.baseIRI}pm#Task`,
      'servicenow_issue': `${this.baseIRI}pm#Issue`,

      // Monday.com
      'monday_project': `${this.baseIRI}pm#Project`,
      'monday_task': `${this.baseIRI}pm#Task`,

      // Asana
      'asana_project': `${this.baseIRI}pm#Project`,
      'asana_task': `${this.baseIRI}pm#Task`,

      // Smartsheet
      'smartsheet_project': `${this.baseIRI}pm#Project`,
      'smartsheet_task': `${this.baseIRI}pm#Task`,

      // Planview
      'planview_project': `${this.baseIRI}pm#Project`,
      'planview_portfolio': `${this.baseIRI}safe#Portfolio`,

      // MS Project
      'msproject_project': `${this.baseIRI}pm#Project`,
      'msproject_task': `${this.baseIRI}pm#Task`,
      'msproject_milestone': `${this.baseIRI}pm#Milestone`,

      // Rally
      'rally_epic': `${this.baseIRI}safe#Epic`,
      'rally_feature': `${this.baseIRI}safe#Feature`,
      'rally_userstory': `${this.baseIRI}safe#Story`,
      'rally_task': `${this.baseIRI}pm#Task`,

      // PostgreSQL (local database)
      'postgresql_project': `${this.baseIRI}pm#Project`,
      'postgresql_epic': `${this.baseIRI}safe#Epic`,
      'postgresql_feature': `${this.baseIRI}safe#Feature`,
      'postgresql_story': `${this.baseIRI}safe#Story`,
      'postgresql_task': `${this.baseIRI}pm#Task`,
      'postgresql_risk': `${this.baseIRI}pm#Risk`,
    };

    const key = `${sourceSystem.toLowerCase()}_${normalizedType}`;
    return mappings[key] || `${this.baseIRI}pm#Task`; // Default to generic Task
  }

  /**
   * Reconcile field names across sources
   * E.g., Jira "assignee" = Azure "assigned_to" = pm:isAssignedTo
   */
  reconcileField(fieldName: string, sourceSystem: string): string {
    const normalizedField = fieldName.toLowerCase().replace(/[-_\s]/g, '');

    const fieldMappings: Record<string, string> = {
      // Assignee variations
      'assignee': `${this.baseIRI}pm#assignee`,
      'assignedto': `${this.baseIRI}pm#assignee`,
      'owner': `${this.baseIRI}pm#assignee`,
      'resource': `${this.baseIRI}pm#assignee`,

      // Status variations
      'status': `${this.baseIRI}pm#taskStatus`,
      'state': `${this.baseIRI}pm#taskStatus`,
      'workflowstate': `${this.baseIRI}pm#taskStatus`,

      // Name/Title variations
      'summary': `${this.baseIRI}pm#taskName`,
      'title': `${this.baseIRI}pm#taskName`,
      'name': `${this.baseIRI}pm#taskName`,
      'subject': `${this.baseIRI}pm#taskName`,

      // Due date variations
      'duedate': `${this.baseIRI}pm#hasDueDate`,
      'targetdate': `${this.baseIRI}pm#hasDueDate`,
      'deadline': `${this.baseIRI}pm#hasDueDate`,
      'enddate': `${this.baseIRI}pm#hasDueDate`,

      // Budget variations
      'budget': `${this.baseIRI}pm#hasBudget`,
      'cost': `${this.baseIRI}pm#hasBudget`,
      'estimatedcost': `${this.baseIRI}pm#hasBudget`,

      // Effort variations
      'effort': `${this.baseIRI}pm#effortHours`,
      'workhours': `${this.baseIRI}pm#effortHours`,
      'estimatedhours': `${this.baseIRI}pm#effortHours`,

      // Priority variations
      'priority': `${this.baseIRI}pm#priority`,
      'importance': `${this.baseIRI}pm#priority`,
      'rank': `${this.baseIRI}pm#priority`,

      // Story points (SAFe specific)
      'storypoints': `${this.baseIRI}pm#storyPoints`,
      'points': `${this.baseIRI}pm#storyPoints`,
    };

    return fieldMappings[normalizedField] || `${this.baseIRI}pm#${fieldName}`;
  }

  /**
   * Get label for a concept (human-readable name)
   */
  getLabel(conceptURI: string): string {
    const labelQuads = this.store.getQuads(
      namedNode(conceptURI),
      namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
      null,
      null
    );

    if (labelQuads.length > 0) {
      return labelQuads[0].object.value;
    }

    // Fallback: extract name from URI
    return conceptURI.split('#').pop() || conceptURI;
  }

  /**
   * Get comment/description for a concept
   */
  getComment(conceptURI: string): string {
    const commentQuads = this.store.getQuads(
      namedNode(conceptURI),
      namedNode('http://www.w3.org/2000/01/rdf-schema#comment'),
      null,
      null
    );

    if (commentQuads.length > 0) {
      return commentQuads[0].object.value;
    }

    return '';
  }

  /**
   * Find all instances of a class type
   * Used for generating queries across methodologies
   */
  findAllOfType(classURI: string): string[] {
    const instances: Set<string> = new Set();

    // Direct instances
    const directInstances = this.store.getQuads(
      null,
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode(classURI),
      null
    );

    for (const quad of directInstances) {
      instances.add(quad.subject.value);
    }

    // Include instances of subclasses
    const subclasses = this.getSubclasses(classURI, true);
    for (const subclass of subclasses) {
      const subInstances = this.store.getQuads(
        null,
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode(subclass),
        null
      );

      for (const quad of subInstances) {
        instances.add(quad.subject.value);
      }
    }

    return Array.from(instances);
  }

  /**
   * Export ontology to Turtle format
   */
  exportToTurtle(): string {
    const writer = new Writer({ format: 'Turtle' });
    const quads = this.store.getQuads(null, null, null, null);

    return new Promise<string>((resolve, reject) => {
      writer.addQuads(quads);
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    }) as any; // Type casting for simplicity
  }

  /**
   * Get statistics about the ontology
   */
  getStatistics() {
    const classes = this.getClasses();
    const properties = this.getProperties();

    return {
      totalTriples: this.store.size,
      totalClasses: classes.length,
      totalObjectProperties: properties.objectProperties.length,
      totalDatatypeProperties: properties.datatypeProperties.length,
      namespaces: {
        k360: this.baseIRI,
        safe: this.safeIRI,
        pm: `${this.legacyIRI}pm#`,
        pmbok: `${this.legacyIRI}pmbok#`,
        prince2: `${this.legacyIRI}prince2#`,
      },
      agentDomains: [
        'VRO', 'PMO', 'TMO', 'FinOps', 'OKR',
        'Governance', 'Planning', 'OCM', 'Notification', 'AgentOperations'
      ],
    };
  }

  /**
   * Get all concepts for a specific agent domain
   */
  getAgentDomainConcepts(agentType: string): string[] {
    const domainPrefix = `${this.baseIRI}`;
    const concepts: string[] = [];

    // Domain mappings
    const domainClasses: Record<string, string[]> = {
      vro: ['Investment', 'Benefit', 'BenefitRealization', 'ValueMetric', 'InvestmentPortfolio'],
      pmo: ['Project', 'Program', 'FlowMetric', 'ScheduleVariance', 'ResourceAllocation', 'DeliveryRisk'],
      tmo: ['TransformationProgram', 'Initiative', 'AdoptionMetric', 'TransformationFatigue', 'BusinessOutcome'],
      finops: ['Budget', 'CostRecord', 'Forecast', 'CostAnomaly', 'CostOptimization', 'SpendCategory'],
      okr: ['OKR', 'Objective', 'KeyResult', 'AlignmentScore', 'OrphanedProject', 'OKRCascade'],
      governance: ['Policy', 'PolicyRule', 'ComplianceCheckpoint', 'ComplianceViolation', 'AuditTrail', 'Risk', 'RiskMitigation'],
      planning: ['CapacityPlan', 'Resource', 'Roadmap', 'Scenario', 'DependencyAnalysis', 'CapacityForecast'],
      ocm: ['ReadinessAssessment', 'Stakeholder', 'StakeholderGroup', 'TrainingRecord', 'ChangeImpact', 'AdoptionBarrier'],
      notification: ['Notification', 'Alert', 'AgentFinding', 'EscalationPath', 'NotificationRule'],
      risk: ['Risk', 'RiskMitigation', 'RegulatoryFramework'], // Alias for governance risk subset
    };

    const normalizedType = agentType.toLowerCase().replace(/agent$/i, '');
    const classNames = domainClasses[normalizedType] || [];

    for (const className of classNames) {
      concepts.push(`${domainPrefix}${className}`);
    }

    return concepts;
  }

  /**
   * Find cross-domain relationships between agent concepts
   * Key for multi-agent reasoning
   */
  getCrossDomainRelationships(concept1: string, concept2: string): Quad[] {
    const relationships: Quad[] = [];

    // Find direct relationships
    const directQuads = this.store.getQuads(
      namedNode(concept1),
      null,
      namedNode(concept2),
      null
    );
    relationships.push(...directQuads);

    // Find inverse relationships
    const inverseQuads = this.store.getQuads(
      namedNode(concept2),
      null,
      namedNode(concept1),
      null
    );
    relationships.push(...inverseQuads);

    return relationships;
  }

  /**
   * Get the N3 store for direct SPARQL-like queries
   */
  getStore(): Store {
    return this.store;
  }
}

// Singleton instance
export const ontologyService = new OntologyService();

// Auto-load ontologies on import
ontologyService.loadOntologies().catch(console.error);
