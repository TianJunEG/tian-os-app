import { getSkill } from './MeasurementSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './MeasurementQuestionFamilies.js';

// MathPath — Measurement question generator.
//
// Rebuilt for question quality (see MATHPATH_QUESTION_QUALITY_AUDIT.md). The old
// file was a stub: every one of the 28 generators returned "Compute: a + b"
// with no units. This version has one real builder per skill (ME001–ME014)
// producing length/mass/capacity, scale reading, time, unit conversion,
// comparison, perimeter/area/volume in context, nets, rate and money — each
// with the unit shown, misconception distractors and worked solutions.
//
// Answers carry their unit (e.g. "400 cm", "96 m²", "$3.50"); checkMeasurement
// Answer is unit-tolerant so "400", "400cm" and "400 cm" all match.

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
function cmpSym(a, b) { return a > b ? '>' : a < b ? '<' : '='; }

// ── Display helpers ──────────────────────────────────────────────────────────
function fmtVal(v, { unit = '', money = false } = {}) {
  if (money) return `$${Number(v).toFixed(2)}`;
  return unit ? `${v} ${unit}` : `${v}`;
}

// ── Question envelope builders ───────────────────────────────────────────────
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

const ME = (n) => `ME${String(n).padStart(3, '0')}`;

// Conversion presets: multiply `from`-units by `factor` to get `to`-units.
const LENGTH_CONV = [
  { from: 'm', to: 'cm', factor: 100 }, { from: 'km', to: 'm', factor: 1000 }, { from: 'cm', to: 'mm', factor: 10 },
];
const MASS_CONV = [{ from: 'kg', to: 'g', factor: 1000 }];
const CAP_CONV = [{ from: 'L', to: 'ml', factor: 1000 }];
const ALL_CONV = [...LENGTH_CONV, ...MASS_CONV, ...CAP_CONV];

function conversionBuilder(rng, presets, tag) {
  const c = pick(rng, presets);
  const n = rint(rng, 2, 9);
  const ans = n * c.factor;
  return {
    prompt: `Convert: ${n} ${c.from} = ____ ${c.to}.`, value: ans, unit: c.to, tag,
    steps: [`1 ${c.from} = ${c.factor} ${c.to}.`, `${n} × ${c.factor} = ${ans} ${c.to}.`],
    distractors: [n * c.factor * 10, n, n * (c.factor / 10)],
  };
}

