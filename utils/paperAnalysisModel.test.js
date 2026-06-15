import { describe, expect, it } from 'vitest';
import PaperAnalysis, {
  PAPER_ANALYSIS_STATUS,
  PAPER_ANALYSIS_UPLOAD_TYPES,
} from '../models/mathpath/PaperAnalysis.js';

describe('PaperAnalysis model', () => {
  it('accepts the MVP upload types and status values', () => {
    expect(PAPER_ANALYSIS_UPLOAD_TYPES).toEqual([
      'blank_worksheet',
      'completed_unmarked',
      'marked_script',
      'corrections_working',
    ]);
    expect(PAPER_ANALYSIS_STATUS).toEqual([
      'uploaded',
      'processing',
      'ocr_complete',
      'questions_detected',
      'needs_ocr_confirmation',
      'questions_confirmed',
      'skills_mapped',
      'needs_review',
      'reviewed',
      'assigned',
      'failed',
    ]);
  });

  it('validates a paper-analysis record shape', () => {
    const analysis = new PaperAnalysis({
      studentId: 'student_1',
      uploadedByUserId: 'adult_1',
      uploadedByRole: 'parent',
      subjectId: 'math',
      domainId: 'fractions',
      uploadType: 'marked_script',
      sourceType: 'adult_upload',
      originalFilename: 'paper.pdf',
      fileUrl: '/uploads/mathpath-paper-analysis/paper.pdf',
      pageCount: 2,
      status: 'needs_review',
      detectedQuestions: [
        {
          questionNumber: '3',
          questionText: 'Add 1/3 and 1/6.',
          marks: 2,
          detectedSkillIds: ['F015'],
          studentAnswer: '2/9',
          teacherMarkedCorrect: false,
          teacherMark: 'wrong',
          teacherMarkConfidence: 0.7,
          skillMappingConfidence: 0.8,
          skillMappingSource: 'keyword_mapping',
          adultConfirmedWrong: true,
          confidence: 0.8,
          dataQualityWarnings: ['Adult confirmation required.'],
        },
      ],
      dataQualityWarnings: ['One or more pages have low OCR confidence.'],
      weakSkillIds: ['F015'],
      recommendedActions: [{ type: 'assign_practice', skillId: 'F015', reason: 'Confirmed wrong question' }],
    });

    expect(analysis.validateSync()).toBeUndefined();
  });

  it('rejects unsupported upload types and statuses', () => {
    const analysis = new PaperAnalysis({
      studentId: 'student_1',
      uploadedByUserId: 'adult_1',
      uploadedByRole: 'parent',
      uploadType: 'essay',
      status: 'complete',
    });

    const error = analysis.validateSync();
    expect(error?.errors?.uploadType).toBeTruthy();
    expect(error?.errors?.status).toBeTruthy();
  });
});
