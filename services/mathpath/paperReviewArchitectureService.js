import { fractionsKnowledgeMapV1 } from '../../frontend/src/mathpath/fractions/fractionsKnowledgeMapV1.js';
import { fractionsRemediationMapV1 } from '../../frontend/src/mathpath/fractions/fractionsRemediationMapV1.js';
import { fractionsRemediationAssetMapV1 } from '../../frontend/src/mathpath/fractions/fractionsRemediationAssetMapV1.js';
import { flattenMicroSkills, getMicroSkillById } from '../../frontend/src/mathpath/knowledge/knowledgeMapModel.js';
import { getRemediationEntryByMicroSkillId } from '../../frontend/src/mathpath/knowledge/remediationMapModel.js';
import { getRemediationAssetEntryByMicroSkillId } from '../../frontend/src/mathpath/knowledge/remediationAssetModel.js';
import { getWordMicroSkillById, getWordStructureById } from '../../frontend/src/wordpath/wordStructureModel.js';
import { wordPathKnowledgeMapV1 } from '../../frontend/src/wordpath/wordPathKnowledgeMapV1.js';

export const PAPER_REVIEW_STATUS = Object.freeze({
  UPLOADED: 'uploaded',
  EXTRACTING: 'extracting',
  NEEDS_REVIEW: 'needs_review',
  MAPPED: 'mapped',
  ANALYSED: 'analysed',
  REMEDIATION_READY: 'remediation_ready',
  FAILED: 'failed',
});

export const EXTRACTION_STAGES = Object.freeze([
  'question_number_detection',
  'question_detection',
  'answer_detection',
  'working_detection',
  'marks_detection',
  'manual_review',
]);

export const PAPER_REVIEW_EMPTY_STATES = Object.freeze({
  extractionFailed: 'We could not read this paper clearly. Please upload a clearer image or review manually.',
  lowMappingConfidence: 'Some questions need manual review before recommendations are generated.',
  workingUnavailable: 'We identified weak skills from the paper, but working was not available for method analysis.',
  tutorWorkingUnavailable: 'Upload working for deeper misconception analysis.',
});

export const PAPER_REVIEW_EVIDENCE_LEVELS = Object.freeze({
  LEVEL_1: 'LEVEL_1',
  LEVEL_2: 'LEVEL_2',
  LEVEL_3: 'LEVEL_3',
});

export const PAPER_REVIEW_CONFIDENCE_LEVELS = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
});

export const PAPER_REVIEW_QUALITY = Object.freeze({
  LEVEL_1: {
    label: 'Basic Review',
    stars: 1,
    description: 'Paper only',
  },
  LEVEL_2: {
    label: 'Enhanced Review',
    stars: 2,
    description: 'Paper + Answers',
  },
  LEVEL_3: {
    label: 'Full Review',
    stars: 3,
    description: 'Paper + Answers + Working',
  },
});

function clean(value = '') {
  return String(value || '').trim();
}

function lower(value = '') {
  return clean(value).toLowerCase();
}

function makeId(prefix = 'paper') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function derivePaperReviewEvidence(input = {}) {
  const hasQuestionPaper = input.hasQuestionPaper !== false;
  const hasMarkedPaper = Boolean(input.hasMarkedPaper);
  const hasAnswers = Boolean(input.hasAnswers || hasMarkedPaper);
  const hasWorking = Boolean(input.hasWorking || input.workingDeclaration === 'working_uploaded');
  const evidenceLevel = hasWorking && hasAnswers
    ? PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_3
    : hasAnswers
      ? PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_2
      : PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_1;
  const confidenceLevel = evidenceLevel === PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_3
    ? PAPER_REVIEW_CONFIDENCE_LEVELS.HIGH
    : evidenceLevel === PAPER_REVIEW_EVIDENCE_LEVELS.LEVEL_2
      ? PAPER_REVIEW_CONFIDENCE_LEVELS.MEDIUM
      : PAPER_REVIEW_CONFIDENCE_LEVELS.LOW;
  const reviewQuality = PAPER_REVIEW_QUALITY[evidenceLevel];
  const workingDeclaration = input.workingDeclaration || (hasWorking ? 'working_uploaded' : 'unknown');
  const evidenceLimitations = [
    !hasAnswers ? 'Student answers are unavailable, so wrong-answer analysis is limited.' : '',
    !hasWorking ? PAPER_REVIEW_EMPTY_STATES.workingUnavailable : '',
  ].filter(Boolean);

  return {
    paperId: input.paperId || '',
    evidenceLevel,
    hasQuestionPaper,
    hasMarkedPaper,
    hasAnswers,
    hasWorking,
    confidenceLevel,
    reviewQuality,
    workingDeclaration,
    evidenceLimitations,
    workingAnalysisEnabled: hasWorking,
  };
}

