// Verifies the Tian OS workspace privacy boundary: a user may only access a
// workspace they are an active member of. This is the rule that keeps school
// (teacher) data and private-tutoring data separate.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { requireWorkspace } from './workspace.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

let mongo;
const ids = {};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const tutorUserId = new mongoose.Types.ObjectId();
  const teacherUserId = new mongoose.Types.ObjectId();
  ids.tutorUserId = tutorUserId;
  ids.teacherUserId = teacherUserId;

  const tutorWs = await Workspace.create({ type: 'tutor', name: 'Private tuition', role: 'tutor', ownerUserId: tutorUserId });
  const schoolWs = await Workspace.create({ type: 'school', name: 'Greenwood', role: 'teacher', ownerUserId: teacherUserId });
  ids.tutorWs = tutorWs._id;
  ids.schoolWs = schoolWs._id;

  await WorkspaceMember.create({ workspaceId: tutorWs._id, userId: tutorUserId, role: 'tutor', status: 'active' });
  await WorkspaceMember.create({ workspaceId: schoolWs._id, userId: teacherUserId, role: 'teacher', status: 'active' });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

// Minimal Express req/res doubles.
function makeReqRes(userId, workspaceId) {
  const req = {
    user: { id: String(userId) },
    header: (h) => (h === 'X-Workspace-Id' ? (workspaceId ? String(workspaceId) : undefined) : undefined),
    query: {},
  };
  const res = {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  return { req, res };
}

describe('requireWorkspace — workspace privacy boundary', () => {
  it('allows a member into their own workspace', async () => {
    const { req, res } = makeReqRes(ids.tutorUserId, ids.tutorWs);
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(String(req.workspaceId)).toBe(String(ids.tutorWs));
    expect(req.workspaceRole).toBe('tutor');
  });

  it('denies access to a workspace the user is NOT a member of (teacher data stays out of a tutor session)', async () => {
    const { req, res } = makeReqRes(ids.tutorUserId, ids.schoolWs);
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('denies when no active workspace is supplied', async () => {
    const { req, res } = makeReqRes(ids.tutorUserId, null);
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  it('returns the correct error message when no workspace header is sent', async () => {
    const { req, res } = makeReqRes(ids.tutorUserId, null);
    await requireWorkspace(req, res, () => {});
    expect(res.body).toEqual({ error: 'No active workspace. Select a workspace first.' });
  });

  it('sets req.workspace to the full workspace document on success', async () => {
    const { req, res } = makeReqRes(ids.tutorUserId, ids.tutorWs);
    await requireWorkspace(req, res, () => {});
    expect(req.workspace).toBeDefined();
    expect(req.workspace.name).toBe('Private tuition');
    expect(req.workspace.type).toBe('tutor');
  });

  it('accepts workspaceId from query param when header is absent', async () => {
    const req = {
      user: { id: String(ids.tutorUserId) },
      header: () => undefined,
      query: { workspaceId: String(ids.tutorWs) },
    };
    const res = {
      statusCode: 200, body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; },
    };
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(String(req.workspaceId)).toBe(String(ids.tutorWs));
  });

  it('denies access to a non-existent workspace ID', async () => {
    const fakeWsId = new mongoose.Types.ObjectId();
    const { req, res } = makeReqRes(ids.tutorUserId, fakeWsId);
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Not a member of this workspace.');
  });

  it('denies when membership exists but status is not active', async () => {
    // Create a suspended membership
    const inactiveUserId = new mongoose.Types.ObjectId();
    await WorkspaceMember.create({
      workspaceId: ids.tutorWs,
      userId: inactiveUserId,
      role: 'tutor',
      status: 'suspended',
    });
    const { req, res } = makeReqRes(inactiveUserId, ids.tutorWs);
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for a malformed workspace ID that causes a DB error', async () => {
    const { req, res } = makeReqRes(ids.tutorUserId, 'not-a-valid-objectid');
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    // Malformed ObjectId throws in mongoose, caught by the try/catch
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid workspace.');
  });
});

describe('requireWorkspace — cross-workspace data isolation', () => {
  it('tutor user cannot access school workspace', async () => {
    const { req, res } = makeReqRes(ids.tutorUserId, ids.schoolWs);
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('teacher user cannot access tutor workspace', async () => {
    const { req, res } = makeReqRes(ids.teacherUserId, ids.tutorWs);
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('each user only gets their own workspace role', async () => {
    const { req: tutorReq, res: tutorRes } = makeReqRes(ids.tutorUserId, ids.tutorWs);
    await requireWorkspace(tutorReq, tutorRes, () => {});
    expect(tutorReq.workspaceRole).toBe('tutor');

    const { req: teacherReq, res: teacherRes } = makeReqRes(ids.teacherUserId, ids.schoolWs);
    await requireWorkspace(teacherReq, teacherRes, () => {});
    expect(teacherReq.workspaceRole).toBe('teacher');
  });

  it('uses the same generic error message whether workspace exists or not (no information leakage)', async () => {
    const fakeWsId = new mongoose.Types.ObjectId();
    // Non-existent workspace
    const { req: req1, res: res1 } = makeReqRes(ids.tutorUserId, fakeWsId);
    await requireWorkspace(req1, res1, () => {});
    // Existing workspace, wrong user
    const { req: req2, res: res2 } = makeReqRes(ids.tutorUserId, ids.schoolWs);
    await requireWorkspace(req2, res2, () => {});
    // Both should return the same error to prevent enumeration
    expect(res1.body.error).toBe(res2.body.error);
    expect(res1.statusCode).toBe(res2.statusCode);
  });
});

describe('requireWorkspace — QA bypass mode', () => {
  const origEnv = { ...process.env };

  afterAll(() => {
    process.env.NODE_ENV = origEnv.NODE_ENV;
    process.env.QA_DISABLE_RATE_LIMIT = origEnv.QA_DISABLE_RATE_LIMIT;
  });

  it('bypasses membership check when QA_DISABLE_RATE_LIMIT is set in non-production', async () => {
    process.env.NODE_ENV = 'test';
    process.env.QA_DISABLE_RATE_LIMIT = '1';

    const req = {
      user: { id: 'qa-user', role: 'tutor' },
      header: (h) => (h === 'X-Workspace-Id' ? 'any-workspace-id' : undefined),
      query: {},
    };
    const res = {
      statusCode: 200, body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; },
    };
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(req.workspaceId).toBe('any-workspace-id');
    expect(req.workspaceRole).toBe('tutor');

    // Restore
    process.env.NODE_ENV = origEnv.NODE_ENV;
    process.env.QA_DISABLE_RATE_LIMIT = origEnv.QA_DISABLE_RATE_LIMIT;
  });

  it('QA bypass falls back to a default workspace ID when none provided', async () => {
    process.env.NODE_ENV = 'test';
    process.env.QA_DISABLE_RATE_LIMIT = '1';

    const req = {
      user: { id: 'qa-user', role: 'student' },
      header: () => undefined,
      query: {},
    };
    const res = {
      statusCode: 200, body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; },
    };
    let nextCalled = false;
    await requireWorkspace(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(req.workspaceId).toBe('000000000000000000000000');
    expect(req.workspaceRole).toBe('student');

    // Restore
    process.env.NODE_ENV = origEnv.NODE_ENV;
    process.env.QA_DISABLE_RATE_LIMIT = origEnv.QA_DISABLE_RATE_LIMIT;
  });
});
