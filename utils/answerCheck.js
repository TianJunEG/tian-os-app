// Shared answer checking — the ONE checker used by practice, worksheet marking,
// and fluency. Handles whole numbers, decimals, and (equivalent) fractions so a
// fraction answer is correct whether or not it is in lowest terms.
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function parseFraction(s) {
  const m = String(s).trim().match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  const num = parseInt(m[1], 10), den = parseInt(m[2], 10);
  if (den === 0) return null;
  return [num, den];
}

function normFraction([n, d]) {
  const g = gcd(n, d) || 1;
  let nn = n / g, dd = d / g;
  if (dd < 0) { nn = -nn; dd = -dd; }   // keep sign on numerator
  return `${nn}/${dd}`;
}

// Returns true if `given` matches `expected`. Tolerant of equivalent fractions
// and trivial numeric formatting (e.g. "0.50" vs "0.5", " 12 ").
export function isCorrect(given, expected) {
  if (given == null) return false;
  const g = String(given).trim();
  const e = String(expected).trim();
  if (g === '') return false;
  if (g.toLowerCase() === e.toLowerCase()) return true;

  // Fractions (equivalent forms count as correct).
  const gf = parseFraction(g), ef = parseFraction(e);
  if (gf && ef) return normFraction(gf) === normFraction(ef);

  // Numbers (whole or decimal).
  const gn = Number(g), en = Number(e);
  if (!Number.isNaN(gn) && !Number.isNaN(en)) {
    return Math.abs(gn - en) < 1e-9;
  }
  return false;
}

// Accept numerator-only input for prompts that explicitly fix the denominator,
// e.g. "? / 4". In those cases expected can be "5/4" and entering "5" should
// count as correct (the UI is asking for the numerator, not the full fraction).
function isNumeratorOnlyMatch(given, expected, stem = '') {
  const g = String(given || '').trim();
  const e = String(expected || '').trim();
  const s = String(stem || '');
  if (!g || !e) return false;
  const fixedDen = s.match(/\?\s*\/\s*(\d+)/) || s.match(/\(\s*over\s*(\d+)\s*\)/i);
  if (!fixedDen) return false;
  const ef = parseFraction(e);
  if (!ef) return false;
  const [num, den] = ef;
  const denFromStem = Number(fixedDen[1]);
  // For this input mode, denominator in expected should match fixed stem denominator.
  if (den <= 0 || Number.isNaN(denFromStem) || denFromStem !== den) return false;
  const gn = Number(g);
  return !Number.isNaN(gn) && Math.abs(gn - num) < 1e-9;
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
  const f = parseFraction(s);
  return f ? { numerator: f[0], denominator: f[1] } : null;
}
