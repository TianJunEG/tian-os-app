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
});