export function createPaperUploadRecord(input = {}) {
  const evidence = derivePaperReviewEvidence(input);
  return {
    paperId: input.paperId || makeId('paper'),
    studentId: clean(input.studentId),
    uploadedBy: clean(input.uploadedBy),
    paperType: input.paperType || 'school_test',
    level: input.level || 'P4',
    subject: input.subject || 'math',
    topicFocus: Array.isArray(input.topicFocus) ? input.topicFocus : [],
    fileUrls: Array.isArray(input.fileUrls) ? input.fileUrls : [],
    uploadedAt: input.uploadedAt || new Date(),
    status: input.status || PAPER_REVIEW_STATUS.UPLOADED,
    evidenceLevel: evidence.evidenceLevel,
    hasQuestionPaper: evidence.hasQuestionPaper,
    hasMarkedPaper: evidence.hasMarkedPaper,
    hasAnswers: evidence.hasAnswers,
    hasWorking: evidence.hasWorking,
    confidenceLevel: evidence.confidenceLevel,
    workingDeclaration: evidence.workingDeclaration,
  };
}

export function createReviewSessionFromPaper(paper = {}, input = {}) {
  const evidence = derivePaperReviewEvidence({ ...paper, ...input });
  return {
    reviewId: input.reviewId || makeId('review'),
    paperId: paper.paperId,
    studentId: paper.studentId,
    status: input.status || PAPER_REVIEW_STATUS.UPLOADED,
    evidenceLevel: evidence.evidenceLevel,
    hasQuestionPaper: evidence.hasQuestionPaper,
    hasMarkedPaper: evidence.hasMarkedPaper,
    hasAnswers: evidence.hasAnswers,
    hasWorking: evidence.hasWorking,
    confidenceLevel: evidence.confidenceLevel,
    workingDeclaration: evidence.workingDeclaration,
    reviewQuality: evidence.reviewQuality,
    evidenceLimitations: evidence.evidenceLimitations,
    workingAnalysisEnabled: evidence.workingAnalysisEnabled,
    extractedQuestions: [],
    extractedAnswers: [],
    extractedWorking: [],
    mappedSkills: [],
    mappedWordStructures: [],
    detectedMistakes: [],
    remediationPlan: [],
    createdAt: input.createdAt || new Date(),
    completedAt: null,
  };
}

const MICRO_SKILL_KEYWORDS = [
  ['fractions.p4.fraction_remainder_reasoning', ['remaining', 'remainder', 'left after', 'left']],
  ['fractions.p4.non_unit_fraction_of_quantity', ['of 20', 'of 24', 'of 28', '3/4 of', '2/3 of', 'fraction of']],
  ['fractions.p4.unit_fraction_of_quantity', ['1/2 of', '1/3 of', '1/4 of', 'half of', 'quarter of']],
  ['fractions.p4.convert_improper_to_mixed', ['improper', 'mixed number', '7/3', 'convert']],
  ['fractions.p4.convert_mixed_to_improper', ['mixed to improper', '2 1/3', 'improper fraction']],
  ['fractions.p4.add_related_denominators', ['+', 'add', 'sum', 'different denominators', 'unlike']],
  ['fractions.p4.subtract_related_denominators', ['-', 'subtract', 'difference', 'different denominators', 'unlike']],
  ['fractions.p4.generate_equivalent_fractions', ['equivalent', '= ?']],
  ['fractions.p4.simplify_to_lowest_terms', ['simplify', 'lowest terms']],
  ['fractions.p4.compare_same_numerator', ['same numerator', 'larger denominator']],
  ['fractions.p4.compare_same_denominator', ['same denominator']],
];