const BUILDERS = {
  // ME001 — Length and its units
  [ME(1)]: (rng) => conversionBuilder(rng, LENGTH_CONV, 'mea/wrong-unit'),
  // ME002 — Mass and its units
  [ME(2)]: (rng) => conversionBuilder(rng, MASS_CONV, 'mea/wrong-unit'),
  // ME003 — Volume and capacity
  [ME(3)]: (rng) => conversionBuilder(rng, CAP_CONV, 'mea/capacity-volume-confuse'),
  // ME004 — Reading measuring scales
  [ME(4)]: (rng) => {
    const interval = pick(rng, [5, 10, 20, 25, 50, 100]);
    const start = interval * rint(rng, 0, 4);
    const marks = rint(rng, 1, 5);
    const ans = start + marks * interval;
    return {
      prompt: `A scale is marked every ${interval} g. The pointer is ${marks} mark(s) past ${start} g. What mass does it show?`,
      value: ans, unit: 'g', tag: 'mea/scale-interval',
      steps: [`Each interval is ${interval} g.`, `${start} + ${marks} × ${interval} = ${ans} g.`],
      distractors: [start + marks, ans + interval, start],
      diagram: { kind: 'scale', start, interval, marks, reading: ans, unit: 'g' },
    };
  },
  // ME005 — Telling time / 24-hour clock
  [ME(5)]: (rng) => {
    const h = rint(rng, 1, 11), m = pick(rng, [0, 5, 15, 20, 30, 45]);
    const pm = rng() < 0.5;
    const H = pm ? h + 12 : h;
    const ans = `${String(H).padStart(2, '0')}${String(m).padStart(2, '0')}`;
    return {
      prompt: `Write ${h}:${String(m).padStart(2, '0')} ${pm ? 'p.m.' : 'a.m.'} using the 24-hour clock.`,
      value: ans, unit: '', tag: 'mea/24hr-convert', raw: true,
      steps: pm ? [`For p.m., add 12 to the hour: ${h} + 12 = ${h + 12}.`, `So ${h}:${String(m).padStart(2, '0')} p.m. = ${ans}.`]
                : [`For a.m., write the time with four digits.`, `${h}:${String(m).padStart(2, '0')} a.m. = ${ans}.`],
      choices: [ans, `${String(pm ? h : h + 12).padStart(2, '0')}${String(m).padStart(2, '0')}`, `${String((H + 1) % 24).padStart(2, '0')}${String(m).padStart(2, '0')}`, `${String(H).padStart(2, '0')}${String((m + 5) % 60).padStart(2, '0')}`],
    };
  },
  // ME006 — Duration and time intervals
  [ME(6)]: (rng) => {
    const startMin = rint(rng, 6, 18) * 60 + pick(rng, [0, 5, 10, 15, 30, 45]);
    const dur = rint(rng, 1, 4) * 60 + pick(rng, [5, 10, 15, 20, 30, 45]);
    const end = startMin + dur;
    const f = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}${String(t % 60).padStart(2, '0')}`;
    return {
      prompt: `A film starts at ${f(startMin)} and ends at ${f(end)}. How many minutes long is it?`,
      value: dur, unit: 'min', tag: 'mea/time-base-60',
      steps: [`From ${f(startMin)} to ${f(end)} is ${Math.floor(dur / 60)} h ${dur % 60} min.`, `That is ${Math.floor(dur / 60)} × 60 + ${dur % 60} = ${dur} minutes.`],
      distractors: [dur + 40, dur - 40 > 0 ? dur - 40 : dur + 100, Math.floor(dur / 60) * 100 + (dur % 60)],
    };
  },
  // ME007 — Unit conversions
  [ME(7)]: (rng) => conversionBuilder(rng, ALL_CONV, 'mea/convert-direction'),
  // ME008 — Comparing and converting measurements
  [ME(8)]: (rng) => {
    const aCm = rint(rng, 105, 295), bCm = rint(rng, 105, 295);
    const aDisp = `${Math.floor(aCm / 100)} m ${aCm % 100} cm`;
    return {
      prompt: `Compare these lengths. Write <, > or =:  ${aDisp} ___ ${bCm} cm`,
      value: cmpSym(aCm, bCm), unit: '', tag: 'mea/compare-mixed-units', raw: true,
      steps: [`${aDisp} = ${aCm} cm.`, `${aCm} cm ${cmpSym(aCm, bCm)} ${bCm} cm.`],
      choices: ['<', '>', '='],
    };
  },
  // ME009 — Perimeter in context
  [ME(9)]: (rng) => {
    const l = rint(rng, 4, 20), w = rint(rng, 3, 15);
    const ans = 2 * (l + w);
    return {
      prompt: `A rectangular garden is ${l} m long and ${w} m wide. What is its perimeter?`,
      value: ans, unit: 'm', tag: 'mea/perimeter-units',
      steps: ['Perimeter = 2 × (length + width).', `2 × (${l} + ${w}) = ${ans} m.`],
      distractors: [l * w, 2 * l + w, l + w], // area / partial
    };
  },
  // ME010 — Area in context
  [ME(10)]: (rng) => {
    const l = rint(rng, 4, 20), w = rint(rng, 3, 15);
    const ans = l * w;
    return {
      prompt: `A rectangular field is ${l} m long and ${w} m wide. What is its area?`,
      value: ans, unit: 'm²', tag: 'mea/area-units',
      steps: ['Area = length × width.', `${l} × ${w} = ${ans} m².`],
      distractors: [2 * (l + w), l + w, l * w + l], // perimeter
    };
  },
  // ME011 — Volume of cubes and cuboids
  [ME(11)]: (rng) => {
    const l = rint(rng, 2, 12), w = rint(rng, 2, 10), h = rint(rng, 2, 8);
    const ans = l * w * h;
    return {
      prompt: `A cuboid is ${l} cm long, ${w} cm wide and ${h} cm high. What is its volume?`,
      value: ans, unit: 'cm³', tag: 'mea/volume-add-edges',
      steps: ['Volume = length × width × height.', `${l} × ${w} × ${h} = ${ans} cm³.`],
      distractors: [l + w + h, l * w, 2 * (l * w + w * h + l * h)], // edges sum / area / surface area
    };
  },
  // ME012 — Nets and volume of cuboids
  [ME(12)]: (rng) => {
    const l = rint(rng, 2, 10), w = rint(rng, 2, 8), h = rint(rng, 2, 6);
    const ans = l * w * h;
    return {
      prompt: `A net folds into a cuboid measuring ${l} cm by ${w} cm by ${h} cm. What is the volume of the cuboid?`,
      value: ans, unit: 'cm³', tag: 'mea/net-dimensions',
      steps: ['Find the three dimensions from the net, then multiply.', `${l} × ${w} × ${h} = ${ans} cm³.`],
      distractors: [l + w + h, l * w, l * w * h + l * w],
      diagram: { kind: 'net', shape: 'cuboid', l, w, h },
    };
  },
  // ME013 — Volume, water level and rate
  [ME(13)]: (rng) => {
    const rate = rint(rng, 2, 9), t = rint(rng, 2, 8);
    const ans = rate * t;
    return {
      prompt: `Water flows into a tank at ${rate} litres per minute. How much water is in the tank after ${t} minutes?`,
      value: ans, unit: 'L', tag: 'mea/rate-volume-confuse',
      steps: ['Volume = rate × time.', `${rate} × ${t} = ${ans} L.`],
      distractors: [rate + t, ans + rate, Math.abs(rate - t) || rate],
    };
  },
  // ME014 — Money word problems
  [ME(14)]: (rng) => {
    const each = rint(rng, 2, 9), qty = rint(rng, 2, 6), extra = rint(rng, 3, 30);
    const spent = each * qty, start = spent + extra, left = start - spent;
    return {
      prompt: `A pupil has $${start.toFixed(2)}. ${'They'} buy ${qty} notebooks costing $${each.toFixed(2)} each. How much money is left?`,
      value: left, money: true, tag: 'mea/money-decimal-place',
      steps: [`Cost = ${qty} × $${each.toFixed(2)} = $${spent.toFixed(2)}.`, `Left = $${start.toFixed(2)} − $${spent.toFixed(2)} = $${left.toFixed(2)}.`],
      distractors: [start - each, spent, start + spent],
    };
  },

  // ── Word-problem families (_003): one per skill, harder real-world contexts ──

  // ME001W — Mixed-unit length: total of two paths in cm
  'ME001W': (rng) => {
    const aM = rint(rng, 1, 8), aCm = rint(rng, 10, 90);
    const bM = rint(rng, 1, 8), bCm = rint(rng, 10, 90);
    const totalCm = (aM + bM) * 100 + aCm + bCm;
    return {
      prompt: `Path A is ${aM} m ${aCm} cm long. Path B is ${bM} m ${bCm} cm long. What is their total length in cm?`,
      value: totalCm, unit: 'cm', tag: 'mea/wrong-unit',
      steps: [`Path A: ${aM} m ${aCm} cm = ${aM * 100 + aCm} cm.`, `Path B: ${bM} m ${bCm} cm = ${bM * 100 + bCm} cm. Total = ${totalCm} cm.`],
      distractors: [aM + bM, totalCm / 100, totalCm + 100],
    };
  },
  // ME002W — Mixed-unit mass: bag total in grams
  'ME002W': (rng) => {
    const a = rint(rng, 1, 5), b = rint(rng, 100, 900);
    const total = a * 1000 + b;
    return {
      prompt: `A shopping bag has ${a} kg and ${b} g of vegetables. What is the total mass in grams?`,
      value: total, unit: 'g', tag: 'mea/wrong-unit',
      steps: [`${a} kg = ${a * 1000} g.`, `Total = ${a * 1000} + ${b} = ${total} g.`],
      distractors: [a + b, total - 1000, total / 1000],
    };
  },
  // ME003W — Mixed-unit capacity: jug total in ml
  'ME003W': (rng) => {
    const a = rint(rng, 1, 5), b = rint(rng, 100, 900);
    const total = a * 1000 + b;
    return {
      prompt: `A jug holds ${a} L and ${b} ml of juice. What is the total volume in ml?`,
      value: total, unit: 'ml', tag: 'mea/capacity-volume-confuse',
      steps: [`${a} L = ${a * 1000} ml.`, `Total = ${a * 1000} + ${b} = ${total} ml.`],
      distractors: [a + b, total - 1000, total / 1000],
    };
  },
  // ME004W — Scale applied: bowl + fruit → find fruit mass
  'ME004W': (rng) => {
    const bowl = pick(rng, [150, 200, 250, 300]);
    const fruitG = rint(rng, 2, 12) * 100;
    const total = bowl + fruitG;
    return {
      prompt: `A scale reads ${total} g when a bowl of fruit is placed on it. The empty bowl weighs ${bowl} g. What is the mass of the fruit?`,
      value: fruitG, unit: 'g', tag: 'mea/scale-interval',
      steps: [`Mass of fruit = scale reading − bowl mass.`, `${total} − ${bowl} = ${fruitG} g.`],
      distractors: [total, total + bowl, fruitG + 100],
    };
  },
  // ME005W — 24-hour clock in a schedule context
  'ME005W': (rng) => {
    const h = rint(rng, 1, 11), m = pick(rng, [0, 5, 15, 20, 30, 45]);
    const pm = rng() < 0.5;
    const H = pm ? h + 12 : h;
    const ans = `${String(H).padStart(2, '0')}${String(m).padStart(2, '0')}`;
    const event = pick(rng, ['concert', 'match', 'class', 'show', 'flight', 'bus']);
    return {
      prompt: `A ${event} is scheduled at ${h}:${String(m).padStart(2, '0')} ${pm ? 'p.m.' : 'a.m.'}. Write this time in 24-hour format.`,
      value: ans, unit: '', tag: 'mea/24hr-convert', raw: true,
      steps: pm ? [`For p.m., add 12 to the hour: ${h} + 12 = ${H}.`, `Answer: ${ans}.`]
                : [`For a.m., write with 4 digits.`, `Answer: ${ans}.`],
      choices: [ans, `${String(pm ? h : h + 12).padStart(2, '0')}${String(m).padStart(2, '0')}`, `${String((H + 1) % 24).padStart(2, '0')}${String(m).padStart(2, '0')}`, `${String(H).padStart(2, '0')}${String((m + 5) % 60).padStart(2, '0')}`],
    };
  },
  // ME006W — Find end time given start time + duration
  'ME006W': (rng) => {
    const startH = rint(rng, 8, 15), startM = pick(rng, [0, 10, 15, 30]);
    const durH = rint(rng, 1, 3), durM = pick(rng, [0, 10, 15, 20, 30]);
    const startMin = startH * 60 + startM;
    const endMin = startMin + durH * 60 + durM;
    const f = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}${String(t % 60).padStart(2, '0')}`;
    const event = pick(rng, ['lesson', 'match', 'workshop', 'concert']);
    const durLabel = durM > 0 ? `${durH} h ${durM} min` : `${durH} h`;
    return {
      prompt: `A ${event} starts at ${f(startMin)} and lasts ${durLabel}. At what time does it end? (Give answer in 24-hour format.)`,
      value: f(endMin), unit: '', tag: 'mea/time-base-60', raw: true,
      steps: [`Duration = ${durH * 60 + durM} min total.`, `${f(startMin)} + ${durH * 60 + durM} min = ${f(endMin)}.`],
      choices: [f(endMin), f((endMin + 30) % (24 * 60)), f((endMin + 60) % (24 * 60)), f(endMin - 30)],
    };
  },
  // ME007W — Two-step: multiply by count, then convert kg → g
  'ME007W': (rng) => {
    const n = rint(rng, 2, 5), wKg = rint(rng, 1, 4);
    const totalG = n * wKg * 1000;
    const obj = pick(rng, ['bags of rice', 'bags of flour', 'boxes of apples', 'boxes of books']);
    return {
      prompt: `Ali buys ${n} ${obj}, each weighing ${wKg} kg. What is the total mass in grams?`,
      value: totalG, unit: 'g', tag: 'mea/convert-direction',
      steps: [`Total mass = ${n} × ${wKg} kg = ${n * wKg} kg.`, `${n * wKg} kg = ${n * wKg} × 1000 = ${totalG} g.`],
      distractors: [n * wKg, totalG / 100, totalG + 1000],
    };
  },
  // ME008W — Cut ribbon: convert mixed units then subtract
  'ME008W': (rng) => {
    const aM = rint(rng, 1, 5), aCm = rint(rng, 20, 90);
    const cut = rint(rng, 10, Math.max(10, aCm - 5));
    const totalCm = aM * 100 + aCm;
    const left = totalCm - cut;
    return {
      prompt: `Kai has a ribbon ${aM} m ${aCm} cm long. He cuts off ${cut} cm. How many cm does he have left?`,
      value: left, unit: 'cm', tag: 'mea/compare-mixed-units',
      steps: [`${aM} m ${aCm} cm = ${totalCm} cm.`, `${totalCm} − ${cut} = ${left} cm.`],
      distractors: [aM * 100 - cut, totalCm + cut, left + 100],
    };
  },
  // ME009W — Find length given perimeter and width (reverse perimeter)
  'ME009W': (rng) => {
    const perim = rint(rng, 10, 30) * 2;
    const maxW = Math.floor(perim / 4) - 1;
    const w = rint(rng, 2, Math.max(2, maxW));
    const l = perim / 2 - w;
    return {
      prompt: `A rectangular field has a perimeter of ${perim} m. Its width is ${w} m. What is its length?`,
      value: l, unit: 'm', tag: 'mea/perimeter-units',
      steps: [`Perimeter = 2 × (length + width).`, `2 × (length + ${w}) = ${perim}, so length + ${w} = ${perim / 2}.`, `Length = ${perim / 2} − ${w} = ${l} m.`],
      distractors: [perim - w, perim / 2, perim - 2 * w],
    };
  },
  // ME010W — Find width given area and length (reverse area)
  'ME010W': (rng) => {
    const l = rint(rng, 4, 15), w = rint(rng, 3, 12);
    const area = l * w;
    return {
      prompt: `A rectangular garden has an area of ${area} m². Its length is ${l} m. What is its width?`,
      value: w, unit: 'm', tag: 'mea/area-units',
      steps: [`Area = length × width.`, `${area} = ${l} × width, so width = ${area} ÷ ${l} = ${w} m.`],
      distractors: [area, l + w, w + 2],
    };
  },
  // ME011W — Find height given volume and base dimensions (fish tank)
  'ME011W': (rng) => {
    const l = rint(rng, 3, 10), w = rint(rng, 2, 8), h = rint(rng, 2, 6);
    const vol = l * w * h;
    return {
      prompt: `A fish tank has a volume of ${vol} cm³. It is ${l} cm long and ${w} cm wide. What is its height?`,
      value: h, unit: 'cm', tag: 'mea/volume-add-edges',
      steps: [`Volume = length × width × height.`, `${vol} = ${l} × ${w} × height, so height = ${vol} ÷ ${l * w} = ${h} cm.`],
      distractors: [l + w + h, l * w, h + 2],
    };
  },
  // ME012W — Find height given volume and base dimensions (gift box / net context)
  'ME012W': (rng) => {
    const l = rint(rng, 3, 10), w = rint(rng, 2, 8), h = rint(rng, 2, 6);
    const vol = l * w * h;
    return {
      prompt: `A gift box is a cuboid with volume ${vol} cm³. Its base measures ${l} cm by ${w} cm. What is the height of the box?`,
      value: h, unit: 'cm', tag: 'mea/net-dimensions',
      steps: [`Volume = length × width × height.`, `${vol} = ${l} × ${w} × height, so height = ${vol} ÷ ${l * w} = ${h} cm.`],
      distractors: [l + w + h, l * w, h + 3],
    };
  },
  // ME013W — Find time to fill a tank given flow rate (inverse rate)
  'ME013W': (rng) => {
    const rate = rint(rng, 2, 8), t = rint(rng, 2, 8);
    const total = rate * t;
    return {
      prompt: `Water flows into a tank at ${rate} litres per minute. How many minutes does it take to fill a ${total}-litre tank?`,
      value: t, unit: 'min', tag: 'mea/rate-volume-confuse',
      steps: [`Time = volume ÷ rate.`, `${total} ÷ ${rate} = ${t} min.`],
      distractors: [rate * total, t + rate, Math.abs(total - rate)],
    };
  },
  // ME014W — Two-item purchase: book + pen, find change
  'ME014W': (rng) => {
    const bookCost = rint(rng, 3, 12), penCost = rint(rng, 1, 5);
    const extra = rint(rng, 2, 20);
    const start = bookCost + penCost + extra;
    return {
      prompt: `Ali has $${start}.00. He buys a book for $${bookCost}.00 and a pen for $${penCost}.00. How much money does he have left?`,
      value: extra, money: true, tag: 'mea/money-decimal-place',
      steps: [`Total spent = $${bookCost} + $${penCost} = $${bookCost + penCost}.`, `Left = $${start} − $${bookCost + penCost} = $${extra}.`],
      distractors: [start - bookCost, start - penCost, bookCost + penCost],
    };
  },
};

