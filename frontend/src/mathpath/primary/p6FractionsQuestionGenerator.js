import { getSkill } from './p6FractionsSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6FractionsQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a; }

/**
 * Simplify a fraction and return "a/b" or a whole number string.
 * Always returns a string.
 */
function simplifyFraction(num, den) {
  if (den === 0) return '0';
  if (num === 0) return '0';
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  num = Math.abs(num);
  den = Math.abs(den);
  const g = gcd(num, den);
  num = (sign * num) / g;
  den = den / g;
  if (den === 1) return String(num);
  return `${num}/${den}`;
}

const NAMES = ['Ali', 'Mei', 'Ravi', 'Sarah', 'Tom'];

/* ================================================================
   P6-FR-01: Complex Fraction Operations
   - _001: Mixed number × whole number
   - _002: Fraction ÷ whole number  OR  whole number ÷ fraction
   - _003: Mixed number ÷ proper fraction
   ================================================================ */

function generateComplexOps(familyId) {
  if (familyId.endsWith('_001')) return genMixedMultiplication(familyId);
  if (familyId.endsWith('_002')) return genFractionDivision(familyId);
  return genMixedDivFraction(familyId);
}

/**
 * _001: Mixed number × whole number.
 * Strategy: pick answer first to guarantee clean results.
 * answer = whole_multiplier * (whole_part * denom + numer) / denom
 * We want answer to be a nice number (integer or simple fraction).
 */
function genMixedMultiplication(familyId) {
  // Pick denominator and build a mixed number
  const denom = pick([2, 3, 4, 5, 6, 8]);
  const wholePart = randInt(1, 4);
  const numer = randInt(1, denom - 1);
  // Ensure numer/denom is in lowest terms for display
  const g = gcd(numer, denom);
  const dispNum = numer / g;
  const dispDen = denom / g;
  // improper numerator
  const impNum = wholePart * dispDen + dispNum;

  // Pick multiplier that gives clean result
  // result = impNum * multiplier / dispDen
  // We want result to be integer => multiplier * impNum must be divisible by dispDen
  // Pick multiplier as a multiple of dispDen / gcd(impNum, dispDen)
  const g2 = gcd(impNum, dispDen);
  const factor = dispDen / g2;
  // multiplier must be a multiple of factor
  const base = randInt(1, 3);
  const multiplier = base * factor;
  if (multiplier > 12 || multiplier < 2) {
    // fallback: 2 3/4 × 4 = 11
    return {
      skillId: 'P6-FR-01', questionFamilyId: familyId,
      prompt: 'What is 2 3/4 × 4?',
      answer: 11, answerType: 'number',
      instructionHint: 'Convert the mixed number to an improper fraction, then multiply.',
      solutionText: '2 3/4 = 11/4. 11/4 × 4 = 44/4 = 11.',
      misconceptionTraps: ['forgets_to_convert_mixed', 'incorrect_mixed_to_improper'],
    };
  }

  const resultNum = impNum * multiplier;
  const resultDen = dispDen;
  const answer = resultNum / resultDen; // guaranteed integer by construction

  return {
    skillId: 'P6-FR-01', questionFamilyId: familyId,
    prompt: `What is ${wholePart} ${dispNum}/${dispDen} × ${multiplier}?`,
    answer, answerType: 'number',
    instructionHint: 'Convert the mixed number to an improper fraction, then multiply.',
    solutionText: `${wholePart} ${dispNum}/${dispDen} = ${impNum}/${dispDen}. ${impNum}/${dispDen} × ${multiplier} = ${resultNum}/${resultDen} = ${answer}.`,
    misconceptionTraps: ['forgets_to_convert_mixed', 'incorrect_mixed_to_improper', 'forgets_to_simplify'],
  };
}

/**
 * _002: Fraction ÷ whole number.
 * e.g. 5/8 ÷ 3 = 5/24  or  whole ÷ fraction like 6 ÷ 3/4 = 8
 */
