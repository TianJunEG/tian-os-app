// Generic question generator for slug-based skill-graph domains.
// Turns a questionStructure template (from scripts/domains/*.js) + skill
// metadata + a variant index into a concrete, deterministic question object.
//
// Scope: short_answer and mcq templates with {var} stems and evaluable
// arithmetic answerRules. Returns null for figureDependent / descriptive rules.

// ── Deterministic value helpers ───────────────────────────────────────────────

function deterministicValue(min, max, seed, idx = 0) {
  const n = Math.abs(((seed * 1664525 + idx * 6364136 + 1013904223) | 0));
  const span = Math.max(max - min, 1);
  return min + (n % span);
}

function pickFromList(list, seed, idx = 0) {
  const n = Math.abs(((seed * 22695477 + idx * 1664525 + 1) | 0));
  return list[n % list.length];
}

// ── Level-based integer ranges ────────────────────────────────────────────────
const LEVEL_RANGES = {
  'Primary 1': { min: 2, max: 18 },
  'Primary 2': { min: 10, max: 90 },
  'Primary 3': { min: 100, max: 900 },
  'Primary 4': { min: 100, max: 9000 },
  'Primary 5': { min: 1000, max: 90000 },
  'Primary 6': { min: 1000, max: 90000 },
};

function levelRange(levelStr = 'Primary 3') {
  return LEVEL_RANGES[levelStr] || LEVEL_RANGES['Primary 3'];
}

// Variable-name-specific value pools (semantically meaningful vars)
const VAR_POOLS = {
  p:         [10, 15, 20, 25, 30, 40, 50, 60, 75],
  p1:        [10, 20, 25, 30, 40, 50],
  p2:        [20, 30, 40, 50, 60, 70],
  q:         [100, 200, 300, 400, 500, 600, 800, 1000],  // multiples of 100 → p/100*q is always integer
  price:     [80, 100, 120, 150, 200, 250, 300, 500],
  principal: [500, 1000, 2000, 3000, 5000, 8000],
  y:         [1, 2, 3, 4, 5],
  k:         [2, 3, 5, 10],
  h:         { min: 1, max: 9 },
  t:         { min: 0, max: 9 },
  o:         { min: 0, max: 9 },
  d:         { min: 1, max: 9 },
  part:      [10, 20, 25, 30, 40, 50],
  // Geometry / measurement dimensions (small positive integers for formulas)
  l:    { min: 2, max: 20 },   // length (cm)
  w:    { min: 2, max: 15 },   // width (cm)
  b:    { min: 2, max: 12 },   // breadth / depth (cm)
  // Rate / speed
  dist: [60, 90, 120, 150, 180, 240, 300],  // distance (km)
  hr:   [1, 2, 3, 4, 5, 6],                 // time (hours)
  // Money
  bill: [10, 20, 50, 100],                  // amount paid ($) — always > cost pool
  cost: [3, 4, 5, 6, 7, 8, 9],             // item price ($)
  // Circles — common Singapore primary radii
  r:    [3, 4, 5, 6, 7, 8, 10, 14],
  // Ratio totals
  total: [60, 90, 120, 150, 180, 240, 300],
};

function resolveVar(name, levelStr, seed, idx, maxOverride = null) {
  const pool = VAR_POOLS[name];
  if (Array.isArray(pool)) return pickFromList(pool, seed, idx);
  if (pool && typeof pool === 'object') {
    const hi = maxOverride != null ? Math.min(maxOverride, pool.max) : pool.max;
    const lo = Math.min(pool.min, hi);  // keep lo ≤ hi when cap is small
    return deterministicValue(lo, hi, seed, idx);
  }
  // When a constraint cap overrides level range, use [1, cap] — level min may exceed cap
  if (maxOverride != null) {
    return deterministicValue(1, Math.max(1, maxOverride), seed, idx);
  }
  const { min, max } = levelRange(levelStr);
  return deterministicValue(min, max, seed, idx);
}

// ── Expression evaluator ──────────────────────────────────────────────────────
function sanitizeExpr(raw) {
  return String(raw || '')
    .replace(/×/g, '*')    // ×
    .replace(/÷/g, '/')    // ÷
    .replace(/−/g, '-')    // −
    .replace(/\bmax\b/g, 'Math.max')
    .replace(/\bmin\b/g, 'Math.min')
    .replace(/\babs\b/g, 'Math.abs');
}

function _gcd(a, b) { return b === 0 ? Math.abs(a) : _gcd(b, a % b); }

function evaluateExpr(exprRaw, bindings) {
  const expr = sanitizeExpr(exprRaw);
  // Whitelist: word chars, operators, parens, dot, comma, space
  if (!/^[\w\s+\-*/%().[\],]+$/.test(expr)) return null;
  try {
    const vars = Object.keys(bindings);
    const vals = Object.values(bindings);
    // eslint-disable-next-line no-new-func
    const fn = new Function('_gcd', 'Math', ...vars, `"use strict"; return (${expr});`);
    const result = fn(_gcd, Math, ...vals);
    if (!Number.isFinite(result)) return null;
    return Number.isInteger(result) ? String(result) : String(Math.round(result * 100) / 100);
  } catch {
    return null;
  }
}

