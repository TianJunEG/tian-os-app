import { describe, it, expect } from 'vitest';
import {
  isP1SkillId,
  isP1Domain,
  startP1PracticeFlow,
  submitP1PracticeAttempt,
  checkP1AnswerForSession,
} from './p1PracticeFlow.js';

// ---------------------------------------------------------------------------
// isP1SkillId
// ---------------------------------------------------------------------------
describe('isP1SkillId', () => {
  it('recognises NUM skills', () => expect(isP1SkillId('P1-NUM-01')).toBe(true));
  it('recognises ADD skills', () => expect(isP1SkillId('P1-ADD-05')).toBe(true));
  it('recognises MON skills', () => expect(isP1SkillId('P1-MON-03')).toBe(true));
  it('recognises MEA skills', () => expect(isP1SkillId('P1-MEA-07')).toBe(true));
  it('recognises GEO skills', () => expect(isP1SkillId('P1-GEO-02')).toBe(true));
  it('recognises EQG skills', () => expect(isP1SkillId('P1-EQG-04')).toBe(true));
  it('recognises DAT skills', () => expect(isP1SkillId('P1-DAT-06')).toBe(true));
  it('rejects fraction skills', () => expect(isP1SkillId('F001')).toBe(false));
  it('rejects null', () => expect(isP1SkillId(null)).toBe(false));
  it('rejects empty', () => expect(isP1SkillId('')).toBe(false));
});

// ---------------------------------------------------------------------------
// isP1Domain
// ---------------------------------------------------------------------------
describe('isP1Domain', () => {
  it('recognises p1-numbers', () => expect(isP1Domain('p1-numbers')).toBe(true));
  it('recognises p1-addsub', () => expect(isP1Domain('p1-addsub')).toBe(true));
  it('rejects fractions', () => expect(isP1Domain('fractions')).toBe(false));
  it('rejects null', () => expect(isP1Domain(null)).toBe(false));
});

