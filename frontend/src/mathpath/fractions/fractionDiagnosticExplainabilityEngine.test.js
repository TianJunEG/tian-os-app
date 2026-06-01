import { describe, expect, it } from 'vitest';
import {
  buildDiagnosticExplainability,
  buildSkillGraphArchitecture,
  validateDiagnosticExplainabilityEngine,
} from './fractionDiagnosticExplainabilityEngine';
import { buildFractionDiagnosticSession, scoreFractionDiagnosticAttempt } from './fractionDiagnosticEngine';

describe('fractionDiagnosticExplainabilityEngine', () => {
  it('builds skill graph architecture with prerequisites and MOE mapping fields', () => {
    const graph = buildSkillGraphArchitecture();
    expect(graph.parentSkill).toBe('Fractions');
    expect(graph.totalSkills).toBeGreaterThanOrEqual(26);
    expect(graph.skills.find((skill) => skill.skillId === 'F010')?.prerequisites.length).toBeGreaterThan(0);
  });

  it('explains weak comparison skills with root cause, misconception, and recommendations', () => {
    const explained = buildDiagnosticExplainability({
      responses: [
        { questionId: 'q1', skillId: 'F006', questionFamilyId: 'QF_F006_001', correct: false, timeTaken: 6, confidence: 'i_know_this' },
        { questionId: 'q2', skillId: 'F008', questionFamilyId: 'QF_F008_001', correct: false, timeTaken: 7, confidence: 'i_know_this' },
        { questionId: 'q3', skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: true, timeTaken: 18, confidence: 'not_sure', workingSubmitted: true },
      ],
      skillScores: {
        F006: { accuracy: 0, fluencyAccuracy: 0, skippedRate: 0 },
        F008: { accuracy: 0, fluencyAccuracy: 0, skippedRate: 0 },
        F010: { accuracy: 100, fluencyAccuracy: 80, skippedRate: 0 },
      },
      weakSkillIds: ['F006', 'F008'],
      masteredSkillIds: ['F010'],
      suspectedPrerequisiteGaps: ['F004'],
      recommendedStartingSkillId: 'F004',
    });

    expect(explained.skillEvidence.length).toBe(3);
    expect(explained.rootCauses.length).toBeGreaterThan(0);
    expect(explained.misconceptions.length).toBeGreaterThan(0);
    expect(explained.readinessComponents.explanation).toMatch(/Overall combines/);
    expect(explained.recommendations.student).toMatch(/Practise/);
    expect(explained.audit.hasRecommendation).toBe(true);
  });

  it('is wired into fraction diagnostic scoring', () => {
    const session = buildFractionDiagnosticSession({ studentLevel: 'P4', mode: 'core' });
    const scored = scoreFractionDiagnosticAttempt({
      sessionId: session.sessionId,
      responses: [
        { questionId: 'q1', skillId: 'F006', questionFamilyId: 'QF_F006_001', correct: false, timeTaken: 6, confidence: 'i_know_this' },
        { questionId: 'q2', skillId: 'F008', questionFamilyId: 'QF_F008_001', correct: false, timeTaken: 7, confidence: 'i_know_this' },
        { questionId: 'q3', skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: true, timeTaken: 18, confidence: 'not_sure', workingSubmitted: true },
      ],
    });

    expect(scored.explainability.audit.hasRecommendation).toBe(true);
    expect(scored.rootCauses.length).toBeGreaterThan(0);
    expect(scored.readinessComponents.overall).toBeGreaterThanOrEqual(0);
  });

  it('passes self-validation', () => {
    expect(validateDiagnosticExplainabilityEngine().isValid).toBe(true);
  });
});
