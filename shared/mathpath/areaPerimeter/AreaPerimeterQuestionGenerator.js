import { getSkill } from './AreaPerimeterSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './AreaPerimeterQuestionFamilies.js';

// MathPath — Area & Perimeter question generator.
//
// Rebuilt for question quality (P2 — see MATHPATH_QUESTION_QUALITY_AUDIT.md).
// Replaces boilerplate worked solutions, answer±random distractors and the
// figure-less composite items. Now every item carries a figure, real worked
// solution and misconception distractors, with units (cm / cm²). Composite
// shapes are internally consistent (the L-shape answer is the sum of its own
// printed sides; the composite area subtracts a genuine cut-out). Builds on the
// P0 fixes to the L-shape perimeter and the real-world cost item.

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
  const fmt = (v) => (q.money ? `$${Number(v).toFixed(2)}` : fmtVal(round2(v), q.unit || ''));
  const opts = [String(answerDisplay)];
  const seen = new Set(opts);
  for (const d of q.distractors || []) {
    const r = round2(d);
    const disp = fmt(r);
    if (!seen.has(disp) && r > 0) { seen.add(disp); opts.push(disp); }
  }
  const base = Number(q.value);
  const deltas = [1, -1, 2, -2, 5, -5, 10, -10];
  for (let i = 0; opts.length < 4 && i < deltas.length && Number.isFinite(base); i++) {
    const v = round2(base + deltas[i]);
    if (v <= 0) continue;
    const disp = fmt(v);
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

const AP = (n) => `AP${String(n).padStart(3, '0')}`;

const BUILDERS = {
  // AP001 — Perimeter of rectangles and squares
  [AP(1)]: (rng) => {
    const square = rng() < 0.4;
    if (square) {
      const s = rint(rng, 3, 20);
      return { prompt: `A square has sides of ${s} cm. What is its perimeter?`, value: 4 * s, unit: 'cm', tag: 'ap/perimeter-area-confuse',
        steps: ['Perimeter of a square = 4 × side.', `4 × ${s} = ${4 * s} cm.`], distractors: [s * s, 2 * s, s * 4 + s], diagram: { kind: 'square', side: s } };
    }
    const l = rint(rng, 4, 20), w = rint(rng, 3, 15);
    return { prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter?`, value: 2 * (l + w), unit: 'cm', tag: 'ap/perimeter-area-confuse',
      steps: ['Perimeter = 2 × (length + width).', `2 × (${l} + ${w}) = ${2 * (l + w)} cm.`], distractors: [l * w, l + w, 2 * l + w], diagram: { kind: 'rectangle', l, w } };
  },
  // AP002 — Perimeter of composite (L-shape): answer is the sum of its own sides
  [AP(2)]: (rng) => {
    const W = rint(rng, 8, 16), H = rint(rng, 6, 12);
    const w = rint(rng, 2, W - 4), h = rint(rng, 2, H - 3);
    const sides = [W, H - h, w, h, W - w, H]; // clockwise outline of the L
    const perim = sides.reduce((a, b) => a + b, 0); // = 2(W+H)
    return { prompt: `An L-shaped figure has these sides, in order: ${sides.join(' cm, ')} cm. What is its perimeter?`, value: perim, unit: 'cm', tag: 'ap/missing-side',
      steps: ['Add the lengths of all the sides.', `${sides.join(' + ')} = ${perim} cm.`],
      distractors: [perim - sides[2], perim - sides[2] - sides[3], W * H], diagram: { kind: 'l-shape', W, H, notch: [w, h] } };
  },
  // AP003 — Area of rectangles and squares
  [AP(3)]: (rng) => {
    const square = rng() < 0.4;
    if (square) {
      const s = rint(rng, 3, 18);
      return { prompt: `A square has sides of ${s} cm. What is its area?`, value: s * s, unit: 'cm²', tag: 'ap/perimeter-area-confuse',
        steps: ['Area of a square = side × side.', `${s} × ${s} = ${s * s} cm².`], distractors: [4 * s, 2 * s, s * s + s], diagram: { kind: 'square', side: s } };
    }
    const l = rint(rng, 4, 18), w = rint(rng, 3, 12);
    return { prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its area?`, value: l * w, unit: 'cm²', tag: 'ap/perimeter-area-confuse',
      steps: ['Area = length × width.', `${l} × ${w} = ${l * w} cm².`], distractors: [2 * (l + w), l + w, l * w + l], diagram: { kind: 'rectangle', l, w, unit: 'cm' } };
  },
  // AP004 — Area of triangles
  [AP(4)]: (rng) => {
    const b = pick(rng, [4, 6, 8, 10, 12, 14]), h = pick(rng, [3, 5, 6, 7, 9]);
    const area = round2(b * h / 2);
    return { prompt: `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area?`, value: area, unit: 'cm²', tag: 'ap/triangle-no-half',
      steps: ['Area of a triangle = ½ × base × height.', `½ × ${b} × ${h} = ${area} cm².`], distractors: [b * h, b + h, round2(b * h / 2) + b], diagram: { kind: 'triangle', base: b, height: h } };
  },
  // AP005 — Area of composite figures (rectangle with a corner cut out)
  [AP(5)]: (rng) => {
    const W = rint(rng, 8, 16), H = rint(rng, 6, 12);
    const w = rint(rng, 2, W - 4), h = rint(rng, 2, H - 3);
    const area = W * H - w * h;
    return { prompt: `An L-shaped figure is made from a ${W} cm by ${H} cm rectangle with a ${w} cm by ${h} cm rectangle cut out of one corner. What is its area?`, value: area, unit: 'cm²', tag: 'ap/overlap-region',
      steps: [`Whole rectangle = ${W} × ${H} = ${W * H} cm².`, `Cut-out = ${w} × ${h} = ${w * h} cm².`, `Area = ${W * H} − ${w * h} = ${area} cm².`],
      distractors: [W * H, W * H + w * h, w * h], diagram: { kind: 'l-shape', W, H, notch: [w, h] } };
  },
  // AP006 — Perimeter and area in real-world contexts
  [AP(6)]: (rng) => {
    const l = rint(rng, 4, 15), w = rint(rng, 3, 10);
    if (rng() < 0.5) {
      const cost = rint(rng, 2, 8);
      const ans = 2 * (l + w) * cost;
      return { prompt: `A rectangular garden is ${l} m long and ${w} m wide. Fencing costs $${cost} per metre. Find the total cost to fence all the way around.`, value: ans, money: true, tag: 'mea/area-units',
        steps: [`Perimeter = 2 × (${l} + ${w}) = ${2 * (l + w)} m.`, `Cost = ${2 * (l + w)} × $${cost} = $${ans}.`],
        distractors: [l * w * cost, 2 * (l + w), l * w], diagram: { kind: 'rectangle', l, w, unit: 'm' } };
    }
    const ans = l * w;
    return { prompt: `A rectangular room is ${l} m long and ${w} m wide. How many square metres of carpet are needed to cover the floor?`, value: ans, unit: 'm²', tag: 'mea/area-units',
      steps: ['Area = length × width.', `${l} × ${w} = ${ans} m².`], distractors: [2 * (l + w), l + w, l * w + l], diagram: { kind: 'rectangle', l, w, unit: 'm' } };
  },

  // ── Secondary 1 (G1) — Mensuration ──────────────────────────────────────────
  // AP007 — Area of a parallelogram = base × perpendicular height
  [AP(7)]: (rng) => {
    const b = rint(rng, 4, 18), h = rint(rng, 3, 12), slant = h + rint(rng, 1, 4);
    const ans = b * h;
    return { prompt: `A parallelogram has a base of ${b} cm and a perpendicular height of ${h} cm (its slanting side is ${slant} cm). What is its area?`,
      value: ans, unit: 'cm²', tag: 'mea/use-slant-side',
      steps: ['Area of a parallelogram = base × perpendicular height (not the slant side).', `${b} × ${h} = ${ans} cm².`],
      distractors: [b * slant, 2 * (b + h), b + h], diagram: { kind: 'parallelogram', base: b, height: h, slant } };
  },
  // AP008 — Area of a trapezium = ½(a + b) × height
  [AP(8)]: (rng) => {
    // Make ½(a+b) an integer so the area is whole.
    let a = rint(rng, 4, 14), b = rint(rng, 4, 14);
    if ((a + b) % 2 !== 0) b += 1;
    const h = rint(rng, 3, 12);
    const ans = ((a + b) / 2) * h;
    return { prompt: `A trapezium has parallel sides of ${a} cm and ${b} cm, and a height of ${h} cm. What is its area?`,
      value: ans, unit: 'cm²', tag: 'mea/trapezium-no-half',
      steps: ['Area of a trapezium = ½ × (sum of the parallel sides) × height.', `½ × (${a} + ${b}) × ${h} = ${(a + b) / 2} × ${h} = ${ans} cm².`],
      distractors: [(a + b) * h, a * b, ((a + b) / 2) + h], diagram: { kind: 'trapezium', a, b, height: h } };
  },
};

function runBuilder(skillId, rng, variant) {
  const build = BUILDERS[skillId];
  return build ? build(rng, variant) : null;
}
function answerDisplayOf(q) { return q.money ? `$${Number(q.value).toFixed(2)}` : fmtVal(q.value, q.unit || ''); }
function makePractice(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return shortAnswer({
      family, prompt: q.prompt, answerDisplay: answerDisplayOf(q),
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', diagram: q.diagram,
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return mcqFrom({
      family, prompt: q.prompt, answerDisplay: answerDisplayOf(q), q,
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng, diagram: q.diagram,
    });
  };
}

const GENERATORS = {
  apPerimeterRect: makePractice(AP(1)), apPerimeterRectWord: makeMCQ(AP(1)),
  apPerimeterPolygon: makePractice(AP(2)), apPerimeterPolygonWord: makeMCQ(AP(2)),
  apAreaRect: makePractice(AP(3)), apAreaRectWord: makeMCQ(AP(3)),
  apAreaTriangle: makePractice(AP(4)), apAreaTriangleWord: makeMCQ(AP(4)),
  apAreaComposite: makePractice(AP(5)), apAreaCompositeWord: makeMCQ(AP(5)),
  apApply: makePractice(AP(6)), apApplyWord: makeMCQ(AP(6)),
  // Secondary 1 (G1)
  apAreaParallelogram: makePractice(AP(7)), apAreaParallelogramMCQ: makeMCQ(AP(7)),
  apAreaTrapezium: makePractice(AP(8)), apAreaTrapeziumMCQ: makeMCQ(AP(8)),
};

export function generateAreaPerimeterQuestionSet({ skillId, count = 6, mode = 'practice', sessionSalt = '' }) {
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return [];
  const questions = [];
  const seenPrompts = new Set();
  let variant = 0;
  let fi = 0;
  const maxAttempts = count * 5;
  while (questions.length < count && variant < maxAttempts) {
    const family = families[fi % families.length];
    const rng = makeRng(`${skillId}-${family.id}-${variant}-${sessionSalt}`);
    const gen = GENERATORS[family.generatorKind];
    if (gen) {
      const q = gen(family, rng, variant);
      const dedupKey = q.prompt + '|||' + (q.answer?.display ?? q.answer);
      if (!seenPrompts.has(dedupKey) || variant >= count * 3) {
        seenPrompts.add(dedupKey);
        questions.push(q);
        fi++;
      }
    }
    variant++;
  }
  return questions;
}

// Unit-tolerant numeric / money compare.
export function checkAreaPerimeterAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const raw = String(studentResponse).trim().toLowerCase();
  const exp = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  if (raw === exp) return { correct: true };
  const stripUnits = (s) => s.replace(/cm²|cm2|m²|m2|cm|km|mm|\$/g, '');
  const digits = (s) => stripUnits(s).replace(/[^0-9.\-]/g, '');
  const a = digits(raw), b = digits(exp);
  if (a !== '' && a === b) return { correct: true };
  const na = parseFloat(a), nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return { correct: true };
  return { correct: false };
}

export default { generateAreaPerimeterQuestionSet, checkAreaPerimeterAnswer };