export function mapQuestionToMathPathSkill(question = {}) {
  const text = lower(question.questionText || question.prompt);
  const matched = MICRO_SKILL_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => text.includes(keyword))
  );
  const microSkillId = matched?.[0] || 'fractions.p4.model_one_step_word_problem';
  const microSkill = getMicroSkillById(fractionsKnowledgeMapV1, microSkillId);
  const confidenceScore = matched ? 0.82 : 0.52;
  return {
    questionNumber: clean(question.questionNumber),
    domain: 'fractions',
    topic: microSkill?.topicId || '',
    microSkill: microSkillId,
    confidenceScore,
    needsManualReview: confidenceScore < 0.65,
  };
}

const WORD_STRUCTURE_KEYWORDS = [
  ['wordpath.fraction_remainder.identify_original_removed_remainder', ['remaining', 'remainder', 'left after', 'left']],
  ['wordpath.fraction_quantity.identify_whole_fraction_unknown', ['fraction of', '3/4 of', '2/3 of', '1/4 of']],
  ['wordpath.repeated_quantity.identify_unit_group', ['each', 'every', 'packets', 'groups']],
  ['wordpath.unit_value.find_one_unit', ['each cost', 'one unit', 'per item']],
  ['wordpath.comparison.identify_difference', ['more than', 'fewer than', 'difference']],
  ['wordpath.part_whole.find_missing_part', ['total', 'altogether', 'remaining']],
  ['wordpath.before_after.identify_start_change_end', ['had', 'removed', 'after']],
  ['wordpath.transfer.track_giver_receiver', ['gave', 'transferred', 'received']],
  ['wordpath.ratio.identify_ratio_units', ['ratio']],
  ['wordpath.percentage.identify_percent_base', ['percent', '%']],
  ['wordpath.rate.identify_per_unit', ['per', 'km/h', 'per hour']],
];

export function mapQuestionToWordPathStructure(question = {}) {
  const text = lower(question.questionText || question.prompt);
  const isWordProblem = /\b(class|cards|pupils|students|ali|ben|sara|tom|remaining|left|gave|cost|ratio|percent|%)\b/.test(text);
  if (!isWordProblem) return null;
  const matched = WORD_STRUCTURE_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => text.includes(keyword))
  );
  const wordMicroSkill = matched?.[0] || 'wordpath.part_whole.identify_whole';
  const microSkill = getWordMicroSkillById(wordPathKnowledgeMapV1, wordMicroSkill);
  const structure = getWordStructureById(wordPathKnowledgeMapV1, microSkill?.structure || '');
  const confidenceScore = matched ? 0.8 : 0.5;
  return {
    questionNumber: clean(question.questionNumber),
    wordStructure: microSkill?.structure || '',
    wordMicroSkill,
    modelType: structure?.modelMethod?.modelType || '',
    confidenceScore,
    needsManualReview: confidenceScore < 0.65,
  };
}

export function createWorkingAnalysisHook(questionNumber, input = {}) {
  const hasWorking = Boolean(input.workingAvailable);
  return {
    questionNumber: clean(questionNumber),
    workingAvailable: hasWorking,
    workingImageCropUrl: hasWorking ? input.workingImageCropUrl || '' : '',
    ocrText: hasWorking ? input.ocrText || '' : '',
    methodAnalysis: hasWorking ? input.methodAnalysis || {} : {},
    missingSteps: hasWorking ? input.missingSteps || [] : [],
    calculationSlips: hasWorking ? input.calculationSlips || [] : [],
    modelMethodIssues: hasWorking ? input.modelMethodIssues || [] : [],
    extractionConfidence: hasWorking ? input.extractionConfidence ?? 0 : 0,
  };
}

