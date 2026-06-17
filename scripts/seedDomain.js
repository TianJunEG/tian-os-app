// Generic MathPath domain loader. Every curriculum domain (Number Sense,
// Operations, Fractions, …) is authored as a plain data module and seeded by
// this one loader, so they all land in the existing Topic→Skill graph in a
// uniform, engine-compatible shape.
//
//   node scripts/seedDomain.js <domainFile>          (single)
//   node scripts/seedDomain.js domains/numberSense.js domains/operations.js
//   npm run seed:domains                              (all under scripts/domains)
//
// Run AFTER seedFoundation.js (needs the Math subject). Idempotent: upserts the
// topic + skills by slug and re-wires prerequisites every run; never deletes.
//
// ── Domain module shape ──────────────────────────────────────────────────────
// export default {
//   domain: 'Operations',          // metadata.domain on every skill
//   topic:  'Operations',          // Topic.name in the graph
//   topicOrder: 1,                 // Topic.order (curriculum position)
//   level:  'Primary 1',           // Topic.moeLevel
//   skills: [{
//     slug, name, level,                       // → name, moeLevel, metadata.levelTag
//     prerequisites: ['slug.a', 'slug.b'],     // → prerequisiteSkillIds (by slug)
//     masteryType,   // conceptual | procedural | factual | application
//     fluencyType,   // timed | accuracy | untimed-reasoning
//     fluency,       // optional { targetSeconds, targetAccuracy }  (timed skills)
//     misconceptions: [{ tag, label }],        // tag aligns with Question.misconceptionTag
//     practiceModes: ['fluency_drill','mcq',…],
//     remediation,   // optional { onRepeatedFail, reinforce:[slugs], strategy }
//     questionStructures: [{ mode, type, difficulty, stem, answerRule, misconceptionTag }],
//   }]
// }
import path from 'path';
import url from 'url';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';

dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const HERE = path.dirname(url.fileURLToPath(import.meta.url));

// Phase 1: upsert the topic and its skills (no prerequisite wiring yet).
export async function upsertTopicAndSkills(def, subjectId) {
  let topic = await Topic.findOne({ subjectId, name: def.topic });
  if (!topic) topic = await Topic.create({ subjectId, name: def.topic, moeLevel: def.level, order: def.topicOrder ?? 0 });
  else { topic.moeLevel = def.level; topic.order = def.topicOrder ?? topic.order; await topic.save(); }
  for (let i = 0; i < def.skills.length; i++) {
    const s = def.skills[i];
    let skill = await Skill.findOne({ slug: s.slug }) || await Skill.findOne({ topicId: topic._id, name: s.name });
    // Everything beyond the core graph fields (slug/name/level/prerequisites)
    // flows into metadata verbatim — masteryType, fluencyType, fluency,
    // misconceptions, practiceModes, remediation, questionStructures, plus any
    // domain-specific extras (e.g. render:'katex', visualModels:[…]).
    const { slug: _s, name: _n, level: _l, prerequisites: _p, ...rest } = s;
    const metadata = { domain: def.domain, levelTag: s.level, ...rest };
    if (!skill) skill = new Skill({ topicId: topic._id, name: s.name });
    skill.topicId = topic._id; skill.name = s.name; skill.slug = s.slug; skill.domain = def.domain;
    skill.moeLevel = s.level; skill.order = i; skill.metadata = metadata;
    await skill.save();
  }
}

// Phase 2: resolve prerequisites by slug against the DB (so cross-domain links
// resolve regardless of the order domains were seeded in).
export async function wirePrerequisites(def) {
  let links = 0;
  for (const s of def.skills) {
    const skill = await Skill.findOne({ slug: s.slug });
    if (!skill) continue;
    const ids = [];
    for (const pre of s.prerequisites || []) {
      const target = await Skill.findOne({ slug: pre });
      if (target) { ids.push(target._id); links++; }
    }
    skill.prerequisiteSkillIds = ids;
    await skill.save();
  }
  return links;
}

// Single-domain convenience (prereqs to other domains resolve only if already seeded).
export async function seedDomain(def, { subjectId }) {
  await upsertTopicAndSkills(def, subjectId);
  const links = await wirePrerequisites(def);
  return { topic: def.topic, skills: def.skills.length, links };
}

async function main() {
  let files = process.argv.slice(2);
  if (!files.length) {
    const dir = path.join(HERE, 'domains');
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.js')).map((f) => path.join('domains', f));
  }
  await mongoose.connect(URI);
  const math = await Subject.findOne({ key: 'math' });
  if (!math) { console.error('No Math subject — run `npm run seed:foundation` first.'); process.exit(1); }
  const defs = [];
  for (const f of files) defs.push((await import(url.pathToFileURL(path.resolve(HERE, f)).href)).default);
  // Global two-phase: create ALL skills first, then wire ALL prerequisites — so
  // cross-domain prerequisites resolve no matter the file order.
  for (const def of defs) await upsertTopicAndSkills(def, math._id);
  for (const def of defs) {
    const links = await wirePrerequisites(def);
    console.log(`✅ ${def.topic}: ${def.skills.length} skills, ${links} prerequisite links`);
  }
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
