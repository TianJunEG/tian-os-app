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
const SKILL_SLUG = {
  // Episode 1 — Hawker Heroes
  'p1-q1': 'addition-within-100',
  'p2-q1': 'money-addition',
  'p3-q1': 'money-subtraction',
  // Episode 2 — Sticker Squad
  'e2-p1-q1': 'division-equal-sharing',
  'e2-p2-q1': 'division-within-tables',
  'e2-p3-q1': 'division-with-remainder',
  // Episode 3 — Party Planner
  'e3-p1-q1': 'money-addition',
  'e3-p2-q1': 'money-multiplication',
  'e3-p3-q1': 'money-subtraction',
  // Episode 4 — Pattern Detective
  'e4-p1-q1': 'number-patterns',
  'e4-p2-q1': 'number-patterns',
  'e4-p3-q1': 'number-patterns',
  // Episode 5 — Measure Up
  'e5-p1-q1': 'measurement-length-addition',
  'e5-p2-q1': 'measurement-length-subtraction',
  'e5-p3-q1': 'measurement-conversion-cm-m',
  // Episode 6 — Beat the Clock
  'e6-p1-q1': 'time-duration',
  'e6-p2-q1': 'time-multiplication',
  'e6-p3-q1': 'time-conversion-min-to-hour',
  // Episode 7 — Chart Champions
  'e7-p1-q1': 'data-bar-chart-difference',
  'e7-p2-q1': 'data-addition',
  'e7-p3-q1': 'data-total',
  // Episode 8 — Fair Shares
  'e8-p1-q1': 'fraction-of-quantity',
  'e8-p2-q1': 'fraction-of-quantity',
  'e8-p3-q1': 'fraction-of-set',
  // Episode 9 — Shape Squad
  'e9-p1-q1': '2d-shape-sides',
  'e9-p2-q1': '2d-shape-vertices',
  'e9-p3-q1': '2d-shape-sides-total',
  // Episode 10 — Weighing In
  'e10-p1-q1': 'mass-addition',
  'e10-p2-q1': 'mass-conversion-kg-g',
  'e10-p3-q1': 'mass-subtraction',
  // Episode 11 — Topped Up
  'e11-p1-q1': 'capacity-addition',
  'e11-p2-q1': 'capacity-conversion-l-ml',
  'e11-p3-q1': 'capacity-subtraction',
  // Episode 12 — Table Master
  'e12-p1-q1': 'multiplication-tables',
  'e12-p2-q1': 'multiplication-word-problem',
  'e12-p3-q1': 'multiplication-multistep',
  // Episode 13 — Perimeter Patrol
  'e13-p1-q1': 'perimeter-square',
  'e13-p2-q1': 'perimeter-rectangle',
  'e13-p3-q1': 'perimeter-missing-side',
  // Episode 14 — Round It Out
  'e14-p1-q1': 'place-value',
  'e14-p2-q1': 'rounding-nearest-10',
  'e14-p3-q1': 'rounding-nearest-100',
  // Episode 15 — The Grand Quiz (mixed-skills finale)
  'e15-p1-q1': 'number-patterns',
  'e15-p2-q1': 'division-equal-sharing',
  'e15-p3-q1': 'fraction-of-quantity',
  'e15-p4-q1': 'measurement-conversion-m-cm',
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

    await Promise.allSettled(
      problems.map(({ problemId, correct }) => {
        const skillId = skillIdBySlug.get(SKILL_SLUG[problemId]);
        if (!skillId) return Promise.resolve();
        return recordAttempt({ studentId, skillId, workspaceId, correct, module: 'Comics', subject: 'Math' });
      }),
    );

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
