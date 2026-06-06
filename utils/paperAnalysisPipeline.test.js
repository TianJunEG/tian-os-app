import { beforeEach, describe, expect, it, vi } from 'vitest';

const findByIdMock = vi.fn();
const extractTextMock = vi.fn();

vi.mock('../models/mathpath/PaperAnalysis.js', () => ({
  default: { findById: (...args) => findByIdMock(...args) },
}));

vi.mock('../services/mathpath/ocrService.js', () => ({
  extractTextFromPaper: (...args) => extractTextMock(...args),
}));

const { runPaperAnalysisPipeline } = await import('../services/mathpath/paperAnalysisPipeline.js');

function mockAnalysis() {
  return {
    _id: 'analysis_1',
    originalFilename: 'paper.pdf',
    pageCount: 1,
    ocrPages: [],
    pipelineLog: [],
    detectedQuestions: [],
    recommendedActions: [],
    weakSkillIds: [],
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('paperAnalysisPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists OCR, detected questions, report and needs_review status', async () => {
    const analysis = mockAnalysis();
    findByIdMock.mockResolvedValueOnce(analysis);
    extractTextMock.mockResolvedValueOnce({
      pages: [{
        pageNumber: 1,
        extractedText: '1. Add 1/2 and 1/3 [2 marks]\nAnswer: 2/5\nwrong',
        confidence: 0.82,
        needsReview: false,
      }],
    });

    const result = await runPaperAnalysisPipeline({
      analysisId: 'analysis_1',
      fileBuffer: Buffer.from('paper'),
      mimeType: 'application/pdf',
    });

    expect(result.status).toBe('needs_review');
    expect(result.ocrPages).toHaveLength(1);
    expect(result.pipelineLog.map((row) => row.stage)).toEqual(expect.arrayContaining([
      'processing',
      'ocr_complete',
      'questions_detected',
      'skills_mapped',
      'needs_review',
    ]));
    expect(result.detectedQuestions[0]).toMatchObject({
      questionNumber: '1',
      teacherMarkedCorrect: false,
      needsAdultReview: true,
    });
    expect(result.detectedQuestions[0].skillMappingConfidence).toBeGreaterThanOrEqual(0);
    expect(result.extractionSummary.adultReviewRequired).toBe(true);
    expect(result.dataQualityWarnings).toEqual(expect.any(Array));
    expect(analysis.save).toHaveBeenCalled();
  });
});
