const DOMAIN_PREFIXES = {
  fractions: 'FRAC',
  fraction: 'FRAC',
  word_problem: 'WP',
  word_problems: 'WP',
  ratio: 'RATIO',
  ratios: 'RATIO',
};

const ANALYSIS_STATUSES = ['pending_analysis', 'analysed', 'needs_review', 'failed_analysis'];

function normalizeToken(value, fallback = 'GEN') {
  const token = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return token || fallback;
}

export function getWorkingCodeDomainPrefix(domainId = '') {
  const key = String(domainId || '').trim().toLowerCase();
  return DOMAIN_PREFIXES[key] || normalizeToken(domainId, 'MP');
}

export function createWorkingCodeSuffix(length = 4) {
  const size = Math.max(3, Math.min(8, Number(length) || 4));
  return Math.random().toString(36).slice(2, 2 + size).toUpperCase().padEnd(size, 'X');
}

export function generateWorkingCode({ domainId = 'fractions', skillId = '', level = '' } = {}) {
  const prefix = getWorkingCodeDomainPrefix(domainId);
  const skillToken = normalizeToken(skillId || level, 'GEN');
  return `MP-${prefix}-${skillToken}-${createWorkingCodeSuffix(4)}`;
}

export function normalizeQuestionWorkingRef(ref = {}, defaults = {}) {
  const questionId = String(ref.questionId || ref.id || '').trim();
  const skillId = String(ref.skillId || defaults.skillId || '').trim();
  const domainId = String(ref.domainId || defaults.domainId || 'fractions').trim();
  const workingRequired = ref.workingRequired ?? ref.requiresWorking ?? defaults.workingRequired ?? true;
  const workingReason = String(ref.workingReason || defaults.workingReason || (workingRequired ? 'required' : 'optional')).trim();
  const solutionSteps = Array.isArray(ref.solutionSteps)
    ? ref.solutionSteps.map((step) => String(step || '').trim()).filter(Boolean)
    : [];
  const expectedProcedureKeywords = Array.isArray(ref.expectedProcedureKeywords)
    ? ref.expectedProcedureKeywords.map((keyword) => String(keyword || '').trim()).filter(Boolean)
    : [];
  const expectedOperations = Array.isArray(ref.expectedOperations)
    ? ref.expectedOperations.map((operation) => String(operation || '').trim()).filter(Boolean)
    : [];

  return {
    questionId,
    skillId,
    domainId,
    sessionId: String(ref.sessionId || defaults.sessionId || '').trim(),
    attemptId: String(ref.attemptId || '').trim(),
    exerciseId: String(ref.exerciseId || defaults.exerciseId || '').trim(),
    prompt: String(ref.prompt || ref.questionText || ref.stem || '').trim(),
    answerGiven: String(ref.answerGiven ?? ref.studentAnswer ?? '').trim(),
    correctAnswer: String(ref.correctAnswer ?? ref.answer ?? '').trim(),
    answerCorrect: typeof ref.answerCorrect === 'boolean' ? ref.answerCorrect : null,
    confidenceLevel: String(ref.confidenceLevel || ref.confidence || '').trim(),
    solutionSteps,
    expectedProcedureKeywords,
    expectedOperations,
    expectedStepCount: Number.isFinite(Number(ref.expectedStepCount))
      ? Number(ref.expectedStepCount)
      : solutionSteps.length || null,
    questionType: String(ref.questionType || ref.type || '').trim(),
    pageNumber: Number.isFinite(Number(ref.pageNumber)) ? Number(ref.pageNumber) : null,
    detectedLabel: String(ref.detectedLabel || '').trim(),
    mappingStatus: ref.mappingStatus || 'autoMapped',
    workingRequired: Boolean(workingRequired),
    noWorkingRequiredChecked: Boolean(ref.noWorkingRequiredChecked),
    workingReason,
    workingCode: ref.workingCode || generateWorkingCode({ domainId, skillId }),
  };
}

export function buildQuestionWorkingMap(questionRefs = [], defaults = {}) {
  const refs = Array.isArray(questionRefs) ? questionRefs : [];
  return refs
    .map((ref) => normalizeQuestionWorkingRef(ref, defaults))
    .filter((ref) => ref.questionId);
}

export function summarizeWorkingSessionForReview(session = {}) {
  const mapped = Array.isArray(session.questionWorkingMap) ? session.questionWorkingMap : [];
  const required = mapped.filter((row) => row.workingRequired);
  const submitted = Array.isArray(session.fileUrls) && session.fileUrls.length > 0;
  const missingRequired = required.length > 0 && !submitted;

  return {
    analysisStatus: missingRequired ? 'needs_review' : 'pending_analysis',
    workingRequiredCount: required.length,
    mappedQuestionCount: mapped.length,
    evidence: missingRequired
      ? ['Required working has not been uploaded yet.']
      : ['Working evidence is ready for human or AI review.'],
    recommendation: missingRequired
      ? 'Ask the student or adult helper to upload working evidence before diagnosis.'
      : 'Queue this working for method review and misconception tagging.',
  };
}

export function isValidAnalysisStatus(status) {
  return ANALYSIS_STATUSES.includes(status);
}

export { ANALYSIS_STATUSES };
