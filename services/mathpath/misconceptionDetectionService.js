function lower(value = '') {
  return String(value || '').toLowerCase();
}

const RULES = [
  {
    tag: 'fraction_add_denominators_directly',
    label: 'Added denominators directly',
    patterns: [/\b\d+\s*\/\s*\d+\s*\+\s*\d+\s*\/\s*\d+\s*=\s*\d+\s*\/\s*\d+/, /denominator/i],
    evidence: 'The response may show numerator and denominator addition without a common denominator.',
  },
  {
    tag: 'compares_denominators_only',
    label: 'Compared denominators only',
    patterns: [/bigger denominator/, /larger denominator/, /bottom number/],
    evidence: 'The answer language focuses on denominator size rather than fraction size.',
  },
  {
    tag: 'numerator_denominator_reversed',
    label: 'Reversed numerator and denominator',
    patterns: [/revers/, /\bdenominator\s+as\s+top/, /\btop\s+and\s+bottom/],
    evidence: 'The response suggests the numerator and denominator may be swapped.',
  },
  {
    tag: 'incorrect_simplification',
    label: 'Incorrect simplification',
    patterns: [/simpl/i, /lowest terms/i, /divide/i],
    evidence: 'The question or answer involves simplification and needs adult confirmation.',
  },
  {
    tag: 'whole_number_thinking',
    label: 'Whole-number thinking',
    patterns: [/whole number/, /larger number/, /\b\d+\s*>\s*\d+/],
    evidence: 'The response may treat fraction parts as whole numbers.',
  },
];

export function detectMisconceptions({ questionText = '', studentAnswer = '', teacherMarkedCorrect = null } = {}) {
  const text = lower(`${questionText}\n${studentAnswer}`);
  const matches = RULES
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => ({
      tag: rule.tag,
      label: rule.label,
      evidence: rule.evidence,
    }));
  const wrongBoost = teacherMarkedCorrect === false ? 0.15 : 0;
  const confidence = matches.length ? Math.min(0.9, 0.45 + matches.length * 0.15 + wrongBoost) : 0;
  return {
    misconceptionTags: matches.map((match) => match.tag),
    misconceptionEvidence: matches.map((match) => match.evidence),
    confidence,
  };
}

export default { detectMisconceptions };
