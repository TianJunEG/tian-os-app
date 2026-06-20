import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import ComicProgress from '../models/ComicProgress.js';
import Skill from '../models/Skill.js';
import { recordAttempt, weakSkills } from '../utils/masteryEngine.js';

const router = express.Router();
router.use(protect);

// problemId → Skill slug. Mastery is written only for slugs that resolve to a
// real Skill document (see below); unmapped/unknown slugs save progress but are
// skipped for mastery rather than failing. Problem IDs are episode-prefixed
// (Ep1 is unprefixed for historical reasons) and globally unique.
// Values are real Skill.slug values from the MathPath taxonomy
// (scripts/domains/*.js), so MasteryRecord writes land on the right skill.
const SKILL_SLUG = {
  // Episode 1 — Hawker Heroes (money)
  'p1-q1': 'mon.add',
  'p2-q1': 'mon.add',
  'p3-q1': 'mon.change',
  // Episode 2 — Sticker Squad (division)
  'e2-p1-q1': 'op.div.facts',
  'e2-p2-q1': 'op.div.facts',
  'e2-p3-q1': 'op.div.remainder',
  // Episode 3 — Party Planner (money)
  'e3-p1-q1': 'mon.add',
  'e3-p2-q1': 'mon.total-cost',
  'e3-p3-q1': 'mon.change',
  // Episode 4 — Pattern Detective (number patterns)
  'e4-p1-q1': 'ns.pattern.arithmetic',
  'e4-p2-q1': 'ns.pattern.arithmetic',
  'e4-p3-q1': 'ns.pattern.complex',
  // Episode 5 — Measure Up (length)
  'e5-p1-q1': 'mea.length',
  'e5-p2-q1': 'mea.length',
  'e5-p3-q1': 'mea.unit-convert',
  // Episode 6 — Beat the Clock (time)
  'e6-p1-q1': 'tim.duration',
  'e6-p2-q1': 'tim.duration',
  'e6-p3-q1': 'tim.convert',
  // Episode 7 — Chart Champions (data)
  'e7-p1-q1': 'stat.bar-graphs',
  'e7-p2-q1': 'stat.bar-graphs',
  'e7-p3-q1': 'stat.bar-graphs',
  // Episode 8 — Fair Shares (fractions of a quantity)
  'e8-p1-q1': 'fr.of-quantity',
  'e8-p2-q1': 'fr.of-quantity',
  'e8-p3-q1': 'fr.of-quantity',
  // Episode 9 — Shape Squad (2D shape properties)
  'e9-p1-q1': 'geo.2d-properties',
  'e9-p2-q1': 'geo.2d-properties',
  'e9-p3-q1': 'geo.2d-properties',
  // Episode 10 — Weighing In (mass)
  'e10-p1-q1': 'mea.mass',
  'e10-p2-q1': 'mea.unit-convert',
  'e10-p3-q1': 'mea.mass',
  // Episode 11 — Topped Up (capacity)
  'e11-p1-q1': 'mea.volume-capacity',
  'e11-p2-q1': 'mea.unit-convert',
  'e11-p3-q1': 'mea.volume-capacity',
  // Episode 12 — Table Master (multiplication)
  'e12-p1-q1': 'op.mult.facts',
  'e12-p2-q1': 'op.mult.facts',
  'e12-p3-q1': 'op.mult.facts',
  // Episode 13 — Perimeter Patrol (perimeter)
  'e13-p1-q1': 'ap.perimeter-rect',
  'e13-p2-q1': 'ap.perimeter-rect',
  'e13-p3-q1': 'ap.perimeter-rect',
  // Episode 14 — Round It Out (place value & rounding)
  'e14-p1-q1': 'ns.pv.3-digit',
  'e14-p2-q1': 'ns.round.10-100',
  'e14-p3-q1': 'ns.round.10-100',
  // Episode 15 — The Grand Quiz (mixed-skills finale)
  'e15-p1-q1': 'ns.pattern.arithmetic',
  'e15-p2-q1': 'op.div.facts',
  'e15-p3-q1': 'fr.of-quantity',
  'e15-p4-q1': 'mea.unit-convert',
};

