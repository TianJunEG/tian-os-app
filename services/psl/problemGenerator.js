import crypto from 'crypto';
import PSLProblemTemplate from '../../models/psl/PSLProblemTemplate.js';

const NAMES = ['Wei Ling', 'Jun Hao', 'Ravi', 'Siti', 'Mei Xin', 'Arun', 'Farah', 'Zhi Hao', 'Priya', 'Ahmad'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateNumbers(constraints, structure) {
  const MAX_TRIES = 50;
  for (let i = 0; i < MAX_TRIES; i++) {
    const nums = {};
    if (constraints.partA && constraints.partB) {
      nums.partA = randInt(constraints.partA.min, constraints.partA.max);
      nums.partB = randInt(constraints.partB.min, constraints.partB.max);
      nums.answer = nums.partA + nums.partB;
      if (constraints.answer?.max && nums.answer > constraints.answer.max) continue;
    } else if (constraints.partA && constraints.partB && constraints.partC) {
      nums.partA = randInt(constraints.partA.min, constraints.partA.max);
      nums.partB = randInt(constraints.partB.min, constraints.partB.max);
      nums.partC = randInt(constraints.partC.min, constraints.partC.max);
      nums.answer = nums.partA + nums.partB + nums.partC;
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
    } else if (raw.type === 'highlight') {
      step.prompt = 'Tap the numbers that are given in the story.';
      step.expectedResponse = { numbers: (raw.expected || []).map((t) => substituteTokens(t, vars)).map(Number).filter(Boolean) };
    } else if (raw.type === 'model') {
      step.prompt = 'Which bar model fits this problem?';
      step.expectedResponse = { modelType: raw.modelType, unknownPosition: raw.unknownPosition };
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

  return {
    problemId: crypto.randomUUID(),
    templateId: template.templateId,
    storyText,
    givenNumbers,
    correctAnswer,
    barModelSpec: {
      modelType: template.structure === 'twoStep' ? 'partWhole' : template.structure,
      unknownPosition: template.unknownPosition,
      values: nums,
    },
    scaffoldSteps,
    status: 'pending',
  };
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
