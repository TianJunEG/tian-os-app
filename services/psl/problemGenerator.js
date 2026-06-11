import crypto from 'crypto';
import PSLProblemTemplate from '../../models/psl/PSLProblemTemplate.js';

const NAMES = ['Wei Ling', 'Jun Hao', 'Ravi', 'Siti', 'Mei Xin', 'Arun', 'Farah', 'Zhi Hao', 'Priya', 'Ahmad'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

function resolveConstraintValue(spec) {
  if (typeof spec === 'number') return spec;
  if (spec.options) return pick(spec.options);
  if (spec.min !== undefined && spec.max !== undefined) return randInt(spec.min, spec.max);
  return spec;
}

function generateNumbers(constraints, structure) {
  const MAX_TRIES = 50;
  for (let i = 0; i < MAX_TRIES; i++) {
    const nums = {};

    // Generic constraint solver: generate each named variable from its {min,max} range
    // then compute derived values via constraints.compute entries
    if (constraints._generic) {
      for (const [key, range] of Object.entries(constraints._generic)) {
        nums[key] = randInt(range.min, range.max);
      }
      if (constraints._compute) {
        for (const [key, expr] of Object.entries(constraints._compute)) {
          nums[key] = expr(nums);
        }
      }
      if (constraints.answer?.min && (nums.answer || 0) < constraints.answer.min) continue;
      if (constraints.answer?.max && (nums.answer || 0) > constraints.answer.max) continue;
      return nums;
    }

    // Before-after: start + change = end (or start - change = end)
    if (constraints.start && constraints.change) {
      nums.start = randInt(constraints.start.min, constraints.start.max);
      nums.change = randInt(constraints.change.min, constraints.change.max);
      if (constraints.operation === 'subtraction') {
        if (nums.change >= nums.start) continue;
        nums.end = nums.start - nums.change;
        nums.answer = nums.end;
      } else {
        nums.end = nums.start + nums.change;
        nums.answer = nums.end;
      }
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
      if (constraints.answer?.min && nums.answer < constraints.answer.min) continue;
      return nums;
    }

    // Work-backwards: end + reversed ops = start
    if (constraints.end && constraints.step1 && constraints.step2) {
      nums.end = randInt(constraints.end.min, constraints.end.max);
      nums.step1 = randInt(constraints.step1.min, constraints.step1.max);
      nums.step2 = randInt(constraints.step2.min, constraints.step2.max);
      nums.answer = nums.end + nums.step1 + nums.step2;
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
      return nums;
    }
    if (constraints.end && constraints.step1) {
      nums.end = randInt(constraints.end.min, constraints.end.max);
      nums.step1 = randInt(constraints.step1.min, constraints.step1.max);
      nums.answer = nums.end + nums.step1;
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
      return nums;
    }

    // Multi-step: chain of operations
    if (constraints.valA && constraints.valB && constraints.valC) {
      nums.valA = randInt(constraints.valA.min, constraints.valA.max);
      nums.valB = randInt(constraints.valB.min, constraints.valB.max);
      nums.valC = randInt(constraints.valC.min, constraints.valC.max);
      if (constraints.answerFn) {
        nums.answer = constraints.answerFn(nums);
      } else {
        nums.answer = nums.valA + nums.valB + nums.valC;
      }
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
      if (constraints.answer?.min && nums.answer < constraints.answer.min) continue;
      return nums;
    }
    if (constraints.valA && constraints.valB) {
      nums.valA = randInt(constraints.valA.min, constraints.valA.max);
      nums.valB = randInt(constraints.valB.min, constraints.valB.max);
      if (constraints.answerFn) {
        nums.answer = constraints.answerFn(nums);
      } else {
        nums.answer = nums.valA + nums.valB;
      }
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
      if (constraints.answer?.min && nums.answer < constraints.answer.min) continue;
      return nums;
    }

    // Guess-and-check: total and difference give two unknowns
    if (constraints.total && constraints.diff) {
      nums.total = randInt(constraints.total.min, constraints.total.max);
      nums.diff = randInt(constraints.diff.min, constraints.diff.max);
      if ((nums.total + nums.diff) % 2 !== 0) continue;
      nums.larger = (nums.total + nums.diff) / 2;
      nums.smaller = (nums.total - nums.diff) / 2;
      if (nums.smaller < 1) continue;
      nums.answer = nums.larger;
      return nums;
    }

    // Ratio: parts and value-per-part
    if (constraints.ratioA && constraints.ratioB && constraints.totalValue) {
      nums.ratioA = randInt(constraints.ratioA.min, constraints.ratioA.max);
      nums.ratioB = randInt(constraints.ratioB.min, constraints.ratioB.max);
      nums.totalValue = randInt(constraints.totalValue.min, constraints.totalValue.max);
      const totalParts = nums.ratioA + nums.ratioB;
      if (nums.totalValue % totalParts !== 0) continue;
      nums.valuePerPart = nums.totalValue / totalParts;
      nums.valueA = nums.ratioA * nums.valuePerPart;
      nums.valueB = nums.ratioB * nums.valuePerPart;
      nums.answer = nums.valueA;
      return nums;
    }

    // Existing bar model patterns below
    if (constraints.partA && constraints.partC) {
      nums.partA = randInt(constraints.partA.min, constraints.partA.max);
      nums.partB = randInt(constraints.partB.min, constraints.partB.max);
      nums.partC = randInt(constraints.partC.min, constraints.partC.max);
      nums.answer = nums.partA + nums.partB + nums.partC;
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
    } else if (constraints.partA && constraints.partB) {
      nums.partA = randInt(constraints.partA.min, constraints.partA.max);
      nums.partB = randInt(constraints.partB.min, constraints.partB.max);
      nums.answer = nums.partA + nums.partB;
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
    } else if (constraints.whole && constraints.partA) {
      nums.whole = randInt(constraints.whole.min, constraints.whole.max);
      nums.partA = randInt(constraints.partA.min, Math.min(constraints.partA.max, nums.whole - (constraints.answer?.min || 1)));
      nums.answer = nums.whole - nums.partA;
      if (nums.answer < (constraints.answer?.min || 1)) continue;
      nums.partB = nums.answer;
    } else if (constraints.larger && constraints.smaller) {
      nums.larger = randInt(constraints.larger.min, constraints.larger.max);
      nums.smaller = randInt(constraints.smaller.min, Math.min(constraints.smaller.max, nums.larger - (constraints.answer?.min || 1)));
      nums.answer = nums.larger - nums.smaller;
      nums.difference = nums.answer;
      if (nums.answer < (constraints.answer?.min || 1)) continue;
    } else if (constraints.smaller && constraints.difference) {
      nums.smaller = randInt(constraints.smaller.min, constraints.smaller.max);
      nums.difference = randInt(constraints.difference.min, constraints.difference.max);
      nums.larger = nums.smaller + nums.difference;
      nums.answer = nums.larger;
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
    } else if (constraints.larger && constraints.difference) {
      nums.larger = randInt(constraints.larger.min, constraints.larger.max);
      nums.difference = randInt(constraints.difference.min, Math.min(constraints.difference.max, nums.larger - 10));
      nums.smaller = nums.larger - nums.difference;
      nums.answer = nums.smaller;
      if (nums.answer < (constraints.answer?.min || 1)) continue;
    } else if (constraints.groups && constraints.perGroup) {
      nums.groups = randInt(constraints.groups.min, constraints.groups.max);
      nums.perGroup = randInt(constraints.perGroup.min, constraints.perGroup.max);
      nums.answer = nums.groups * nums.perGroup;
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
    }
    return nums;
  }
  return null;
}

function generateH2Numbers(constraints) {
  const start = resolveConstraintValue(constraints.start ?? { min: 1, max: 9 });
  const step = resolveConstraintValue(constraints.step ?? { min: 2, max: 5 });
  const targetPos = resolveConstraintValue(constraints.targetPos ?? { min: 6, max: 8 });
  const multiplier = constraints.multiplier !== undefined ? resolveConstraintValue(constraints.multiplier) : null;
  const constant = constraints.constant !== undefined ? resolveConstraintValue(constraints.constant) : null;

  if (multiplier !== null && constant !== null) {
    // Shape pattern: rule is multiplier*n + constant
    const answer = multiplier * targetPos + constant;
    return { start, step: multiplier, targetPos, ordTarget: ordinal(targetPos), answer, multiplier, constant };
  }
  // Linear sequence
  const term1 = start;
  const term2 = start + step;
  const term3 = start + 2 * step;
  const term4 = start + 3 * step;
  const answer = start + (targetPos - 1) * step;
  return { start, step, targetPos, ordTarget: ordinal(targetPos), term1, term2, term3, term4, answer };
}

function generateH3Numbers(constraints) {
  const MAX_TRIES = 50;
  for (let i = 0; i < MAX_TRIES; i++) {
    const nums = {};
    for (const key of Object.keys(constraints)) {
      nums[key] = resolveConstraintValue(constraints[key]);
    }
    // Compute totals based on which price keys exist
    if (nums.applePrice !== undefined && nums.orangePrice !== undefined) {
      nums.totalA = 2 * nums.applePrice + nums.orangePrice;
      nums.totalB = 2 * nums.applePrice + 3 * nums.orangePrice;
      nums.answer = nums.orangePrice;
    } else if (nums.rulerPrice !== undefined && nums.penPrice !== undefined) {
      nums.totalA = 2 * nums.rulerPrice + 3 * nums.penPrice;
      nums.totalB = 4 * nums.rulerPrice + 3 * nums.penPrice;
      nums.answer = nums.rulerPrice;
    } else if (nums.cakePrice !== undefined && nums.muffinPrice !== undefined) {
      nums.totalA = nums.cakePrice + 2 * nums.muffinPrice;
      nums.totalB = nums.cakePrice + 5 * nums.muffinPrice;
      nums.answer = nums.muffinPrice;
    } else if (nums.shortsPrice !== undefined && nums.topPrice !== undefined) {
      nums.totalA = 3 * nums.shortsPrice + 2 * nums.topPrice;
      nums.totalB = 5 * nums.shortsPrice + 4 * nums.topPrice;
      nums.doubledA = 2 * nums.totalA;
      nums.answer = nums.topPrice;
    } else if (nums.carPrice !== undefined && nums.dollPrice !== undefined) {
      nums.totalA = 2 * nums.carPrice + nums.dollPrice;
      nums.totalB = 3 * nums.carPrice + 2 * nums.dollPrice;
      nums.doubledA = 2 * nums.totalA;
      nums.answer = nums.dollPrice;
    } else if (nums.burgerPrice !== undefined && nums.drinkPrice !== undefined) {
      nums.totalA = 3 * nums.burgerPrice + nums.drinkPrice;
      nums.totalB = 2 * nums.burgerPrice + 3 * nums.drinkPrice;
      nums.tripledA = 3 * nums.totalA;
      nums.answer = nums.drinkPrice;
    }
    if (nums.totalA > 0 && nums.totalB > 0 && nums.totalA !== nums.totalB) return nums;
  }
  return null;
}

function generateH4Numbers(constraints) {
  const MAX_TRIES = 80;
  for (let i = 0; i < MAX_TRIES; i++) {
    const nums = {};
    // "answer" can be a fixed pick or computed
    if (constraints.answer?.options) {
      nums.answer = pick(constraints.answer.options);
    }
    const spread = resolveConstraintValue(constraints.rangeSpread ?? { min: 3, max: 5 });
    if (nums.answer !== undefined) {
      nums.lo = nums.answer - spread;
      nums.hi = nums.answer + spread;
    }
    // Remainder puzzle
    if (constraints.divisor1) {
      const div1 = resolveConstraintValue(constraints.divisor1);
      const div2 = resolveConstraintValue(constraints.divisor2);
      const ans = randInt(div1 * 3, div1 * 8);
      nums.answer = ans;
      nums.div1 = div1;
      nums.div2 = div2;
      nums.rem1 = ans % div1;
      nums.rem2 = ans % div2;
      if (nums.rem1 === 0 || nums.rem2 === 0) continue;
      nums.lo = ans - randInt(2, 5);
      nums.hi = ans + randInt(2, 5);
    }
    // Marble jar
    if (constraints.stackA) {
      const stackA = resolveConstraintValue(constraints.stackA);
      const stackB = resolveConstraintValue(constraints.stackB);
      const ans = randInt(120, 260);
      nums.answer = ans;
      nums.stackA = stackA;
      nums.stackB = stackB;
      nums.extraA = ans % stackA;
      nums.shortB = (stackB - (ans % stackB)) % stackB;
      if (nums.extraA === 0 || nums.shortB === 0) continue;
      nums.lo = Math.max(100, ans - randInt(8, 15));
      nums.hi = ans + randInt(8, 15);
    }
    // Common multiple
    if (constraints.factorA) {
      const factorA = resolveConstraintValue(constraints.factorA);
      const factorB = resolveConstraintValue(constraints.factorB);
      const g = gcd(factorA, factorB);
      const lcm = (factorA * factorB) / g;
      const mult = randInt(3, 8);
      nums.answer = lcm * mult;
      nums.factorA = factorA;
      nums.factorB = factorB;
      nums.lo = nums.answer - randInt(1, lcm - 1);
      nums.hi = nums.answer + randInt(1, lcm - 1);
    }
    // Locker puzzle (common multiple of 3 and secondFactor)
    if (constraints.answer?.options && !constraints.divisor1 && !constraints.stackA && !constraints.factorA) {
      const ans = nums.answer;
      const factors = [];
      for (let f = 2; f <= 12; f++) { if (f !== 3 && ans % f === 0) factors.push(f); }
      if (factors.length === 0) continue;
      nums.secondFactor = pick(factors);
    }
    if (nums.answer !== undefined) return nums;
  }
  return null;
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function generateH5Numbers(constraints) {
  const MAX_TRIES = 50;
  for (let i = 0; i < MAX_TRIES; i++) {
    const nums = {};
    if (constraints.tenCent && constraints.fiveCent) {
      nums.tenCent = resolveConstraintValue(constraints.tenCent);
      nums.fiveCent = resolveConstraintValue(constraints.fiveCent);
      nums.totalCoins = nums.tenCent + nums.fiveCent;
      nums.totalValue = 10 * nums.tenCent + 5 * nums.fiveCent;
      nums.answer = nums.tenCent;
    } else if (constraints.twentyCent && constraints.tenCent) {
      nums.twentyCent = resolveConstraintValue(constraints.twentyCent);
      nums.tenCent = resolveConstraintValue(constraints.tenCent);
      nums.totalCoins = nums.twentyCent + nums.tenCent;
      nums.totalValue = 20 * nums.twentyCent + 10 * nums.tenCent;
      nums.answer = nums.twentyCent;
    } else if (constraints.fiftyCent && constraints.twentyCent) {
      nums.fiftyCent = resolveConstraintValue(constraints.fiftyCent);
      nums.twentyCent = resolveConstraintValue(constraints.twentyCent);
      nums.totalCoins = nums.fiftyCent + nums.twentyCent;
      const totalCents = 50 * nums.fiftyCent + 20 * nums.twentyCent;
      nums.totalDollars = (totalCents / 100).toFixed(2);
      nums.totalValue = totalCents;
      nums.answer = nums.fiftyCent;
    } else if (constraints.chickens && constraints.rabbits) {
      nums.chickens = resolveConstraintValue(constraints.chickens);
      nums.rabbits = resolveConstraintValue(constraints.rabbits);
      nums.totalHeads = nums.chickens + nums.rabbits;
      nums.totalLegs = 2 * nums.chickens + 4 * nums.rabbits;
      nums.answer = nums.rabbits;
    } else if (constraints.spiders && constraints.beetles) {
      nums.spiders = resolveConstraintValue(constraints.spiders);
      nums.beetles = resolveConstraintValue(constraints.beetles);
      nums.totalCreatures = nums.spiders + nums.beetles;
      nums.totalLegs = 8 * nums.spiders + 6 * nums.beetles;
      nums.answer = nums.spiders;
    } else if (constraints.ducks && constraints.turtles) {
      nums.ducks = resolveConstraintValue(constraints.ducks);
      nums.turtles = resolveConstraintValue(constraints.turtles);
      nums.totalAnimals = nums.ducks + nums.turtles;
      nums.totalWings = 2 * nums.ducks;
      nums.answer = nums.turtles;
    }
    if (nums.answer !== undefined) return nums;
  }
  return null;
}

function generateH6Numbers(constraints) {
  const MAX_TRIES = 50;
  for (let i = 0; i < MAX_TRIES; i++) {
    const nums = {};
    const original = resolveConstraintValue(constraints.original);
    nums.original = original;

    if (constraints.multiplier && constraints.addend && !constraints.subtrahend) {
      // multiply then add: result = original * multiplier + addend
      nums.multiplier = resolveConstraintValue(constraints.multiplier);
      nums.addend = resolveConstraintValue(constraints.addend);
      nums.result = original * nums.multiplier + nums.addend;
      nums.step1 = nums.result - nums.addend; // reverse add → subtract
      nums.answer = original;
    } else if (constraints.addend && constraints.subtrahend && !constraints.multiplier) {
      // add then subtract: result = original + addend - subtrahend
      nums.addend = resolveConstraintValue(constraints.addend);
      nums.subtrahend = resolveConstraintValue(constraints.subtrahend);
      nums.result = original + nums.addend - nums.subtrahend;
      if (nums.result < 1) continue;
      nums.step1 = nums.result + nums.subtrahend; // reverse subtract → add
      nums.answer = original;
    } else if (constraints.multiplier && constraints.subtrahend && !constraints.addend) {
      // multiply then subtract: result = original * multiplier - subtrahend
      const multiplier = resolveConstraintValue(constraints.multiplier);
      nums.multiplier = multiplier;
      nums.subtrahend = resolveConstraintValue(constraints.subtrahend);
      nums.result = original * multiplier - nums.subtrahend;
      if (nums.result < 1) continue;
      nums.step1 = nums.result + nums.subtrahend; // reverse subtract → add
      nums.answer = original;
    } else if (constraints.addend && constraints.multiplier && constraints.subtrahend) {
      // Three ops: varies by template
      nums.addend = resolveConstraintValue(constraints.addend);
      nums.multiplier = resolveConstraintValue(constraints.multiplier);
      nums.subtrahend = resolveConstraintValue(constraints.subtrahend);
      // Default: (original + addend) * multiplier - subtrahend
      // But some templates are: (original - subtrahend) * multiplier + addend
      // or: original * multiplier + addend - subtrahend
      // We'll compute all variants and let the template's storyTemplate pick the right result
      // The template's operations field tells the order
      nums.result_add_mul_sub = (original + nums.addend) * nums.multiplier - nums.subtrahend;
      nums.result_sub_mul_add = (original - nums.subtrahend) * nums.multiplier + nums.addend;
      nums.result_mul_add_sub = original * nums.multiplier + nums.addend - nums.subtrahend;
      // Pick the one that's positive
      nums.answer = original;
    }
    if (nums.answer !== undefined && (nums.result === undefined || nums.result >= 1)) return nums;
  }
  return null;
}

function substituteTokens(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function buildScaffoldSteps(scaffold, vars) {
  const STEP_IDS = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];
  return STEP_IDS.map((stepId) => {
    const raw = scaffold[stepId];
    if (!raw) return { stepId, type: 'mc', prompt: '', expectedResponse: null, choices: [] };
    const step = { stepId, type: raw.type };

    if (raw.type === 'mc') {
      step.prompt = substituteTokens(raw.prompt, vars);
      step.expectedResponse = { correctIndex: raw.correctIndex };
      if (raw.choices) step.choices = raw.choices.map((c) => substituteTokens(c, vars));
    } else if (raw.type === 'highlight') {
      step.prompt = 'Tap the numbers that are given in the story.';
      step.expectedResponse = { numbers: (raw.expected || []).map((t) => substituteTokens(t, vars)).map(Number).filter(Boolean) };
    } else if (raw.type === 'model') {
      step.prompt = 'Which bar model fits this problem?';
      step.expectedResponse = { modelType: raw.modelType, unknownPosition: raw.unknownPosition };
    } else if (raw.type === 'strategySelect') {
      step.prompt = substituteTokens(raw.prompt || 'What strategy should we use?', vars);
      step.expectedResponse = { correctIndex: raw.correctIndex };
      if (raw.choices) step.choices = raw.choices.map((c) => substituteTokens(c, vars));
    } else if (raw.type === 'expression') {
      step.prompt = 'Write the number sentence and find the answer.';
      step.expectedResponse = {
        operation: raw.operation,
        expression: substituteTokens(raw.expression, vars),
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'twoStep') {
      step.prompt = 'Solve step by step.';
      step.expectedResponse = {
        steps: (raw.steps || []).map((s) => ({
          operation: s.operation,
          expression: substituteTokens(s.expression, vars),
          label: s.label,
        })),
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'reasonableness') {
      step.prompt = substituteTokens(raw.prompt, vars);
      step.expectedResponse = { reasonable: true };
    } else if (raw.type === 'reverse_steps') {
      step.prompt = substituteTokens(raw.prompt || 'Identify the operations to reverse.', vars);
      step.expectedResponse = {
        type: 'reverse_steps',
        operations: (raw.operations || []).map((o) => substituteTokens(o, vars)),
        finalResult: Number(substituteTokens(String(raw.finalResult || ''), vars)),
      };
    } else if (raw.type === 'reverse_chain') {
      step.prompt = substituteTokens(raw.prompt || 'Reverse each step to find the original number.', vars);
      step.expectedResponse = {
        type: 'reverse_chain',
        steps: (raw.steps || []).map((s) => Number(substituteTokens(String(s), vars))),
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'table_setup') {
      step.prompt = substituteTokens(raw.prompt || 'Set up a table to organise the pattern.', vars);
      step.expectedResponse = {
        type: 'table_setup',
        columns: (raw.columns || []).map((c) => substituteTokens(c, vars)),
        knownRows: (raw.knownRows || []).map((row) => row.map((cell) => {
          const sub = substituteTokens(String(cell), vars);
          const n = Number(sub);
          return isNaN(n) ? sub : n;
        })),
        requiredCount: raw.requiredCount || raw.columns?.length || 2,
      };
    } else if (raw.type === 'find_rule') {
      step.prompt = substituteTokens(raw.prompt || 'Find the rule and use it to get the answer.', vars);
      step.expectedResponse = {
        type: 'find_rule',
        columns: (raw.columns || []).map((c) => substituteTokens(c, vars)),
        knownRows: (raw.knownRows || []).map((row) => row.map((cell) => {
          const sub = substituteTokens(String(cell), vars);
          const n = Number(sub);
          return isNaN(n) ? sub : n;
        })),
        targetPosition: Number(substituteTokens(String(raw.targetPosition || ''), vars)) || undefined,
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'equation_setup') {
      step.prompt = substituteTokens(raw.prompt || 'Which quantity appears in both equations? Pick what to eliminate.', vars);
      step.expectedResponse = {
        type: 'equation_setup',
        equations: (raw.equations || []).map((eq) => substituteTokens(eq, vars)),
        variables: raw.variables || [],
      };
    } else if (raw.type === 'eliminate') {
      step.prompt = substituteTokens(raw.prompt || 'Scale, subtract, and solve.', vars);
      step.expectedResponse = {
        type: 'eliminate',
        steps: (raw.steps || []).map((s) => substituteTokens(s, vars)),
        variables: raw.variables || [],
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'list_candidates') {
      step.prompt = substituteTokens(raw.prompt || 'List the conditions and the range to search.', vars);
      step.expectedResponse = {
        type: 'list_candidates',
        conditions: (raw.conditions || []).map((c) => substituteTokens(c, vars)),
        showRange: raw.showRange || false,
      };
    } else if (raw.type === 'list_check') {
      step.prompt = substituteTokens(raw.prompt || 'Find the number that satisfies all conditions.', vars);
      step.expectedResponse = {
        type: 'list_check',
        conditions: (raw.conditions || []).map((c) => substituteTokens(c, vars)),
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'guess_setup') {
      step.prompt = substituteTokens(raw.prompt || 'Identify the constraints for your guess table.', vars);
      step.expectedResponse = {
        type: 'guess_setup',
        constraints: (raw.constraints || []).map((c) => substituteTokens(c, vars)),
      };
    } else if (raw.type === 'guess_table') {
      step.prompt = substituteTokens(raw.prompt || 'Guess, check, and adjust until both constraints match.', vars);
      step.expectedResponse = {
        type: 'guess_table',
        columns: (raw.columns || []).map((c) => substituteTokens(c, vars)),
        maxGuesses: raw.maxGuesses || 5,
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    }
    return step;
  });
}

function computeAnswer(scaffold, vars) {
  const solve = scaffold.solve;
  if (!solve) return vars.answer || 0;
  if (solve.answer !== undefined) {
    const resolved = Number(substituteTokens(String(solve.answer), vars));
    if (!isNaN(resolved)) return resolved;
  }
  return vars.answer || 0;
}

export async function generateProblem(skillId, options = {}) {
  const templates = await PSLProblemTemplate.find({ skillId }).lean();
  if (!templates.length) throw Object.assign(new Error(`No templates for skill: ${skillId}`), { status: 404 });

  const usedTemplateIds = options.usedTemplateIds || [];
  const available = templates.filter((t) => !usedTemplateIds.includes(t.templateId));
  const template = pick(available.length ? available : templates);

  const context = pick(template.contexts);
  const nameA = pick(NAMES);
  let nameB = pick(NAMES.filter((n) => n !== nameA));
  if (!nameB) nameB = 'Ali';

  const heuristic = template.heuristic || 'bar-model';
  let nums;
  if (heuristic === 'find-pattern') {
    nums = generateH2Numbers(template.constraints);
  } else if (heuristic === 'substitution') {
    nums = generateH3Numbers(template.constraints);
  } else if (heuristic === 'make-list') {
    nums = generateH4Numbers(template.constraints);
  } else if (heuristic === 'guess-check') {
    nums = generateH5Numbers(template.constraints);
  } else if (heuristic === 'work-backwards') {
    nums = generateH6Numbers(template.constraints);
  } else {
    nums = generateNumbers(template.constraints, template.structure);
  }
  if (!nums) throw new Error(`Number generation failed for template: ${template.templateId}`);

  const vars = { ...context, ...nums, nameA, nameB, entityA2: context.entityA?.replace(/s$/, '') || context.entityA };

  // H6 three-op: pick the correct result based on the template's operation order
  if (heuristic === 'work-backwards' && nums.result_add_mul_sub !== undefined) {
    const ops = template.operations || [];
    if (ops[0] === 'addition' && ops[1] === 'multiplication' && ops[2] === 'subtraction') {
      vars.result = nums.result_add_mul_sub;
      vars.step1 = vars.result + nums.subtrahend;
      vars.step2 = vars.step1 / nums.multiplier;
    } else if (ops[0] === 'subtraction' && ops[1] === 'multiplication' && ops[2] === 'addition') {
      vars.result = nums.result_sub_mul_add;
      vars.step1 = vars.result - nums.addend;
      vars.step2 = vars.step1 / nums.multiplier;
    } else if (ops[0] === 'multiplication' && ops[1] === 'addition' && ops[2] === 'subtraction') {
      vars.result = nums.result_mul_add_sub;
      vars.step1 = vars.result + nums.subtrahend;
      vars.step2 = vars.step1 - nums.addend;
    } else {
      vars.result = nums.result_add_mul_sub;
      vars.step1 = vars.result + nums.subtrahend;
      vars.step2 = vars.step1 / nums.multiplier;
    }
  }

  // For compare-then-total and two-step templates, compute intermediate values
  if (template.structure === 'comparison' && template.unknownPosition === 'larger' && template.scaffold?.solve?.type === 'twoStep') {
    vars.larger = vars.smaller + vars.difference;
    vars.answer = vars.smaller + vars.larger;
  }
  if (template.structure === 'twoStep' && template.scaffold?.solve?.type === 'twoStep') {
    if (vars.whole && vars.partA) {
      vars.partB = vars.whole - vars.partA;
      vars.answer = Math.abs(vars.partA - vars.partB);
    } else if (vars.smaller && vars.difference) {
      vars.larger = vars.smaller + vars.difference;
      vars.answer = vars.smaller + vars.larger;
    }
  }

  const storyText = substituteTokens(template.storyTemplate, vars);
  const correctAnswer = computeAnswer(template.scaffold, vars);
  // Ensure answer var is set for token substitution in scaffolds
  if (vars.answer === undefined) vars.answer = correctAnswer;
  const givenNumbers = Object.entries(nums)
    .filter(([k]) => k !== 'answer')
    .map(([, v]) => v)
    .filter((v) => typeof v === 'number');

  const scaffoldSteps = buildScaffoldSteps(template.scaffold, vars);

  const result = {
    problemId: crypto.randomUUID(),
    templateId: template.templateId,
    heuristic: template.heuristic || 'bar-model',
    structure: template.structure,
    storyText,
    givenNumbers,
    correctAnswer,
    scaffoldSteps,
    status: 'pending',
  };

  if (!template.heuristic || template.heuristic === 'bar-model') {
    result.barModelSpec = {
      modelType: template.structure === 'twoStep' ? 'partWhole' : template.structure,
      unknownPosition: template.unknownPosition,
      values: nums,
    };
  }

  return result;
}

export async function generateProblemsForSession(skillId, count = 5) {
  const problems = [];
  const usedTemplateIds = [];
  for (let i = 0; i < count; i++) {
    const problem = await generateProblem(skillId, { usedTemplateIds });
    usedTemplateIds.push(problem.templateId);
    problems.push(problem);
  }
  return problems;
}