function genFractionDivision(familyId) {
  if (Math.random() < 0.5) {
    // fraction ÷ whole: pick answer first
    // answer = a/b where b = origDen * divisor / gcd(origNum, divisor... no)
    // Simpler: pick origNum, origDen, divisor. answer = origNum / (origDen * divisor)
    const origDen = pick([2, 3, 4, 5, 6, 8]);
    const origNum = randInt(1, origDen - 1);
    const divisor = randInt(2, 5);
    // answer = origNum / (origDen * divisor)
    const ansNum = origNum;
    const ansDen = origDen * divisor;
    const ansStr = simplifyFraction(ansNum, ansDen);

    return {
      skillId: 'P6-FR-01', questionFamilyId: familyId,
      prompt: `What is ${origNum}/${origDen} ÷ ${divisor}? Give your answer as a fraction in simplest form.`,
      answer: ansStr, answerType: 'text',
      instructionHint: `Dividing by ${divisor} is the same as multiplying by 1/${divisor}.`,
      solutionText: `${origNum}/${origDen} ÷ ${divisor} = ${origNum}/${origDen} × 1/${divisor} = ${origNum}/${ansDen} = ${ansStr}.`,
      misconceptionTraps: ['wrong_reciprocal_in_division', 'forgets_to_simplify'],
    };
  }

  // whole ÷ fraction: pick so result is integer
  // whole ÷ (a/b) = whole × (b/a) = whole*b/a  => needs to be integer
  // Pick a (numerator of divisor fraction), b (denominator), whole
  // whole*b must be divisible by a
  const a = randInt(2, 5);
  const b = pick([2, 3, 4, 5, 6, 8].filter((x) => x > a || (x !== a)));
  // Ensure b != a and fraction is proper
  const fracNum = Math.min(a, b - 1 > 0 ? a : 1);
  const fracDen = Math.max(a, b);
  // Redefine: divisor fraction = fracNum/fracDen (proper)
  // result = whole * fracDen / fracNum must be integer
  const k = randInt(2, 6);
  const whole = k * fracNum; // so whole/fracNum = k, result = k * fracDen
  const answer = k * fracDen;

  if (whole > 20 || answer > 60) {
    // fallback: 6 ÷ 3/4 = 8
    return {
      skillId: 'P6-FR-01', questionFamilyId: familyId,
      prompt: 'What is 6 ÷ 3/4?',
      answer: 8, answerType: 'number',
      instructionHint: 'Dividing by a fraction: multiply by its reciprocal.',
      solutionText: '6 ÷ 3/4 = 6 × 4/3 = 24/3 = 8.',
      misconceptionTraps: ['wrong_reciprocal_in_division'],
    };
  }

  return {
    skillId: 'P6-FR-01', questionFamilyId: familyId,
    prompt: `What is ${whole} ÷ ${fracNum}/${fracDen}?`,
    answer, answerType: 'number',
    instructionHint: 'Dividing by a fraction: multiply by its reciprocal.',
    solutionText: `${whole} ÷ ${fracNum}/${fracDen} = ${whole} × ${fracDen}/${fracNum} = ${whole * fracDen}/${fracNum} = ${answer}.`,
    misconceptionTraps: ['wrong_reciprocal_in_division', 'forgets_to_simplify'],
  };
}

/**
 * _003: Mixed number ÷ proper fraction.
 * Strategy: pick answer (integer), divisor fraction, derive mixed number.
 * mixedAsImproper / (p/q) = answer  =>  mixedAsImproper = answer * p / q
 * Need answer*p divisible by q. Pick answer, p, q accordingly.
 */
