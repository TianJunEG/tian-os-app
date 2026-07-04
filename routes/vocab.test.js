// Integration test for the Vocabulary Builder cross-device save + magic-link
// auth. Boots the real router against an in-memory Mongo and drives it over
// HTTP (no supertest available), covering the happy path and the security
// invariants: single-use / expiring links, no-enumeration, and session scoping.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-vocab';
process.env.VOCAB_ADMIN_KEY = 'test-admin-key';

const { default: vocabRouter } = await import('./vocab.js');
const VocabMagicLink = (await import('../models/VocabMagicLink.js')).default;
const VocabEvent = (await import('../models/VocabEvent.js')).default;

let mongo;
let base;
let server;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const app = express();
  app.use(express.json());
  app.use('/api/vocab', vocabRouter);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api/vocab`;
}, 60000);

afterAll(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const post = (path, body, headers = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const put = (path, body, headers = {}) =>
  fetch(base + path, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const get = (path, headers = {}) => fetch(base + path, { headers });

// Request a link and pull the raw token out of the dev response.
async function signIn(email) {
  const reqRes = await post('/auth/request', { email });
  const reqJson = await reqRes.json();
  const token = new URL(reqJson.devLink).searchParams.get('vbtoken');
  const verifyRes = await post('/auth/verify', { token });
  const verifyJson = await verifyRes.json();
  return { token, session: verifyJson.token, email: verifyJson.email };
}

describe('vocab magic-link auth + progress sync', () => {
  it('rejects an invalid email', async () => {
    const res = await post('/auth/request', { email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('request always succeeds (no account enumeration) and returns a dev link in test', async () => {
    const res = await post('/auth/request', { email: 'Alice@Example.com' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.devLink).toContain('vbtoken=');
  });

  it('normalises the email to lowercase in the issued session', async () => {
    const { email } = await signIn('MixedCase@Example.com');
    expect(email).toBe('mixedcase@example.com');
  });

  it('a magic link is single-use', async () => {
    const { token } = await signIn('reuse@example.com');
    const second = await post('/auth/verify', { token });
    expect(second.status).toBe(400); // already used
  });

  it('rejects a bogus / unknown token', async () => {
    const res = await post('/auth/verify', { token: 'totally-made-up' });
    expect(res.status).toBe(400);
  });

  it('rejects an expired link', async () => {
    await post('/auth/request', { email: 'expired@example.com' });
    // force-expire the freshest link for this email
    const link = await VocabMagicLink.findOne({ email: 'expired@example.com' }).sort({ createdAt: -1 });
    link.expiresAt = new Date(Date.now() - 1000);
    await link.save();
    // we can't re-derive the raw token (only the hash is stored), so assert via a
    // fresh request that a normal flow still expires: request → tamper → verify.
    const fresh = await post('/auth/request', { email: 'expired2@example.com' });
    const raw = new URL((await fresh.json()).devLink).searchParams.get('vbtoken');
    const dbLink = await VocabMagicLink.findOne({ email: 'expired2@example.com' }).sort({ createdAt: -1 });
    dbLink.expiresAt = new Date(Date.now() - 1000);
    await dbLink.save();
    const res = await post('/auth/verify', { token: raw });
    expect(res.status).toBe(400);
  });

  it('progress endpoints require a valid vocab session', async () => {
    expect((await get('/progress')).status).toBe(401);
    expect((await get('/progress', { Authorization: 'Bearer garbage' })).status).toBe(401);
    // a non-vocab JWT (no kind:'vocab') must be rejected too
    const jwt = (await import('jsonwebtoken')).default;
    const alien = jwt.sign({ id: 'x', role: 'parent' }, process.env.JWT_SECRET);
    expect((await get('/progress', { Authorization: `Bearer ${alien}` })).status).toBe(401);
  });

  it('saves and reads back progress for the signed-in email', async () => {
    const { session } = await signIn('save@example.com');
    const auth = { Authorization: `Bearer ${session}` };

    const state = { config: { sessionSize: 10 }, words: { vw_encroachment: { introduced: true, box: 2 } } };
    const putRes = await put('/progress', { group: 'upper', state }, auth);
    expect(putRes.status).toBe(200);

    const getRes = await get('/progress', auth);
    const json = await getRes.json();
    expect(json.email).toBe('save@example.com');
    expect(json.progress.upper.state).toEqual(state);
    expect(json.progress.middle).toBeUndefined();
  });

  it('upserts (overwrites) the same group rather than duplicating', async () => {
    const { session } = await signIn('upsert@example.com');
    const auth = { Authorization: `Bearer ${session}` };
    await put('/progress', { group: 'upper', state: { words: { a: 1 } } }, auth);
    await put('/progress', { group: 'upper', state: { words: { a: 1, b: 2 } } }, auth);
    const json = await (await get('/progress', auth)).json();
    expect(Object.keys(json.progress)).toEqual(['upper']);
    expect(json.progress.upper.state.words).toEqual({ a: 1, b: 2 });
  });

  it('rejects an unknown level group', async () => {
    const { session } = await signIn('badgroup@example.com');
    const res = await put('/progress', { group: 'lower', state: {} }, { Authorization: `Bearer ${session}` });
    expect(res.status).toBe(400);
  });

  it("one learner's progress is isolated from another's", async () => {
    const a = await signIn('a@example.com');
    const b = await signIn('b@example.com');
    await put('/progress', { group: 'upper', state: { owner: 'a' } }, { Authorization: `Bearer ${a.session}` });
    const bView = await (await get('/progress', { Authorization: `Bearer ${b.session}` })).json();
    expect(bView.progress.upper).toBeUndefined(); // b sees nothing of a's
  });

  it('logs anonymous analytics events and drops unknown types', async () => {
    const clientId = 'client-anon-1';
    const res = await post('/events', {
      clientId,
      sessionId: 'sess-1',
      events: [
        { type: 'session_start', group: 'upper', data: { size: 10 } },
        { type: 'answer', data: { word: 'resist', taskType: 'meaning_match', tier: 1, correct: true, ms: 3400 } },
        { type: 'not_a_real_type', data: { x: 1 } }, // dropped
      ],
    });
    expect(res.status).toBe(200);
    expect((await res.json()).stored).toBe(2); // unknown type not stored
    const rows = await VocabEvent.find({ clientId }).sort({ type: 1 });
    expect(rows.map((r) => r.type)).toEqual(['answer', 'session_start']);
    expect(rows.find((r) => r.type === 'answer').data.correct).toBe(true);
    expect(rows.find((r) => r.type === 'answer').email).toBeNull(); // anonymous
  });

  it('sanitises event data to whitelisted, bounded fields', async () => {
    const clientId = 'client-anon-2';
    await post('/events', {
      clientId,
      events: [
        {
          type: 'answer',
          data: { word: 'x'.repeat(500), correct: true, secret: 'should-not-store', ms: 9e9, tier: 99 },
        },
      ],
    });
    const row = await VocabEvent.findOne({ clientId });
    expect(row.data.secret).toBeUndefined(); // arbitrary keys dropped
    expect(row.data.word.length).toBe(64); // truncated
    expect(row.data.ms).toBe(600000); // clamped
    expect(row.data.tier).toBe(9); // clamped
  });

  it('attaches the signed-in email to events when a vocab session is present', async () => {
    const { session } = await signIn('tracked@example.com');
    const clientId = 'client-tracked';
    await post('/events', { clientId, events: [{ type: 'probe_result', data: { word: 'aloof', correct: false } }] }, { Authorization: `Bearer ${session}` });
    const row = await VocabEvent.findOne({ clientId });
    expect(row.email).toBe('tracked@example.com');
    expect(row.type).toBe('probe_result');
  });

  it('requires a clientId', async () => {
    expect((await post('/events', { events: [{ type: 'session_start' }] })).status).toBe(400);
  });

  describe('admin metrics', () => {
    const DAY = 24 * 60 * 60 * 1000;
    beforeAll(async () => {
      await VocabEvent.deleteMany({}); // isolate from earlier event tests
      const now = Date.now();
      // client A: sessions on two distinct days (returning), 2 answers (1 right), 1 probe right
      await VocabEvent.insertMany([
        { clientId: 'A', type: 'session_start', createdAt: new Date(now - 2 * DAY) },
        { clientId: 'A', type: 'session_start', createdAt: new Date(now - 1 * DAY) },
        { clientId: 'A', type: 'answer', data: { correct: true }, createdAt: new Date(now - 1 * DAY) },
        { clientId: 'A', type: 'answer', data: { correct: false }, createdAt: new Date(now - 1 * DAY) },
        { clientId: 'A', type: 'probe_result', data: { correct: true }, createdAt: new Date(now - 1 * DAY) },
      ]);
      // client B: one day only, signed in, 1 answer wrong, 1 probe wrong
      await VocabEvent.insertMany([
        { clientId: 'B', email: 'b@example.com', type: 'session_start', createdAt: new Date(now - 1 * DAY) },
        { clientId: 'B', email: 'b@example.com', type: 'answer', data: { correct: false }, createdAt: new Date(now - 1 * DAY) },
        { clientId: 'B', email: 'b@example.com', type: 'probe_result', data: { correct: false }, createdAt: new Date(now - 1 * DAY) },
      ]);
    });

    it('rejects without / with a wrong admin key', async () => {
      expect((await get('/admin/metrics')).status).toBe(401);
      expect((await get('/admin/metrics', { 'x-vocab-admin-key': 'nope' })).status).toBe(401);
    });

    it('summarises engagement, accuracy and the cold-probe trend', async () => {
      const res = await get('/admin/metrics?days=30', { 'x-vocab-admin-key': 'test-admin-key' });
      expect(res.status).toBe(200);
      const m = await res.json();
      expect(m.learners.total).toBe(2);
      expect(m.learners.signedIn).toBe(1);
      expect(m.learners.returning).toBe(1); // only A practised on 2 days
      expect(m.sessions.started).toBe(3);
      expect(m.answers.total).toBe(3);
      expect(m.answers.accuracy).toBe(33.3); // 1 of 3
      expect(m.coldProbe.total).toBe(2);
      expect(m.coldProbe.accuracy).toBe(50); // 1 of 2
      expect(Array.isArray(m.coldProbe.byWeek)).toBe(true);
      expect(m.sessionsByDay.reduce((s, d) => s + d.n, 0)).toBe(3);
    });
  });
});
