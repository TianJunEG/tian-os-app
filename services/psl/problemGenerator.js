import crypto from 'crypto';
import PSLProblemTemplate from '../../models/psl/PSLProblemTemplate.js';

const NAMES = ['Wei Ling', 'Jun Hao', 'Ravi', 'Siti', 'Mei Xin', 'Arun', 'Farah', 'Zhi Hao', 'Priya', 'Ahmad'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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
          if (typeof expr === 'function') {
            nums[key] = expr(nums);
          } else if (typeof expr === 'string') {
            const fn = new Function('n', 'with(n){return(' + expr + ')}');
            nums[key] = fn(nums);
          }
        }
      }
      if (constraints._computeStr) {
        for (const [key, expr] of Object.entries(constraints._computeStr)) {
          const fn = new Function('n', 'with(n){return(' + expr + ')}');
          nums[key] = fn(nums);
        }
      }
      if (constraints._integerKeys) {
        const allInt = constraints._integerKeys.every((k) => Number.isInteger(nums[k]));
        if (!allInt) continue;
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

const PAST_TO_BASE = {
  bought: 'buy', sold: 'sell', saw: 'see', won: 'win', made: 'make',
  ran: 'run', swam: 'swim', got: 'get', had: 'have', gave: 'give',
  grew: 'grow', read: 'read', wore: 'wear', ate: 'eat', drank: 'drink',
  spelt: 'spell', lent: 'lend', set: 'set',
  baked: 'bake', planted: 'plant', borrowed: 'borrow', counted: 'count',
  collected: 'collect', invited: 'invite', ordered: 'order', packed: 'pack',
  arranged: 'arrange', placed: 'place', used: 'use', scored: 'score',
  saved: 'save', donated: 'donate', returned: 'return', enrolled: 'enroll',
  served: 'serve', received: 'receive', prepared: 'prepare', displayed: 'display',
  stocked: 'stock', raised: 'raise', walked: 'walk', welcomed: 'welcome',
  parked: 'park', recorded: 'record', registered: 'register',
};
function toBaseVerb(past) {
  if (!past) return past;
  const w = past.split(' ')[0];
  const rest = past.slice(w.length);
  if (PAST_TO_BASE[w]) return PAST_TO_BASE[w] + rest;
  if (w.endsWith('ed')) return w.slice(0, -2) + rest;
  return past;
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
    }
    return step;
  });
}

function computeAnswer(scaffold, nums) {
  const solve = scaffold.solve;
  if (!solve) return nums.answer || 0;
  if (solve.type === 'expression') return Number(substituteTokens(String(solve.answer), nums));
  if (solve.type === 'twoStep') return Number(substituteTokens(String(solve.answer), nums));
  return nums.answer || 0;
}


function buildVisualSpec(template, nums, vars) {
  const h = template.heuristic || '';

  if (['partWhole', 'comparison', 'twoStep'].includes(template.structure)) {
    return {
      type: 'barModel',
      modelType: template.structure === 'twoStep' ? 'partWhole' : template.structure,
      unknownPosition: template.unknownPosition,
      values: nums,
    };
  }

  if (h === 'before-after' || template.structure === 'beforeAfter') {
    const op = (template.operations || [])[0];
    return {
      type: 'beforeAfter',
      start: nums.start,
      change: nums.change,
      answer: nums.answer,
      operation: op === 'subtraction' ? 'subtraction' : 'addition',
    };
  }

  if (h === 'ratio') {
    return {
      type: 'ratioBar',
      ratioA: nums.ratioA,
      ratioB: nums.ratioB,
      totalValue: nums.totalValue || nums.total,
      totalLabel: vars.itemPlural || '',
      valuePerPart: nums.valuePerPart,
      valueA: nums.valueA,
      valueB: nums.valueB,
      labelA: vars.entityA || 'A',
      labelB: vars.entityB || 'B',
    };
  }

  if (h === 'work-backwards') {
    const steps = [{ label: 'Start', value: nums.answer, op: null }];
    if (nums.step2 !== undefined) {
      steps.push({ label: 'Step 1', value: nums.answer - nums.step1, op: String(nums.step1) });
      steps.push({ label: 'Step 2', value: nums.end, op: String(nums.step2) });
    } else if (nums.step1 !== undefined) {
      steps.push({ label: 'Step 1', value: nums.end, op: String(nums.step1) });
    }
    steps.push({ label: 'End', value: nums.end, op: null });
    return { type: 'workBackwards', steps };
  }

  if (h === 'guess-check') {
    if (nums.total !== undefined && nums.diff !== undefined) {
      const larger = nums.larger;
      const smaller = nums.smaller;
      const wrongGuess = larger + 2;
      const wrongOther = nums.total - wrongGuess;
      return {
        type: 'guessCheck',
        labelA: vars.nameA || 'Person A',
        labelB: vars.nameB || 'Person B',
        rows: [
          { a: wrongGuess, b: wrongOther, check: `diff = ${Math.abs(wrongGuess - wrongOther)}`, correct: false },
          { a: larger, b: smaller, check: `diff = ${nums.diff}`, correct: true },
        ],
      };
    }
    return null;
  }

  if (h === 'excess-shortage') {
    if (nums.giveA !== undefined && nums.giveB !== undefined) {
      return {
        type: 'excessShortage',
        giveA: nums.giveA,
        giveB: nums.giveB,
        excess: nums.excess ?? nums.excessA ?? 0,
        shortage: nums.shortage ?? nums.excessB ?? 0,
      };
    }
    return null;
  }


  if (h === 'assumption') {
    if (nums.totalItems !== undefined && nums.totalValue !== undefined) {
      return {
        type: 'assumption',
        totalItems: nums.totalItems,
        totalValue: nums.totalValue,
        assumedTotal: nums.assumedTotal,
        unitA: vars.unitA || nums.unitA || 0,
        swapDiff: nums.swapDiff,
        answer: nums.answer,
      };
    }
    return null;
  }

  if (h === 'data-interpretation') {
    const chart = template.constraints?._chart;
    if (!chart) return null;
    const labels = (chart.labels || []).map(l => substituteTokens(l, vars));
    const values = (chart.valueKeys || []).map(k => nums[k] ?? 0);
    const spec = { type: chart.type, title: chart.title || '', labels, values };
    if (chart.type === 'pieChart') {
      spec.percentages = (chart.pctKeys || []).map(k => nums[k] ?? 0);
      spec.total = nums[chart.totalKey] || nums.totalVal || 0;
    }
    if (chart.type === 'multiTable') {
      spec.tables = (chart.tables || []).map(t => ({
        title: t.title || '',
        labels: (t.labels || []).map(l => substituteTokens(l, vars)),
        values: (t.valueKeys || []).map(k => nums[k] ?? 0),
      }));
    }
    return spec;
  }

  return null;
}