// ── Answer rule parsing ───────────────────────────────────────────────────────
// Rule may itself contain parens (e.g. "a/(a+b)"), so capture the LAST
// parenthesised group as the candidate constraint annotation; isAnnotation()
// below decides whether it's really a constraint (vs part of the expression).
const CONSTRAINT_RE = /^(.+)\s*\(([^()]*)\)\s*$/;

export function parseAnswerRule(raw = '') {
  const s = raw.trim();
  const m = CONSTRAINT_RE.exec(s);
  if (!m) return { rule: s, constraints: {}, choiceMap: {} };
  const cstr = m[2];
  // Only treat parens as a constraint annotation when the content contains
  // inequality/set markers or natural-language words — NOT bare arg lists like
  // "a,b" (which would misparse "max(a,b)" as rule="max", constraint="a,b").
  const isAnnotation = /[≤<∈]/.test(cstr) || cstr.split(/[,\s]+/).some((w) => w.length > 3);
  if (!isAnnotation) return { rule: s, constraints: {}, choiceMap: {} };
  const rule = m[1].trim();
  const constraints = {};
  const choiceMap = {};
  // a,b≤10 or a≤20
  const maxMatch = cstr.match(/^([a-z,\s]+)\s*[≤<]=?\s*(\d+)/i);
  if (maxMatch) {
    const varNames = maxMatch[1].split(/[,\s]+/).filter((v) => /^[a-z]+$/i.test(v));
    const cap = parseInt(maxMatch[2], 10);
    varNames.forEach((v) => { constraints[v] = { max: cap }; });
  }
  // p∈{10,100,1000}
  const setMatch = cstr.match(/([a-z]+)\s*∈\s*\{([^}]+)\}/i);
  if (setMatch) {
    const varName = setMatch[1];
    const choices = setMatch[2].split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n));
    if (choices.length) choiceMap[varName] = choices;
  }
  return { rule, constraints, choiceMap };
}

// ── Variable extraction ───────────────────────────────────────────────────────
export function extractVars(stem = '') {
  const vars = new Set();
  let m;
  const re = /\{\{?([^}]+)\}?\}/g;
  while ((m = re.exec(stem)) !== null) {
    for (const token of m[1].split(/[^a-z]+/i)) {
      if (/^[a-z]+$/i.test(token)) vars.add(token);
    }
  }
  return [...vars];
}

// ── Stem substitution ─────────────────────────────────────────────────────────
// Handles both {var} (bare substitution) and {{var}} (KaTeX grouping braces —
// used in LaTeX stems like \frac{{n}}{{d}} which must render as \frac{7}{4}).
function substituteStem(stem, bindings) {
  return stem.replace(/\{(\{?)([^{}]+)(\}?)\}/g, (_match, lo, expr, hi) => {
    const doubleBraced = lo === '{' && hi === '}';
    const wrap = (v) => doubleBraced ? `{${v}}` : v;
    const trimmed = expr.trim();
    // Simple single-letter or multi-char var
    if (/^[a-z]\w*$/i.test(trimmed) && trimmed in bindings) return wrap(String(bindings[trimmed]));
    // Evaluate expression like {n+1}
    const val = evaluateExpr(sanitizeExpr(trimmed), bindings);
    return val !== null ? wrap(val) : (doubleBraced ? `{{${trimmed}}}` : `{${trimmed}}`);
  });
}

// ── Distractors ───────────────────────────────────────────────────────────────
function makeDistractors(correct, count = 3) {
  const num = parseFloat(correct);
  if (!Number.isFinite(num)) return [];
  const candidates = [];
  const offsets = [1, -1, 2, -2, 5, -5, 10, -10];
  const ratios = [2, 0.5, 10, 0.1];
  for (const off of offsets) {
    const v = num + off;
    if (v > 0 && v !== num) candidates.push(String(Number.isInteger(v) ? v : Math.round(v * 100) / 100));
  }
  for (const r of ratios) {
    const v = Math.round(num * r * 100) / 100;
    if (v > 0 && v !== num) candidates.push(String(v));
  }
  const seen = new Set([correct]);
  return candidates.filter((c) => { if (seen.has(c)) return false; seen.add(c); return true; }).slice(0, count);
}

