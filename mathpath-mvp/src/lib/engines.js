// engines.js — one self-contained engine per skill type.
//
// Adding a skill = one entry here (generate / sibling / diagnose / messages) + one entry in
// graph.js. Everything a skill needs to produce items, build a guided sibling, diagnose a
// wrong answer, and explain a misconception lives together — no scattered switch statements.
//
// Each engine:
//   generate(skill, seed?) → a full question (seed supplies params for exact reconstruction)
//   sibling(params)        → params for a parallel "now you try" item
//   diagnose(params, given)→ { tag, label }
//   messages               → { misconceptionTag: warm reteach line }

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
export const gcd = (a, b) => (b ? gcd(b, a % b) : a);

let seq = 0;
const id = (skill) => `${skill}-q${String(Date.now()).slice(-5)}${seq++}`;
const fracChoices = (values) => values
  .filter((v) => { const [x, y] = v.split('/').map(Number); return x >= 1 && y >= 1; })
  .slice(0, 4).sort(() => Math.random() - 0.5)
  .map((v) => ({ value: v, latex: `\\frac{${v.split('/')[0]}}{${v.split('/')[1]}}` }));

// ── Multiplication: climb the table from an easy ×10/×5 landmark (skip-count for small b) ──
function multSteps(a, b) {
  const product = a * b;
  const L = b > 10 ? 10 : b > 5 ? 5 : 0;
  if (!L) {
    const terms = Array(b).fill(a).join(' + ');
    return { text: `${a} × ${b} = ${terms} = ${product}.`, hint: `Count up in ${a}s.` };
  }
  const steps = b - L;
  const adds = Array(steps).fill(a).join(' + ');
  return {
    text: `${a} × ${b} = ${a} × ${L} + ${adds} = ${a * L} + ${adds} = ${product}.`,
    hint: `Start from the easy ${a} × ${L} = ${a * L}, then add ${a} ${steps === 1 ? 'once more' : `${steps} more times`}.`,
  };
}

