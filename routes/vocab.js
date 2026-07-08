import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import VocabProgress from '../models/VocabProgress.js';
import VocabMagicLink from '../models/VocabMagicLink.js';
import VocabEvent from '../models/VocabEvent.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { sendEmail, appBaseUrl } from '../utils/emailService.js';

// PUBLIC router for the standalone Vocabulary Builder's cross-device save.
// Passwordless: a learner proves ownership of their email via a magic link,
// then their progress syncs under that email. Isolated from the main app's
// auth — a vocab session token carries `kind: 'vocab'` and grants nothing else.
const router = express.Router();

const GROUPS = ['upper', 'middle'];
const LINK_TTL_MIN = 20; // magic link lifetime
const SESSION_TTL = '90d'; // signed-in session lifetime
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const normEmail = (e) => String(e || '').trim().toLowerCase();

// The public URL the app is served from — used only server-side to build the
// magic link, so a caller can never point the emailed link at another host.
function vocabAppUrl() {
  if (process.env.VOCAB_APP_URL) return process.env.VOCAB_APP_URL.replace(/\/+$/, '');
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN.trim()}/vocab`;
  return `${appBaseUrl()}/vocab`;
}

function verifyWithRotation(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (process.env.JWT_SECRET_PREVIOUS && err.name === 'JsonWebTokenError') {
      return jwt.verify(token, process.env.JWT_SECRET_PREVIOUS);
    }
    throw err;
  }
}

// Require a valid vocab session; sets req.vocabEmail. Rejects tokens that are
// not vocab sessions (e.g. a main-app JWT) so the two auth surfaces stay separate.
function vocabAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  try {
    const decoded = verifyWithRotation(token);
    if (decoded.kind !== 'vocab' || !decoded.email) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    req.vocabEmail = normEmail(decoded.email);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }
}

function magicLinkEmail(link) {
  const safe = link.replace(/"/g, '&quot;');
  return {
    subject: 'Your Vocabulary Builder sign-in link',
    text: `Tap this link to save your progress across devices:\n\n${link}\n\nThis link expires in ${LINK_TTL_MIN} minutes. If you didn't ask for it, you can ignore this email.`,
    html: `
      <h2>Save your Vocabulary Builder progress</h2>
      <p>Tap the button below to sign in on this device. Your practice progress will then follow you to any device you sign in on.</p>
      <p><a href="${safe}" style="background-color:#1f8a5b;color:#fff;padding:12px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;">Sign in &amp; save my progress</a></p>
      <p style="color:#666;font-size:13px;">This link expires in ${LINK_TTL_MIN} minutes and can be used once. If you didn't request it, you can safely ignore this email.</p>
      <p style="color:#666;font-size:13px;">If the button doesn't work, paste this link into your browser:<br>${safe}</p>
    `,
  };
}

// POST /api/vocab/auth/request  { email }  → emails a one-time sign-in link.
// Always returns { ok: true } (no account-existence leak). Tight rate limit to
// prevent using us as an email bomb.
router.post(
  '/auth/request',
  rateLimit(15, 15 * 60 * 1000),
  asyncHandler(async (req, res) => {
    const email = normEmail(req.body?.email);
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    const raw = crypto.randomBytes(32).toString('base64url');
    await VocabMagicLink.create({
      email,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + LINK_TTL_MIN * 60 * 1000),
    });

    const link = `${vocabAppUrl()}?vbtoken=${raw}`;
    let emailed = false;
    try {
      if (process.env.RESEND_API_KEY || process.env.NODE_ENV === 'test') {
        await sendEmail({ to: email, ...magicLinkEmail(link) });
        emailed = true;
      } else {
        // Demo mode (no email provider configured): surface the link in logs so
        // the flow is still usable before RESEND_API_KEY is set.
        console.log(`[vocab] magic link for ${email}: ${link}`);
      }
    } catch (err) {
      console.error('[vocab] magic-link email failed:', err.message);
      console.log(`[vocab] magic link for ${email}: ${link}`);
    }

    const out = { ok: true, emailed };
    // Never expose the token in production; handy for local dev + tests.
    if (process.env.NODE_ENV !== 'production') out.devLink = link;
    res.json(out);
  })
);

