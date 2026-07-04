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

const { default: vocabRouter } = await import('./vocab.js');
const VocabMagicLink = (await import('../models/VocabMagicLink.js')).default;

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
});
