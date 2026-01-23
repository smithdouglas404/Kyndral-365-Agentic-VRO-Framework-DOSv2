// ============================================================================
// Neo4j Knowledge Graph Schema
// Phase 4: Knowledge Graph Layer
// ============================================================================

// ============================================================================
// NODE CONSTRAINTS (Ensure uniqueness and indexing)
// ============================================================================

// Project nodes
CREATE CONSTRAINT project_id_unique IF NOT EXISTS
FOR (p:Project) REQUIRE p.id IS UNIQUE;

CREATE INDEX project_status IF NOT EXISTS
FOR (p:Project) ON (p.status);

CREATE INDEX project_name IF NOT EXISTS
FOR (p:Project) ON (p.name);

// Portfolio nodes
CREATE CONSTRAINT portfolio_id_unique IF NOT EXISTS
FOR (p:Portfolio) REQUIRE p.id IS UNIQUE;

// Strategic Theme nodes
CREATE CONSTRAINT theme_id_unique IF NOT EXISTS
FOR (t:StrategicTheme) REQUIRE t.id IS UNIQUE;

// Epic nodes
CREATE CONSTRAINT epic_id_unique IF NOT EXISTS
FOR (e:Epic) REQUIRE e.id IS UNIQUE;

CREATE INDEX epic_status IF NOT EXISTS
FOR (e:Epic) ON (e.status);

// Feature nodes
CREATE CONSTRAINT feature_id_unique IF NOT EXISTS
FOR (f:Feature) REQUIRE f.id IS UNIQUE;

CREATE INDEX feature_status IF NOT EXISTS
FOR (f:Feature) ON (f.status);

// Story nodes
CREATE CONSTRAINT story_id_unique IF NOT EXISTS
FOR (s:Story) REQUIRE s.id IS UNIQUE;

CREATE INDEX story_status IF NOT EXISTS
FOR (s:Story) ON (s.status);

// Task nodes
CREATE CONSTRAINT task_id_unique IF NOT EXISTS
FOR (t:Task) REQUIRE t.id IS UNIQUE;

CREATE INDEX task_status IF NOT EXISTS
FOR (t:Task) ON (t.status);

CREATE INDEX task_due_date IF NOT EXISTS
FOR (t:Task) ON (t.dueDate);

// Risk nodes
CREATE CONSTRAINT risk_id_unique IF NOT EXISTS
FOR (r:Risk) REQUIRE r.id IS UNIQUE;

CREATE INDEX risk_probability IF NOT EXISTS
FOR (r:Risk) ON (r.probability);

CREATE INDEX risk_impact IF NOT EXISTS
FOR (r:Risk) ON (r.impact);

// Milestone nodes
CREATE CONSTRAINT milestone_id_unique IF NOT EXISTS
FOR (m:Milestone) REQUIRE m.id IS UNIQUE;

CREATE INDEX milestone_date IF NOT EXISTS
FOR (m:Milestone) ON (m.targetDate);

// Resource nodes
CREATE CONSTRAINT resource_id_unique IF NOT EXISTS
FOR (r:Resource) REQUIRE r.id IS UNIQUE;

CREATE INDEX resource_name IF NOT EXISTS
FOR (r:Resource) ON (r.name);

// Dependency nodes
CREATE CONSTRAINT dependency_id_unique IF NOT EXISTS
FOR (d:Dependency) REQUIRE d.id IS UNIQUE;

// Intervention nodes
CREATE CONSTRAINT intervention_id_unique IF NOT EXISTS
FOR (i:Intervention) REQUIRE i.id IS UNIQUE;

CREATE INDEX intervention_status IF NOT EXISTS
FOR (i:Intervention) ON (i.status);

// Agent nodes
CREATE CONSTRAINT agent_id_unique IF NOT EXISTS
FOR (a:Agent) REQUIRE a.id IS UNIQUE;

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

// Portfolio → Strategic Theme → Project hierarchy
// (p:Portfolio)-[:HAS_THEME]->(t:StrategicTheme)-[:HAS_PROJECT]->(pr:Project)

// Project → Epic → Feature → Story → Task hierarchy
// (pr:Project)-[:HAS_EPIC]->(e:Epic)-[:HAS_FEATURE]->(f:Feature)-[:HAS_STORY]->(s:Story)-[:HAS_TASK]->(t:Task)

// Dependencies
// (t1:Task)-[:DEPENDS_ON {type: 'finish_to_start', lag: 0}]->(t2:Task)
// (f1:Feature)-[:DEPENDS_ON]->(f2:Feature)
// (e1:Epic)-[:DEPENDS_ON]->(e2:Epic)

// Resource assignments
// (r:Resource)-[:ASSIGNED_TO {allocation: 0.5, startDate: '2024-01-01'}]->(t:Task)
// (r:Resource)-[:WORKS_ON]->(pr:Project)

// Risk relationships
// (risk:Risk)-[:THREATENS]->(pr:Project)
// (risk:Risk)-[:THREATENS]->(t:Task)
// (risk:Risk)-[:MITIGATES]->(otherRisk:Risk)

// Milestone relationships
// (m:Milestone)-[:BELONGS_TO]->(pr:Project)
// (t:Task)-[:ACHIEVES]->(m:Milestone)

