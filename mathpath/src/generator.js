// generator.js — procedural problem generation.
//
// The whole reason math works "software only": we synthesise unlimited, exactly
// gradable questions from a skill's spec instead of authoring a question bank by hand.
// Strategy = rejection sampling: draw operands, keep the first draw that satisfies the
// spec's constraints (sum bounds, carrying, borrowing, non-negative result).

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// True if adding a + b causes a carry in *any* column (incl. propagated carries).
function additionCarries(a, b) {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

// True if computing a - b (assumes a >= b) requires a borrow in any column.
function subtractionBorrows(a, b) {
  while (a > 0 || b > 0) {
    if ((a % 10) < (b % 10)) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

function makeProblem(skill, a, b, opSymbol, answer) {
  return { skillId: skill.id, a, b, op: opSymbol, prompt: `${a} ${opSymbol} ${b}`, answer };
}

export function generateProblem(skill) {
  const s = skill.spec;
  const MAX_TRIES = 300;

  for (let t = 0; t < MAX_TRIES; t++) {
    let a = randInt(s.aRange[0], s.aRange[1]);
    let b = randInt(s.bRange[0], s.bRange[1]);

    if (s.op === '+') {
      const sum = a + b;
      if (s.minSum != null && sum < s.minSum) continue;
      if (s.maxSum != null && sum > s.maxSum) continue;
      const carries = additionCarries(a, b);
      if (s.carry === true && !carries) continue;
      if (s.carry === false && carries) continue;
      return makeProblem(skill, a, b, '+', sum);
    }

    // subtraction: keep the result non-negative
    if (b > a) { const tmp = a; a = b; b = tmp; }
    if (a === b) continue; // avoid trivial 0 answers dominating
    const borrows = subtractionBorrows(a, b);
    if (s.borrow === true && !borrows) continue;
    if (s.borrow === false && borrows) continue;
    return makeProblem(skill, a, b, '−', a - b);
  }

  // Fallback (constraints somehow unsatisfiable): return a valid, simple item.
  if (s.op === '+') {
    const a = s.aRange[0], b = s.bRange[0];
    return makeProblem(skill, a, b, '+', a + b);
  }
  const big = Math.max(s.aRange[1], s.bRange[1]);
  return makeProblem(skill, big, 1, '−', big - 1);
}
