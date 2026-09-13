import { getSkill } from './ratioRateSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './ratioRateQuestionFamilies.js';

// Rule-based Ratio & Rate question generator. Deterministic: the same
// (skillId, questionFamilyId, variant) always yields the same question.
// Follows the same structure as percentageQuestionGenerator.js exactly.

// ── Seeded RNG (mulberry32 over a string hash) ──────────────────────────────
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seedStr) {
  let a = hashSeed(seedStr);
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rint(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick(rng, arr) {
  return arr[rint(rng, 0, arr.length - 1)];
}

// ── Math helpers ─────────────────────────────────────────────────────────────
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// Reduce a fraction num/den to lowest terms
function reduceFraction(num, den) {
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

// ── Question assembly helpers ─────────────────────────────────────────────────
function shortAnswer({ family, prompt, answer, display, solutionSteps, misconceptionTag, difficulty, mode, placeholder, answerFormat }) {
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'short_answer',
    prompt,
    choices: [],
    answer: { display: display ?? String(answer), value: answer },
    acceptedAnswers: [display ?? String(answer)],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
    ...(placeholder ? { placeholder } : {}),
    ...(answerFormat ? { answerFormat } : {}),
  };
}

function mcq({ family, prompt, answerDisplay, distractors, solutionSteps, misconceptionTag, difficulty, mode, rng }) {
  const seen = new Set([answerDisplay]);
  const opts = [];
  for (const d of distractors.map(String)) {
    if (!seen.has(d)) { seen.add(d); opts.push(d); }
  }
  const choices = [answerDisplay, ...opts.slice(0, 3)];
  // deterministic shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rint(rng, 0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'mcq',
    prompt,
    choices,
    answer: { display: answerDisplay, value: answerDisplay },
    acceptedAnswers: [answerDisplay],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
  };
}

// ── Per-kind generators ───────────────────────────────────────────────────────
const GENERATORS = {
  rrMeaning(rng, family, difficulty, mode) {
    // Generate coprime pairs a, b in 2–9
    const coprimeOptions = [];
    for (let a = 2; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) {
        if (a !== b && gcd(a, b) === 1) coprimeOptions.push([a, b]);
      }
    }
    const [a, b] = pick(rng, coprimeOptions);
    const total = a + b;
    const answerDisplay = `${a}:${b}`;

    if (family.misconceptionTags.includes('rr/part-whole-mixup')) {
      // Part-to-whole variant
      const prompt = `There are ${a} red and ${b} blue counters. What is the ratio of red counters to the total?`;
      const ans = `${a}:${total}`;
      return mcq({
        family, rng, prompt, answerDisplay: ans,
        distractors: [`${a}:${b}`, `${b}:${total}`, `${total}:${a}`],
        solutionSteps: [
          `Total = ${a} + ${b} = ${total}.`,
          `Red : Total = ${a} : ${total}.`,
        ],
        misconceptionTag: 'rr/part-whole-mixup',
        difficulty, mode,
      });
    }

    const prompt = `There are ${a} red and ${b} blue counters. What is the ratio of red to blue?`;
    return mcq({
      family, rng, prompt, answerDisplay,
      distractors: [`${b}:${a}`, `${a}:${total}`, `${total}:${a}`],
      solutionSteps: [
        `Red : Blue = ${a} : ${b}.`,
      ],
      misconceptionTag: 'rr/order-reversed',
      difficulty, mode,
    });
  },

  rrEquivalent(rng, family, difficulty, mode) {
    const simpleOptions = [[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[1,6],[2,7],[3,8]];
    const [a, b] = pick(rng, simpleOptions);
    const k = rint(rng, 2, 5);
    const ak = a * k;
    const bk = b * k;
    const prompt = `Complete the equivalent ratio: ${a} : ${b} = ${ak} : ?`;
    return shortAnswer({
      family,
      prompt,
      answer: bk,
      display: String(bk),
      solutionSteps: [
        `${ak} ÷ ${a} = ${k} (the scale factor).`,
        `So ? = ${b} × ${k} = ${bk}.`,
      ],
      misconceptionTag: 'rr/add-not-multiply',
      difficulty,
      mode,
    });
  },

  rrSimplify(rng, family, difficulty, mode) {
    // Pick factor and coprime pair, multiply up to get the ratio to simplify
    const factors = [2, 3, 4, 5, 6];
    const coprimeOptions = [[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[1,6],[4,5],[3,7],[2,7],[5,6]];
    const [p, q] = pick(rng, coprimeOptions);
    const f = pick(rng, factors);
    const a = p * f;
    const b = q * f;
    const display = `${p}:${q}`;
    return shortAnswer({
      family,
      prompt: `Simplify the ratio ${a} : ${b}.`,
      answer: display,
      display,
      solutionSteps: [
        `HCF(${a}, ${b}) = ${f}.`,
        `${a} ÷ ${f} = ${p}, ${b} ÷ ${f} = ${q}.`,
        `Simplest form: ${p} : ${q}.`,
      ],
      misconceptionTag: 'rr/incomplete-simplify',
      difficulty,
      mode,
    });
  },

  rrThreeTerm(rng, family, difficulty, mode) {
    const factors = [2, 3, 4, 5, 6];
    // Coprime triples (gcd of all three = 1) — 20 options keeps the pool large
    // enough that duplicate questions within a 6-question session are negligible.
    const tripleOptions = [
      [1,2,3],[2,3,4],[1,3,5],[2,3,5],[1,2,5],[3,4,5],[1,4,5],[2,5,7],[1,3,4],[3,5,7],
      [2,3,7],[1,4,7],[3,4,7],[4,5,6],[3,5,8],[2,5,9],[1,5,9],[4,5,7],[3,7,8],[5,7,9],
    ];
    const [p, q, r] = pick(rng, tripleOptions);
    const f = pick(rng, factors);
    const a = p * f;
    const b = q * f;
    const c = r * f;
    const display = `${p}:${q}:${r}`;
    return shortAnswer({
      family,
      prompt: `Simplify the ratio ${a} : ${b} : ${c}.`,
      answer: display,
      display,
      solutionSteps: [
        `HCF(${a}, ${b}, ${c}) = ${f}.`,
        `${a} ÷ ${f} = ${p}, ${b} ÷ ${f} = ${q}, ${c} ÷ ${f} = ${r}.`,
        `Simplest form: ${p} : ${q} : ${r}.`,
      ],
      misconceptionTag: 'rr/pairwise-only',
      difficulty,
      mode,
    });
  },

  rrRatioFraction(rng, family, difficulty, mode) {
    const coprimeOptions = [];
    for (let a = 2; a <= 7; a++) {
      for (let b = 2; b <= 7; b++) {
        if (a !== b && gcd(a, b) === 1) coprimeOptions.push([a, b]);
      }
    }
    const [a, b] = pick(rng, coprimeOptions);
    const total = a + b;
    const { num, den } = reduceFraction(a, total);
    const display = `${num}/${den}`;
    const prompt = `Red to blue is ${a} : ${b}. What fraction of the counters are red?`;
    return shortAnswer({
      family,
      prompt,
      answer: display,
      display,
      answerFormat: 'fraction',
      solutionSteps: [
        `Total parts = ${a} + ${b} = ${total}.`,
        `Red fraction = ${a}/${total}${num !== a ? ` = ${num}/${den}` : ''}.`,
      ],
      misconceptionTag: 'rr/part-part-as-fraction',
      difficulty,
      mode,
    });
  },

  rrRatioPercent(rng, family, difficulty, mode) {
    // Choose a, b so a/(a+b)*100 is a whole number
    // (a+b) must divide 100 → possible totals: 1,2,4,5,10,20,25,50,100
    const pairOptions = [];
    const validTotals = [2, 4, 5, 10, 20, 25, 50, 100];
    for (const tot of validTotals) {
      for (let a = 1; a < tot; a++) {
        const b = tot - a;
        if (b > 0 && gcd(a, b) === 1) pairOptions.push([a, b]);
      }
    }
    const [a, b] = pick(rng, pairOptions.slice(0, 30));
    const total = a + b;
    const pct = Math.round((a / total) * 100);
    const contexts = ['boys to girls', 'red to blue marbles', 'passed to failed'];
    const ctx = pick(rng, contexts);
    const parts = ctx.split(' to ');
    const prompt = `The ratio of ${parts[0]} to ${parts[1]} is ${a} : ${b}. What percentage are ${parts[0]}?`;
    return shortAnswer({
      family,
      prompt,
      answer: pct,
      display: `${pct}%`,
      solutionSteps: [
        `Total parts = ${a} + ${b} = ${total}.`,
        `Fraction = ${a}/${total}.`,
        `Percentage = ${a}/${total} × 100 = ${pct}%.`,
      ],
      misconceptionTag: 'rr/percent-of-part',
      difficulty,
      mode,
    });
  },

  rrDivide(rng, family, difficulty, mode) {
    const coprimeOptions = [[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[1,6],[4,5],[2,7]];
    const [a, b] = pick(rng, coprimeOptions);
    const unitVal = rint(rng, 5, 50);
    const total = (a + b) * unitVal;
    const shareA = a * unitVal;
    const shareB = b * unitVal;
    const names = [['Ali', 'Bala'], ['Amy', 'Ben'], ['Siti', 'Raju'], ['Tom', 'Jerry']];
    const [nameA, nameB] = pick(rng, names);
    const askBoth = family.name.toLowerCase().includes('both');
    const prompt = askBoth
      ? `$${total} is shared between ${nameA} and ${nameB} in the ratio ${a} : ${b}. How much does each person get?`
      : `$${total} is shared between ${nameA} and ${nameB} in the ratio ${a} : ${b}. How much does ${nameA} get?`;
    const display = askBoth ? `$${shareA} and $${shareB}` : `$${shareA}`;
    const answer = askBoth ? `$${shareA} and $${shareB}` : `$${shareA}`;
    return shortAnswer({
      family,
      prompt,
      answer,
      display,
      placeholder: askBoth ? `e.g. $${shareA} and $${shareB}` : undefined,
      solutionSteps: [
        `Total units = ${a} + ${b} = ${a + b}.`,
        `1 unit = $${total} ÷ ${a + b} = $${unitVal}.`,
        `${nameA}'s share = ${a} × $${unitVal} = $${shareA}.`,
        ...(askBoth ? [`${nameB}'s share = ${b} × $${unitVal} = $${shareB}.`] : []),
      ],
      misconceptionTag: 'rr/forgot-total-units',
      difficulty,
      mode,
    });
  },

  rrDivideThree(rng, family, difficulty, mode) {
    const tripleOptions = [[1,2,3],[2,3,4],[1,3,5],[2,3,5],[1,2,5],[3,4,5],[1,4,5],[2,3,7],[1,3,4]];
    const [a, b, c] = pick(rng, tripleOptions);
    const unitVal = rint(rng, 3, 20);
    const total = (a + b + c) * unitVal;
    const shares = [a * unitVal, b * unitVal, c * unitVal];
    const maxShare = Math.max(...shares);
    const sumABC = a + b + c;
    const askAll = family.name.toLowerCase().includes('each');
    const names = [['Ali', 'Bala', 'Cheng'], ['Amy', 'Ben', 'Cass']];
    const [n1, n2, n3] = pick(rng, names);
    const prompt = askAll
      ? `$${total} is shared among ${n1}, ${n2} and ${n3} in the ratio ${a} : ${b} : ${c}. Find each person's share.`
      : `$${total} is shared among ${n1}, ${n2} and ${n3} in the ratio ${a} : ${b} : ${c}. Find the largest share.`;
    const display = askAll ? `$${shares[0]}, $${shares[1]}, $${shares[2]}` : `$${maxShare}`;
    return shortAnswer({
      family,
      prompt,
      answer: display,
      display,
      placeholder: askAll ? `e.g. $${shares[0]}, $${shares[1]}, $${shares[2]}` : undefined,
      solutionSteps: [
        `Total units = ${a} + ${b} + ${c} = ${sumABC}.`,
        `1 unit = $${total} ÷ ${sumABC} = $${unitVal}.`,
        `${n1}: ${a} × $${unitVal} = $${shares[0]}.`,
        `${n2}: ${b} × $${unitVal} = $${shares[1]}.`,
        `${n3}: ${c} × $${unitVal} = $${shares[2]}.`,
        ...(askAll ? [] : [`Largest share = $${maxShare}.`]),
      ],
      misconceptionTag: 'rr/three-units-error',
      difficulty,
      mode,
    });
  },

  rrBeforeAfter(rng, family, difficulty, mode) {
    // Before: boys : girls = a : b. Girls count is unchanged.
    // After n boys join, total becomes girls * (c/d) + girls where c/d is the new boys:girls ratio.
    // Simpler: choose girlCount first, then add boys.
    const ratioOptions = [[1,2],[2,3],[3,4],[1,3],[2,5],[3,5]];
    const [a, b] = pick(rng, ratioOptions);
    const unitsBefore = rint(rng, 2, 6);
    const girlCount = b * unitsBefore;
    const boysBefore = a * unitsBefore;
    const boysAdded = rint(rng, 1, 4) * (a > 1 ? 1 : 2);
    const boysAfter = boysBefore + boysAdded;

    if (family.name.toLowerCase().includes('harder')) {
      // Harder: given after-ratio and total, find original boys.
      // Check the filtered set BEFORE destructuring: when `a` is the largest
      // first term the filter is empty and pick() returns undefined, which used
      // to throw on `const [c, d] = undefined` (~27% of variants). See audit.
      const harderOptions = ratioOptions.filter(([x]) => x > a);
      if (harderOptions.length === 0) {
        // fallback to basic
        const prompt = `Before: ${boysBefore} boys and ${girlCount} girls. ${boysAdded} boys join. How many boys are there now?`;
        return shortAnswer({
          family, prompt,
          answer: boysAfter, display: String(boysAfter),
          solutionSteps: [`Boys after = ${boysBefore} + ${boysAdded} = ${boysAfter}.`],
          misconceptionTag: 'rr/assume-total-constant', difficulty, mode,
        });
      }
      // girlCount unchanged; the harder variant currently falls through to the
      // same forward prompt below (a genuinely harder reconstruction task is a
      // P1 follow-up — see audit).
    }

    const prompt = `Before, the ratio of boys to girls was ${a} : ${b}. There were ${girlCount} girls. After ${boysAdded} more boys joined, how many boys are there?`;
    return shortAnswer({
      family,
      prompt,
      answer: boysAfter,
      display: String(boysAfter),
      solutionSteps: [
        `Girls = ${girlCount}. From ratio ${a}:${b}, 1 unit = ${girlCount} ÷ ${b} = ${girlCount / b}.`,
        `Boys before = ${a} × ${girlCount / b} = ${boysBefore}.`,
        `Boys after = ${boysBefore} + ${boysAdded} = ${boysAfter}.`,
      ],
      misconceptionTag: 'rr/assume-total-constant',
      difficulty,
      mode,
    });
  },

  rrCombine(rng, family, difficulty, mode) {
    // A:B = a:b, B:C = b2:c. Equalise B then read A:C.
    const pairsAB = [[1,2],[2,3],[3,4],[1,3],[2,5],[3,5],[1,4]];
    const [a, b] = pick(rng, pairsAB);
    const pairsBC = [[2,3],[3,4],[3,5],[2,5],[4,5],[3,7]].filter(([x]) => x !== b);
    const [b2, c] = pick(rng, pairsBC);

    // Scale so B terms match: lcm(b, b2)
    const lcmB = (b * b2) / gcd(b, b2);
    const scaleAB = lcmB / b;
    const scaleBC = lcmB / b2;
    const A = a * scaleAB;
    const B = lcmB;
    const C = c * scaleBC;

    const askABC = !family.name.toLowerCase().includes('a:c');
    const { num: An, den: Cdn } = askABC ? { num: A, den: B } : reduceFraction(A, C);
    const display = askABC ? `${A}:${B}:${C}` : `${An}:${Cdn}`;
    const prompt = askABC
      ? `A : B = ${a} : ${b} and B : C = ${b2} : ${c}. Find A : B : C.`
      : `A : B = ${a} : ${b} and B : C = ${b2} : ${c}. Find A : C in simplest form.`;
    return shortAnswer({
      family,
      prompt,
      answer: display,
      display,
      solutionSteps: [
        `Make B common. LCM(${b}, ${b2}) = ${lcmB}.`,
        `A : B = ${a}×${scaleAB} : ${b}×${scaleAB} = ${A} : ${B}.`,
        `B : C = ${b2}×${scaleBC} : ${c}×${scaleBC} = ${B} : ${C}.`,
        askABC ? `A : B : C = ${A} : ${B} : ${C}.` : `A : C = ${A} : ${C} = ${display}.`,
      ],
      misconceptionTag: 'rr/no-common-term',
      difficulty,
      mode,
    });
  },

  rrRate(rng, family, difficulty, mode) {
    const money = (v) => `$${Number(v).toFixed(2)}`;
    const quantities = [2, 4, 5, 8, 10];
    const unitPrices = [1.5, 2, 2.5, 3, 4, 5];
    const q = pick(rng, quantities);
    const unitPrice = pick(rng, unitPrices);
    const c = round2(q * unitPrice);
    // Each item carries its correct per-unit noun (so it is "per kg", not the
    // old "per item" which came from a broken split('kg of rice').pop()).
    const items = [
      { label: 'kg of rice', unit: 'kg' }, { label: 'litres of milk', unit: 'litre' },
      { label: 'pens', unit: 'pen' }, { label: 'exercise books', unit: 'book' },
      { label: 'apples', unit: 'apple' }, { label: 'kg of sugar', unit: 'kg' },
    ];
    const item = pick(rng, items);

    // "Find the Unit Rate" asks the rate; "Rate Word Problem" applies it.
    const askUnitRate = family.name.toLowerCase().includes('unit rate');
    if (askUnitRate) {
      return shortAnswer({
        family,
        prompt: `${q} ${item.label} cost ${money(c)}. Find the cost per ${item.unit}.`,
        answer: unitPrice,
        display: money(unitPrice),
        solutionSteps: [
          `Cost per ${item.unit} = ${money(c)} ÷ ${q} = ${money(unitPrice)}.`,
        ],
        misconceptionTag: 'rr/rate-inverted',
        difficulty,
        mode,
      });
    }
    const q2 = pick(rng, quantities.filter((x) => x !== q));
    const cost2 = round2(q2 * unitPrice);
    return shortAnswer({
      family,
      prompt: `${q} ${item.label} cost ${money(c)}. At the same rate, how much do ${q2} ${item.label} cost?`,
      answer: cost2,
      display: money(cost2),
      solutionSteps: [
        `Cost per ${item.unit} = ${money(c)} ÷ ${q} = ${money(unitPrice)}.`,
        `Cost for ${q2} = ${money(unitPrice)} × ${q2} = ${money(cost2)}.`,
      ],
      misconceptionTag: 'rr/rate-inverted',
      difficulty,
      mode,
    });
  },

  rrRateTiered(rng, family, difficulty, mode) {
    const n1 = pick(rng, [10, 20, 30, 50]); // free/cheap tier limit
    const r1 = pick(rng, [5, 8, 10, 12]);   // rate in cents
    const r2 = pick(rng, [15, 18, 20, 25]); // higher rate in cents
    const extra = rint(rng, 5, 30);
    const u = n1 + extra;
    const billCents = n1 * r1 + extra * r2;
    const billDollars = round2(billCents / 100);
    const utilities = ['electricity', 'water'];
    const utility = pick(rng, utilities);
    const prompt = `An ${utility} bill charges ${r1} cents per unit for the first ${n1} units and ${r2} cents per unit for the remaining units. A household uses ${u} units. Find the total bill in dollars.`;
    return shortAnswer({
      family,
      prompt,
      answer: billDollars,
      display: `$${billDollars}`,
      solutionSteps: [
        `First ${n1} units: ${n1} × ${r1}¢ = ${n1 * r1}¢.`,
        `Next ${extra} units: ${extra} × ${r2}¢ = ${extra * r2}¢.`,
        `Total = ${billCents}¢ = $${billDollars}.`,
      ],
      misconceptionTag: 'rr/flat-rate',
      difficulty,
      mode,
    });
  },

  rrSpeed(rng, family, difficulty, mode) {
    // Variants: find speed, find distance, find time
    // The "Speed = Distance ÷ Time" family must ask for SPEED; the "Distance or
    // Time from Speed" family asks for one of the others. The old test keyed on
    // the words 'distance'/'time', which the speed family's own name contains,
    // so it never asked for speed.
    const askFor = family.name.toLowerCase().startsWith('speed')
      ? 'speed'
      : pick(rng, ['distance', 'time']);
    const speeds = [40, 50, 60, 80, 90, 100];
    const times = [2, 3, 4, 5, 6];
    const s = pick(rng, speeds);
    const t = pick(rng, times);
    const d = s * t;
    const vehicles = ['car', 'bus', 'train', 'cyclist'];
    const v = pick(rng, vehicles);

    if (askFor === 'speed') {
      return shortAnswer({
        family,
        prompt: `A ${v} travels ${d} km in ${t} hours. Find its average speed in km/h.`,
        answer: s,
        display: `${s} km/h`,
        solutionSteps: [
          `Speed = Distance ÷ Time = ${d} ÷ ${t} = ${s} km/h.`,
        ],
        misconceptionTag: 'rr/formula-confusion',
        difficulty, mode,
      });
    }
    if (askFor === 'distance') {
      return shortAnswer({
        family,
        prompt: `A ${v} travels at ${s} km/h for ${t} hours. Find the distance travelled.`,
        answer: d,
        display: `${d} km`,
        solutionSteps: [
          `Distance = Speed × Time = ${s} × ${t} = ${d} km.`,
        ],
        misconceptionTag: 'rr/unit-mismatch',
        difficulty, mode,
      });
    }
    // find time
    return shortAnswer({
      family,
      prompt: `A ${v} travels ${d} km at ${s} km/h. How long does the journey take?`,
      answer: t,
      display: `${t} h`,
      solutionSteps: [
        `Time = Distance ÷ Speed = ${d} ÷ ${s} = ${t} h.`,
      ],
      misconceptionTag: 'rr/formula-confusion',
      difficulty, mode,
    });
  },

  rrSpeedAvg(rng, family, difficulty, mode) {
    // Choose d1, s1, d2, s2 so t1=d1/s1 and t2=d2/s2 are whole numbers
    const speedPairs = [[40, 60], [50, 80], [60, 90], [30, 60], [40, 80]];
    const [s1, s2] = pick(rng, speedPairs);
    const t1 = rint(rng, 1, 3);
    const t2 = rint(rng, 1, 3);
    const d1 = s1 * t1;
    const d2 = s2 * t2;
    const totalD = d1 + d2;
    const totalT = t1 + t2;
    const avgSpeed = round2(totalD / totalT);
    const vehicles = ['car', 'bus', 'cyclist'];
    const v = pick(rng, vehicles);
    const prompt = `A ${v} travels ${d1} km at ${s1} km/h, then ${d2} km at ${s2} km/h. Find the average speed for the whole journey.`;
    return shortAnswer({
      family,
      prompt,
      answer: avgSpeed,
      display: `${avgSpeed} km/h`,
      solutionSteps: [
        `Time for first leg = ${d1} ÷ ${s1} = ${t1} h.`,
        `Time for second leg = ${d2} ÷ ${s2} = ${t2} h.`,
        `Total time = ${t1} + ${t2} = ${totalT} h.`,
        `Average speed = ${totalD} ÷ ${totalT} = ${avgSpeed} km/h.`,
      ],
      misconceptionTag: 'rr/avg-of-speeds',
      difficulty,
      mode,
    });
  },

  rrProportion(rng, family, difficulty, mode) {
    // a pens cost $c, how much do b pens cost?
    // Choose a | c (unit price = c/a is integer or simple decimal)
    const as = [2, 4, 5, 8, 10];
    const a = pick(rng, as);
    const unitPrice = pick(rng, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
    const c = round2(a * unitPrice);
    const bMultipliers = [2, 3, 4, 5, 6, 7, 8, 10];
    const bMult = pick(rng, bMultipliers.filter((x) => x !== 1));
    const b = a * bMult;
    const totalCost = round2(b * unitPrice);
    const items = ['pens', 'notebooks', 'stickers', 'rulers', 'erasers', 'stamps'];
    const item = pick(rng, items);
    const prompt = `If ${a} ${item} cost $${c}, how much do ${b} ${item} cost?`;
    return shortAnswer({
      family,
      prompt,
      answer: totalCost,
      display: `$${totalCost}`,
      solutionSteps: [
        `1 ${item.slice(0, -1)} costs $${c} ÷ ${a} = $${unitPrice}.`,
        `${b} ${item} cost $${unitPrice} × ${b} = $${totalCost}.`,
      ],
      misconceptionTag: 'rr/additive-not-multiplicative',
      difficulty,
      mode,
    });
  },
};

// ── Public API ────────────────────────────────────────────────────────────────
export function generateRatioRateQuestion({ skillId, questionFamilyId, difficulty, mode = 'practice', variant = 0, sessionSalt = '' } = {}) {
  let family = questionFamilyId ? getQuestionFamily(questionFamilyId) : null;
  if (!family) {
    if (!skillId) throw new Error('generateRatioRateQuestion requires skillId or questionFamilyId');
    const families = getQuestionFamiliesBySkill(skillId);
    if (!families.length) throw new Error(`No question families for skill ${skillId}`);
    family = families[variant % families.length];
  }
  if (skillId && family.skillId !== skillId) {
    throw new Error(`Family ${family.id} does not belong to skill ${skillId}`);
  }
  const generator = GENERATORS[family.generatorKind];
  if (!generator) throw new Error(`No generator for kind ${family.generatorKind}`);

  const resolvedDifficulty = difficulty ?? family.difficulty;
  const rng = makeRng(`${family.skillId}:${family.id}:${mode}:${variant}:${sessionSalt}`);
  return generator(rng, family, resolvedDifficulty, mode);
}

export function generateRatioRateQuestionSet({ skillId, questionFamilyIds, count = 5, mode = 'practice', difficulty, sessionSalt = '' } = {}) {
  if (!skillId && !(questionFamilyIds && questionFamilyIds.length)) {
    throw new Error('generateRatioRateQuestionSet requires skillId or questionFamilyIds');
  }
  const familyIds = (questionFamilyIds && questionFamilyIds.length)
    ? questionFamilyIds
    : getQuestionFamiliesBySkill(skillId).map((f) => f.id);
  if (!familyIds.length) throw new Error(`No question families for skill ${skillId}`);

  const seenPrompts = new Set();
  const out = [];
  let attempt = 0;
  const maxAttempts = count * 5;
  while (out.length < count && attempt < maxAttempts) {
    const familyId = familyIds[attempt % familyIds.length];
    const variant = Math.floor(attempt / familyIds.length);
    const q = generateRatioRateQuestion({ questionFamilyId: familyId, mode, difficulty, variant, sessionSalt });
    const dedupKey = q.prompt + '|||' + (q.answer?.display ?? q.answer);
    if (!seenPrompts.has(dedupKey) || attempt >= maxAttempts - 1) {
      seenPrompts.add(dedupKey);
      out.push(q);
    }
    attempt++;
  }
  return out;
}

function normalizeRatioAnswer(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/\$/g, '');
}

// Extract all numbers from a string (handles "$78 and $130", "78, 130", "78 130")
function extractNumbers(s) {
  const nums = String(s ?? '').replace(/\$/g, '').match(/-?\d+(?:\.\d+)?/g) || [];
  return nums.map(Number).sort((a, b) => a - b);
}

// Normalise a ratio string "a : b" → "a:b"
function normalizeRatio(s) {
  return s.replace(/\s*:\s*/g, ':').trim();
}

// Normalise a fraction string to lowest terms, e.g. "2/4" → "1/2"
function normalizeFraction(s) {
  const m = s.match(/^(\d+)\/(\d+)$/);
  if (!m) return s;
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  if (!den) return s;
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

export function checkRatioRateAnswer({ question, studentResponse } = {}) {
  if (!question) throw new Error('checkRatioRateAnswer requires a question');
  const submitted = typeof studentResponse === 'object' && studentResponse !== null
    ? studentResponse.answer
    : studentResponse;

  const accepted = (question.acceptedAnswers && question.acceptedAnswers.length)
    ? question.acceptedAnswers
    : [question.answer?.display];

  const raw = normalizeRatioAnswer(submitted);

  // Ratio string match: "3:2" == "3 : 2"
  const ratioMatch = accepted.some((a) => normalizeRatio(normalizeRatioAnswer(a)) === normalizeRatio(raw));

  // Fraction equivalence: "2/4" == "1/2"
  const fractionMatch = accepted.some((a) => {
    const normA = normalizeFraction(normalizeRatioAnswer(a));
    const normR = normalizeFraction(raw);
    return normA === normR;
  });

  // Exact string (handles percentages, currency)
  const stringMatch = accepted.some((a) => normalizeRatioAnswer(a) === raw);

  // Numeric tolerance for plain numbers and currency
  let numericMatch = false;
  const target = question.answer?.value;
  if (typeof target === 'number' && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n)) numericMatch = Math.abs(n - target) < 0.01;
  }

  // Multi-value match: "$78 and $130" == "78, 130" == "78 130" == "$78, $130"
  // Extracts all numbers from both sides, sorts, compares element-by-element.
  const multiValueMatch = accepted.some((a) => {
    // Order matters for colon-delimited ratios ("3:2" != "2:3") — the reversed
    // distractor is authored on purpose. This order-independent number match is
    // ONLY for unordered amount lists ("$78 and $130" == "78, 130"), so it must
    // not fire on a ratio; ratioMatch above already compares ratios in order.
    if (String(a).includes(':') || String(submitted).includes(':')) return false;
    const accNums = extractNumbers(a);
    const subNums = extractNumbers(submitted);
    if (accNums.length < 2 || accNums.length !== subNums.length) return false;
    return accNums.every((n, i) => Math.abs(n - subNums[i]) < 0.01);
  });

  const correct = ratioMatch || fractionMatch || stringMatch || numericMatch || multiValueMatch;
  return {
    correct,
    score: correct ? 1 : 0,
    feedback: correct
      ? 'Correct.'
      : `Not quite. The answer is ${question.answer?.display}.`,
    expected: question.answer?.display,
    misconceptionTag: correct ? null : question.misconceptionTag,
  };
}

export function isGeneratableRatioRateSkill(skillId) {
  if (!getSkill(skillId)) return false;
  return getQuestionFamiliesBySkill(skillId).every((f) => Boolean(GENERATORS[f.generatorKind]));
}
