import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  student: null,
  guardian: null,
  tutorLink: null,
  workspaceMember: null,
  partnerAllowed: false,
}));

vi.mock('../models/Student.js', () => ({
  default: {
    findById: vi.fn(async () => state.student),
    findOne: vi.fn(async () => state.student),
  },
}));

vi.mock('../models/StudentGuardian.js', () => ({
  default: {
    findOne: vi.fn(async () => state.guardian),
  },
}));

vi.mock('../models/TutorStudentLink.js', () => ({
  default: {
    findOne: vi.fn(async () => state.tutorLink),
  },
}));

vi.mock('../models/WorkspaceMember.js', () => ({
  default: {
    findOne: vi.fn(async () => state.workspaceMember),
  },
}));

vi.mock('../services/partners/partnerAccessService.js', () => ({
  userCanAccessPartnerStudent: vi.fn(async () => state.partnerAllowed),
}));

const { resolveStudent } = await import('./studentContext.js');
const StudentGuardian = (await import('../models/StudentGuardian.js')).default;

describe('resolveStudent', () => {
  beforeEach(() => {
    state.student = {
      _id: 'student_1',
      userId: 'student_user',
      workspaceId: 'family_workspace',
    };
    state.guardian = null;
    state.tutorLink = null;
    state.workspaceMember = null;
    state.partnerAllowed = false;
  });

  it('allows a tutor explicitly linked to the student in the active workspace', async () => {
    state.tutorLink = {
      workspaceId: 'tutor_workspace',
      tutorUserId: 'tutor_user',
      studentId: 'student_1',
      status: 'active',
    };

    await expect(resolveStudent({
      user: { id: 'tutor_user' },
      workspaceId: 'tutor_workspace',
      body: {},
      query: {},
    }, 'student_1')).resolves.toBe(state.student);
  });

  it('refuses an unrelated adult with no guardian, tutor, or workspace link', async () => {
    await expect(resolveStudent({
      user: { id: 'other_user' },
      workspaceId: 'other_workspace',
      body: {},
      query: {},
    }, 'student_1')).rejects.toMatchObject({
      status: 403,
      message: 'No access to this student.',
    });
  });

  it('allows only an explicit StudentGuardian relationship for parent child access', async () => {
    state.guardian = {
      studentId: 'student_1',
      guardianUserId: 'parent_user',
      relation: 'parent',
      status: 'active',
    };

    await expect(resolveStudent({
      user: { id: 'parent_user', role: 'parent' },
      workspaceId: 'family_workspace',
      body: {},
      query: {},
    }, 'student_1')).resolves.toBe(state.student);

    expect(StudentGuardian.findOne).toHaveBeenCalledWith({
      studentId: 'student_1',
      guardianUserId: 'parent_user',
    });
  });

  it('rejects a view-only guardian on a write action', async () => {
    state.guardian = {
      studentId: 'student_1',
      guardianUserId: 'school_parent',
      relation: 'parent',
      accessLevel: 'view_only',
      status: 'active',
    };

    await expect(resolveStudent({
      user: { id: 'school_parent', role: 'parent' },
      workspaceId: 'family_workspace',
      body: {},
      query: {},
    }, 'student_1', { write: true })).rejects.toMatchObject({
      status: 403,
      message: 'View-only access does not permit this action.',
    });
  });

  it('still allows a view-only guardian to read', async () => {
    state.guardian = {
      studentId: 'student_1',
      guardianUserId: 'school_parent',
      relation: 'parent',
      accessLevel: 'view_only',
      status: 'active',
    };

    await expect(resolveStudent({
      user: { id: 'school_parent', role: 'parent' },
      workspaceId: 'family_workspace',
      body: {},
      query: {},
    }, 'student_1')).resolves.toBe(state.student);
  });

  it('allows a full guardian to write', async () => {
    state.guardian = {
      studentId: 'student_1',
      guardianUserId: 'parent_user',
      relation: 'parent',
      accessLevel: 'full',
      status: 'active',
    };

    await expect(resolveStudent({
      user: { id: 'parent_user', role: 'parent' },
      workspaceId: 'family_workspace',
      body: {},
      query: {},
    }, 'student_1', { write: true })).resolves.toBe(state.student);
  });

  it('never blocks the student acting on their own record, even on writes', async () => {
    // A view-only guardian link must not be consulted for the student themselves.
    state.guardian = { accessLevel: 'view_only' };

    await expect(resolveStudent({
      user: { id: 'student_user', role: 'student' },
      workspaceId: 'family_workspace',
      body: {},
      query: {},
    }, 'student_1', { write: true })).resolves.toBe(state.student);
  });

  it('allows partner staff linked to the student through a partner organisation', async () => {
    state.partnerAllowed = true;

    await expect(resolveStudent({
      user: { id: 'partner_staff_user' },
      workspaceId: '',
      body: {},
      query: {},
    }, 'student_1')).resolves.toBe(state.student);
  });
});
