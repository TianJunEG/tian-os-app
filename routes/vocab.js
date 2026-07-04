import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import VocabProgress from '../models/VocabProgress.js';
import VocabMagicLink from '../models/VocabMagicLink.js';
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

export default router;
