import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Teacher visibility of student test-paper sittings. Auth + workspace + all the
// models the 3 endpoints touch are mocked, so this exercises the routing, the
// class-ownership / roster access gates, and the response shaping without a DB.
const classFindOne = vi.fn();
const classStudentFind = vi.fn();
const studentFind = vi.fn();
const studentFindById = vi.fn();
const sessionFind = vi.fn();
const sessionFindOne = vi.fn();

let currentRole = 'teacher';

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = { id: 'teacher_1', role: 'teacher' }; next(); },
}));
vi.mock('../middleware/workspace.js', () => ({
  requireWorkspace: (req, _res, next) => { req.workspaceId = 'ws1'; req.workspaceRole = currentRole; next(); },
}));
vi.mock('../models/Class.js', () => ({ default: { findOne: (...a) => classFindOne(...a) } }));
vi.mock('../models/ClassStudent.js', () => ({ default: { find: (...a) => classStudentFind(...a) } }));
vi.mock('../models/Student.js', () => ({ default: { find: (...a) => studentFind(...a), findById: (...a) => studentFindById(...a) } }));
vi.mock('../models/TestPaperSession.js', () => ({ default: { find: (...a) => sessionFind(...a), findOne: (...a) => sessionFindOne(...a) } }));

const leanArr = (items) => ({ select: () => ({ lean: () => Promise.resolve(items) }) });
const leanObj = (obj) => ({ select: () => ({ lean: () => Promise.resolve(obj) }) });
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

