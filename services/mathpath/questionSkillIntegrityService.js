const FRACTION_SKILL_PATTERN_RULES = {
  F001: {
    expectedQuestionTypes: ['visual_identification', 'equal_parts'],
    expectedRepresentations: ['area_model', 'shape_model'],
    expectedMisconceptions: ['equal_parts_missing', 'whole_number_thinking', 'M003', 'M001'],
    positive: [/recognise|identify|shaded|equal parts|partition|whole/i],
    negative: [/equivalent|simplif|mixed|improper|unlike|multiply|divide|word problem|percentage|decimal|ratio|negative|signed/i],
  },
  F002: {
    expectedQuestionTypes: ['notation_interpretation'],
    expectedRepresentations: ['symbolic_fraction', 'visual_fraction'],
    expectedMisconceptions: ['numerator_denominator_confusion', 'M003', 'M010'],
    positive: [/numerator|denominator|top|bottom|notation/i],
    negative: [/equivalent|simplif|mixed|improper|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F003: {
    expectedQuestionTypes: ['part_whole_representation'],
    expectedRepresentations: ['area_model', 'bar_model'],
    expectedMisconceptions: ['equal_parts_missing', 'M003'],
    positive: [/fraction of (a )?whole|part[- ]whole|area model|bar model|represent/i],
    negative: [/number line|equivalent|simplif|mixed|improper|operation|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F004: {
    expectedQuestionTypes: ['unit_fraction_identification', 'unit_fraction_reasoning'],
    expectedRepresentations: ['area_model', 'bar_model', 'symbolic_fraction'],
    expectedMisconceptions: ['whole_number_thinking', 'M001'],
    positive: [/unit fraction|numerator one|numerator 1|1\/\d|one part/i],
    negative: [/same numerator|same denominator|unlike|mixed|improper|operation|percentage|decimal|ratio|negative|signed/i],
  },
  F005: {
    expectedQuestionTypes: ['number_line_location'],
    expectedRepresentations: ['number_line'],
    expectedMisconceptions: ['equal_parts_missing', 'M003'],
    positive: [/number line|locate|position|0-1|0 to 1/i],
    negative: [/mixed|improper|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F006: {
    expectedQuestionTypes: ['unit_fraction_comparison'],
    expectedRepresentations: ['symbolic_fraction', 'number_line', 'visual_fraction'],
    expectedMisconceptions: ['compares_denominators_only', 'whole_number_thinking', 'M001'],
    positive: [/compare unit|order.*unit|unit fraction comparison|1\/\w/i],
    negative: [/same numerator|same denominator|unlike|mixed|improper|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F007: {
    expectedQuestionTypes: ['same_denominator_comparison'],
    expectedRepresentations: ['symbolic_fraction', 'visual_fraction'],
    expectedMisconceptions: ['compares_numerators_only', 'M003'],
    positive: [/same denominator|like[- ]denominator comparison|common denominator.*compare|compare like-denominator/i],
    negative: [/same numerator|unlike|equivalent generation|simplif|mixed|improper|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F008: {
    expectedQuestionTypes: ['same_numerator_comparison'],
    expectedRepresentations: ['symbolic_fraction', 'visual_fraction'],
    expectedMisconceptions: ['compares_denominators_only', 'M002'],
    positive: [/same numerator|compare.*numerator/i],
    negative: [/same denominator|unlike|equivalent generation|simplif|mixed|improper|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F009: {
    expectedQuestionTypes: ['fraction_ordering'],
    expectedRepresentations: ['symbolic_fraction', 'number_line'],
    expectedMisconceptions: ['whole_number_thinking', 'equivalence_scale_error', 'M004'],
    positive: [/order|ascending|descending|arrange|sort/i],
    negative: [/mixed number conversion|improper conversion|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F010: {
    expectedQuestionTypes: ['equivalent_fraction_recognition'],
    expectedRepresentations: ['symbolic_fraction', 'visual_fraction'],
    expectedMisconceptions: ['equivalence_scale_error', 'M004'],
    positive: [/recognise equivalent|equivalent fractions?|same value|match equivalent/i],
    negative: [/generate|create|missing term|simplif|mixed|improper|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F011: {
    expectedQuestionTypes: ['equivalent_fraction_generation'],
    expectedRepresentations: ['symbolic_fraction'],
    expectedMisconceptions: ['equivalence_scale_error', 'M004', 'M005'],
    positive: [/generate|create|scale|missing terms?|equivalent chain|equivalent-fraction equation/i],
    negative: [/same denominator comparison|same numerator comparison|simplif|mixed|improper|add like|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F012: {
    expectedQuestionTypes: ['fraction_simplification'],
    expectedRepresentations: ['symbolic_fraction'],
    expectedMisconceptions: ['incorrect_simplification', 'M005'],
    positive: [/simplif|lowest terms|common factor|reduce/i],
    negative: [/same numerator comparison|same denominator comparison|mixed|improper|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F013: {
    expectedQuestionTypes: ['improper_fraction_interpretation'],
    expectedRepresentations: ['symbolic_fraction', 'visual_fraction'],
    expectedMisconceptions: ['mixed_improper_conversion_error', 'M006'],
    positive: [/improper fraction|greater than one|greater than 1/i],
    negative: [/mixed number|convert|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F014: {
    expectedQuestionTypes: ['mixed_number_interpretation'],
    expectedRepresentations: ['symbolic_fraction', 'visual_fraction'],
    expectedMisconceptions: ['mixed_improper_conversion_error', 'M006'],
    positive: [/mixed number|whole number and fractional part|represent mixed/i],
    negative: [/convert.*improper|improper.*convert|add|subtract|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F015: {
    expectedQuestionTypes: ['mixed_improper_conversion'],
    expectedRepresentations: ['symbolic_fraction', 'visual_fraction'],
    expectedMisconceptions: ['mixed_improper_conversion_error', 'M006'],
    positive: [/convert|mixed to improper|improper to mixed|bidirectional/i],
    negative: [/add like|subtract|unlike|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F016: {
    expectedQuestionTypes: ['same_denominator_addition'],
    expectedRepresentations: ['symbolic_fraction', 'context'],
    expectedMisconceptions: ['adds_denominators_directly', 'M007'],
    positive: [/add.*same denominator|add.*like fractions|like-denominator addition/i],
    negative: [/subtract|unlike|common denominator.*first|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F017: {
    expectedQuestionTypes: ['same_denominator_subtraction'],
    expectedRepresentations: ['symbolic_fraction', 'context'],
    expectedMisconceptions: ['subtracts_denominators_directly', 'M007'],
    positive: [/subtract.*same denominator|subtract.*like fractions|like-denominator subtraction/i],
    negative: [/add signed|unlike|common denominator.*first|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F018: {
    expectedQuestionTypes: ['unlike_denominator_addition'],
    expectedRepresentations: ['symbolic_fraction', 'context'],
    expectedMisconceptions: ['adds_denominators_directly', 'common_denominator_missing', 'M007', 'M004'],
    positive: [/add.*unlike|unlike.*addition|common denominator.*add/i],
    negative: [/subtract unlike|subtract.*unlike|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F019: {
    expectedQuestionTypes: ['unlike_denominator_subtraction'],
    expectedRepresentations: ['symbolic_fraction', 'context'],
    expectedMisconceptions: ['subtracts_denominators_directly', 'common_denominator_missing', 'M007', 'M004'],
    positive: [/subtract.*unlike|unlike.*subtraction|common denominator.*subtract|regroup/i],
    negative: [/add unlike|multiply|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F020: {
    expectedQuestionTypes: ['fraction_of_quantity'],
    expectedRepresentations: ['bar_model', 'set_model', 'context'],
    expectedMisconceptions: ['fraction_of_quantity_whole_error', 'M008'],
    positive: [/fraction of quantity|fraction of (a )?set|of \d+|unit fractions? of quantity|non-unit fractions? of quantity|multiples/i],
    negative: [/unlike.*add|unlike.*subtract|multiply fractions?|divide|percentage|decimal|ratio|negative|signed/i],
  },
  F021: {
    expectedQuestionTypes: ['fraction_multiplication'],
    expectedRepresentations: ['symbolic_fraction', 'context'],
    expectedMisconceptions: ['M009'],
    positive: [/multiply fraction|fraction multiplication|multiply.*fraction by fraction|multiply.*whole number/i],
    negative: [/divide|percentage|decimal mixed|ratio|negative|signed/i],
  },
  F022: {
    expectedQuestionTypes: ['fraction_division'],
    expectedRepresentations: ['symbolic_fraction', 'context'],
    expectedMisconceptions: ['M009'],
    positive: [/divide fraction|fraction division|reciprocal|invert/i],
    negative: [/multiply fraction by fraction|percentage|decimal|ratio|negative|signed/i],
  },
  F023: {
    expectedQuestionTypes: ['one_step_word_problem'],
    expectedRepresentations: ['context', 'bar_model'],
    expectedMisconceptions: ['operation_mismatch', 'fraction_of_quantity_whole_error', 'M008'],
    positive: [/one-step|single-operation|word problem|context/i],
    negative: [/two-step|multi-step|extended-response|exam-style|percentage|decimal|ratio|negative|signed/i],
  },
  F024: {
    expectedQuestionTypes: ['multi_step_problem'],
    expectedRepresentations: ['context', 'bar_model', 'model_drawing'],
    expectedMisconceptions: ['skipped_step', 'operation_mismatch', 'M008', 'M010'],
    positive: [/two-step|multi-step|sequence|model-based|extended-response/i],
    negative: [/exam-style mixed|capstone|percentage|decimal|ratio|negative|signed/i],
  },
  F025: {
    expectedQuestionTypes: ['exam_style_application'],
    expectedRepresentations: ['mixed_format', 'context', 'bar_model'],
    expectedMisconceptions: ['operation_mismatch', 'did_not_work_backwards', 'M008', 'M010'],
    positive: [/exam-style|school-style|non-routine|mixed fraction items|hidden operations|justification/i],
    negative: [/percentage|decimal conversion|ratio|negative|signed|algebraic/i],
  },
  F026: {
    expectedQuestionTypes: ['mastery_challenge'],
    expectedRepresentations: ['mixed_format', 'context'],
    expectedMisconceptions: ['skipped_step', 'operation_mismatch', 'M010'],
    positive: [/mastery|capstone|retention|speed-accuracy|consolidated|mixed drill/i],
    negative: [/percentage|decimal conversion|ratio|negative|signed|algebraic/i],
  },
};

const OUT_OF_SCOPE_PATTERNS = [
  { tag: 'signed_fraction', pattern: /signed|negative|around zero|-\d+\s*\/\s*\d+/i },
  { tag: 'percentage_decimal_conversion', pattern: /percentage|percent|decimal conversion|fraction and decimal|decimal values|decimal equivalents/i },
  { tag: 'ratio', pattern: /\bratio\b/i },
  { tag: 'algebraic_fraction_notation', pattern: /algebraic|forms such as|a\/b|\(3\+y\)\/5/i },
];

const CROSS_SKILL_HINTS = [
  { skillId: 'F007', pattern: /same denominator comparison|compare same denominator|like-denominator comparison/i },
  { skillId: 'F008', pattern: /same numerator comparison|compare same numerator/i },
  { skillId: 'F016', pattern: /add like fractions|same-denominator addition|add.*same denominator/i },
  { skillId: 'F017', pattern: /subtract like fractions|same-denominator subtraction|subtract.*same denominator/i },
  { skillId: 'F018', pattern: /add unlike|unlike.*addition/i },
  { skillId: 'F019', pattern: /subtract unlike|unlike.*subtraction/i },
  { skillId: 'F020', pattern: /fraction of quantity|fraction of .*set|of \d+/i },
  { skillId: 'F021', pattern: /multiply fraction|fraction multiplication/i },
  { skillId: 'F022', pattern: /divide fraction|reciprocal|invert/i },
  { skillId: 'F023', pattern: /one-step|single-operation|word problem/i },
  { skillId: 'F024', pattern: /two-step|multi-step|model-based|extended-response/i },
];

function normalizeSkillId(value = '') {
  return String(value || '').trim().toUpperCase();
}

function textForQuestion(question = {}) {
  return [
    question.id,
    question.questionId,
    question.familyId,
    question.questionFamilyId,
    question.name,
    question.title,
    question.description,
    question.prompt,
    question.stem,
    question.questionText,
    question.explanation,
    question.workedSolution,
    question.metadata?.questionType,
    question.metadata?.diagnosticPurpose,
    question.diagnosticPurpose,
    ...(question.strategyTags || []),
    ...(question.misconceptionTags || []),
    ...(question.metadata?.misconceptionTags || []),
  ].filter(Boolean).join(' ');
}

function sourceTypeForQuestion(question = {}) {
  return question.sourceType
    || question.source
    || question.metadata?.sourceType
    || (String(question.id || question.questionId || '').startsWith('QF_') ? 'question_family' : 'question');
}

function getQuestionSkillId(question = {}) {
  return normalizeSkillId(
    question.skillId
    || question.skillCode
    || question.frameworkSkillId
    || question.metadata?.skillId
    || question.metadata?.skillCode
  );
}

function matchesAny(patterns = [], text = '') {
  return patterns.filter((pattern) => pattern.test(text));
}

function detectSuggestedSkillIds(text = '') {
  const seen = new Set();
  for (const hint of CROSS_SKILL_HINTS) {
    if (hint.pattern.test(text)) seen.add(hint.skillId);
  }
  return [...seen];
}

function misconceptionTags(question = {}) {
  return [
    ...(question.misconceptionTags || []),
    ...(question.metadata?.misconceptionTags || []),
    question.misconceptionTag,
    question.targetsMisconception,
  ].filter(Boolean).map(String);
}

function hasRelevantMisconceptionAlignment(skillId, question = {}) {
  const expected = FRACTION_SKILL_PATTERN_RULES[skillId]?.expectedMisconceptions || [];
  const tags = misconceptionTags(question);
  if (!expected.length || !tags.length) return tags.length > 0;
  return tags.some((tag) => expected.includes(tag));
}

function riskFromScore(score, issueCount) {
  if (score >= 75 && issueCount === 0) return 'Low';
  if (score >= 55) return 'Medium';
  return 'High';
}

function classificationFromRisk(risk, issues = []) {
  if (risk === 'High') return issues.some((issue) => issue.code === 'out_of_scope' || issue.code === 'strong_cross_skill_signal')
    ? 'Incorrect Mapping'
    : 'Questionable Mapping';
  if (risk === 'Medium') return 'Questionable Mapping';
  return 'Correct Mapping';
}

export function buildCanonicalReferenceTable(canonicalSkills = []) {
  return canonicalSkills.map((skill) => {
    const skillId = normalizeSkillId(skill.frameworkSkillId || skill.skillId);
    const expectations = FRACTION_SKILL_PATTERN_RULES[skillId] || {};
    return {
      skillId,
      canonicalMeaning: skill.syllabusOutcome || skill.description || skill.displayName,
      prerequisiteConcepts: skill.prerequisites || [],
      expectedRepresentations: expectations.expectedRepresentations || [],
      expectedMisconceptions: expectations.expectedMisconceptions || [],
      expectedQuestionTypes: expectations.expectedQuestionTypes || [],
      topic: skill.topic || '',
      levelBand: skill.levelBand || [],
    };
  });
}

export function validateQuestionSkillMapping(question = {}, options = {}) {
  const skillId = getQuestionSkillId(question);
  const text = textForQuestion(question);
  const targetRule = FRACTION_SKILL_PATTERN_RULES[skillId] || null;
  const issues = [];
  let score = 70;

  if (!skillId || !targetRule) {
    return {
      questionId: question.id || question.questionId || question._id || 'unknown',
      skillId,
      sourceType: sourceTypeForQuestion(question),
      classification: 'Questionable Mapping',
      risk: 'High',
      confidence: 0.3,
      inferredSkillIds: [],
      issues: [{ code: 'unknown_skill', severity: 'High', message: 'Question is not linked to a known F001-F026 skill.' }],
    };
  }

  const positiveMatches = matchesAny(targetRule.positive, text);
  const negativeMatches = matchesAny(targetRule.negative, text);
  const outOfScopeMatches = OUT_OF_SCOPE_PATTERNS.filter((row) => row.pattern.test(text));
  const inferredSkillIds = detectSuggestedSkillIds(text).filter((candidate) => candidate !== skillId);
  const hasMisconceptionAlignment = hasRelevantMisconceptionAlignment(skillId, question);

  if (positiveMatches.length) score += Math.min(20, positiveMatches.length * 8);
  if (!positiveMatches.length) {
    score -= 18;
    issues.push({
      code: 'weak_target_signal',
      severity: 'Medium',
      message: `Question text does not strongly signal ${skillId}'s canonical objective.`,
    });
  }

  if (negativeMatches.length) {
    score -= Math.min(32, negativeMatches.length * 10);
    issues.push({
      code: 'contradicts_canonical_scope',
      severity: 'Medium',
      message: `Question contains terms outside ${skillId}'s expected scope.`,
      evidence: negativeMatches.map(String).slice(0, 4),
    });
  }

  if (outOfScopeMatches.length) {
    score -= 35;
    issues.push({
      code: 'out_of_scope',
      severity: 'High',
      message: 'Question appears to test content outside the active F001-F026 Fractions pilot map.',
      evidence: outOfScopeMatches.map((row) => row.tag),
    });
  }

  if (inferredSkillIds.length) {
    score -= inferredSkillIds.length > 1 ? 25 : 18;
    issues.push({
      code: 'strong_cross_skill_signal',
      severity: inferredSkillIds.length > 1 ? 'High' : 'Medium',
      message: `Question wording more strongly resembles ${inferredSkillIds.join(', ')} than ${skillId}.`,
      inferredSkillIds,
    });
  }

  if (!hasMisconceptionAlignment) {
    score -= 8;
    issues.push({
      code: 'misconception_alignment_weak',
      severity: 'Medium',
      message: 'Misconception tags are missing or do not align with the canonical skill.',
    });
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const risk = riskFromScore(normalizedScore, issues.length);
  return {
    questionId: String(question.id || question.questionId || question._id || 'unknown'),
    skillId,
    sourceType: sourceTypeForQuestion(question),
    classification: classificationFromRisk(risk, issues),
    risk,
    confidence: Number((normalizedScore / 100).toFixed(2)),
    inferredSkillIds,
    issues,
    textSample: text.slice(0, 220),
  };
}

export function auditQuestionSkillIntegrity({ canonicalSkills = [], questions = [] } = {}) {
  const canonicalReference = buildCanonicalReferenceTable(canonicalSkills);
  const rows = questions.map((question) => validateQuestionSkillMapping(question));
  const byRisk = rows.reduce((acc, row) => {
    acc[row.risk] = (acc[row.risk] || 0) + 1;
    return acc;
  }, {});
  const byClassification = rows.reduce((acc, row) => {
    acc[row.classification] = (acc[row.classification] || 0) + 1;
    return acc;
  }, {});
  const issueCounts = {};
  for (const row of rows) {
    for (const issue of row.issues || []) {
      issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    }
  }
  const topIssues = Object.entries(issueCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return {
    generatedAt: new Date().toISOString(),
    canonicalReference,
    auditedQuestions: rows.length,
    byRisk: {
      High: byRisk.High || 0,
      Medium: byRisk.Medium || 0,
      Low: byRisk.Low || 0,
    },
    byClassification: {
      'Correct Mapping': byClassification['Correct Mapping'] || 0,
      'Questionable Mapping': byClassification['Questionable Mapping'] || 0,
      'Incorrect Mapping': byClassification['Incorrect Mapping'] || 0,
    },
    topIssues,
    pilotBlockers: rows.filter((row) => row.risk === 'High' && row.classification === 'Incorrect Mapping'),
    highPriority: rows.filter((row) => row.risk === 'High' && row.classification !== 'Incorrect Mapping'),
    mediumPriority: rows.filter((row) => row.risk === 'Medium'),
    rows,
  };
}

export function buildFractionsSkillIntegrityReport({ canonicalSkills = [], questionFamilies = [] } = {}) {
  const questions = questionFamilies.map((family) => ({
    ...family,
    questionId: family.id,
    sourceType: 'question_family',
    questionFamilyId: family.id,
  }));
  return auditQuestionSkillIntegrity({ canonicalSkills, questions });
}

export default {
  buildCanonicalReferenceTable,
  validateQuestionSkillMapping,
  auditQuestionSkillIntegrity,
  buildFractionsSkillIntegrityReport,
};
