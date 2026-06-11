import { describe, it, expect, vi, beforeEach } from 'vitest';

let pslSkillResult = null;
let skillResults = {};
let masteryResults = {};

vi.mock('../../models/psl/PSLSkill.js', () => ({
  default: { findOne: vi.fn(({ skillId }) => ({ lean: () => pslSkillResult })) },
}));

vi.mock('../../models/Skill.js', () => ({
  default: { findOne: vi.fn(({ code }) => ({ lean: () => skillResults[code] || null })) },
}));

vi.mock('../../models/MasteryRecord.js', () => ({
  default: {
    findOne: vi.fn((query) => ({
      lean: () => masteryResults[query.skillId] || null,
    })),
  },
}));

import { checkPrerequisites } from './prerequisiteChecker.js';

beforeEach(() => {
  vi.clearAllMocks();
  pslSkillResult = null;
  skillResults = {};
  masteryResults = {};
});

describe('checkPrerequisites', () => {
  it('throws 404 when PSL skill not found', async () => {
    pslSkillResult = null;
    await expect(checkPrerequisites('nonexistent', 'stu1', 'ws1')).rejects.toThrow('PSL skill not found');
  });

  it('returns allReady when no prerequisites', async () => {
    pslSkillResult = { skillId: 'psl-p3-bar-pw', mathPathPrerequisites: [], pslPrerequisites: [] };
    const result = await checkPrerequisites('psl-p3-bar-pw', 'stu1', 'ws1');
    expect(result.allReady).toBe(true);
    expect(result.prerequisites).toHaveLength(0);
    expect(result.blockers).toHaveLength(0);
  });

  it('returns allReady when all MathPath prerequisites mastered', async () => {
    pslSkillResult = { skillId: 'psl-p3-bar-pw', mathPathPrerequisites: ['MP-FRAC-ADD'], pslPrerequisites: [] };
    skillResults['MP-FRAC-ADD'] = { _id: 'skill-id-1', name: 'Fraction Addition', code: 'MP-FRAC-ADD' };
    masteryResults['skill-id-1'] = { status: 'mastered', score: 95 };

    const result = await checkPrerequisites('psl-p3-bar-pw', 'stu1', 'ws1');
    expect(result.allReady).toBe(true);
    expect(result.prerequisites).toHaveLength(1);
    expect(result.prerequisites[0]).toEqual({
      code: 'MP-FRAC-ADD', name: 'Fraction Addition', type: 'mathpath',
      ready: true, score: 95, status: 'mastered',
    });
  });

  it('reports blocker when MathPath prerequisite not mastered', async () => {
    pslSkillResult = { skillId: 'psl-p3-bar-pw', mathPathPrerequisites: ['MP-FRAC-ADD'], pslPrerequisites: [] };
    skillResults['MP-FRAC-ADD'] = { _id: 'skill-id-1', name: 'Fraction Addition', code: 'MP-FRAC-ADD' };
    masteryResults['skill-id-1'] = { status: 'practicing', score: 60 };

    const result = await checkPrerequisites('psl-p3-bar-pw', 'stu1', 'ws1');
    expect(result.allReady).toBe(false);
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0].code).toBe('MP-FRAC-ADD');
    expect(result.blockers[0].score).toBe(60);
  });

  it('treats uncatalogued MathPath skill as ready', async () => {
    pslSkillResult = { skillId: 'psl-p3-bar-pw', mathPathPrerequisites: ['UNKNOWN-CODE'], pslPrerequisites: [] };
    skillResults = {};

    const result = await checkPrerequisites('psl-p3-bar-pw', 'stu1', 'ws1');
    expect(result.allReady).toBe(true);
    expect(result.prerequisites[0].ready).toBe(true);
    expect(result.prerequisites[0].reason).toBe('Skill not catalogued');
  });

  it('reports blocker when no mastery record exists', async () => {
    pslSkillResult = { skillId: 'psl-p3-bar-pw', mathPathPrerequisites: ['MP-FRAC-ADD'], pslPrerequisites: [] };
    skillResults['MP-FRAC-ADD'] = { _id: 'skill-id-1', name: 'Fraction Addition', code: 'MP-FRAC-ADD' };
    masteryResults = {};

    const result = await checkPrerequisites('psl-p3-bar-pw', 'stu1', 'ws1');
    expect(result.allReady).toBe(false);
    expect(result.prerequisites[0].status).toBe('not_started');
    expect(result.prerequisites[0].score).toBe(0);
  });

  it('checks PSL prerequisites', async () => {
    pslSkillResult = { skillId: 'psl-p4-bar-ms', mathPathPrerequisites: [], pslPrerequisites: ['psl-p3-bar-pw'] };
    const depSkillDoc = { _id: 'dep-id', skillId: 'psl-p3-bar-pw', name: 'P3 Part-Whole' };
    const origFindOne = (await import('../../models/psl/PSLSkill.js')).default.findOne;
    origFindOne.mockImplementation(({ skillId }) => ({
      lean: () => (skillId === 'psl-p4-bar-ms' ? pslSkillResult : depSkillDoc),
    }));
    masteryResults['dep-id'] = { status: 'mastered', score: 90 };

    const result = await checkPrerequisites('psl-p4-bar-ms', 'stu1', 'ws1');
    expect(result.allReady).toBe(true);
    expect(result.prerequisites[0].type).toBe('psl');
    expect(result.prerequisites[0].name).toBe('P3 Part-Whole');
  });

  it('reports mixed MathPath and PSL blockers', async () => {
    pslSkillResult = {
      skillId: 'psl-p4-bar-ms',
      mathPathPrerequisites: ['MP-FRAC-ADD'],
      pslPrerequisites: ['psl-p3-bar-pw'],
    };
    skillResults['MP-FRAC-ADD'] = { _id: 'skill-id-1', name: 'Fraction Addition', code: 'MP-FRAC-ADD' };
    masteryResults = {};
    const origFindOne = (await import('../../models/psl/PSLSkill.js')).default.findOne;
    origFindOne.mockImplementation(({ skillId }) => ({
      lean: () => (skillId === 'psl-p4-bar-ms' ? pslSkillResult : null),
    }));

    const result = await checkPrerequisites('psl-p4-bar-ms', 'stu1', 'ws1');
    expect(result.allReady).toBe(false);
    expect(result.blockers).toHaveLength(2);
    expect(result.blockers.map((b) => b.type)).toEqual(['mathpath', 'psl']);
  });
});
