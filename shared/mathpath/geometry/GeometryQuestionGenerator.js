import { getSkill } from './GeometrySkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './GeometryQuestionFamilies.js';

// MathPath — Geometry question generator.
//
// Rebuilt for question quality (see MATHPATH_QUESTION_QUALITY_AUDIT.md). The old
// file was a stub: every one of the 44 generators returned "Compute: a + b".
// This version has one real builder per skill (GE001–GE022) covering 2D/3D
// shapes and their properties, lines, angle types, angles on a line/at a point,
// triangle and quadrilateral angles, symmetry, nets, compass directions,
// perimeter/area, triangle area and circles — with figures, misconception
// distractors and worked solutions, all within the P1–P6 syllabus.
//
// Answers are either a number (with unit) or a word (shape/direction/type);
// checkGeometryAnswer handles both, with unit tolerance.

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
function mcqFrom({ family, prompt, answerDisplay, choices, solutionSteps, misconceptionTag, difficulty, mode, rng, diagram }) {
  let opts = [...new Set(choices.map(String))];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = rint(rng, 0, i);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return {
    id: `${family.id}#${mode}`, skillId: family.skillId, questionFamilyId: family.id,
    type: 'mcq', prompt, choices: opts,
    answer: { display: answerDisplay, value: answerDisplay }, acceptedAnswers: [answerDisplay],
    solutionSteps, misconceptionTag, difficulty, mode,
    workingRequired: family.workingRequired, generatorKind: family.generatorKind,
    ...(diagram ? { diagram } : {}),
  };
}

const GE = (n) => `GE${String(n).padStart(3, '0')}`;

// Reference data
const POLY = [{ name: 'triangle', sides: 3 }, { name: 'quadrilateral', sides: 4 }, { name: 'pentagon', sides: 5 }, { name: 'hexagon', sides: 6 }, { name: 'octagon', sides: 8 }];
const SYMMETRY = [{ name: 'square', lines: 4 }, { name: 'rectangle', lines: 2 }, { name: 'equilateral triangle', lines: 3 }, { name: 'regular pentagon', lines: 5 }, { name: 'regular hexagon', lines: 6 }];
const SOLIDS = [{ name: 'cube', faces: 6, edges: 12, vertices: 8 }, { name: 'cuboid', faces: 6, edges: 12, vertices: 8 }, { name: 'square pyramid', faces: 5, edges: 8, vertices: 5 }, { name: 'triangular prism', faces: 5, edges: 9, vertices: 6 }];
const COMPASS = ['North', 'East', 'South', 'West'];
function angleType(x) { return x < 90 ? 'acute' : x === 90 ? 'right' : x < 180 ? 'obtuse' : 'reflex'; }
const PI = 3.14;

