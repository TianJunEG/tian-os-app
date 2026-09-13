import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

// ── Model mocks ──────────────────────────────────────────────────────────────

// Chainable query stub: populate/sort/limit return self; awaiting resolves value.
function query(value) {
  const q = {
    populate: () => q,
    sort: () => q,
    limit: () => q,
    lean: () => Promise.resolve(value),
    then: (res, rej) => Promise.resolve(value).then(res, rej),
  };
  return q;
}

const masteryFind = vi.fn();
const skillStateFind = vi.fn();
const skillFind = vi.fn();
const mistakeDistinct = vi.fn();
const subjectFindOne = vi.fn();
const topicFind = vi.fn();

vi.mock('../models/MasteryRecord.js', () => ({
  default: {
    find: (...a) => query(masteryFind(...a)),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateMany: vi.fn(),
  },
}));
vi.mock('../models/mathpath/MathPathStudentSkillState.js', () => ({
  default: { find: (...a) => query(skillStateFind(...a)) },
}));
vi.mock('../models/Skill.js', () => ({
  default: {
    find: (...a) => query(skillFind(...a)),
    findById: vi.fn(),
  },
}));
vi.mock('../models/Mistake.js', () => ({
  default: {
    distinct: (...a) => mistakeDistinct(...a),
    updateMany: vi.fn(),
  },
}));
vi.mock('../models/Subject.js', () => ({ default: { findOne: (...a) => subjectFindOne(...a) } }));
vi.mock('../models/Topic.js', () => ({ default: { find: (...a) => topicFind(...a) } }));

// ── Fixtures ────────────────────────────────────────────────────────────────

const MATH_SUBJECT = { _id: new mongoose.Types.ObjectId(), key: 'math' };
const TOPIC = { _id: new mongoose.Types.ObjectId(), name: 'Fractions', order: 1 };

// Fractions Skill docs (as they'd come from MongoDB)
function makeSkill(fCode, order = 1) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: `Skill ${fCode}`,
    slug: `fr.${fCode.toLowerCase()}`,
    metadata: { mathPathSkillId: fCode },
    topicId: TOPIC,
    order,
    prerequisiteSkillIds: [],
  };
}

const SKILL_F001 = makeSkill('F001', 1);
const SKILL_F003 = makeSkill('F003', 2);
const SKILL_F015 = makeSkill('F015', 3);

const FRACTIONS_STATES = [
  { skillId: 'F001', domainId: 'fractions', status: 'needsReview', accuracy: 25, attemptCount: 4, fluencyLevel: 'notReady', lastPractisedAt: new Date() },
  { skillId: 'F003', domainId: 'fractions', status: 'learning',    accuracy: 55, attemptCount: 5, fluencyLevel: 'notReady', lastPractisedAt: new Date() },
  { skillId: 'F015', domainId: 'fractions', status: 'accurate',    accuracy: 88, attemptCount: 8, fluencyLevel: 'gold',     lastPractisedAt: new Date() },
];

let engine;

beforeAll(async () => {
  engine = await import('./masteryEngine.js');
}, 30000);

afterEach(() => { vi.clearAllMocks(); });

// Default: no data in either store
function defaultMocks() {
  skillStateFind.mockResolvedValue([]);
  masteryFind.mockResolvedValue([]);
  mistakeDistinct.mockResolvedValue([]);
  skillFind.mockResolvedValue([]);
  subjectFindOne.mockResolvedValue(MATH_SUBJECT);
  topicFind.mockResolvedValue([TOPIC]);
}

// ── weakSkills ───────────────────────────────────────────────────────────────

describe('weakSkills — fractions from MathPathStudentSkillState', () => {
  it('returns fractions weak skills when MasteryRecord is empty', async () => {
    defaultMocks();
    skillStateFind.mockResolvedValue(FRACTIONS_STATES);
    skillFind.mockResolvedValue([SKILL_F001, SKILL_F003, SKILL_F015]);

    const result = await engine.weakSkills('stu_1');

    // F015 is 'accurate' (mastered) — should not appear
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.skillId?.metadata?.mathPathSkillId);
    expect(ids).toContain('F001');
    expect(ids).toContain('F003');
    expect(ids).not.toContain('F015');
  });

  it('sorts fractions weak by accuracy ascending (lowest first)', async () => {
    defaultMocks();
    skillStateFind.mockResolvedValue(FRACTIONS_STATES);
    skillFind.mockResolvedValue([SKILL_F001, SKILL_F003, SKILL_F015]);

    const result = await engine.weakSkills('stu_1');
    expect(result[0].score).toBeLessThanOrEqual(result[1].score);
  });

  it('deduplicates: skill-state wins over MasteryRecord for same skill', async () => {
    defaultMocks();
    skillStateFind.mockResolvedValue([FRACTIONS_STATES[0]]); // F001 needsReview, score 25
    skillFind.mockResolvedValue([SKILL_F001]);
    // MasteryRecord also has F001 but with a different score
    masteryFind.mockResolvedValue([
      { skillId: { _id: SKILL_F001._id, name: SKILL_F001.name, topicId: TOPIC }, score: 50, status: 'learning', _id: 'mr1' },
    ]);

    const result = await engine.weakSkills('stu_1');
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(25); // skill-state score wins
  });

  it('falls back to MasteryRecord for non-fractions skills', async () => {
    defaultMocks();
    // No fractions state
    const nonFractionsId = new mongoose.Types.ObjectId();
    masteryFind.mockResolvedValue([
      { skillId: { _id: nonFractionsId, name: 'Percentage skill', topicId: TOPIC }, score: 38, status: 'needs_review', _id: 'mr2' },
    ]);

    const result = await engine.weakSkills('stu_1');
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(38);
  });

  it('returns empty when no data in either store', async () => {
    defaultMocks();
    const result = await engine.weakSkills('stu_1');
    expect(result).toHaveLength(0);
  });
});

