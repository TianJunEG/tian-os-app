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
const comicProgressFindOne = vi.fn(() => ({ lean: async () => null }));
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
  default: {
    findOneAndUpdate: (...a) => comicProgressFindOneAndUpdate(...a),
    find: (...a) => comicProgressFind(...a),
    findOne: (...a) => comicProgressFindOne(...a),
  },
}));
vi.mock('../models/Skill.js', () => ({
  default: { find: (...a) => skillFind(...a) },
}));

let router;

function request(path, { method = 'GET', body, query } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: method.toUpperCase(), url: path, path, originalUrl: path, query: query || {}, body: body || {}, headers: {}, params: {} };
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
    comicProgressFindOne.mockImplementation(() => ({ lean: async () => null }));
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

  it('sanitises + bounds scratchpad strokes (whitelists fields, drops image/junk, caps strokes & points)', async () => {
    const stroke = (pts = 2, extra = {}) => ({
      tool: 'pen', colour: '#111', size: 4,
      points: Array.from({ length: pts }, (_, i) => ({ x: i, y: i })),
      ...extra,
    });
    const res = await request('/ep-001/complete', {
      method: 'POST',
      body: { problems: [
        { problemId: 'p1-q1', correct: true,
          workingStrokes: [stroke(2, { junk: 'z'.repeat(100), evil: { nested: 1 } })],
          workingImage: 'data:image/png;base64,AAAA' },
        { problemId: 'p3-q1', correct: false, workingStrokes: Array.from({ length: 450 }, () => stroke(2)) },
        { problemId: 'e10-p1-q1', correct: true, workingStrokes: [stroke(2000)] }, // one huge stroke
        { problemId: 'p2-q1', correct: true }, // no working drawn
        { problemId: 'e8-p1-q1', correct: true, workingStrokes: [{ tool: 'pen' }] }, // no points → dropped
      ] },
    });

    expect(res.status).toBe(200);
    const [, update] = comicProgressFindOneAndUpdate.mock.calls[0];
    const stored = update.problems;
    // whitelisted to the known stroke shape; junk keys + rasterised image dropped
    expect(stored[0].workingStrokes).toHaveLength(1);
    expect(stored[0].workingStrokes[0]).toEqual({ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], tool: 'pen', colour: '#111', size: 4 });
    expect(stored[0].workingStrokes[0].junk).toBeUndefined();
    expect(stored[0].workingImage).toBeUndefined();
    // stroke count capped at 400
    expect(stored[1].workingStrokes).toHaveLength(400);
    // points within a single stroke capped at 1500
    expect(stored[2].workingStrokes[0].points).toHaveLength(1500);
    // a panel with no working stores no working field at all
    expect(stored[3]).toEqual({ problemId: 'p2-q1', correct: true });
    // a malformed stroke (no points) is dropped → no working field
    expect(stored[4].workingStrokes).toBeUndefined();
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

  it("returns a child's comic activity (episodes newest-first + named skills), parent-scoped", async () => {
    comicProgressFind.mockImplementationOnce(() => ({
      sort: () => ({
        lean: async () => [
          { episodeId: 'ep-003', completedAt: new Date('2026-02-02'), problems: [{ problemId: 'e3-p1-q1', correct: true, workingStrokes: [{ tool: 'pen', points: [{ x: 0, y: 0 }] }] }, { problemId: 'e3-p3-q1', correct: true }] },
          { episodeId: 'ep-001', completedAt: new Date('2026-01-01'), problems: [{ problemId: 'p1-q1', correct: true }] },
        ],
      }),
    }));
    skillFind.mockImplementationOnce(() => ({ lean: async () => [
      { slug: 'mon.add', name: 'Adding money' }, { slug: 'mon.change', name: 'Giving change' },
    ] }));

    const res = await request('/activity', { query: { studentId: 'child_9' } });

    expect(res.status).toBe(200);
    // resolveStudent validates guardianship with the explicit studentId
    expect(resolveStudentMock).toHaveBeenCalledWith(expect.anything(), 'child_9');
    expect(res.data.completed).toEqual([
      { episodeId: 'ep-003', completedAt: expect.any(Date), hasWorking: true },
      { episodeId: 'ep-001', completedAt: expect.any(Date), hasWorking: false },
    ]);
    // e3-p1-q1→mon.add, e3-p3-q1→mon.change, p1-q1→mon.add ⇒ distinct, name-resolved
    expect(res.data.skills).toEqual([
      { slug: 'mon.add', name: 'Adding money' },
      { slug: 'mon.change', name: 'Giving change' },
    ]);
  });

  it('propagates a guardianship access error from /activity', async () => {
    resolveStudentMock.mockRejectedValueOnce({ status: 403, message: 'Not your child.' });
    const res = await request('/activity', { query: { studentId: 'someone-elses-kid' } });
    expect(res.status).toBe(403);
    expect(res.data).toEqual({ error: 'Not your child.' });
  });

  it("returns a child's saved working for one episode (only problems with strokes, named by skill), parent-scoped", async () => {
    comicProgressFindOne.mockImplementationOnce(() => ({ lean: async () => ({
      completedAt: new Date('2026-02-02'),
      problems: [
        { problemId: 'p1-q1', correct: true, workingStrokes: [{ tool: 'pen', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] },
        { problemId: 'p3-q1', correct: false, workingStrokes: [{ tool: 'pen', points: [{ x: 2, y: 2 }, { x: 3, y: 3 }] }] },
        { problemId: 'p2-q1', correct: true }, // no working drawn → excluded
      ],
    }) }));
    skillFind.mockImplementationOnce(() => ({ lean: async () => [
      { slug: 'mon.add', name: 'Adding money' }, { slug: 'mon.change', name: 'Giving change' },
    ] }));

    const res = await request('/working', { query: { studentId: 'child_9', episodeId: 'ep-001' } });

    expect(res.status).toBe(200);
    // resolveStudent validates guardianship with the explicit studentId
    expect(resolveStudentMock).toHaveBeenCalledWith(expect.anything(), 'child_9');
    expect(comicProgressFindOne).toHaveBeenCalledWith(
      { studentId: 'student_1', episodeId: 'ep-001' },
      { problems: 1, completedAt: 1 },
    );
    expect(res.data.episodeId).toBe('ep-001');
    // only the problems that have working, tagged by skill + correctness; p2-q1 omitted
    expect(res.data.problems).toEqual([
      { problemId: 'p1-q1', correct: true, skillName: 'Adding money', workingStrokes: [{ tool: 'pen', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] },
      { problemId: 'p3-q1', correct: false, skillName: 'Giving change', workingStrokes: [{ tool: 'pen', points: [{ x: 2, y: 2 }, { x: 3, y: 3 }] }] },
    ]);
  });

  it('returns an empty working list when the episode has no record', async () => {
    comicProgressFindOne.mockImplementationOnce(() => ({ lean: async () => null }));
    const res = await request('/working', { query: { studentId: 'child_9', episodeId: 'ep-099' } });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ episodeId: 'ep-099', completedAt: null, problems: [] });
    expect(skillFind).not.toHaveBeenCalled(); // no slugs to resolve
  });

  it('400s when /working is missing episodeId', async () => {
    const res = await request('/working', { query: { studentId: 'child_9' } });
    expect(res.status).toBe(400);
    expect(comicProgressFindOne).not.toHaveBeenCalled();
  });

  it('propagates a guardianship access error from /working', async () => {
    resolveStudentMock.mockRejectedValueOnce({ status: 403, message: 'Not your child.' });
    const res = await request('/working', { query: { studentId: 'someone-elses-kid', episodeId: 'ep-001' } });
    expect(res.status).toBe(403);
    expect(res.data).toEqual({ error: 'Not your child.' });
  });
});
