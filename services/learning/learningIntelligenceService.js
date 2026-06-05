export const LEARNING_RECOMMENDED_ACTIONS = Object.freeze({
  CONCEPT_REVIEW: 'concept_review',
  GUIDED_PRACTICE: 'guided_practice',
  MODEL_TRAINER: 'model_trainer',
  FLUENCY_DRILL: 'fluency_drill',
  WORDPATH_REVIEW: 'wordpath_review',
  TUTOR_INTERVENTION: 'tutor_intervention',
});

const SEVERITY_WEIGHT = Object.freeze({
  critical: 5,
  high: 5,
  major: 4,
  moderate: 3,
  medium: 3,
  minor: 1,
  low: 1,
  '': 2,
});

function clean(value = '') {
  return String(value || '').trim();
}

function normalizeConfidence(value = '') {
  const raw = clean(value).toLowerCase().replace(/\s+/g, '_');
  if (['high', 'very_high', 'very_confident', 'i_know_this', 'know'].includes(raw)) return 'HIGH';
  if (['low', 'not_confident', 'i_need_help', 'need_help', 'help'].includes(raw)) return 'LOW';
  if (['medium', 'unsure', 'not_sure', 'i_am_not_sure', "i'm_not_sure"].includes(raw)) return 'MEDIUM';
  return raw ? raw.toUpperCase() : '';
}

function asDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function daysAgo(value, now = new Date()) {
  const date = asDate(value);
  if (!date) return 30;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

function recencyWeight(value, now = new Date()) {
  const age = daysAgo(value, now);
  if (age <= 1) return 5;
  if (age <= 7) return 4;
  if (age <= 14) return 3;
  if (age <= 30) return 2;
  return 1;
}

function skillKey(record = {}) {
  return clean(record.microSkill || record.skillCode || record.skillId || record.skill || record.questionFamilyId || 'unknown');
}

function addEvidence(bucket, key, evidence) {
  if (!key || key === 'unknown') return;
  if (!bucket.has(key)) bucket.set(key, []);
  bucket.get(key).push(evidence);
}

function summarizeBuckets(bucket) {
  return [...bucket.entries()].map(([id, evidence]) => ({ id, evidence, count: evidence.length }));
}

export function aggregateLearningEvidence(input = {}) {
  const now = input.now || new Date();
  const strengths = new Map();
  const weaknesses = new Map();
  const misconceptions = new Map();
  const confidenceRisks = new Map();
  const workingPatterns = new Map();
  const wordPathWeaknesses = new Map();
  const fluencyWeaknesses = new Map();

  (input.diagnosticResults || []).forEach((result) => {
    const key = skillKey(result);
    const correct = Boolean(result.correct ?? result.answerCorrect);
    const confidence = normalizeConfidence(result.confidence || result.confidenceLevel);
    const evidence = {
      source: 'diagnostic',
      skill: key,
      correct,
      confidence,
      occurredAt: result.occurredAt || result.timestamp || result.completedAt || null,
      weight: recencyWeight(result.occurredAt || result.timestamp || result.completedAt, now),
    };
    if (correct) addEvidence(strengths, key, evidence);
    else addEvidence(weaknesses, key, evidence);
    if (!correct && confidence === 'HIGH') addEvidence(confidenceRisks, key, { ...evidence, risk: 'high_confidence_wrong' });
    if (result.misconceptionId || result.misconceptionTag) {
      addEvidence(misconceptions, result.misconceptionId || result.misconceptionTag, evidence);
    }
  });

  (input.practiceAttempts || []).forEach((attempt) => {
    const key = skillKey(attempt);
    const correct = Boolean(attempt.correct ?? attempt.answerCorrect);
    const confidence = normalizeConfidence(attempt.confidence || attempt.confidenceLevel);
    const noWorkingHighNeed = attempt.workingNotNeeded === true && attempt.workingRequirementLevel === 'HIGH';
    const evidence = {
      source: 'practice',
      skill: key,
      correct,
      confidence,
      workingSubmitted: Boolean(attempt.workingSubmitted || attempt.workingUploaded || attempt.fullscreenWorkingSubmitted),
      workingNotNeeded: Boolean(attempt.workingNotNeeded),
      workingRequirementLevel: attempt.workingRequirementLevel || '',
      timeSeconds: attempt.timeTakenSeconds ?? attempt.timeTaken ?? attempt.timeSpentSeconds ?? null,
      occurredAt: attempt.createdAt || attempt.timestamp || null,
      weight: recencyWeight(attempt.createdAt || attempt.timestamp, now),
    };
    if (correct) addEvidence(strengths, key, evidence);
    else addEvidence(weaknesses, key, evidence);
    if (!correct && confidence === 'HIGH') addEvidence(confidenceRisks, key, { ...evidence, risk: 'high_confidence_wrong' });
    if (noWorkingHighNeed) addEvidence(workingPatterns, key, { ...evidence, risk: 'no_working_on_high_requirement' });
  });

  (input.mistakeRecords || []).forEach((mistake) => {
    const key = skillKey(mistake);
    const misconceptionId = mistake.misconceptionTag || mistake.likelyMisconception || mistake.workingInsight?.misconceptionDetected?.id || '';
    const evidence = {
      source: 'mistake',
      skill: key,
      severity: mistake.severity || mistake.mistakeCategory || '',
      frequency: Number(mistake.frequency || 1),
      confidence: normalizeConfidence(mistake.confidence),
      occurredAt: mistake.mostRecentOccurredAt || mistake.occurredAt || mistake.timestamp || null,
      weight: recencyWeight(mistake.mostRecentOccurredAt || mistake.occurredAt || mistake.timestamp, now),
      mistakeId: mistake.mistakeId || String(mistake._id || ''),
    };
    addEvidence(weaknesses, key, evidence);
    if (misconceptionId) addEvidence(misconceptions, misconceptionId, evidence);
    if (evidence.confidence === 'HIGH') addEvidence(confidenceRisks, key, { ...evidence, risk: 'high_confidence_mistake' });
  });

  (input.workingEvidence || []).forEach((working) => {
    const key = skillKey(working);
    const qualityBand = clean(working.qualityBand || working.workingQualityBand).toUpperCase();
    const issue = working.workingInsight?.detectedIssue || working.detectedIssue || working.misconceptionDetection?.title || '';
    const evidence = {
      source: 'working',
      skill: key,
      qualityBand,
      issue,
      answerCorrect: working.answerCorrect ?? null,
      occurredAt: working.submittedAt || working.createdAt || null,
      weight: recencyWeight(working.submittedAt || working.createdAt, now),
    };
    if (['PARTIAL', 'INSUFFICIENT'].includes(qualityBand) || issue) addEvidence(workingPatterns, key, evidence);
    if (working.misconceptionDetection?.id) addEvidence(misconceptions, working.misconceptionDetection.id, evidence);
  });

  (input.fluencyRecords || []).forEach((record) => {
    const key = skillKey(record);
    const notFluent = record.fluencyStatus === 'not_fluent'
      || Number(record.fluencyScore || 0) < 70
      || Number(record.accuracy || 0) < 85;
    const evidence = {
      source: 'fluency',
      skill: key,
      fluencyStatus: record.fluencyStatus || '',
      fluencyScore: Number(record.fluencyScore || 0),
      accuracy: Number(record.accuracy || 0),
      averageTimeSeconds: record.averageTimeSeconds ?? null,
      occurredAt: record.updatedAt || record.becameFluentAt || null,
      weight: recencyWeight(record.updatedAt || record.becameFluentAt, now),
    };
    if (notFluent) addEvidence(fluencyWeaknesses, key, evidence);
    else addEvidence(strengths, key, evidence);
  });

  (input.paperReviews || []).forEach((review) => {
    (review.remediationPlan || []).forEach((plan) => {
      const key = skillKey(plan);
      addEvidence(weaknesses, key, {
        source: 'paper_review',
        skill: key,
        misconception: plan.misconception || '',
        recommendedAsset: plan.recommendedAsset || '',
        occurredAt: review.completedAt || review.createdAt || null,
        weight: recencyWeight(review.completedAt || review.createdAt, now),
      });
    });
    (review.mappedWordStructures || []).forEach((mapping) => {
      const key = mapping.wordMicroSkill || mapping.wordStructure;
      addEvidence(wordPathWeaknesses, key, {
        source: 'paper_review_wordpath',
        wordStructure: mapping.wordStructure,
        wordMicroSkill: mapping.wordMicroSkill,
        modelType: mapping.modelType,
        confidenceScore: mapping.confidenceScore,
        occurredAt: review.completedAt || review.createdAt || null,
        weight: recencyWeight(review.completedAt || review.createdAt, now),
      });
    });
  });

  (input.wordPathMappings || []).forEach((mapping) => {
    const key = mapping.wordMicroSkill || mapping.wordStructure;
    if (mapping.needsAttention || mapping.answerCorrect === false || mapping.confidenceScore < 0.7) {
      addEvidence(wordPathWeaknesses, key, {
        source: 'wordpath',
        wordStructure: mapping.wordStructure,
        wordMicroSkill: mapping.wordMicroSkill,
        confidenceScore: mapping.confidenceScore,
        occurredAt: mapping.occurredAt || null,
        weight: recencyWeight(mapping.occurredAt, now),
      });
    }
  });

  (input.telemetryEvents || []).forEach((event) => {
    const key = skillKey(event);
    if (event.eventType === 'working_not_needed_declared' && event.metadata?.workingRequirementLevel === 'HIGH') {
      addEvidence(workingPatterns, key, {
        source: 'telemetry',
        skill: key,
        risk: 'declared_no_working_high_requirement',
        occurredAt: event.timestamp,
        weight: recencyWeight(event.timestamp, now),
      });
    }
  });

  return {
    strengths: summarizeBuckets(strengths),
    weaknesses: summarizeBuckets(weaknesses),
    misconceptions: summarizeBuckets(misconceptions),
    confidenceRisks: summarizeBuckets(confidenceRisks),
    workingPatterns: summarizeBuckets(workingPatterns),
    wordPathWeaknesses: summarizeBuckets(wordPathWeaknesses),
    fluencyWeaknesses: summarizeBuckets(fluencyWeaknesses),
  };
}

function scoreEvidence(evidence = []) {
  return evidence.reduce((score, item) => {
    const severity = SEVERITY_WEIGHT[clean(item.severity).toLowerCase()] ?? 2;
    const frequency = Math.min(5, Number(item.frequency || 1));
    const confidenceRisk = item.risk?.includes('confidence') || item.confidence === 'HIGH' && item.correct === false ? 3 : 0;
    const workingRisk = item.risk?.includes('working') || item.qualityBand === 'INSUFFICIENT' ? 2 : 0;
    const fluencyGap = item.source === 'fluency' ? 2 : 0;
    return score + severity + frequency + Number(item.weight || 1) + confidenceRisk + workingRisk + fluencyGap;
  }, 0);
}

function evidenceForId(collection = [], id = '') {
  return collection.find((item) => item.id === id)?.evidence || [];
}

function chooseAction({ id, evidence, aggregate }) {
  const confidenceEvidence = evidenceForId(aggregate.confidenceRisks, id);
  const workingEvidence = evidenceForId(aggregate.workingPatterns, id);
  const fluencyEvidence = evidenceForId(aggregate.fluencyWeaknesses, id);
  const wordPathEvidence = evidenceForId(aggregate.wordPathWeaknesses, id);

  if (wordPathEvidence.length || id.startsWith('wordpath.')) return LEARNING_RECOMMENDED_ACTIONS.WORDPATH_REVIEW;
  if (workingEvidence.some((item) => item.qualityBand === 'INSUFFICIENT' || item.risk?.includes('working'))) {
    return LEARNING_RECOMMENDED_ACTIONS.TUTOR_INTERVENTION;
  }
  if (confidenceEvidence.length) return LEARNING_RECOMMENDED_ACTIONS.MODEL_TRAINER;
  if (fluencyEvidence.length || evidence.some((item) => item.source === 'fluency')) return LEARNING_RECOMMENDED_ACTIONS.FLUENCY_DRILL;
  if (evidence.length >= 3) return LEARNING_RECOMMENDED_ACTIONS.GUIDED_PRACTICE;
  return LEARNING_RECOMMENDED_ACTIONS.CONCEPT_REVIEW;
}

export function rankInterventionPriorities(aggregate = {}) {
  const candidateMap = new Map();
  [
    ...(aggregate.weaknesses || []),
    ...(aggregate.confidenceRisks || []),
    ...(aggregate.workingPatterns || []),
    ...(aggregate.wordPathWeaknesses || []),
    ...(aggregate.fluencyWeaknesses || []),
  ].forEach((bucket) => {
    if (!bucket?.id) return;
    if (!candidateMap.has(bucket.id)) candidateMap.set(bucket.id, []);
    candidateMap.get(bucket.id).push(...(bucket.evidence || []));
  });

  return [...candidateMap.entries()]
    .map(([id, evidence]) => ({
      id,
      recommendedAction: chooseAction({ id, evidence, aggregate }),
      priorityScore: Math.round(scoreEvidence(evidence)),
      severity: scoreEvidence(evidence) >= 28 ? 'high' : scoreEvidence(evidence) >= 14 ? 'medium' : 'low',
      supportingEvidence: evidence,
    }))
    .filter((item) => item.supportingEvidence.length)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function generateStudentLearningProfile(input = {}) {
  const studentId = clean(input.studentId);
  const aggregate = aggregateLearningEvidence(input);
  const interventionPriorities = rankInterventionPriorities(aggregate);

  return {
    studentId,
    strengths: aggregate.strengths,
    weaknesses: aggregate.weaknesses,
    misconceptions: aggregate.misconceptions,
    confidenceRisks: aggregate.confidenceRisks,
    workingPatterns: aggregate.workingPatterns,
    wordPathWeaknesses: aggregate.wordPathWeaknesses,
    fluencyWeaknesses: aggregate.fluencyWeaknesses,
    interventionPriorities,
    supportingEvidence: interventionPriorities.flatMap((priority) =>
      priority.supportingEvidence.map((evidence) => ({
        priorityId: priority.id,
        source: evidence.source,
        occurredAt: evidence.occurredAt || null,
        summary: evidence.risk || evidence.issue || evidence.misconception || evidence.fluencyStatus || evidence.skill || priority.id,
      }))
    ),
  };
}

export default {
  aggregateLearningEvidence,
  generateStudentLearningProfile,
  rankInterventionPriorities,
};