// ── recommendNextSkill ───────────────────────────────────────────────────────

describe('recommendNextSkill — fractions from MathPathStudentSkillState', () => {
  it('recommends weakest fractions skill when MasteryRecord is empty', async () => {
    defaultMocks();
    skillStateFind.mockResolvedValue(FRACTIONS_STATES);
    // Skill.find called twice: once for fractions lookup, once for all curriculum skills
    skillFind
      .mockResolvedValueOnce([SKILL_F001, SKILL_F003, SKILL_F015]) // fractions lookup
      .mockResolvedValue([SKILL_F001, SKILL_F003, SKILL_F015]);     // curriculum skills

    const result = await engine.recommendNextSkill('stu_1');

    expect(result).not.toBeNull();
    // F001 has score 25 (lowest) → recommended
    expect(result.skill.metadata?.mathPathSkillId).toBe('F001');
  });

  it('does not recommend mastered fractions skills', async () => {
    defaultMocks();
    // Only F015 in state — it's mastered
    skillStateFind.mockResolvedValue([FRACTIONS_STATES[2]]); // F015 accurate
    skillFind
      .mockResolvedValueOnce([SKILL_F015]) // fractions lookup
      .mockResolvedValue([SKILL_F001, SKILL_F003, SKILL_F015]); // curriculum

    const result = await engine.recommendNextSkill('stu_1');
    // F015 is mastered → engine should pick the next un-mastered skill from curriculum
    if (result) {
      const recommended = result.skill.metadata?.mathPathSkillId;
      expect(recommended).not.toBe('F015');
    }
  });

  it('skips a slug-less (legacy) skill in curriculum order and prefers the next practiceable one', async () => {
    // The bug this guards: a brand-new student gets pointed at a legacy ad-hoc
    // skill (slug='') that has no questionStructures, so /practice/sessions 400s
    // "No questions available." Engine should now prefer the slug'd skill.
    defaultMocks();
    const LEGACY_SKILL = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Place value to 100 000',
      slug: '',                         // legacy un-seeded — the dead-end case
      metadata: {},
      topicId: TOPIC,
      order: 1,                         // first in curriculum order
      prerequisiteSkillIds: [],
    };
    // A practiceable skill that comes LATER in curriculum order — engine should
    // still prefer it over the slug-less legacy one for a brand-new student.
    const PRACTICEABLE = { ...SKILL_F001, order: 2 };
    skillFind
      .mockResolvedValueOnce([LEGACY_SKILL, PRACTICEABLE]) // allSkills lookup
      .mockResolvedValue([]);                              // fractions lookup

    const result = await engine.recommendNextSkill('stu_1');
    expect(result).not.toBeNull();
    expect(result.skill.slug).toBeTruthy();
    expect(result.skill.name).not.toBe('Place value to 100 000');
  });

  it('returns null when all curriculum skills are mastered via skill state', async () => {
    defaultMocks();
    const allMastered = [SKILL_F001, SKILL_F003, SKILL_F015].map((sk) => ({
      skillId: sk.metadata.mathPathSkillId,
      domainId: 'fractions',
      status: 'accurate',
      accuracy: 90,
      attemptCount: 6,
      fluencyLevel: 'gold',
    }));
    skillStateFind.mockResolvedValue(allMastered);
    skillFind
      .mockResolvedValueOnce([SKILL_F001, SKILL_F003, SKILL_F015]) // fractions lookup
      .mockResolvedValue([SKILL_F001, SKILL_F003, SKILL_F015]);     // curriculum (all mastered)

    const result = await engine.recommendNextSkill('stu_1');
    expect(result).toBeNull();
  });
});
