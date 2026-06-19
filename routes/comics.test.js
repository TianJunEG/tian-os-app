import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Locks in the comics route correctness verified live against the DB:
//  - student/workspace come from resolveStudent (NOT req.user._id, which the
//    JWT never carries),
//  - problemId → real Skill slug → Skill._id before writing mastery,
//  - every problem records an attempt (incl. several problems on one skill),
//  - unknown slugs save progress but are skipped for mastery,
//  - resolveStudent {status} errors propagate.

const MOCK_STUDENT = { _id: 'student_1', workspaceId: 'ws_1' };
const resolveStudentMock = vi.fn(async () => MOCK_STUDENT);
const recordAttempt = vi.fn(async () => ({}));
const weakSkillsMock = vi.fn(async () => []);

const comicProgressFindOneAndUpdate = vi.fn(async () => ({}));
const comicProgressFind = vi.fn(() => ({
  lean: async () => [{ episodeId: 'ep-001', completedAt: new Date('2026-01-01') }],
}));
const skillFind = vi.fn(() => ({
  lean: async () => [
    { _id: 'skill_mon_add', slug: 'mon.add' },
    { _id: 'skill_mon_change', slug: 'mon.change' },
  ],
}));

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = { id: 'user_1', role: 'student' }; next(); },
}));
vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));
vi.mock('../utils/masteryEngine.js', () => ({
  recordAttempt: (...args) => recordAttempt(...args),
  weakSkills: (...args) => weakSkillsMock(...args),
}));
vi.mock('../models/ComicProgress.js', () => ({
  default: { findOneAndUpdate: (...a) => comicProgressFindOneAndUpdate(...a), find: (...a) => comicProgressFind(...a) },
}));
vi.mock('../models/Skill.js', () => ({
  default: { find: (...a) => skillFind(...a) },
}));

let router;

function request(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: method.toUpperCase(), url: path, path, originalUrl: path, query: {}, body: body || {}, headers: {}, params: {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
      send(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => (err ? reject(err) : resolve({ status: res.statusCode, data: null })));
  });
}

