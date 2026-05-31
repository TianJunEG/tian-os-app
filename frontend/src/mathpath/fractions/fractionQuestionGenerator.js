import { fractionSkillGraph, getSkill } from './fractionSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './fractionQuestionFamilies.js';
import { getSkillCurriculumMapping } from '../curriculum/curriculumMappingSelectors.js';

const DOMAIN_ID = 'fractions';

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix, seed = '') {
  return `${prefix}_${Date.now()}_${Math.abs(hash(seed)).toString(36).slice(0, 6)}`;
}

function hash(input = '') {
  let h = 0;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function simplifyFraction(n, d) {
  if (d === 0) throw new Error('Invalid fraction with denominator 0.');
  const sign = d < 0 ? -1 : 1;
  const nn = n * sign;
  const dd = Math.abs(d);
  const g = gcd(nn, dd);
  return { numerator: nn / g, denominator: dd / g };
}

function toMixed(f) {
  const s = simplifyFraction(f.numerator, f.denominator);
  const whole = s.numerator >= 0 ? Math.floor(s.numerator / s.denominator) : Math.ceil(s.numerator / s.denominator);
  const rem = Math.abs(s.numerator % s.denominator);
  return { whole, numerator: rem, denominator: s.denominator };
}

function frac(n, d) {
  return simplifyFraction(n, d);
}

function fracStr(f) {
  const s = simplifyFraction(f.numerator, f.denominator);
  if (s.denominator === 1) return String(s.numerator);
  return `${s.numerator}/${s.denominator}`;
}

function mixedStr(m) {
  if (!m.numerator) return String(m.whole);
  return `${m.whole} ${m.numerator}/${m.denominator}`;
}

function parseAnswer(raw) {
  const input = String(raw ?? '').trim();
  if (!input) return null;
  if (/^-?\d+(\.\d+)?$/.test(input)) {
    const n = Number(input);
    if (Number.isInteger(n)) {
      return { type: 'whole', whole: n, fraction: { numerator: n, denominator: 1 } };
    }
    const sign = n < 0 ? -1 : 1;
    const [i, d = ''] = String(Math.abs(n)).split('.');
    const den = 10 ** d.length;
    const num = sign * (Number(i) * den + Number(d));
    return { type: 'decimal', value: n, fraction: simplifyFraction(num, den) };
  }
  if (/^-?\d+$/.test(input)) {
    const n = Number(input);
    return { type: 'whole', whole: n, fraction: { numerator: n, denominator: 1 } };
  }
  const mixedMatch = input.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const n = Number(mixedMatch[2]);
    const d = Number(mixedMatch[3]);
    if (d === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    const improper = simplifyFraction(whole * d + sign * n, d);
    return { type: 'mixed', whole, numerator: n, denominator: d, fraction: improper };
  }
  const fracMatch = input.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (fracMatch) {
    const n = Number(fracMatch[1]);
    const d = Number(fracMatch[2]);
    if (d === 0) return null;
    return { type: 'fraction', ...simplifyFraction(n, d), fraction: simplifyFraction(n, d) };
  }
  return null;
}

function answerPayloadFraction(n, d) {
  const s = simplifyFraction(n, d);
  return {
    type: 'fraction',
    numerator: s.numerator,
    denominator: s.denominator,
    display: fracStr(s),
  };
}

function answerPayloadWhole(n) {
  return { type: 'whole', whole: n, display: String(n) };
}

function answerPayloadMixed(whole, numerator, denominator) {
  return { type: 'mixed', whole, numerator, denominator, display: mixedStr({ whole, numerator, denominator }) };
}

function assertValidDenominators(value, path = '') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertValidDenominators(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    const nextPath = path ? `${path}.${key}` : key;
    if (key === 'denominator') {
      const den = Number(child);
      if (!Number.isFinite(den) || den <= 0) {
        throw new Error(`Invalid generated denominator at ${nextPath}.`);
      }
      return;
    }
    assertValidDenominators(child, nextPath);
  });
}

function modeMarks(mode = 'practice') {
  if (mode === 'assessment') return 2;
  if (mode === 'diagnostic') return 1;
  if (mode === 'fluency') return 1;
  return 1;
}

function estimateSeconds(mode = 'practice', difficulty = 2, base = 18) {
  if (mode === 'fluency') return Math.max(6, base - 6);
  if (mode === 'assessment') return base + difficulty * 3;
  if (mode === 'diagnostic') return base + 2;
  return base + difficulty * 2;
}

function seq(seed, min, max) {
  const width = max - min + 1;
  return min + (Math.abs(seed) % width);
}

function distinctSeq(seed, min, max, avoid) {
  let value = seq(seed, min, max);
  if (value === avoid) value = value < max ? value + 1 : value - 1;
  return value;
}

function ordinalWord(n) {
  return ({
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
    5: 'fifth',
    6: 'sixth',
    7: 'seventh',
    8: 'eighth',
    9: 'ninth',
    10: 'tenth',
    11: 'eleventh',
    12: 'twelfth',
  })[n] || `${n}th`;
}

function templateContext(skillId, questionFamilyId, difficulty = 2, mode = 'practice', variant = 0) {
  const seed = hash(`${skillId}|${questionFamilyId}|${difficulty}|${mode}|${variant}`);
  return { seed, difficulty, mode, variant, questionFamilyId };
}

