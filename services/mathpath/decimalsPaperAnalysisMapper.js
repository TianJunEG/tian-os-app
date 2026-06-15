import { getActiveProvider } from '../../utils/aiProvider.js';
import { detectMisconceptions } from './misconceptionDetectionService.js';
import { withAiConcurrency } from '../../config/aiConcurrency.js';

const DECIMALS_KEYWORDS = [
  { skillId: 'D001', keywords: ['place value', 'tenths', 'hundredths', 'thousandths', 'decimal place'], misconception: 'dec/place-confuse' },
  { skillId: 'D002', keywords: ['number line', 'mark on the line', 'interval'], misconception: 'dec/nl-interval' },
  { skillId: 'D003', keywords: ['compare', 'greater than', 'smaller than', 'less than', 'which is bigger', 'which is smaller'], misconception: 'dec/longer-decimal' },
  { skillId: 'D004', keywords: ['order', 'ascending', 'descending', 'arrange', 'increasing', 'decreasing'], misconception: 'dec/align-right' },
  { skillId: 'D005', keywords: ['round', 'rounding', 'nearest tenth', 'nearest whole', 'decimal place'], misconception: 'dec/truncate' },
  { skillId: 'D006', keywords: ['add', 'subtract', 'sum', 'difference', 'decimal point'], misconception: 'dec/add-misalign' },
  { skillId: 'D007', keywords: ['multiply by 10', 'divide by 10', 'multiply by 100', 'divide by 100', '× 10', '÷ 10', '× 100', '÷ 100'], misconception: 'dec/move-wrong-way' },
  { skillId: 'D008', keywords: ['multiply', 'product', 'times', '×'], misconception: 'dec/lost-point' },
  { skillId: 'D009', keywords: ['long multiplication', 'decimal multiplication', 'multiply decimal by decimal'], misconception: 'dec/wrong-place-count' },
  { skillId: 'D010', keywords: ['divide', 'quotient', 'long division', '÷'], misconception: 'dec/quotient-point' },
  { skillId: 'D011', keywords: ['divide decimal by decimal', 'divisor is decimal', 'make the divisor whole'], misconception: 'dec/no-scale-divisor' },
  { skillId: 'D012', keywords: ['fraction to decimal', 'convert to decimal', 'as a decimal', 'to a decimal', 'express as decimal'], misconception: 'dec/wrong-denominator' },
  { skillId: 'D013', keywords: ['decimal to fraction', 'convert to fraction', 'as a fraction', 'to a fraction', 'express as fraction'], misconception: 'dec/divide-reversed' },
  { skillId: 'D014', keywords: ['percentage', 'percent', '%', 'fraction decimal percent'], misconception: 'dec/convert-direction' },
];

