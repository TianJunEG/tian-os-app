import { afterEach, describe, expect, it, vi } from 'vitest';

const membershipFind = vi.fn();
const studentFindOne = vi.fn();

vi.mock('../models/PartnerMembership.js', () => ({
  default: {
    find: (...args) => membershipFind(...args),
  },
}));

vi.mock('../models/PartnerStudent.js', () => ({
  default: {
    findOne: (...args) => studentFindOne(...args),
    find: vi.fn(() => ({ lean: vi.fn().mockResolvedValue([]) })),
  },
}));

const { userCanAccessPartnerStudent } = await import('../services/partners/partnerAccessService.js');

function leanResult(value) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

describe('partnerAccessService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows partner staff to access students linked to the same organisation', async () => {
    membershipFind.mockReturnValueOnce(leanResult([{ organisationId: 'org_1', userId: 'user_1', status: 'active' }]));
    studentFindOne.mockReturnValueOnce(leanResult({ organisationId: 'org_1', studentId: 'student_1', status: 'active' }));

    await expect(userCanAccessPartnerStudent({ userId: 'user_1', studentId: 'student_1' })).resolves.toBe(true);
    expect(studentFindOne).toHaveBeenCalledWith(expect.objectContaining({
      organisationId: { $in: ['org_1'] },
      studentId: 'student_1',
      status: 'active',
    }));
  });

  it('blocks partner staff from unrelated students', async () => {
    membershipFind.mockReturnValueOnce(leanResult([{ organisationId: 'org_1', userId: 'user_1', status: 'active' }]));
    studentFindOne.mockReturnValueOnce(leanResult(null));

    await expect(userCanAccessPartnerStudent({ userId: 'user_1', studentId: 'student_2' })).resolves.toBe(false);
  });

  it('blocks users with no active partner membership', async () => {
    membershipFind.mockReturnValueOnce(leanResult([]));

    await expect(userCanAccessPartnerStudent({ userId: 'user_1', studentId: 'student_1' })).resolves.toBe(false);
    expect(studentFindOne).not.toHaveBeenCalled();
  });
});