// POST /api/vocab/auth/verify  { token }  → { token: <session jwt>, email }.
router.post(
  '/auth/verify',
  rateLimit(60, 15 * 60 * 1000),
  asyncHandler(async (req, res) => {
    const raw = String(req.body?.token || '');
    if (!raw) return res.status(400).json({ error: 'Missing token.' });

    const link = await VocabMagicLink.findOne({ tokenHash: sha256(raw) });
    if (!link || link.usedAt || link.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'This sign-in link is invalid or has expired. Request a new one.' });
    }
    link.usedAt = new Date();
    await link.save();

    const session = jwt.sign({ email: link.email, kind: 'vocab' }, process.env.JWT_SECRET, {
      expiresIn: SESSION_TTL,
    });
    res.json({ token: session, email: link.email });
  })
);

// GET /api/vocab/progress  → { email, progress: { <group>: { state, updatedAt } } }
router.get(
  '/progress',
  vocabAuth,
  asyncHandler(async (req, res) => {
    const rows = await VocabProgress.find({ email: req.vocabEmail });
    const progress = {};
    for (const row of rows) progress[row.group] = { state: row.state, updatedAt: row.updatedAt };
    res.json({ email: req.vocabEmail, progress });
  })
);

// PUT /api/vocab/progress  { group, state }  → upsert one level group.
router.put(
  '/progress',
  vocabAuth,
  asyncHandler(async (req, res) => {
    const group = String(req.body?.group || '');
    if (!GROUPS.includes(group)) return res.status(400).json({ error: 'Invalid level group.' });
    const state = req.body?.state ?? null;
    const updatedAt = new Date();
    await VocabProgress.updateOne(
      { email: req.vocabEmail, group },
      { $set: { state, updatedAt } },
      { upsert: true }
    );
    res.json({ ok: true, updatedAt });
  })
);

// ---- analytics events ------------------------------------------------------

const EVENT_TYPES = new Set(['session_start', 'session_complete', 'answer', 'probe_result', 'sign_in']);
const MAX_BATCH = 100;

// Whitelist the fields we store, coercing/bounding each — the endpoint is public,
// so `data` must never become a place to stash arbitrary blobs.
function sanitizeEventData(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : undefined);
  const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined);
  const bool = (v) => (typeof v === 'boolean' ? v : undefined);
  const set = (k, v) => {
    if (v !== undefined) out[k] = v;
  };
  set('word', str(raw.word, 64));
  set('taskType', str(raw.taskType, 40));
  set('tier', num(raw.tier, 0, 9));
  set('correct', bool(raw.correct));
  set('distractor', str(raw.distractor, 64));
  set('ms', num(raw.ms, 0, 600000));
  set('size', num(raw.size, 0, 100));
  set('correctCount', num(raw.correctCount, 0, 100));
  set('total', num(raw.total, 0, 100));
  set('focus', bool(raw.focus));
  set('probe', bool(raw.probe));
  return Object.keys(out).length ? out : null;
}

// Soft auth: attach the signed-in email if a valid vocab session is present,
// but never block — anonymous learners are logged too (that's the funnel).
function softVocabEmail(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = verifyWithRotation(token);
    return decoded.kind === 'vocab' && decoded.email ? normEmail(decoded.email) : null;
  } catch {
    return null;
  }
}

// POST /api/vocab/events  { clientId, sessionId?, events: [{ type, group?, data? }] }
router.post(
  '/events',
  rateLimit(120, 15 * 60 * 1000),
  asyncHandler(async (req, res) => {
    const clientId = String(req.body?.clientId || '').slice(0, 64);
    if (!clientId) return res.status(400).json({ error: 'Missing clientId.' });
    const list = Array.isArray(req.body?.events) ? req.body.events.slice(0, MAX_BATCH) : [];
    if (!list.length) return res.json({ ok: true, stored: 0 });

    const email = softVocabEmail(req);
    const sessionId = req.body?.sessionId ? String(req.body.sessionId).slice(0, 64) : null;
    const now = Date.now();

    const docs = [];
    for (const ev of list) {
      const type = String(ev?.type || '');
      if (!EVENT_TYPES.has(type)) continue;
      docs.push({
        clientId,
        email,
        sessionId,
        type,
        group: ev?.group ? String(ev.group).slice(0, 16) : null,
        data: sanitizeEventData(ev?.data),
        createdAt: new Date(now),
      });
    }
    if (docs.length) await VocabEvent.insertMany(docs, { ordered: false });
    res.json({ ok: true, stored: docs.length });
  })
);