function runBuilder(skillId, rng, variant) {
  const build = BUILDERS[skillId];
  return build ? build(rng, variant) : null;
}

function buildChoices(q, answerDisplay) {
  if (q.choices) return q.choices.map(String);
  const opts = [String(answerDisplay)];
  const seen = new Set(opts);
  for (const d of q.distractors || []) {
    const disp = fmtVal(d, q);
    if (!seen.has(disp) && Number(d) > 0) { seen.add(disp); opts.push(disp); }
  }
  // numeric backfill (positive) for any collisions
  const base = Number(q.value);
  const deltas = [1, -1, 2, -2, 10, -10, 5, -5, 3, -3];
  for (let i = 0; opts.length < 4 && i < deltas.length; i++) {
    const v = base + deltas[i];
    if (v <= 0) continue;
    const disp = fmtVal(v, q);
    if (!seen.has(disp)) { seen.add(disp); opts.push(disp); }
  }
  return opts.slice(0, 4);
}

function makePractice(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    const answerDisplay = q.raw ? String(q.value) : fmtVal(q.value, q);
    return shortAnswer({
      family, prompt: q.prompt, answerDisplay, solutionSteps: q.steps,
      misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', diagram: q.diagram,
    });
  };
}
function makeMCQ(skillId) {
  return (family, rng, variant) => {
    const q = runBuilder(skillId, rng, variant);
    const answerDisplay = q.raw ? String(q.value) : fmtVal(q.value, q);
    return mcqFrom({
      family, prompt: q.prompt, answerDisplay,
      choices: buildChoices(q, answerDisplay), solutionSteps: q.steps,
      misconceptionTag: q.tag || (family.misconceptionTags || [])[0] || '',
      difficulty: family.difficulty, mode: 'practice', rng, diagram: q.diagram,
    });
  };
}

