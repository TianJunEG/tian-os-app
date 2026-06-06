import fs from 'fs/promises';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import { extractTextFromPaper } from './ocrService.js';
import { segmentQuestionsFromOcrPages } from './questionSegmentationService.js';
import { mapPaperQuestionToSkillsWithAi } from './paperAnalysisSkillMapper.js';
import { detectMisconceptions } from './misconceptionDetectionService.js';
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

async function mergeQuestionAnalysis(question = {}) {
  const skillMapping = await mapPaperQuestionToSkillsWithAi(question);
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
  try {
    return await fs.readFile(analysis.storageKey);
  } catch {
    return null;
  }
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
    const detectedQuestions = await Promise.all(segmented.map(mergeQuestionAnalysis));
    analysis.detectedQuestions = detectedQuestions;
    analysis.status = detectedQuestions.length ? 'questions_detected' : 'needs_review';
    analysis.pipelineLog.push(log('questions_detected', 'Question segmentation completed.', {
      detectedQuestions: detectedQuestions.length,
    }));
    await analysis.save();

    if (detectedQuestions.length) {
      analysis.status = 'skills_mapped';
      analysis.pipelineLog.push(log('skills_mapped', 'Question skill mapping completed.', {
        mappedQuestions: detectedQuestions.filter((question) => (question.detectedSkillIds || []).length).length,
        lowConfidenceMappings: detectedQuestions.filter((question) => Number(question.skillMappingConfidence || 0) < 0.7).length,
      }));
      await analysis.save();
    }

    const recommendation = buildReviewRecommendations(analysis);
    analysis.reportSummary = recommendation.report;
    analysis.recommendedActions = recommendation.recommendedActions;
    analysis.weakSkillIds = recommendation.report.weakSkills || [];
    analysis.extractionSummary = {
      ocrPageCount: analysis.ocrPages.length,
      detectedQuestionCount: detectedQuestions.length,
      lowConfidencePageCount: analysis.ocrPages.filter((page) => page.needsReview).length,
      lowConfidenceQuestionCount: detectedQuestions.filter((question) => question.needsAdultReview).length,
      adultReviewRequired: true,
    };
    analysis.dataQualityWarnings = analysisWarnings({ ocrPages: analysis.ocrPages, detectedQuestions });
    analysis.status = 'needs_review';
    analysis.pipelineLog.push(log('needs_review', 'Analysis prepared for adult review.', analysis.extractionSummary));
    await analysis.save();
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
  applyAdultReviewOverrides,
  buildReportForAnalysis,
};