function normalize(value = '') {
  return String(value || '').toLowerCase();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function mapPaperQuestionToSkills(question = {}, { manualSkillIds = [], treatDetectedSkillIdsAsManual = true } = {}) {
  const suppliedManual = manualSkillIds?.length
    ? manualSkillIds
    : (question.manualSkillIds?.length ? question.manualSkillIds : (treatDetectedSkillIdsAsManual ? question.detectedSkillIds : []));
  const manual = unique((suppliedManual || []).map((id) => String(id || '').trim().toUpperCase()).filter(Boolean));
  if (manual.length) {
    return {
      detectedSkillIds: manual,
      confidence: 1,
      reasons: ['Adult-confirmed skill mapping.'],
      suggestedMisconceptions: [],
      source: 'adult_manual_override',
      skillMappingConfidence: 1,
      needsAdultReview: false,
    };
  }

  const text = normalize(`${question.questionText || ''} ${question.studentAnswer || ''} ${question.teacherMark || ''}`);
  const matches = DECIMALS_KEYWORDS
    .map((rule) => ({
      skillId: rule.skillId,
      misconception: rule.misconception,
      hits: rule.keywords.filter((keyword) => text.includes(normalize(keyword))).length,
      matchedKeywords: rule.keywords.filter((keyword) => text.includes(normalize(keyword))),
    }))
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const detectedSkillIds = unique(matches.slice(0, 3).map((row) => row.skillId));
  const confidence = detectedSkillIds.length ? Math.min(0.85, 0.25 + matches[0].hits * 0.2) : 0;
  const misconceptionResult = detectMisconceptions({
    questionText: question.questionText || '',
    studentAnswer: question.studentAnswer || question.teacherMark || '',
    teacherMarkedCorrect: question.teacherMarkedCorrect,
  });

  return {
    detectedSkillIds,
    confidence,
    reasons: matches.slice(0, 3).map((row) => `Matched ${row.matchedKeywords.join(', ')} for ${row.skillId}.`),
    suggestedMisconceptions: unique([
      ...matches.slice(0, 3).map((row) => row.misconception),
      ...(misconceptionResult.misconceptionTags || []),
    ]),
    misconceptionConfidence: misconceptionResult.confidence,
    misconceptionEvidence: misconceptionResult.misconceptionEvidence || [],
    source: detectedSkillIds.length ? 'keyword_mapping' : 'unmapped',
    skillMappingConfidence: confidence,
    needsAdultReview: confidence < 0.85,
  };
}

const AI_MAPPING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['detectedSkillIds', 'confidence', 'reasons', 'suggestedMisconceptions'],
  properties: {
    detectedSkillIds: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    reasons: { type: 'array', items: { type: 'string' } },
    suggestedMisconceptions: { type: 'array', items: { type: 'string' } },
  },
};

export async function mapPaperQuestionToSkillsWithAi(question = {}, options = {}) {
  const heuristic = mapPaperQuestionToSkills(question, { ...options, treatDetectedSkillIdsAsManual: options.treatDetectedSkillIdsAsManual ?? false });
  if (process.env.PAPER_ANALYSIS_AI_ENABLED !== '1' || heuristic.confidence >= 0.85) {
    return { ...heuristic, aiUsed: false };
  }
  try {
    const provider = getActiveProvider();
    const { primary } = provider.models();
    const result = await withAiConcurrency(() => provider.complete({
      model: primary,
      maxTokens: 1200,
      schema: AI_MAPPING_SCHEMA,
      system: 'Map Singapore Math decimals paper questions to Tian OS D-code skills (D001–D014). Return JSON only. Do not grade the answer.',
      messages: [{
        role: 'user',
        content: `Question: ${question.questionText || ''}\nStudent answer: ${question.studentAnswer || ''}\nTeacher mark: ${question.teacherMark || ''}`,
      }],
    }));
    const parsed = result.text ? JSON.parse(result.text) : null;
    const detectedSkillIds = unique((parsed?.detectedSkillIds || []).map((id) => String(id || '').trim().toUpperCase()));
    if (!detectedSkillIds.length) return { ...heuristic, aiUsed: false };
    const confidence = Math.max(0, Math.min(0.95, Number(parsed.confidence || 0)));
    return {
      detectedSkillIds,
      confidence,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ['AI-assisted skill mapping.'],
      suggestedMisconceptions: Array.isArray(parsed.suggestedMisconceptions) ? parsed.suggestedMisconceptions : [],
      source: 'ai_assisted_mapping',
      skillMappingConfidence: confidence,
      needsAdultReview: confidence < 0.9,
      aiUsed: true,
      fallback: heuristic,
    };
  } catch {
    return { ...heuristic, aiUsed: false, aiFallback: true };
  }
}

export function buildPaperAnalysisRecommendations(detectedQuestions = []) {
  const weakSkillIds = unique((detectedQuestions || [])
    .filter((q) => q.adultConfirmedWrong)
    .flatMap((q) => q.detectedSkillIds || []));

  return {
    weakSkillIds,
    recommendedActions: weakSkillIds.map((skillId) => ({
      type: 'assign_practice',
      skillId,
      reason: 'Confirmed wrong question mapped to this skill',
      status: 'pending_review',
    })),
  };
}

export default {
  mapPaperQuestionToSkills,
  mapPaperQuestionToSkillsWithAi,
  buildPaperAnalysisRecommendations,
};
