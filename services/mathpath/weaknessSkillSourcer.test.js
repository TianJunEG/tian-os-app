import { beforeEach, describe, expect, it, vi } from 'vitest';

// Chainable .find(...).select(...).lean() stub resolving to `rows`.
const chain = (rows) => ({ select() { return this; }, lean() { return Promise.resolve(rows); } });

const masteryFind = vi.fn(() => chain([]));
const skillStateFind = vi.fn(() => chain([]));
const mistakeFind = vi.fn(() => chain([]));
const skillFind = vi.fn(() => chain([]));

vi.mock('../../models/MasteryRecord.js', () => ({ default: { find: (...a) => masteryFind(...a) } }));
vi.mock('../../models/mathpath/MathPathStudentSkillState.js', () => ({ default: { find: (...a) => skillStateFind(...a) } }));
vi.mock('../../models/mathpath/MathPathMistakeRecord.js', () => ({ default: { find: (...a) => mistakeFind(...a) } }));
vi.mock('../../models/Skill.js', () => ({ default: { find: (...a) => skillFind(...a) } }));

const { sourceWeakSkills } = await import('./weaknessSkillSourcer.js');

const STUDENT_OBJID = '64b7f0c2e1a2b3c4d5e6f700';

beforeEach(() => {
  masteryFind.mockClear().mockReturnValue(chain([]));
  skillStateFind.mockClear().mockReturnValue(chain([]));
  mistakeFind.mockClear().mockReturnValue(chain([]));
  skillFind.mockClear().mockReturnValue(chain([]));
});

describe('sourceWeakSkills', () => {
  it('returns empty for a missing studentId without querying', async () => {
    const out = await sourceWeakSkills({ studentId: '' });
    expect(out.skillIds).toEqual([]);
    expect(skillStateFind).not.toHaveBeenCalled();
  });

  it('collects weak skills from skill-state status and low accuracy', async () => {
    skillStateFind.mockReturnValue(chain([
      { skillId: 'F010', status: 'weak', accuracy: 0.3, attemptCount: 5 },
      { skillId: 'F011', status: 'accurate', accuracy: 0.4, attemptCount: 8 }, // low accuracy only
      { skillId: 'F012', status: 'fluent', accuracy: 0.95, attemptCount: 10 }, // not weak
      { skillId: 'F013', status: 'learning', accuracy: 0, attemptCount: 0 }, // unattempted default — skip
      { skillId: 'F014', status: 'learning', accuracy: 0, attemptCount: 6 }, // genuine 0% with attempts — include
    ]));
    const out = await sourceWeakSkills({ studentId: STUDENT_OBJID });
    expect(out.skillIds).toContain('F010');
    expect(out.skillIds).toContain('F011');
    expect(out.skillIds).not.toContain('F012');
    expect(out.skillIds).not.toContain('F013');
    expect(out.skillIds).toContain('F014'); // 0% accuracy must not be dropped
  });

  it('weights mistakes by severity and frequency, and includes remediation targets', async () => {
    mistakeFind.mockReturnValue(chain([
      { skillId: 'F020', remediationSkillIds: ['F021'], severity: 'high', frequency: 4 },
    ]));
    const out = await sourceWeakSkills({ studentId: STUDENT_OBJID });
    expect(out.skillIds[0]).toBe('F020'); // strongest signal ranks first
    expect(out.skillIds).toContain('F021');
    const f020 = out.details.find((d) => d.skillId === 'F020');
    expect(f020.signals).toContain('mistake');
  });

  it('maps MasteryRecord ObjectId skills to public ids', async () => {
    masteryFind.mockReturnValue(chain([
      { skillId: 'aaaaaaaaaaaaaaaaaaaaaaaa', status: 'needs_review', score: 40 },
    ]));
    skillFind.mockReturnValue(chain([
      { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', slug: 'fractions.add', metadata: { mathPathSkillId: 'F030' } },
    ]));
    const out = await sourceWeakSkills({ studentId: STUDENT_OBJID });
    expect(out.skillIds).toContain('F030');
  });

  it('ranks across sources and respects the limit', async () => {
    skillStateFind.mockReturnValue(chain([
      { skillId: 'A', status: 'needsReview', accuracy: 0.9 },
      { skillId: 'B', status: 'weak', accuracy: 0.2 },
    ]));
    mistakeFind.mockReturnValue(chain([
      { skillId: 'B', remediationSkillIds: [], severity: 'high', frequency: 5 },
      { skillId: 'C', remediationSkillIds: [], severity: 'low', frequency: 1 },
    ]));
    const out = await sourceWeakSkills({ studentId: STUDENT_OBJID, limit: 2 });
    expect(out.skillIds).toHaveLength(2);
    expect(out.skillIds[0]).toBe('B'); // highest combined score
  });

  it('returns a domainBySkill map from domain-carrying signals', async () => {
    skillStateFind.mockReturnValue(chain([
      { skillId: 'F010', status: 'weak', accuracy: 0.3, domainId: 'fractions' },
    ]));
    mistakeFind.mockReturnValue(chain([
      { skillId: 'F020', remediationSkillIds: [], severity: 'high', frequency: 2, domainId: 'ratio' },
    ]));
    const out = await sourceWeakSkills({ studentId: STUDENT_OBJID });
    expect(out.domainBySkill.F010).toBe('fractions');
    expect(out.domainBySkill.F020).toBe('ratio');
  });

  it('scopes string-keyed signals by domain when provided', async () => {
    await sourceWeakSkills({ studentId: STUDENT_OBJID, domainIds: ['Fractions'] });
    const stateQuery = skillStateFind.mock.calls[0][0];
    expect(stateQuery.domainId).toEqual({ $in: ['fractions'] });
  });
});