function genMixedDivFraction(familyId) {
  const q = pick([2, 3, 4, 5]);
  const p = randInt(1, q - 1);
  // answer * p must be divisible by q
  const g = gcd(p, q);
  const needFactor = q / g;
  const ansBase = randInt(1, 4);
  const answer = ansBase * needFactor;

  // mixed number as improper = answer * p / q
  const impNum = (answer * p) / q; // guaranteed integer
  // We need impNum > 0 and we need a denominator for the mixed number
  // Let's express it over q: impNum/1 but that's a whole number if impNum is integer
  // Actually the mixed number's denominator should match q for nice display
  // mixedImproper = impNum (it's a whole? Not great). Let's use a different denominator.
  // Better approach: pick mixedDen, wholePart, mixedNum
  // impNum_over_mixedDen / (p/q) = answer
  // => (impNum_over_mixedDen / mixedDen) * (q/p) = answer
  // => impNum_over_mixedDen = answer * p * mixedDen / q

  const mixedDen = pick([2, 3, 4, 5, 6].filter((d) => d !== q || Math.random() < 0.3));
  const impNumerator = (answer * p * mixedDen) / q;

  if (!Number.isInteger(impNumerator) || impNumerator <= mixedDen || impNumerator > 50) {
    // fallback: 3 1/2 ÷ 2/3 = 5 1/4 ... too complex. Use cleaner one.
    // 2 1/2 ÷ 1/2 = 5
    return {
      skillId: 'P6-FR-01', questionFamilyId: familyId,
      prompt: 'What is 2 1/2 ÷ 1/2?',
      answer: 5, answerType: 'number',
      instructionHint: 'Convert the mixed number to an improper fraction, then multiply by the reciprocal.',
      solutionText: '2 1/2 = 5/2. 5/2 ÷ 1/2 = 5/2 × 2/1 = 10/2 = 5.',
      misconceptionTraps: ['forgets_to_convert_mixed', 'wrong_reciprocal_in_division'],
    };
  }

  const wholePart = Math.floor(impNumerator / mixedDen);
  const mixedNum = impNumerator % mixedDen;

  if (mixedNum === 0) {
    // It's a whole number, not a mixed number — adjust
    // Use wholePart directly: wholePart ÷ p/q = wholePart * q / p
    const wholeAns = (wholePart * q) / p;
    if (Number.isInteger(wholeAns) && wholeAns > 0 && wholeAns <= 30) {
      return {
        skillId: 'P6-FR-01', questionFamilyId: familyId,
        prompt: `What is ${wholePart} ÷ ${p}/${q}?`,
        answer: wholeAns, answerType: 'number',
        instructionHint: 'Dividing by a fraction: multiply by its reciprocal.',
        solutionText: `${wholePart} ÷ ${p}/${q} = ${wholePart} × ${q}/${p} = ${wholePart * q}/${p} = ${wholeAns}.`,
        misconceptionTraps: ['wrong_reciprocal_in_division'],
      };
    }
    // fallback
    return {
      skillId: 'P6-FR-01', questionFamilyId: familyId,
      prompt: 'What is 1 1/3 ÷ 2/3?',
      answer: 2, answerType: 'number',
      instructionHint: 'Convert the mixed number to an improper fraction, then multiply by the reciprocal.',
      solutionText: '1 1/3 = 4/3. 4/3 ÷ 2/3 = 4/3 × 3/2 = 12/6 = 2.',
      misconceptionTraps: ['forgets_to_convert_mixed', 'wrong_reciprocal_in_division'],
    };
  }

  // Simplify display fraction
  const dg = gcd(mixedNum, mixedDen);
  const dispMixedNum = mixedNum / dg;
  const dispMixedDen = mixedDen / dg;
  const dispImpNum = wholePart * dispMixedDen + dispMixedNum;

  // Compute: dispImpNum/dispMixedDen ÷ p/q = dispImpNum/dispMixedDen × q/p
  const resNum = dispImpNum * q;
  const resDen = dispMixedDen * p;
  const finalAns = resNum / resDen;

  if (!Number.isInteger(finalAns) || finalAns <= 0 || finalAns > 30) {
    return {
      skillId: 'P6-FR-01', questionFamilyId: familyId,
      prompt: 'What is 3 3/4 ÷ 3/8?',
      answer: 10, answerType: 'number',
      instructionHint: 'Convert the mixed number to an improper fraction, then multiply by the reciprocal.',
      solutionText: '3 3/4 = 15/4. 15/4 ÷ 3/8 = 15/4 × 8/3 = 120/12 = 10.',
      misconceptionTraps: ['forgets_to_convert_mixed', 'wrong_reciprocal_in_division'],
    };
  }

  return {
    skillId: 'P6-FR-01', questionFamilyId: familyId,
    prompt: `What is ${wholePart} ${dispMixedNum}/${dispMixedDen} ÷ ${p}/${q}?`,
    answer: finalAns, answerType: 'number',
    instructionHint: 'Convert the mixed number to an improper fraction, then multiply by the reciprocal.',
    solutionText: `${wholePart} ${dispMixedNum}/${dispMixedDen} = ${dispImpNum}/${dispMixedDen}. ${dispImpNum}/${dispMixedDen} ÷ ${p}/${q} = ${dispImpNum}/${dispMixedDen} × ${q}/${p} = ${resNum}/${resDen} = ${finalAns}.`,
    misconceptionTraps: ['forgets_to_convert_mixed', 'wrong_reciprocal_in_division', 'incorrect_mixed_to_improper'],
  };
}

