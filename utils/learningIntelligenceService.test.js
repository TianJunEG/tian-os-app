import { describe, expect, it } from 'vitest';
import {
  LEARNING_RECOMMENDED_ACTIONS,
  aggregateLearningEvidence,
  generateStudentLearningProfile,
  rankInterventionPriorities,
} from '../services/learning/learningIntelligenceService.js';

const now = new Date('2026-06-05T00:00:00.000Z');

describe('learningIntelligenceService', () => {
  it('detects strengths from correct diagnostic and fluent records', () => {
    const profile = generateStudentLearningProfile({
      studentId: 'student_1',
      now,
      diagnosticResults: [
        {
          microSkill: 'fractions.p4.equal_parts_whole',
          correct: true,
          confidence: 'HIGH',
          occurredAt: '2026-06-04T00:00:00.000Z',
        },
      ],
      fluencyRecords: [
        {
          skillCode: 'fractions.p4.add_same_denominator',
          fluencyStatus: 'fluent',
          fluencyScore: 92,
          accuracy: 95,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ],
    });

    expect(profile.strengths.map((item) => item.id)).toEqual([
      'fractions.p4.equal_parts_whole',
      'fractions.p4.add_same_denominator',
    ]);
    expect(profile.interventionPriorities).toEqual([]);
  });

  it('detects weaknesses from incorrect practice and mistake records', () => {
    const aggregate = aggregateLearningEvidence({
      now,
      practiceAttempts: [
        {
          skillId: 'fractions.p4.fraction_remainder_reasoning',
          answerCorrect: false,
          confidenceLevel: 'LOW',
          createdAt: '2026-06-04T00:00:00.000Z',
        },
      ],
      mistakeRecords: [
        {
          skillCode: 'fractions.p4.fraction_remainder_reasoning',
          severity: 'major',
          frequency: 2,
          occurredAt: '2026-06-03T00:00:00.000Z',
        },
      ],
    });

    expect(aggregate.weaknesses).toEqual([
      expect.objectContaining({
        id: 'fractions.p4.fraction_remainder_reasoning',
        count: 2,
      }),
    ]);
  });

  it('flags high-confidence wrong answers as confidence risks', () => {
    const profile = generateStudentLearningProfile({
      studentId: 'student_2',
      now,
      practiceAttempts: [
        {
          skillId: 'fractions.p4.convert_improper_to_mixed',
          answerCorrect: false,
          confidenceLevel: 'HIGH',
          createdAt: '2026-06-05T00:00:00.000Z',
        },
      ],
    });

    expect(profile.confidenceRisks[0]).toMatchObject({
      id: 'fractions.p4.convert_improper_to_mixed',
      count: 1,
    });
    expect(profile.interventionPriorities[0]).toMatchObject({
      id: 'fractions.p4.convert_improper_to_mixed',
      recommendedAction: LEARNING_RECOMMENDED_ACTIONS.MODEL_TRAINER,
    });
  });

  it('flags no-working risk on high-requirement questions', () => {
    const profile = generateStudentLearningProfile({
      studentId: 'student_3',
      now,
      practiceAttempts: [
        {
          skillId: 'fractions.p4.model_one_step_word_problem',
          answerCorrect: false,
          confidenceLevel: 'HIGH',
          workingNotNeeded: true,
          workingRequirementLevel: 'HIGH',
          createdAt: '2026-06-05T00:00:00.000Z',
        },
      ],
    });

    expect(profile.workingPatterns[0]).toMatchObject({
      id: 'fractions.p4.model_one_step_word_problem',
    });
    expect(profile.interventionPriorities[0]).toMatchObject({
      id: 'fractions.p4.model_one_step_word_problem',
      recommendedAction: LEARNING_RECOMMENDED_ACTIONS.TUTOR_INTERVENTION,
    });
  });

  it('weights repeated recent mistakes above isolated older mistakes', () => {
    const priorities = rankInterventionPriorities({
      weaknesses: [
        {
          id: 'fractions.p4.simplify_to_lowest_terms',
          evidence: [
            {
              source: 'mistake',
              severity: 'major',
              frequency: 4,
              weight: 5,
            },
          ],
        },
        {
          id: 'fractions.p4.unit_fraction_size',
          evidence: [
            {
              source: 'mistake',
              severity: 'minor',
              frequency: 1,
              weight: 1,
            },
          ],
        },
      ],
    });

    expect(priorities[0].id).toBe('fractions.p4.simplify_to_lowest_terms');
    expect(priorities[0].priorityScore).toBeGreaterThan(priorities[1].priorityScore);
  });

  it('detects fluency gaps and recommends fluency drill', () => {
    const profile = generateStudentLearningProfile({
      studentId: 'student_4',
      now,
      fluencyRecords: [
        {
          skillCode: 'fractions.p4.add_same_denominator',
          fluencyStatus: 'not_fluent',
          fluencyScore: 45,
          accuracy: 82,
          averageTimeSeconds: 18,
          updatedAt: '2026-06-04T00:00:00.000Z',
        },
      ],
    });

    expect(profile.fluencyWeaknesses[0]).toMatchObject({
      id: 'fractions.p4.add_same_denominator',
    });
    expect(profile.interventionPriorities[0]).toMatchObject({
      id: 'fractions.p4.add_same_denominator',
      recommendedAction: LEARNING_RECOMMENDED_ACTIONS.FLUENCY_DRILL,
    });
  });

  it('detects WordPath weaknesses and recommends WordPath review', () => {
    const profile = generateStudentLearningProfile({
      studentId: 'student_5',
      now,
      paperReviews: [
        {
          completedAt: '2026-06-05T00:00:00.000Z',
          mappedWordStructures: [
            {
              wordStructure: 'wordpath.fraction_of_remainder',
              wordMicroSkill: 'wordpath.fraction_remainder.identify_original_removed_remainder',
              modelType: 'FRACTION_BAR',
              confidenceScore: 0.82,
            },
          ],
          remediationPlan: [],
        },
      ],
    });

    expect(profile.wordPathWeaknesses[0]).toMatchObject({
      id: 'wordpath.fraction_remainder.identify_original_removed_remainder',
    });
    expect(profile.interventionPriorities[0]).toMatchObject({
      recommendedAction: LEARNING_RECOMMENDED_ACTIONS.WORDPATH_REVIEW,
    });
  });

  it('includes supporting evidence for every recommendation', () => {
    const profile = generateStudentLearningProfile({
      studentId: 'student_6',
      now,
      mistakeRecords: [
        {
          skillCode: 'fractions.p4.generate_equivalent_fractions',
          misconceptionTag: 'M-EQ-002',
          severity: 'moderate',
          frequency: 3,
          occurredAt: '2026-06-04T00:00:00.000Z',
        },
      ],
    });

    expect(profile.interventionPriorities[0].supportingEvidence.length).toBeGreaterThan(0);
    expect(profile.supportingEvidence[0]).toMatchObject({
      priorityId: 'fractions.p4.generate_equivalent_fractions',
      source: 'mistake',
    });
    expect(profile.misconceptions[0]).toMatchObject({
      id: 'M-EQ-002',
    });
  });
});