const BUILDERS = {
  // GE001 — Identifying 2D shapes
  [GE(1)]: (rng) => { const p = pick(rng, POLY); return { prompt: `How many sides does a ${p.name} have?`, answer: p.sides, tag: 'geo/orientation-changes-shape', steps: [`A ${p.name} has ${p.sides} straight sides.`], distractors: [p.sides + 1, p.sides - 1, p.sides + 2], diagram: { kind: 'polygon', sides: p.sides } }; },
  // GE002 — Properties: sides and vertices
  [GE(2)]: (rng) => { const p = pick(rng, POLY); const ask = pick(rng, ['sides', 'vertices']); return { prompt: `How many ${ask} does a ${p.name} have?`, answer: p.sides, tag: 'geo/side-vertex-count', steps: [`A ${p.name} has ${p.sides} ${ask} (a polygon has as many vertices as sides).`], distractors: [p.sides + 1, p.sides - 1, p.sides * 2], diagram: { kind: 'polygon', sides: p.sides } }; },
  // GE003 — Parallel and perpendicular lines
  [GE(3)]: (rng) => { const parallel = rng() < 0.5; return { prompt: parallel ? 'Two lines that always stay the same distance apart and never meet are called ___ lines.' : 'Two lines that meet at a right angle (90°) are called ___ lines.', answer: parallel ? 'parallel' : 'perpendicular', tag: 'geo/parallel-perp-confuse', steps: [parallel ? 'Lines that never meet are parallel.' : 'Lines that meet at 90° are perpendicular.'], choices: ['parallel', 'perpendicular'] }; },
  // GE004 — Angle types
  [GE(4)]: (rng) => { const x = pick(rng, [25, 40, 55, 70, 90, 110, 135, 160]); const t = angleType(x); return { prompt: `An angle measures ${x}°. What type of angle is it?`, answer: t, tag: 'geo/angle-by-arm-length', steps: [`${x}° is ${t === 'right' ? 'exactly 90°' : t === 'acute' ? 'less than 90°' : 'between 90° and 180°'}, so it is ${t}.`], choices: ['acute', 'right', 'obtuse'], diagram: { kind: 'angle', degrees: x } }; },
  // GE005 — Measuring angles (read the protractor)
  [GE(5)]: (rng) => { const x = pick(rng, [30, 45, 60, 75, 105, 120, 135, 150]); return { prompt: 'What is the size of the angle shown on the protractor?', answer: x, unit: '°', tag: 'geo/protractor-scale', steps: [`Read from the 0° arm: the angle is ${x}°.`], distractors: [180 - x, x + 10, x - 10], diagram: { kind: 'angle', degrees: x, protractor: true } }; },
  // GE006 — Angles on a line and at a point
  [GE(6)]: (rng) => { const atPoint = rng() < 0.5; const total = atPoint ? 360 : 180; const known = atPoint ? rint(rng, 80, 250) : rint(rng, 20, 160); const a = total - known; return { prompt: atPoint ? `Angles at a point add up to 360°. One angle is ${known}°. Find the other angle.` : `Angles on a straight line add up to 180°. One angle is ${known}°. Find the other angle.`, answer: a, unit: '°', tag: 'geo/angle-relationship', steps: [`${total} − ${known} = ${a}°.`], distractors: [(atPoint ? 180 : 360) - known, known, a + 10].filter((d) => d > 0), diagram: { kind: 'angle', degrees: known, partner: a, total } }; },
  // GE007 — Types of triangles (by sides)
  [GE(7)]: (rng) => { const type = pick(rng, ['equilateral', 'isosceles', 'scalene']); const sides = type === 'equilateral' ? [6, 6, 6] : type === 'isosceles' ? [5, 5, 8] : [4, 6, 7]; return { prompt: `A triangle has sides ${sides.join(' cm, ')} cm. What type of triangle is it (by its sides)?`, answer: type, tag: 'geo/triangle-by-look', steps: [type === 'equilateral' ? 'All three sides are equal → equilateral.' : type === 'isosceles' ? 'Two sides are equal → isosceles.' : 'All sides are different → scalene.'], choices: ['equilateral', 'isosceles', 'scalene'], diagram: { kind: 'triangle', sides } }; },
  // GE008 — Angle properties of triangles
  [GE(8)]: (rng) => { const a = rint(rng, 30, 80), b = rint(rng, 30, 80); const c = 180 - a - b; return { prompt: `Two angles of a triangle are ${a}° and ${b}°. Find the third angle.`, answer: c, unit: '°', tag: 'geo/angle-sum-wrong', steps: ['The angles of a triangle add up to 180°.', `180 − ${a} − ${b} = ${c}°.`], distractors: [360 - a - b, a + b, 180 - a].filter((d) => d > 0 && d !== c), diagram: { kind: 'triangle', angles: [a, b, c] } }; },
  // GE009 — Quadrilateral types and properties
  [GE(9)]: (rng) => { const q = pick(rng, [{ n: 'square', d: '4 equal sides and 4 right angles' }, { n: 'rectangle', d: '4 right angles and opposite sides equal' }, { n: 'rhombus', d: '4 equal sides but no right angles' }, { n: 'parallelogram', d: 'two pairs of parallel sides' }]); return { prompt: `Which quadrilateral has ${q.d}?`, answer: q.n, tag: 'geo/square-not-rectangle', steps: [`A ${q.n} has ${q.d}.`], choices: ['square', 'rectangle', 'rhombus', 'parallelogram'] }; },
  // GE010 — Angles in special quadrilaterals
  [GE(10)]: (rng) => { const a = rint(rng, 50, 130); const adj = 180 - a; return { prompt: `In a parallelogram, one angle is ${a}°. Find the angle next to it (co-interior).`, answer: adj, unit: '°', tag: 'geo/quad-angle-relationship', steps: ['Adjacent angles in a parallelogram add up to 180°.', `180 − ${a} = ${adj}°.`], distractors: [a, 360 - a, adj + 10].filter((d) => d > 0 && d !== adj), diagram: { kind: 'parallelogram', angle: a } }; },
  // GE011 — Line symmetry
  [GE(11)]: (rng) => { const s = pick(rng, SYMMETRY); return { prompt: `How many lines of symmetry does a ${s.name} have?`, answer: s.lines, tag: 'geo/diagonal-symmetry-miss', steps: [`A ${s.name} has ${s.lines} lines of symmetry.`], distractors: [s.lines + 1, s.lines - 1, s.lines + 2].filter((d) => d >= 0), diagram: { kind: 'symmetry', shape: s.name, lines: s.lines } }; },
  // GE012 — Completing symmetric figures
  [GE(12)]: (rng) => { const k = rint(rng, 1, 6); return { prompt: `A figure has a vertical line of symmetry. A dot is ${k} square(s) to the left of the line. How many squares to the right of the line is its mirror image?`, answer: k, unit: 'squares', tag: 'geo/reflect-not-translate', steps: ['A reflection is the same distance on the other side of the line.', `So it is ${k} square(s) to the right.`], distractors: [k + 1, k * 2, k + 2], diagram: { kind: 'reflection', distance: k } }; },
  // GE013 — 3D solids: faces, edges, vertices
  [GE(13)]: (rng) => { const s = pick(rng, SOLIDS); const ask = pick(rng, ['faces', 'edges', 'vertices']); return { prompt: `How many ${ask} does a ${s.name} have?`, answer: s[ask], tag: 'geo/faces-edges-confuse', steps: [`A ${s.name} has ${s.faces} faces, ${s.edges} edges and ${s.vertices} vertices.`, `So it has ${s[ask]} ${ask}.`], distractors: [s.faces, s.edges, s.vertices].filter((d) => d !== s[ask]), diagram: { kind: 'solid', solid: s.name } }; },
  // GE014 — Nets and views of solids
  [GE(14)]: (rng) => { const s = pick(rng, [{ n: 'cube', faces: 6 }, { n: 'square pyramid', faces: 5 }, { n: 'triangular prism', faces: 5 }, { n: 'cuboid', faces: 6 }]); return { prompt: `A net folds up into a ${s.n}. How many faces will the solid have?`, answer: s.faces, tag: 'geo/net-folding', steps: [`A ${s.n} has ${s.faces} faces, so its net has ${s.faces} parts.`], distractors: [s.faces + 1, s.faces - 1, s.faces + 2], diagram: { kind: 'net', solid: s.n } }; },
  // GE015 — Position and compass directions
  [GE(15)]: (rng) => { const start = rint(rng, 0, 3); const turns = pick(rng, [1, 2, 3]); const end = (start + turns) % 4; return { prompt: `You are facing ${COMPASS[start]}. You turn ${turns * 90}° clockwise. Which direction do you face now?`, answer: COMPASS[end], tag: 'geo/compass-confuse', steps: [`Each 90° clockwise turn goes ${COMPASS.join(' → ')} → ${COMPASS[0]}.`, `From ${COMPASS[start]}, ${turns} turn(s) → ${COMPASS[end]}.`], choices: [...COMPASS] }; },
  // GE016 — Drawing and constructing figures (facts that guide construction)
  [GE(16)]: (rng) => { const q = pick(rng, [{ p: 'Each angle of a square measures ___°.', a: 90 }, { p: 'The angles of a triangle add up to ___°.', a: 180 }, { p: 'A straight angle measures ___°.', a: 180 }, { p: 'A right angle measures ___°.', a: 90 }]); return { prompt: q.p, answer: q.a, unit: '°', tag: 'geo/construction-precision', steps: [`This is a key fact for accurate construction: ${q.a}°.`], distractors: [q.a + 90, q.a - 90, q.a + 10].filter((d) => d > 0 && d !== q.a) }; },
  // GE017 — Perimeter foundations
  [GE(17)]: (rng) => { const s = rint(rng, 3, 20); return { prompt: `A square has sides of ${s} cm. What is its perimeter?`, answer: 4 * s, unit: 'cm', tag: 'geo/perimeter-vs-area', steps: ['Perimeter of a square = 4 × side.', `4 × ${s} = ${4 * s} cm.`], distractors: [s * s, 2 * s, 4 * s + s].filter((d) => d !== 4 * s), diagram: { kind: 'square', side: s } }; },
  // GE018 — Area of rectangles
  [GE(18)]: (rng) => { const l = rint(rng, 3, 18), w = rint(rng, 2, 12); return { prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its area?`, answer: l * w, unit: 'cm²', tag: 'geo/area-add-sides', steps: ['Area of a rectangle = length × width.', `${l} × ${w} = ${l * w} cm².`], distractors: [2 * (l + w), l + w, l * w + l].filter((d) => d !== l * w), diagram: { kind: 'rectangle', l, w } }; },
  // GE019 — Area of triangles
  [GE(19)]: (rng) => { const b = pick(rng, [4, 6, 8, 10, 12]), h = pick(rng, [3, 5, 6, 7, 9]); const area = round2(b * h / 2); return { prompt: `A triangle has base ${b} cm and height ${h} cm. What is its area?`, answer: area, unit: 'cm²', tag: 'geo/triangle-no-half', steps: ['Area of a triangle = ½ × base × height.', `½ × ${b} × ${h} = ${area} cm².`], distractors: [b * h, round2(b * h / 2) + b, b + h].filter((d) => d !== area), diagram: { kind: 'triangle', base: b, height: h } }; },
  // GE020 — Circumference and area of a circle (P6)
  [GE(20)]: (rng) => { const r = pick(rng, [2, 3, 4, 5, 6, 10]); const circ = round2(2 * PI * r); const area = round2(PI * r * r); const wantArea = rng() < 0.5; return { prompt: wantArea ? `Find the area of a circle with radius ${r} cm. (Use π = 3.14.)` : `Find the circumference of a circle with radius ${r} cm. (Use π = 3.14.)`, answer: wantArea ? area : circ, unit: 'cm' + (wantArea ? '²' : ''), tag: 'geo/circumference-area-formula', steps: wantArea ? [`Area = π × r × r = 3.14 × ${r} × ${r}.`, `= ${area} cm².`] : [`Circumference = 2 × π × r = 2 × 3.14 × ${r}.`, `= ${circ} cm.`], distractors: wantArea ? [circ, round2(PI * r), round2(PI * (2 * r) * (2 * r))] : [area, round2(PI * r), round2(2 * PI * (2 * r))], diagram: { kind: 'circle', radius: r } }; },
  // GE021 — Perimeter and area of circle parts (P6)
  [GE(21)]: (rng) => { const r = pick(rng, [2, 4, 6, 8, 10]); const semiP = round2(PI * r + 2 * r); return { prompt: `Find the perimeter of a semicircle with radius ${r} cm. Remember to include the straight edge. (Use π = 3.14.)`, answer: semiP, unit: 'cm', tag: 'geo/forgot-straight-edges', steps: ['Perimeter of a semicircle = half the circumference + the diameter.', `= π × r + 2 × r = 3.14 × ${r} + ${2 * r} = ${semiP} cm.`], distractors: [round2(PI * r), round2(PI * r * r / 2), round2(2 * PI * r)].filter((d) => d !== semiP), diagram: { kind: 'circle-part', part: 'semicircle', radius: r } }; },
  // GE022 — Composite figures: area
  [GE(22)]: (rng) => { const L = rint(rng, 8, 16), W = rint(rng, 6, 12); const a = rint(rng, 2, L - 4), b = rint(rng, 2, W - 3); const area = L * W - a * b; return { prompt: `An L-shaped figure is a ${L} cm by ${W} cm rectangle with a ${a} cm by ${b} cm rectangle cut out of one corner. What is its area?`, answer: area, unit: 'cm²', tag: 'geo/missing-region', steps: [`Whole rectangle = ${L} × ${W} = ${L * W} cm².`, `Cut-out = ${a} × ${b} = ${a * b} cm².`, `Area = ${L * W} − ${a * b} = ${area} cm².`], distractors: [L * W, L * W + a * b, a * b].filter((d) => d !== area), diagram: { kind: 'composite', outer: [L, W], cut: [a, b] } }; },
};

function runBuilder(skillId, rng, variant) {
  const build = BUILDERS[skillId];
  return build ? build(rng, variant) : null;
}

function buildChoices(q, answerDisplay) {
  if (q.choices) return q.choices.map((c) => fmtVal(c, q.unit || ''));
  const opts = [String(answerDisplay)];
  const seen = new Set(opts);
  for (const d of q.distractors || []) {
    const disp = fmtVal(d, q.unit || '');
    if (!seen.has(disp)) { seen.add(disp); opts.push(disp); }
  }
  const base = Number(q.answer);
  const deltas = [1, -1, 2, -2, 5, -5, 10, -10];
  for (let i = 0; opts.length < 4 && i < deltas.length && Number.isFinite(base); i++) {
    const v = round2(base + deltas[i]);
    if (v <= 0) continue;
    const disp = fmtVal(v, q.unit || '');
    if (!seen.has(disp)) { seen.add(disp); opts.push(disp); }
  }
  return opts.slice(0, 4);
}

function makePractice(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return shortAnswer({
      family, prompt: q.prompt, answerDisplay: fmtVal(q.answer, q.unit || ''),
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', diagram: q.diagram,
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    const answerDisplay = fmtVal(q.answer, q.unit || '');
    return mcqFrom({
      family, prompt: q.prompt, answerDisplay, choices: buildChoices(q, answerDisplay),
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng, diagram: q.diagram,
    });
  };
}

const KIND_TO_SKILL = {
  geoGeo2dShapes: GE(1), geoGeo2dProperties: GE(2), geoGeoLines: GE(3), geoGeoAngleIntro: GE(4),
  geoGeoAngleMeasure: GE(5), geoGeoAngleLinePoint: GE(6), geoGeoTriangleTypes: GE(7), geoGeoTriangleAngles: GE(8),
  geoGeoQuadTypes: GE(9), geoGeoAngleQuad: GE(10), geoGeoSymmetry: GE(11), geoGeoSymmetryComplete: GE(12),
  geoGeo3dShapes: GE(13), geoGeoNetsViews: GE(14), geoGeoPosition: GE(15), geoGeoConstruct: GE(16),
  geoGeoPerimeter: GE(17), geoGeoAreaRect: GE(18), geoGeoAreaTriangle: GE(19), geoGeoCircle: GE(20),
  geoGeoCircleParts: GE(21), geoGeoComposite: GE(22),
};

const GENERATORS = {};
for (const [kind, skillId] of Object.entries(KIND_TO_SKILL)) {
  GENERATORS[kind] = makePractice(skillId);
  GENERATORS[`${kind}MCQ`] = makeMCQ(skillId);
}

export function generateGeometryQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

// Handles numeric answers (unit-tolerant) and word answers (shape/direction/
// type), case- and whitespace-insensitive; strips a trailing "angle".
export function checkGeometryAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/ angle$/, '');
  const raw = norm(studentResponse), exp = norm(question.answer?.display ?? question.answer ?? '');
  if (raw === exp) return { correct: true };
  const digits = (s) => s.replace(/[^0-9.\-]/g, '');
  const a = digits(raw), b = digits(exp);
  if (b !== '' && a !== '') {
    if (a === b) return { correct: true };
    const na = parseFloat(a), nb = parseFloat(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return { correct: true };
  }
  return { correct: false };
}

export default { generateGeometryQuestionSet, checkGeometryAnswer };
