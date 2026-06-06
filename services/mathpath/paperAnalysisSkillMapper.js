const FRACTIONS_KEYWORDS = [
  { skillId: 'F006', keywords: ['equivalent fraction', 'equivalent fractions', 'same value'] },
  { skillId: 'F007', keywords: ['simplest form', 'simplify', 'lowest terms'] },
  { skillId: 'F011', keywords: ['compare', 'greater than', 'smaller than', 'less than'] },
  { skillId: 'F014', keywords: ['improper fraction', 'mixed number'] },
  { skillId: 'F015', keywords: ['add', 'sum', '+'] },
  { skillId: 'F016', keywords: ['subtract', 'difference', '-'] },
  { skillId: 'F019', keywords: ['fraction of', 'of the', 'quantity'] },
  { skillId: 'F025', keywords: ['left', 'remaining', 'gave away', 'used', 'spent'] },
  { skillId: 'F026', keywords: ['remainder', 'then', 'at first', 'multi-step', 'work backwards'] },
];

function normalize(value = '') {
  return String(value || '').toLowerCase();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function mapPaperQuestionToSkills(question = {}, { manualSkillIds = [] } = {}) {
  const suppliedManual = manualSkillIds?.length
    ? manualSkillIds
    : (question.manualSkillIds?.length ? question.manualSkillIds : question.detectedSkillIds);
  const manual = unique((suppliedManual || []).map((id) => String(id || '').trim().toUpperCase()).filter(Boolean));
  if (manual.length) {
    return {
      detectedSkillIds: manual,
      confidence: 1,
      source: 'adult_manual_override',
      needsAdultReview: false,
    };
  }

  const text = normalize(`${question.questionText || ''} ${question.studentAnswer || ''}`);
  const matches = FRACTIONS_KEYWORDS
    .map((rule) => ({
      skillId: rule.skillId,
      hits: rule.keywords.filter((keyword) => text.includes(normalize(keyword))).length,
    }))
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const detectedSkillIds = unique(matches.slice(0, 3).map((row) => row.skillId));
  const confidence = detectedSkillIds.length ? Math.min(0.85, 0.25 + matches[0].hits * 0.2) : 0;

  return {
    detectedSkillIds,
    confidence,
    source: detectedSkillIds.length ? 'keyword_mapping' : 'unmapped',
    needsAdultReview: confidence < 0.85,
  };
}

export function buildPaperAnalysisRecommendations(detectedQuestions = []) {
  const weakSkillIds = unique((detectedQuestions || [])
    .filter((q) => q.adultConfirmedWrong || q.teacherMarkedCorrect === false)
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
  buildPaperAnalysisRecommendations,
};