// ── Generatability check ──────────────────────────────────────────────────────
const DESCRIPTIVE_PATTERNS = [
  /common difference/, /sorted/, /quotient.*remainder/, /position rule/,
  /BODMAS/, /divisors of/, /gcd\(/, /cell value/, /bar height/,
  /digit at/, /sign\(/, /unchanged/, /sequence of/, /bar model/,
  /whole\s*[−\-]\s*part/, /sum of parts/, /compare to/,
  /reasonable answer/, /links the two/, /\*place/, /roundLead/,
  /round10/, /may be neg/, /natural language/,
];

// Stems with these patterns need paired/constrained values the generator can't
// guarantee without domain-specific logic (e.g. \frac needs numer < denom).
// Stems that require READING a visual the text generator cannot produce (a
// graph, table, chart, figure, grid, solid, clock face, measuring cylinder…).
// The generic generator emits text only, so these would reach the student as an
// unanswerable "look at the picture" question with no picture. Most such
// templates already fail isGeneratable for lacking variables; these patterns
// catch the ones that DO have variables (e.g. statistics "From the line graph,
// what was the value in {month}?") and self-document the constraint so future
// figure-dependent templates can't silently leak in.
const DESCRIPTIVE_STEM_PATTERNS = [
  /\\frac/,
  /from the\s+(bar\s+|line\s+|picture\s+)?(graph|table|chart)/i,
  /each picture stands for/i,
  /\bpie chart\b/i,
  /\bthe (figure|diagram|solid|net|grid)\b/i,
  /\bmarked angle\b/i,
  /\bunit cubes\b/i,
  /\btop view\b/i,
  /\bon the grid\b/i,
  /\bmeasuring cylinder\b/i,
  /lines of symmetry/i,
];

export function isGeneratable(template = {}) {
  if (template.figureDependent) return false;
  if (!template.stem) return false;
  if (DESCRIPTIVE_STEM_PATTERNS.some((re) => re.test(template.stem))) return false;
  const { rule } = parseAnswerRule(template.answerRule || '');
  if (!rule || DESCRIPTIVE_PATTERNS.some((re) => re.test(rule))) return false;
  return extractVars(template.stem).length > 0;
}

// ── Main generate function ────────────────────────────────────────────────────
export function generateQuestion(template, skill = {}, variant = 0) {
  if (!isGeneratable(template)) return null;

  const { rule, constraints, choiceMap } = parseAnswerRule(template.answerRule || '');
  const vars = extractVars(template.stem);
  const levelStr = skill.level || 'Primary 3';

  // Derive a per-skill seed from the slug so variants don't collide across skills
  const slugSeed = (skill.slug || '').split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7);
  const seed = (slugSeed * 1000 + variant * 37) | 0;

  // Bind variables
  const bindings = {};
  for (let i = 0; i < vars.length; i++) {
    const name = vars[i];
    if (choiceMap[name]) {
      bindings[name] = pickFromList(choiceMap[name], seed, i);
    } else {
      const maxCap = constraints[name]?.max ?? null;
      bindings[name] = resolveVar(name, levelStr, (seed + i * 97) | 0, i, maxCap);
    }
  }

  // Ensure subtraction a − b ≥ 0 (swap if needed)
  if ('a' in bindings && 'b' in bindings && /^a\s*[-−]\s*b$/.test(rule.trim())) {
    if (bindings.a < bindings.b) { const tmp = bindings.a; bindings.a = bindings.b; bindings.b = tmp; }
  }

  // Ensure exact division: make dividend divisible by divisor
  const exactDiv = /^(\w+)\s*\/\s*(\w+)$/.exec(rule.trim());
  if (exactDiv && exactDiv[1] in bindings && exactDiv[2] in bindings) {
    const divisor = Math.max(2, Math.abs(bindings[exactDiv[2]]));
    const mult = Math.max(1, Math.round(Math.abs(bindings[exactDiv[1]]) / divisor));
    bindings[exactDiv[1]] = mult * divisor;
    bindings[exactDiv[2]] = divisor;
  }

  const answer = evaluateExpr(rule, bindings);
  if (answer === null) return null;

  const stem = substituteStem(template.stem, bindings);
  const type = template.type === 'mcq' ? 'mcq' : 'short_answer';
  const correct = answer;
  const distractors = type === 'mcq' ? makeDistractors(correct, 3) : [];
  const choices = type === 'mcq' ? [correct, ...distractors] : [];

  const questionId = `${skill.slug || 'sk'}__q${variant}`;

  return {
    questionId,
    id: questionId,
    skillId: skill.slug || '',
    domainId: skill.domainId || '',
    difficulty: diffNum(template.difficulty),
    questionType: type,
    responseType: type,
    stem,
    prompt: stem,
    answer,
    choices,
    misconceptionTag: template.misconceptionTag || '',
    errorTagsSupported: template.misconceptionTag ? [template.misconceptionTag] : [],
    requiresWorking: false,
    canRephrase: false,
    hasParallelItem: true,
    questionFamilyId: `QF_${String(skill.slug || 'sk').toUpperCase().replace(/\./g, '_')}_GEN`,
    diagnosticPurpose: 'main_skill_probe',
    raw: { stem, answer, type, skillId: skill.slug, choices, misconceptionTag: template.misconceptionTag },
  };
}

function diffNum(diff = 'medium') {
  return { easy: 1, medium: 2, hard: 3 }[String(diff).toLowerCase()] ?? 2;
}

// Generate `perSkill` questions for a skill across its generatable templates.
export function generateQuestionsForSkill(skill = {}, perSkill = 3) {
  const templates = (skill.questionStructures || []).filter(isGeneratable);
  if (!templates.length) return [];
  const out = [];
  for (let v = 0; v < perSkill; v++) {
    const tmpl = templates[v % templates.length];
    const q = generateQuestion(tmpl, skill, v);
    if (q) out.push(q);
  }
  return out;
}