/* ================================================================
   P6-FR-02: Fraction Word Problems
   - _001: Spend fraction, then fraction of remainder on second item
   - _002: Share among friends — fraction to one, fraction of remainder to another
   - _003: Two-step fraction of quantity
   ================================================================ */

function generateWordProblem(familyId) {
  if (familyId.endsWith('_001')) return genSpendRemainder(familyId);
  if (familyId.endsWith('_002')) return genShareAmongFriends(familyId);
  return genTwoStepFractionQty(familyId);
}

/**
 * _001: "Mei had $X. She spent a/b on books and c/d of the remainder on food.
 *        How much did she spend on food?"
 * Constraint: X divisible by b, and (X - X*a/b) divisible by d.
 */
function genSpendRemainder(familyId) {
  const name = pick(NAMES);
  const b = pick([2, 3, 4, 5, 6]);
  const a = randInt(1, b - 1);
  // remainder fraction = (b-a)/b of X
  const d = pick([2, 3, 4, 5, 6]);
  const c = randInt(1, d - 1);
  // X must be divisible by b, and (X*(b-a)/b) must be divisible by d
  // X*(b-a) must be divisible by b*d
  // Let X = k * lcm(b, b*d/(gcd(b-a, b*d))) ... simpler: X = k * b * d / gcd(b-a, d)
  // Actually: remainder = X*(b-a)/b. For remainder/d to be integer, X*(b-a) must be div by b*d.
  // So X must be div by b*d / gcd(b-a, b*d). Easiest: X = k * b * d.
  const k = randInt(2, 8);
  const X = k * b * d;

  if (X > 500) {
    // fallback
    return genSpendRemainderFallback(familyId);
  }

  const spent1 = (X * a) / b;
  const remainder = X - spent1;
  const answer = (remainder * c) / d;

  if (!Number.isInteger(spent1) || !Number.isInteger(remainder) || !Number.isInteger(answer) || answer <= 0) {
    return genSpendRemainderFallback(familyId);
  }

  const item1 = pick(['books', 'stationery', 'a bag', 'shoes', 'a toy']);
  const item2 = pick(['food', 'a shirt', 'a game', 'a gift', 'snacks']);

  return {
    skillId: 'P6-FR-02', questionFamilyId: familyId,
    prompt: `${name} had $${X}. ${name} spent ${a}/${b} of the money on ${item1} and ${c}/${d} of the remainder on ${item2}. How much did ${name} spend on ${item2}?`,
    answer, answerType: 'number',
    instructionHint: `First find how much was spent on ${item1}, then find the remainder, then take ${c}/${d} of the remainder.`,
    solutionText: `Spent on ${item1}: ${a}/${b} × $${X} = $${spent1}. Remainder: $${X} − $${spent1} = $${remainder}. Spent on ${item2}: ${c}/${d} × $${remainder} = $${answer}.`,
    misconceptionTraps: ['fraction_of_original_not_remainder', 'wrong_common_denominator'],
  };
}

function genSpendRemainderFallback(familyId) {
  const name = pick(NAMES);
  return {
    skillId: 'P6-FR-02', questionFamilyId: familyId,
    prompt: `${name} had $120. ${name} spent 1/3 of the money on books and 1/4 of the remainder on food. How much did ${name} spend on food?`,
    answer: 20, answerType: 'number',
    instructionHint: 'First find how much was spent on books, then find the remainder, then take 1/4 of the remainder.',
    solutionText: 'Spent on books: 1/3 × $120 = $40. Remainder: $120 − $40 = $80. Spent on food: 1/4 × $80 = $20.',
    misconceptionTraps: ['fraction_of_original_not_remainder', 'wrong_common_denominator'],
  };
}

