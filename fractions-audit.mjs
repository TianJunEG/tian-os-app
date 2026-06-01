import { generateQuestionsForSkill } from './services/mathpath/fractionContentGenerationEngine.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './frontend/src/mathpath/fractions/fractionQuestionFamilies.js';
import { fractionSkillGraph, getSkill } from './frontend/src/mathpath/fractions/fractionSkillGraph.js';

const ordinalWords = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};

function gcd(a, b) {
  let x = Math.abs(a || 0), y = Math.abs(b || 0);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}
function simplify(n, d) {
  if (d === 0) return { n: 0, d: 0, valid: false };
  const sign = d < 0 ? -1 : 1;
  const nn = n * sign;
  const dd = Math.abs(d);
  const g = gcd(nn, dd);
  return { n: nn / g, d: dd / g, valid: true };
}
function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}
function parseTextAnswer(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (['>', '<', '='].includes(s)) return { kind: 'symbol', text: s };
  const mMix = s.match(/^(\-?\d+)\s+(\d+)\/(\d+)$/);
  if (mMix) {
    return {
      kind: 'frac',
      ...simplify((Number(mMix[1]) * Number(mMix[3]) + Math.sign(Number(mMix[1])) * Number(mMix[2])), Number(mMix[3])),
    };
  }
  const mFrac = s.match(/^(\-?\d+)\/(\-?\d+)$/);
  if (mFrac) {
    return { kind: 'frac', ...simplify(Number(mFrac[1]), Number(mFrac[2])) };
  }
  const mInt = s.match(/^(\-?\d+)$/);
  if (mInt) return { kind: 'int', value: Number(mInt[1]) };
  const mDec = s.match(/^(\-?\d+)\.(\d+)$/);
  if (mDec) {
    const den = 10 ** mDec[2].length;
    const num = Number(s) * den;
    return { kind: 'frac', ...simplify(num, den) };
  }
  return { kind: 'other', text: s.toLowerCase() };
}
function parseAnswerLike(v) {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return parseTextAnswer(v);
  if (v.type === 'list') {
    const listSource = Array.isArray(v.value)
      ? v.value
      : typeof v.display === 'string'
        ? v.display.split(',').map((x) => x.trim()).filter(Boolean)
        : [];
    const parsedList = listSource.map(parseTextAnswer).filter((x) => x && x.kind === 'frac').map((x) => `${x.n}/${x.d}`);
    if (!parsedList.length) return null;
    return { kind: 'list', values: parsedList };
  }
  if (v.type === 'fraction') return { kind: 'frac', ...simplify(Number(v.numerator), Number(v.denominator)) };
  if (v.type === 'whole') return { kind: 'int', value: Number(v.whole) };
  if (v.type === 'mixed') return { kind: 'frac', ...simplify(Number(v.whole) * Number(v.denominator) + Number(v.numerator), Number(v.denominator)) };
  if (v.type === 'text') return parseTextAnswer(v.display || v.value || '');
  if (v.display !== undefined) return parseTextAnswer(v.display);
  return parseTextAnswer(String(v));
}
function sameCanonical(a, b) {
  if (!a || !b) return false;
  if (a.kind === 'frac' && b.kind === 'frac') return a.valid && b.valid && a.n === b.n && a.d === b.d;
  if (a.kind === 'int' && b.kind === 'int') return a.value === b.value;
  if (a.kind === 'symbol' && b.kind === 'symbol') return a.text === b.text;
  if (a.kind === 'list' && b.kind === 'list') {
    if (a.values.length !== b.values.length) return false;
    return a.values.every((value, idx) => value === b.values[idx]);
  }
  return false;
}
function parseExpected(prompt) {
  const t = String(prompt || '');
  const p = t.trim();
  let m;
  if ((m = p.match(/^A shape is split into (\d+) equal parts\. (\d+) part\(s\) are shaded\. What fraction is shaded\?$/))) {
    return { kind: 'frac', ...simplify(Number(m[2]), Number(m[1])) };
  }
  if ((m = p.match(/^A bar is split into (\d+) equal parts\. (\d+) parts are shaded\. How many parts are shaded\?$/))) {
    return { kind: 'int', value: Number(m[2]) };
  }
  if ((m = p.match(/^A bar is split into (\d+) equal parts\. (\d+) parts are shaded\. How many equal parts are in the whole bar\?$/))) {
    return { kind: 'int', value: Number(m[1]) };
  }
  if ((m = p.match(/^A set has (\d+) objects\. (\d+)\/(\d+) of them are selected\. How many are selected\?$/))) {
    const total = Number(m[1]), n = Number(m[2]), d = Number(m[3]);
    return total % d === 0 ? { kind: 'int', value: total * n / d } : null;
  }
  if ((m = p.match(/^On a number line from 0 to 1 (?:split into|divided into) (\d+) equal parts, what fraction is at the (.*?) mark after 0\?$/))) {
    const d = Number(m[1]);
    const ord = String(m[2]).toLowerCase().trim();
    const n = ordinalWords[ord] || Number(ord.replace(/\D/g, ''));
    if (!n || !d) return null;
    return { kind: 'frac', ...simplify(n, d) };
  }
  if ((m = p.match(/^Which is greater: 1\/(\d+) or 1\/(\d+)\?$/))) {
    const left = simplify(1, Number(m[1]));
    const right = simplify(1, Number(m[2]));
    if (!left.valid || !right.valid) return null;
    if (left.n / left.d === right.n / right.d) return { kind: 'symbol', text: '=' };
    return { kind: 'symbol', text: left.n / left.d > right.n / right.d ? '>' : '<' };
  }
  if ((m = p.match(/^Which is greater: (\d+)\/(\d+) or (\d+)\/(\d+)\?$/))) {
    const left = simplify(Number(m[1]), Number(m[2]));
    const right = simplify(Number(m[3]), Number(m[4]));
    if (!left.valid || !right.valid) return null;
    if (left.n / left.d === right.n / right.d) return { kind: 'symbol', text: '=' };
    return { kind: 'symbol', text: left.n / left.d > right.n / right.d ? '>' : '<' };
  }
  if ((m = p.match(/^Order these fractions from smallest to largest: (.+)\.$/))) {
    const parts = m[1].split(',').map((x) => x.trim()).filter(Boolean).map(parseTextAnswer).filter((x) => x && x.kind === 'frac');
    if (parts.length < 2) return null;
    const sorted = [...parts].sort((x, y) => (x.n * y.d - y.n * x.d));
    return { kind: 'list', values: sorted.map((f) => `${f.n}/${f.d}`) };
  }
  if ((m = p.match(/^Fill in the correct symbol: (\d+)\/(\d+) __ (\d+)\/(\d+)$/))) {
    const left = simplify(Number(m[1]), Number(m[2]));
    const right = simplify(Number(m[3]), Number(m[4]));
    if (!left.valid || !right.valid) return null;
    if (left.n === right.n && left.d === right.d) return { kind: 'symbol', text: '=' };
    return { kind: 'symbol', text: left.n * right.d > right.n * left.d ? '>' : '<' };
  }
  if ((m = p.match(/^Complete: (\d+)\/(\d+) = \?\/(\d+)$/))) {
    const numerator = (Number(m[1]) * Number(m[3])) / Number(m[2]);
    return { kind: 'frac', ...simplify(numerator, Number(m[3])) };
  }
  if ((m = p.match(/^Write one equivalent fraction for (\d+)\/(\d+)\.?$/))) {
    return { kind: 'frac', ...simplify(Number(m[1]) * 2, Number(m[2]) * 2) };
  }
  if ((m = p.match(/^A model shows (\d+)\/(\d+) and (\d+)\/(\d+)\. Which fraction is greater \(or equal if same\)\?$/))) {
    const left = simplify(Number(m[1]), Number(m[2]));
    const right = simplify(Number(m[3]), Number(m[4]));
    if (!left.valid || !right.valid) return null;
    if (left.n === right.n && left.d === right.d) return { kind: 'symbol', text: '=' };
    return { kind: 'symbol', text: left.n / left.d > right.n / right.d ? '>' : '<' };
  }
  if ((m = p.match(/^Simplify (\d+)\/(\d+) to lowest terms\.?$/))) {
    return { kind: 'frac', ...simplify(Number(m[1]), Number(m[2])) };
  }
  if ((m = p.match(/^Write (\d+)\/(\d+) as a mixed number\.?$/))) {
    return { kind: 'frac', ...simplify(Number(m[1]), Number(m[2])) };
  }
  if ((m = p.match(/^Write the mixed number shown: (\d+) (\d+)\/(\d+)\.$/))) {
    return { kind: 'frac', ...simplify(Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3])) };
  }
  if ((m = p.match(/^Compute: (\d+)\/(\d+) ([+\-]) (\d+)\/(\d+)$/))) {
    const aN = Number(m[1]), aD = Number(m[2]), op = m[3], bN = Number(m[4]), bD = Number(m[5]);
    const cd = lcm(aD, bD);
    const left = aN * (cd / aD);
    const right = bN * (cd / bD);
    return { kind: 'frac', ...simplify(op === '+' ? left + right : left - right, cd) };
  }
  if ((m = p.match(/^Compute and give your answer as a simplified fraction: (\d+)\/(\d+) × (\d+)$/))) {
    return { kind: 'frac', ...simplify(Number(m[1]) * Number(m[3]), Number(m[2])) };
  }
  if ((m = p.match(/^Compute: (\d+)\/(\d+) × (\d+)$/))) {
    return { kind: 'frac', ...simplify(Number(m[1]) * Number(m[3]), Number(m[2])) };
  }
  if ((m = p.match(/^Compute: (\d+)\/(\d+) ÷ (\d+)\/(\d+)$/))) {
    return { kind: 'frac', ...simplify(Number(m[1]) * Number(m[4]), Number(m[2]) * Number(m[3])) };
  }
  if ((m = p.match(/^Find (\d+)\/(\d+) of (\d+)\.$/))) {
    return { kind: 'int', value: Number(m[1]) * Number(m[3]) / Number(m[2]) };
  }
  return null;
}

