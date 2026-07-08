import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Parent visibility of a child's test-paper sittings. Auth + the resolveStudent
// guardian gate + the model are mocked, so this exercises routing, the access gate,
// and response shaping without a DB.
const resolveStudent = vi.fn();
const sessionFind = vi.fn();
const sessionFindOne = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = { id: 'parent_1', role: 'parent' }; next(); },
}));
vi.mock('../utils/studentContext.js', () => ({ resolveStudent: (...a) => resolveStudent(...a) }));
vi.mock('../models/TestPaperSession.js', () => ({ default: { find: (...a) => sessionFind(...a), findOne: (...a) => sessionFindOne(...a) } }));

const sortLeanArr = (items) => ({ select: () => ({ sort: () => ({ lean: () => Promise.resolve(items) }) }) });
const oneLean = (obj) => ({ lean: () => Promise.resolve(obj) });

let router;
async function request(path) {
  return new Promise((resolve, reject) => {
    const req = { method: 'GET', url: path, path, originalUrl: path, query: {}, body: {}, headers: {}, params: {} };
    const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(p) { resolve({ status: this.statusCode, data: p }); } };
    router.handle(req, res, (e) => (e ? reject(e) : resolve({ status: res.statusCode, data: null })));
  });
}

describe('parent test-paper routes', () => {
  beforeAll(async () => { router = (await import('./parentTestPapers.js')).default; });
  afterEach(() => { vi.clearAllMocks(); });

  it("lists a linked child's completed sittings", async () => {
    resolveStudent.mockResolvedValueOnce({ _id: 'stu1' });
    sessionFind.mockReturnValueOnce(sortLeanArr([
      { sessionId: 'sess1', paperCode: 'P5-MATH-MOCK-A', paperTitle: 'P5 Mock A', level: 'P5', category: 'mock', topic: '', durationMinutes: 50, summary: { scorePct: 80 }, completedAt: '2026-07-02T00:00:00Z' },
    ]));
    const res = await request('/stu1/test-papers');
    expect(res.status).toBe(200);
    expect(res.data.studentId).toBe('stu1');
    expect(res.data.sittings).toHaveLength(1);
    expect(res.data.sittings[0]).toMatchObject({ sessionId: 'sess1', category: 'mock' });
  });

  it('403s when the parent has no guardian link to the child', async () => {
    resolveStudent.mockRejectedValueOnce(Object.assign(new Error('No guardian link to this student'), { status: 403 }));
    const res = await request('/stranger/test-papers');
    expect(res.status).toBe(403);
    expect(sessionFind).not.toHaveBeenCalled();
  });

  it('returns a full marked review of one sitting', async () => {
    resolveStudent.mockResolvedValueOnce({ _id: 'stu1' });
    sessionFindOne.mockReturnValueOnce(oneLean({
      sessionId: 'sess1', paperCode: 'P5-MATH-MOCK-A', paperTitle: 'P5 Mock A', level: 'P5', category: 'mock', topic: '',
      summary: { scorePct: 50 }, completedAt: '2026-07-02T00:00:00Z',
      questions: [{ order: 1, marks: 1, type: 'short_answer', stem: '2 + 2 = ?', answer: '4' }],
      answers: [{ order: 1, answer: '4', correct: true, marksAwarded: 1 }],
    }));
    const res = await request('/stu1/test-papers/sittings/sess1');
    expect(res.status).toBe(200);
    expect(res.data.questions).toHaveLength(1);
    expect(res.data.questions[0]).toMatchObject({ studentAnswer: '4', correctAnswer: '4', correct: true });
  });

  it('403s a sitting review for an unlinked child (before any DB read)', async () => {
    resolveStudent.mockRejectedValueOnce(Object.assign(new Error('No guardian link to this student'), { status: 403 }));
    const res = await request('/stranger/test-papers/sittings/sess1');
    expect(res.status).toBe(403);
    expect(sessionFindOne).not.toHaveBeenCalled();
  });

  it('404s a missing sitting for a linked child', async () => {
    resolveStudent.mockResolvedValueOnce({ _id: 'stu1' });
    sessionFindOne.mockReturnValueOnce(oneLean(null));
    const res = await request('/stu1/test-papers/sittings/nope');
    expect(res.status).toBe(404);
  });
});