export const ENGINES = {
  mul: {
    generate(skill, seed) {
      const a = seed?.a ?? pick([2, 3, 4, 5, 6, 7, 8, 9]);
      const b = seed?.b ?? rand(2, 12);
      const product = a * b;
      const ms = multSteps(a, b);
      return {
        question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'mul', params: { a, b },
        question_type: 'numeric', prompt_text: `${a} × ${b}`, answer: product,
        worked_solution: [
          { text: `${a} × ${b} means ${a} groups of ${b}.` },
          { text: ms.text },
          { text: `So ${a} × ${b} = ${product}.` },
        ],
        hint_sequence: [{ text: `It's a fact from the ${a} times table.` }, { text: ms.hint }],
        expected_time_seconds: skill.expected_time_seconds,
      };
    },
    sibling: (p) => ({ a: p.a, b: p.b >= 12 ? p.b - 1 : p.b + 1 }),
    diagnose: (p, given) => {
      const n = Number(given);
      if (n === p.a + p.b) return { tag: 'mult/adds', label: 'Added instead of multiplying' };
      if (n === p.a * (p.b - 1) || n === p.a * (p.b + 1)) return { tag: 'mult/adjacent', label: 'Recalled a neighbouring fact' };
      return { tag: 'mult/recall', label: 'Mis-recalled the fact' };
    },
    messages: {
      'mult/adds': "Multiplying isn't adding — it's equal groups. Let's rebuild it from a pattern.",
      'mult/adjacent': "So close — that's a neighbouring fact. Let's anchor on one you know and step to it.",
      'mult/recall': "No problem — let's rebuild this fact from an easy landmark.",
    },
  },

  div: {
    generate(skill, seed) {
      const divisor = seed?.divisor ?? pick([2, 3, 4, 5, 6, 7, 8, 9]);
      const quotient = seed?.quotient ?? rand(2, 9);
      const dividend = divisor * quotient;
      return {
        question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'div', params: { divisor, quotient },
        question_type: 'numeric', prompt_text: `${dividend} ÷ ${divisor}`, answer: quotient,
        worked_solution: [
          { text: `${dividend} ÷ ${divisor} asks how many ${divisor}s make ${dividend}.` },
          { text: `${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${quotient}.` },
        ],
        hint_sequence: [{ text: `Use the matching fact: ${divisor} × ? = ${dividend}.` }],
        expected_time_seconds: skill.expected_time_seconds,
      };
    },
    sibling: (p) => ({ divisor: p.divisor, quotient: p.quotient >= 9 ? p.quotient - 1 : p.quotient + 1 }),
    diagnose: (p, given) => {
      const n = Number(given);
      if (n === p.divisor * p.quotient) return { tag: 'div/multiplied', label: 'Multiplied instead of dividing' };
      if (n === p.quotient - 1 || n === p.quotient + 1) return { tag: 'div/off-by-one', label: 'Off by one in the related fact' };
      return { tag: 'div/recall', label: 'Mis-recalled the related fact' };
    },
    messages: {
      'div/multiplied': 'This is the reverse of multiplying. Find the matching multiplication fact.',
      'div/off-by-one': "Very close — let's lock in the exact matching fact.",
      'div/recall': "Let's rebuild it from the multiplication fact it's paired with.",
    },
  },

  fracMeaning: {
    generate(skill, seed) {
      const d = seed?.d ?? rand(3, 8);
      const n = seed?.n ?? rand(1, d - 1);
      const ans = `${n}/${d}`;
      const opts = new Set([ans]);
      const add = (x, y) => { if (x >= 1 && x < y && y >= 2) opts.add(`${x}/${y}`); };
      add(d - n, d); add(n, d - n || d); add(n + 1, d); add(n, d + 1);
      return {
        question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracMeaning', params: { n, d },
        question_type: 'choice', prompt_text: 'What fraction is shaded?',
        visual: { kind: Math.random() < 0.5 ? 'circle' : 'bar', n, d },
        answer: ans, choices: fracChoices(Array.from(opts)),
        worked_solution: [
          { text: `The shape is split into ${d} equal parts; ${n} are shaded.` },
          { text: 'The fraction is shaded parts over total parts:' },
          { latex: `\\frac{\\text{shaded}}{\\text{total}} = \\frac{${n}}{${d}}` },
        ],
        hint_sequence: [{ text: 'Count the shaded parts, then all the parts.' }],
        expected_time_seconds: skill.expected_time_seconds,
      };
    },
    sibling: (p) => ({ n: Math.max(1, p.n - 1 || 1), d: p.d }),
    diagnose: (p, given) => (given === `${p.d - p.n}/${p.d}`
      ? { tag: 'frac/unshaded', label: 'Counted the unshaded parts' }
      : { tag: 'frac/parts', label: 'Mis-counted parts vs whole' }),
    messages: {
      'frac/unshaded': 'Count the shaded parts, not the empty ones — over the total.',
      'frac/parts': "A fraction is shaded parts over the total parts. Let's recount together.",
    },
  },

  fracEquiv: {
    generate(skill, seed) {
      const b = seed?.b ?? rand(3, 6);
      const a = seed?.a ?? rand(1, b - 1); // proper fraction: numerator below denominator
      const k = seed?.k ?? rand(2, 4);
      return {
        question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracEquiv', params: { a, b, k },
        question_type: 'numeric',
        prompt_latex: `\\frac{${a}}{${b}} = \\frac{\\rule{0.7em}{0.08em}}{${b * k}}`,
        prompt_text: `${a}/${b} = ?/${b * k}`, answer: a * k,
        worked_solution: [
          { text: `${b} was multiplied by ${k} to get ${b * k}.` },
          { text: 'Do the same to the top:' },
          { latex: `\\frac{${a}}{${b}} = \\frac{${a} \\times ${k}}{${b} \\times ${k}} = \\frac{${a * k}}{${b * k}}` },
        ],
        hint_sequence: [{ text: `What times ${b} gives ${b * k}? Multiply the top by the same number.` }],
        expected_time_seconds: skill.expected_time_seconds,
      };
    },
    sibling: (p) => ({ a: p.a, b: p.b, k: p.k >= 4 ? p.k - 1 : p.k + 1 }),
    diagnose: (p, given) => {
      const n = Number(given);
      if (n === p.a + p.k) return { tag: 'frac/added-not-multiplied', label: 'Added instead of multiplying the top' };
      if (n === p.a) return { tag: 'frac/scaled-one-part', label: 'Scaled the bottom but not the top' };
      return { tag: 'frac/equiv', label: 'Equivalent-fraction slip' };
    },
    messages: {
      'frac/added-not-multiplied': 'To keep a fraction equal, multiply top and bottom by the same number.',
      'frac/scaled-one-part': 'Whatever you do to the bottom, do to the top as well.',
      'frac/equiv': "Let's rebuild the equivalent fraction step by step.",
    },
  },

  fracSimplify: {
    generate(skill, seed) {
      let num = seed?.num, den = seed?.den;
      if (!num) { const sd = rand(2, 6), sn = rand(1, sd - 1), g0 = rand(2, 4); num = sn * g0; den = sd * g0; }
      const g = gcd(num, den), sn = num / g, sd = den / g, ans = `${sn}/${sd}`;
      const opts = new Set([ans, `${num}/${den}`]);
      if (g > 2) opts.add(`${num / 2}/${den / 2}`);
      opts.add(`${sn + 1}/${sd}`); opts.add(`${sd}/${sn}`);
      return {
        question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracSimplify', params: { num, den },
        question_type: 'choice',
        prompt_text: 'Write this in its simplest form:', prompt_latex: `\\frac{${num}}{${den}}`,
        answer: ans, choices: fracChoices(Array.from(opts)),
        worked_solution: [
          { text: `The largest number that divides both ${num} and ${den} is ${g}.` },
          { text: 'Divide the top and bottom by it:' },
          { latex: `\\frac{${num}}{${den}} = \\frac{${num} \\div ${g}}{${den} \\div ${g}} = \\frac{${sn}}{${sd}}` },
        ],
        hint_sequence: [{ text: `What is the biggest number that divides both ${num} and ${den}?` }],
        expected_time_seconds: skill.expected_time_seconds,
      };
    },
    sibling: (p) => ({ num: p.num, den: p.den }),
    diagnose: (p, given) => {
      if (given === `${p.num}/${p.den}`) return { tag: 'frac/not-simplified', label: "Didn't simplify the fraction" };
      const g = gcd(p.num, p.den);
      if (g > 2 && given === `${p.num / 2}/${p.den / 2}`) return { tag: 'frac/partial-simplify', label: 'Only simplified part way' };
      return { tag: 'frac/simplify', label: 'Simplifying slip' };
    },
    messages: {
      'frac/not-simplified': 'Keep going — there’s still a number that divides both top and bottom.',
      'frac/partial-simplify': 'Almost — divide by the *largest* common factor to finish in one step.',
      'frac/simplify': "Let's find the biggest number that divides both, then divide.",
    },
  },

  fracCompare: {
    generate(skill, seed) {
      let a = seed?.a, b = seed?.b, c = seed?.c, d = seed?.d;
      if (!a) {
        for (let t = 0; t < 50; t++) {
          a = rand(1, 5); b = rand(2, 8); c = rand(1, 5); d = rand(2, 8);
          if (a < b && c < d && a / b !== c / d) break;
          a = null;
        }
        if (!a) { a = 2; b = 3; c = 3; d = 5; }
      }
      const ans = a / b > c / d ? `${a}/${b}` : `${c}/${d}`;
      const choices = [
        { value: `${a}/${b}`, latex: `\\frac{${a}}{${b}}` },
        { value: `${c}/${d}`, latex: `\\frac{${c}}{${d}}` },
      ].sort(() => Math.random() - 0.5);
      return {
        question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracCompare', params: { a, b, c, d },
        question_type: 'choice', prompt_text: 'Which fraction is greater?', answer: ans, choices,
        worked_solution: [
          { text: 'Rename to a common denominator, then compare numerators:' },
          { latex: `\\frac{${a}}{${b}} = \\frac{${a * d}}{${b * d}}, \\quad \\frac{${c}}{${d}} = \\frac{${c * b}}{${b * d}}` },
          { text: `${a * d > c * b ? `${a * d} > ${c * b}` : `${c * b} > ${a * d}`}, so the greater fraction is ${ans.replace('/', ' over ')}.` },
        ],
        hint_sequence: [{ text: 'Give them the same denominator, then the bigger numerator wins.' }],
        expected_time_seconds: skill.expected_time_seconds,
      };
    },
    sibling: (p) => ({ a: p.a, b: p.b, c: p.c, d: p.d }),
    diagnose: (p, given) => {
      const bigDen = p.b > p.d ? `${p.a}/${p.b}` : `${p.c}/${p.d}`;
      const correct = p.a / p.b > p.c / p.d ? `${p.a}/${p.b}` : `${p.c}/${p.d}`;
      if (given === bigDen && given !== correct) return { tag: 'frac/bigger-denominator', label: 'Thought the bigger denominator means a bigger fraction' };
      return { tag: 'frac/compare', label: 'Comparison slip' };
    },
    messages: {
      'frac/bigger-denominator': 'A bigger bottom number means smaller pieces — give them a common denominator first.',
      'frac/compare': "Let's compare by giving them the same denominator.",
    },
  },

  fracAdd: {
    generate(skill, seed) {
      const d = seed?.d ?? rand(3, 9);
      const a = seed?.a ?? rand(1, d - 2);
      const c = seed?.c ?? (rand(1, d - a - 1) || 1);
      const sum = a + c, ans = `${sum}/${d}`;
      const opts = new Set([ans, `${sum}/${d + d}`, `${a * c}/${d}`, `${sum + 1}/${d}`]);
      return {
        question_id: id(skill.skill_id), skill_id: skill.skill_id, gen: 'fracAdd', params: { a, c, d },
        question_type: 'choice',
        prompt_latex: `\\frac{${a}}{${d}} + \\frac{${c}}{${d}}`, prompt_text: `${a}/${d} + ${c}/${d}`,
        answer: ans, choices: fracChoices(Array.from(opts)),
        worked_solution: [
          { text: 'The denominators already match, so add the numerators and keep the denominator:' },
          { latex: `\\frac{${a}}{${d}} + \\frac{${c}}{${d}} = \\frac{${a} + ${c}}{${d}} = \\frac{${sum}}{${d}}` },
        ],
        hint_sequence: [{ text: 'Same bottom number? Add the tops, keep the bottom the same.' }],
        expected_time_seconds: skill.expected_time_seconds,
      };
    },
    sibling: (p) => ({ a: p.a, c: p.c, d: p.d }),
    diagnose: (p, given) => (given === `${p.a + p.c}/${p.d + p.d}`
      ? { tag: 'frac/added-denominators', label: 'Added the denominators too' }
      : { tag: 'frac/add', label: 'Addition slip' }),
    messages: {
      'frac/added-denominators': 'When the bottoms match, add only the tops — the bottom stays the same.',
      'frac/add': "Let's add the tops and keep the denominator.",
    },
  },
};

export function engineFor(gen) {
  return ENGINES[gen] || ENGINES.mul;
}

// All misconception → message lines, merged across engines (for remediation).
export const ALL_MESSAGES = Object.assign({}, ...Object.values(ENGINES).map((e) => e.messages));
