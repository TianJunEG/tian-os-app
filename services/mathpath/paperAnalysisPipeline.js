import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import { getUploadBuffer } from '../storage/objectStore.js';
import { extractTextFromPaper } from './ocrService.js';
import { segmentQuestionsFromOcrPages } from './questionSegmentationService.js';
import { mapPaperQuestionToSkillsWithAi as mapFractionsWithAi } from './paperAnalysisSkillMapper.js';
import { mapPaperQuestionToSkillsWithAi as mapDecimalsWithAi } from './decimalsPaperAnalysisMapper.js';
import { detectMisconceptions } from './misconceptionDetectionService.js';

function getSkillMapper(domainId = 'fractions') {
  if (domainId === 'decimals') return mapDecimalsWithAi;
  return mapFractionsWithAi;
}
import {
  buildPaperAnalysisRecommendations as buildReviewRecommendations,
  buildPaperAnalysisReport,
} from './paperAnalysisRecommendationEngine.js';

export const PAPER_ANALYSIS_PIPELINE_STAGES = [
  'uploaded',
  'processing',
  'ocr_complete',
  'questions_detected',
  'skills_mapped',
  'needs_review',
  'reviewed',
  'assigned',
  'failed',
];

function log(stage, message, metadata = {}) {
  return { stage, message, metadata, at: new Date() };
}

async function mergeQuestionAnalysis(question = {}, { mapWithAi = mapFractionsWithAi } = {}) {
  const skillMapping = await mapWithAi(question);
  const misconception = detectMisconceptions(question);
  const confidence = Math.max(
    Number(question.confidence || 0),
    Number(skillMapping.confidence || 0),
    Number(misconception.confidence || 0)
  );
  return {
    ...question,
    detectedSkillIds: skillMapping.detectedSkillIds,
    skillMappingReasons: [
      ...(skillMapping.reasons || []),
      skillMapping.aiUsed ? 'AI-assisted mapping used; adult confirmation still required.' : '',
    ].filter(Boolean),
    skillMappingConfidence: Number(skillMapping.confidence || skillMapping.skillMappingConfidence || 0),
    skillMappingSource: skillMapping.source || '',
    misconceptionTags: [...new Set([
      ...(question.misconceptionTags || []),
      ...(skillMapping.suggestedMisconceptions || []),
      ...(misconception.misconceptionTags || []),
    ])],
    misconceptionEvidence: misconception.misconceptionEvidence || [],
    confidence,
    needsAdultReview: Boolean(
      question.needsAdultReview
      || skillMapping.needsAdultReview
      || confidence < 0.85
      || question.teacherMarkedCorrect !== null
    ),
    dataQualityWarnings: [
      ...(question.dataQualityWarnings || []),
      ...(!question.questionNumber ? ['Missing question number.'] : []),
      ...(!question.questionText ? ['Missing OCR question text.'] : []),
      ...(!question.studentAnswer && question.teacherMarkedCorrect !== null ? ['Teacher mark detected but student answer is unclear.'] : []),
      ...(Number(skillMapping.confidence || 0) < 0.7 ? ['Low skill mapping confidence.'] : []),
      ...(!(skillMapping.detectedSkillIds || []).length ? ['No skill mapping detected.'] : []),
    ],
  };
}

function analysisWarnings({ ocrPages = [], detectedQuestions = [] } = {}) {
  return [
    ...ocrPages.flatMap((page) => page.warnings || []),
    ...(ocrPages.some((page) => Number(page.confidence || 0) < 0.65) ? ['One or more pages have low OCR confidence.'] : []),
    ...(detectedQuestions.some((question) => !question.questionNumber) ? ['Some question numbers are missing or inferred.'] : []),
    ...(detectedQuestions.some((question) => !question.studentAnswer && question.teacherMarkedCorrect !== null) ? ['Some marked questions have unclear student answers.'] : []),
    ...(detectedQuestions.some((question) => Number(question.skillMappingConfidence || question.confidence || 0) < 0.7) ? ['Some questions have low skill mapping confidence.'] : []),
    ...(!detectedQuestions.length ? ['No questions were detected automatically. Manual review is required.'] : []),
  ];
}

async function readBufferFromAnalysis(analysis) {
  if (!analysis?.storageKey) return null;
  // Reads from R2 or disk per the stored provider, so a separate worker can read
  // an upload it never received (R2) while local/legacy disk rows still work.
  return getUploadBuffer({ storageKey: analysis.storageKey, storageProvider: analysis.storageProvider });
}