// ---------------------------------------------------------------------------
// startP1PracticeFlow
// ---------------------------------------------------------------------------
describe('startP1PracticeFlow', () => {
  it('throws without studentId', () => {
    expect(() => startP1PracticeFlow({})).toThrow('studentId is required');
  });

  it('starts a session with NUM skill', () => {
    const session = startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: 'P1-NUM-01',
      sessionType: 'practice',
      sessionLength: 4,
    });
    expect(session.practiceSessionId).toBeTruthy();
    expect(session.targetSkillId).toBe('P1-NUM-01');
    expect(session.questions.length).toBe(4);
    expect(session.sessionType).toBe('practice');
    expect(session.sessionLabel).toBe('Practice');
    expect(session.startedAt).toBeTruthy();
    expect(typeof session.workingExpected).toBe('boolean');
  });

  it('starts a session with ADD skill', () => {
    const session = startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: 'P1-ADD-01',
      sessionLength: 4,
    });
    expect(session.targetSkillId).toBe('P1-ADD-01');
    expect(session.questions.length).toBe(4);
  });

  it('starts a session with MON skill', () => {
    const session = startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: 'P1-MON-01',
      sessionLength: 4,
    });
    expect(session.targetSkillId).toBe('P1-MON-01');
    expect(session.questions.length).toBe(4);
  });

  it('normalises questions for PracticeSession compatibility', () => {
    const session = startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: 'P1-NUM-01',
      sessionLength: 2,
    });
    const q = session.questions[0];
    // answer should be an object with display
    expect(q.answer).toBeDefined();
    expect(typeof q.answer).toBe('object');
    expect(q.answer.display).toBeDefined();
    // questionId should exist
    expect(q.questionId).toBeTruthy();
    // skillId should exist
    expect(q.skillId).toBe('P1-NUM-01');
    // stem should mirror prompt
    expect(q.stem || q.prompt).toBeTruthy();
    // _rawAnswer should be preserved for checker
    expect(q._rawAnswer !== undefined).toBe(true);
  });

  it('sets type=mcq and choices for choice questions', () => {
    // P1-NUM-02 has choice questions (word from numeral family)
    const session = startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: 'P1-NUM-02',
      sessionLength: 10,
    });
    const mcqQuestion = session.questions.find((q) => q.type === 'mcq');
    // At least some should be MCQ (family _002 is choice-based)
    if (mcqQuestion) {
      expect(mcqQuestion.choices).toBeDefined();
      expect(Array.isArray(mcqQuestion.choices)).toBe(true);
      expect(mcqQuestion.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('respects session type constraints', () => {
    const warmup = startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: 'P1-NUM-03',
      sessionType: 'warmup',
      sessionLength: 10,
    });
    // Warmup is clamped to max 3
    expect(warmup.questions.length).toBeLessThanOrEqual(3);
    expect(warmup.sessionType).toBe('warmup');

    const diagnostic = startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: 'P1-NUM-03',
      sessionType: 'diagnostic',
      sessionLength: 15,
    });
    // Diagnostic is clamped to max 12
    expect(diagnostic.questions.length).toBeLessThanOrEqual(12);
  });

  it('defaults skill when none provided', () => {
    const session = startP1PracticeFlow({
      studentId: 'test-student',
      sessionLength: 4,
    });
    expect(session.targetSkillId).toBeTruthy();
    expect(session.questions.length).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// submitP1PracticeAttempt
// ---------------------------------------------------------------------------
describe('submitP1PracticeAttempt', () => {
  function createSession(skillId = 'P1-NUM-01', count = 4) {
    return startP1PracticeFlow({
      studentId: 'test-student',
      requestedSkillId: skillId,
      sessionLength: count,
    });
  }

  it('throws without practiceSessionId', () => {
    expect(() => submitP1PracticeAttempt({ studentId: 'x' })).toThrow();
  });

  it('throws for unknown session', () => {
    expect(() => submitP1PracticeAttempt({
      practiceSessionId: 'fake_123_abc',
      studentId: 'test-student',
    })).toThrow('Practice session not found');
  });

  it('scores correct numeric answers', () => {
    const session = createSession('P1-NUM-01', 4);
    const responses = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: String(q._rawAnswer),
      timeTaken: 5,
      confidence: 'i_know_this',
      attemptNumber: 1,
    }));

    const result = submitP1PracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: 'test-student',
      responses,
    });

    expect(result.accuracySummary.totalQuestions).toBe(4);
    expect(result.accuracySummary.correctCount).toBe(4);
    expect(result.accuracySummary.accuracyPercentage).toBe(100);
    expect(result.results).toHaveLength(4);
    expect(result.results.every((r) => r.correct)).toBe(true);
    expect(result.sessionType).toBe('practice');
  });

  it('scores incorrect answers', () => {
    const session = createSession('P1-NUM-01', 4);
    const responses = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: '999999',
      timeTaken: 10,
      confidence: 'not_sure',
      attemptNumber: 1,
    }));

    const result = submitP1PracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: 'test-student',
      responses,
    });

    expect(result.accuracySummary.correctCount).toBe(0);
    expect(result.accuracySummary.accuracyPercentage).toBe(0);
    expect(result.results.every((r) => !r.correct)).toBe(true);
  });

  it('handles skipped questions', () => {
    const session = createSession('P1-NUM-01', 4);
    const responses = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: '',
      timeTaken: 1,
      confidence: 'dont_know',
      attemptNumber: 1,
      skipped: true,
    }));

    const result = submitP1PracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: 'test-student',
      responses,
    });

    expect(result.results.every((r) => r.skipped)).toBe(true);
    expect(result.accuracySummary.correctCount).toBe(0);
  });

  it('returns fluency metrics', () => {
    const session = createSession('P1-NUM-01', 4);
    const responses = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: String(q._rawAnswer),
      timeTaken: 2,
      confidence: 'i_know_this',
      attemptNumber: 1,
    }));

    const result = submitP1PracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: 'test-student',
      responses,
    });

    expect(result.fluencySummary).toBeDefined();
    expect(result.fluencySummary.averageSeconds).toBeGreaterThan(0);
    expect(Array.isArray(result.fluencySummary.familyFluencySummary)).toBe(true);
  });

  it('returns working evidence metrics', () => {
    const session = createSession('P1-NUM-01', 4);
    const responses = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: String(q._rawAnswer),
      timeTaken: 5,
      confidence: 'i_know_this',
      attemptNumber: 1,
      workingNotNeeded: true,
    }));

    const result = submitP1PracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: 'test-student',
      responses,
    });

    expect(result.workingEvidenceMetrics).toBeDefined();
    expect(typeof result.workingEvidenceMetrics.studentWorkingRate).toBe('number');
  });

  it('returns next recommended action', () => {
    const session = createSession('P1-ADD-01', 4);
    const responses = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: String(q._rawAnswer),
      timeTaken: 5,
      confidence: 'i_know_this',
      attemptNumber: 1,
    }));

    const result = submitP1PracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: 'test-student',
      responses,
    });

    expect(result.nextRecommendedAction).toBeTruthy();
    expect(typeof result.nextRecommendedAction).toBe('string');
  });

  it('returns question working summary', () => {
    const session = createSession('P1-NUM-01', 4);
    const responses = session.questions.map((q) => ({
      questionId: q.questionId,
      studentAnswer: String(q._rawAnswer),
      timeTaken: 5,
      confidence: 'i_know_this',
      attemptNumber: 1,
    }));

    const result = submitP1PracticeAttempt({
      practiceSessionId: session.practiceSessionId,
      studentId: 'test-student',
      responses,
    });

    expect(result.questionWorkingSummary).toBeDefined();
    expect(result.questionWorkingSummary.totalQuestions).toBe(4);
    expect(Array.isArray(result.questionWorkingSummary.questionRefs)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkP1AnswerForSession
// ---------------------------------------------------------------------------
describe('checkP1AnswerForSession', () => {
  it('handles normalised question with _rawAnswer', () => {
    const q = {
      answer: { display: '5', type: 'whole', value: 5 },
      _rawAnswer: 5,
      _rawAnswerType: 'number',
    };
    const result = checkP1AnswerForSession({ studentAnswer: '5', correctAnswer: q.answer, question: q });
    expect(result.correct).toBe(true);
  });

  it('handles normalised choice question', () => {
    const q = {
      answer: { display: 'three', type: 'text', value: 'three' },
      _rawAnswer: 'three',
      _rawAnswerType: 'choice',
      type: 'mcq',
      choices: ['three', 'four', 'seven'],
    };
    const result = checkP1AnswerForSession({ studentAnswer: 'three', correctAnswer: q.answer, question: q });
    expect(result.correct).toBe(true);
  });

  it('falls back to correctAnswer object', () => {
    const result = checkP1AnswerForSession({
      studentAnswer: '8',
      correctAnswer: { display: '8', type: 'whole', value: 8 },
    });
    expect(result.correct).toBe(true);
  });

  it('falls back to simple correctAnswer', () => {
    const result = checkP1AnswerForSession({
      studentAnswer: 'triangle',
      correctAnswer: 'triangle',
    });
    expect(result.correct).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Full flow round-trip for each domain
// ---------------------------------------------------------------------------
describe('end-to-end round trip per domain', () => {
  const DOMAINS = [
    { prefix: 'P1-NUM', skillId: 'P1-NUM-01', label: 'Numbers' },
    { prefix: 'P1-ADD', skillId: 'P1-ADD-01', label: 'Add/Sub' },
    { prefix: 'P1-MON', skillId: 'P1-MON-01', label: 'Money' },
    { prefix: 'P1-MEA', skillId: 'P1-MEA-01', label: 'Measurement' },
    { prefix: 'P1-GEO', skillId: 'P1-GEO-01', label: 'Geometry' },
    { prefix: 'P1-EQG', skillId: 'P1-EQG-01', label: 'Equal Groups' },
    { prefix: 'P1-DAT', skillId: 'P1-DAT-01', label: 'Data' },
  ];

  DOMAINS.forEach(({ skillId, label }) => {
    it(`${label}: start → answer all correctly → submit → 100% accuracy`, () => {
      const session = startP1PracticeFlow({
        studentId: 'roundtrip-student',
        requestedSkillId: skillId,
        sessionLength: 4,
      });

      expect(session.questions.length).toBe(4);

      const responses = session.questions.map((q) => ({
        questionId: q.questionId,
        studentAnswer: String(q._rawAnswer),
        timeTaken: 4,
        confidence: 'i_know_this',
        attemptNumber: 1,
      }));

      const result = submitP1PracticeAttempt({
        practiceSessionId: session.practiceSessionId,
        studentId: 'roundtrip-student',
        responses,
      });

      expect(result.accuracySummary.correctCount).toBe(4);
      expect(result.accuracySummary.accuracyPercentage).toBe(100);
      expect(result.results).toHaveLength(4);
      expect(result.results.every((r) => r.correct)).toBe(true);
      expect(result.nextRecommendedAction).toBeTruthy();
    });
  });
});
