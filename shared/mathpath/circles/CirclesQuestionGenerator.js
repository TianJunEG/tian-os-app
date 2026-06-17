import { getSkill } from './CirclesSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './CirclesQuestionFamilies.js';

// MathPath — Circles question generator.
//
// Rebuilt for question quality (P2 — see MATHPATH_QUESTION_QUALITY_AUDIT.md).
// Fixes the boilerplate worked solutions, unrounded "float garbage" distractors,
// missing semicircle/quarter-circle PERIMETER, and absent π selection. Now:
//   • π = 22/7 when the radius is a multiple of 7 (exact answers), else 3.14.
//   • Every answer is rounded to 2 d.p. and carries its unit (cm / cm²).
//   • Semicircle / quarter-circle perimeter includes the straight edges.
//   • Distractors encode real misconceptions (r↔d, area↔circumference,
//     arc-only perimeter, used-diameter-in-area).
//   • Worked solutions show the formula, the π used and the substitution.

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────────────
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function makeRng(seedStr) {
  let a = hashSeed(seedStr);
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rint(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
function pick(rng, arr) { return arr[rint(rng, 0, arr.length - 1)]; }
function round2(v) { return Math.round(v * 100) / 100; }
function fmtVal(v, unit = '') { return unit ? `${v} ${unit}` : `${v}`; }

// Choose π and a radius so answers stay clean: 22/7 wants a multiple of 7.
function radiusAndPi(rng) {
  if (rng() < 0.4) return { r: pick(rng, [7, 14, 21]), pi: 22 / 7, piStr: '22/7' };
  return { r: pick(rng, [2, 3, 4, 5, 6, 8, 10]), pi: 3.14, piStr: '3.14' };
}

// ── Envelope builders ────────────────────────────────────────────────────────
function shortAnswer({ family, prompt, answerDisplay, solutionSteps, misconceptionTag, difficulty, mode, diagram }) {
  return {
    id: `${family.id}#${mode}`, skillId: family.skillId, questionFamilyId: family.id,
    type: 'short_answer', prompt, choices: [],
    answer: { display: answerDisplay, value: answerDisplay }, acceptedAnswers: [answerDisplay],
    solutionSteps, misconceptionTag, difficulty, mode,
    workingRequired: family.workingRequired, generatorKind: family.generatorKind,
    ...(diagram ? { diagram } : {}),
  };
}
function mcqFrom({ family, prompt, answerDisplay, q, solutionSteps, misconceptionTag, difficulty, mode, rng, diagram }) {
  const opts = [String(answerDisplay)];
  const seen = new Set(opts);
  for (const d of q.distractors || []) {
    const r = round2(d);
    const disp = fmtVal(r, q.unit || '');
    if (!seen.has(disp) && r > 0) { seen.add(disp); opts.push(disp); }
  }
  const base = Number(q.value);
  const deltas = [1, -1, 2, -2, 0.5, -0.5, 5, -5];
  for (let i = 0; opts.length < 4 && i < deltas.length && Number.isFinite(base); i++) {
    const v = round2(base + deltas[i]);
    if (v <= 0) continue;
    const disp = fmtVal(v, q.unit || '');
    if (!seen.has(disp)) { seen.add(disp); opts.push(disp); }
  }
  const choices = opts.slice(0, 4);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rint(rng, 0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    id: `${family.id}#${mode}`, skillId: family.skillId, questionFamilyId: family.id,
    type: 'mcq', prompt, choices,
    answer: { display: answerDisplay, value: answerDisplay }, acceptedAnswers: [answerDisplay],
    solutionSteps, misconceptionTag, difficulty, mode,
    workingRequired: family.workingRequired, generatorKind: family.generatorKind,
    ...(diagram ? { diagram } : {}),
  };
}

const CI = (n) => `CI${String(n).padStart(3, '0')}`;
const round = (note) => (note ? ` (round to 2 d.p.)` : '');

const BUILDERS = {
  // CI001 — Parts of a circle: radius ↔ diameter
  [CI(1)]: (rng) => {
    const r = pick(rng, [3, 4, 5, 6, 7, 8, 10, 12]);
    const toDiameter = rng() < 0.5;
    if (toDiameter) {
      return { prompt: `The radius of a circle is ${r} cm. What is its diameter?`, value: 2 * r, unit: 'cm', tag: 'cir/radius-diameter',
        steps: ['Diameter = 2 × radius.', `2 × ${r} = ${2 * r} cm.`], distractors: [r, 4 * r, r / 2], diagram: { kind: 'circle', radius: r, label: 'radius' } };
    }
    return { prompt: `The diameter of a circle is ${2 * r} cm. What is its radius?`, value: r, unit: 'cm', tag: 'cir/radius-diameter',
      steps: ['Radius = diameter ÷ 2.', `${2 * r} ÷ 2 = ${r} cm.`], distractors: [2 * r, 4 * r, r + 1], diagram: { kind: 'circle', radius: r, label: 'diameter' } };
  },
  // CI002 — Circumference
  [CI(2)]: (rng) => {
    const { r, pi, piStr } = radiusAndPi(rng);
    const ans = round2(2 * pi * r);
    const note = piStr === '3.14';
    return { prompt: `Find the circumference of a circle with radius ${r} cm. (Use π = ${piStr}.)${round(note)}`,
      value: ans, unit: 'cm', tag: 'cir/radius-diameter',
      steps: [`Circumference = 2 × π × r.`, `= 2 × ${piStr} × ${r} = ${ans} cm.`],
      distractors: [round2(pi * r * r), round2(pi * r), round2(2 * pi * (2 * r))], diagram: { kind: 'circle', radius: r } };
  },
  // CI003 — Area
  [CI(3)]: (rng) => {
    const { r, pi, piStr } = radiusAndPi(rng);
    const ans = round2(pi * r * r);
    const note = piStr === '3.14';
    return { prompt: `Find the area of a circle with radius ${r} cm. (Use π = ${piStr}.)${round(note)}`,
      value: ans, unit: 'cm²', tag: 'cir/area-uses-diameter',
      steps: [`Area = π × r × r.`, `= ${piStr} × ${r} × ${r} = ${ans} cm².`],
      distractors: [round2(2 * pi * r), round2(pi * (2 * r) * (2 * r)), r * r], diagram: { kind: 'circle', radius: r } };
  },
  // CI004 — Semicircles and quarter-circles (area AND perimeter)
  [CI(4)]: (rng) => {
    const { r, pi, piStr } = radiusAndPi(rng);
    const quarter = rng() < 0.5;
    const wantPerimeter = rng() < 0.5;
    const note = piStr === '3.14';
    const fraction = quarter ? 'quarter-circle' : 'semicircle';
    if (wantPerimeter) {
      // perimeter = fraction of circumference + the straight edge(s)
      const arc = quarter ? round2(2 * pi * r / 4) : round2(2 * pi * r / 2);
      const straight = quarter ? 2 * r : 2 * r; // quarter: two radii; semicircle: the diameter
      const ans = round2(arc + straight);
      return { prompt: `Find the perimeter of a ${fraction} with radius ${r} cm. Remember to include the straight edge${quarter ? 's' : ''}. (Use π = ${piStr}.)${round(note)}`,
        value: ans, unit: 'cm', tag: 'cir/perimeter-arc-only',
        steps: [`Curved part = ${quarter ? '¼' : '½'} of the circumference = ${arc} cm.`, `Straight edge${quarter ? 's = 2 × radius' : ' = diameter'} = ${straight} cm.`, `Perimeter = ${arc} + ${straight} = ${ans} cm.`],
        distractors: [arc, round2(2 * pi * r), round2((quarter ? pi * r * r / 4 : pi * r * r / 2))], diagram: { kind: 'circle-part', part: fraction, radius: r } };
    }
    const ans = quarter ? round2(pi * r * r / 4) : round2(pi * r * r / 2);
    return { prompt: `Find the area of a ${fraction} with radius ${r} cm. (Use π = ${piStr}.)${round(note)}`,
      value: ans, unit: 'cm²', tag: 'cir/half-wrong',
      steps: [`Area of the whole circle = π × r × r = ${round2(pi * r * r)} cm².`, `Take ${quarter ? '¼' : '½'} of it = ${ans} cm².`],
      distractors: [round2(pi * r * r), quarter ? round2(pi * r * r / 2) : round2(pi * r * r / 4), round2(2 * pi * r)], diagram: { kind: 'circle-part', part: fraction, radius: r } };
  },
};

function runBuilder(skillId, rng, variant) {
  const build = BUILDERS[skillId];
  return build ? build(rng, variant) : null;
}
function makePractice(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return shortAnswer({
      family, prompt: q.prompt, answerDisplay: fmtVal(q.value, q.unit || ''),
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', diagram: q.diagram,
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return mcqFrom({
      family, prompt: q.prompt, answerDisplay: fmtVal(q.value, q.unit || ''), q,
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng, diagram: q.diagram,
    });
  };
}

// Families: cirParts/cirPartsMCQ, then <kind>/<kind>Word for CI002–CI004.
const GENERATORS = {
  cirParts: makePractice(CI(1)), cirPartsMCQ: makeMCQ(CI(1)),
  cirCircumference: makePractice(CI(2)), cirCircumferenceWord: makeMCQ(CI(2)),
  cirArea: makePractice(CI(3)), cirAreaWord: makeMCQ(CI(3)),
  cirSemiQuarter: makePractice(CI(4)), cirSemiQuarterWord: makeMCQ(CI(4)),
};

export function generateCirclesQuestionSet({ skillId, count = 6, mode = 'practice' }) {
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return [];
  const questions = [];
  let variant = 0;
  for (let i = 0; i < count; i++) {
    const family = families[i % families.length];
    const rng = makeRng(`${skillId}-${family.id}-${variant}`);
    const gen = GENERATORS[family.generatorKind];
    if (gen) questions.push(gen(family, rng, variant));
    variant++;
  }
  return questions;
}

// Unit-tolerant numeric compare.
export function checkCirclesAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const raw = String(studentResponse).trim().toLowerCase();
  const exp = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  if (raw === exp) return { correct: true };
  const stripUnits = (s) => s.replace(/cm³|cm3|cm²|cm2|cm|m²|m2|m/g, '');
  const digits = (s) => stripUnits(s).replace(/[^0-9.\-]/g, '');
  const a = digits(raw), b = digits(exp);
  if (a !== '' && a === b) return { correct: true };
  const na = parseFloat(a), nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return { correct: true };
  return { correct: false };
}

export default { generateCirclesQuestionSet, checkCirclesAnswer };
