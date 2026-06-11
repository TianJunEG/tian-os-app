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
        columnCount: raw.columnCount || 2,
        columns: (raw.columns || []).map((c) => substituteTokens(c, vars)),
      };
    } else if (raw.type === 'find_rule') {
      step.prompt = substituteTokens(raw.prompt || 'Find the rule and use it to get the answer.', vars);
      step.expectedResponse = {
        type: 'find_rule',
        rule: substituteTokens(raw.rule || '', vars),
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'equation_setup') {
      step.prompt = substituteTokens(raw.prompt || 'Which quantity appears in both equations? Pick what to eliminate.', vars);
      step.expectedResponse = {
        type: 'equation_setup',
        eliminateVar: raw.eliminateVar || '',
        equations: (raw.equations || []).map((eq) => substituteTokens(eq, vars)),
      };
    } else if (raw.type === 'eliminate') {
      step.prompt = substituteTokens(raw.prompt || 'Scale, subtract, and solve.', vars);
      step.expectedResponse = {
        type: 'eliminate',
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'list_candidates') {
      step.prompt = substituteTokens(raw.prompt || 'List the conditions and the range to search.', vars);
      step.expectedResponse = {
        type: 'list_candidates',
        conditionCount: raw.conditionCount || 2,
        conditions: (raw.conditions || []).map((c) => substituteTokens(c, vars)),
      };
    } else if (raw.type === 'list_check') {
      step.prompt = substituteTokens(raw.prompt || 'Find the number that satisfies all conditions.', vars);
      step.expectedResponse = {
        type: 'list_check',
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
    } else if (raw.type === 'guess_setup') {
      step.prompt = substituteTokens(raw.prompt || 'Identify the two constraints for your guess table.', vars);
      step.expectedResponse = {
        type: 'guess_setup',
        constraint1: substituteTokens(raw.constraint1 || '', vars),
        constraint2: substituteTokens(raw.constraint2 || '', vars),
      };
    } else if (raw.type === 'guess_table') {
      step.prompt = substituteTokens(raw.prompt || 'Guess, check, and adjust until both constraints match.', vars);
      step.expectedResponse = {
        type: 'guess_table',
        answer: Number(substituteTokens(String(raw.answer), vars)),
      };
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

  const nums = generateNumbers(template.constraints, template.structure);
  if (!nums) throw new Error(`Number generation failed for template: ${template.templateId}`);

  const vars = { ...context, ...nums, nameA, nameB, entityA2: context.entityA?.replace(/s$/, '') || context.entityA };

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
