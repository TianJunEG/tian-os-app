// Reconcile the legacy ad-hoc Math topics/skills (created by seedFoundation.js and
// seedExamPapers.js, slug='') onto the canonical domain skills (created by the
// domain modules, slug set). For each legacy→canonical pair it repoints every
// reference — Questions, MasteryRecords (de-duping so the unique
// {studentId,skillId} index isn't violated), and other skills' prerequisite
// links — then deletes the now-orphaned legacy skill. Empty legacy topics are
// removed and topic order is reset so the canonical domains lead (deterministic
// recommendations).
//
//   node scripts/reconcileDomains.js      (or: npm run reconcile:domains)
//
// Idempotent & re-runnable. Extend CANONICAL_ORDER / LEGACY_MAP as each new
// domain is added; re-run to fold its legacy equivalents in.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';
import MasteryRecord from '../models/MasteryRecord.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

// Canonical domain topics → curriculum order. Only built domains belong here.
const CANONICAL_ORDER = {
  'Number Sense': 0, 'Operations': 1, 'Fractions': 2, 'Decimals': 3, 'Percentage': 4,
  'Ratio & Rate': 5, 'Algebra': 6, 'Measurement': 7, 'Geometry': 8, 'Statistics': 9,
};

// Legacy skill name (slug==='') → canonical domain skill slug. Grows per domain.
const LEGACY_MAP = {
  'Place value to 1000': 'ns.pv.3-digit',
  'Place value to 100 000': 'ns.pv.4-5-digit',
  'Multiplication facts': 'op.mult.facts',
  'Long division': 'op.div.long',
  'Rounding whole numbers': 'ns.round.10-100',
  'Order of operations': 'op.order-of-ops',
  'Number patterns': 'ns.pattern.arithmetic',
  'Number patterns and grouping': 'ns.pattern.complex',
  // Fractions (legacy ad-hoc skills → canonical Fractions-domain slugs)
  'Understanding fractions': 'fr.meaning.parts',
  'Equivalent fractions': 'fr.equivalent',
  'Simplifying fractions': 'fr.simplify',
  'Adding like fractions': 'fr.add.same-denom',
  'Adding unlike fractions': 'fr.add.unlike',
  'Subtracting unlike fractions': 'fr.sub.unlike',
  'Multiplying fractions by whole numbers': 'fr.mult.fraction',
  'Mixed numbers and improper fractions': 'fr.mixed-improper',
  'Dividing by a fraction in context': 'fr.div.fraction',
  // Decimals (legacy ad-hoc skills → canonical Decimals-domain slugs)
  'Decimal place value': 'dec.place-value',
  'Decimals on a number line': 'dec.number-line',
  'Adding decimals': 'dec.add-sub',
  'Subtracting decimals': 'dec.add-sub',
  'Decimals and fractions': 'dec.to-fraction',
  // Percentage (legacy ad-hoc skills → canonical Percentage-domain slugs)
  'Understanding percentage': 'pct.meaning',
  'Percentage of a quantity': 'pct.of-quantity',
  'Percentage increase and decrease': 'pct.increase-decrease',
  'Percentage word problems': 'pct.of-quantity',
  'Percentage before and after (repeated identity)': 'pct.before-after',
  // Ratio & Rate (legacy ad-hoc skills → canonical Ratio-&-Rate-domain slugs)
  'Understanding ratio': 'rr.meaning',
  'Simplifying and equivalent ratios': 'rr.simplify',
  'Ratio word problems (comparing quantities)': 'rr.divide',
  'Ratio before and after (difference unchanged)': 'rr.before-after',
  'Ratio with multiple quantities and total value': 'rr.divide-3',
  'Rate': 'rr.rate',
  'Speed, distance and time': 'rr.speed',
  'Average speed and relative motion': 'rr.speed-avg',
  'Rate and tiered charges': 'rr.rate-tiered',
  // Algebra (legacy ad-hoc skills → canonical Algebra-domain slugs)
  'Algebraic notation and forming expressions': 'alg.notation',
  'Evaluating algebraic expressions': 'alg.substitute',
  'Simplifying algebraic expressions': 'alg.simplify-add',
  'Solving word problems with algebra': 'alg.word-to-equation',
  // Geometry (legacy ad-hoc skills → canonical Geometry-domain slugs)
  'Parallel and perpendicular lines': 'geo.lines',
  'Symmetry': 'geo.symmetry',
  'Position and compass directions': 'geo.position',
  'Angles on a line and at a point': 'geo.angle-line-point',
  'Angles in special quadrilaterals': 'geo.angle-quad',
  'Drawing and constructing figures': 'geo.construct',
  'Visualising solids and unit cubes': 'geo.nets-views',
  'Perimeter of rectangles': 'geo.perimeter',
  'Area of rectangles': 'geo.area-rect',
  'Area of a triangle': 'geo.area-triangle',
  'Circumference and area of a circle': 'geo.circle',
  'Perimeter and area of circle parts': 'geo.circle-parts',
  'Composite figures (area and perimeter)': 'geo.composite',
  // Measurement (legacy ad-hoc skills → canonical Measurement-domain slugs)
  'Telling time and the 24-hour clock': 'mea.time-tell',
  'Duration and time intervals': 'mea.time-duration',
  'Comparing decimals, fractions and measurements': 'mea.compare-measures',
  'Reading measuring scales': 'mea.read-scales',
  'Volume of cubes and cuboids': 'mea.volume-cuboid',
  'Nets and volume of cuboids': 'mea.nets-volume',
  'Volume and water level (rate)': 'mea.volume-rate',
  // Statistics (legacy ad-hoc skills → canonical Statistics-domain slugs)
  'Reading tables and bar graphs': 'stat.bar-graphs',
  'Line graphs': 'stat.line-graphs',
  'Pie charts': 'stat.pie-charts',
  'Average (mean)': 'stat.average-intro',
  // Original "Number Fluency" topic skills (pre-date the slug field)
  'Times tables': 'op.mult.facts',
  'Mental addition and subtraction': 'op.mental.add-sub',
  'Percentage basics': 'pct.meaning',
  // Number theory & problem-solving heuristics → Operations
  'Factors and multiples': 'op.factors-multiples',
  'HCF and LCM word problems': 'op.hcf-lcm',
  'Model drawing': 'op.model-drawing',
  'Multi-step word problems': 'op.word-multi-step',
  // Money → Measurement
  'Money word problems and reasoning': 'mea.money',
  // Fraction word problems → Fractions
  'Fraction word problems': 'fr.word-problems',
  'Fraction word problems (remainder concept)': 'fr.word-multi-step',
  'Fraction word problems (equal units)': 'fr.exam-applications',
};

