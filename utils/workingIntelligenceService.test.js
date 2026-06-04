import { describe, expect, it } from 'vitest';
import {
  applyHumanReviewCorrection,
  buildOcrAuditReport,
  buildStructuredWorkingRecord,
  buildWorkingIntelligenceRecordsFromSession,
  extractOcrCandidates,
  segmentWorkingSteps,
  validateWorkingIntelligenceFoundation,
} from '../services/mathpath/workingIntelligenceService.js';

describe('workingIntelligenceService', () => {
  it('extracts OCR candidates without treating uncertain text as fact', () => {
    const ocr = extractOcrCandidates({ rawText: 'Step 1: 1/2 + 1/4 = 3/4\nAns 3/4 litre' });

    expect(ocr.fractions.map((f) => f.normalized)).toEqual(expect.arrayContaining(['1/2', '1/4', '3/4']));
    expect(ocr.equations[0].value).toContain('=');
    expect(ocr.units[0].value.toLowerCase()).toBe('litre');
    expect(ocr.confidence.score).toBeLessThanOrEqual(0.78);
  });

  it('builds structured working records from session data', () => {
    const record = buildStructuredWorkingRecord({
      workingSessionId: 'work_1',
      userId: 'user_1',
      studentId: 'student_1',
      practiceSessionId: 'practice_1',
      inputMethod: 'stylus',
      canvasStrokeData: [
        { id: 'stroke_1', text: '2 1/3 + 1/3 = 2 2/3', y: 10, timestamp: '2026-06-01T08:00:00.000Z' },
      ],
      mapRow: { questionId: 'q1', skillId: 'F018', workingCode: 'MP-FRAC-F018-ABCD' },
      submittedAt: '2026-06-01T08:00:04.000Z',
    });

    expect(record.userId).toBe('user_1');
    expect(record.studentId).toBe('student_1');
    expect(record.questionId).toBe('q1');
    expect(record.skillId).toBe('F018');
    expect(record.rawArchive.strokeData).toHaveLength(1);
    expect(record.ocrOutput.fractions.some((f) => f.representationType === 'mixed_number')).toBe(true);
    expect(record.timeline.map((e) => e.eventType)).toEqual(expect.arrayContaining(['stroke', 'submission']));
  });

  it('preserves attempt linkage from digital working payloads', () => {
    const record = buildStructuredWorkingRecord({
      workingSessionId: 'work_1',
      studentId: 'student_1',
      practiceSessionId: 'practice_1',
      inputMethod: 'stylus',
      digitalInkData: {
        questionWorkings: [{
          questionId: 'q1',
          attemptId: 'attempt_q1',
          sessionId: 'practice_1',
          workingImage: 'data:image/png;base64,abc',
          workingStrokes: [{ id: 's1', text: '1/2 + 1/4 = 2/6', y: 10 }],
          workingMathObjects: [{ id: 'm1', value: '1/2 + 1/4' }],
          answerGiven: '2/6',
          correctAnswer: '3/4',
          answerCorrect: false,
          confidenceLevel: 'i_know_this',
        }],
      },
      mapRow: {
        questionId: 'q1',
        skillId: 'F018',
        workingCode: 'MP-FRAC-F018-ABCD',
        prompt: 'Add 1/2 and 1/4.',
      },
      submittedAt: '2026-06-01T08:00:04.000Z',
    });

    expect(record.attemptId).toBe('attempt_q1');
    expect(record.sessionId).toBe('practice_1');
    expect(record.answerGiven).toBe('2/6');
    expect(record.correctAnswer).toBe('3/4');
    expect(record.answerCorrect).toBe(false);
    expect(record.rawImage).toBe('data:image/png;base64,abc');
    expect(record.ocrOutput.rawText).toContain('1/2 + 1/4 = 2/6');
    expect(record.datasetRecord.outcome).toMatchObject({
      attemptId: 'attempt_q1',
      answerGiven: '2/6',
      correctAnswer: '3/4',
      answerCorrect: false,
      confidenceLevel: 'i_know_this',
    });
  });

  it('segments working by line breaks', () => {
    const steps = segmentWorkingSteps({ rawText: 'Draw 1 whole\nSplit into 5 parts\n3/5 left' });

    expect(steps).toHaveLength(3);
    expect(steps[0].stepNumber).toBe(1);
  });

  it('creates one record per mapped question', () => {
    const records = buildWorkingIntelligenceRecordsFromSession({
      workingSessionId: 'work_2',
      userId: 'auth_user_1',
      studentId: 'student_1',
      inputMethod: 'paper',
      uploadedImages: ['/uploads/a.png'],
      questionWorkingMap: [
        { questionId: 'q1', skillId: 'F001', workingCode: 'C1' },
        { questionId: 'q2', skillId: 'F002', workingCode: 'C2' },
      ],
    });

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ userId: 'auth_user_1', studentId: 'student_1' });
    expect(records[1].questionId).toBe('q2');
  });

  it('stores human corrections and marks AI-ready only after verification', () => {
    const record = buildStructuredWorkingRecord({
      workingSessionId: 'work_3',
      studentId: 'student_1',
      rawText: '1/2 + 1/2 = 1',
      mapRow: { questionId: 'q3', skillId: 'F018' },
    });
    const corrected = applyHumanReviewCorrection(record, {
      reviewerUserId: 'tutor_1',
      reviewerRole: 'tutor',
      correctedOcrText: '1/2 + 1/2 = 1',
      verified: true,
    });

    expect(corrected.reviewStatus).toBe('verified');
    expect(corrected.analysisStatus).toBe('ready_for_ai');
    expect(corrected.reviewCorrections).toHaveLength(1);
  });

  it('calculates OCR audit rates', () => {
    const records = [
      { qualityMetrics: { ocrSuccess: true, fractionExtractionSuccess: true, stepSegmentationSuccess: true, unreadable: false } },
      { qualityMetrics: { ocrSuccess: false, fractionExtractionSuccess: false, stepSegmentationSuccess: false, unreadable: true } },
    ];

    expect(buildOcrAuditReport(records)).toMatchObject({
      totalRecords: 2,
      ocrSuccessRate: 50,
      unreadableWorkingRate: 50,
    });
  });

  it('passes the foundation validator', () => {
    const validation = validateWorkingIntelligenceFoundation();

    expect(validation.completed).toBe(true);
    expect(Object.values(validation.checks).every(Boolean)).toBe(true);
  });
});