/**
 * _002: Share among friends.
 * "Ali had N stickers. He gave a/b to Mei and c/d of the remainder to Ravi.
 *  How many stickers did Ravi receive?"
 */
function genShareAmongFriends(familyId) {
  const [name1, name2, name3] = pickDistinct(NAMES, 3);
  const b = pick([2, 3, 4, 5, 6]);
  const a = randInt(1, b - 1);
  const d = pick([2, 3, 4, 5, 6]);
  const c = randInt(1, d - 1);
  const k = randInt(2, 8);
  const N = k * b * d;

  if (N > 500) return genShareFallback(familyId);

  const gave1 = (N * a) / b;
  const remainder = N - gave1;
  const answer = (remainder * c) / d;

  if (!Number.isInteger(gave1) || !Number.isInteger(remainder) || !Number.isInteger(answer) || answer <= 0) {
    return genShareFallback(familyId);
  }

  const items = pick(['stickers', 'marbles', 'sweets', 'cards', 'beads']);

  return {
    skillId: 'P6-FR-02', questionFamilyId: familyId,
    prompt: `${name1} had ${N} ${items}. He gave ${a}/${b} of them to ${name2} and ${c}/${d} of the remainder to ${name3}. How many ${items} did ${name3} receive?`,
    answer, answerType: 'number',
    instructionHint: `First find how many ${name2} received, then find the remainder, then take ${c}/${d} of the remainder.`,
    solutionText: `${name2} received: ${a}/${b} × ${N} = ${gave1}. Remainder: ${N} − ${gave1} = ${remainder}. ${name3} received: ${c}/${d} × ${remainder} = ${answer}.`,
    misconceptionTraps: ['fraction_of_original_not_remainder', 'forgets_to_simplify'],
  };
}

function genShareFallback(familyId) {
  return {
    skillId: 'P6-FR-02', questionFamilyId: familyId,
    prompt: 'Ali had 180 stickers. He gave 2/5 of them to Mei and 1/3 of the remainder to Ravi. How many stickers did Ravi receive?',
    answer: 36, answerType: 'number',
    instructionHint: 'First find how many Mei received, then find the remainder, then take 1/3 of the remainder.',
    solutionText: 'Mei received: 2/5 × 180 = 72. Remainder: 180 − 72 = 108. Ravi received: 1/3 × 108 = 36.',
    misconceptionTraps: ['fraction_of_original_not_remainder', 'forgets_to_simplify'],
  };
}

/**
 * _003: Two-step fraction of quantity.
 * "Sarah had N cupcakes. She sold a/b of them. She then packed the rest equally
 *  into boxes of D. How many boxes did she need?"
 */
