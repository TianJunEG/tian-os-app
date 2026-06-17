import express from 'express';
import { protect } from '../middleware/auth.js';
import { resolveStudent } from '../utils/studentContext.js';
import ComicProgress from '../models/ComicProgress.js';
import Skill from '../models/Skill.js';
import { recordAttempt } from '../utils/masteryEngine.js';

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

// POST /api/comics/:episodeId/complete
// Body: { problems: [{ problemId, correct }] }
router.post('/:episodeId/complete', async (req, res) => {
  try {
    const student = await resolveStudent(req, null, { write: true });
    const studentId = student._id;
    const workspaceId = student.workspaceId;
    const { episodeId } = req.params;
    const { problems = [] } = req.body;

    // Upsert progress record (the source of truth for "episode done").
    await ComicProgress.findOneAndUpdate(
      { studentId, episodeId },
      { studentId, episodeId, workspaceId, problems, completedAt: new Date() },
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

export default router;
