// BrightDesk ↔ TianOS integration endpoints.
//
// Two routes, no shared user auth system required:
//
//   POST /api/integrations/brightdesk/generate-token
//     Authenticated TianOS parent generates a signed 30-day token for one
//     student. They paste it into BrightDesk to link the accounts.
//
//   GET  /api/integrations/brightdesk/progress?token=<token>
//     Public (no TianOS login needed). BrightDesk calls this server-to-server
//     to fetch a safe progress summary. Returns mastery/weak-skills per domain.
//     Raw question text, student answers, and mistake details are NOT returned.
//
// Requires BRIGHTDESK_INTEGRATION_SECRET in env (separate from JWT_SECRET).

import express from 'express';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { resolveStudent } from '../utils/studentContext.js';
import Student from '../models/Student.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import { listDomains } from '../services/domains/domainRegistry.js';
import { getDomainSkillGraph } from '../services/mathpath/domainSkillGraphServer.js';

const router = express.Router();

function secret() {
  const s = process.env.BRIGHTDESK_INTEGRATION_SECRET;
  if (!s) throw Object.assign(new Error('BrightDesk integration is not configured on this server.'), { status: 503 });
  return s;
}

const MASTERED_STATUSES = new Set(['mastered', 'fluent', 'retained', 'mastered_fluent']);
const WEAK_STATUSES = new Set(['struggling', 'needs_practice', 'weak', 'not_started']);

// POST /api/integrations/brightdesk/generate-token
router.post('/generate-token', protect, asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'studentId required.' });

  const student = await resolveStudent(req, studentId);

  const token = jwt.sign(
    { sub: String(student._id), parentUserId: String(req.user.id || req.user._id), iss: 'tianos', aud: 'brightdesk' },
    secret(),
    { expiresIn: '30d' }
  );

  res.json({ token, expiresInDays: 30, studentName: student.name.split(' ')[0] });
}));

// POST /api/integrations/brightdesk/authorize — parent picks child, get redirect URL back to BrightDesk
router.post('/authorize', protect, asyncHandler(async (req, res) => {
  const { studentId, callback, state } = req.body;
  if (!studentId || !callback || !state) return res.status(400).json({ error: 'studentId, callback, and state are required.' });

  const student = await resolveStudent(req, studentId);

  const token = jwt.sign(
    { sub: String(student._id), parentUserId: String(req.user.id || req.user._id), iss: 'tianos', aud: 'brightdesk' },
    secret(),
    { expiresIn: '30d' }
  );

  const url = new URL(callback);
  url.searchParams.set('token', token);
  url.searchParams.set('state', state);
  res.json({ redirectUrl: url.toString() });
}));

// GET /api/integrations/brightdesk/progress?token=<token>
router.get('/progress', asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token query param required.' });

  let payload;
  try {
    payload = jwt.verify(token, secret(), { issuer: 'tianos', audience: 'brightdesk' });
  } catch {
    return res.status(401).json({ error: 'Token invalid or expired.' });
  }

  const student = await Student.findById(payload.sub).lean();
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const studentId = String(student._id);

  const activeDomainIds = new Set(
    await MathPathStudentSkillState.distinct('domainId', { studentId })
  );

  const activeDomains = listDomains().filter(
    (d) => d.subjectId === 'math' && activeDomainIds.has(d.domainId)
  );

  const domains = await Promise.all(
    activeDomains.map(async (d) => {
      const states = await MathPathStudentSkillState
        .find({ studentId, domainId: d.domainId })
        .lean();

      const graph = getDomainSkillGraph(d.domainId);
      const nameFor = (id) => graph.nameFor(id) || id;

      const mastered = states.filter((s) => MASTERED_STATUSES.has(String(s.status || '').toLowerCase()));
      const weak = states
        .filter((s) => WEAK_STATUSES.has(String(s.status || '').toLowerCase()))
        .slice(0, 3)
        .map((s) => nameFor(s.skillId));

      const lastActive = states.reduce((latest, s) => {
        const t = s.updatedAt || s.createdAt;
        return t && (!latest || t > latest) ? t : latest;
      }, null);

      const inProgress = states.find(
        (s) => !MASTERED_STATUSES.has(String(s.status || '').toLowerCase())
      );
      const recommendedNext = inProgress ? nameFor(inProgress.skillId) : null;

      return {
        domainId: d.domainId,
        domainName: d.displayName,
        mastery: {
          mastered: mastered.length,
          total: states.length,
          pct: states.length ? Math.round((mastered.length / states.length) * 100) : 0,
        },
        weakSkills: weak,
        recommendedNext,
        lastActiveAt: lastActive,
      };
    })
  );

  const overallLastActive = domains.reduce((latest, d) => {
    return d.lastActiveAt && (!latest || d.lastActiveAt > latest) ? d.lastActiveAt : latest;
  }, null);

  res.json({
    studentFirstName: student.name.split(' ')[0],
    domains,
    lastActiveAt: overallLastActive,
  });
}));

export default router;
