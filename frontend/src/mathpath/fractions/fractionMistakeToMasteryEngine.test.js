import { describe, expect, it } from 'vitest';
import {
  buildAutomaticNextActions,
  buildInterventionPathway,
  buildMistakeHistory,
  buildMistakeToMasteryPlan,
  buildReassessmentPlan,
  buildRetentionSchedule,
  buildWorksheetMappingForMistake,
  classifyFractionMistake,
  getRemediationForMistake,
  validateFractionMistakeToMasteryEngine,
  validateMistakeMastery,
} from './fractionMistakeToMasteryEngine.js';

describe('fraction Mistake-to-Mastery Sprint 4 engine', () => {
  it('classifies a repeated fraction misconception with category, severity, and remediation assets', () => {
    const result = classifyFractionMistake({
      skillId: 'F018',
      questionFamilyId: 'QF_F018_001',
      studentAnswer: '2/5',
      correctAnswer: '5/6',
      promptOperands: ['1/2', '1/3'],
      confidence: 'confident',
      attemptHistory: [
        { suspectedMistakeCode: 'M001', timestamp: '2026-01-01T00:00:00.000Z' },
        { suspectedMistakeCode: 'M001', timestamp: '2026-01-02T00:00:00.000Z' },
        { suspectedMistakeCode: 'M001', timestamp: '2026-01-03T00:00:00.000Z' },
      ],
    });

    expect(result.suspectedMistakeCode).toBe('M001');
    expect(result.mistakeCategory).toBe('conceptual_misconception');
    expect(['major', 'critical']).toContain(result.severityLevel);
    expect(result.interventionPathway.sequence.length).toBeGreaterThan(0);
    expect(result.worksheetMapping.workingSpace).toBe(true);
    expect(result.reassessmentPlan.differentQuestionRequired).toBe(true);
  });

  it('builds mistake history with first, most recent, frequency, and trend', () => {
    const history = buildMistakeHistory([
      { suspectedMistakeCode: 'M008', timestamp: '2026-01-01T00:00:00.000Z' },
      { suspectedMistakeCode: 'M010', timestamp: '2026-01-02T00:00:00.000Z' },
      { suspectedMistakeCode: 'M008', timestamp: '2026-01-03T00:00:00.000Z' },
    ], 'M008');

    expect(history.firstOccurrence).toBe('2026-01-01T00:00:00.000Z');
    expect(history.mostRecent).toBe('2026-01-03T00:00:00.000Z');
    expect(history.frequency).toBe(2);
    expect(history.attemptsSinceOccurrence).toBe(0);
  });

  it('maps a remainder mistake to visual intervention, worksheet, and reassessment', () => {
    const pathway = buildInterventionPathway('M008', { skillId: 'F023', severityLevel: 'major' });
    const worksheet = buildWorksheetMappingForMistake('M008', { skillId: 'F023' });
    const reassessment = buildReassessmentPlan('M008', {
      skillId: 'F023',
      previousQuestionIds: ['QF_F023_001'],
    });

    expect(pathway.sequence.some((step) => step.intervention_id === 'visual_model')).toBe(true);
    expect(worksheet.skillFocus).toEqual(expect.arrayContaining(['F020', 'F023', 'F024']));
    expect(worksheet.answerKeyIncluded).toBe(true);
    expect(reassessment.sameSkillAndMisconceptionRequired).toBe(true);
    expect(reassessment.questionFamilyIds).not.toContain('QF_F023_001');
  });

  it('validates mastery using correctness plus working and confidence evidence', () => {
    const mastered = validateMistakeMastery({
      attempts: [
        { correct: true, workingUploaded: true },
        { correct: true, workingUploaded: true },
        { correct: true, workingUploaded: false },
      ],
      confidenceAlignedRate: 0.8,
      fluencyRate: 0.7,
    });

    expect(mastered.masteryState).toBe('mastered');
    expect(mastered.timingDoesNotDetermineMasteryAlone).toBe(true);
  });

  it('creates retention checks and automatic next actions', () => {
    const retention = buildRetentionSchedule({ masteredAt: '2026-01-01T00:00:00.000Z' });
    const nextActions = buildAutomaticNextActions({
      focusMistakes: [{ mistakeCode: 'M008', highestSeverityLevel: 'critical' }],
    });

    expect(retention.map((item) => item.intervalDays)).toEqual([1, 7, 30, 90]);
    expect(nextActions[0].action).toBe('flag_teacher_tutor');
  });

  it('keeps remediation callable for Mistake-to-Mastery screens', () => {
    const remediation = getRemediationForMistake('M008', { skillId: 'F023' });

    expect(remediation.modelDrawingTrainer.template_id).toBe('fraction_of_remainder_subdivision');
    expect(remediation.interventionPathway.sequence.length).toBeGreaterThan(0);
    expect(remediation.worksheetMapping.workingCodePrefix).toBe('MP-FRA-M008');
  });

  it('builds an end-to-end plan from classified mistakes', () => {
    const mistake = classifyFractionMistake({
      skillId: 'F023',
      questionFamilyId: 'QF_F023_001',
      studentAnswer: '1/2',
      correctAnswer: '3/10',
      confidence: 'unsure',
    });
    const plan = buildMistakeToMasteryPlan({
      studentId: 'student_1',
      currentSkillId: 'F023',
      mistakeResults: [mistake],
      attemptHistory: [{ correct: false, workingUploaded: true, suspectedMistakeCode: mistake.suspectedMistakeCode }],
    });

    expect(plan.focusMistakes[0].mistakeCode).toBe('M008');
    expect(plan.interventionPathways.length).toBe(1);
    expect(plan.worksheetMappings.length).toBe(1);
    expect(plan.reassessmentQueue.length).toBe(1);
    expect(plan.nextActions.length).toBeGreaterThan(0);
  });

  it('passes the built-in validator', () => {
    const validation = validateFractionMistakeToMasteryEngine();
    expect(validation.isValid).toBe(true);
  });
});
