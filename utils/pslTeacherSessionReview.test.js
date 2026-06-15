import { describe, it, expect } from 'vitest';

// Pure data-mapping tests that mirror the route's response shaping logic.

const mockSession = {
  sessionId: 'sess1',
  studentId: 'stu1',
  skillId: 'psl-p4-ba-comp',
  status: 'completed',
  completedAt: new Date('2026-06-10'),
  targetDifficulty: 2,
  summary: { totalProblems: 3, completedProblems: 3, fullMarks: 2, overallScore: 0.85, misconceptionCounts: { 'psl/missed-question': 1 } },
  problems: [
    { problemId: 'p1', storyText: 'A story', correctAnswer: 42, difficulty: 2, status: 'completed' },
    { problemId: 'p2', storyText: 'Another story', correctAnswer: 18, difficulty: 1, status: 'completed' },
  ],
};

const mockSkill = { skillId: 'psl-p4-ba-comp', name: 'Comparison (find diff)', heuristic: 'bar-model', level: 'P4' };

const mockAttempts = [
  {
    problemId: 'p1',
    overallCorrect: true,
    overallScore: 1,
    totalTimeMs: 45000,
    steps: [
      { stepId: 'understand', response: 'A', correct: true, score: 1, misconceptionTag: '', hintUsed: false, retried: false, timeSpentMs: 8000 },
      { stepId: 'solve', response: '42', correct: true, score: 1, misconceptionTag: '', hintUsed: false, retried: false, timeSpentMs: 12000 },
    ],
  },
  {
    problemId: 'p2',
    overallCorrect: false,
    overallScore: 0.5,
    totalTimeMs: 60000,
    steps: [
      { stepId: 'understand', response: 'B', correct: true, score: 1, misconceptionTag: '', hintUsed: false, retried: false, timeSpentMs: 5000 },
      { stepId: 'solve', response: '20', correct: false, score: 0, misconceptionTag: 'psl/wrong-operation', hintUsed: true, retried: true, timeSpentMs: 30000 },
    ],
  },
];

// Mirrors the session list mapping in GET /teacher/students/:id/psl/sessions
function mapSessionForList(session, skill) {
  return {
    sessionId: session.sessionId,
    skillId: session.skillId,
    skillName: skill?.name || session.skillId,
    heuristic: skill?.heuristic || '',
    level: skill?.level || '',
    completedAt: session.completedAt,
    totalProblems: session.summary?.totalProblems || 0,
    overallScore: session.summary?.overallScore || 0,
    fullMarks: session.summary?.fullMarks || 0,
    misconceptionCounts: session.summary?.misconceptionCounts || {},
    targetDifficulty: session.targetDifficulty || 1,
  };
}

// Mirrors the problem transcript mapping in GET /teacher/students/:id/psl/sessions/:sessionId
function mapProblemForDetail(problem, attempt) {
  return {
    problemId: problem.problemId,
    storyText: problem.storyText,
    correctAnswer: problem.correctAnswer,
    difficulty: problem.difficulty || 1,
    status: problem.status,
    steps: (attempt?.steps || []).map((step) => ({
      stepId: step.stepId,
      response: step.response,
      correct: step.correct,
      score: step.score,
      misconceptionTag: step.misconceptionTag || '',
      hintUsed: step.hintUsed || false,
      retried: step.retried || false,
      timeSpentMs: step.timeSpentMs || 0,
    })),
    overallCorrect: attempt?.overallCorrect ?? null,
    overallScore: attempt?.overallScore ?? null,
    totalTimeMs: attempt?.totalTimeMs ?? null,
  };
}

describe('PSL teacher session review — data mapping', () => {
  describe('session list', () => {
    it('maps session fields for the list view', () => {
      const mapped = mapSessionForList(mockSession, mockSkill);
      expect(mapped.sessionId).toBe('sess1');
      expect(mapped.skillName).toBe('Comparison (find diff)');
      expect(mapped.overallScore).toBe(0.85);
      expect(mapped.targetDifficulty).toBe(2);
      expect(mapped.misconceptionCounts).toEqual({ 'psl/missed-question': 1 });
    });

    it('falls back gracefully when skill lookup is missing', () => {
      const mapped = mapSessionForList(mockSession, null);
      expect(mapped.skillName).toBe('psl-p4-ba-comp');
      expect(mapped.heuristic).toBe('');
    });
  });

  describe('session detail transcript', () => {
    it('maps a correct problem with all step data', () => {
      const mapped = mapProblemForDetail(mockSession.problems[0], mockAttempts[0]);
      expect(mapped.steps).toHaveLength(2);
      expect(mapped.steps[0].correct).toBe(true);
      expect(mapped.overallCorrect).toBe(true);
      expect(mapped.totalTimeMs).toBe(45000);
      expect(mapped.difficulty).toBe(2);
    });

    it('maps an incorrect problem with misconception + hint + retry flags', () => {
      const mapped = mapProblemForDetail(mockSession.problems[1], mockAttempts[1]);
      expect(mapped.overallCorrect).toBe(false);
      expect(mapped.overallScore).toBe(0.5);
      const solveStep = mapped.steps.find((s) => s.stepId === 'solve');
      expect(solveStep.misconceptionTag).toBe('psl/wrong-operation');
      expect(solveStep.hintUsed).toBe(true);
      expect(solveStep.retried).toBe(true);
    });

    it('handles missing attempt gracefully', () => {
      const mapped = mapProblemForDetail(mockSession.problems[0], null);
      expect(mapped.steps).toEqual([]);
      expect(mapped.overallCorrect).toBeNull();
      expect(mapped.totalTimeMs).toBeNull();
    });
  });
});