const SKILL_MISTAKES = {
  F001: ['M003'],
  F002: ['M003', 'M001', 'M010'],
  F003: ['M003'],
  F004: ['M003'],
  F005: ['M003'],
  F006: ['M002', 'M003'],
  F007: ['M002'],
  F008: ['M002', 'M003'],
  F009: ['M002', 'M004'],
  F010: ['M004'],
  F011: ['M004', 'M003', 'M002', 'M010'],
  F012: ['M005', 'M002', 'M003', 'M010'],
  F013: ['M006'],
  F014: ['M006'],
  F015: ['M006', 'M007', 'M005', 'M010'],
  F016: ['M007', 'M010'],
  F017: ['M007', 'M010'],
  F018: ['M001', 'M004', 'M007', 'M005', 'M010'],
  F019: ['M004', 'M007'],
  F020: ['M008', 'M010'],
  F021: ['M009', 'M010'],
  F022: ['M009', 'M010'],
  F023: ['M008', 'M010', 'M012', 'M003'],
  F024: ['M008', 'M010'],
  F025: ['M008', 'M010', 'M011'],
  F026: ['M008', 'M010', 'M013'],
};

function buildQuestionCore({ skillId, questionFamilyId, mode, difficulty, prompt, answer, acceptedAnswers, workingRequired, mentalMathEligible, solutionSteps, diagramSpec }) {
  const primaryMapping = getSkillCurriculumMapping(skillId, {
    country: 'SG',
    curriculum: 'MOE_PRIMARY_MATH_2021',
  });
  const secondaryMapping = getSkillCurriculumMapping(skillId, {
    country: 'SG',
    curriculum: 'MOE_SECONDARY_G1_MATH_2021',
  });
  const workedSolution = Array.isArray(solutionSteps) ? solutionSteps.join(' ') : '';

  const question = {
    questionId: makeId('fq', `${skillId}|${questionFamilyId}|${prompt}`),
    domainId: DOMAIN_ID,
    skillId,
    questionFamilyId,
    questionCategory: mode,
    questionType: 'short_answer',
    prompt,
    answer,
    acceptedAnswers,
    workingRequired,
    mentalMathEligible,
    difficulty,
    difficultyBand: difficulty <= 2 ? 'easy' : difficulty <= 4 ? 'medium' : 'hard',
    estimatedSeconds: estimateSeconds(mode, difficulty),
    marks: modeMarks(mode),
    solutionSteps,
    workedSolution,
    diagramSpec,
    commonMistakePatterns: SKILL_MISTAKES[skillId] || ['M010'],
    mistakeTags: SKILL_MISTAKES[skillId] || ['M010'],
    singaporeMetadata: {
      country: 'SG',
      subject: 'Mathematics',
      mappings: [primaryMapping, secondaryMapping].filter(Boolean).map((mapping) => ({
        curriculum: mapping.curriculum,
        phase: mapping.phase,
        stream: mapping.stream,
        level: mapping.level,
        introducedLevel: mapping.introducedLevel,
        masteryLevel: mapping.masteryLevel,
        strand: mapping.strand,
        subStrand: mapping.subStrand,
        syllabusRef: mapping.syllabusRef,
      })),
    },
    createdAt: nowIso(),
  };
  assertValidDenominators(question.answer);
  if (question.diagramSpec) assertValidDenominators(question.diagramSpec);
  return question;
}