// Intervention relationships
// (i:Intervention)-[:TARGETS]->(pr:Project)
// (i:Intervention)-[:TARGETS]->(t:Task)
// (a:Agent)-[:CREATED]->(i:Intervention)

// ============================================================================
// SAMPLE QUERIES FOR ANALYTICS
// ============================================================================

// 1. Find all hidden dependencies (indirect)
// MATCH path = (t1:Task)-[:DEPENDS_ON*2..]->(t2:Task)
// WHERE NOT (t1)-[:DEPENDS_ON]->(t2)
// RETURN t1.name, t2.name, length(path) as hops
// ORDER BY hops DESC;

// 2. Detect circular dependencies
// MATCH cycle = (t:Task)-[:DEPENDS_ON*]->(t)
// RETURN [node in nodes(cycle) | node.name] as circularDependency;

// 3. Resource conflicts (over-allocation)
// MATCH (r:Resource)-[a:ASSIGNED_TO]->(t:Task)
// WHERE t.status IN ['in_progress', 'planned']
// WITH r, sum(a.allocation) as totalAllocation, collect(t) as tasks
// WHERE totalAllocation > 1.0
// RETURN r.name, totalAllocation, [task in tasks | task.name] as conflictingTasks;

// 4. Critical path (using PageRank)
// CALL gds.pageRank.stream({
//   nodeProjection: 'Task',
//   relationshipProjection: 'DEPENDS_ON',
//   maxIterations: 20
// })
// YIELD nodeId, score
// RETURN gds.util.asNode(nodeId).name as taskName, score
// ORDER BY score DESC
// LIMIT 20;

// 5. Impact prediction (what-if analysis)
// MATCH (t:Task {id: 'task-123'})
// CALL apoc.path.subgraphAll(t, {
//   relationshipFilter: 'DEPENDS_ON>|HAS_TASK>',
//   maxLevel: 3
// })
// YIELD nodes
// RETURN [node in nodes | {name: node.name, type: labels(node)[0]}] as affectedNodes;

// 6. Root cause analysis
// MATCH path = (root)-[*..5]->(symptom:Task {id: 'delayed-task-456'})
// WHERE NOT ()-[]->(root)
// RETURN root.name, labels(root)[0] as rootType, length(path) as pathLength
// ORDER BY pathLength DESC
// LIMIT 10;

// 7. Feature dependencies across projects
// MATCH (f1:Feature)-[:DEPENDS_ON]->(f2:Feature)
// MATCH (pr1:Project)-[:HAS_EPIC]->(e1:Epic)-[:HAS_FEATURE]->(f1)
// MATCH (pr2:Project)-[:HAS_EPIC]->(e2:Epic)-[:HAS_FEATURE]->(f2)
// WHERE pr1.id <> pr2.id
// RETURN pr1.name, f1.name, pr2.name, f2.name;

// 8. Agent intervention effectiveness
// MATCH (a:Agent)-[:CREATED]->(i:Intervention)-[:TARGETS]->(pr:Project)
// WHERE i.status = 'completed'
// WITH a, count(i) as totalInterventions,
//      sum(CASE WHEN i.outcome = 'successful' THEN 1 ELSE 0 END) as successful
// RETURN a.name, totalInterventions, successful,
//        toFloat(successful) / totalInterventions as successRate
// ORDER BY successRate DESC;

// ============================================================================
// GRAPH DATA SCIENCE SETUP
// ============================================================================

// Create graph projection for PageRank (critical path analysis)
// CALL gds.graph.project(
//   'taskDependencyGraph',
//   'Task',
//   'DEPENDS_ON',
//   {
//     nodeProperties: ['duration', 'status'],
//     relationshipProperties: ['lag']
//   }
// );

// Create graph projection for community detection (resource clustering)
// CALL gds.graph.project(
//   'resourceAllocationGraph',
//   ['Resource', 'Task', 'Project'],
//   {
//     ASSIGNED_TO: { orientation: 'UNDIRECTED' },
//     WORKS_ON: { orientation: 'UNDIRECTED' }
//   }
// );

// ============================================================================
// MAINTENANCE QUERIES
// ============================================================================

// Clear all nodes and relationships (USE WITH CAUTION!)
// MATCH (n) DETACH DELETE n;

// Count nodes by label
// CALL db.labels() YIELD label
// CALL apoc.cypher.run('MATCH (:`'+label+'`) RETURN count(*) as count', {})
// YIELD value
// RETURN label, value.count as count
// ORDER BY count DESC;

// Count relationships by type
// CALL db.relationshipTypes() YIELD relationshipType
// CALL apoc.cypher.run('MATCH ()-[r:`'+relationshipType+'`]->() RETURN count(r) as count', {})
// YIELD value
// RETURN relationshipType, value.count as count
// ORDER BY count DESC;

// ============================================================================
// NOTES
// ============================================================================

// 1. This schema requires Neo4j 5.x with APOC and Graph Data Science plugins
// 2. For Replit deployment, use Neo4j Aura (cloud) instead of local Neo4j
// 3. Run this file using: cypher-shell -u neo4j -p password < schema.cypher
// 4. Or execute queries manually in Neo4j Browser: http://localhost:7474