function normalizeAccepted(answers) {
  const arr = Array.isArray(answers) ? answers : [];
  const out = arr
    .flatMap((x) => {
      const parsed = parseTextAnswer(x);
      if (parsed) return [parsed];
      if (typeof x !== 'string') return [];
      const expanded = String(x)
        .split(',')
        .map((item) => parseTextAnswer(item.trim()))
        .filter(Boolean);
      return expanded;
    })
    .filter(Boolean)
    .map((x) => {
      if (x.kind === 'frac') return `${x.n}/${x.d}`;
      if (x.kind === 'int') return `i:${x.value}`;
      if (x.kind === 'symbol') return `s:${x.text}`;
      return `o:${x.text}`;
    });
  return [...new Set(out)];
}

const results = [];
const dupMap = new Map();
for (const skillId of fractionSkillGraph.skillIds) {
  const skill = getSkill(skillId);
  const validFamilies = new Set((getQuestionFamiliesBySkill(skillId) || []).map((f) => f.id));
  const qs = generateQuestionsForSkill(skillId, { categories: ['diagnostic'], targetByCategory: { diagnostic: 10 } });
  for (const q of qs) {
    const issues = [];
    const prompt = String(q.prompt || '');

    if (!q.answer) issues.push({ issue: 'Missing answer payload', severity: 'high', fix: 'Populate answer in generator payload.' });
    if (!q.finalAnswer || !String(q.finalAnswer).trim()) issues.push({ issue: 'Missing finalAnswer', severity: 'high', fix: 'Set finalAnswer from canonical answer display.' });
    if (!Array.isArray(q.acceptedAnswers) || !q.acceptedAnswers.length) issues.push({ issue: 'Accepted answers missing', severity: 'high', fix: 'Populate acceptedAnswers with final answer or equivalent canonical forms.' });

    const canonicalAccepted = normalizeAccepted(q.acceptedAnswers);
    if (canonicalAccepted.length > 1) {
      issues.push({ issue: 'Multiple distinct accepted answers', severity: 'low', fix: 'Keep one canonical correct answer unless explicitly allowing alternatives.' });
    }

    const expected = parseExpected(prompt);
    const observed = parseAnswerLike(q.answer);
    if (expected && observed) {
      if (!sameCanonical(expected, observed)) {
        issues.push({ issue: 'Answer does not match stem math', severity: 'high', fix: 'Align template computation and answer generation logic.' });
      }
    }

    const family = getQuestionFamily(q.questionFamilyId);
    const skillNode = skill || {};
    const expectedMin = Math.max(1, (family?.difficulty || skillNode.difficulty || 3) - 1);
    const expectedMax = Math.min(5, (family?.difficulty || skillNode.difficulty || 3) + 1);
    if (q.difficultyLevel < expectedMin || q.difficultyLevel > expectedMax) {
      issues.push({ issue: `Difficulty ${q.difficultyLevel} outside skill/family band (${expectedMin}-${expectedMax})`, severity: 'medium', fix: 'Adjust difficultyLevel selection for this family in category config.' });
    }

    const d = q.diagramSpec;
    if (d?.type === 'fraction_bar') {
      const parts = Number(d.data?.parts), shaded = Number(d.data?.shaded);
      if (!Number.isInteger(parts) || !Number.isInteger(shaded) || parts <= 0 || shaded < 0 || shaded > parts) {
        issues.push({ issue: 'fraction_bar diagram data invalid', severity: 'medium', fix: 'Ensure parts and shaded are positive integers with shaded <= parts.' });
      }
    }
    if (d?.type === 'number_line') {
      const steps = Number(d.data?.minStepCount);
      if (!Number.isInteger(steps) || steps <= 0) {
        issues.push({ issue: 'number_line diagram invalid', severity: 'low', fix: 'Set minStepCount to positive integer matching denominator.' });
      }
    }

    if (!q.questionFamilyId || !validFamilies.has(q.questionFamilyId)) {
      issues.push({ issue: 'Invalid questionFamilyId', severity: 'high', fix: 'Map each question to a known family in fractionQuestionFamilies.' });
    }
    if (!prompt || prompt.length < 10) {
      issues.push({ issue: 'Prompt too short/unclear', severity: 'low', fix: 'Improve wording clarity with explicit quantities and verbs.' });
    }

    const dupKey = `${q.skillId}|${q.questionFamilyId}|${prompt}`;
    if (dupMap.has(dupKey)) {
      issues.push({ issue: 'Duplicate question stem', severity: 'medium', fix: 'Diversify deterministic variants per family to avoid duplicated stems.' });
    } else {
      dupMap.set(dupKey, 1);
    }

    // notation checks
    if (/\\frac|\u200b/.test(prompt) || /\\frac|\u200b/.test(JSON.stringify(q.answer))) {
      issues.push({ issue: 'Potentially malformed fraction notation', severity: 'low', fix: 'Keep plain numerals with slash/space for mixed numbers.' });
    }

    results.push({
      skillId,
      questionId: String(q.sourceQuestionId || q.questionId || 'unknown'),
      familyId: q.questionFamilyId,
      issueCount: issues.length,
      issues,
      prompt,
    });
  }
}

const flagged = results.filter((r) => r.issueCount > 0);
const grouped = flagged.reduce((acc, r) => { acc[r.skillId] = (acc[r.skillId] || 0) + 1; return acc; }, {});

console.log(JSON.stringify({
  totalQuestions: results.length,
  flaggedQuestions: flagged.length,
  bySkill: grouped,
  rows: flagged,
}, null, 2));
