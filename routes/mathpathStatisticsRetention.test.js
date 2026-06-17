import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';

// ---------------------------------------------------------------------------
// Route-level retention tests for the Statistics domain.
// Mirrors mathpathDecimalsRetention.test.js — only domain/skill differ.
// ---------------------------------------------------------------------------

const TEST_DB = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/tian-os-test';

let token;
let studentId;

async function loginStudent() {
  const res = await request(app).post('/api/auth/login').send({
    email: process.env.TEST_STUDENT_EMAIL || 'test-student@example.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'password123',
  });
  return { token: res.body.token, studentId: res.body.user?._id || res.body._id };
}

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
  const creds = await loginStudent();
  token = creds.token;
  studentId = creds.studentId;
});

afterEach(async () => {
  if (studentId) {
    await MathPathPracticeSession.deleteMany({ studentId, domainId: 'statistics' });
    await MathPathStudentSkillState.deleteMany({ studentId, domainId: 'statistics' });
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('GET /api/mathpath/statistics/retention', () => {
  it('returns 200 with domainId and retention buckets', async () => {
    const res = await request(app)
      .get('/api/mathpath/statistics/retention')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.domainId).toBe('statistics');
    expect(Array.isArray(res.body.upcomingReviews)).toBe(true);
    expect(Array.isArray(res.body.overdueReviews)).toBe(true);
    expect(Array.isArray(res.body.retentionHistory)).toBe(true);
  });
});

describe('POST /api/mathpath/statistics/retention/start', () => {
  it('returns 200 with session, strips answers, sets domainId', async () => {
    const res = await request(app)
      .post('/api/mathpath/statistics/retention/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ skillId: 'ST001' });
    expect(res.status).toBe(200);
    expect(res.body.domainId).toBe('statistics');
    expect(res.body.skillId).toBe('ST001');
    expect(res.body.mode).toBe('retention');
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBeGreaterThan(0);
    res.body.questions.forEach((q) => {
      expect(q).not.toHaveProperty('answer');
      expect(q).not.toHaveProperty('acceptedAnswers');
    });
  });

  it('returns 400 when skillId is missing', async () => {
    const res = await request(app)
      .post('/api/mathpath/statistics/retention/start')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/mathpath/statistics/retention/:id/submit', () => {
  it('returns 200 with mode=retention and scores the review', async () => {
    const startRes = await request(app)
      .post('/api/mathpath/statistics/retention/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ skillId: 'ST001' });
    expect(startRes.status).toBe(200);

    const { practiceSessionId, questions } = startRes.body;
    const responses = questions.map((q) => ({ questionId: q.questionId, studentAnswer: '__correct__', timeTaken: 8 }));

    const submitRes = await request(app)
      .post(`/api/mathpath/statistics/retention/${practiceSessionId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ responses, lastIntervalDays: 3 });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.mode).toBe('retention');
    expect(typeof submitRes.body.accuracy).toBe('number');
    expect(typeof submitRes.body.retained).toBe('boolean');
    expect(submitRes.body.domainId).toBe('statistics');
  });

  it('returns 404 for unknown session id', async () => {
    const res = await request(app)
      .post('/api/mathpath/statistics/retention/nope/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ responses: [] });
    expect(res.status).toBe(404);
  });
});
