const fs = require('fs');
const path = require('path');

const SRC = 'server/ontology/schema';
const OUT = 'ontology-package';

const order = ['core.ttl', 'safe.ttl', 'pmbok.ttl', 'prince2.ttl', 'k360.ttl', 'bridging.ttl'];

const titles = {
  'core.ttl': 'MODULE A — CORE PM ONTOLOGY (pm:)  — framework-neutral base',
  'safe.ttl': 'MODULE B — SAFe 6.0 (safe:)  — Scaled Agile hierarchy',
  'pmbok.ttl': 'MODULE C — PMBOK (pmbok:)  — PMI process groups & knowledge areas',
  'prince2.ttl': 'MODULE D — PRINCE2 (prince2:)  — controlled-stage governance',
  'k360.ttl': 'MODULE E — K360 ENTERPRISE (k360:, safe6:)  — agent domains + temporal KG',
  'bridging.ttl': 'MODULE F — BRIDGING AXIOMS  — cross-framework equivalences',
};

function stripPrefixes(txt) {
  return txt.split('\n').filter(l => !/^@prefix/.test(l)).join('\n').trim();
}

function localClasses(txt, prefix) {
  const re = new RegExp(`${prefix}:([A-Za-z0-9_]+)\\s+a\\s+owl:Class`, 'g');
  const set = new Set(); let m;
  while ((m = re.exec(txt)) !== null) set.add(m[1]);
  return set;
}

const bodies = {};
for (const f of order) bodies[f] = fs.readFileSync(path.join(SRC, f), 'utf8');

// k360 uses safe: to mean the scaledagileframework namespace. Remap to safe6: to
// avoid colliding with the nextera safe: defined in safe.ttl/bridging.ttl.
const k360Remapped = bodies['k360.ttl'].replace(/\bsafe:/g, 'safe6:');

// Auto-generate equivalence bridges between the two SAFe class sets.
const safeClasses = localClasses(bodies['safe.ttl'], 'safe');
const safe6Classes = localClasses(k360Remapped, 'safe6');
const shared = [...safe6Classes].filter(c => safeClasses.has(c)).sort();

const header = `@prefix pm:      <http://nextera.energy/ontology/pm#> .
@prefix safe:    <http://nextera.energy/ontology/safe#> .
@prefix pmbok:   <http://nextera.energy/ontology/pmbok#> .
@prefix prince2: <http://nextera.energy/ontology/prince2#> .
@prefix k360:    <https://kyndryl.com/k360/ontology#> .
@prefix safe6:   <https://scaledagileframework.com/ontology#> .
@prefix rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix skos:    <http://www.w3.org/2004/02/skos/core#> .
@prefix dc:      <http://purl.org/dc/elements/1.1/> .
`;

const banner = (t) => `\n\n# ${'═'.repeat(78)}\n# ${t}\n# ${'═'.repeat(78)}\n`;

let out = `# ${'═'.repeat(78)}
# SMITH CLARITY — UNIFIED ENTERPRISE PPM ONTOLOGY (MEGA)
# Auto-merged from 6 modular Turtle files. Generated ${new Date().toISOString().slice(0,10)}.
#
# Namespaces:
#   pm:      framework-neutral core PM concepts (the canonical bridge layer)
#   safe:    SAFe 6.0 classes (nextera dialect, bridged to pm:)
#   safe6:   SAFe classes as referenced inside the K360 module (scaledagile IRI)
#   pmbok:   PMBOK process/knowledge classes
#   prince2: PRINCE2 controlled-stage classes
#   k360:    Kyndryl K360 enterprise + agent-domain classes
#
# Load order matters: core → frameworks → k360 → bridging.
# ${'═'.repeat(78)}

${header}`;

for (const f of order) {
  out += banner(titles[f]);
  out += '\n' + (f === 'k360.ttl' ? stripPrefixes(k360Remapped) : stripPrefixes(bodies[f])) + '\n';
}

out += banner('MODULE G — GENERATED SAFe ↔ SAFe6 UNIFICATION BRIDGES');
out += `\n# The K360 module defines SAFe classes under the scaledagileframework IRI (safe6:),\n# while the standalone SAFe module uses the nextera IRI (safe:). These axioms unify\n# the ${shared.length} overlapping classes so reasoners treat them as one concept.\n\n`;
for (const c of shared) out += `safe6:${c} owl:equivalentClass safe:${c} .\n`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'smith-clarity-mega-ontology.ttl'), out);

// Quick stats for the README
const stat = (txt, p) => (txt.match(new RegExp(`${p}`, 'g')) || []).length;
console.log('MEGA written:', path.join(OUT, 'smith-clarity-mega-ontology.ttl'));
console.log('Total lines:', out.split('\n').length);
console.log('owl:Class    :', stat(out, 'a owl:Class'));
console.log('ObjectProperty:', stat(out, 'a owl:ObjectProperty'));
console.log('DatatypeProperty:', stat(out, 'a owl:DatatypeProperty'));
console.log('equivalentClass:', stat(out, 'owl:equivalentClass'));
console.log('Shared SAFe classes bridged:', shared.length, '->', shared.join(', '));
