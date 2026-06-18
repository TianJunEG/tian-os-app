import { resolveDomainSkillGraph } from './domainSkillGraphResolver.js';

export const FROZEN_PILOT_DOMAIN_IDS = [
  'fractions',
  'decimals',
  'percentage',
  'ratio',
  'number_sense',
  'four_operations',
];

const DOMAIN_LABELS = {
  fractions: 'Fractions',
  decimals: 'Decimals',
  percentage: 'Percentages',
  percentages: 'Percentages',
  ratio: 'Ratio & Rate',
  ratio_rate: 'Ratio & Rate',
  number_sense: 'Number Sense',
  four_operations: 'Operations',
  operations: 'Operations',
};

const MISCONCEPTION_LABELS = {
  'skipped_answer': 'Skipped answer',
  'practice_error': 'Practice error',
  'dec/add-misalign': 'Decimal points may not be lined up',
  'dec/align-right': 'Decimals may be compared from the wrong side',
  'dec/longer-decimal': 'Longer decimal mistaken as larger',
  'dec/truncate': 'Rounded by cutting off digits',
  'dec/wrong-denominator': 'Decimal place value denominator mixed up',
  'pct/wrong-base': 'Used the wrong base for the percentage',
  'pct/add-percent-not-amount': 'Added the percent instead of the amount',
  'pct/discount-of-discounted': 'Used the wrong discount base',
  'pct/gst-wrong-base': 'GST calculated from the wrong base',
  'rr/rate-inverted': 'Rate was inverted',
  'rr/part-whole-mixup': 'Part-to-part and part-to-whole ratio mixed up',
  'rr/additive-not-multiplicative': 'Used additive thinking for proportion',
  'rr/formula-confusion': 'Speed, distance and time formula confused',
  'count/skip-number': 'Counting sequence slipped',
  'pv/digit-vs-value': 'Digit confused with its place value',
  'compare/leading-digit': 'Compared by the wrong digit',
  'round/wrong-digit': 'Rounded using the wrong digit',
  'add/forgot-carry': 'Carrying step missed',
  'sub/smaller-from-larger': 'Subtracted smaller digit from larger digit',
  'mult/forgot-carry': 'Multiplication carrying step missed',
  'div/ignore-remainder': 'Remainder was ignored',
  'order/left-to-right': 'Order of operations applied left to right',
};

function canonicalDomainId(domainId = '') {
  const raw = String(domainId || 'fractions').trim();
  if (raw === 'percentages') return 'percentage';
  if (raw === 'ratio_rate' || raw === 'ratio-rate') return 'ratio';
  if (raw === 'operations') return 'four_operations';
  return raw || 'fractions';
}

export function frozenDomainLabel(domainId = '') {
  const canonical = canonicalDomainId(domainId);
  return DOMAIN_LABELS[canonical] || DOMAIN_LABELS[domainId] || 'MathPath';
}

