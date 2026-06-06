import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const linkFindOne = vi.fn();
const studentFindById = vi.fn();
const lessonNoteFind = vi.fn();
const lessonNoteCreate = vi.fn();
const getTutorLessonPrep = vi.fn();
const createAssignmentFromLessonPrep = vi.fn();
const userCanAccessPartnerStudentMock = vi.fn();
const listPartnerStudentIdsForUserMock = vi.fn();

function chainResult(value) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = req.mockUser || { id: 'tutor_1', role: 'tutor' };
    next();
  },
}));

vi.mock('../middleware/workspace.js', () => ({
  requireWorkspace: (req, _res, next) => {
    req.workspaceId = 'workspace_1';
    req.workspaceRole = 'tutor';
    next();
  },
}));

vi.mock('../models/TutorStudentLink.js', () => ({
  default: { findOne: (...args) => linkFindOne(...args), find: vi.fn() },
}));

vi.mock('../models/Student.js', () => ({
  default: { findById: (...args) => studentFindById(...args), find: vi.fn() },
}));

vi.mock('../models/LessonNote.js', () => ({
  default: {
    find: (...args) => lessonNoteFind(...args),
    create: (...args) => lessonNoteCreate(...args),
  },
}));

vi.mock('../models/MasteryRecord.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../models/Skill.js', () => ({ default: {} }));
vi.mock('../models/Mistake.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../models/Assignment.js', () => ({ default: { find: vi.fn(), countDocuments: vi.fn() } }));
vi.mock('../models/TutorAvailability.js', () => ({ default: { findOne: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock('../models/TutorCertification.js', () => ({ default: { findOne: vi.fn(), create: vi.fn() } }));

vi.mock('../services/mathpath/tutorLessonPrepEngine.js', () => ({
  getTutorLessonPrep: (...args) => getTutorLessonPrep(...args),
}));

vi.mock('../services/mathpath/mathPathAssignmentService.js', () => ({
  createAssignmentFromLessonPrep: (...args) => createAssignmentFromLessonPrep(...args),
}));

vi.mock('../services/partners/partnerAccessService.js', () => ({
  userCanAccessPartnerStudent: (...args) => userCanAccessPartnerStudentMock(...args),
  listPartnerStudentIdsForUser: (...args) => listPartnerStudentIdsForUserMock(...args),
}));

let router;

async function request(path, { method = 'GET', body = {}, user } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method).toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query: {},
      body,
      headers: {},
      params: {},
      mockUser: user,
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('tutor lesson prep routes', () => {
  beforeAll(async () => {
    const mod = await import('./tutor.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
    userCanAccessPartnerStudentMock.mockResolvedValue(false);
    listPartnerStudentIdsForUserMock.mockResolvedValue([]);
  });

  it('blocks tutors from unrelated students', async () => {
    linkFindOne.mockResolvedValueOnce(null);

    const res = await request('/students/student_1/lesson-prep');

    expect(res.status).toBe(403);
    expect(getTutorLessonPrep).not.toHaveBeenCalled();
  });

  it('returns evidence-based lesson prep for a linked tutor student', async () => {
    linkFindOne.mockResolvedValueOnce({ _id: 'link_1' });
    studentFindById.mockResolvedValueOnce({ _id: 'student_1', name: 'Sarah' });
    lessonNoteFind.mockReturnValueOnce(chainResult([]));
    getTutorLessonPrep.mockResolvedValueOnce({
      studentSummary: { studentId: 'student_1', name: 'Sarah' },
      recommendedLessonFocus: [{ skillId: 'F023', why: ['Repeated mistake.'] }],
    });

    const res = await request('/students/student_1/lesson-prep');

    expect(res.status).toBe(200);
    expect(getTutorLessonPrep).toHaveBeenCalledWith(expect.objectContaining({
      tutorId: 'tutor_1',
      student: expect.objectContaining({ _id: 'student_1' }),
    }));
    expect(res.data.recommendedLessonFocus[0].skillId).toBe('F023');
  });

  it('returns lesson prep for partner-linked tutor students', async () => {
    linkFindOne.mockResolvedValueOnce(null);
    userCanAccessPartnerStudentMock.mockResolvedValueOnce(true);
    studentFindById.mockResolvedValueOnce({ _id: 'student_partner_1', name: 'Partner Student' });
    lessonNoteFind.mockReturnValueOnce(chainResult([]));
    getTutorLessonPrep.mockResolvedValueOnce({
      studentSummary: { studentId: 'student_partner_1', name: 'Partner Student' },
      recommendedLessonFocus: [{ skillId: 'F019', why: ['Partner-linked intervention.'] }],
    });

    const res = await request('/students/student_partner_1/lesson-prep');

    expect(res.status).toBe(200);
    expect(userCanAccessPartnerStudentMock).toHaveBeenCalledWith({
      userId: 'tutor_1',
      studentId: 'student_partner_1',
    });
    expect(res.data.recommendedLessonFocus[0].skillId).toBe('F019');
  });

  it('creates a Recovery Pack from lesson prep', async () => {
    linkFindOne.mockResolvedValueOnce({ _id: 'link_1' });
    studentFindById.mockResolvedValueOnce({ _id: 'student_1', name: 'Sarah' });
    createAssignmentFromLessonPrep.mockResolvedValueOnce({ id: 'assignment_1', skillIds: ['F023'] });

    const res = await request('/students/student_1/lesson-prep/assign-recovery-pack', {
      method: 'POST',
      body: { skillIds: ['F023'] },
    });

    expect(res.status).toBe(201);
    expect(createAssignmentFromLessonPrep).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      skillIds: ['F023'],
      assignedByUserId: 'tutor_1',
    }));
  });

  it('saves MathPath lesson notes', async () => {
    linkFindOne.mockResolvedValueOnce({ _id: 'link_1' });
    studentFindById.mockResolvedValueOnce({ _id: 'student_1', name: 'Sarah' });
    lessonNoteCreate.mockResolvedValueOnce({ _id: 'note_1', notes: 'Worked on F023' });

    const res = await request('/lesson-notes', {
      method: 'POST',
      body: { studentId: 'student_1', focusSkillIds: ['F023'], notes: 'Worked on F023', nextAction: 'Assign practice' },
    });

    expect(res.status).toBe(201);
    expect(lessonNoteCreate).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 'student_1',
      focusSkillIds: ['F023'],
      notes: 'Worked on F023',
      nextAction: 'Assign practice',
    }));
  });
});