describe('teacher test-paper routes', () => {
  beforeAll(async () => { router = (await import('./teacher.js')).default; });
  afterEach(() => { vi.clearAllMocks(); currentRole = 'teacher'; });

  it('lists per-student test-paper activity for an owned class', async () => {
    classFindOne.mockResolvedValueOnce({ _id: 'cls1', name: 'P5 Alpha', level: 'P5' });
    classStudentFind.mockResolvedValueOnce([{ studentId: 'stu1' }, { studentId: 'stu2' }]);
    studentFind.mockReturnValueOnce(leanArr([
      { _id: 'stu1', name: 'Amy', level: 'Primary 5' },
      { _id: 'stu2', name: 'Ben', level: 'Primary 5' },
    ]));
    sessionFind.mockReturnValueOnce(sortLeanArr([
      { studentId: 'stu1', paperCode: 'P5-MATH-MOCK-A', paperTitle: 'P5 Mock A', summary: { scorePct: 80 }, completedAt: '2026-07-02T00:00:00Z' },
      { studentId: 'stu1', paperCode: 'P5-FRAC-CHALLENGE', paperTitle: 'Fractions Challenge', summary: { scorePct: 60 }, completedAt: '2026-07-01T00:00:00Z' },
    ]));

    const res = await request('/classes/cls1/test-papers');
    expect(res.status).toBe(200);
    expect(res.data.summary).toMatchObject({ totalStudents: 2, studentsWithSittings: 1, totalSittings: 2, avgScorePct: 70 });
    const amy = res.data.students.find((s) => s.studentId === 'stu1');
    expect(amy).toMatchObject({ sittingCount: 2, papersAttempted: 2, bestScorePct: 80, latestScorePct: 80, latestPaperTitle: 'P5 Mock A' });
    const ben = res.data.students.find((s) => s.studentId === 'stu2');
    expect(ben).toMatchObject({ sittingCount: 0, bestScorePct: null, latestScorePct: null });
  });

  it('404s when the teacher does not own the class', async () => {
    classFindOne.mockResolvedValueOnce(null);
    const res = await request('/classes/cls1/test-papers');
    expect(res.status).toBe(404);
    expect(sessionFind).not.toHaveBeenCalled();
  });

  it('403s a non-teacher workspace', async () => {
    currentRole = 'tutor';
    const res = await request('/classes/cls1/test-papers');
    expect(res.status).toBe(403);
    expect(classFindOne).not.toHaveBeenCalled();
  });

  it('lists one student\'s sittings when they are on the roster', async () => {
    classFindOne.mockResolvedValueOnce({ _id: 'cls1', name: 'P5 Alpha', level: 'P5' });
    classStudentFind.mockResolvedValueOnce([{ studentId: 'stu1' }]);
    studentFindById.mockReturnValueOnce(leanObj({ _id: 'stu1', name: 'Amy', level: 'Primary 5' }));
    sessionFind.mockReturnValueOnce(sortLeanArr([
      { sessionId: 'sess1', paperCode: 'P5-MATH-MOCK-A', paperTitle: 'P5 Mock A', level: 'P5', category: 'mock', topic: '', durationMinutes: 50, summary: { scorePct: 80 }, completedAt: '2026-07-02T00:00:00Z' },
    ]));
    const res = await request('/classes/cls1/test-papers/stu1');
    expect(res.status).toBe(200);
    expect(res.data.student).toMatchObject({ studentId: 'stu1', name: 'Amy' });
    expect(res.data.sittings).toHaveLength(1);
    expect(res.data.sittings[0]).toMatchObject({ sessionId: 'sess1', category: 'mock' });
  });

  it('403s a drill-down for a student not on the roster', async () => {
    classFindOne.mockResolvedValueOnce({ _id: 'cls1', name: 'P5 Alpha', level: 'P5' });
    classStudentFind.mockResolvedValueOnce([{ studentId: 'stu1' }]);
    const res = await request('/classes/cls1/test-papers/stranger');
    expect(res.status).toBe(403);
    expect(studentFindById).not.toHaveBeenCalled();
  });

  it('returns a full marked review of one sitting (incl. the correct answers a teacher may see)', async () => {
    classFindOne.mockResolvedValueOnce({ _id: 'cls1', name: 'P5 Alpha', level: 'P5' });
    classStudentFind.mockResolvedValueOnce([{ studentId: 'stu1' }]);
    sessionFindOne.mockReturnValueOnce(oneLean({
      sessionId: 'sess1', paperCode: 'P5-MATH-MOCK-A', paperTitle: 'P5 Mock A', level: 'P5', category: 'mock', topic: '',
      summary: { scorePct: 50, marksAwarded: 1, totalMarks: 2 }, completedAt: '2026-07-02T00:00:00Z',
      questions: [
        { order: 1, marks: 1, type: 'short_answer', stem: '2 + 2 = ?', answer: '4', workedSolution: 'Add.', solutionSteps: ['2+2=4'] },
        { order: 2, marks: 1, type: 'short_answer', stem: '3 + 5 = ?', answer: '8' },
      ],
      answers: [
        { order: 1, answer: '4', correct: true, marksAwarded: 1, workingSubmitted: true, workingImage: 'data:image/png;base64,xx' },
        { order: 2, answer: '9', correct: false, marksAwarded: 0 },
      ],
    }));
    const res = await request('/classes/cls1/test-papers/stu1/sittings/sess1');
    expect(res.status).toBe(200);
    expect(res.data.questions).toHaveLength(2);
    expect(res.data.questions[0]).toMatchObject({ studentAnswer: '4', correctAnswer: '4', correct: true, workingSubmitted: true, workingImage: 'data:image/png;base64,xx' });
    expect(res.data.questions[1]).toMatchObject({ studentAnswer: '9', correctAnswer: '8', correct: false });
  });

  it('404s a missing sitting', async () => {
    classFindOne.mockResolvedValueOnce({ _id: 'cls1', name: 'P5 Alpha', level: 'P5' });
    classStudentFind.mockResolvedValueOnce([{ studentId: 'stu1' }]);
    sessionFindOne.mockReturnValueOnce(oneLean(null));
    const res = await request('/classes/cls1/test-papers/stu1/sittings/nope');
    expect(res.status).toBe(404);
  });
});