function templateForSkill(skillId, variant, ctx) {
  const s = ctx.seed;
  const familyId = String(ctx.questionFamilyId || '');
  switch (skillId) {
    case 'F001': {
      const d = seq(s, 2, 8);
      const shaded = variant === 0 ? 1 : seq(s, 1, d - 1);
      return {
        prompt: `A shape is split into ${d} equal parts. ${shaded} part(s) are shaded. What fraction is shaded?`,
        answer: answerPayloadFraction(shaded, d),
        acceptedAnswers: [fracStr({ numerator: shaded, denominator: d })],
        solutionSteps: ['Count shaded parts.', 'Count total equal parts.', `Write fraction as ${shaded}/${d}.`],
      };
    }
    case 'F002': {
      const n = seq(s, 1, 7);
      const d = seq(s + 9, n + 1, 12);
      const askNum = variant % 2 === 0;
      const target = askNum ? 'shaded' : 'equal';
      return {
        prompt: askNum
          ? `A bar is split into ${d} equal parts. ${n} parts are shaded. How many parts are shaded?`
          : `A bar is split into ${d} equal parts. ${n} parts are shaded. How many equal parts are in the whole bar?`,
        answer: answerPayloadWhole(askNum ? n : d),
        acceptedAnswers: [String(askNum ? n : d)],
        diagramSpec: {
          type: 'fraction_bar',
          width: 640,
          height: 180,
          data: { parts: d, shaded: n, labelMode: 'none' },
        },
        solutionSteps: [`Count the ${target} parts.`, `So the answer is ${askNum ? n : d}.`],
      };
    }
    case 'F003': {
      const d = [2, 3, 4, 5][Math.abs(s) % 4];
      const n = seq(s + 3, 1, d - 1);
      const groups = seq(s + 11, 2, 6);
      const total = d * groups;
      const unit = total / d;
      const shaded = unit * n;
      return {
        prompt: `A set has ${total} objects. ${n}/${d} of them are selected. How many are selected?`,
        answer: answerPayloadWhole(shaded),
        acceptedAnswers: [String(shaded)],
        solutionSteps: [`Find 1/${d} of ${total}: ${total}/${d} = ${unit}.`, `Multiply by ${n}: ${shaded}.`],
      };
    }
    case 'F004': {
      const d = seq(s, 2, 12);
      return {
        prompt: `A bar is split into ${d} equal parts. 1 part is shaded. What fraction is shaded?`,
        answer: answerPayloadFraction(1, d),
        acceptedAnswers: [`1/${d}`],
        diagramSpec: {
          type: 'fraction_bar',
          width: 640,
          height: 180,
          data: { parts: d, shaded: 1, labelMode: 'none' },
        },
        solutionSteps: ['Count the shaded parts.', 'Count the total equal parts.', `So the fraction is 1/${d}.`],
      };
    }
    case 'F005': {
      const d = [2, 3, 4, 5, 6, 8][Math.abs(s) % 6];
      const pos = seq(s + 2, 1, d - 1);
      return {
        prompt: `On a number line from 0 to 1 divided into ${d} equal parts, what fraction is at the ${ordinalWord(pos)} mark after 0?`,
        answer: answerPayloadFraction(pos, d),
        acceptedAnswers: [`${pos}/${d}`],
        diagramSpec: {
          type: 'number_line',
          width: 640,
          height: 180,
          data: {
            min: 0,
            max: 1,
            minStepCount: d,
            points: [{ value: pos / d, label: '?' }],
            endpointLabels: ['0', '1'],
          },
        },
        solutionSteps: ['Each mark is one equal part.', `The ${pos}th mark is ${pos}/${d}.`],
      };
    }
    case 'F006': {
      const a = seq(s, 2, 9);
      const b = distinctSeq(s + 5, 2, 9, a);
      const bigger = a < b ? `1/${a}` : `1/${b}`;
      return {
        prompt: `Which is greater: 1/${a} or 1/${b}?`,
        answer: { type: 'text', value: bigger, display: bigger },
        acceptedAnswers: [bigger],
        solutionSteps: ['For unit fractions, smaller denominator means larger value.', `So ${bigger} is greater.`],
      };
    }
    case 'F007': {
      const d = seq(s, 3, 12);
      const a = seq(s + 1, 1, d - 1);
      const b = distinctSeq(s + 4, 1, d - 1, a);
      const greater = a > b ? `${a}/${d}` : `${b}/${d}`;
      return {
        prompt: `Which is greater: ${a}/${d} or ${b}/${d}?`,
        answer: { type: 'text', value: greater, display: greater },
        acceptedAnswers: [greater],
        solutionSteps: ['Denominators are equal.', 'Compare numerators directly.', `${greater} is greater.`],
      };
    }
    case 'F008': {
      const n = seq(s, 1, 6);
      const a = seq(s + 2, n + 1, 12);
      const b = distinctSeq(s + 5, n + 1, 12, a);
      const greater = a < b ? `${n}/${a}` : `${n}/${b}`;
      return {
        prompt: `Which is greater: ${n}/${a} or ${n}/${b}?`,
        answer: { type: 'text', value: greater, display: greater },
        acceptedAnswers: [greater],
        solutionSteps: ['Numerators are equal.', 'Smaller denominator gives larger fraction.', `${greater} is greater.`],
      };
    }
    case 'F009': {
      const triples = [
        [frac(1, 4), frac(1, 2), frac(3, 4)],
        [frac(1, 3), frac(1, 2), frac(2, 3)],
        [frac(2, 5), frac(1, 2), frac(4, 5)],
        [frac(3, 8), frac(1, 4), frac(5, 8)],
        [frac(2, 3), frac(1, 6), frac(1, 2)],
      ];
      const picked = triples[Math.abs(s) % triples.length];
      const shown = [...picked].sort((a, b) => hash(`${s}|${fracStr(a)}`) - hash(`${s}|${fracStr(b)}`));
      const arr = [...picked].sort((x, y) => x.numerator / x.denominator - y.numerator / y.denominator).map(fracStr);
      return {
        prompt: `Order these fractions from smallest to largest: ${shown.map(fracStr).join(', ')}.`,
        answer: { type: 'list', value: arr, display: arr.join(', ') },
        acceptedAnswers: [arr.join(','), arr.join(', ')],
        solutionSteps: ['Convert to comparable values (or common denominator).', `Order: ${arr.join(', ')}.`],
      };
    }
    case 'F010': {
      const n = seq(s, 1, 5);
      const d = seq(s + 5, n + 1, 9);
      const k = [2, 3, 4][Math.abs(s) % 3];
      return {
        prompt: `Complete: ${n}/${d} = ?/${d * k}`,
        answer: answerPayloadWhole(n * k),
        acceptedAnswers: [String(n * k)],
        solutionSteps: [`Multiply numerator and denominator by ${k}.`, `${n}/${d} = ${n * k}/${d * k}.`],
      };
    }
    case 'F011': {
      if (familyId.endsWith('_004')) {
        const d = seq(s, 3, 12);
        const a = seq(s + 1, 1, d - 1);
        const b = seq(s + 4, 1, d - 1);
        const relation = a === b ? '=' : (a > b ? '>' : '<');
        return {
          prompt: `Fill in the correct symbol: ${a}/${d} __ ${b}/${d}`,
          answer: { type: 'text', value: relation, display: relation },
          acceptedAnswers: [relation],
          solutionSteps: ['Denominators are the same, so compare numerators.', `Since ${a} ${relation} ${b}, the symbol is "${relation}".`],
        };
      }
      if (familyId.endsWith('_005')) {
        const d = seq(s, 4, 10);
        const a = seq(s + 1, 1, d - 1);
        const b = seq(s + 6, 1, d - 1);
        const greater = a >= b ? `${a}/${d}` : `${b}/${d}`;
        return {
          prompt: `A model shows ${a}/${d} and ${b}/${d}. Which fraction is greater (or equal if same)?`,
          answer: { type: 'text', value: greater, display: greater },
          acceptedAnswers: [greater],
          solutionSteps: ['Both fractions have equal-sized parts.', 'Compare the number of parts shaded.', `Answer: ${greater}.`],
        };
      }
      const n = seq(s, 1, 6);
      const d = seq(s + 6, n + 1, 12);
      const k = [2, 3][Math.abs(s) % 2];
      return {
        prompt: `Write one equivalent fraction for ${n}/${d}.`,
        answer: answerPayloadFraction(n * k, d * k),
        acceptedAnswers: [fracStr({ numerator: n * 2, denominator: d * 2 }), fracStr({ numerator: n * 3, denominator: d * 3 })],
        solutionSteps: ['Multiply numerator and denominator by the same number.', `One valid answer: ${n * k}/${d * k}.`],
      };
    }
    case 'F012': {
      if (familyId.endsWith('_004')) {
        const n = seq(s, 1, 6);
        const a = seq(s + 2, n + 1, 12);
        const b = seq(s + 7, n + 1, 12);
        const relation = a === b ? '=' : (a < b ? '>' : '<');
        return {
          prompt: `Fill in the correct symbol: ${n}/${a} __ ${n}/${b}`,
          answer: { type: 'text', value: relation, display: relation },
          acceptedAnswers: [relation],
          solutionSteps: ['Numerators are equal.', 'Smaller denominator means larger fraction.', `So the symbol is "${relation}".`],
        };
      }
      if (familyId.endsWith('_005')) {
        const n = seq(s, 1, 5);
        const a = seq(s + 1, n + 1, 10);
        const b = seq(s + 5, n + 1, 10);
        const greater = a <= b ? `${n}/${a}` : `${n}/${b}`;
        return {
          prompt: `Two bars each show ${n} equal parts shaded, with totals ${a} and ${b} parts. Which fraction is larger?`,
          answer: { type: 'text', value: greater, display: greater },
          acceptedAnswers: [greater],
          solutionSteps: ['Same numerator means same number of parts selected.', 'Larger part size comes from smaller denominator.', `Answer: ${greater}.`],
        };
      }
      const g = [2, 3, 4][Math.abs(s) % 3];
      const n = seq(s, 2, 8) * g;
      const d = seq(s + 5, n / g + 1, 12) * g;
      const simp = simplifyFraction(n, d);
      return {
        prompt: `Simplify ${n}/${d} to lowest terms.`,
        answer: answerPayloadFraction(simp.numerator, simp.denominator),
        acceptedAnswers: [fracStr(simp)],
        solutionSteps: ['Find the greatest common factor.', `Divide numerator and denominator by ${gcd(n, d)}.`],
      };
    }
    case 'F013': {
      const d = seq(s, 2, 8);
      const n = seq(s + 3, d + 1, d * 3);
      return {
        prompt: `Write ${n}/${d} as a mixed number.`,
        answer: (() => { const m = toMixed({ numerator: n, denominator: d }); return answerPayloadMixed(m.whole, m.numerator, m.denominator); })(),
        acceptedAnswers: [mixedStr(toMixed({ numerator: n, denominator: d })), fracStr({ numerator: n, denominator: d })],
        solutionSteps: ['Divide numerator by denominator.', 'Use quotient as whole part and remainder as numerator.'],
      };
    }
    case 'F014': {
      const w = seq(s, 1, 5); const n = seq(s + 3, 1, 5); const d = seq(s + 5, n + 1, 8);
      return {
        prompt: `Write the mixed number shown: ${w} ${n}/${d}.`,
        answer: answerPayloadMixed(w, n, d),
        acceptedAnswers: [mixedStr({ whole: w, numerator: n, denominator: d })],
        solutionSteps: ['Keep whole part and fraction part together.', `Answer remains ${w} ${n}/${d}.`],
      };
    }
    case 'F015': {
      if (familyId.endsWith('_004') || familyId.endsWith('_005')) {
        const d = seq(s, 3, 10);
        const a = seq(s + 2, 1, d - 1);
        const b = seq(s + 6, 1, d - 1);
        const ans = frac(a + b, d);
        return {
          prompt: `Add and simplify if needed: ${a}/${d} + ${b}/${d}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Keep denominator the same.', `Add numerators: ${a} + ${b} = ${a + b}.`, `Simplify to ${fracStr(ans)} if possible.`],
        };
      }
      const d = seq(s, 2, 8); const w = seq(s + 2, 1, 4); const n = seq(s + 5, 1, d - 1);
      const imp = frac(w * d + n, d);
      return {
        prompt: `Convert ${w} ${n}/${d} to an improper fraction.`,
        answer: answerPayloadFraction(imp.numerator, imp.denominator),
        acceptedAnswers: [fracStr(imp)],
        solutionSteps: [`Multiply ${w} × ${d} and add ${n}.`, `Result: ${imp.numerator}/${imp.denominator}.`],
      };
    }
    case 'F016': {
      const d = seq(s, 3, 12); const a = seq(s + 1, 1, d - 1); const b = seq(s + 4, 1, d - 1);
      const ans = frac(a + b, d);
      return {
        prompt: `Compute: ${a}/${d} + ${b}/${d}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Keep denominator the same.', `Add numerators: ${a}+${b}=${a + b}.`, `Answer: ${fracStr(ans)}.`],
      };
    }
    case 'F017': {
      if (familyId.endsWith('_004')) {
        const d = seq(s, 4, 12); const a = seq(s + 1, 1, d - 1); const b = seq(s + 4, 1, d - 1);
        const ans = frac(a - b, d);
        return {
          prompt: `Compute: ${a}/${d} + (${(-b)}/${d})`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Use the same denominator.', `Add signed numerators: ${a} + (${(-b)}) = ${a - b}.`, `Answer: ${fracStr(ans)}.`],
        };
      }
      const d = seq(s, 4, 12); const b = seq(s + 1, 1, d - 2); const a = seq(s + 5, b + 1, d - 1);
      const ans = frac(a - b, d);
      return {
        prompt: `Compute: ${a}/${d} - ${b}/${d}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Keep denominator the same.', `Subtract numerators: ${a}-${b}=${a - b}.`, `Answer: ${fracStr(ans)}.`],
      };
    }
    case 'F018': {
      if (familyId.endsWith('_005')) {
        const a = frac(seq(s, 1, 4), 2 + (Math.abs(s) % 4));
        const b = frac(seq(s + 7, 1, 4), 3 + (Math.abs(s + 2) % 4));
        const cd = lcm(a.denominator, b.denominator);
        const ans = frac(a.numerator * (cd / a.denominator) - b.numerator * (cd / b.denominator), cd);
        return {
          prompt: `Compute: ${fracStr(a)} - ${fracStr(b)}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Find a common denominator.', `Convert fractions to denominator ${cd}.`, `Subtract numerators and simplify to ${fracStr(ans)}.`],
        };
      }
      if (familyId.endsWith('_006')) {
        const a = frac(seq(s, 2, 6), 3 + (Math.abs(s) % 4));
        const b = frac(seq(s + 4, 1, 5), 2 + (Math.abs(s + 1) % 4));
        const cd = lcm(a.denominator, b.denominator);
        const ans = frac(a.numerator * (cd / a.denominator) - b.numerator * (cd / b.denominator), cd);
        return {
          prompt: `Compute and write in lowest terms: ${fracStr(a)} - ${fracStr(b)}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Find the least common denominator.', `Convert both fractions to denominator ${cd}.`, `Subtract numerators and simplify to ${fracStr(ans)}.`],
        };
      }
      const a = frac(seq(s, 1, 4), 2 + (Math.abs(s) % 4));
      const b = frac(seq(s + 7, 1, 4), 3 + (Math.abs(s + 2) % 4));
      const cd = lcm(a.denominator, b.denominator);
      const ans = frac(a.numerator * (cd / a.denominator) + b.numerator * (cd / b.denominator), cd);
      return {
        prompt: `Compute: ${fracStr(a)} + ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Find a common denominator.', `Convert fractions to denominator ${cd}.`, `Add numerators and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F019': {
      const a = frac(seq(s, 2, 6), 3 + (Math.abs(s) % 5));
      const b = frac(seq(s + 3, 1, a.numerator - 1), 2 + (Math.abs(s + 1) % 5));
      const cd = lcm(a.denominator, b.denominator);
      const ans = frac(a.numerator * (cd / a.denominator) - b.numerator * (cd / b.denominator), cd);
      return {
        prompt: `Compute: ${fracStr(a)} - ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Find a common denominator.', `Convert both fractions to denominator ${cd}.`, `Subtract and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F020': {
      const d = [2, 3, 4, 5, 8][Math.abs(s) % 5];
      const n = seq(s + 3, 1, d - 1);
      const base = seq(s + 5, 2, 12);
      const qty = base * d;
      const ans = (qty / d) * n;
      return {
        prompt: `Find ${n}/${d} of ${qty}.`,
        answer: answerPayloadWhole(ans),
        acceptedAnswers: [String(ans)],
        solutionSteps: [`Find 1/${d} of ${qty}: ${qty / d}.`, `Multiply by ${n}: ${ans}.`],
      };
    }
    case 'F021': {
      if (familyId.endsWith('_005')) {
        const a = frac(seq(s, 1, 4), [2, 4, 5, 8][Math.abs(s) % 4]);
        const decimal = ['0.5', '0.25', '0.2'][Math.abs(s + 3) % 3];
        const b = decimal === '0.5' ? frac(1, 2) : decimal === '0.25' ? frac(1, 4) : frac(1, 5);
        const ans = frac(a.numerator * b.numerator, a.denominator * b.denominator);
        return {
          prompt: `Compute and give your answer as a simplified fraction: ${fracStr(a)} × ${decimal}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: [`Convert ${decimal} to ${fracStr(b)}.`, `Multiply fractions and simplify to ${fracStr(ans)}.`],
        };
      }
      if (variant % 2 === 0) {
        const a = frac(seq(s, 1, 5), seq(s + 2, 2, 8));
        const w = seq(s + 4, 2, 6);
        const ans = frac(a.numerator * w, a.denominator);
        return {
          prompt: `Compute: ${fracStr(a)} × ${w}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Multiply numerator by whole number.', `Simplify to ${fracStr(ans)}.`],
        };
      }
      const a = frac(seq(s, 1, 4), seq(s + 2, 2, 8));
      const b = frac(seq(s + 5, 1, 4), seq(s + 7, 2, 8));
      const ans = frac(a.numerator * b.numerator, a.denominator * b.denominator);
      return {
        prompt: `Compute: ${fracStr(a)} × ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Multiply numerators.', 'Multiply denominators.', `Simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F022': {
      if (familyId.endsWith('_005')) {
        const a = frac(-seq(s, 1, 5), seq(s + 2, 2, 8));
        const b = frac(seq(s + 4, 1, 4), seq(s + 6, 2, 8));
        const ans = frac(a.numerator * b.denominator, a.denominator * b.numerator);
        return {
          prompt: `Compute: (${fracStr(a)}) ÷ ${fracStr(b)}`,
          answer: answerPayloadFraction(ans.numerator, ans.denominator),
          acceptedAnswers: [fracStr(ans)],
          solutionSteps: ['Keep the first fraction.', 'Invert the second fraction.', `Multiply and simplify to ${fracStr(ans)}.`],
        };
      }
      const a = frac(seq(s, 1, 5), seq(s + 2, 2, 8));
      const b = frac(seq(s + 4, 1, 4), seq(s + 6, 2, 8));
      const ans = frac(a.numerator * b.denominator, a.denominator * b.numerator);
      return {
        prompt: `Compute: ${fracStr(a)} ÷ ${fracStr(b)}`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Keep the first fraction.', 'Invert the second fraction.', `Multiply and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F023': {
      if (familyId.endsWith('_005')) {
        const a = frac([1, 2, 3][Math.abs(s) % 3], [2, 4, 5][Math.abs(s + 2) % 3]);
        const b = frac([1, 2, 3][Math.abs(s + 3) % 3], [2, 5, 10][Math.abs(s + 4) % 3]);
        const ratioValue = frac(a.numerator * b.denominator, a.denominator * b.numerator);
        return {
          prompt: `In the ratio A:B = ${fracStr(a)} : ${fracStr(b)}, find A/B as a simplified fraction.`,
          answer: answerPayloadFraction(ratioValue.numerator, ratioValue.denominator),
          acceptedAnswers: [fracStr(ratioValue)],
          solutionSteps: ['A/B equals first term divided by second term.', `${fracStr(a)} ÷ ${fracStr(b)} = ${fracStr(ratioValue)}.`],
        };
      }
      if (familyId.endsWith('_006')) {
        const groups = seq(s, 3, 9);
        const perGroup = seq(s + 2, 2, 8);
        const total = groups * perGroup;
        const n = [1, 2, 3][Math.abs(s + 5) % 3];
        const d = [2, 3, 4][Math.abs(s + 7) % 3];
        const scaledTotal = total * d;
        const ans = (scaledTotal / d) * n;
        return {
          prompt: `A set has ${scaledTotal} items. Find ${n}/${d} of the set.`,
          answer: answerPayloadWhole(ans),
          acceptedAnswers: [String(ans)],
          solutionSteps: [`Find 1/${d} of ${scaledTotal}: ${scaledTotal / d}.`, `Multiply by ${n}: ${ans}.`],
        };
      }
      const total = seq(s, 20, 60);
      const used = frac(1, [2, 3, 4][Math.abs(s) % 3]);
      const rem = frac(total * (used.denominator - used.numerator), used.denominator);
      return {
        prompt: `A student used ${fracStr(used)} of a worksheet with ${total} questions. How many questions are left?`,
        answer: answerPayloadWhole(rem.numerator),
        acceptedAnswers: [String(rem.numerator)],
        solutionSteps: [`Used questions = ${fracStr(used)} of ${total}.`, `Subtract from ${total} to get ${rem.numerator}.`],
      };
    }
    case 'F024': {
      const total = seq(s, 24, 72);
      const f1 = frac(1, [2, 3, 4][Math.abs(s) % 3]);
      const after1 = total - (total * f1.numerator) / f1.denominator;
      const f2 = frac(1, [2, 3, 4][Math.abs(s + 2) % 3]);
      const final = after1 - (after1 * f2.numerator) / f2.denominator;
      return {
        prompt: `A class completed ${fracStr(f1)} of ${total} problems, then ${fracStr(f2)} of the remainder. How many problems are still unfinished?`,
        answer: answerPayloadWhole(final),
        acceptedAnswers: [String(final)],
        solutionSteps: ['Find first completed part.', 'Find remainder.', 'Find second completed part from remainder.', `Final unfinished = ${final}.`],
      };
    }
    case 'F025': {
      if (familyId.endsWith('_005')) {
        const p = [10, 20, 25, 40, 50, 75][Math.abs(s) % 6];
        const askFraction = variant % 2 === 0;
        const f = simplifyFraction(p, 100);
        const dec = p / 100;
        return {
          prompt: askFraction
            ? `Express ${p}% as a fraction in simplest form.`
            : `Express ${p}% as a decimal.`,
          answer: askFraction ? answerPayloadFraction(f.numerator, f.denominator) : { type: 'decimal', value: dec, display: String(dec) },
          acceptedAnswers: askFraction ? [fracStr(f)] : [String(dec)],
          solutionSteps: ['Percent means out of 100.', askFraction ? `${p}/100 simplifies to ${fracStr(f)}.` : `${p}/100 = ${dec}.`],
        };
      }
      const a = frac(seq(s, 1, 4), 6);
      const b = frac(seq(s + 3, 1, 5), 8);
      const c = frac(seq(s + 5, 1, 5), 12);
      const ans = frac(a.numerator * lcm(lcm(a.denominator, b.denominator), c.denominator) / a.denominator +
        b.numerator * lcm(lcm(a.denominator, b.denominator), c.denominator) / b.denominator -
        c.numerator * lcm(lcm(a.denominator, b.denominator), c.denominator) / c.denominator,
        lcm(lcm(a.denominator, b.denominator), c.denominator));
      return {
        prompt: `Exam-style: Compute ${fracStr(a)} + ${fracStr(b)} - ${fracStr(c)}.`,
        answer: answerPayloadFraction(ans.numerator, ans.denominator),
        acceptedAnswers: [fracStr(ans)],
        solutionSteps: ['Find common denominator for all fractions.', 'Convert each fraction.', `Compute and simplify to ${fracStr(ans)}.`],
      };
    }
    case 'F026': {
      if (familyId.endsWith('_005')) {
        const y = seq(s, 2, 12);
        const asFraction = frac(3 + y, 5);
        if (variant % 2 === 0) {
          return {
            prompt: `If y = ${y}, evaluate (3 + y)/5 as a simplified fraction.`,
            answer: answerPayloadFraction(asFraction.numerator, asFraction.denominator),
            acceptedAnswers: [fracStr(asFraction)],
            solutionSteps: [`Substitute y = ${y}.`, `Compute 3 + ${y} = ${3 + y}.`, `Result is ${fracStr(asFraction)}.`],
          };
        }
        return {
          prompt: `Rewrite ${y} ÷ 5 in fraction form.`,
          answer: answerPayloadFraction(y, 5),
          acceptedAnswers: [`${y}/5`],
          solutionSteps: ['Division can be written as a fraction.', `${y} ÷ 5 = ${y}/5.`],
        };
      }
      const total = seq(s, 30, 90);
      const f = frac([1, 2, 3][Math.abs(s) % 3], [3, 4, 5][Math.abs(s + 1) % 3]);
      const ans = (total * f.numerator) / f.denominator;
      return {
        prompt: `Mastery challenge: ${fracStr(f)} of ${total} students passed. How many students passed?`,
        answer: answerPayloadWhole(ans),
        acceptedAnswers: [String(ans)],
        solutionSteps: [`Find 1/${f.denominator} of ${total}.`, `Multiply by ${f.numerator} to get ${ans}.`],
      };
    }
    default: {
      return {
        prompt: 'Placeholder fraction question.',
        answer: answerPayloadWhole(0),
        acceptedAnswers: ['0'],
        solutionSteps: ['Placeholder step.'],
      };
    }
  }
}

export function generateFractionQuestion(options = {}) {
  const {
    skillId,
    questionFamilyId,
    difficulty = 2,
    mode = 'practice',
    variant = 0,
  } = options;
  if (!getSkill(skillId)) throw new Error(`Invalid skillId: ${skillId}`);
  const family = getQuestionFamily(questionFamilyId);
  if (!family) throw new Error(`Invalid questionFamilyId: ${questionFamilyId}`);

  const ctx = templateContext(skillId, questionFamilyId, difficulty, mode, variant);
  const payload = templateForSkill(skillId, variant % 3, ctx);
  const workingRequired = family.mentalMathEligible ? false : !!family.workingRequired;

  return buildQuestionCore({
    skillId,
    questionFamilyId,
    mode,
    difficulty,
    prompt: payload.prompt,
    answer: payload.answer,
    acceptedAnswers: payload.acceptedAnswers,
    workingRequired,
    mentalMathEligible: !!family.mentalMathEligible,
    solutionSteps: payload.solutionSteps,
    diagramSpec: payload.diagramSpec,
  });
}

export function generateFractionQuestionSet(options = {}) {
  const {
    skillId,
    questionFamilyIds = [],
    count = 5,
    mode = 'practice',
    difficulty = 2,
  } = options;
  const ids = questionFamilyIds.length ? questionFamilyIds : getQuestionFamiliesBySkill(skillId).map((f) => f.id);
  if (!ids.length) return [];
  return Array.from({ length: count }).map((_, i) =>
    generateFractionQuestion({
      skillId,
      questionFamilyId: ids[i % ids.length],
      difficulty,
      mode,
      variant: i,
    })
  );
}

export function generateDiagnosticQuestionSet(options = {}) {
  const { targetSkillIds = [], targetQuestionFamilyIds = [], mode = 'diagnostic' } = options;
  const bySkill = new Map();
  targetQuestionFamilyIds.forEach((qid) => {
    const f = getQuestionFamily(qid);
    if (!f) return;
    if (!bySkill.has(f.skillId)) bySkill.set(f.skillId, []);
    bySkill.get(f.skillId).push(qid);
  });
  const skills = targetSkillIds.length ? targetSkillIds : [...bySkill.keys()];
  return skills.flatMap((skillId, i) =>
    generateFractionQuestionSet({
      skillId,
      questionFamilyIds: bySkill.get(skillId) || getQuestionFamiliesBySkill(skillId).slice(0, 2).map((f) => f.id),
      count: 2,
      mode,
      difficulty: 2 + (i % 2),
    })
  );
}

export function generatePracticeQuestionSet(options = {}) {
  const { practiceQueue = [], count = 8 } = options;
  if (!practiceQueue.length) return [];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const row = practiceQueue[i % practiceQueue.length];
    const familyIds = row.questionFamilyIds || (row.questionFamilyId ? [row.questionFamilyId] : []);
    if (!familyIds.length) continue;
    out.push(
      generateFractionQuestion({
        skillId: row.skillId,
        questionFamilyId: familyIds[i % familyIds.length],
        difficulty: 2,
        mode: 'practice',
        variant: i,
      })
    );
  }
  return out;
}

export function generateFluencyQuestionSet(options = {}) {
  const { skillId, questionFamilyId, count = 10 } = options;
  return generateFractionQuestionSet({
    skillId,
    questionFamilyIds: [questionFamilyId],
    count,
    mode: 'fluency',
    difficulty: 1,
  }).map((q) => ({ ...q, estimatedSeconds: Math.max(6, q.estimatedSeconds - 5), marks: 1 }));
}

export function generateAssessmentQuestionSet(options = {}) {
  const { assessmentSession, count = 12 } = options;
  const families = assessmentSession?.targetQuestionFamilyIds || [];
  const skills = assessmentSession?.targetSkillIds || [];
  if (!skills.length || !families.length) return [];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const skillId = skills[i % skills.length];
    const familyId = families.find((fid) => getQuestionFamily(fid)?.skillId === skillId) || families[i % families.length];
    let generated = null;
    for (let attempt = 0; attempt < 4 && !generated; attempt += 1) {
      try {
        generated = generateFractionQuestion({
          skillId,
          questionFamilyId: familyId,
          difficulty: 2 + (i % 3),
          mode: 'assessment',
          variant: i + attempt * count,
        });
      } catch (err) {
        if (!/denominator/i.test(String(err?.message || ''))) throw err;
      }
    }
    if (generated) out.push(generated);
  }
  return out.map((q) => ({ ...q, marks: q.marks || 2 }));
}

export function checkFractionAnswer(options = {}) {
  const { studentAnswer, correctAnswer, acceptedAnswers = [] } = options;
  const normalizeListAnswer = (raw) => String(raw || '')
    .split(',')
    .map((part) => part.trim().replace(/\s+/g, ''))
    .filter(Boolean)
    .join(',');

  if (correctAnswer?.type === 'list') {
    const normalizedStudent = normalizeListAnswer(studentAnswer);
    const normalizedAccepted = [
      correctAnswer.display,
      ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : []),
    ].map(normalizeListAnswer);
    return {
      correct: normalizedAccepted.includes(normalizedStudent),
      normalizedStudentAnswer: normalizedStudent || null,
      normalizedCorrectAnswer: normalizeListAnswer(correctAnswer.display),
    };
  }

  const parsedStudent = parseAnswer(studentAnswer);
  const parsedCorrect = typeof correctAnswer === 'string'
    ? parseAnswer(correctAnswer)
    : correctAnswer?.type === 'fraction'
      ? parseAnswer(correctAnswer.display || `${correctAnswer.numerator}/${correctAnswer.denominator}`)
      : correctAnswer?.type === 'whole'
        ? parseAnswer(String(correctAnswer.whole))
        : correctAnswer?.type === 'mixed'
          ? parseAnswer(correctAnswer.display || `${correctAnswer.whole} ${correctAnswer.numerator}/${correctAnswer.denominator}`)
          : parseAnswer(String(correctAnswer?.display || correctAnswer || ''));

  const acceptedParsed = acceptedAnswers.map(parseAnswer).filter(Boolean);
  let correct = false;
  if (parsedStudent && parsedCorrect) {
    correct = parsedStudent.fraction.numerator * parsedCorrect.fraction.denominator ===
      parsedCorrect.fraction.numerator * parsedStudent.fraction.denominator;
  }
  if (!correct && parsedStudent) {
    correct = acceptedParsed.some((acc) =>
      parsedStudent.fraction.numerator * acc.fraction.denominator ===
      acc.fraction.numerator * parsedStudent.fraction.denominator
    );
  }
  return {
    correct,
    normalizedStudentAnswer: parsedStudent ? fracStr(parsedStudent.fraction) : null,
    normalizedCorrectAnswer: parsedCorrect ? fracStr(parsedCorrect.fraction) : null,
  };
}

export function validateFractionQuestionGenerator() {
  const skills = fractionSkillGraph.skillIds;
  const generatedBySkill = skills.map((skillId) => {
    const families = getQuestionFamiliesBySkill(skillId).slice(0, 3).map((f) => f.id);
    const set = generateFractionQuestionSet({ skillId, questionFamilyIds: families, count: 3, mode: 'practice' });
    return { skillId, set };
  });
  const allQuestions = generatedBySkill.flatMap((x) => x.set);

  const hasAllSkills = generatedBySkill.every((x) => x.set.length >= 3);
  const validSkillIds = allQuestions.every((q) => !!getSkill(q.skillId));
  const validFamilyIds = allQuestions.every((q) => !!getQuestionFamily(q.questionFamilyId));
  const hasAnswer = allQuestions.every((q) => q.answer && q.acceptedAnswers?.length);
  const hasSolutionSteps = allQuestions.every((q) => Array.isArray(q.solutionSteps) && q.solutionSteps.length > 0);
  const workingRuleCorrect = allQuestions.every((q) => {
    const f = getQuestionFamily(q.questionFamilyId);
    return f ? q.workingRequired === (f.mentalMathEligible ? false : !!f.workingRequired) : false;
  });
  const mentalRuleCorrect = allQuestions
    .filter((q) => getQuestionFamily(q.questionFamilyId)?.mentalMathEligible)
    .every((q) => q.workingRequired === false);
  const answerCheckFraction = checkFractionAnswer({ studentAnswer: '2/4', correctAnswer: '1/2', acceptedAnswers: [] }).correct;
  const answerCheckMixed = checkFractionAnswer({ studentAnswer: '1 2/3', correctAnswer: '5/3', acceptedAnswers: [] }).correct;
  const answerCheckWhole = checkFractionAnswer({ studentAnswer: '4', correctAnswer: '4', acceptedAnswers: [] }).correct;
  const assessmentHasMarks = generateAssessmentQuestionSet({
    assessmentSession: {
      targetSkillIds: ['F010', 'F018'],
      targetQuestionFamilyIds: ['QF_F010_001', 'QF_F018_001'],
    },
    count: 4,
  }).every((q) => q.marks > 0);
  const noZeroDenominator = allQuestions.every((q) => {
    const as = JSON.stringify(q.answer);
    return !/"denominator":0/.test(as);
  });

  return {
    isValid:
      hasAllSkills &&
      validSkillIds &&
      validFamilyIds &&
      hasAnswer &&
      hasSolutionSteps &&
      workingRuleCorrect &&
      mentalRuleCorrect &&
      answerCheckFraction &&
      answerCheckMixed &&
      answerCheckWhole &&
      assessmentHasMarks &&
      noZeroDenominator,
    checks: {
      hasAllSkills,
      validSkillIds,
      validFamilyIds,
      hasAnswer,
      hasSolutionSteps,
      workingRuleCorrect,
      mentalRuleCorrect,
      answerCheckFraction,
      answerCheckMixed,
      answerCheckWhole,
      assessmentHasMarks,
      noZeroDenominator,
    },
    sampleQuestions: {
      F001: generateFractionQuestion({ skillId: 'F001', questionFamilyId: 'QF_F001_001', difficulty: 1, mode: 'practice' }),
      F010: generateFractionQuestion({ skillId: 'F010', questionFamilyId: 'QF_F010_001', difficulty: 2, mode: 'practice' }),
      F018: generateFractionQuestion({ skillId: 'F018', questionFamilyId: 'QF_F018_001', difficulty: 3, mode: 'practice' }),
      F022: generateFractionQuestion({ skillId: 'F022', questionFamilyId: 'QF_F022_001', difficulty: 4, mode: 'assessment' }),
      F025: generateFractionQuestion({ skillId: 'F025', questionFamilyId: 'QF_F025_001', difficulty: 4, mode: 'assessment' }),
    },
  };
}

export const fractionQuestionGenerator = {
  generateFractionQuestion,
  generateFractionQuestionSet,
  generateDiagnosticQuestionSet,
  generatePracticeQuestionSet,
  generateFluencyQuestionSet,
  generateAssessmentQuestionSet,
  checkFractionAnswer,
  validateFractionQuestionGenerator,
};

export default fractionQuestionGenerator;