// Reverse the problem-level map to skill slug → [episodeId,…] (episode order),
// so a weak skill can point at the comic episode(s) that practise it.
function episodeIdFor(problemId) {
  const m = /^e(\d+)-/.exec(problemId);
  return `ep-${String(m ? Number(m[1]) : 1).padStart(3, '0')}`;
}
const EPISODES_BY_SKILL = (() => {
  const map = {};
  for (const [problemId, slug] of Object.entries(SKILL_SLUG)) {
    const ep = episodeIdFor(problemId);
    (map[slug] ||= []);
    if (!map[slug].includes(ep)) map[slug].push(ep);
  }
  return map;
})();

// POST /api/comics/:episodeId/complete
// Body: { problems: [{ problemId, correct, workingStrokes? }] }
// workingStrokes is the optional lightweight scratchpad (vector strokes only).
const MAX_PROBLEMS = 64;               // an episode has a handful of panels; bound the array
const MAX_WORKING_STROKES = 400;       // cap stroke count per problem
const MAX_POINTS_PER_STROKE = 1500;    // cap points within a single stroke
const MAX_WORKING_BYTES = 512 * 1024;  // hard ceiling on serialised working per problem

const finiteNum = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

// Whitelist a single point to its known numeric coordinates, dropping anything
// else a client might attach.
const sanitizePoint = (pt) => {
  if (!pt || typeof pt !== 'object') return null;
  const out = {};
  for (const k of ['x', 'y', 't', 'p', 'tx', 'ty']) {
    const n = finiteNum(pt[k]);
    if (n !== undefined) out[k] = n;
  }
  return out.x !== undefined && out.y !== undefined ? out : null;
};

// Whitelist one stroke to the known WorkingCanvas shape and cap its point count,
// so a client can't smuggle arbitrary keys or an unbounded points array into the
// Mixed field.
const sanitizeStroke = (s) => {
  if (!s || typeof s !== 'object' || !Array.isArray(s.points)) return null;
  const points = s.points.slice(0, MAX_POINTS_PER_STROKE).map(sanitizePoint).filter(Boolean);
  if (!points.length) return null;
  const out = { points };
  if (typeof s.tool === 'string') out.tool = s.tool.slice(0, 24);
  if (typeof s.colour === 'string') out.colour = s.colour.slice(0, 32);
  if (typeof s.text === 'string') out.text = s.text.slice(0, 80); // stamp glyph
  if (typeof s.pointerType === 'string') out.pointerType = s.pointerType.slice(0, 16);
  if (typeof s.timestamp === 'string') out.timestamp = s.timestamp.slice(0, 40);
  const size = finiteNum(s.size);
  if (size !== undefined) out.size = size;
  return out;
};

// Sanitise + bound the scratchpad strokes for one problem. Returns undefined for
// no / empty / oversized working so the field is simply omitted from storage.
const sanitizeWorkingStrokes = (strokes) => {
  if (!Array.isArray(strokes) || !strokes.length) return undefined;
  const cleaned = strokes.slice(0, MAX_WORKING_STROKES).map(sanitizeStroke).filter(Boolean);
  if (!cleaned.length) return undefined;
  // Hard byte ceiling — drop the working rather than store an oversized blob.
  if (JSON.stringify(cleaned).length > MAX_WORKING_BYTES) return undefined;
  return cleaned;
};