// ---- metrics (admin read-side) --------------------------------------------

// Guard the metrics with a shared secret (VOCAB_ADMIN_KEY). If it isn't set the
// endpoint 404s — it's opt-in and stays fully off in any environment without a
// key, so analytics are never exposed by default.
function requireAdmin(req, res, next) {
  const key = process.env.VOCAB_ADMIN_KEY;
  if (!key) return res.status(404).json({ error: 'Not found' });
  const provided = String(req.headers['x-vocab-admin-key'] || req.query.key || '');
  const a = Buffer.from(provided);
  const b = Buffer.from(key);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /api/vocab/admin/metrics?days=30  → engagement + cold-probe summary.
router.get(
  '/admin/metrics',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $gte: since } };
    const day = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    const week = { $dateToString: { format: '%G-W%V', date: '$createdAt' } };
    const pct = (correct, n) => (n ? Math.round((correct / n) * 1000) / 10 : null);

    const [byType, clients, returning, ans, probe, probeByWeek, sessionsByDay] = await Promise.all([
      VocabEvent.aggregate([{ $match: match }, { $group: { _id: '$type', n: { $sum: 1 } } }]),
      VocabEvent.aggregate([
        { $match: match },
        { $group: { _id: '$clientId', hasEmail: { $max: { $cond: [{ $ifNull: ['$email', false] }, 1, 0] } } } },
        { $group: { _id: null, total: { $sum: 1 }, signedIn: { $sum: '$hasEmail' } } },
      ]),
      VocabEvent.aggregate([
        { $match: { ...match, type: 'session_start' } },
        { $group: { _id: { c: '$clientId', d: day } } },
        { $group: { _id: '$_id.c', days: { $sum: 1 } } },
        { $group: { _id: null, returning: { $sum: { $cond: [{ $gte: ['$days', 2] }, 1, 0] } }, any: { $sum: 1 } } },
      ]),
      VocabEvent.aggregate([
        { $match: { ...match, type: 'answer' } },
        { $group: { _id: null, n: { $sum: 1 }, correct: { $sum: { $cond: ['$data.correct', 1, 0] } } } },
      ]),
      VocabEvent.aggregate([
        { $match: { ...match, type: 'probe_result' } },
        { $group: { _id: null, n: { $sum: 1 }, correct: { $sum: { $cond: ['$data.correct', 1, 0] } } } },
      ]),
      VocabEvent.aggregate([
        { $match: { ...match, type: 'probe_result' } },
        { $group: { _id: week, n: { $sum: 1 }, correct: { $sum: { $cond: ['$data.correct', 1, 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      VocabEvent.aggregate([
        { $match: { ...match, type: 'session_start' } },
        { $group: { _id: day, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const counts = Object.fromEntries(byType.map((r) => [r._id, r.n]));
    const c = clients[0] || { total: 0, signedIn: 0 };
    const ret = returning[0] || { returning: 0, any: 0 };
    const a = ans[0] || { n: 0, correct: 0 };
    const p = probe[0] || { n: 0, correct: 0 };

    res.json({
      windowDays: days,
      learners: {
        total: c.total,
        signedIn: c.signedIn,
        returning: ret.returning, // practised on ≥2 distinct days
        returnRate: ret.any ? Math.round((ret.returning / ret.any) * 1000) / 10 : null,
      },
      sessions: { started: counts.session_start || 0, completed: counts.session_complete || 0 },
      answers: { total: a.n, accuracy: pct(a.correct, a.n) },
      coldProbe: {
        total: p.n,
        accuracy: pct(p.correct, p.n), // transfer signal — track the trend, not the level
        byWeek: probeByWeek.map((w) => ({ week: w._id, n: w.n, accuracy: pct(w.correct, w.n) })),
      },
      sessionsByDay: sessionsByDay.map((d) => ({ day: d._id, n: d.n })),
    });
  })
);

export default router;