export async function runPaperAnalysisPipeline({
  analysisId,
  fileBuffer = null,
  mimeType = '',
  filename = '',
} = {}) {
  const analysis = await PaperAnalysis.findById(analysisId);
  if (!analysis) {
    const err = new Error('Paper analysis not found.');
    err.status = 404;
    throw err;
  }

  try {
    analysis.status = 'processing';
    analysis.pipelineLog.push(log('processing', 'Paper analysis pipeline started.'));
    await analysis.save();

    const buffer = fileBuffer || await readBufferFromAnalysis(analysis);
    const ocr = await extractTextFromPaper({
      buffer,
      mimeType,
      filename: filename || analysis.originalFilename,
    });
    analysis.ocrPages = (ocr.pages || []).map((page) => ({
      pageNumber: page.pageNumber,
      extractedText: page.extractedText,
      confidence: page.confidence,
      needsReview: page.needsReview || Number(page.confidence || 0) < 0.65,
      warnings: page.warnings || [],
    }));
    analysis.pageCount = Math.max(analysis.pageCount || 1, analysis.ocrPages.length || 1);
    analysis.status = 'ocr_complete';
    analysis.pipelineLog.push(log('ocr_complete', 'OCR extraction completed.', {
      pages: analysis.ocrPages.length,
      lowConfidencePages: analysis.ocrPages.filter((page) => page.needsReview).length,
    }));
    await analysis.save();

    const segmented = segmentQuestionsFromOcrPages(analysis.ocrPages);

    // Store raw segmented questions before skill mapping so the confirmation UI
    // can show them if OCR quality is uncertain.
    analysis.detectedQuestions = segmented;
    analysis.status = 'questions_detected';
    analysis.pipelineLog.push(log('questions_detected', 'Question segmentation completed.', {
      detectedQuestions: segmented.length,
    }));
    await analysis.save();

    // Pause for parent/tutor OCR confirmation when the OCR output is uncertain.
    const lowConfidencePage = analysis.ocrPages.some((p) => p.needsReview);
    const uncertainQuestion = segmented.some((q) => q.needsAdultReview || !q.studentAnswer || !q.questionText);
    if (segmented.length > 0 && (lowConfidencePage || uncertainQuestion)) {
      analysis.status = 'needs_ocr_confirmation';
      analysis.pipelineLog.push(log('needs_ocr_confirmation', 'OCR review required before skill analysis.', {
        lowConfidencePages: analysis.ocrPages.filter((p) => p.needsReview).length,
        questionsNeedingReview: segmented.filter((q) => q.needsAdultReview || !q.studentAnswer || !q.questionText).length,
      }));
      await analysis.save();
      return analysis; // pipeline pauses here — resumes via confirm-ocr endpoint
    }

    await runSkillMappingPhase(analysis);
    return analysis;
  } catch (err) {
    analysis.status = 'failed';
    analysis.pipelineLog.push(log('failed', err.message || 'Paper analysis pipeline failed.'));
    analysis.extractionSummary = {
      ...(analysis.extractionSummary || {}),
      error: err.message || 'Paper analysis pipeline failed.',
    };
    await analysis.save();
    throw err;
  }
}

// Resume point after parent/tutor OCR confirmation. Loads the analysis, validates
// its status, then runs skill mapping → needs_review.
export async function resumeFromOcrConfirmation(analysisId) {
  const analysis = await PaperAnalysis.findById(analysisId);
  if (!analysis) {
    const err = new Error('Paper analysis not found.');
    err.status = 404;
    throw err;
  }
  if (analysis.status !== 'questions_confirmed') {
    const err = new Error(`Cannot resume: expected questions_confirmed, got ${analysis.status}.`);
    err.status = 409;
    throw err;
  }
  try {
    await runSkillMappingPhase(analysis);
    return analysis;
  } catch (err) {
    analysis.status = 'failed';
    analysis.pipelineLog.push(log('failed', err.message || 'Skill mapping failed after OCR confirmation.'));
    await analysis.save();
    throw err;
  }
}

export function applyAdultReviewOverrides(questions = []) {
  return (questions || []).map((question) => ({
    ...question,
    needsAdultReview: !(question.adultConfirmedCorrect || question.adultConfirmedWrong || question.adultIgnored),
  }));
}

export function buildReportForAnalysis(analysis = {}) {
  return buildPaperAnalysisReport(analysis);
}

export default {
  runPaperAnalysisPipeline,
  resumeFromOcrConfirmation,
  applyAdultReviewOverrides,
  buildReportForAnalysis,
};
