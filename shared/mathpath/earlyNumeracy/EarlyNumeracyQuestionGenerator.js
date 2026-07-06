// Question generator for Early Numeracy (K2) — Strand A: Counting & Number.
//
// Every question is tap-to-answer MCQ with a visual: counting/comparison
// diagrams ({kind:'count'|'compare'}) or the apple add/subtract stem the
// lower-primary UI already renders via parseDotStem. No free-text, minimal
// reading, audio-first (the client auto-reads the prompt). See
// docs/k2-numeracy-scope.md.

import { getSkill } from './EarlyNumeracySkillGraph.js';

// ── Seeded RNG (deterministic per session+skill for reproducible tests) ──────
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rint(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FRUITS = ['🍎', '🍓', '🍊', '🍇', '🍌'];
// Strand B (Patterns) art. SHAPES are distinct colours/shapes for matching &
// repeating-pattern questions; SIZE_PAIRS are [bigger, smaller] real objects.
const SHAPES = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠', '⭐', '❤️'];
const SIZE_PAIRS = [
  ['🐘', '🐁'], ['🌳', '🌷'], ['🚌', '🚲'], ['🐋', '🐠'], ['🏠', '⛺'], ['🍉', '🍓'],
];
// Strand C (Shapes & Space). The four NEL basic shapes + the four direction
// arrows. Shapes are emitted as 'shape:<kind>' tokens (no colour-emoji rectangle
// exists) and rendered as crisp SVG glyphs by ShapeGlyph in the client.
const SHAPE_NAMES = ['circle', 'square', 'rectangle', 'triangle'];
const shapeToken = (name) => `shape:${name}`;
const ALL_SHAPE_TOKENS = SHAPE_NAMES.map(shapeToken);
// [glyph, real-object] for "shapes around us".
const SHAPE_OBJECTS = {
  circle: ['🛞', '🍪', '⏰', '🪙'],
  square: ['🪟', '🎁', '🧇', '🟫'],
  triangle: ['🍕', '⛺', '🔺', '📐'],
  rectangle: ['🚪', '📱', '📺', '🚌'],
};
const DIRECTIONS = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
// Position (top/bottom) uses any two distinct friendly objects — the position is
// what is being tested, not the objects.
const POSITION_OBJECTS = ['🐱', '🐶', '🐦', '🐟', '🎈', '🧸', '⚽', '🍎', '🚗', '🌟'];
// Distance-scene pairs — the two objects placed against the same horizon so the
// child can tell which is "near" (foreground/bigger) vs "far" (background/smaller).
const DISTANCE_OBJECTS = ['🐶', '🐱', '🚗', '🌳', '🏠', '🎈', '⚽', '🌷', '🦋', '🐦'];
// Strand D (Measuring). Each pair is [more, less] for the attribute: the first
// is longer / taller / heavier / holds-more.
const LENGTH_PAIRS = [['🐍', '🐛'], ['🚂', '🚗'], ['🥖', '🍪'], ['📏', '📎'], ['🪱', '🐞']];
const HEIGHT_PAIRS = [['🦒', '🐈'], ['🌳', '🌷'], ['🏢', '🏠'], ['🗼', '🚗'], ['🧍', '👶']];
const WEIGHT_PAIRS = [['🐘', '🐭'], ['🪨', '🪶'], ['🚗', '🎈'], ['🐋', '🐠'], ['📚', '🍃']];
const CAPACITY_PAIRS = [['🛁', '🥤'], ['🪣', '🥛'], ['🍶', '🥄'], ['🫙', '🧪']];

// Build MCQ number choices around a correct numeric answer (no negatives, deduped).
function numberChoices(rng, correct, { min = 0, max = 20, span = 3 } = {}) {
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < 4 && guard < 50) {
    guard += 1;
    const delta = rint(rng, -span, span);
    const cand = correct + delta;
    if (cand >= min && cand <= max) set.add(cand);
  }
  // top up if the window was too tight
  let n = min;
  while (set.size < 4 && n <= max) { set.add(n); n += 1; }
  return shuffle(rng, [...set].slice(0, 4)).map(String);
}

