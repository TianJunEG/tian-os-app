import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import MathPathPracticeSession from '../models/mathpath/MathPathPracticeSession.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';

// ---------------------------------------------------------------------------
// Route-level fluency tests for the Statistics domain.
// Mirrors mathpathRatioRate.test.js fluency section — only domain/skill differ.
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

describe('POST /api/mathpath/statistics/fluency/start', () => {
  it('returns 200 with domainId, benchmarks, and stripped questions', async () => {
    const res = await request(app)
      .post('/api/mathpath/statistics/fluency/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ skillId: 'ST001', count: 5 });
    expect(res.status).toBe(200);
    expect(res.body.domainId).toBe('statistics');
    expect(res.body.skillId).toBe('ST001');
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBeGreaterThan(0);
    expect(res.body.benchmarks).toBeDefined();
    res.body.questions.forEach((q) => {
      expect(q).not.toHaveProperty('answer');
      expect(q).not.toHaveProperty('acceptedAnswers');
    });
  });

  it('returns 400 when skillId is missing', async () => {
    const res = await request(app)
      .post('/api/mathpath/statistics/fluency/start')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/mathpath/statistics/fluency/:id/submit', () => {
  it('returns 200 with mode=fluency and a band', async () => {
    const startRes = await request(app)
      .post('/api/mathpath/statistics/fluency/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ skillId: 'ST001', count: 5 });
    expect(startRes.status).toBe(200);

    const { practiceSessionId, questions } = startRes.body;
    const responses = questions.map((q) => ({ questionId: q.questionId, studentAnswer: '__correct__', timeTaken: 8 }));

    const submitRes = await request(app)
      .post(`/api/mathpath/statistics/fluency/${practiceSessionId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ responses });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.mode).toBe('fluency');
    expect(typeof submitRes.body.band).toBe('string');
    expect(typeof submitRes.body.accuracy).toBe('number');
    expect(submitRes.body.domainId).toBe('statistics');
  });

  it('returns 404 for unknown session id', async () => {
    const res = await request(app)
      .post('/api/mathpath/statistics/fluency/nope/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ responses: [] });
    expect(res.status).toBe(404);
  });
});
