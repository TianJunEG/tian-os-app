import { describe, expect, it } from 'vitest';
import {
  buildCrossEvidenceValidation,
  validateCrossEvidenceForSkill,
} from '../services/mathpath/crossEvidenceValidator.js';

describe('crossEvidenceValidator', () => {
  it('reports high agreement when diagnostic and paper evidence match', () => {
    const result = validateCrossEvidenceForSkill({
      skillId: 'F011',
      diagnosticEvidence: { isWeak: true },
      paperEvidence: { isWeak: true },
      workingEvidence: { methodIssue: true },
    });

    expect(result.dominantSignal).toBe('weak');
    expect(result.agreementScore).toBe(100);
    expect(result.confidenceLevel).toBe('high');
    expect(result.requiresReview).toBe(false);
  });

  it('flags cross-evidence conflict for manual review', () => {
    const result = validateCrossEvidenceForSkill({
      skillId: 'F012',
      diagnosticEvidence: { isWeak: false },
      paperEvidence: { isWeak: true },
      assignmentEvidence: { completed: true, accuracy: 90 },
      recheckEvidence: { completed: true, score: 88 },
    });

    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.requiresReview).toBe(true);
  });

  it('builds per-skill validation from diagnostic, attempt, paper, assignment and recheck evidence', () => {
    const rows = buildCrossEvidenceValidation({
      skillIds: ['F018'],
      diagnostics: [
        { perSkillSnapshot: [{ skillId: 'F018', score: 42, correctCount: 1, questionsAnswered: 3 }] },
      ],
      attempts: [
        { skillId: 'F018', answerCorrect: false, workingRequirementLevel: 'HIGH', workingNotNeeded: true },
      ],
      paperAnalyses: [
        { weakSkillIds: ['F018'], detectedQuestions: [] },
      ],
      assignments: [
        { skillIds: ['F018'], status: 'completed', completion: { accuracy: 76 } },
      ],
      rechecks: [
        { perSkillSnapshot: [{ skillId: 'F018', score: 78 }] },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].skillId).toBe('F018');
    expect(rows[0].sourceSignals.map((item) => item.source)).toContain('diagnostic');
    expect(rows[0].agreementScore).toBeGreaterThan(0);
  });
});