function mcq({ skill, familySuffix, prompt, correct, choices, diagram, misconceptionTag }) {
  return {
    skillId: skill.id,
    questionFamilyId: `QF_${skill.id}_${familySuffix}`,
    type: 'mcq',
    prompt,
    choices,
    answer: { display: String(correct) },
    acceptedAnswers: [String(correct)],
    solutionSteps: [],
    misconceptionTag: misconceptionTag || (skill.misconceptions || [])[0] || '',
    difficulty: skill.difficulty || 1,
    workingRequired: false,
    ...(diagram ? { diagram } : {}),
  };
}

// ── Per-skill question builders ──────────────────────────────────────────────
function genCount(rng, skill, { min, max }) {
  const fruit = pick(rng, FRUITS);
  // Two flavours: count-the-objects, and what-comes-next.
  if (rng() < 0.7) {
    const n = rint(rng, min, max);
    return mcq({
      skill, familySuffix: '001',
      prompt: 'Count them. How many?',
      correct: n,
      choices: numberChoices(rng, n, { min: Math.max(0, min - 1), max: max + 2 }),
      diagram: { kind: 'count', emoji: fruit, count: n },
    });
  }
  const x = rint(rng, min, max - 1);
  return mcq({
    skill, familySuffix: '002',
    prompt: `What number comes after ${x}?`,
    correct: x + 1,
    choices: numberChoices(rng, x + 1, { min: Math.max(0, min - 1), max: max + 2, span: 2 }),
  });
}

function genNumerals(rng, skill) {
  const fruit = pick(rng, FRUITS);
  if (rng() < 0.6) {
    const n = rint(rng, 0, 10);
    return mcq({
      skill, familySuffix: '001',
      prompt: 'Which number shows how many?',
      correct: n,
      choices: numberChoices(rng, n, { min: 0, max: 10 }),
      diagram: { kind: 'count', emoji: fruit, count: n },
    });
  }
  let a = rint(rng, 0, 10);
  let b = rint(rng, 0, 10);
  if (a === b) b = (b + 1) % 11;
  const bigger = Math.max(a, b);
  return mcq({
    skill, familySuffix: '002',
    prompt: `Which number is bigger: ${a} or ${b}?`,
    correct: bigger,
    choices: shuffle(rng, [String(a), String(b)]),
    misconceptionTag: 'en/numeral-quantity-mismatch',
  });
}

function genCompare(rng, skill) {
  const [f1, f2] = shuffle(rng, FRUITS).slice(0, 2);
  let left = rint(rng, 1, 9);
  let right = rint(rng, 1, 9);
  // 1-in-4 chance of an equal ("same as") item.
  if (rng() < 0.25) right = left;
  const diagram = { kind: 'compare', left: { emoji: f1, count: left }, right: { emoji: f2, count: right } };
  if (left === right) {
    return mcq({
      skill, familySuffix: '003',
      prompt: `Are there more ${f1}, more ${f2}, or the same?`,
      correct: 'Same',
      choices: shuffle(rng, [f1, f2, 'Same']),
      diagram,
      misconceptionTag: 'en/confuses-more-fewer',
    });
  }
  const more = left > right ? f1 : f2;
  return mcq({
    skill, familySuffix: '001',
    prompt: `Which has more — ${f1} or ${f2}?`,
    correct: more,
    choices: shuffle(rng, [f1, f2, 'Same']),
    diagram,
    misconceptionTag: 'en/longer-row-is-more',
  });
}

function genBonds(rng, skill) {
  const whole = rint(rng, 4, 10);
  const part = rint(rng, 1, whole - 1);
  const other = whole - part;
  return mcq({
    skill, familySuffix: '001',
    prompt: `${whole} is made of ${part} and ___?`,
    correct: other,
    choices: numberChoices(rng, other, { min: 0, max: whole }),
    // Part-whole bond frame: the child drags/taps the missing part into the slot.
    diagram: { kind: 'bond', whole, part },
    misconceptionTag: 'en/part-whole-confusion',
  });
}

function genAddWithin10(rng, skill) {
  const a = rint(rng, 1, 8);
  const b = rint(rng, 1, 10 - a);
  // Prompt form "a + b = ?" so the existing apple ManipulativeDotArray renders.
  return mcq({
    skill, familySuffix: '001',
    prompt: `${a} + ${b} = ?`,
    correct: a + b,
    choices: numberChoices(rng, a + b, { min: 0, max: 10 }),
  });
}

