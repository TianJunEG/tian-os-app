import { fractionSkillGraph, getSkill } from './fractionSkillGraph.js';
import { getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';

const MODEL_DRAWING_REMEDIATION = {
  M001: 'fraction_of_whole_left',
  M002: 'fraction_of_whole_left',
  M003: 'fraction_of_whole_left',
  M004: 'fraction_of_whole_left',
  M007: 'fraction_of_remainder_subdivision',
  M008: 'fraction_of_remainder_subdivision',
  M012: 'fraction_of_remainder_subdivision',
};

const MODEL_DRAWING_SKILL_HINTS = {
  // Whole-part and visual model tasks
  F001: 'fraction_of_whole_left',
  F002: 'fraction_of_whole_left',
  F003: 'fraction_of_whole_left',
  F004: 'fraction_of_whole_left',
  F005: 'fraction_of_whole_left',
  F006: 'fraction_of_whole_left',
  F007: 'fraction_of_whole_left',
  F008: 'fraction_of_whole_left',
  F009: 'fraction_of_whole_left',
  F010: 'fraction_of_whole_left',
  F011: 'fraction_of_whole_left',
  F012: 'fraction_of_whole_left',

  // Remainder / part-of-whole-after-removal problems
  F020: 'fraction_of_remainder_subdivision',
  F023: 'fraction_of_remainder_subdivision',
  F024: 'fraction_of_remainder_subdivision',
  F025: 'fraction_of_remainder_subdivision',
};

const MODEL_DRAWING_TAG_HINTS = {
  'FRAC/ADD-WITHOUT-COMMON': 'M007',
  'FRAC/ADD-DENOMINATORS': 'M007',
  'REMAINDER': 'M008',
  'REMAINDER-REASONING': 'M008',
  'FRACTION-OF-REMAINDER': 'M008',
  'PARTITION-ERROR': 'M007',
  'DENOMINATOR-PARTITION': 'M007',
  'SHADED': 'M003',
  'SHADE': 'M003',
  'VISUAL-MODEL': 'M003',
};

function normalizeTagTokens(tag = '') {
  return String(tag || '')
    .toUpperCase()
    .replace(/[^A-Z0-9/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function inferCodeFromTagTokens(tokens = []) {
  if (!tokens.length) return '';
  const tokenSet = new Set(tokens);
  if (tokenSet.has('REMAINDER') || tokenSet.has('REMAINDERING') || tokenSet.has('REMAINING')) return 'M008';
  if (tokenSet.has('PARTITION') || tokenSet.has('PARTITIONS') || tokenSet.has('DENOMINATOR') || tokenSet.has('SUBDIVIDE')) return 'M007';
  if (tokenSet.has('SHAD') || tokenSet.has('SHADED') || tokenSet.has('SHADE') || tokenSet.has('VISUAL') || tokenSet.has('DIAGRAM') || tokenSet.has('MODEL')) return 'M003';
  return '';
}

const SKILL_IDS = new Set(fractionSkillGraph.skillIds);

const MISTAKE_TAXONOMY = {
  M001: {
    code: 'M001',
    title: 'Whole-Number Thinking',
    description: 'Student applies whole-number operations directly to fraction parts.',
    category: 'conceptual_misconception',
    severityProfile: 'major',
    remediationSkillIds: ['F010', 'F011', 'F018'],
    rootCauseSkillIds: ['F010', 'F011'],
    defaultAction: 'reteachConcept',
  },
  M002: {
    code: 'M002',
    title: 'Numerator-Only Comparison',
    description: 'Student compares numerators without denominator meaning.',
    category: 'conceptual_misconception',
    severityProfile: 'major',
    remediationSkillIds: ['F006', 'F007', 'F008'],
    rootCauseSkillIds: ['F006', 'F007'],
    defaultAction: 'assignRemediationPractice',
  },
  M003: {
    code: 'M003',
    title: 'Denominator Confusion',
    description: 'Student misinterprets denominator size and fraction value.',
    category: 'conceptual_misconception',
    severityProfile: 'critical',
    remediationSkillIds: ['F002', 'F003', 'F004'],
    rootCauseSkillIds: ['F002', 'F003'],
    defaultAction: 'reteachConcept',
  },
  M004: {
    code: 'M004',
    title: 'Equivalent Fraction Weakness',
    description: 'Student struggles to build equivalent fractions multiplicatively.',
    category: 'knowledge_gap',
    severityProfile: 'major',
    remediationSkillIds: ['F010', 'F011'],
    rootCauseSkillIds: ['F010'],
    defaultAction: 'assignRemediationPractice',
  },
  M005: {
    code: 'M005',
    title: 'Simplification Error',
    description: 'Student makes errors reducing fractions to lowest terms.',
    category: 'procedure_error',
    severityProfile: 'moderate',
    remediationSkillIds: ['F012', 'F011'],
    rootCauseSkillIds: ['F011'],
    defaultAction: 'assignFluencyDrill',
  },
  M006: {
    code: 'M006',
    title: 'Mixed Number Conversion Error',
    description: 'Student uses incorrect conversion steps between mixed/improper forms.',
    category: 'procedure_error',
    severityProfile: 'major',
    remediationSkillIds: ['F013', 'F014', 'F015'],
    rootCauseSkillIds: ['F013', 'F014'],
    defaultAction: 'assignRemediationPractice',
  },
  M007: {
    code: 'M007',
    title: 'Common Denominator Error',
    description: 'Student chooses incorrect common denominator transformation.',
    category: 'procedure_error',
    severityProfile: 'major',
    remediationSkillIds: ['F010', 'F011', 'F018'],
    rootCauseSkillIds: ['F010', 'F011'],
    defaultAction: 'reteachConcept',
  },
  M008: {
    code: 'M008',
    title: 'Operation Selection Error',
    description: 'Student selects wrong operation from word-problem context.',
    category: 'question_misread',
    severityProfile: 'major',
    remediationSkillIds: ['F020', 'F023', 'F024'],
    rootCauseSkillIds: ['F020', 'F023'],
    defaultAction: 'assignRemediationPractice',
  },
  M009: {
    code: 'M009',
    title: 'Multiplication/Division Procedure Error',
    description: 'Student applies multiplication/division fraction procedure incorrectly.',
    category: 'procedure_error',
    severityProfile: 'major',
    remediationSkillIds: ['F021', 'F022'],
    rootCauseSkillIds: ['F021'],
    defaultAction: 'reteachConcept',
  },
  M010: {
    code: 'M010',
    title: 'Careless Arithmetic Error',
    description: 'Student uses mostly correct method but makes arithmetic slips.',
    category: 'careless_error',
    severityProfile: 'minor',
    remediationSkillIds: [],
    rootCauseSkillIds: [],
    defaultAction: 'advanceIfCarelessOnly',
  },
  M011: {
    code: 'M011',
    title: 'Fraction-Decimal-Percentage Conversion Error',
    description: 'Student converts between fraction, decimal, and percentage incorrectly.',
    category: 'knowledge_gap',
    severityProfile: 'major',
    remediationSkillIds: ['F010', 'F021', 'F025'],
    rootCauseSkillIds: ['F010', 'F025'],
    defaultAction: 'assignRemediationPractice',
  },
  M012: {
    code: 'M012',
    title: 'Ratio with Fraction/Decimal Error',
    description: 'Student sets up or simplifies ratios with fractions/decimals incorrectly.',
    category: 'exam_technique_error',
    severityProfile: 'major',
    remediationSkillIds: ['F017', 'F018', 'F023'],
    rootCauseSkillIds: ['F023'],
    defaultAction: 'assignRemediationPractice',
  },
  M013: {
    code: 'M013',
    title: 'Algebraic Fraction Notation Misread',
    description: 'Student misinterprets notation such as a/b, a ÷ b, or (3+y)/5.',
    category: 'question_misread',
    severityProfile: 'major',
    remediationSkillIds: ['F010', 'F026'],
    rootCauseSkillIds: ['F026'],
    defaultAction: 'reteachConcept',
  },
};

export const MISTAKE_CATEGORIES = {
  knowledge_gap: 'Knowledge Gap',
  conceptual_misconception: 'Conceptual Misconception',
  procedure_error: 'Procedure Error',
  careless_error: 'Careless Error',
  question_misread: 'Question Misread',
  confidence_error: 'Confidence Error',
  fluency_deficit: 'Fluency Deficit',
  exam_technique_error: 'Exam Technique Error',
  working_evidence_deficit: 'Working Evidence Deficit',
};

export const MISTAKE_SEVERITY_LEVELS = {
  minor: { rank: 1, label: 'Minor', actionThreshold: 'self_correction' },
  moderate: { rank: 2, label: 'Moderate', actionThreshold: 'targeted_practice' },
  major: { rank: 3, label: 'Major', actionThreshold: 'reteach_and_practice' },
  critical: { rank: 4, label: 'Critical', actionThreshold: 'adult_review_required' },
};

export const INTERVENTION_LIBRARY = {
  concept_explanation: {
    intervention_id: 'concept_explanation',
    label: 'Concept explanation',
    purpose: 'Repair the idea behind the mistake before more practice.',
  },
  worked_example: {
    intervention_id: 'worked_example',
    label: 'Worked example',
    purpose: 'Show the method step by step using Singapore-style fraction language.',
  },
  visual_model: {
    intervention_id: 'visual_model',
    label: 'Visual model',
    purpose: 'Use a fraction bar or model drawing to make the quantities visible.',
  },
  guided_practice: {
    intervention_id: 'guided_practice',
    label: 'Guided practice',
    purpose: 'Ask scaffolded questions with immediate checks.',
  },
  scaffolded_questions: {
    intervention_id: 'scaffolded_questions',
    label: 'Scaffolded questions',
    purpose: 'Break the skill into smaller prerequisite moves.',
  },
  fluency_drill: {
    intervention_id: 'fluency_drill',
    label: 'Fluency drill',
    purpose: 'Build speed and consistency after the concept is understood.',
  },
  worksheet: {
    intervention_id: 'worksheet',
    label: 'Targeted worksheet',
    purpose: 'Give printable or assignable consolidation with working space.',
  },
  video_placeholder: {
    intervention_id: 'video_placeholder',
    label: 'Video placeholder',
    purpose: 'Reserve a future short teaching clip for this misconception.',
  },
  teacher_tutor_flag: {
    intervention_id: 'teacher_tutor_flag',
    label: 'Teacher/tutor flag',
    purpose: 'Surface repeated or severe mistakes for adult review.',
  },
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseFraction(raw) {
  const m = String(raw || '').trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  const d = Number(m[2]);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  return { n, d };
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function resolveModelDrawingTemplateId(mistakeCode, skillId = '') {
  const code = normalizeCode(mistakeCode);
  if (MODEL_DRAWING_REMEDIATION[code]) return MODEL_DRAWING_REMEDIATION[code];

  const normalizedSkillId = String(skillId || '').toUpperCase();
  if (MODEL_DRAWING_SKILL_HINTS[normalizedSkillId]) {
    return MODEL_DRAWING_SKILL_HINTS[normalizedSkillId];
  }

  return 'fraction_of_whole_left';
}

function resolveMistakeCodeForModelDrawing({ mistakeCode = '', skillId = '', misconceptionTag = '' }) {
  const normalized = normalizeCode(mistakeCode);
  if (MISTAKE_TAXONOMY[normalized]) return normalized;

  const normalizedTag = normalizeCode(misconceptionTag);
  if (MODEL_DRAWING_TAG_HINTS[normalizedTag]) return MODEL_DRAWING_TAG_HINTS[normalizedTag];
  const inferredFromTokens = inferCodeFromTagTokens(normalizeTagTokens(mistakeCode));
  if (inferredFromTokens) return inferredFromTokens;
  const inferredFromMisconception = inferCodeFromTagTokens(normalizeTagTokens(normalizedTag));
  if (inferredFromMisconception) return inferredFromMisconception;

  const normalizedSkillId = String(skillId || '').toUpperCase();
  if (MODEL_DRAWING_SKILL_HINTS[normalizedSkillId]) {
    if (['F020', 'F023', 'F024', 'F025'].includes(normalizedSkillId)) {
      return 'M008';
    }
    return 'M001';
  }

  return '';
}

function fractionEqual(a, b) {
  return a && b && a.n * b.d === b.n * a.d;
}

function normalizeConfidence(confidence) {
  const raw = String(confidence || '').toLowerCase();
  if (raw.includes('very')) return 1;
  if (raw.includes('confident')) return 0.9;
  if (raw.includes('unsure')) return 0.75;
  if (raw.includes('guess')) return 0.55;
  const n = toNumber(confidence, 0.8);
  if (n >= 4) return 1;
  if (n >= 3) return 0.9;
  if (n >= 2) return 0.75;
  return 0.55;
}

function hasWorkingFlag(workingAnalysisResult = {}, flagType) {
  return (workingAnalysisResult?.calculatorIntegrityFlags || []).some((f) => f.flagType === flagType);
}

function inferMistakeByRules(input = {}) {
  const {
    skillId,
    questionFamilyId,
    studentAnswer,
    correctAnswer,
    promptOperands = null,
  } = input;

  const sFrac = parseFraction(studentAnswer);
  const cFrac = parseFraction(correctAnswer);
  const ops = Array.isArray(promptOperands) ? promptOperands.map(parseFraction) : [];

  if (skillId === 'F018' && ops.length >= 2 && sFrac) {
    const [a, b] = ops;
    if (a && b && sFrac.n === a.n + b.n && sFrac.d === a.d + b.d) {
      return { code: 'M001', evidence: 'Student added numerator and denominator separately.' };
    }
  }

  if (skillId === 'F015' && ops.length >= 2 && sFrac) {
    const [a, b] = ops;
    if (a && b && sFrac.n === a.n + b.n && sFrac.d === a.d + b.d) {
      return { code: 'M007', evidence: 'Student added denominators in a like-denominator addition item.' };
    }
  }

  if (skillId === 'F019' && ops.length >= 2 && sFrac) {
    const [a, b] = ops;
    if (a && b && sFrac.d === a.d * b.d && sFrac.n === a.n - b.n) {
      return { code: 'M007', evidence: 'Student attempted denominator strategy inconsistently.' };
    }
  }

  if (['F006', 'F007', 'F008', 'F009'].includes(skillId) && ops.length >= 2 && sFrac && !fractionEqual(sFrac, cFrac)) {
    const [a, b] = ops;
    if (a && b && ((a.n > b.n && sFrac.n === a.n) || (b.n > a.n && sFrac.n === b.n))) {
      return { code: 'M002', evidence: 'Response appears driven by numerator-only comparison.' };
    }
  }

  if (['F010', 'F011'].includes(skillId) && sFrac && cFrac && !fractionEqual(sFrac, cFrac)) {
    return { code: 'M004', evidence: 'Equivalent-fraction relationship appears weak.' };
  }

  if (skillId === 'F011' && sFrac && cFrac && !fractionEqual(sFrac, cFrac)) {
    return { code: 'M003', evidence: 'Same-denominator comparison appears inconsistent with numerator reasoning.' };
  }

  if (skillId === 'F012' && sFrac && cFrac && !fractionEqual(sFrac, cFrac)) {
    return { code: 'M002', evidence: 'Same-numerator comparison appears to ignore denominator size.' };
  }

  if (['F013', 'F014', 'F015'].includes(skillId)) {
    return { code: 'M006', evidence: 'Mixed/improper conversion procedure likely incorrect.' };
  }

  if (skillId === 'F001') {
    return { code: 'M003', evidence: 'Part-whole recognition appears weak (equal partition concept not secure).' };
  }

  if (skillId === 'F002') {
    return { code: 'M003', evidence: 'Numerator/denominator meaning appears confused.' };
  }

  if (['F020', 'F023', 'F024'].includes(skillId)) {
    return { code: 'M008', evidence: 'Operation choice in application context may be incorrect.' };
  }

  if (['F021', 'F022'].includes(skillId)) {
    return { code: 'M009', evidence: 'Multiplication/division fraction procedure likely incorrect.' };
  }

  if (skillId === 'F025') {
    return { code: 'M011', evidence: 'Conversion between percentage, fraction, and decimal appears incorrect.' };
  }

  if (skillId === 'F023') {
    return { code: 'M012', evidence: 'Fraction-of-quantity or ratio setup appears inconsistent.' };
  }

  if (skillId === 'F026') {
    return { code: 'M013', evidence: 'Algebraic fraction notation interpretation appears incorrect.' };
  }

  if (questionFamilyId && skillId && studentAnswer && correctAnswer && String(studentAnswer) !== String(correctAnswer)) {
    return { code: 'M010', evidence: 'Likely arithmetic or attention error with partial method success.' };
  }

  return { code: 'M010', evidence: 'No clear misconception signature from rule-based checks.' };
}

function severityFromContext({ mistakeCode, attemptHistory = [], assessmentMode = false, remediationSkillIds = [] }) {
  const sameMistakes = (attemptHistory || []).filter((a) => a.suspectedMistakeCode === mistakeCode).length;
  const prerequisiteSensitive = remediationSkillIds.some((id) => ['F002', 'F003', 'F004', 'F010', 'F011'].includes(id));
  if (assessmentMode || sameMistakes >= 3 || prerequisiteSensitive) return 'high';
  if (sameMistakes >= 2) return 'medium';
  return 'low';
}

function severityLevelFromContext({ legacySeverity, taxonomy, attemptHistory = [], workingAnalysisResult = {}, timeTaken = null }) {
  const base = taxonomy?.severityProfile || 'moderate';
  let rank = MISTAKE_SEVERITY_LEVELS[base]?.rank || 2;
  if (legacySeverity === 'high') rank += 1;
  if ((attemptHistory || []).filter((a) => a.suspectedMistakeCode === taxonomy?.code || a.mistakeCode === taxonomy?.code).length >= 3) rank += 1;
  if (hasWorkingFlag(workingAnalysisResult, 'missingWorking') || hasWorkingFlag(workingAnalysisResult, 'unreadableWorking')) rank += 1;
  if (Number.isFinite(Number(timeTaken)) && Number(timeTaken) > 120) rank += 0.5;
  if (taxonomy?.code === 'M010' && legacySeverity !== 'high') rank = Math.min(rank, 2);
  if (rank >= 4) return 'critical';
  if (rank >= 3) return 'major';
  if (rank >= 2) return 'moderate';
  return 'minor';
}

function confidenceFromContext({ base = 0.75, confidence, workingAnalysisResult }) {
  let score = base * normalizeConfidence(confidence);
  if (hasWorkingFlag(workingAnalysisResult, 'missingWorking')) score *= 0.75;
  if (hasWorkingFlag(workingAnalysisResult, 'unreadableWorking')) score *= 0.7;
  return Math.max(0.2, Math.min(0.98, Math.round(score * 100) / 100));
}

function recommendedActionFor({ mistakeCode, severity, workingAnalysisResult }) {
  if (hasWorkingFlag(workingAnalysisResult, 'unreadableWorking')) return 'requireWorkingReview';
  if (severity === 'high') return 'scheduleTutorReview';
  const tax = MISTAKE_TAXONOMY[mistakeCode];
  return tax?.defaultAction || 'assignRemediationPractice';
}

function interventionIdsForMistake({ mistakeCode, severityLevel = 'moderate', category = '' }) {
  const code = normalizeCode(mistakeCode);
  const base = ['concept_explanation', 'worked_example'];
  if (MODEL_DRAWING_REMEDIATION[code] || ['conceptual_misconception', 'question_misread'].includes(category)) {
    base.push('visual_model');
  }
  if (category === 'procedure_error') base.push('scaffolded_questions');
  base.push('guided_practice');
  if (category === 'fluency_deficit' || code === 'M005' || code === 'M010') base.push('fluency_drill');
  base.push('worksheet');
  if (['major', 'critical'].includes(severityLevel)) base.push('teacher_tutor_flag');
  base.push('video_placeholder');
  return [...new Set(base)];
}

export function buildMistakeHistory(attemptHistory = [], mistakeCode = '') {
  const code = normalizeCode(mistakeCode);
  const matches = (attemptHistory || []).filter((attempt) => normalizeCode(attempt.suspectedMistakeCode || attempt.mistakeCode) === code);
  const dates = matches
    .map((attempt) => new Date(attempt.timestamp || attempt.occurredAt || attempt.createdAt || Date.now()))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const lastIndex = [...(attemptHistory || [])].reverse().findIndex((attempt) => normalizeCode(attempt.suspectedMistakeCode || attempt.mistakeCode) === code);
  const recentWindow = (attemptHistory || []).slice(-5);
  const earlierWindow = (attemptHistory || []).slice(-10, -5);
  const recentCount = recentWindow.filter((attempt) => normalizeCode(attempt.suspectedMistakeCode || attempt.mistakeCode) === code).length;
  const earlierCount = earlierWindow.filter((attempt) => normalizeCode(attempt.suspectedMistakeCode || attempt.mistakeCode) === code).length;
  const trend = recentCount === 0 && matches.length > 0
    ? 'improving'
    : recentCount > earlierCount
      ? 'worsening'
      : recentCount === earlierCount && recentCount > 0
        ? 'stable'
        : 'insufficient_evidence';

  return {
    mistakeId: code,
    firstOccurrence: dates[0]?.toISOString() || null,
    mostRecent: dates[dates.length - 1]?.toISOString() || null,
    frequency: matches.length,
    attemptsSinceOccurrence: lastIndex >= 0 ? lastIndex : null,
    trend,
    resolved: matches.length > 0 && recentCount === 0,
  };
}

export function buildWorksheetMappingForMistake(mistakeCode, options = {}) {
  const code = normalizeCode(mistakeCode) || 'M010';
  const tax = MISTAKE_TAXONOMY[code] || MISTAKE_TAXONOMY.M010;
  const skillIds = [...new Set([...(tax.rootCauseSkillIds || []), ...(tax.remediationSkillIds || []), options.skillId].filter(Boolean))]
    .filter((skillId) => SKILL_IDS.has(skillId));
  const questionFamilyIds = skillIds.flatMap((skillId) =>
    getQuestionFamiliesBySkill(skillId).slice(0, 3).map((family) => family.id)
  );

  return {
    worksheet_id: `WS_FRA_${code}`,
    mistakeCode: code,
    skillFocus: skillIds,
    questionFamilyIds: [...new Set(questionFamilyIds)],
    difficultyProgression: ['supported', 'guided', 'independent'],
    workingSpace: true,
    workingCodePrefix: `MP-FRA-${code}`,
    answerKeyIncluded: true,
    misconceptionCheck: tax.title,
  };
}

export function buildReassessmentPlan(mistakeCode, options = {}) {
  const code = normalizeCode(mistakeCode) || 'M010';
  const tax = MISTAKE_TAXONOMY[code] || MISTAKE_TAXONOMY.M010;
  const skillIds = [...new Set([...(tax.remediationSkillIds || []), options.skillId].filter(Boolean))]
    .filter((skillId) => SKILL_IDS.has(skillId));
  const excludedQuestionIds = new Set(options.previousQuestionIds || []);
  const questionFamilyIds = skillIds.flatMap((skillId) =>
    getQuestionFamiliesBySkill(skillId)
      .filter((family) => !excludedQuestionIds.has(family.id))
      .slice(0, 2)
      .map((family) => family.id)
  );

  return {
    reassessment_id: `RA_FRA_${code}`,
    mistakeCode: code,
    skillIds,
    questionFamilyIds: [...new Set(questionFamilyIds)],
    differentQuestionRequired: true,
    sameSkillAndMisconceptionRequired: true,
    successCriteria: {
      accuracy: 0.8,
      consistencyWindow: 3,
      confidenceAligned: true,
      workingEvidenceRequired: ['major', 'critical'].includes(options.severityLevel),
    },
  };
}

export function buildInterventionPathway(mistakeCode, options = {}) {
  const code = normalizeCode(mistakeCode) || 'M010';
  const tax = MISTAKE_TAXONOMY[code] || MISTAKE_TAXONOMY.M010;
  const category = options.category || tax.category;
  const severityLevel = options.severityLevel || tax.severityProfile || 'moderate';
  const interventionIds = interventionIdsForMistake({ mistakeCode: code, severityLevel, category });
  const modelTemplateId = resolveModelDrawingTemplateId(code, options.skillId || '');

  return {
    pathway_id: `PATH_FRA_${code}_${severityLevel}`,
    mistakeCode: code,
    category,
    severityLevel,
    sequence: interventionIds.map((id, index) => ({
      order: index + 1,
      ...INTERVENTION_LIBRARY[id],
      required: !['video_placeholder', 'teacher_tutor_flag'].includes(id),
      template_id: id === 'visual_model' ? modelTemplateId : undefined,
    })),
  };
}

export function validateMistakeMastery(options = {}) {
  const attempts = Array.isArray(options.attempts) ? options.attempts : [];
  const total = attempts.length;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const accuracy = total ? correct / total : 0;
  const recent = attempts.slice(-3);
  const recentAllCorrect = recent.length >= 3 && recent.every((attempt) => attempt.correct);
  const workingEvidenceRate = toNumber(options.workingEvidenceRate, total ? attempts.filter((a) => a.workingUploaded).length / total : 0);
  const confidenceAlignedRate = toNumber(options.confidenceAlignedRate, 0);
  const fluencyRate = toNumber(options.fluencyRate, 0);
  const consistency = total ? attempts.slice(-5).filter((attempt) => attempt.correct).length / Math.min(5, total) : 0;

  let masteryState = 'not_started';
  if (total > 0) masteryState = 'emerging';
  if (accuracy >= 0.5 && consistency >= 0.5) masteryState = 'developing';
  if (accuracy >= 0.75 && recentAllCorrect && workingEvidenceRate >= 0.5) masteryState = 'secure';
  if (accuracy >= 0.85 && recentAllCorrect && confidenceAlignedRate >= 0.6) masteryState = 'mastered';
  if (options.retentionPassed === true && masteryState === 'mastered') masteryState = 'retained';

  return {
    masteryState,
    accuracy,
    consistency,
    workingEvidenceRate,
    confidenceAlignedRate,
    fluencyRate,
    fluencyUsedAsSupportingSignal: true,
    timingDoesNotDetermineMasteryAlone: true,
  };
}

export function buildRetentionSchedule(options = {}) {
  const masteredAt = new Date(options.masteredAt || Date.now());
  return [1, 7, 30, 90].map((days) => ({
    intervalDays: days,
    dueAt: new Date(masteredAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  }));
}

export function buildAutomaticNextActions(options = {}) {
  const { focusMistakes = [], masteryValidation = null } = options;
  const top = focusMistakes[0];
  if (!top) return [{ action: 'continue_current_path', label: 'Continue learning path', priority: 50 }];
  if (top.highestSeverityLevel === 'critical') return [{ action: 'flag_teacher_tutor', label: 'Ask a teacher or tutor to review this pattern', priority: 100 }];
  if (masteryValidation?.masteryState === 'mastered') return [{ action: 'schedule_retention', label: 'Schedule retention check', priority: 85 }];
  return [
    { action: 'start_intervention_pathway', label: 'Start targeted remediation', mistakeCode: top.mistakeCode, priority: 95 },
    { action: 'assign_targeted_worksheet', label: 'Assign targeted worksheet', mistakeCode: top.mistakeCode, priority: 80 },
  ];
}

export function buildMistakeAuditTrail(events = []) {
  return events.map((event, index) => ({
    audit_id: event.audit_id || `AUDIT_${String(index + 1).padStart(3, '0')}`,
    timestamp: event.timestamp || new Date().toISOString(),
    actor: event.actor || 'system',
    event_type: event.event_type || event.type || 'mistake_event',
    detail: event.detail || '',
  }));
}

export function getFractionMistakeTaxonomy() {
  return Object.values(MISTAKE_TAXONOMY).map((t) => ({ ...t }));
}

export function classifyFractionMistake(options = {}) {
  const {
    skillId,
    questionFamilyId,
    studentAnswer,
    correctAnswer,
    workingAnalysisResult = {},
    timeTaken = null,
    confidence = null,
    attemptHistory = [],
    assessmentMode = false,
    promptOperands = null,
  } = options;

  const inferred = inferMistakeByRules({
    skillId,
    questionFamilyId,
    studentAnswer,
    correctAnswer,
    promptOperands,
  });
  const taxonomy = MISTAKE_TAXONOMY[inferred.code] || MISTAKE_TAXONOMY.M010;
  const severity = severityFromContext({
    mistakeCode: inferred.code,
    attemptHistory,
    assessmentMode,
    remediationSkillIds: taxonomy.remediationSkillIds,
  });
  const severityLevel = severityLevelFromContext({
    legacySeverity: severity,
    taxonomy,
    attemptHistory,
    workingAnalysisResult,
    timeTaken,
  });
  const confidenceScore = confidenceFromContext({
    base: inferred.code === 'M010' ? 0.6 : 0.82,
    confidence,
    workingAnalysisResult,
  });
  const recommendedAction = recommendedActionFor({
    mistakeCode: inferred.code,
    severity,
    workingAnalysisResult,
  });
  const mistakeHistory = buildMistakeHistory(attemptHistory, inferred.code);
  const interventionPathway = buildInterventionPathway(inferred.code, {
    category: taxonomy.category,
    severityLevel,
    skillId,
  });
  const worksheetMapping = buildWorksheetMappingForMistake(inferred.code, { skillId });
  const reassessmentPlan = buildReassessmentPlan(inferred.code, {
    skillId,
    severityLevel,
    previousQuestionIds: [questionFamilyId].filter(Boolean),
  });

  return {
    mistakeId: inferred.code,
    suspectedMistakeCode: inferred.code,
    mistakeCategory: taxonomy.category,
    categoryLabel: MISTAKE_CATEGORIES[taxonomy.category],
    confidenceScore,
    evidence: inferred.evidence,
    severity,
    severityLevel,
    severityLabel: MISTAKE_SEVERITY_LEVELS[severityLevel]?.label || 'Moderate',
    rootCauseSkillIds: [...taxonomy.rootCauseSkillIds],
    remediationSkillIds: [...taxonomy.remediationSkillIds],
    skillMapping: [...new Set([skillId, ...taxonomy.remediationSkillIds].filter(Boolean))],
    rootCauseMapping: [...taxonomy.rootCauseSkillIds],
    mistakeHistory,
    interventionPathway,
    worksheetMapping,
    reassessmentPlan,
    recommendedAction,
    nextAction: interventionPathway.sequence[0]?.intervention_id || recommendedAction,
    auditEvent: {
      event_type: 'mistake_classified',
      mistakeCode: inferred.code,
      severityLevel,
      category: taxonomy.category,
      timestamp: new Date().toISOString(),
    },
    notes: timeTaken !== null ? [`Observed timeTaken=${toNumber(timeTaken)}s`] : [],
  };
}

export function getRemediationForMistake(mistakeCode, options = {}) {
  const resolvedCode = resolveMistakeCodeForModelDrawing({
    mistakeCode,
    skillId: options.skillId,
    misconceptionTag: options.misconceptionTag,
  });
  const taxCode = resolvedCode || 'M010';
  const tax = MISTAKE_TAXONOMY[taxCode] || MISTAKE_TAXONOMY.M010;
  const recommendedQuestionFamilyIds = tax.remediationSkillIds.flatMap((skillId) =>
    getQuestionFamiliesBySkill(skillId).slice(0, 2).map((f) => f.id)
  );
  const modelTemplateId = resolvedCode ? resolveModelDrawingTemplateId(resolvedCode, options.skillId || '') : null;
  const modelDrawingTrainer = modelTemplateId ? {
    type: 'model_drawing_trainer',
    label: resolvedCode === 'M008' || resolvedCode === 'M012' || resolvedCode === 'M007'
      ? 'Practise with model drawing for fraction remainder questions.'
      : 'Practise with model drawing for part-whole questions.',
    template_id: modelTemplateId,
    href: `/student/mathpath/fractions/model-trainer/${modelTemplateId}`,
  } : null;
  const severityLevel = options.severityLevel || tax.severityProfile || 'moderate';
  const interventionPathway = buildInterventionPathway(tax.code, {
    category: tax.category,
    severityLevel,
    skillId: options.skillId,
  });
  const worksheetMapping = buildWorksheetMappingForMistake(tax.code, options);
  const reassessmentPlan = buildReassessmentPlan(tax.code, {
    ...options,
    severityLevel,
  });

  const explanationForStudent =
    resolvedCode === 'M010'
      ? 'You are close. Let’s slow down a little and check each arithmetic step carefully.'
      : `Good effort. Let’s strengthen ${tax.title.toLowerCase()} with a few focused practice steps.`;
  const explanationForParent =
    resolvedCode === 'M001'
      ? 'Your child may be treating fractions like whole numbers. We recommend reviewing equivalent fractions before continuing unlike-denominator addition.'
      : `Your child may need support with ${tax.title.toLowerCase()}. We recommend targeted review before moving ahead.`;
  const explanationForTutor = `Focus on ${tax.title}. Suggested remediation skills: ${tax.remediationSkillIds.join(', ') || 'target skill fluency'}.`;

  return {
    mistakeCode: tax.code,
    mistakeCategory: tax.category,
    categoryLabel: MISTAKE_CATEGORIES[tax.category],
    severityLevel,
    remediationSkillIds: [...tax.remediationSkillIds],
    recommendedQuestionFamilyIds,
    modelDrawingTrainer,
    interventionPathway,
    worksheetMapping,
    reassessmentPlan,
    nextAction: interventionPathway.sequence[0]?.intervention_id || tax.defaultAction,
    explanationForStudent,
    explanationForParent,
    explanationForTutor,
  };
}

export function getModelDrawingTrainerForMistake(options = {}) {
  return getRemediationForMistake(options.mistakeCode, options).modelDrawingTrainer;
}

export function updatePracticeQueueFromMistake(practiceQueue = [], mistakeResult = {}) {
  const queue = Array.isArray(practiceQueue) ? [...practiceQueue] : [];
  const remediationSkills = mistakeResult.remediationSkillIds || [];
  const remediationItems = remediationSkills.flatMap((skillId) =>
    getQuestionFamiliesBySkill(skillId).slice(0, 1).map((f) => ({
      skillId,
      questionFamilyId: f.id,
      priority: 98,
      reason: 'mistakeRemediation',
    }))
  );

  const keyed = new Map();
  [...remediationItems, ...queue].forEach((item) => {
    if (!item?.skillId || !item?.questionFamilyId) return;
    const key = `${item.skillId}:${item.questionFamilyId}`;
    if (!keyed.has(key) || (item.priority || 0) > (keyed.get(key).priority || 0)) keyed.set(key, item);
  });

  return [...keyed.values()].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

export function buildMistakeToMasteryPlan(options = {}) {
  const {
    studentId,
    mistakeResults = [],
    currentSkillId = null,
    attemptHistory = [],
    practiceQueue = [],
  } = options;

  const grouped = mistakeResults.reduce((acc, result) => {
    const code = result.suspectedMistakeCode || 'M010';
    if (!acc[code]) acc[code] = [];
    acc[code].push(result);
    return acc;
  }, {});

  const focusMistakes = Object.entries(grouped)
    .map(([code, list]) => {
      const tax = MISTAKE_TAXONOMY[code] || MISTAKE_TAXONOMY.M010;
      const highestSeverity = list.some((x) => x.severity === 'high')
        ? 'high'
        : list.some((x) => x.severity === 'medium')
          ? 'medium'
          : 'low';
      const highestSeverityLevel = list
        .map((x) => x.severityLevel || tax.severityProfile || 'moderate')
        .sort((a, b) => (MISTAKE_SEVERITY_LEVELS[b]?.rank || 0) - (MISTAKE_SEVERITY_LEVELS[a]?.rank || 0))[0];
      return {
        mistakeCode: code,
        category: tax.category,
        categoryLabel: MISTAKE_CATEGORIES[tax.category],
        count: list.length,
        highestSeverity,
        highestSeverityLevel,
        history: buildMistakeHistory(attemptHistory, code),
      };
    })
    .sort((a, b) => {
      const sev = { high: 3, medium: 2, low: 1 };
      return (sev[b.highestSeverity] - sev[a.highestSeverity]) || b.count - a.count;
    });

  const rootCauseSkillIds = [
    ...new Set(mistakeResults.flatMap((r) => r.rootCauseSkillIds || [])),
  ].filter((id) => SKILL_IDS.has(id));
  const remediationQueue = mistakeResults.reduce((queue, result) => updatePracticeQueueFromMistake(queue, result), practiceQueue);
  const interventionPathways = focusMistakes.map((mistake) => buildInterventionPathway(mistake.mistakeCode, {
    severityLevel: mistake.highestSeverityLevel,
    category: mistake.category,
    skillId: currentSkillId,
  }));
  const worksheetMappings = focusMistakes.map((mistake) => buildWorksheetMappingForMistake(mistake.mistakeCode, { skillId: currentSkillId }));
  const reassessmentQueue = focusMistakes.map((mistake) => buildReassessmentPlan(mistake.mistakeCode, {
    skillId: currentSkillId,
    severityLevel: mistake.highestSeverityLevel,
  }));
  const masteryValidation = validateMistakeMastery({
    attempts: attemptHistory,
    workingEvidenceRate: attemptHistory.length ? attemptHistory.filter((a) => a.workingUploaded).length / attemptHistory.length : 0,
    confidenceAlignedRate: 0,
  });
  const retentionSchedule = ['mastered', 'retained'].includes(masteryValidation.masteryState)
    ? buildRetentionSchedule()
    : [];

  const estimatedSessions = Math.max(1, Math.ceil((remediationQueue.length || 1) / 3));

  const top = focusMistakes[0]?.mistakeCode || 'M010';
  const topInfo = MISTAKE_TAXONOMY[top];
  const parentSummary = `We identified a likely pattern around ${topInfo.title.toLowerCase()}. We will reinforce prerequisite fraction skills before continuing current-level tasks.`;
  const studentSummary = `Your next mission is to fix one key fraction pattern: ${topInfo.title}. We’ll practise this in small focused steps.`;
  const tutorSummary = `Primary focus: ${topInfo.title}. Root-cause skills: ${rootCauseSkillIds.join(', ') || 'none detected'}. Remediation queue items: ${remediationQueue.length}.`;

  return {
    planId: makeId('mistakeplan'),
    studentId,
    currentSkillId,
    focusMistakes,
    rootCauseSkillIds,
    remediationQueue,
    interventionPathways,
    worksheetMappings,
    reassessmentQueue,
    masteryValidation,
    retentionSchedule,
    nextActions: buildAutomaticNextActions({ focusMistakes, masteryValidation }),
    auditTrail: buildMistakeAuditTrail([
      { event_type: 'plan_created', detail: `${focusMistakes.length} mistake pattern(s) mapped to remediation.` },
    ]),
    estimatedSessions,
    parentSummary,
    studentSummary,
    tutorSummary,
    metadata: {
      attemptSampleSize: attemptHistory.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function validateFractionMistakeToMasteryEngine() {
  const taxonomy = getFractionMistakeTaxonomy();
  const allCodesExist = ['M001', 'M002', 'M003', 'M004', 'M005', 'M006', 'M007', 'M008', 'M009', 'M010', 'M011', 'M012', 'M013']
    .every((code) => taxonomy.some((t) => t.code === code));

  const remediationMapped = taxonomy
    .filter((t) => t.code !== 'M010')
    .every((t) => Array.isArray(t.remediationSkillIds) && t.remediationSkillIds.length > 0);

  const remediationSkillsExist = taxonomy
    .flatMap((t) => t.remediationSkillIds)
    .every((skillId) => SKILL_IDS.has(skillId));

  const repeatedHigh = classifyFractionMistake({
    skillId: 'F018',
    questionFamilyId: 'QF_F018_001',
    studentAnswer: '2/5',
    correctAnswer: '5/6',
    promptOperands: ['1/2', '1/3'],
    confidence: 'Confident',
    attemptHistory: [
      { suspectedMistakeCode: 'M001' },
      { suspectedMistakeCode: 'M001' },
      { suspectedMistakeCode: 'M001' },
    ],
  });

  const missingWorkingLowerConfidence = classifyFractionMistake({
    skillId: 'F018',
    questionFamilyId: 'QF_F018_001',
    studentAnswer: '2/5',
    correctAnswer: '5/6',
    promptOperands: ['1/2', '1/3'],
    confidence: 'Confident',
    attemptHistory: [],
    workingAnalysisResult: {
      calculatorIntegrityFlags: [{ flagType: 'missingWorking' }],
    },
  });

  const unreadableManualReview = classifyFractionMistake({
    skillId: 'F018',
    questionFamilyId: 'QF_F018_001',
    studentAnswer: '2/5',
    correctAnswer: '5/6',
    promptOperands: ['1/2', '1/3'],
    confidence: 'Confident',
    attemptHistory: [],
    workingAnalysisResult: {
      calculatorIntegrityFlags: [{ flagType: 'unreadableWorking' }],
    },
  });

  const remediation = getRemediationForMistake('M001');
  const pathway = buildInterventionPathway('M008', { skillId: 'F023', severityLevel: 'major' });
  const worksheetMapping = buildWorksheetMappingForMistake('M008', { skillId: 'F023' });
  const reassessmentPlan = buildReassessmentPlan('M008', { skillId: 'F023', previousQuestionIds: ['QF_F023_001'] });
  const masteryValidation = validateMistakeMastery({
    attempts: [
      { correct: true, workingUploaded: true },
      { correct: true, workingUploaded: true },
      { correct: true, workingUploaded: false },
    ],
    confidenceAlignedRate: 0.8,
  });
  const retentionSchedule = buildRetentionSchedule({ masteredAt: '2026-01-01T00:00:00.000Z' });
  const plan = buildMistakeToMasteryPlan({
    studentId: 'student_1',
    currentSkillId: 'F018',
    attemptHistory: [{}, {}],
    mistakeResults: [repeatedHigh, missingWorkingLowerConfidence],
    practiceQueue: [{ skillId: 'F018', questionFamilyId: 'QF_F018_002', priority: 70, reason: 'accuracyPractice' }],
  });

  const updatedQueue = updatePracticeQueueFromMistake(
    [{ skillId: 'F020', questionFamilyId: 'QF_F020_001', priority: 60, reason: 'baseline' }],
    repeatedHigh
  );

  return {
    isValid:
      allCodesExist &&
      remediationMapped &&
      remediationSkillsExist &&
      repeatedHigh.severity === 'high' &&
      ['major', 'critical'].includes(repeatedHigh.severityLevel) &&
      repeatedHigh.mistakeCategory === 'conceptual_misconception' &&
      missingWorkingLowerConfidence.confidenceScore < repeatedHigh.confidenceScore &&
      unreadableManualReview.recommendedAction === 'requireWorkingReview' &&
      pathway.sequence.some((step) => step.intervention_id === 'visual_model') &&
      worksheetMapping.workingSpace === true &&
      reassessmentPlan.differentQuestionRequired === true &&
      masteryValidation.masteryState === 'mastered' &&
      retentionSchedule.length === 4 &&
      Boolean(plan.parentSummary && plan.studentSummary && plan.tutorSummary) &&
      plan.interventionPathways.length > 0 &&
      plan.worksheetMappings.length > 0 &&
      plan.reassessmentQueue.length > 0 &&
      plan.nextActions.length > 0 &&
      updatedQueue.some((q) => repeatedHigh.remediationSkillIds.includes(q.skillId)),
    checks: {
      allCodesExist,
      remediationMapped,
      remediationSkillsExist,
      repeatedMistakeRaisesSeverity: repeatedHigh.severity === 'high',
      hasSprintSeverityLevel: ['major', 'critical'].includes(repeatedHigh.severityLevel),
      hasSprintMistakeCategory: repeatedHigh.mistakeCategory === 'conceptual_misconception',
      missingWorkingLowersConfidence: missingWorkingLowerConfidence.confidenceScore < repeatedHigh.confidenceScore,
      unreadableTriggersManualReview: unreadableManualReview.recommendedAction === 'requireWorkingReview',
      pathwayHasVisualModel: pathway.sequence.some((step) => step.intervention_id === 'visual_model'),
      worksheetHasWorkingSpace: worksheetMapping.workingSpace === true,
      reassessmentRequiresDifferentQuestion: reassessmentPlan.differentQuestionRequired === true,
      masteryValidationCanReachMastered: masteryValidation.masteryState === 'mastered',
      retentionScheduleHasFourChecks: retentionSchedule.length === 4,
      planHasAllSummaries: Boolean(plan.parentSummary && plan.studentSummary && plan.tutorSummary),
      planHasPathways: plan.interventionPathways.length > 0,
      planHasWorksheetMappings: plan.worksheetMappings.length > 0,
      planHasReassessmentQueue: plan.reassessmentQueue.length > 0,
      planHasNextActions: plan.nextActions.length > 0,
      queueUpdatedWithRemediation: updatedQueue.some((q) => repeatedHigh.remediationSkillIds.includes(q.skillId)),
    },
    sample: {
      classification: repeatedHigh,
      remediation,
      pathway,
      worksheetMapping,
      reassessmentPlan,
      masteryValidation,
      retentionSchedule,
      plan,
      updatedQueue: updatedQueue.slice(0, 4),
    },
  };
}

export const fractionMistakeToMasteryEngine = {
  getFractionMistakeTaxonomy,
  classifyFractionMistake,
  getRemediationForMistake,
  getModelDrawingTrainerForMistake,
  buildMistakeHistory,
  buildInterventionPathway,
  buildWorksheetMappingForMistake,
  buildReassessmentPlan,
  validateMistakeMastery,
  buildRetentionSchedule,
  buildAutomaticNextActions,
  buildMistakeAuditTrail,
  buildMistakeToMasteryPlan,
  updatePracticeQueueFromMistake,
  validateFractionMistakeToMasteryEngine,
};

export default fractionMistakeToMasteryEngine;
