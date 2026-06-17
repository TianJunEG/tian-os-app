import { getSkill } from './StatisticsSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './StatisticsQuestionFamilies.js';

// MathPath — Statistics question generator.
//
// Rebuilt for question quality (P2 — see MATHPATH_QUESTION_QUALITY_AUDIT.md).
// The previous version emitted boilerplate solutions, random distractors, no
// diagrams and several impossible cases (these correctness bugs were fixed in
// P0; this rebuild adds the missing pedagogy). Now every item carries a
// structured diagram (table / pictograph / bar / line / pie) whose data matches
// the prompt and the answer, means are integer by construction, pie data sums
// to 100% / 360°, and distractors encode the named misconception.

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
    if (!seen.has(String(d)) && Number(d) > 0) { seen.add(String(d)); opts.push(String(d)); }
  }
  const base = Number(answerDisplay);
  const deltas = [1, -1, 2, -2, 3, -3, 5, -5];
  for (let i = 0; opts.length < 4 && i < deltas.length && Number.isFinite(base); i++) {
    const v = base + deltas[i];
    if (v <= 0) continue;
    if (!seen.has(String(v))) { seen.add(String(v)); opts.push(String(v)); }
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

const ST = (n) => `ST${String(n).padStart(3, '0')}`;
const CATS = ['Apples', 'Bananas', 'Cherries', 'Grapes', 'Oranges', 'Pears'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const COLOURS = ['Red', 'Blue', 'Green', 'Yellow'];
function fourCats(rng) { const s = [...CATS]; for (let i = s.length - 1; i > 0; i--) { const j = rint(rng, 0, i);[s[i], s[j]] = [s[j], s[i]]; } return s.slice(0, 4); }
function listText(labels, vals) { return labels.map((l, i) => `${l}: ${vals[i]}`).join(', '); }

const BUILDERS = {
  // ST001 — Reading tables
  [ST(1)]: (rng) => {
    const labels = fourCats(rng); const vals = labels.map(() => rint(rng, 3, 25));
    const total = vals.reduce((a, b) => a + b, 0);
    return { prompt: `A table shows the number of fruits sold. ${listText(labels, vals)}. How many fruits were sold in total?`, value: total, tag: 'stat/row-column-mix',
      steps: [`Add all the values: ${vals.join(' + ')} = ${total}.`], distractors: [total - vals[0], Math.max(...vals), total + vals[0]],
      diagram: { kind: 'table', columns: ['Fruit', 'Number'], rows: labels.map((l, i) => [l, vals[i]]) } };
  },
  // ST002 — Picture graphs
  [ST(2)]: (rng) => {
    const k = pick(rng, [2, 5, 10]); const labels = DAYS.slice(0, 4); const sym = labels.map(() => rint(rng, 2, 8));
    const idx = rint(rng, 0, 3); const val = sym[idx] * k;
    return { prompt: `In a picture graph, each symbol stands for ${k} books. ${listText(labels, sym.map((s) => `${s} symbols`))}. How many books were read on ${labels[idx]}?`, value: val, tag: 'stat/ignore-key',
      steps: [`${labels[idx]} has ${sym[idx]} symbols, each worth ${k} books.`, `${sym[idx]} × ${k} = ${val} books.`], distractors: [sym[idx], val + k, val - k],
      diagram: { kind: 'pictograph', keyValue: k, rows: labels.map((l, i) => [l, sym[i]]) } };
  },
  // ST003 — Bar graphs
  [ST(3)]: (rng) => {
    const labels = fourCats(rng); const vals = labels.map(() => rint(rng, 4, 24));
    const i = rint(rng, 0, 3), j = (i + 1) % 4; const diff = Math.abs(vals[i] - vals[j]);
    const hi = vals[i] >= vals[j] ? labels[i] : labels[j], lo = vals[i] >= vals[j] ? labels[j] : labels[i];
    return { prompt: `A bar graph shows: ${listText(labels, vals)}. How many more ${hi} than ${lo}?`, value: diff, tag: 'stat/scale-interval',
      steps: [`${Math.max(vals[i], vals[j])} − ${Math.min(vals[i], vals[j])} = ${diff}.`], distractors: [vals[i] + vals[j], Math.max(...vals), diff + 1],
      diagram: { kind: 'bar', rows: labels.map((l, k2) => [l, vals[k2]]) } };
  },
  // ST004 — Line graphs
  [ST(4)]: (rng) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']; const start = rint(rng, 5, 15);
    const vals = months.map((_, i) => start + i * rint(rng, 1, 4) + rint(rng, 0, 2));
    const i = rint(rng, 0, 3); const rise = vals[i + 1] - vals[i];
    return { prompt: `A line graph shows monthly readings: ${listText(months, vals)}. By how much did the reading change from ${months[i]} to ${months[i + 1]}?`, value: Math.abs(rise), tag: 'stat/point-misread',
      steps: [`${months[i + 1]} − ${months[i]} = ${vals[i + 1]} − ${vals[i]} = ${Math.abs(rise)}.`], distractors: [vals[i + 1] + vals[i], vals[i + 1], Math.abs(rise) + 2],
      diagram: { kind: 'line', points: months.map((m, k2) => [m, vals[k2]]) } };
  },
  // ST005 — Interpreting and comparing data
  [ST(5)]: (rng) => {
    const labels = fourCats(rng); const vals = labels.map(() => rint(rng, 5, 30));
    const max = Math.max(...vals), min = Math.min(...vals);
    return { prompt: `A bar graph shows: ${listText(labels, vals)}. What is the difference between the highest and lowest values?`, value: max - min, tag: 'stat/trend-overread',
      steps: [`Highest = ${max}, lowest = ${min}.`, `${max} − ${min} = ${max - min}.`], distractors: [max + min, max, max - min + 1],
      diagram: { kind: 'bar', rows: labels.map((l, i) => [l, vals[i]]) } };
  },
  // ST006 — Average (mean), concept (integer by construction)
  [ST(6)]: (rng) => {
    const n = pick(rng, [4, 5]); const mean = rint(rng, 6, 20);
    const vals = []; let sum = 0;
    for (let i = 0; i < n - 1; i++) { const v = mean + rint(rng, -4, 4); vals.push(v); sum += v; }
    vals.push(mean * n - sum); // last value makes the mean exact
    const total = mean * n;
    return { prompt: `Find the mean (average) of these ${n} numbers: ${vals.join(', ')}.`, value: mean, tag: 'stat/mean-not-divide',
      steps: [`Total = ${vals.join(' + ')} = ${total}.`, `Mean = total ÷ count = ${total} ÷ ${n} = ${mean}.`], distractors: [total, mean + 1, Math.round(total / (n + 1))],
      diagram: { kind: 'value-list', values: vals } };
  },
  // ST007 — Mean: find the total or a missing value
  [ST(7)]: (rng) => {
    const n = pick(rng, [4, 5, 6]); const mean = rint(rng, 8, 20);
    if (rng() < 0.5) {
      return { prompt: `The mean of ${n} numbers is ${mean}. What is their total?`, value: n * mean, tag: 'stat/mean-reverse',
        steps: ['Total = mean × count.', `${mean} × ${n} = ${n * mean}.`], distractors: [mean, Math.round(mean / n) || 1, n * mean + mean] };
    }
    const total = n * mean; const known = []; let s = 0;
    for (let i = 0; i < n - 1; i++) { const v = mean + rint(rng, -3, 3); known.push(v); s += v; }
    const missing = total - s;
    return { prompt: `The mean of ${n} numbers is ${mean}. ${n - 1} of them are ${known.join(', ')}. What is the missing number?`, value: missing, tag: 'stat/mean-reverse',
      steps: [`Total = ${mean} × ${n} = ${total}.`, `Missing = ${total} − (${known.join(' + ')}) = ${missing}.`], distractors: [mean, total, missing + 1].filter((d) => d > 0),
      diagram: { kind: 'value-list', values: [...known, '?'] } };
  },
  // ST008 — Pie charts (percentages sum to 100; whole degrees / whole counts)
  [ST(8)]: (rng) => {
    // two or three sectors as multiples of 10 summing to 100
    const a = pick(rng, [20, 30, 40]); const b = pick(rng, [20, 30]); const c = 100 - a - b;
    const labels = COLOURS.slice(0, 3); const pcts = [a, b, c];
    const total = pick(rng, [20, 40, 60, 100]);
    const idx = rint(rng, 0, 2);
    if (rng() < 0.5) {
      const deg = pcts[idx] * 360 / 100;
      return { prompt: `In a pie chart, ${labels.map((l, i) => `${l} is ${pcts[i]}%`).join(', ')}. How many degrees is the ${labels[idx]} sector?`, value: deg, tag: 'stat/pie-angle-fraction',
        steps: [`${pcts[idx]}% of 360° = ${pcts[idx]} ÷ 100 × 360 = ${deg}°.`], distractors: [pcts[idx], Math.round(pcts[idx] * 3.6) + 36, deg + 10],
        diagram: { kind: 'pie', sectors: labels.map((l, i) => [l, pcts[i]]) } };
    }
    const count = pcts[idx] * total / 100;
    return { prompt: `In a pie chart of ${total} children, ${labels.map((l, i) => `${l} is ${pcts[i]}%`).join(', ')}. How many children chose ${labels[idx]}?`, value: count, tag: 'stat/pie-angle-fraction',
      steps: [`${pcts[idx]}% of ${total} = ${pcts[idx]} ÷ 100 × ${total} = ${count}.`], distractors: [pcts[idx], count + 2, Math.round(total / 3)].filter((d) => d > 0),
      diagram: { kind: 'pie', sectors: labels.map((l, i) => [l, pcts[i]]) } };
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
      family, prompt: q.prompt, answerDisplay: String(q.value),
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', diagram: q.diagram,
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    return mcqFrom({
      family, prompt: q.prompt, answerDisplay: String(q.value), q,
      solutionSteps: q.steps, misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng, diagram: q.diagram,
    });
  };
}

const GENERATORS = {
  statTableRead: makePractice(ST(1)), statTableReadMCQ: makeMCQ(ST(1)),
  statPictureGraph: makePractice(ST(2)), statPictureGraphMCQ: makeMCQ(ST(2)),
  statBarGraph: makePractice(ST(3)), statBarGraphMCQ: makeMCQ(ST(3)),
  statLineGraph: makePractice(ST(4)), statLineGraphMCQ: makeMCQ(ST(4)),
  statInterpret: makePractice(ST(5)), statInterpretMCQ: makeMCQ(ST(5)),
  statMeanConcept: makePractice(ST(6)), statMeanConceptWord: makeMCQ(ST(6)),
  statMeanApply: makePractice(ST(7)), statMeanApplyWord: makeMCQ(ST(7)),
  statPieChart: makePractice(ST(8)), statPieChartMCQ: makeMCQ(ST(8)),
};

export function generateStatisticsQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkStatisticsAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '').replace(/°/g, '');
  return { correct: norm(studentResponse) === norm(question.answer?.display ?? question.answer ?? '') };
}

export default { generateStatisticsQuestionSet, checkStatisticsAnswer };