function genTwoStepFractionQty(familyId) {
  const name = pick(NAMES);
  const b = pick([2, 3, 4, 5, 6]);
  const a = randInt(1, b - 1);
  const boxSize = pick([4, 5, 6, 8, 10, 12]);
  // remainder = N*(b-a)/b, must be div by boxSize
  // N*(b-a) must be div by b*boxSize
  const k = randInt(1, 5);
  const N = k * b * boxSize / gcd(b - a, boxSize) * (b - a) / (b - a);
  // Simpler: just ensure N div by b and remainder div by boxSize
  // N = b * m for some m. remainder = m*(b-a). Need m*(b-a) div by boxSize.
  // m = boxSize * j / gcd(b-a, boxSize)
  const g3 = gcd(b - a, boxSize);
  const mBase = boxSize / g3;
  const j = randInt(1, 4);
  const m = mBase * j;
  const totalN = b * m;

  if (totalN > 300 || totalN < 10) {
    return {
      skillId: 'P6-FR-02', questionFamilyId: familyId,
      prompt: `${name} baked 150 cookies. She sold 2/5 of them and packed the rest equally into bags of 6. How many bags did she need?`,
      answer: 15, answerType: 'number',
      instructionHint: 'First find how many were sold, then find the remainder, then divide by 6.',
      solutionText: 'Sold: 2/5 × 150 = 60. Remainder: 150 − 60 = 90. Bags: 90 ÷ 6 = 15.',
      misconceptionTraps: ['fraction_of_original_not_remainder', 'wrong_common_denominator'],
    };
  }

  const sold = (totalN * a) / b;
  const remainder = totalN - sold;
  const answer = remainder / boxSize;

  const items = pick(['cupcakes', 'cookies', 'muffins', 'buns', 'tarts']);
  const containers = pick(['boxes', 'bags', 'trays', 'packets']);

  return {
    skillId: 'P6-FR-02', questionFamilyId: familyId,
    prompt: `${name} baked ${totalN} ${items}. She sold ${a}/${b} of them and packed the rest equally into ${containers} of ${boxSize}. How many ${containers} did she need?`,
    answer, answerType: 'number',
    instructionHint: `First find how many were sold, then find the remainder, then divide by ${boxSize}.`,
    solutionText: `Sold: ${a}/${b} × ${totalN} = ${sold}. Remainder: ${totalN} − ${sold} = ${remainder}. ${containers}: ${remainder} ÷ ${boxSize} = ${answer}.`,
    misconceptionTraps: ['fraction_of_original_not_remainder', 'wrong_common_denominator'],
  };
}

/* ================================================================
   P6-FR-03: Fraction of Remainder
   - _001: Two-step sold/gave-away, find leftover
   - _002: Three-step chain, find leftover
   - _003: Given leftover, find original (reverse)
   ================================================================ */

function generateRemainderChain(familyId) {
  if (familyId.endsWith('_001')) return genTwoStepRemainder(familyId);
  if (familyId.endsWith('_002')) return genThreeStepRemainder(familyId);
  return genReverseRemainder(familyId);
}

/**
 * _001: "A baker made N cupcakes. He sold a/b in the morning and c/d of the remainder
 *        in the afternoon. How many were left?"
 */
function genTwoStepRemainder(familyId) {
  const name = pick(NAMES);
  const b1 = pick([2, 3, 4, 5, 6]);
  const a1 = randInt(1, b1 - 1);
  const b2 = pick([2, 3, 4, 5, 6]);
  const a2 = randInt(1, b2 - 1);

  // N must divide cleanly at each step.
  // After step 1: remainder1 = N*(b1-a1)/b1
  // After step 2: used2 = remainder1 * a2/b2, remainder2 = remainder1 * (b2-a2)/b2
  // remainder2 = N * (b1-a1) * (b2-a2) / (b1*b2)
  // N must make this integer. N = k * b1 * b2 / gcd((b1-a1)*(b2-a2), b1*b2)
  // Simplest: N = k * b1 * b2
  const k = randInt(2, 8);
  const N = k * b1 * b2;

  if (N > 500) return genTwoStepRemainderFallback(familyId);

  const sold1 = (N * a1) / b1;
  const rem1 = N - sold1;
  const sold2 = (rem1 * a2) / b2;
  const answer = rem1 - sold2;

  if (!Number.isInteger(sold1) || !Number.isInteger(rem1) || !Number.isInteger(sold2) || !Number.isInteger(answer) || answer < 0) {
    return genTwoStepRemainderFallback(familyId);
  }

  const items = pick(['cupcakes', 'muffins', 'pies', 'buns', 'tarts']);
  const act1 = pick(['sold', 'gave away', 'donated']);
  const act2 = pick(['sold', 'gave away', 'donated']);
  const time1 = 'in the morning';
  const time2 = 'in the afternoon';

  return {
    skillId: 'P6-FR-03', questionFamilyId: familyId,
    prompt: `${name} made ${N} ${items}. He ${act1} ${a1}/${b1} of them ${time1} and ${act2} ${a2}/${b2} of the remainder ${time2}. How many ${items} were left?`,
    answer, answerType: 'number',
    instructionHint: `Find what was ${act1} first, then the remainder, then take ${a2}/${b2} of that remainder and subtract.`,
    solutionText: `${act1.charAt(0).toUpperCase() + act1.slice(1)} ${time1}: ${a1}/${b1} × ${N} = ${sold1}. Remainder: ${N} − ${sold1} = ${rem1}. ${act2.charAt(0).toUpperCase() + act2.slice(1)} ${time2}: ${a2}/${b2} × ${rem1} = ${sold2}. Left: ${rem1} − ${sold2} = ${answer}.`,
    misconceptionTraps: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole'],
  };
}