// Map mastery score (0–100) to a target difficulty (1–3).
export function selectTargetDifficulty(masteryScore = 0) {
  if (masteryScore >= 75) return 3;
  if (masteryScore >= 40) return 2;
  return 1;
}

// Build a weighted distribution of difficulties for a session.
// 70% target, 20% easier (review), 10% harder (stretch).
export function buildDifficultyDistribution(targetDifficulty, count) {
  const distribution = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    if (roll < 0.70) {
      distribution.push(targetDifficulty);
    } else if (roll < 0.90) {
      distribution.push(Math.max(1, targetDifficulty - 1));
    } else {
      distribution.push(Math.min(3, targetDifficulty + 1));
    }
  }
  return distribution;
}

// Weighted pick: prefer templates matching desired difficulty, fall back to any.
function pickTemplateByDifficulty(templates, desiredDifficulty) {
  const exact = templates.filter((t) => t.difficulty === desiredDifficulty);
  if (exact.length) return pick(exact);
  const close = templates.filter((t) => Math.abs((t.difficulty || 1) - desiredDifficulty) <= 1);
  if (close.length) return pick(close);
  return pick(templates);
}

export async function generateProblem(skillId, options = {}) {
  const templates = await PSLProblemTemplate.find({ skillId }).lean();
  if (!templates.length) throw Object.assign(new Error(`No templates for skill: ${skillId}`), { status: 404 });

  const usedTemplateIds = options.usedTemplateIds || [];
  const desiredDifficulty = options.difficulty || null;
  const available = templates.filter((t) => !usedTemplateIds.includes(t.templateId));
  const pool = available.length ? available : templates;
  const template = desiredDifficulty ? pickTemplateByDifficulty(pool, desiredDifficulty) : pick(pool);

  const context = pick(template.contexts) || {};
  const nameA = pick(NAMES);
  let nameB = pick(NAMES.filter((n) => n !== nameA));
  if (!nameB) nameB = 'Ali';
  let nameC = pick(NAMES.filter((n) => n !== nameA && n !== nameB));
  if (!nameC) nameC = 'Lina';
  let nameD = pick(NAMES.filter((n) => n !== nameA && n !== nameB && n !== nameC));
  if (!nameD) nameD = 'Kai';

  const nums = generateNumbers(template.constraints, template.structure);
  if (!nums) throw new Error(`Number generation failed for template: ${template.templateId}`);

  const vars = { ...context, ...nums, nameA, nameB, nameC, nameD, name1: nameA, name2: nameB, name3: nameC, name4: nameD, entityA2: context.entityA?.replace(/s$/, '') || context.entityA };
  if (vars.verb) vars.verbBase = toBaseVerb(vars.verb);

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
  const solutionText = substituteTokens(template.solutionTemplate || '', vars);
  const correctAnswer = computeAnswer(template.scaffold, vars);
  const givenNumbers = Object.entries(nums)
    .filter(([k]) => k !== 'answer')
    .map(([, v]) => v)
    .filter((v) => typeof v === 'number');

  const scaffoldSteps = buildScaffoldSteps(template.scaffold, vars);

  const isBarModel = ['partWhole', 'comparison', 'twoStep'].includes(template.structure);
  return {
    problemId: crypto.randomUUID(),
    templateId: template.templateId,
    heuristic: template.heuristic || (isBarModel ? 'bar-model' : template.structure),
    structure: template.structure,
    storyText,
    solutionText,
    givenNumbers,
    correctAnswer,
    barModelSpec: isBarModel ? {
      modelType: template.structure === 'twoStep' ? 'partWhole' : template.structure,
      unknownPosition: template.unknownPosition,
      values: nums,
    } : null,
    visualSpec: buildVisualSpec(template, nums, vars),
    scaffoldSteps,
    difficulty: template.difficulty || 1,
    status: 'pending',
  };
}

export async function generateProblemsForSession(skillId, count = 5, options = {}) {
  const { masteryScore } = options;
  const targetDifficulty = masteryScore != null ? selectTargetDifficulty(masteryScore) : null;
  const distribution = targetDifficulty ? buildDifficultyDistribution(targetDifficulty, count) : null;

  const problems = [];
  const usedTemplateIds = [];
  for (let i = 0; i < count; i++) {
    const problem = await generateProblem(skillId, {
      usedTemplateIds,
      difficulty: distribution ? distribution[i] : null,
    });
    usedTemplateIds.push(problem.templateId);
    problems.push(problem);
  }
  return { problems, targetDifficulty: targetDifficulty || 1 };
}
