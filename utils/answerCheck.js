// Shared answer checking — the ONE checker used by practice, worksheet marking,
// and fluency. Handles whole numbers, decimals, and (equivalent) fractions so a
// fraction answer is correct whether or not it is in lowest terms.
const DECIMAL_TOLERANCE = 1e-8;

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function normalizeUnit(raw = '') {
  return String(raw || '').trim().toLowerCase();
}

function parseUnit(raw = '') {
  let input = String(raw).trim();
  let unit = '';
  // Leading currency symbol ($, S$, RM) - a prefix "unit" so "$60" parses to 60.
  const cur = input.match(/^(S\$|\$|RM)\s*(\S.*)$/i);
  if (cur) { unit = normalizeUnit(cur[1]); input = cur[2].trim(); }
  // Trailing unit, SPACE-separated only - keeps algebra like "2x" / "3a" as
  // expressions rather than misreading the letter as a unit.
  const match = input.match(/^(.*\S)\s+([A-Za-z][A-Za-z0-9%°\/\u00b0\u00b2\u00b3]*)$/);
  if (match) { if (!unit) unit = normalizeUnit(match[2]); input = match[1].trim(); }
  return { value: input, unit };
}

function normalizeSignedFraction(n, d) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  const g = gcd(Math.abs(n), Math.abs(d)) || 1;
  let nn = n / g;
  let dd = d / g;
  if (dd < 0) {
    nn = -nn;
    dd = -dd;
  }
  return { numerator: nn, denominator: dd };
}