function genTwoStepRemainderFallback(familyId) {
  return {
    skillId: 'P6-FR-03', questionFamilyId: familyId,
    prompt: 'Tom made 120 muffins. He sold 1/3 of them in the morning and 3/4 of the remainder in the afternoon. How many muffins were left?',
    answer: 20, answerType: 'number',
    instructionHint: 'Find what was sold first, then the remainder, then take 3/4 of the remainder and subtract.',
    solutionText: 'Sold in morning: 1/3 × 120 = 40. Remainder: 120 − 40 = 80. Sold in afternoon: 3/4 × 80 = 60. Left: 80 − 60 = 20.',
    misconceptionTraps: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole'],
  };
}

/**
 * _002: Three-step remainder chain.
 * "Ali had N beads. He used a1/b1 for project A, a2/b2 of the remainder for project B,
 *  and a3/b3 of the new remainder for project C. How many were left?"
 */
function genThreeStepRemainder(familyId) {
  const name = pick(NAMES);
  const b1 = pick([2, 3, 4, 5]);
  const a1 = randInt(1, b1 - 1);
  const b2 = pick([2, 3, 4, 5]);
  const a2 = randInt(1, b2 - 1);
  const b3 = pick([2, 3, 4]);
  const a3 = randInt(1, b3 - 1);

  // N = k * b1 * b2 * b3 for clean division at every step
  const k = randInt(1, 4);
  const N = k * b1 * b2 * b3;

  if (N > 600) return genThreeStepRemainderFallback(familyId);

  const used1 = (N * a1) / b1;
  const rem1 = N - used1;
  const used2 = (rem1 * a2) / b2;
  const rem2 = rem1 - used2;
  const used3 = (rem2 * a3) / b3;
  const answer = rem2 - used3;

  if (!Number.isInteger(used1) || !Number.isInteger(used2) || !Number.isInteger(used3) || !Number.isInteger(answer) || answer < 0) {
    return genThreeStepRemainderFallback(familyId);
  }

  const items = pick(['beads', 'stickers', 'stamps', 'buttons', 'cards']);

  return {
    skillId: 'P6-FR-03', questionFamilyId: familyId,
    prompt: `${name} had ${N} ${items}. He used ${a1}/${b1} of them for project A, ${a2}/${b2} of the remainder for project B, and ${a3}/${b3} of the new remainder for project C. How many ${items} were left?`,
    answer, answerType: 'number',
    instructionHint: 'Work step by step: find each remainder before calculating the next fraction.',
    solutionText: `Step 1: ${a1}/${b1} × ${N} = ${used1}, remainder = ${rem1}. Step 2: ${a2}/${b2} × ${rem1} = ${used2}, remainder = ${rem2}. Step 3: ${a3}/${b3} × ${rem2} = ${used3}, left = ${answer}.`,
    misconceptionTraps: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole', 'forgets_to_simplify'],
  };
}

function genThreeStepRemainderFallback(familyId) {
  return {
    skillId: 'P6-FR-03', questionFamilyId: familyId,
    prompt: 'Mei had 240 beads. She used 1/2 of them for project A, 1/3 of the remainder for project B, and 1/4 of the new remainder for project C. How many beads were left?',
    answer: 60, answerType: 'number',
    instructionHint: 'Work step by step: find each remainder before calculating the next fraction.',
    solutionText: 'Step 1: 1/2 × 240 = 120, remainder = 120. Step 2: 1/3 × 120 = 40, remainder = 80. Step 3: 1/4 × 80 = 20, left = 60.',
    misconceptionTraps: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole', 'forgets_to_simplify'],
  };
}