function genSubWithin10(rng, skill) {
  const a = rint(rng, 2, 10);
  const b = rint(rng, 1, a - 1);
  return mcq({
    skill, familySuffix: '001',
    prompt: `${a} − ${b} = ?`,
    correct: a - b,
    choices: numberChoices(rng, a - b, { min: 0, max: 10 }),
  });
}

// ── Strand B — Patterns ──────────────────────────────────────────────────────
function genSortMatch(rng, skill) {
  const [target, d1, d2] = shuffle(rng, SHAPES).slice(0, 3);
  return mcq({
    skill, familySuffix: '001',
    prompt: `Tap the one that is the same as ${target}.`,
    correct: target,
    choices: shuffle(rng, [target, d1, d2]),
    misconceptionTag: 'en/matches-wrong-attribute',
  });
}

function genCompareSize(rng, skill) {
  const [big, small] = pick(rng, SIZE_PAIRS);
  const askBigger = rng() < 0.5;
  return mcq({
    skill, familySuffix: askBigger ? '001' : '002',
    prompt: askBigger ? 'Which one is bigger?' : 'Which one is smaller?',
    correct: askBigger ? big : small,
    choices: shuffle(rng, [big, small]),
    misconceptionTag: 'en/confuses-bigger-smaller',
  });
}

// Build a repeating pattern from a 2–3 element unit (AB / ABC / AAB).
function buildPattern(rng) {
  const distinct = shuffle(rng, SHAPES).slice(0, rng() < 0.5 ? 2 : 3);
  const shapeOf = (kind) => (kind === 'A' ? distinct[0] : kind === 'B' ? distinct[1] : distinct[2]);
  const unitKinds = pick(rng, [['A', 'B'], ['A', 'B', 'C'], ['A', 'A', 'B']])
    .filter((k) => k !== 'C' || distinct.length >= 3);
  const unit = unitKinds.map(shapeOf);
  const length = unit.length * (unit.length === 2 ? 3 : 2); // 6 items
  const seq = Array.from({ length }, (_, i) => unit[i % unit.length]);
  return { seq, distinct };
}

function genPatternNext(rng, skill) {
  const { seq, distinct } = buildPattern(rng);
  return mcq({
    skill, familySuffix: '001',
    prompt: 'What comes next?',
    correct: seqNext(seq),
    choices: shuffle(rng, distinct),
    diagram: { kind: 'pattern', items: [...seq, null], missingIndex: seq.length },
    misconceptionTag: 'en/pattern-picks-any',
  });
}

// Next element continuing a repeating sequence (infers the unit length).
function seqNext(seq) {
  for (let u = 1; u <= seq.length / 2; u += 1) {
    let repeats = true;
    for (let i = u; i < seq.length; i += 1) { if (seq[i] !== seq[i % u]) { repeats = false; break; } }
    if (repeats) return seq[seq.length % u];
  }
  return seq[0];
}

function genPatternMissing(rng, skill) {
  const { seq, distinct } = buildPattern(rng);
  const missingIndex = 1 + Math.floor(rng() * (seq.length - 2)); // a middle slot
  const answer = seq[missingIndex];
  const items = seq.map((s, i) => (i === missingIndex ? null : s));
  return mcq({
    skill, familySuffix: '001',
    prompt: "What's missing?",
    correct: answer,
    choices: shuffle(rng, distinct),
    diagram: { kind: 'pattern', items, missingIndex },
    misconceptionTag: 'en/pattern-ignores-position',
  });
}

// ── Strand C — Shapes & Space ────────────────────────────────────────────────
function genShapeRecognise(rng, skill) {
  const name = pick(rng, SHAPE_NAMES);
  return mcq({
    skill, familySuffix: '001',
    prompt: `Tap the ${name}.`,
    correct: shapeToken(name),
    choices: shuffle(rng, ALL_SHAPE_TOKENS),
    misconceptionTag: 'en/shape-name-mismatch',
  });
}

const SHAPE_ATTR_QUESTIONS = [
  { prompt: 'Which shape has 3 sides?', name: 'triangle' },
  { prompt: 'Which shape has 4 sides that are all the same?', name: 'square' },
  { prompt: 'Which shape is round with no corners?', name: 'circle' },
  { prompt: 'Which shape has 4 sides — two long and two short?', name: 'rectangle' },
];
function genShapeAttributes(rng, skill) {
  const q = pick(rng, SHAPE_ATTR_QUESTIONS);
  return mcq({
    skill, familySuffix: '001',
    prompt: q.prompt,
    correct: shapeToken(q.name),
    choices: shuffle(rng, ALL_SHAPE_TOKENS),
    misconceptionTag: 'en/miscounts-sides',
  });
}