// Skills that MOVED between domains (have a slug already) → new canonical slug.
const SLUG_REMAP = {
  'ns.pv.decimal': 'dec.place-value',
  'ns.compare.decimals': 'dec.compare',
  'ns.order.decimals': 'dec.order',
  'ns.round.decimals': 'dec.round',
};

async function main() {
  await mongoose.connect(URI);
  const math = await Subject.findOne({ key: 'math' });
  if (!math) { console.error('No Math subject — run `npm run seed:foundation` first.'); process.exit(1); }
  const topicIds = (await Topic.find({ subjectId: math._id })).map((t) => t._id);

  const counts = { migrated: 0, q: 0, mrMoved: 0, mrDropped: 0, pre: 0 };
  // Repoint every reference from `source` onto `canonical`, then delete `source`.
  const migrate = async (source, canonical) => {
    if (!source || !canonical || String(source._id) === String(canonical._id)) return;
    const q = await Question.updateMany({ skillId: source._id }, { $set: { skillId: canonical._id, topicId: canonical.topicId } });
    counts.q += q.modifiedCount || 0;
    for (const mr of await MasteryRecord.find({ skillId: source._id })) {            // de-dupe per student
      const existing = await MasteryRecord.findOne({ studentId: mr.studentId, skillId: canonical._id });
      if (existing) { await mr.deleteOne(); counts.mrDropped++; }
      else { mr.skillId = canonical._id; await mr.save(); counts.mrMoved++; }
    }
    for (const r of await Skill.find({ prerequisiteSkillIds: source._id })) {        // re-wire prereq links
      r.prerequisiteSkillIds = [...new Set(r.prerequisiteSkillIds.map((id) =>
        String(id) === String(source._id) ? String(canonical._id) : String(id)))];
      await r.save();
      counts.pre++;
    }
    await source.deleteOne();
    counts.migrated++;
  };

  // (a) legacy slug-less skills, matched by name within this subject
  for (const [legacyName, slug] of Object.entries(LEGACY_MAP)) {
    const canonical = await Skill.findOne({ slug });
    if (!canonical) { console.warn(`  ⚠ canonical ${slug} not found — run seed:domains first; skipping`); continue; }
    // slug:{$in:['',null]} also matches docs where slug is ABSENT (pre-dates the
    // field) — Mongoose shows '' on read but the raw doc has no slug to match.
    for (const legacy of await Skill.find({ name: legacyName, slug: { $in: ['', null] }, topicId: { $in: topicIds } })) await migrate(legacy, canonical);
  }
  // (b) skills that moved between domains, matched by their previous slug
  for (const [oldSlug, slug] of Object.entries(SLUG_REMAP)) {
    await migrate(await Skill.findOne({ slug: oldSlug }), await Skill.findOne({ slug }));
  }

  // Remove legacy topics that are now empty.
  let topicsDropped = 0;
  for (const t of await Topic.find({ subjectId: math._id })) {
    if (await Skill.countDocuments({ topicId: t._id }) === 0) { await t.deleteOne(); topicsDropped++; }
  }

  // Re-order: canonical domains take their fixed positions; everything else is
  // pushed after them (relative order preserved) so the order is deterministic.
  const topics = await Topic.find({ subjectId: math._id });
  const legacy = topics.filter((t) => !(t.name in CANONICAL_ORDER)).sort((a, b) => a.order - b.order);
  for (const t of topics) if (t.name in CANONICAL_ORDER) { t.order = CANONICAL_ORDER[t.name]; await t.save(); }
  for (let i = 0; i < legacy.length; i++) { legacy[i].order = 20 + i; await legacy[i].save(); }

  console.log('✅ Domain reconciliation complete');
  console.log(`   Skills migrated: ${counts.migrated} (questions ${counts.q}, mastery moved ${counts.mrMoved}/dropped ${counts.mrDropped}, prereq links ${counts.pre})`);
  console.log(`   Empty topics removed: ${topicsDropped}`);
  console.log(`   Canonical domains lead: ${Object.keys(CANONICAL_ORDER).join(', ')}`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