function dedupe(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function titleCaseTag(tag = '') {
  return String(tag || '')
    .replace(/^[a-z]+[/-]/i, '')
    .replace(/[_/-]+/g, ' ')
    .replace(/\b\w/g, (s) => s.toUpperCase())
    .trim();
}

export function misconceptionLabel(tag = '') {
  if (!tag) return 'No misconception tag recorded yet';
  return MISCONCEPTION_LABELS[tag] || titleCaseTag(tag) || 'Misconception recorded';
}

export function workingEvidenceState(source = {}) {
  const hasStrokes = Array.isArray(source.workingStrokes) && source.workingStrokes.length > 0;
  const hasMathObjects = Array.isArray(source.workingMathObjects) && source.workingMathObjects.length > 0;
  if (source.workingSubmitted || source.workingUploaded || source.fullscreenWorkingSubmitted || source.workingImage || source.workingId || hasStrokes || hasMathObjects) {
    return { status: 'saved', label: 'Working saved', explanation: 'Written working was attached to this attempt.' };
  }
  if (Number(source.savedWorkingCount || source.submittedWorkingCount || 0) > 0) {
    return { status: 'saved', label: 'Working saved', explanation: 'Written working was attached to recent attempts.' };
  }
  if (source.workingNotNeeded) {
    return { status: 'not_needed', label: 'Working marked not needed', explanation: 'This question did not require written working.' };
  }
  if (
    source.workingExpected
    || source.workingRequired
    || source.workingRequirementLevel === 'HIGH'
    || Number(source.missingWorkingCount || 0) > 0
    || (Array.isArray(source.missingWorkingQuestions) && source.missingWorkingQuestions.length > 0)
  ) {
    return { status: 'missing', label: 'Working missing', explanation: 'Written working was expected but was not submitted.' };
  }
  return { status: 'unavailable', label: 'Working unavailable', explanation: 'No working evidence was recorded for this item.' };
}

function skillLabel(domainId, skillId = '', fallback = '') {
  if (fallback && !/^([A-Z]{1,3}\d{3}|P6-[A-Z]+-\d{2})$/.test(String(fallback))) return fallback;
  const { getSkill } = resolveDomainSkillGraph(canonicalDomainId(domainId));
  return getSkill?.(skillId)?.name || fallback || skillId || 'Unknown skill';
}

function normalizeWeakSkill(row, domainId) {
  const skillId = row?.skillId || row?.weakSkillId || row;
  const name = skillLabel(domainId, skillId, row?.skillName || row?.name || row?.label);
  return {
    domainId: canonicalDomainId(row?.domainId || domainId),
    domainName: frozenDomainLabel(row?.domainId || domainId),
    skillId: String(skillId || ''),
    skillName: name,
    weaknessExplanation: `${name} needs review because recent practice or mistake evidence shows the skill is not secure yet.`,
    parentNextAction: `Spend 10 minutes reviewing ${name}, then ask your child to explain one corrected example.`,
    tutorTeachingFocus: `Use 10-15 minutes to reteach ${name}, model one example, then give two independent checks.`,
  };
}

function normalizeMistake(row, domainId) {
  const resolvedDomainId = canonicalDomainId(row?.domainId || domainId);
  const skillId = row?.skillCode || row?.skillId || row?.weakSkillId || '';
  const skillName = skillLabel(resolvedDomainId, skillId, row?.skillName || row?.name);
  const workingState = workingEvidenceState(row);
  const misconceptionTag = row?.misconceptionTag || row?.mistakeCode || row?.suspectedMistakeCode || '';
  const misconception = misconceptionLabel(misconceptionTag);
  return {
    id: String(row?.id || row?._id || row?.mistakeId || row?.questionId || ''),
    domainId: resolvedDomainId,
    domainName: frozenDomainLabel(resolvedDomainId),
    skillId: String(skillId || ''),
    skillName,
    questionId: String(row?.questionId || ''),
    questionText: row?.questionText || row?.questionStem || row?.prompt || '',
    studentAnswer: String(row?.studentAnswer ?? row?.answer ?? ''),
    correctAnswer: String(row?.correctAnswer ?? ''),
    misconceptionTag,
    misconceptionLabel: misconception,
    workingState,
    occurredAt: row?.occurredAt || row?.timestamp || row?.createdAt || null,
    parentExplanation: `${skillName}: ${misconception.toLowerCase()}.`,
    parentNextAction: `Review this mistake together and ask your child to redo one similar ${skillName} question.`,
    tutorTeachingFocus: `Spend 10-15 minutes on ${skillName}; check for ${misconception.toLowerCase()} before assigning more practice.`,
  };
}

export function buildFrozenDomainAdultInsight({
  domainId = 'fractions',
  weakSkills = [],
  mistakes = [],
  workingEvidence = {},
} = {}) {
  const resolvedDomainId = canonicalDomainId(domainId);
  const normalizedWeakSkills = weakSkills.map((row) => normalizeWeakSkill(row, resolvedDomainId));
  const normalizedMistakes = mistakes.map((row) => normalizeMistake(row, resolvedDomainId));
  const grouped = new Map();
  for (const mistake of normalizedMistakes) {
    const key = `${mistake.domainId}:${mistake.skillId || mistake.skillName}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        domainId: mistake.domainId,
        domainName: mistake.domainName,
        skillId: mistake.skillId,
        skillName: mistake.skillName,
        count: 0,
        mistakes: [],
        workingStates: [],
      });
    }
    const group = grouped.get(key);
    group.count += 1;
    group.mistakes.push(mistake);
    group.workingStates = dedupe([...group.workingStates, mistake.workingState.status]);
  }

  const topWeak = normalizedWeakSkills[0] || normalizedMistakes[0] || null;
  const workingState = workingEvidenceState(workingEvidence);

  return {
    domainId: resolvedDomainId,
    domainName: frozenDomainLabel(resolvedDomainId),
    frozenPilotDomain: FROZEN_PILOT_DOMAIN_IDS.includes(resolvedDomainId),
    weakSkills: normalizedWeakSkills,
    recentMistakes: normalizedMistakes,
    mistakesByDomainSkill: [...grouped.values()],
    workingState,
    parentNextAction: topWeak
      ? `At home: review ${topWeak.skillName} for 10 minutes and redo one recent mistake.`
      : 'At home: keep the next MathPath practice short and ask your child to explain one answer.',
    tutorTeachingFocus: topWeak
      ? `Teaching focus: use 10-15 minutes on ${topWeak.skillName}, then check one similar question independently.`
      : 'Teaching focus: use the next 10-15 minutes to confirm the current skill and inspect working evidence.',
  };
}

export default {
  FROZEN_PILOT_DOMAIN_IDS,
  buildFrozenDomainAdultInsight,
  frozenDomainLabel,
  misconceptionLabel,
  workingEvidenceState,
};
