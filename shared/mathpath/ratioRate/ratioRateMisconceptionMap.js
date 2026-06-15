// Misconception map for the Ratio & Rate domain (MathPath).
// Mirrors percentageMisconceptionMap.js shape exactly (tag → description/remediation).

export const RATIO_RATE_MISCONCEPTION_MAP = {
  'rr/order-reversed': {
    tag: 'rr/order-reversed',
    description: 'Student writes A:B when the question asks for B:A.',
    remediation: 'Read the question: "ratio of X to Y" means X first, Y second.',
    severity: 'medium',
  },
  'rr/part-whole-mixup': {
    tag: 'rr/part-whole-mixup',
    description: 'Student uses the total as one part of a part-to-part ratio, or vice versa.',
    remediation: 'Check whether the question asks for part:part or part:whole.',
    severity: 'medium',
  },
  'rr/add-not-multiply': {
    tag: 'rr/add-not-multiply',
    description: 'Student scales a ratio by adding rather than multiplying.',
    remediation: 'Equivalent ratios are made by multiplying (or dividing) both parts by the same number.',
    severity: 'high',
  },
  'rr/additive-not-multiplicative': {
    tag: 'rr/additive-not-multiplicative',
    description: 'Student sees the ratio relationship as a difference rather than a scale factor.',
    remediation: 'Ratio compares sizes multiplicatively. Use "× k" or "÷ k", not "+ k".',
    severity: 'high',
  },
  'rr/incomplete-simplify': {
    tag: 'rr/incomplete-simplify',
    description: 'Student reduces a ratio partially but does not reach the lowest terms.',
    remediation: 'Divide both parts by their GCD to reach the simplest form.',
    severity: 'low',
  },
  'rr/pairwise-only': {
    tag: 'rr/pairwise-only',
    description: 'Student simplifies each adjacent pair in a 3-part ratio separately, losing the overall scale.',
    remediation: 'Find the GCD of all three parts at once, then divide each by that GCD.',
    severity: 'medium',
  },
  'rr/part-part-as-fraction': {
    tag: 'rr/part-part-as-fraction',
    description: 'Student treats a part-to-part ratio (e.g. 2:3) as a fraction of the whole (2/3).',
    remediation: 'A ratio of 2:3 means 2 parts + 3 parts = 5 total. The fraction of the whole is 2/5 or 3/5.',
    severity: 'high',
  },
  'rr/percent-of-part': {
    tag: 'rr/percent-of-part',
    description: 'Student calculates percentage of a part instead of percentage of the total.',
    remediation: 'The base for a percentage is the whole (total units), not one of the parts.',
    severity: 'medium',
  },
  'rr/forgot-total-units': {
    tag: 'rr/forgot-total-units',
    description: 'Student finds one share but forgets to multiply to check or find the total.',
    remediation: 'One share × number of parts = total. Always verify by reconstructing the whole.',
    severity: 'low',
  },
  'rr/three-units-error': {
    tag: 'rr/three-units-error',
    description: 'Student loses track of the third quantity in a 3-part ratio division.',
    remediation: 'List all three parts explicitly: parts for A, parts for B, parts for C, then multiply each by the unit share.',
    severity: 'medium',
  },
  'rr/assume-total-constant': {
    tag: 'rr/assume-total-constant',
    description: 'Student assumes the total stays the same when one quantity in the ratio changes.',
    remediation: 'If a ratio changes, recalculate the total from the new ratio. Never carry over the old total.',
    severity: 'high',
  },
  'rr/avg-of-speeds': {
    tag: 'rr/avg-of-speeds',
    description: 'Student averages two speeds arithmetically instead of using total distance ÷ total time.',
    remediation: 'Average speed = total distance ÷ total time (not (s₁ + s₂) ÷ 2).',
    severity: 'high',
  },
  'rr/flat-rate': {
    tag: 'rr/flat-rate',
    description: 'Student applies a fixed rate to a different base quantity without adjusting.',
    remediation: 'Identify the unit rate first (per 1), then multiply by the correct quantity.',
    severity: 'medium',
  },
  'rr/formula-confusion': {
    tag: 'rr/formula-confusion',
    description: 'Student mixes up the speed/distance/time formula (e.g. uses distance = speed + time).',
    remediation: 'Remember: Distance = Speed × Time. Rearrange: Speed = D ÷ T, Time = D ÷ S.',
    severity: 'high',
  },
  'rr/no-common-term': {
    tag: 'rr/no-common-term',
    description: 'Student cannot identify the linking quantity needed to combine two separate ratios.',
    remediation: 'Scale both ratios so the shared quantity is the same number, then combine.',
    severity: 'medium',
  },
  'rr/rate-inverted': {
    tag: 'rr/rate-inverted',
    description: 'Student inverts the rate (e.g. uses time/distance instead of distance/time for speed).',
    remediation: 'Check the units of the rate you want: km/h means km per h, so Distance ÷ Time.',
    severity: 'medium',
  },
  'rr/unit-mismatch': {
    tag: 'rr/unit-mismatch',
    description: 'Student computes a rate without converting to consistent units first.',
    remediation: 'Convert all quantities to the same unit (e.g. km, m; hours, minutes) before calculating.',
    severity: 'medium',
  },
};

export function getMisconceptionEntry(tag) {
  return RATIO_RATE_MISCONCEPTION_MAP[tag] || null;
}

export function getAllMisconceptionTags() {
  return Object.keys(RATIO_RATE_MISCONCEPTION_MAP);
}

export default RATIO_RATE_MISCONCEPTION_MAP;
