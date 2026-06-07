import { describe, expect, it } from 'vitest';
import {
  calculateEvidenceConfidenceScore,
  classifyAttemptEvidence,
  validateDiagnosticSession,
  validateInterventions,
} from '../services/mathpath/diagnosticValidationEngine.js';

describe('diagnosticValidationEngine', () => {
  it('identifies weak skills with supporting diagnostic evidence', () => {
    const validation = validateDiagnosticSession({
      session: {
        diagnosticSessionId: 'diag_1',
        studentId: 'student_1',
        subjectId: 'math',
        domainId: 'fractions',
        readinessScore: 52,
        assignedPracticeSkillIds: ['F011'],
        perSkillSnapshot: [
          { skillId: 'F011', skillName: 'Generate Equivalent Fractions', questionsAnswered: 3, correctCount: 1, score: 33 },
        ],
      },
      attempts: [
        { skillId: 'F011', answerCorrect: false, confidenceLevel: 'HIGH', workingSubmitted: true, possibleMisconception: 'multiplies numerator only' },
        { skillId: 'F011', answerCorrect: false, confidenceLevel: 'MEDIUM', workingSubmitted: true },
        { skillId: 'F011', answerCorrect: true, confidenceLevel: 'HIGH', workingNotNeeded: true },
      ],
    });

    const row = validation.skillValidationMatrix.find((item) => item.skillId === 'F011');
    expect(validation.identifiedWeakSkills).toContain('F011');
    expect(row.evidenceStrength).toBe('strong');
    expect(row.confidenceScore).toBeGreaterThanOrEqual(35);
    expect(row.interventionLinkage.recommended).toBe(true);
  });

  it('flags a weak-skill claim based on one item as false-positive risk', () => {
    const validation = validateDiagnosticSession({
      session: {
        diagnosticSessionId: 'diag_2',
        studentId: 'student_1',
        subjectId: 'math',
        domainId: 'fractions',
        perSkillSnapshot: [
          { skillId: 'F012', skillName: 'Simplify Fractions', questionsAnswered: 1, correctCount: 0, score: 0 },
        ],
      },
      attempts: [
        { skillId: 'F012', answerCorrect: false, confidenceLevel: 'LOW', workingSubmitted: false },
      ],
    });

    expect(validation.falsePositiveRisks).toHaveLength(1);
    expect(validation.falsePositiveRisks[0].recommendedAction).toBe('collect_more_evidence');
  });

  it('flags passed skills with conflicting paper evidence as false-negative risk', () => {
    const validation = validateDiagnosticSession({
      session: {
        diagnosticSessionId: 'diag_3',
        studentId: 'student_1',
        subjectId: 'math',
        domainId: 'fractions',
        perSkillSnapshot: [
          { skillId: 'F018', skillName: 'Add Different Denominators', questionsAnswered: 3, correctCount: 3, score: 100 },
        ],
      },
      attempts: [
        { skillId: 'F018', answerCorrect: true, confidenceLevel: 'HIGH', workingSubmitted: true },
      ],
      paperAnalyses: [
        {
          status: 'reviewed',
          weakSkillIds: ['F018'],
          detectedQuestions: [
            { detectedSkillIds: ['F018'], adultConfirmedWrong: true, misconceptionTags: ['adds_denominators_directly'] },
          ],
        },
      ],
    });

    expect(validation.falseNegativeRisks).toHaveLength(1);
    expect(validation.falseNegativeRisks[0].recommendedAction).toBe('manual_review');
  });

  it('classifies confidence and working evidence patterns', () => {
    expect(classifyAttemptEvidence({
      answerCorrect: false,
      confidenceLevel: 'HIGH',
      workingNotNeeded: true,
      workingRequirementLevel: 'HIGH',
    })).toBe('confidence_mismatch');

    expect(classifyAttemptEvidence({
      answerCorrect: false,
      confidenceLevel: 'LOW',
    })).toBe('knowledge_gap');
  });

  it('scores multi-source evidence above diagnostic-only evidence', () => {
    const diagnosticOnly = calculateEvidenceConfidenceScore({
      diagnosticEvidence: { questionsAnswered: 1, hasPerSkillSnapshot: true },
    });
    const multiSource = calculateEvidenceConfidenceScore({
      diagnosticEvidence: { questionsAnswered: 3, hasConsistentErrors: true, hasPerSkillSnapshot: true },
      paperEvidence: { confirmedWeakSkill: true, adultReviewed: true },
      workingEvidence: { methodIssueDetected: true },
      assignmentEvidence: { completed: true, lowAccuracy: true },
      recheckEvidence: { completed: true, confirmedStillWeak: true },
    });

    expect(multiSource).toBeGreaterThan(diagnosticOnly);
    expect(multiSource).toBeGreaterThanOrEqual(80);
  });

  it('validates intervention success from recovery pack to recheck', () => {
    const results = validateInterventions({
      assignments: [
        {
          _id: 'assignment_1',
          sourceType: 'diagnostic',
          sourceId: 'diag_4',
          status: 'completed',
          skillIds: ['F011'],
          completion: { accuracy: 82 },
        },
      ],
      diagnostics: [
        {
          _id: 'diag_4',
          diagnosticSessionId: 'diag_4',
          perSkillSnapshot: [{ skillId: 'F011', score: 32 }],
        },
        {
          diagnosticPurpose: 'recheck',
          assignmentId: 'assignment_1',
          perSkillSnapshot: [{ skillId: 'F011', score: 81 }],
        },
      ],
    });

    expect(results[0].interventionSucceeded).toBe(true);
    expect(results[0].targetedSkillImprovement[0].improvement).toBe(49);
  });
});