function genShapesAround(rng, skill) {
  const name = pick(rng, SHAPE_NAMES);
  const object = pick(rng, SHAPE_OBJECTS[name]);
  return mcq({
    skill, familySuffix: '001',
    prompt: `What shape is this? ${object}`,
    correct: shapeToken(name),
    choices: shuffle(rng, ALL_SHAPE_TOKENS),
    misconceptionTag: 'en/shape-name-mismatch',
  });
}

function genPosition(rng, skill) {
  const [top, bottom] = shuffle(rng, POSITION_OBJECTS).slice(0, 2);
  const askTop = rng() < 0.5;
  return mcq({
    skill, familySuffix: askTop ? '001' : '002',
    prompt: askTop ? 'Which one is on top?' : 'Which one is at the bottom?',
    correct: askTop ? top : bottom,
    choices: shuffle(rng, [top, bottom]),
    diagram: { kind: 'position', top, bottom },
    misconceptionTag: 'en/confuses-top-bottom',
  });
}

function genDistance(rng, skill) {
  const [near, far] = shuffle(rng, DISTANCE_OBJECTS).slice(0, 2);
  const askNear = rng() < 0.5;
  return mcq({
    skill, familySuffix: askNear ? '001' : '002',
    prompt: askNear ? 'Which one is near?' : 'Which one is far?',
    correct: askNear ? near : far,
    choices: shuffle(rng, [near, far]),
    diagram: { kind: 'distance', near, far },
    misconceptionTag: 'en/confuses-near-far',
  });
}

function genDirection(rng, skill) {
  const dir = pick(rng, Object.keys(DIRECTIONS));
  return mcq({
    skill, familySuffix: '001',
    prompt: `Tap the arrow that points ${dir}.`,
    correct: DIRECTIONS[dir],
    choices: shuffle(rng, Object.values(DIRECTIONS)),
    misconceptionTag: 'en/confuses-left-right',
  });
}

// ── Strand D — Measuring (compare by one attribute) ──────────────────────────
function measureCompare(rng, skill, { pairs, moreWord, lessWord, morePrompt, lessPrompt }) {
  const [more, less] = pick(rng, pairs);
  const askMore = rng() < 0.5;
  return mcq({
    skill, familySuffix: askMore ? '001' : '002',
    prompt: askMore ? (morePrompt || `Which one is ${moreWord}?`) : (lessPrompt || `Which one is ${lessWord}?`),
    correct: askMore ? more : less,
    choices: shuffle(rng, [more, less]),
  });
}

// ── Strand B — Sorting into groups (drag-to-bucket) ──────────────────────────
// Two-bucket colour sorts. Each pool holds objects that clearly share the
// bucket's colour, so the attribute is unambiguous.
const SORT_SETS = [
  { buckets: [{ id: 'red', label: 'Red', color: '#ef4444' }, { id: 'blue', label: 'Blue', color: '#3b82f6' }],
    pools: { red: ['🔴', '🟥', '❤️'], blue: ['🔵', '🟦', '💙'] } },
  { buckets: [{ id: 'yellow', label: 'Yellow', color: '#eab308' }, { id: 'green', label: 'Green', color: '#22c55e' }],
    pools: { yellow: ['🟡', '🟨', '💛'], green: ['🟢', '🟩', '💚'] } },
];

// Canonical encoding of an item→bucket placement, order-independent (items
// sorted by id). The generator encodes the CORRECT map; the client encodes the
// child's placement the same way, and the answer-checker compares the strings —
// so this is the single source of truth for sort scoring. Exported for the UI.
export function encodeSortPlacement(placement = {}, items = []) {
  return [...items]
    .map((it) => it.id)
    .sort()
    .map((id) => `${id}:${placement[id] || ''}`)
    .join(',');
}