describe('comics routes', () => {
  beforeAll(async () => { router = (await import('./comics.js')).default; });
  afterEach(() => {
    vi.clearAllMocks();
    resolveStudentMock.mockImplementation(async () => MOCK_STUDENT);
    weakSkillsMock.mockImplementation(async () => []);
    comicProgressFind.mockImplementation(() => ({ lean: async () => [{ episodeId: 'ep-001', completedAt: new Date('2026-01-01') }] }));
    skillFind.mockImplementation(() => ({ lean: async () => [
      { _id: 'skill_mon_add', slug: 'mon.add' }, { _id: 'skill_mon_change', slug: 'mon.change' },
    ] }));
  });

  it('saves progress and records mastery against the resolved student, workspace and real skills', async () => {
    const res = await request('/ep-001/complete', {
      method: 'POST',
      body: { problems: [
        { problemId: 'p1-q1', correct: true },   // → mon.add
        { problemId: 'p2-q1', correct: true },   // → mon.add (same skill)
        { problemId: 'p3-q1', correct: false },  // → mon.change
      ] },
    });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });

    // progress upsert keyed on the resolved student, carrying its workspace
    expect(comicProgressFindOneAndUpdate).toHaveBeenCalledWith(
      { studentId: 'student_1', episodeId: 'ep-001' },
      expect.objectContaining({ studentId: 'student_1', workspaceId: 'ws_1', episodeId: 'ep-001' }),
      { upsert: true, new: true },
    );

    // looked up the mapped slugs (not invented strings)
    expect(skillFind).toHaveBeenCalledWith(
      { slug: { $in: expect.arrayContaining(['mon.add', 'mon.change']) } },
      { _id: 1, slug: 1 },
    );

    // every problem records an attempt — including BOTH that map to mon.add
    expect(recordAttempt).toHaveBeenCalledTimes(3);
    const byArgs = recordAttempt.mock.calls.map(([a]) => a);
    expect(byArgs.filter((a) => a.skillId === 'skill_mon_add')).toHaveLength(2);
    expect(byArgs.filter((a) => a.skillId === 'skill_mon_change')).toHaveLength(1);
    byArgs.forEach((a) => {
      expect(a.studentId).toBe('student_1');
      expect(a.workspaceId).toBe('ws_1');
      expect(a.module).toBe('Comics');
    });
    // correctness flows through per problem
    const change = byArgs.find((a) => a.skillId === 'skill_mon_change');
    expect(change.correct).toBe(false);
  });

  it('still saves progress but skips mastery for an unmapped problem id', async () => {
    const res = await request('/ep-001/complete', {
      method: 'POST',
      body: { problems: [{ problemId: 'totally-unknown', correct: true }] },
    });

    expect(res.status).toBe(200);
    expect(comicProgressFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(skillFind).not.toHaveBeenCalled();   // no slugs to resolve
    expect(recordAttempt).not.toHaveBeenCalled();
  });

  it('skips mastery (but saves progress) when a mapped slug has no Skill yet', async () => {
    skillFind.mockImplementationOnce(() => ({ lean: async () => [] })); // taxonomy not seeded
    const res = await request('/ep-001/complete', {
      method: 'POST',
      body: { problems: [{ problemId: 'p1-q1', correct: true }] },
    });

    expect(res.status).toBe(200);
    expect(comicProgressFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(recordAttempt).not.toHaveBeenCalled();
  });

  it('returns completed episodes for the resolved student', async () => {
    const res = await request('/progress');

    expect(res.status).toBe(200);
    expect(comicProgressFind).toHaveBeenCalledWith({ studentId: 'student_1' }, { episodeId: 1, completedAt: 1 });
    expect(res.data.completed).toEqual([{ episodeId: 'ep-001', completedAt: expect.any(Date) }]);
  });

  it('propagates a resolveStudent access error as its status', async () => {
    resolveStudentMock.mockRejectedValueOnce({ status: 403, message: 'View-only access does not permit this action.' });
    const res = await request('/ep-001/complete', { method: 'POST', body: { problems: [] } });

    expect(res.status).toBe(403);
    expect(res.data).toEqual({ error: 'View-only access does not permit this action.' });
  });

  it('recommends the episode for the weakest skill the student has not finished', async () => {
    // weakest skill = length → ep-005 (e5 problems map to mea.length); ep-001 is
    // already completed (default comicProgressFind), so ep-005 is the fresh pick.
    weakSkillsMock.mockResolvedValueOnce([
      { skillId: { slug: 'mea.length', name: 'Length' } },
      { skillId: { slug: 'op.mult.facts', name: 'Multiplication' } },
    ]);
    const res = await request('/recommended');

    expect(res.status).toBe(200);
    expect(res.data.recommended).toEqual({ episodeId: 'ep-005', skillSlug: 'mea.length', skillName: 'Length' });
  });

  it('falls back to a completed episode (re-practice) when every covering episode is done', async () => {
    weakSkillsMock.mockResolvedValueOnce([{ skillId: { slug: 'mon.change', name: 'Giving change' } }]);
    // mon.change is covered by ep-001 (p3-q1) and ep-003 (e3-p3-q1); mark both done
    comicProgressFind.mockImplementationOnce(() => ({ lean: async () => [{ episodeId: 'ep-001' }, { episodeId: 'ep-003' }] }));
    const res = await request('/recommended');

    expect(res.status).toBe(200);
    expect(res.data.recommended.skillSlug).toBe('mon.change');
    expect(['ep-001', 'ep-003']).toContain(res.data.recommended.episodeId);
  });

  it('returns recommended:null when no weak skill maps to a comic', async () => {
    weakSkillsMock.mockResolvedValueOnce([{ skillId: { slug: 'algebra.something-not-in-comics', name: 'Algebra' } }]);
    const res = await request('/recommended');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ recommended: null });
  });
});