router.post('/:episodeId/complete', async (req, res) => {
  try {
    const student = await resolveStudent(req, null, { write: true });
    const studentId = student._id;
    const workspaceId = student.workspaceId;
    const { episodeId } = req.params;
    const { problems = [] } = req.body;

    // Store only the fields we trust: problemId, correctness, and (optionally)
    // the sanitised + capped scratchpad strokes. The rasterised image and any
    // extra client keys are dropped, and stroke count / points-per-stroke / total
    // bytes are all bounded — so one document holds at most a few hundred KB of
    // working, well under the 16 MB BSON limit.
    const storedProblems = problems.slice(0, MAX_PROBLEMS).map((p) => {
      const out = { problemId: p.problemId, correct: !!p.correct };
      const ws = sanitizeWorkingStrokes(p.workingStrokes);
      if (ws) out.workingStrokes = ws;
      return out;
    });

    // Upsert progress record (the source of truth for "episode done").
    await ComicProgress.findOneAndUpdate(
      { studentId, episodeId },
      { studentId, episodeId, workspaceId, problems: storedProblems, completedAt: new Date() },
      { upsert: true, new: true },
    );

    // Write correct answers to MasteryRecord. The skill mapping is server-side
    // (client skill tags are untrusted). MasteryRecord.skillId is a real Skill
    // ObjectId, so resolve each comics slug to a Skill document and only record
    // for those that exist — unknown slugs save progress but are skipped here.
    const slugs = [...new Set(problems.map((p) => SKILL_SLUG[p.problemId]).filter(Boolean))];
    const skills = slugs.length ? await Skill.find({ slug: { $in: slugs } }, { _id: 1, slug: 1 }).lean() : [];
    const skillIdBySlug = new Map(skills.map((s) => [s.slug, s._id]));

    const missing = slugs.filter((s) => !skillIdBySlug.has(s));
    if (missing.length) {
      console.warn(`comics: no Skill found for slugs (mastery skipped): ${missing.join(', ')}`);
    }

    // Sequential, not concurrent: several episodes map multiple problems to the
    // same skill (e.g. Ep1 p1/p2 → mon.add), and concurrent recordAttempt calls
    // on one {studentId,skillId} would race the unique index and drop an attempt.
    for (const { problemId, correct } of problems) {
      const skillId = skillIdBySlug.get(SKILL_SLUG[problemId]);
      if (!skillId) continue;
      try {
        await recordAttempt({ studentId, skillId, workspaceId, correct, module: 'Comics', subject: 'Math' });
      } catch (e) {
        console.error(`comics: mastery write failed for ${problemId}: ${e.message}`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    console.error('comics complete error', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// GET /api/comics/progress — completed episode IDs for the current student
router.get('/progress', async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const records = await ComicProgress.find(
      { studentId: student._id },
      { episodeId: 1, completedAt: 1 },
    ).lean();
    res.json({ completed: records.map((r) => ({ episodeId: r.episodeId, completedAt: r.completedAt })) });
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/comics/recommended — the comic episode that practises the student's
// weakest MathPath skill (preferring one they haven't finished yet). Powers the
// adaptive "what to read next" entry; the frontend falls back to chronological
// resume when there is no signal yet (recommended: null).
router.get('/recommended', async (req, res) => {
  try {
    const student = await resolveStudent(req);
    const weak = await weakSkills(student._id, { limit: 12 }); // weakest first
    const done = new Set(
      (await ComicProgress.find({ studentId: student._id }, { episodeId: 1 }).lean()).map((r) => r.episodeId),
    );

    let fresh = null;  // covers a weak skill AND not yet completed (best)
    let review = null; // covers a weak skill but already completed (re-practice)
    for (const rec of weak) {
      const slug = rec.skillId?.slug;
      const eps = slug && EPISODES_BY_SKILL[slug];
      if (!eps || !eps.length) continue;
      const base = { skillSlug: slug, skillName: rec.skillId?.name || '' };
      const notDone = eps.find((id) => !done.has(id));
      if (notDone) { fresh = { ...base, episodeId: notDone }; break; }
      if (!review) review = { ...base, episodeId: eps[0] };
    }

    res.json({ recommended: fresh || review || null });
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    console.error('comics recommended error', err);
    res.status(500).json({ error: 'Failed to compute recommendation' });
  }
});

// GET /api/comics/activity?studentId=… — a child's comic activity, for the
// parent "look what they did" surface (and the student's own). resolveStudent
// validates guardianship when studentId is supplied. Returns completed episodes
// (newest first) + the distinct skills practised; the frontend resolves episode
// titles from its episodes data.
router.get('/activity', async (req, res) => {
  try {
    const student = await resolveStudent(req, req.query.studentId);
    const records = await ComicProgress.find(
      { studentId: student._id },
      { episodeId: 1, completedAt: 1, problems: 1 },
    ).sort({ completedAt: -1 }).lean();

    const completed = records.map((r) => ({ episodeId: r.episodeId, completedAt: r.completedAt }));
    const slugs = [...new Set(
      records.flatMap((r) => (r.problems || []).map((p) => SKILL_SLUG[p.problemId]).filter(Boolean)),
    )];
    const skillDocs = slugs.length ? await Skill.find({ slug: { $in: slugs } }, { slug: 1, name: 1 }).lean() : [];
    const nameBySlug = new Map(skillDocs.map((s) => [s.slug, s.name]));
    const skills = slugs.map((slug) => ({ slug, name: nameBySlug.get(slug) || slug }));

    res.json({ completed, skills });
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    console.error('comics activity error', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
