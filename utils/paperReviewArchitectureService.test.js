import { describe, expect, it } from 'vitest';
import MathPathPaperUpload from '../models/mathpath/MathPathPaperUpload.js';
import MathPathPaperReviewSession from '../models/mathpath/MathPathPaperReviewSession.js';
import {
  PAPER_REVIEW_EMPTY_STATES,
  PAPER_REVIEW_EVIDENCE_LEVELS,
  PAPER_REVIEW_STATUS,
  buildExtractionFailureSession,
  buildReviewAnalysis,
  createPaperUploadRecord,
  createReviewSessionFromPaper,
  createWorkingAnalysisHook,
  derivePaperReviewEvidence,
  mapQuestionToMathPathSkill,
  mapQuestionToWordPathStructure,
  routeMistakeToRemediation,
} from '../services/mathpath/paperReviewArchitectureService.js';

describe('paperReviewArchitectureService', () => {
  it('creates a valid paper upload model payload', () => {
    const payload = createPaperUploadRecord({
      paperId: 'paper_1',
      studentId: 'student_1',
      uploadedBy: 'parent_1',
      paperType: 'school_test',
      level: 'P4',
      fileUrls: ['https://example.test/paper.png'],
    });
    const doc = new MathPathPaperUpload(payload);

    expect(doc.validateSync()).toBeUndefined();
    expect(payload).toMatchObject({
      paperId: 'paper_1',
      studentId: 'student_1',
      uploadedBy: 'parent_1',
      status: PAPER_REVIEW_STATUS.UPLOADED,
      subject: 'math',
      evidenceLevel: PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_1,
      confidenceLevel: 'LOW',
      hasWorking: false,
    });
  });

  it('creates a valid review session from an uploaded paper', () => {
    const paper = createPaperUploadRecord({
      paperId: 'paper_2',
      studentId: 'student_2',
      uploadedBy: 'tutor_1',
      paperType: 'worksheet',
      level: 'P5',
    });
    const session = createReviewSessionFromPaper(paper, { reviewId: 'review_2' });
    const doc = new MathPathPaperReviewSession(session);

    expect(doc.validateSync()).toBeUndefined();
    expect(session).toMatchObject({
      reviewId: 'review_2',
      paperId: 'paper_2',
      studentId: 'student_2',
      extractedQuestions: [],
      remediationPlan: [],
      evidenceLevel: PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_1,
      workingAnalysisEnabled: false,
    });
  });

  it('derives evidence levels for paper only, answers, and working', () => {
    expect(derivePaperReviewEvidence({ hasQuestionPaper: true })).toMatchObject({
      evidenceLevel: PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_1,
      confidenceLevel: 'LOW',
      reviewQuality: { label: 'Basic Review', stars: 1, description: 'Paper only' },
      workingAnalysisEnabled: false,
    });
    expect(derivePaperReviewEvidence({ hasQuestionPaper: true, hasAnswers: true })).toMatchObject({
      evidenceLevel: PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_2,
      confidenceLevel: 'MEDIUM',
      reviewQuality: { label: 'Enhanced Review', stars: 2, description: 'Paper + Answers' },
      workingAnalysisEnabled: false,
    });
    expect(derivePaperReviewEvidence({ hasQuestionPaper: true, hasAnswers: true, hasWorking: true })).toMatchObject({
      evidenceLevel: PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_3,
      confidenceLevel: 'HIGH',
      reviewQuality: { label: 'Full Review', stars: 3, description: 'Paper + Answers + Working' },
      workingAnalysisEnabled: true,
    });
  });

  it('maps extracted questions to MathPath micro-skill shape', () => {
    const mapped = mapQuestionToMathPathSkill({
      questionNumber: '3',
      questionText: 'There are 42 cards. Half are used, then 1/3 of the remaining cards are used.',
    });

    expect(mapped).toMatchObject({
      questionNumber: '3',
      domain: 'fractions',
      topic: 'fractions.quantity_problem_solving',
      microSkill: 'fractions.p4.fraction_remainder_reasoning',
      needsManualReview: false,
    });
    expect(mapped.confidenceScore).toBeGreaterThan(0.7);
  });

  it('maps word problems to WordPath structure shape', () => {
    const mapped = mapQuestionToWordPathStructure({
      questionNumber: '4',
      questionText: 'Ali had 42 cards. Half were used and 1/3 of the remaining cards were given away.',
    });

    expect(mapped).toMatchObject({
      questionNumber: '4',
      wordStructure: 'wordpath.fraction_of_remainder',
      wordMicroSkill: 'wordpath.fraction_remainder.identify_original_removed_remainder',
      modelType: 'FRACTION_BAR',
      needsManualReview: false,
    });
  });

  it('routes mistakes to remediation plan output shape', () => {
    const plan = routeMistakeToRemediation(
      {
        questionNumber: '5',
        likelyMisconception: 'M-QTY-004',
      },
      {
        questionNumber: '5',
        microSkill: 'fractions.p4.fraction_remainder_reasoning',
      }
    );

    expect(plan).toMatchObject({
      questionNumber: '5',
      skill: 'fractions.p4.fraction_remainder_reasoning',
      misconception: 'M-QTY-004',
      estimatedMinutes: 12,
    });
    expect(plan.recommendedAsset).toContain('fractions_p4_fraction_remainder_reasoning_concept');
  });

  it('builds review analysis with parent and tutor summaries', () => {
    const session = createReviewSessionFromPaper({
      paperId: 'paper_3',
      studentId: 'student_3',
    }, { reviewId: 'review_3' });
    const analysed = buildReviewAnalysis({
      ...session,
      hasAnswers: true,
      hasWorking: true,
      workingDeclaration: 'working_uploaded',
      extractedQuestions: [
        {
          questionNumber: '1',
          questionText: 'There are 42 cards. Half are used, then 1/3 of the remaining cards are used. How many are left?',
          extractionConfidence: 0.9,
        },
      ],
      extractedAnswers: [
        {
          questionNumber: '1',
          studentAnswer: '7',
          correctAnswer: '14',
          answerCorrect: false,
        },
      ],
      extractedWorking: [
        createWorkingAnalysisHook('1', {
          workingAvailable: true,
          ocrText: '1/3 of 42',
          modelMethodIssues: ['Used original amount for remainder fraction'],
        }),
      ],
    });

    expect(analysed.status).toBe(PAPER_REVIEW_STATUS.REMEDIATION_READY);
    expect(analysed.evidenceLevel).toBe(PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_3);
    expect(analysed.workingAnalysisEnabled).toBe(true);
    expect(analysed.detectedMistakes).toHaveLength(1);
    expect(analysed.remediationPlan[0]).toMatchObject({
      skill: 'fractions.p4.fraction_remainder_reasoning',
      misconception: 'M-QTY-004',
    });
    expect(analysed.parentSummary.overallSummary).toContain('remainders');
    expect(analysed.tutorSummary).toMatchObject({
      prioritySkills: ['fractions.p4.fraction_remainder_reasoning'],
      rootCauses: ['M-QTY-004'],
    });
    expect(analysed.tutorSummary.workingInsights[0]).toMatchObject({
      questionNumber: '1',
      workingAvailable: true,
    });
  });

  it('supports paper-only review without answers or working', () => {
    const session = createReviewSessionFromPaper({
      paperId: 'paper_basic',
      studentId: 'student_basic',
    }, { reviewId: 'review_basic', hasQuestionPaper: true });
    const analysed = buildReviewAnalysis({
      ...session,
      extractedQuestions: [
        {
          questionNumber: '1',
          questionText: 'There are 42 cards. Half are used, then 1/3 of the remaining cards are used. How many are left?',
        },
      ],
      extractedAnswers: [],
      extractedWorking: [],
    });

    expect(analysed.evidenceLevel).toBe(PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_1);
    expect(analysed.confidenceLevel).toBe('LOW');
    expect(analysed.workingAnalysisEnabled).toBe(false);
    expect(analysed.parentSummary.reviewQuality).toMatchObject({ label: 'Basic Review', stars: 1 });
    expect(analysed.parentSummary.evidenceLimitations).toContain(PAPER_REVIEW_EMPTY_STATES.workingUnavailable);
    expect(analysed.tutorSummary.workingInsights).toEqual([]);
    expect(analysed.tutorSummary.workingInsightMessage).toBe(PAPER_REVIEW_EMPTY_STATES.tutorWorkingUnavailable);
    expect(analysed.detectedMistakes[0]).toMatchObject({
      likelyMistakeType: 'weak_area_from_question_only',
      needsManualReview: true,
    });
  });

  it('supports paper plus answers without exposing working analysis', () => {
    const session = createReviewSessionFromPaper({
      paperId: 'paper_enhanced',
      studentId: 'student_enhanced',
    }, { reviewId: 'review_enhanced', hasQuestionPaper: true, hasAnswers: true, workingDeclaration: 'working_exists_unavailable' });
    const analysed = buildReviewAnalysis({
      ...session,
      extractedQuestions: [
        {
          questionNumber: '2',
          questionText: 'Find 3/4 of 20.',
        },
      ],
      extractedAnswers: [
        {
          questionNumber: '2',
          studentAnswer: '60',
          correctAnswer: '15',
          answerCorrect: false,
        },
      ],
      extractedWorking: [
        createWorkingAnalysisHook('2', {
          workingAvailable: false,
          ocrText: 'should not appear',
          missingSteps: ['should not appear'],
        }),
      ],
    });

    expect(analysed.evidenceLevel).toBe(PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_2);
    expect(analysed.confidenceLevel).toBe('MEDIUM');
    expect(analysed.workingAnalysisEnabled).toBe(false);
    expect(analysed.parentSummary.reviewQuality).toMatchObject({ label: 'Enhanced Review', stars: 2 });
    expect(analysed.tutorSummary.workingInsights).toEqual([]);
    expect(analysed.detectedMistakes[0].evidence.join(' ')).not.toContain('should not appear');
    expect(analysed.remediationPlan[0]).toMatchObject({
      skill: 'fractions.p4.non_unit_fraction_of_quantity',
    });
  });

  it('supports extraction failure state without fake analysis', () => {
    const failed = buildExtractionFailureSession({ reviewId: 'review_failed' });

    expect(failed).toMatchObject({
      reviewId: 'review_failed',
      status: PAPER_REVIEW_STATUS.FAILED,
      extractionErrorMessage: PAPER_REVIEW_EMPTY_STATES.extractionFailed,
      completedAt: null,
    });
  });
});