export function detectMistakeForQuestion({ question = {}, answer = {}, working = {}, mappedSkill = {} }) {
  const studentAnswer = clean(answer.studentAnswer);
  const correctAnswer = clean(answer.correctAnswer);
  const answerAvailable = Boolean(studentAnswer || correctAnswer || typeof answer.answerCorrect === 'boolean');
  const answerCorrect = Boolean(answer.answerCorrect ?? (
    studentAnswer && correctAnswer && lower(studentAnswer) === lower(correctAnswer)
  ));
  if (!answerAvailable) {
    return {
      questionNumber: clean(question.questionNumber),
      studentAnswer,
      correctAnswer,
      answerCorrect: false,
      workingAvailable: Boolean(working.workingAvailable),
      likelyMistakeType: 'weak_area_from_question_only',
      likelyMisconception: '',
      evidence: ['Question mapped for weak-area review; student answer was unavailable.'],
      needsManualReview: true,
    };
  }
  if (answerCorrect) {
    return {
      questionNumber: clean(question.questionNumber),
      studentAnswer,
      correctAnswer,
      answerCorrect: true,
      workingAvailable: Boolean(working.workingAvailable),
      likelyMistakeType: '',
      likelyMisconception: '',
      evidence: [],
    };
  }

  const remediationEntry = getRemediationEntryByMicroSkillId(fractionsRemediationMapV1, mappedSkill.microSkill);
  const misconception = remediationEntry?.misconceptions?.[0] || null;
  return {
    questionNumber: clean(question.questionNumber),
    studentAnswer,
    correctAnswer,
    answerCorrect: false,
    workingAvailable: Boolean(working.workingAvailable),
    likelyMistakeType: misconception ? 'misconception_pattern' : 'manual_review_required',
    likelyMisconception: misconception?.id || '',
    evidence: [
      studentAnswer ? `Student answer: ${studentAnswer}` : '',
      working.ocrText ? `Working OCR: ${working.ocrText}` : '',
      misconception?.observableBehaviours?.[0] || '',
    ].filter(Boolean),
    needsManualReview: !misconception,
  };
}

export function routeMistakeToRemediation(mistake = {}, mappedSkill = {}) {
  const microSkillId = mappedSkill.microSkill || '';
  const microSkill = getMicroSkillById(fractionsKnowledgeMapV1, microSkillId);
  const assetEntry = getRemediationAssetEntryByMicroSkillId(fractionsRemediationAssetMapV1, microSkillId);
  const pathway = assetEntry?.misconceptionPathways?.find((item) =>
    item.misconceptionId === mistake.likelyMisconception
  ) || assetEntry?.misconceptionPathways?.[0] || null;
  const recommendedAsset = pathway?.recommendedAssetSequence?.[0]
    || assetEntry?.conceptAssets?.[0]?.id
    || '';

  return {
    questionNumber: mistake.questionNumber || mappedSkill.questionNumber || '',
    skill: microSkill?.id || microSkillId,
    misconception: mistake.likelyMisconception || pathway?.misconceptionId || '',
    recommendedAction: pathway ? 'Start with concept review, then move through guided practice.' : 'Manual review before recommendations.',
    recommendedAsset,
    estimatedMinutes: pathway ? 12 : 5,
  };
}

export function buildReviewAnalysis(session = {}) {
  const questions = session.extractedQuestions || [];
  const answers = session.extractedAnswers || [];
  const workingRows = session.extractedWorking || [];
  const evidence = derivePaperReviewEvidence(session);
  const mappedSkills = questions.map((question) => mapQuestionToMathPathSkill(question));
  const mappedWordStructures = questions
    .map((question) => mapQuestionToWordPathStructure(question))
    .filter(Boolean);

  const detectedMistakes = questions.map((question) => {
    const answer = answers.find((item) => item.questionNumber === question.questionNumber) || {};
    const working = workingRows.find((item) => item.questionNumber === question.questionNumber) || {};
    const mappedSkill = mappedSkills.find((item) => item.questionNumber === question.questionNumber) || {};
    return detectMistakeForQuestion({ question, answer, working, mappedSkill });
  }).filter((mistake) => !mistake.answerCorrect);

  const remediationPlan = detectedMistakes.map((mistake) => {
    const mappedSkill = mappedSkills.find((item) => item.questionNumber === mistake.questionNumber) || {};
    return routeMistakeToRemediation(mistake, mappedSkill);
  });

  const lowConfidence = [...mappedSkills, ...mappedWordStructures].some((item) => item.needsManualReview);
  return {
    ...session,
    status: lowConfidence ? PAPER_REVIEW_STATUS.NEEDS_REVIEW : PAPER_REVIEW_STATUS.REMEDIATION_READY,
    evidenceLevel: evidence.evidenceLevel,
    hasQuestionPaper: evidence.hasQuestionPaper,
    hasMarkedPaper: evidence.hasMarkedPaper,
    hasAnswers: evidence.hasAnswers,
    hasWorking: evidence.hasWorking,
    confidenceLevel: evidence.confidenceLevel,
    reviewQuality: evidence.reviewQuality,
    evidenceLimitations: evidence.evidenceLimitations,
    workingAnalysisEnabled: evidence.workingAnalysisEnabled,
    mappedSkills,
    mappedWordStructures,
    detectedMistakes,
    remediationPlan,
    mappingWarningMessage: lowConfidence ? PAPER_REVIEW_EMPTY_STATES.lowMappingConfidence : '',
    parentSummary: buildParentSummary({ mappedSkills, mappedWordStructures, detectedMistakes, remediationPlan, evidence }),
    tutorSummary: buildTutorSummary({ mappedSkills, mappedWordStructures, detectedMistakes, remediationPlan, workingRows, evidence }),
    completedAt: lowConfidence ? null : new Date(),
  };
}

