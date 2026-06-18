import { getSkill } from './VolumeSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './VolumeQuestionFamilies.js';

// MathPath — Volume question generator.
//
// Rebuilt for question quality (P2 — see MATHPATH_QUESTION_QUALITY_AUDIT.md).
// The previous version computed l×b×h but shipped boilerplate worked solutions,
// answer±random distractors, hard-coded heights, an incoherent VL003 "doubles"
// MCQ and no diagrams. This version varies all three dimensions, emits figures,
// uses misconception distractors and real worked solutions, and carries units.

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
  const opts = [String(answerDisplay)];
  const seen = new Set(opts);
  for (const d of q.distractors || []) {
    const disp = fmtVal(d, q.unit || '');
    if (!seen.has(disp) && Number(d) > 0) { seen.add(disp); opts.push(disp); }
  }
  const base = Number(q.value);
  const deltas = [1, -1, 2, -2, 5, -5, 10, -10];
  for (let i = 0; opts.length < 4 && i < deltas.length && Number.isFinite(base); i++) {
    const v = base + deltas[i];
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

const VL = (n) => `VL${String(n).padStart(3, '0')}`;
function dims(rng, maxL = 12, maxW = 10, maxH = 8) {
  return { l: rint(rng, 2, maxL), w: rint(rng, 2, maxW), h: rint(rng, 2, maxH) };
}

const BUILDERS = {
  // VL001 — Counting unit cubes
  [VL(1)]: (rng) => {
    const { l, w, h } = dims(rng, 5, 4, 4);
    const ans = l * w * h;
    return {
      prompt: `A solid is built from 1 cm unit cubes stacked ${l} long, ${w} wide and ${h} high. How many unit cubes are there in total?`,
      value: ans, unit: 'cubes', tag: 'vol/hidden-cubes',
      steps: ['Count layer by layer: each layer has length × width cubes.', `${l} × ${w} = ${l * w} cubes per layer, × ${h} layers = ${ans} cubes.`],
      distractors: [l * w, l * w + l * h + w * h, l + w + h], // one layer / visible faces / edges
      diagram: { kind: 'unit-cubes', l, w, h },
    };
  },
  // VL002 — Volume of cubes and cuboids
  [VL(2)]: (rng) => {
    const { l, w, h } = dims(rng);
    const ans = l * w * h;
    return {
      prompt: `A cuboid measures ${l} cm by ${w} cm by ${h} cm. What is its volume?`,
      value: ans, unit: 'cm³', tag: 'mea/volume-add-edges',
      steps: ['Volume = length × width × height.', `${l} × ${w} × ${h} = ${ans} cm³.`],
      distractors: [l + w + h, l * w, 2 * (l * w + w * h + l * h)], // edges / one face / surface area
      diagram: { kind: 'cuboid', l, w, h },
    };
  },
  // VL003 — Nets and volume of cuboids
  [VL(3)]: (rng) => {
    const { l, w, h } = dims(rng, 10, 8, 6);
    const ans = l * w * h;
    return {
      prompt: `The net shown folds into a cuboid with edges ${l} cm, ${w} cm and ${h} cm. What is the volume of the cuboid it makes?`,
      value: ans, unit: 'cm³', tag: 'mea/net-dimensions',
      steps: ['Read the three edge lengths from the net, then multiply them.', `${l} × ${w} × ${h} = ${ans} cm³.`],
      distractors: [2 * (l * w + w * h + l * h), l + w + h, l * w], // surface area (of the net) / edges / one face
      diagram: { kind: 'net', shape: 'cuboid', l, w, h },
    };
  },
  // VL004 — Volume, water level and flow rate
  [VL(4)]: (rng, variant) => {
    if (variant % 2 === 0) {
      const rate = rint(rng, 2, 9), t = rint(rng, 2, 8);
      const ans = rate * t;
      return {
        prompt: `Water flows into an empty tank at ${rate} litres per minute. How much water is in the tank after ${t} minutes?`,
        value: ans, unit: 'L', tag: 'mea/rate-volume-confuse',
        steps: ['Volume = flow rate × time.', `${rate} × ${t} = ${ans} L.`],
        distractors: [rate + t, ans + rate, Math.abs(rate - t) || rate],
      };
    }
    // water level: height = volume ÷ base area (kept exact)
    const base = pick(rng, [10, 12, 15, 20, 25]);
    const height = rint(rng, 2, 9);
    const vol = base * height;
    return {
      prompt: `A tank has a base area of ${base} cm². ${vol} cm³ of water is poured in. What is the height of the water?`,
      value: height, unit: 'cm', tag: 'mea/rate-volume-confuse',
      steps: ['Height of water = volume ÷ base area.', `${vol} ÷ ${base} = ${height} cm.`],
      distractors: [vol - base, base, vol],
      diagram: { kind: 'tank', baseArea: base, volume: vol, height },
    };
  },

  // ── Secondary 1 (G1) — Mensuration ──────────────────────────────────────────
  // VL005 — Volume of a triangular prism = (½ × base × height) × length
  [VL(5)]: (rng) => {
    let b = rint(rng, 3, 12), triH = rint(rng, 2, 10);
    if ((b * triH) % 2 !== 0) b += 1;                  // keep the triangle area whole
    const len = rint(rng, 3, 12);
    const crossArea = (b * triH) / 2;
    const ans = crossArea * len;
    return {
      prompt: `A triangular prism has a triangular cross-section with base ${b} cm and height ${triH} cm, and a length of ${len} cm. What is its volume?`,
      value: ans, unit: 'cm³', tag: 'mea/prism-cross-section',
      steps: [`Cross-section area = ½ × ${b} × ${triH} = ${crossArea} cm².`, `Volume = cross-section area × length = ${crossArea} × ${len} = ${ans} cm³.`],
      distractors: [b * triH * len, crossArea + len, b * triH],
      diagram: { kind: 'triangular-prism', base: b, height: triH, length: len },
    };
  },
  // VL006 — Surface area of a cuboid = 2(lw + wh + lh)
  [VL(6)]: (rng) => {
    const l = rint(rng, 3, 12), w = rint(rng, 2, 10), h = rint(rng, 2, 8);
    const ans = 2 * (l * w + w * h + l * h);
    return {
      prompt: `A cuboid measures ${l} cm by ${w} cm by ${h} cm. What is its total surface area?`,
      value: ans, unit: 'cm²', tag: 'mea/surface-area-as-volume',
      steps: ['Surface area = 2 × (lw + wh + lh).', `2 × (${l * w} + ${w * h} + ${l * h}) = 2 × ${l * w + w * h + l * h} = ${ans} cm².`],
      distractors: [l * w * h, l * w + w * h + l * h, 2 * (l + w + h)],
      diagram: { kind: 'cuboid', l, w, h },
    };
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

const KIND_TO_SKILL = {
  volUnitCubes: VL(1), volCuboid: VL(2), volNets: VL(3), volWaterRate: VL(4),
  // Secondary 1 (G1)
  volPrism: VL(5), volSurfaceArea: VL(6),
};
// Family kinds: VL001 has volUnitCubes/volUnitCubesMCQ; the others use
// <kind> and <kind>Word for practice/MCQ. Map every declared kind explicitly.
const KIND_ALIASES = {
  volUnitCubesMCQ: { skill: VL(1), mcq: true },
  volCuboidWord: { skill: VL(2), mcq: true },
  volNetsWord: { skill: VL(3), mcq: true },
  volWaterRateWord: { skill: VL(4), mcq: true },
};

const GENERATORS = {};
for (const [kind, skillId] of Object.entries(KIND_TO_SKILL)) GENERATORS[kind] = makePractice(skillId);
GENERATORS.volUnitCubesMCQ = makeMCQ(VL(1));
GENERATORS.volCuboidWord = makeMCQ(VL(2));
GENERATORS.volNetsWord = makeMCQ(VL(3));
GENERATORS.volWaterRateWord = makeMCQ(VL(4));
GENERATORS.volPrismMCQ = makeMCQ(VL(5));
GENERATORS.volSurfaceAreaMCQ = makeMCQ(VL(6));

export function generateVolumeQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

// Unit-tolerant: "60", "60cm3", "60 cm³" all match.
export function checkVolumeAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const raw = String(studentResponse).trim().toLowerCase();
  const exp = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  if (raw === exp) return { correct: true };
  // Strip unit tokens first so the "3" in "cm3" isn't read as a digit.
  const stripUnits = (s) => s.replace(/cm³|cm3|cm²|cm2|m³|m3|m²|m2|cubes?|litres?|cm|km|mm|ml|kg|\bl\b|\bg\b/g, '');
  const digits = (s) => stripUnits(s).replace(/[^0-9.\-]/g, '');
  const a = digits(raw), b = digits(exp);
  if (a !== '' && a === b) return { correct: true };
  const na = parseFloat(a), nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return { correct: true };
  return { correct: false };
}

export default { generateVolumeQuestionSet, checkVolumeAnswer };
