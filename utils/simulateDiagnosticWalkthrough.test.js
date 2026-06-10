import { describe, expect, it } from 'vitest';
import {
  DIAGNOSTIC_DECISIONS,
  decideNextDiagnosticStep,
  calculateDiagnosticReadinessScore,
} from '../services/mathpath/diagnosticDecisionEngine.js';

/**
 * Simulated skill graph — a subset of the real F001–F010 fractions graph.
 * Difficulty: F001-F004 = 1, F005-F008 = 2, F009-F010 = 3
 */
const SKILL_GRAPH = [
  { skillId: 'F001', difficulty: 1, prerequisiteSkillIds: [], relatedSkillIds: ['F002'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F002', difficulty: 1, prerequisiteSkillIds: ['F001'], relatedSkillIds: ['F003'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F003', difficulty: 1, prerequisiteSkillIds: ['F001', 'F002'], relatedSkillIds: ['F005'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F004', difficulty: 1, prerequisiteSkillIds: ['F003'], relatedSkillIds: ['F006'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F005', difficulty: 2, prerequisiteSkillIds: ['F003'], relatedSkillIds: ['F009'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F006', difficulty: 2, prerequisiteSkillIds: ['F004', 'F005'], relatedSkillIds: ['F008'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F007', difficulty: 2, prerequisiteSkillIds: ['F003'], relatedSkillIds: ['F009'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F008', difficulty: 2, prerequisiteSkillIds: ['F004', 'F006'], relatedSkillIds: ['F010'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F009', difficulty: 3, prerequisiteSkillIds: ['F005', 'F007'], relatedSkillIds: ['F010'], subjectId: 'math', domainId: 'fractions' },
  { skillId: 'F010', difficulty: 3, prerequisiteSkillIds: ['F008', 'F009'], relatedSkillIds: [], subjectId: 'math', domainId: 'fractions' },
];

function skill(id) {
  return SKILL_GRAPH.find((s) => s.skillId === id);
}

function decide(skillId, response, sessionState = {}) {
  return decideNextDiagnosticStep({
    sessionId: 'sim_001',
    studentId: 'student_sim',
    currentSkill: skill(skillId),
    currentQuestion: { questionId: `q_${skillId}_${Date.now()}`, difficultyLevel: skill(skillId).difficulty },
    response,
    studentEvidence: {},
    skillGraph: SKILL_GRAPH,
    sessionState,
  });
}

// ─────────────────────────────────────────────────────────────
// Scenario 1: Strong student — correct + confident answers
//   Should climb from F005 (diff 2) → F009 (diff 3)
// ─────────────────────────────────────────────────────────────
describe('Scenario 1: Strong student climbs difficulty', () => {
  it('moves UP from F005 when correct + high confidence', () => {
    const d = decide('F005', { correct: true, confidence: 'high', timeTakenMs: 8000 });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.MOVE_UP);
    expect(d.nextSkillId).toBe('F009');
    expect(d.nextDifficulty).toBe(3);
  });

  it('moves UP from F003 to F005 (related link)', () => {
    const d = decide('F003', { correct: true, confidence: 'high', timeTakenMs: 5000 });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.MOVE_UP);
    expect(d.nextSkillId).toBe('F005');
    expect(d.nextDifficulty).toBe(2);
  });

  it('marks SECURE when no harder related skill exists', () => {
    const d = decide('F010', { correct: true, confidence: 'high', timeTakenMs: 10000 });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.MARK_SECURE);
  });
});

// ─────────────────────────────────────────────────────────────
// Scenario 2: Struggling student — wrong + low confidence
//   Should drop from F006 (diff 2) → prerequisite F004 (diff 1)
// ─────────────────────────────────────────────────────────────
describe('Scenario 2: Struggling student drops difficulty', () => {
  it('probes PREREQUISITE from F006 when wrong + low confidence', () => {
    const d = decide('F006', { correct: false, confidence: 'low', timeTakenMs: 45000 });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE);
    expect(['F004', 'F005']).toContain(d.nextSkillId);
    expect(d.nextDifficulty).toBeLessThanOrEqual(2);
  });

  it('steps DOWN from F009 when wrong + low confidence', () => {
    const d = decide('F009', { correct: false, confidence: 'low', timeTakenMs: 50000 });
    expect([DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE, DIAGNOSTIC_DECISIONS.STEP_DOWN]).toContain(d.decisionType);
    expect(d.nextDifficulty).toBeLessThan(3);
  });

  it('steps DOWN from F005 to a difficulty-1 skill when wrong + unknown confidence', () => {
    const d = decide('F005', { correct: false, confidence: '', timeTakenMs: 30000 });
    expect([DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE, DIAGNOSTIC_DECISIONS.STEP_DOWN]).toContain(d.decisionType);
    expect(d.nextDifficulty).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Scenario 3: Student skips question — should step down
// ─────────────────────────────────────────────────────────────
describe('Scenario 3: Skipped questions step down', () => {
  it('steps down when student skips a difficulty-2 question', () => {
    const d = decide('F007', { correct: false, skipped: true });
    expect([DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE, DIAGNOSTIC_DECISIONS.STEP_DOWN]).toContain(d.decisionType);
    expect(d.nextDifficulty).toBeLessThanOrEqual(1);
  });

  it('steps down when answer is blank', () => {
    const d = decide('F006', { correct: false, blankAnswer: true });
    expect([DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE, DIAGNOSTIC_DECISIONS.STEP_DOWN]).toContain(d.decisionType);
  });
});

// ─────────────────────────────────────────────────────────────
// Scenario 4: Misconception — wrong but confident
//   Should probe same skill, not move on
// ─────────────────────────────────────────────────────────────
describe('Scenario 4: Misconception detection', () => {
  it('probes MISCONCEPTION when wrong + high confidence (first wrong)', () => {
    const d = decide('F005', { correct: false, confidence: 'high', timeTakenMs: 12000 });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE);
    expect(d.nextSkillId).toBe('F005');
    expect(d.nextDifficulty).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────
// Scenario 5: Repeated wrong → stop and assign practice
// ─────────────────────────────────────────────────────────────
describe('Scenario 5: Repeated failures stop the diagnostic', () => {
  it('stops after 2 wrong answers on the same skill', () => {
    const d = decide('F005', { correct: false, confidence: 'low', timeTakenMs: 20000 }, {
      currentSkillWrongCount: 1,
    });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE);
    expect(d.shouldStopDiagnostic).toBe(true);
    expect(d.assignedPracticeSkillIds.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Scenario 6: Correct but unsure — confirm at same level
// ─────────────────────────────────────────────────────────────
describe('Scenario 6: Low confidence correct stays at same level', () => {
  it('confirms at same level when correct + low confidence', () => {
    const d = decide('F005', { correct: true, confidence: 'low', timeTakenMs: 15000 });
    expect([DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION, DIAGNOSTIC_DECISIONS.MARK_FRAGILE]).toContain(d.decisionType);
    expect(d.nextSkillId).toBe('F005');
    expect(d.nextDifficulty).toBe(2);
  });

  it('marks fragile when correct but slow', () => {
    const d = decide('F003', { correct: true, confidence: 'high', timeTakenMs: 120000 });
    expect(d.decisionType).toBe(DIAGNOSTIC_DECISIONS.MARK_FRAGILE);
    expect(d.nextSkillId).toBe('F003');
  });
});

// ─────────────────────────────────────────────────────────────
// Scenario 7: Full simulated 8-question walkthrough
//   Student: medium ability, gets easy right, struggles on harder
// ─────────────────────────────────────────────────────────────
describe('Scenario 7: Full 8-question simulated walkthrough', () => {
  it('traces a realistic adaptive path through the skill graph', () => {
    const log = [];
    let currentSkillId = 'F005'; // Start at difficulty 2
    const sessionState = { visitedSkillIds: [], secureSkillIds: [] };

    const responses = [
      { correct: true, confidence: 'high', timeTakenMs: 8000 },   // Q1: nail it → MOVE_UP
      { correct: true, confidence: 'low', timeTakenMs: 25000 },   // Q2: right but unsure → CONFIRM
      { correct: false, confidence: 'high', timeTakenMs: 15000 }, // Q3: wrong but confident → MISCONCEPTION
      { correct: false, confidence: 'low', timeTakenMs: 40000 },  // Q4: wrong + unsure → STEP DOWN
      { correct: true, confidence: 'high', timeTakenMs: 6000 },   // Q5: easy one nailed → MOVE UP
      { correct: true, confidence: 'high', timeTakenMs: 7000 },   // Q6: still good → MOVE UP
      { correct: false, confidence: 'low', timeTakenMs: 50000 },  // Q7: struggle → STEP DOWN
      { correct: true, confidence: 'high', timeTakenMs: 5000 },   // Q8: recover → MOVE UP
    ];

    for (let i = 0; i < responses.length; i++) {
      const d = decide(currentSkillId, responses[i], sessionState);
      const readiness = calculateDiagnosticReadinessScore({
        correct: responses[i].correct,
        confidence: responses[i].confidence,
        timeTakenMs: responses[i].timeTakenMs,
        difficulty: skill(currentSkillId).difficulty,
      });
      log.push({
        q: i + 1,
        skill: currentSkillId,
        difficulty: skill(currentSkillId).difficulty,
        correct: responses[i].correct,
        confidence: responses[i].confidence,
        decision: d.decisionType,
        nextSkill: d.nextSkillId,
        nextDifficulty: d.nextDifficulty,
        readiness,
        reason: d.reason,
      });

      sessionState.visitedSkillIds.push(currentSkillId);
      if (d.decisionType === DIAGNOSTIC_DECISIONS.MARK_SECURE) {
        sessionState.secureSkillIds.push(currentSkillId);
      }
      if (d.shouldStopDiagnostic) break;
      if (d.nextSkillId && skill(d.nextSkillId)) {
        currentSkillId = d.nextSkillId;
      }
    }

    // Print the walkthrough for visibility
    console.log('\n── Simulated Diagnostic Walkthrough ──');
    console.log('Q# | Skill | Diff | Correct | Confidence | Decision                    | → Next  | NextDiff | Readiness');
    console.log('---|-------|------|---------|------------|-----------------------------|---------| ---------|----------');
    for (const row of log) {
      console.log(
        `${String(row.q).padStart(2)} | ${row.skill} | ${row.difficulty}    | ${row.correct ? 'YES    ' : 'NO     '} | ${row.confidence.padEnd(10)} | ${row.decision.padEnd(27)} | ${(row.nextSkill || '—').padEnd(7)} | ${String(row.nextDifficulty ?? '—').padEnd(8)} | ${row.readiness}`
      );
    }
    console.log('');

    // Verify the adaptive path makes sense
    expect(log[0].decision).toBe(DIAGNOSTIC_DECISIONS.MOVE_UP);
    expect(log[0].nextDifficulty).toBeGreaterThan(log[0].difficulty);

    // After wrong answers, difficulty should drop
    const wrongSteps = log.filter((r) => !r.correct && r.nextDifficulty != null);
    for (const step of wrongSteps) {
      if (step.decision === DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE) {
        expect(step.nextDifficulty).toBe(step.difficulty); // same level for misconception
      } else {
        expect(step.nextDifficulty).toBeLessThanOrEqual(step.difficulty);
      }
    }

    // After correct + high confidence, difficulty should stay or increase
    const correctHighSteps = log.filter((r) => r.correct && r.confidence === 'high' && r.decision === DIAGNOSTIC_DECISIONS.MOVE_UP);
    for (const step of correctHighSteps) {
      expect(step.nextDifficulty).toBeGreaterThanOrEqual(step.difficulty);
    }

    // Readiness scores: correct answers should score higher than wrong
    const correctScores = log.filter((r) => r.correct).map((r) => r.readiness);
    const wrongScores = log.filter((r) => !r.correct).map((r) => r.readiness);
    const avgCorrect = correctScores.reduce((a, b) => a + b, 0) / correctScores.length;
    const avgWrong = wrongScores.reduce((a, b) => a + b, 0) / wrongScores.length;
    expect(avgCorrect).toBeGreaterThan(avgWrong);
  });
});