const KIND_TO_SKILL = {
  meaMeaLength: ME(1), meaMeaMass: ME(2), meaMeaVolumeCapacity: ME(3), meaMeaReadScales: ME(4),
  meaMeaTimeTell: ME(5), meaMeaTimeDuration: ME(6), meaMeaUnitConvert: ME(7), meaMeaCompareMeasures: ME(8),
  meaMeaPerimeterApply: ME(9), meaMeaAreaApply: ME(10), meaMeaVolumeCuboid: ME(11), meaMeaNetsVolume: ME(12),
  meaMeaVolumeRate: ME(13), meaMeaMoney: ME(14),
  // Word-problem generator kinds (_003 families)
  meaMeaLengthWord: 'ME001W', meaMeaMassWord: 'ME002W', meaMeaCapacityWord: 'ME003W', meaMeaScaleApply: 'ME004W',
  meaMeaTimeSchedule: 'ME005W', meaMeaEndTime: 'ME006W', meaMeaConvertApply: 'ME007W', meaMeaCompareApply: 'ME008W',
  meaMeaPerimeterFind: 'ME009W', meaMeaAreaFind: 'ME010W', meaMeaVolumeFind: 'ME011W', meaMeaNetFind: 'ME012W',
  meaMeaFillTime: 'ME013W', meaMeaMoneyMulti: 'ME014W',
};