/**
 * _003: Reverse — given the leftover, find the original.
 * "Ravi spent a1/b1 of his money on a book and a2/b2 of the remainder on lunch.
 *  He had $L left. How much did he start with?"
 *
 * leftover = N * (b1-a1)/b1 * (b2-a2)/b2
 * N = leftover * b1 * b2 / ((b1-a1)*(b2-a2))
 */
function genReverseRemainder(familyId) {
  const name = pick(NAMES);
  const b1 = pick([2, 3, 4, 5, 6]);
  const a1 = randInt(1, b1 - 1);
  const b2 = pick([2, 3, 4, 5, 6]);
  const a2 = randInt(1, b2 - 1);

  const rem1Frac = b1 - a1; // numerator of remainder fraction after step 1 (over b1)
  const rem2Frac = b2 - a2; // numerator of remainder fraction after step 2 (over b2)

  // leftover = N * rem1Frac * rem2Frac / (b1 * b2)
  // N = leftover * b1 * b2 / (rem1Frac * rem2Frac)
  // Pick leftover so N is a nice integer
  const product = rem1Frac * rem2Frac;
  const denom = b1 * b2;
  // leftover * denom must be div by product => leftover must be div by product/gcd(product,denom)
  const g = gcd(product, denom);
  const leftoverFactor = product / g;
  const j = randInt(1, 6);
  const leftover = leftoverFactor * j;
  const answer = (leftover * denom) / product;

  if (!Number.isInteger(answer) || answer > 500 || answer <= leftover || leftover <= 0) {
    return genReverseRemainderFallback(familyId);
  }

  // Verify forward
  const spent1 = (answer * a1) / b1;
  const remAfter1 = answer - spent1;
  const spent2 = (remAfter1 * a2) / b2;
  const check = remAfter1 - spent2;
  if (!Number.isInteger(spent1) || !Number.isInteger(spent2) || check !== leftover) {
    return genReverseRemainderFallback(familyId);
  }

  return {
    skillId: 'P6-FR-03', questionFamilyId: familyId,
    prompt: `${name} spent ${a1}/${b1} of his money on a book and ${a2}/${b2} of the remainder on lunch. He had $${leftover} left. How much money did ${name} have at first?`,
    answer, answerType: 'number',
    instructionHint: `Work backwards: $${leftover} is ${b2 - a2}/${b2} of the remainder after the book. The remainder after the book is ${b1 - a1}/${b1} of the original.`,
    solutionText: `After lunch, ${b2 - a2}/${b2} of remainder = $${leftover}, so remainder after book = $${leftover} × ${b2}/${b2 - a2} = $${remAfter1}. ${b1 - a1}/${b1} of original = $${remAfter1}, so original = $${remAfter1} × ${b1}/${b1 - a1} = $${answer}.`,
    misconceptionTraps: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole'],
  };
}

function genReverseRemainderFallback(familyId) {
  return {
    skillId: 'P6-FR-03', questionFamilyId: familyId,
    prompt: 'Sarah spent 1/4 of her money on a book and 2/3 of the remainder on lunch. She had $30 left. How much money did Sarah have at first?',
    answer: 120, answerType: 'number',
    instructionHint: '$30 is 1/3 of the remainder after the book. The remainder after the book is 3/4 of the original.',
    solutionText: 'After lunch, 1/3 of remainder = $30, so remainder after book = $30 × 3 = $90. 3/4 of original = $90, so original = $90 × 4/3 = $120.',
    misconceptionTraps: ['fraction_of_original_not_remainder', 'treats_remainder_as_whole'],
  };
}

/* ================================================================
   Helper: pick N distinct items from an array
   ================================================================ */
function pickDistinct(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/* ================================================================
   Router & Exports
   ================================================================ */

const generatorsBySkill = {
  'P6-FR-01': generateComplexOps,
  'P6-FR-02': generateWordProblem,
  'P6-FR-03': generateRemainderChain,
};

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId ? families.find((f) => f.id === options.questionFamilyId) || pick(families) : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return { ...question, questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, difficulty: family.difficulty, fluencyTargetSeconds: family.fluencyTargetSeconds, visualRequirement: family.visualRequirement || skill.visual };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}
export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) { questions.push(...generateQuestionSet(skillId, questionsPerSkill)); }
  return questions;
}
export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }
export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