function parseFraction(s) {
  const unitParsed = parseUnit(s);
  const input = String(unitParsed.value || '').trim();
  if (!input) return null;

  const mixedMatch = input.match(/^(-?\d+)\s+(\d+)\s*\/\s*(-?\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const numerator = Number(mixedMatch[2]);
    const denominator = Number(mixedMatch[3]);
    if (denominator === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    const fraction = normalizeSignedFraction(whole * denominator + sign * numerator, denominator);
    if (!fraction) return null;
    return { kind: 'fraction', ...fraction, unit: unitParsed.unit };
  }

  const improperMatch = input.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (improperMatch) {
    const num = Number(improperMatch[1]);
    const den = Number(improperMatch[2]);
    const fraction = normalizeSignedFraction(num, den);
    if (!fraction) return null;
    return { kind: 'fraction', ...fraction, unit: unitParsed.unit };
  }

  return null;
}

function parseDecimal(s) {
  const unitParsed = parseUnit(s);
  const input = String(unitParsed.value || '').trim();
  const normalized = input.replace(/\s+/g, '');
  if (!/^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return { kind: 'decimal', value, unit: unitParsed.unit };
}

function parseWhole(s) {
  const unitParsed = parseUnit(s);
  const input = String(unitParsed.value || '').trim();
  if (!/^-?\d+$/.test(input)) return null;
  return { kind: 'whole', value: Number(input), unit: unitParsed.unit };
}

function parseSymbol(s) {
  const input = String(s).trim();
  const m = input.match(/^\s*(>=|<=|<|>|=)\s*$/);
  if (!m) return null;
  return { kind: 'symbol', text: m[1], unit: '' };
}

function parseValue(raw) {
  if (raw === null || raw === undefined) return null;
  const fraction = parseFraction(raw);
  if (fraction) return fraction;
  const decimal = parseDecimal(raw);
  if (decimal) return decimal;
  const whole = parseWhole(raw);
  if (whole) return whole;
  const symbol = parseSymbol(raw);
  if (symbol) return symbol;
  return null;
}

function normalizeWholeOrDecimal(value) {
  if (value.kind === 'whole') return value.value;
  if (value.kind === 'decimal') return value.value;
  if (value.kind === 'fraction') return value.numerator / value.denominator;
  return NaN;
}

function fractionSignature(value) {
  if (value.kind !== 'fraction') return null;
  return `${value.numerator}/${value.denominator}`;
}

function hasUnitMismatch(given, expected) {
  if (!given || !expected) return false;
  const expectedUnit = expected.unit || '';
  const givenUnit = given.unit || '';
  // Only a mismatch when BOTH sides carry a unit and they genuinely differ.
  // A unit present on one side but absent on the other is NOT a mismatch — the
  // numeric VALUE is what's graded, and the unit is shown as a fixed input
  // adornment rather than typed. This stops a correct number being marked wrong
  // because of the unit, e.g. "38 cm" vs "38" or "165" vs "165 min".
  if (!expectedUnit || !givenUnit) return false;
  return givenUnit !== expectedUnit;
}

function isSymbolMatch(given, expected) {
  return Boolean(given?.kind === 'symbol' && expected?.kind === 'symbol' && given.text === expected.text);
}

// Returns true if `given` matches `expected`. Tolerant of equivalent fractions
// and trivial numeric formatting (e.g. "0.50" vs "0.5", " 12 ").
export function isCorrect(given, expected) {
  if (given == null) return false;

  const parsedGiven = parseValue(given);
  const parsedExpected = parseValue(expected);

  if (parsedGiven && parsedExpected) {
    if (hasUnitMismatch(parsedGiven, parsedExpected)) return false;

    if (isSymbolMatch(parsedGiven, parsedExpected)) return true;

    if (parsedGiven.kind === 'fraction' && parsedExpected.kind === 'fraction') {
      return fractionSignature(parsedGiven) === fractionSignature(parsedExpected);
    }

    if ((parsedGiven.kind === 'fraction' || parsedGiven.kind === 'decimal' || parsedGiven.kind === 'whole')
      && (parsedExpected.kind === 'fraction' || parsedExpected.kind === 'decimal' || parsedExpected.kind === 'whole')) {
      const g = normalizeWholeOrDecimal(parsedGiven);
      const e = normalizeWholeOrDecimal(parsedExpected);
      return Number.isFinite(g) && Number.isFinite(e) && Math.abs(g - e) <= DECIMAL_TOLERANCE;
    }
  }

  const gRaw = String(given).trim().toLowerCase();
  const eRaw = String(expected).trim().toLowerCase();
  if (!gRaw) return false;

  // Preserve exact matches for non-numeric labels.
  return gRaw === eRaw;
}

// Accept numerator-only input for prompts that explicitly fix the denominator,
// e.g. "? / 4". In those cases expected can be "5/4" and entering "5" should
// count as correct (the UI is asking for the numerator, not the full fraction).
function isNumeratorOnlyMatch(given, expected, stem = '') {
  const parsedGiven = parseValue(given);
  const parsedExpected = parseValue(expected);
  const fixedDen = String(stem || '').match(/\?\s*\/\s*(\d+)/) || String(stem || '').match(/\(\s*over\s*(\d+)\s*\)/i);
  if (!fixedDen || !parsedExpected || !parsedGiven) return false;

  if (parsedExpected.kind !== 'fraction') return false;
  const denFromStem = Number(fixedDen[1]);
  if (parsedExpected.denominator !== denFromStem || !Number.isFinite(parsedExpected.denominator)) return false;

  if (hasUnitMismatch(parsedGiven, parsedExpected)) return false;

  const numeratorProvided = parsedGiven.kind === 'fraction'
    ? parsedGiven.numerator
    : parsedGiven.kind === 'decimal'
      ? parsedGiven.value
      : parsedGiven.kind === 'whole'
        ? parsedGiven.value
        : NaN;

  return Number.isFinite(numeratorProvided)
    && Math.abs(numeratorProvided - parsedExpected.numerator) <= DECIMAL_TOLERANCE;
}

// Backward-compatible wrapper: existing callers can still pass (given, expected),
// while practice can pass the stem for numerator-only acceptance.
export function isCorrectWithContext(given, expected, stem = '') {
  if (isCorrect(given, expected)) return true;
  return isNumeratorOnlyMatch(given, expected, stem);
}

// Open-ended (Science) MVP marking: does the answer contain the required key
// points/keywords? Each keyPoint may be a phrase; matching is case-insensitive
// and ignores punctuation. Returns { matched, missing, ratio, correct, partial }.
// `correct` when all key points present; `partial` when at least one but not all.
export function checkKeyPoints(given, keyPoints = []) {
  const text = String(given || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const matched = [], missing = [];
  for (const kp of keyPoints) {
    // A key point can be "a|b|c" — any synonym counts.
    const synonyms = String(kp).toLowerCase().split('|').map((s) => s.trim()).filter(Boolean);
    const hit = synonyms.some((syn) => {
      const cleaned = syn.replace(/[^a-z0-9\s]/g, ' ').trim();
      return cleaned && text.includes(cleaned);
    });
    (hit ? matched : missing).push(kp);
  }
  const total = keyPoints.length || 1;
  const ratio = matched.length / total;
  return { matched, missing, ratio, correct: missing.length === 0 && keyPoints.length > 0, partial: matched.length > 0 && missing.length > 0 };
}

// For display: turn "3/4" into parts so the UI can stack it vertically.
export function fractionParts(s) {
  const parsed = parseFraction(s);
  return parsed ? { numerator: parsed.numerator, denominator: parsed.denominator } : null;
}
