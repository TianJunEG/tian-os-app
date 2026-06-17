import { describe, it, expect } from 'vitest';
import { buildCurriculumAttemptDocs } from './curriculumAttemptWriter.js';

describe('buildCurriculumAttemptDocs', () => {
  const base = { studentId: 's1', domainId: 'percentages', sessionId: 'sess1' };

  it('maps scored results to attempt docs with timing + family + correctness', () => {
    const docs = buildCurriculumAttemptDocs({
      ...base,
      results: [
        { questionId: 'q1', skillId: 'P001', questionFamilyId: 'QF_P001_001', correct: true, timeTaken: 12, confidence: 'high', studentAnswer: '20', correctAnswer: '20' },
        { questionId: 'q2', skillId: 'P002', questionFamilyId: 'QF_P002_001', correct: false, timeTaken: 30, confidence: 'low', studentAnswer: '5', correctAnswer: '8' },
      ],
    });
    expect(docs).toHaveLength(2);
    expect(docs[0]).toMatchObject({
      studentId: 's1', domainId: 'percentages', skillId: 'P001',
      questionFamilyId: 'QF_P001_001', questionId: 'q1', sessionType: 'practice',
      correct: true, answerCorrect: true, timeTaken: 12, confidence: 'high',
    });
    expect(docs[1].correct).toBe(false);
    expect(docs[1].timeTaken).toBe(30);
  });

  it('derives a deterministic attemptId from sessionId + questionId (idempotent upsert key)', () => {
    const [doc] = buildCurriculumAttemptDocs({ ...base, results: [{ questionId: 'q1', correct: true, timeTaken: 5 }] });
    expect(doc.attemptId).toBe('sess1_q1');
  });

  it('skips error/unanswerable results', () => {
    const docs = buildCurriculumAttemptDocs({
      ...base,
      results: [
        { questionId: 'q1', error: 'unknown_question', correct: false },
        { correct: true }, // no questionId
        { questionId: 'q3', correct: true, timeTaken: 8 },
      ],
    });
    expect(docs.map((d) => d.questionId)).toEqual(['q3']);
  });

  it('coerces a missing timeTaken to null rather than NaN', () => {
    const [doc] = buildCurriculumAttemptDocs({ ...base, results: [{ questionId: 'q1', correct: true }] });
    expect(doc.timeTaken).toBeNull();
  });
});
