import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Open registration so these tests can exercise the full signup flow.
process.env.FEAT_OPEN_REGISTRATION = '1';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

const emailMocks = vi.hoisted(() => ({
  sendWelcomeEmail: vi.fn(() => Promise.resolve({ messageId: 'welcome-1' })),
}));

vi.mock('../utils/emailService.js', async () => {
  const actual = await vi.importActual('../utils/emailService.js');
  return {
    ...actual,
    sendWelcomeEmail: (...args) => emailMocks.sendWelcomeEmail(...args),
    appBaseUrl: () => 'http://localhost:3000',
  };
});

const authRoutes = (await import('./auth.js')).default;
const contextRoutes = (await import('./context.js')).default;
const tutorRoutes = (await import('./tutor.js')).default;

let mongo;
let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function register({ role = 'tutor', email = `${role}-${Date.now()}@example.test` } = {}) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: role === 'tutor' ? 'Nadia Tutor' : 'Priya Parent',
      email,
      password: 'secret123',
      role,
    }),
  });
}

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.QA_DISABLE_RATE_LIMIT = '1';
  mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
  await mongoose.connect(mongo.getUri());

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/context', contextRoutes);
  app.use('/api/tutor', tutorRoutes);
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}, 60000);

beforeEach(async () => {
  vi.clearAllMocks();
  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    WorkspaceMember.deleteMany({}),
  ]);
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('auth registration workspace onboarding', () => {
  it('registering a tutor creates user, workspace, membership, and default workspace', async () => {
    const { response, body } = await register({ role: 'tutor', email: 'new.tutor@example.test' });

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    const user = await User.findOne({ email: 'new.tutor@example.test' });
    expect(user).toMatchObject({ role: 'tutor', roles: ['tutor'] });
    expect(user.defaultWorkspace).toBeTruthy();

    const workspace = await Workspace.findById(user.defaultWorkspace);
    expect(workspace).toMatchObject({
      type: 'tutor',
      role: 'tutor',
      ownerUserId: user._id,
    });
    expect(workspace.name).toBe("Nadia Tutor's Tutor Workspace");

    const member = await WorkspaceMember.findOne({ workspaceId: workspace._id, userId: user._id });
    expect(member).toMatchObject({ role: 'tutor', status: 'active' });
  });

  it('/api/context returns the new tutor workspace and /api/tutor/home accepts it', async () => {
    const { body: registered } = await register({ role: 'tutor', email: 'context.tutor@example.test' });
    const auth = { Authorization: `Bearer ${registered.token}` };

    const { response: contextResponse, body: context } = await request('/api/context', { headers: auth });
    expect(contextResponse.status).toBe(200);
    expect(context.workspaces).toHaveLength(1);
    expect(context.workspaces[0]).toMatchObject({ type: 'tutor', role: 'tutor' });
    expect(String(context.defaultWorkspaceId)).toBe(String(context.workspaces[0].id));

    const { response: tutorHomeResponse, body: tutorHome } = await request('/api/tutor/home', {
      headers: {
        ...auth,
        'X-Workspace-Id': context.workspaces[0].id,
      },
    });
    expect(tutorHomeResponse.status).toBe(200);
    expect(tutorHome).toMatchObject({ tutorName: 'Nadia Tutor', studentCount: 0 });
    expect(tutorHome.error ?? '').not.toMatch(/No active workspace/i);
  });

  it('registering a parent creates a parent workspace, membership, and default workspace', async () => {
    const { response } = await register({ role: 'parent', email: 'new.parent@example.test' });

    expect(response.status).toBe(201);
    const user = await User.findOne({ email: 'new.parent@example.test' });
    expect(user).toMatchObject({ role: 'parent', roles: ['parent'] });
    expect(user.defaultWorkspace).toBeTruthy();

    const workspace = await Workspace.findById(user.defaultWorkspace);
    expect(workspace).toMatchObject({
      type: 'parent',
      role: 'parent',
      ownerUserId: user._id,
    });

    const member = await WorkspaceMember.findOne({ workspaceId: workspace._id, userId: user._id });
    expect(member).toMatchObject({ role: 'parent', status: 'active' });
  });

  it('calls the welcome email function on registration', async () => {
    await register({ role: 'tutor', email: 'email.tutor@example.test' });

    expect(emailMocks.sendWelcomeEmail).toHaveBeenCalledWith(expect.objectContaining({
      role: 'tutor',
      loginUrl: 'http://localhost:3000/tutor',
      user: expect.objectContaining({ email: 'email.tutor@example.test' }),
    }));
  });

  it('still succeeds if the welcome email fails', async () => {
    emailMocks.sendWelcomeEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));

    const { response, body } = await register({ role: 'tutor', email: 'smtp.fail@example.test' });

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(await User.findOne({ email: 'smtp.fail@example.test' })).toBeTruthy();
    expect(await WorkspaceMember.countDocuments()).toBe(1);
  });
});