const GENERATORS = {};
for (const [kind, skillId] of Object.entries(KIND_TO_SKILL)) {
  GENERATORS[kind] = makePractice(skillId);
  GENERATORS[`${kind}MCQ`] = makeMCQ(skillId);
}

export function generateMeasurementQuestionSet({ skillId, count = 6, mode = 'practice', sessionSalt = '' }) {
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

// Unit-tolerant: compares the numeric content, so "400", "400cm" and "400 cm"
// all match; "$3.50", "3.50" and "3.5" match; "<"/">"/"=" compare directly.
export function checkMeasurementAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const raw = String(studentResponse).trim().toLowerCase();
  const exp = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  if (['<', '>', '='].includes(exp)) return { correct: raw === exp };
  if (raw === exp) return { correct: true };
  // Strip unit tokens first so the "3" in "cm3" isn't read as a digit.
  const stripUnits = (s) => s.replace(/cm³|cm3|cm²|cm2|m³|m3|m²|m2|cm|km|mm|ml|kg|\bl\b|\bg\b/g, '');
  const digits = (s) => stripUnits(s).replace(/[^0-9.\-]/g, '');
  const a = digits(raw), b = digits(exp);
  if (a !== '' && a === b) return { correct: true };
  const na = parseFloat(a), nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return { correct: true };
  return { correct: false };
}

export default { generateMeasurementQuestionSet, checkMeasurementAnswer };