export function buildParentSummary({ mappedSkills = [], mappedWordStructures = [], detectedMistakes = [], remediationPlan = [], evidence = derivePaperReviewEvidence({}) } = {}) {
  const wordRemainderIssue = mappedWordStructures.some((item) => item.wordStructure === 'wordpath.fraction_of_remainder');
  const strongestAreas = mappedSkills
    .filter((item) => item.confidenceScore >= 0.8)
    .slice(0, 2)
    .map((item) => getMicroSkillById(fractionsKnowledgeMapV1, item.microSkill)?.title || item.microSkill);
  const needsAttention = remediationPlan.map((item) =>
    getMicroSkillById(fractionsKnowledgeMapV1, item.skill)?.title || item.skill
  );
  return {
    reviewQuality: evidence.reviewQuality,
    confidenceLevel: evidence.confidenceLevel,
    evidenceLevel: evidence.evidenceLevel,
    evidenceLimitations: evidence.evidenceLimitations,
    overallSummary: wordRemainderIssue
      ? 'Your child understands some fraction skills but struggled with word problems involving remainders.'
      : 'Your child has completed paper review evidence. Some questions are ready for targeted follow-up.',
    strongestAreas,
    needsAttention,
    suggestedActions: remediationPlan.length
      ? ['Review the first recommended concept explanation.', 'Try one guided example before independent practice.']
      : ['Manual review may be needed before recommendations are generated.'],
    recommendedPractice: remediationPlan.slice(0, 3).map((item) => ({
      skill: item.skill,
      recommendedAction: item.recommendedAction,
      estimatedMinutes: item.estimatedMinutes,
    })),
    mistakeCount: detectedMistakes.length,
  };
}

export function buildTutorSummary({ mappedSkills = [], mappedWordStructures = [], detectedMistakes = [], remediationPlan = [], workingRows = [], evidence = derivePaperReviewEvidence({}) } = {}) {
  return {
    reviewQuality: evidence.reviewQuality,
    confidenceLevel: evidence.confidenceLevel,
    evidenceLevel: evidence.evidenceLevel,
    evidenceLimitations: evidence.evidenceLimitations,
    prioritySkills: [...new Set(remediationPlan.map((item) => item.skill).filter(Boolean))],
    rootCauses: [...new Set(detectedMistakes.map((item) => item.likelyMisconception).filter(Boolean))],
    evidence: detectedMistakes.flatMap((item) => item.evidence || []),
    recommendedLessonPlan: remediationPlan.map((item) => ({
      focus: item.skill,
      misconception: item.misconception,
      action: item.recommendedAction,
      asset: item.recommendedAsset,
      minutes: item.estimatedMinutes,
    })),
    workingInsights: evidence.hasWorking
      ? workingRows.map((row) => ({
        questionNumber: row.questionNumber,
        workingAvailable: row.workingAvailable,
        ocrText: row.ocrText,
        missingSteps: row.missingSteps,
        calculationSlips: row.calculationSlips,
        modelMethodIssues: row.modelMethodIssues,
      }))
      : [],
    workingInsightMessage: evidence.hasWorking ? '' : PAPER_REVIEW_EMPTY_STATES.tutorWorkingUnavailable,
    wordPathStructures: mappedWordStructures.map((item) => ({
      questionNumber: item.questionNumber,
      wordStructure: item.wordStructure,
      wordMicroSkill: item.wordMicroSkill,
      modelType: item.modelType,
      confidenceScore: item.confidenceScore,
    })),
    mappedSkillCount: mappedSkills.length,
  };
}

export function buildExtractionFailureSession(session = {}, message = PAPER_REVIEW_EMPTY_STATES.extractionFailed) {
  return {
    ...session,
    status: PAPER_REVIEW_STATUS.FAILED,
    extractionErrorMessage: message,
    mappingWarningMessage: '',
    completedAt: null,
  };
}