function genSortGroups(rng, skill) {
  const set = pick(rng, SORT_SETS);
  const items = [];
  const correct = {};
  set.buckets.forEach((bucket, bi) => {
    const pool = shuffle(rng, set.pools[bucket.id]);
    for (let k = 0; k < 2; k += 1) {
      const id = `i${bi}${k}`;
      items.push({ id, emoji: pool[k % pool.length] });
      correct[id] = bucket.id;
    }
  });
  const shownItems = shuffle(rng, items);
  const answer = encodeSortPlacement(correct, shownItems);
  return {
    skillId: skill.id,
    questionFamilyId: `QF_${skill.id}_001`,
    type: 'mcq',
    prompt: `Put each one in the right box — ${set.buckets.map((b) => b.label).join(' or ')}.`,
    choices: [], // handled by the sort activity, not MCQ buttons
    answer: { display: answer },
    acceptedAnswers: [answer],
    solutionSteps: [],
    misconceptionTag: 'en/sorts-wrong-group',
    difficulty: skill.difficulty || 2,
    workingRequired: false,
    diagram: { kind: 'sort', buckets: set.buckets, items: shownItems.map((it) => ({ id: it.id, emoji: it.emoji })) },
  };
}

const BUILDERS = {
  EN001: (rng, skill) => genCount(rng, skill, { min: 2, max: 10 }),
  EN002: (rng, skill) => genCount(rng, skill, { min: 1, max: 10 }),
  EN003: (rng, skill) => genCount(rng, skill, { min: 11, max: 20 }),
  EN004: (rng, skill) => genNumerals(rng, skill),
  EN005: (rng, skill) => genCompare(rng, skill),
  EN006: (rng, skill) => genBonds(rng, skill),
  EN007: (rng, skill) => genAddWithin10(rng, skill),
  EN008: (rng, skill) => genSubWithin10(rng, skill),
  EN009: (rng, skill) => genSortMatch(rng, skill),
  EN010: (rng, skill) => genCompareSize(rng, skill),
  EN011: (rng, skill) => genPatternNext(rng, skill),
  EN012: (rng, skill) => genPatternMissing(rng, skill),
  EN022: (rng, skill) => genSortGroups(rng, skill),
  EN013: (rng, skill) => genShapeRecognise(rng, skill),
  EN014: (rng, skill) => genShapeAttributes(rng, skill),
  EN015: (rng, skill) => genShapesAround(rng, skill),
  EN016: (rng, skill) => genDirection(rng, skill),
  EN021: (rng, skill) => genPosition(rng, skill),
  EN023: (rng, skill) => genDistance(rng, skill),
  EN017: (rng, skill) => measureCompare(rng, skill, { pairs: LENGTH_PAIRS, moreWord: 'longer', lessWord: 'shorter' }),
  EN018: (rng, skill) => measureCompare(rng, skill, { pairs: HEIGHT_PAIRS, moreWord: 'taller', lessWord: 'shorter' }),
  EN019: (rng, skill) => measureCompare(rng, skill, { pairs: WEIGHT_PAIRS, moreWord: 'heavier', lessWord: 'lighter' }),
  EN020: (rng, skill) => measureCompare(rng, skill, { pairs: CAPACITY_PAIRS, morePrompt: 'Which one holds more?', lessPrompt: 'Which one holds less?' }),
};

export function generateEarlyNumeracyQuestionSet({ skillId, count = 6, sessionSalt = '0' } = {}) {
  const skill = getSkill(skillId);
  if (!skill) {
    const err = new Error(`Unknown early-numeracy skill: ${skillId}`);
    err.status = 400;
    throw err;
  }
  const build = BUILDERS[skill.id];
  if (!build) {
    const err = new Error(`No generator for early-numeracy skill: ${skill.id}`);
    err.status = 400;
    throw err;
  }
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const rng = mulberry32(hashString(`${sessionSalt}|${skill.id}|${i}`));
    out.push(build(rng, skill));
  }
  return out;
}

// MCQ string-equality check (trims + case-insensitive for the "Same" option).
export function checkEarlyNumeracyAnswer({ question, studentResponse }) {
  const given = String(studentResponse ?? '').trim().toLowerCase();
  const accepted = (question?.acceptedAnswers || [String(question?.answer?.display ?? '')])
    .map((a) => String(a).trim().toLowerCase());
  return { correct: accepted.includes(given) };
}

export default { generateEarlyNumeracyQuestionSet, checkEarlyNumeracyAnswer };
