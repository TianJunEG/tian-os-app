import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectNextDecimalPracticeTarget,
  determineDecimalPracticeAction,
  updateDecimalPracticeState,
  getDecimalPracticeQueue,
  buildDecimalPracticeSession,
  resetDecimalPracticeState,
  validateDecimalPracticeEngine,
} from '../shared/mathpath/decimals/decimalsPracticeEngine.js';

const STUDENT = 'test_decimal_student';

beforeEach(() => {
  resetDecimalPracticeState(STUDENT);
});

describe('Decimals practice engine — selection', () => {
  it('starts a fresh student at the foundation skill D001', () => {
    const target = selectNextDecimalPracticeTarget({});
    expect(target.skillId).toBe('D001');
    expect(target.questionFamilyId).toMatch(/^QF_D001_/);
  });

  it('advances to the next skill after the highest mastered one', () => {
    const target = selectNextDecimalPracticeTarget({ masteredSkillIds: ['D001', 'D002', 'D003'] });
    expect(target.skillId).toBe('D004');
    expect(target.reason).toBe('readyForNextSkill');
  });

  it('prioritises retention-due skills above everything else', () => {
    const target = selectNextDecimalPracticeTarget({
      weakSkillIds: ['D008'],
      retentionDueSkillIds: ['D005'],
    });
    expect(target.skillId).toBe('D005');
    expect(target.reason).toBe('retentionReview');
  });

  it('routes a weak skill down to its earliest weak prerequisite', () => {
    // D008 depends on D006; if both weak, remediate the earlier one first
    const target = selectNextDecimalPracticeTarget({ weakSkillIds: ['D008', 'D006'] });
    expect(target.skillId).toBe('D006');
  });
});

describe('Decimals practice engine — action policy', () => {
  it('schedules retention before anything else', () => {
    expect(determineDecimalPracticeAction({ retentionDue: true, repeatedIncorrect: true })).toBe('scheduleRetention');
  });

  it('requires a working upload when working is expected and missing', () => {
    expect(determineDecimalPracticeAction({ workingRequired: true, mentalMathEligible: false, workingMissingCount: 2 })).toBe('requireWorkingUpload');
  });

  it('remediates after a repeated-incorrect streak', () => {
    expect(determineDecimalPracticeAction({ repeatedIncorrect: true })).toBe('remediatePrerequisite');
  });

  it('moves an accurate-but-slow student into fluency work', () => {
    expect(determineDecimalPracticeAction({ accuracy: 95, fluencyFlag: 'accurateButSlow' })).toBe('startFluency');
  });

  it('advances when ready, otherwise continues', () => {
    expect(determineDecimalPracticeAction({ readyToAdvance: true })).toBe('advanceSkill');
    expect(determineDecimalPracticeAction({})).toBe('continuePractice');
  });
});

describe('Decimals practice engine — state updates', () => {
  it('records an attempt and flags accurate-but-slow', () => {
    const result = updateDecimalPracticeState({
      studentId: STUDENT,
      skillId: 'D009',
      questionFamilyId: 'QF_D009_001',
      correct: true,
      timeTaken: 999,
      attemptNumber: 1,
    });
    expect(result.fluencyFlag).toBe('accurateButSlow');
    expect(result.accuracy).toBe(100);
  });

  it('marks a skill weak after repeated wrong answers', () => {
    for (let i = 1; i <= 3; i++) {
      updateDecimalPracticeState({
        studentId: STUDENT,
        skillId: 'D006',
        questionFamilyId: 'QF_D006_001',
        correct: false,
        timeTaken: 20,
        attemptNumber: i,
      });
    }
    const queue = getDecimalPracticeQueue({ weakSkillIds: ['D006'] });
    expect(queue[0].skillId).toBe('D006');
  });

  it('rejects an attempt with an unknown skill or family', () => {
    expect(() => updateDecimalPracticeState({ studentId: STUDENT, skillId: 'ZZZ', questionFamilyId: 'QF_D001_001', correct: true })).toThrow();
    expect(() => updateDecimalPracticeState({ studentId: STUDENT, skillId: 'D001', questionFamilyId: 'NOPE', correct: true })).toThrow();
  });
});

describe('Decimals practice engine — session building', () => {
  it('builds a session seeded from a diagnostic result', () => {
    const session = buildDecimalPracticeSession({
      studentId: STUDENT,
      diagnosticResult: {
        recommendedStartingSkillId: 'D008',
        masteredSkillIds: ['D001', 'D002'],
        weakSkillIds: ['D006'],
        suspectedPrerequisiteGaps: ['D006'],
      },
    });
    expect(session.sessionId).toMatch(/^decpractice_/);
    expect(session.targetSkillId).toBe('D006');
    expect(session.targetQuestionFamilyIds.length).toBeGreaterThan(0);
    expect(session.estimatedQuestionCount).toBeGreaterThanOrEqual(4);
  });

  it('produces a priority-ordered queue with only valid ids', () => {
    const queue = getDecimalPracticeQueue({
      weakSkillIds: ['D006', 'D008'],
      retentionDueSkillIds: ['D005'],
      currentSkillId: 'D007',
    });
    expect(queue.length).toBeGreaterThan(0);
    // retention (priority 100) sorts to the front
    expect(queue[0].skillId).toBe('D005');
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i - 1].priority).toBeGreaterThanOrEqual(queue[i].priority);
    }
  });
});

describe('Decimals practice engine — self-validation', () => {
  it('passes its built-in validation harness', () => {
    const result = validateDecimalPracticeEngine();
    expect(result.checks).toMatchObject({
      weakPrioritized: true,
      accurateButSlowToFluency: true,
      repeatedIncorrectTriggersRemediation: true,
      retentionPrioritized: true,
      workingRequiredPrompt: true,
      mentalMathNoWorkingPrompt: true,
      validQueueIds: true,
    });
    expect(result.isValid).toBe(true);
  });
});
