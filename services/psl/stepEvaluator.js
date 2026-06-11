import { getFeedback as catalogFeedback } from './misconceptionCatalog.js';

export const STEP_IDS = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];

function safeEval(expr) {
  const sanitised = String(expr).replace(/×/g, '*').replace(/÷/g, '/');
  if (!/^[\d\s+\-*/().]+$/.test(sanitised)) return NaN;
  try { return Function(`"use strict"; return (${sanitised})`)(); } catch { return NaN; }
}


function normalizeText(t) { return String(t || '').toLowerCase().trim().replace(/\s+/g, ' '); }

function evaluateUnderstand(response, expected) {
  if (expected?.correctIndex !== undefined) {
    const correct = Number(response?.selectedIndex) === expected.correctIndex;
    return { correct, partial: false, score: correct ? 1 : 0, misconceptionTag: '' };
  }
  const text = normalizeText(response?.text);
  return { correct: text.length > 5, partial: false, score: text.length > 5 ? 1 : 0, misconceptionTag: '' };
}

function evaluateIdentifyInfo(response, expected) {
  const highlighted = (response?.numbers || []).map(Number).sort((a, b) => a - b);
  const expectedNums = (expected?.numbers || []).map(Number).sort((a, b) => a - b);
  if (!expectedNums.length) return { correct: true, partial: false, score: 1, misconceptionTag: '' };

  const correct = highlighted.length === expectedNums.length && highlighted.every((n, i) => n === expectedNums[i]);
  if (correct) return { correct: true, partial: false, score: 1, misconceptionTag: '' };

  const intersection = highlighted.filter((n) => expectedNums.includes(n));
  if (intersection.length > 0 && intersection.length < expectedNums.length) {
    return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/missed-number' };
  }
  const hasExtra = highlighted.some((n) => !expectedNums.includes(n));
  return {
    correct: false, partial: false, score: 0,
    misconceptionTag: hasExtra ? 'psl/included-irrelevant' : 'psl/missed-number',
  };
}

function evaluateIdentifyQuestion(response, expected) {
  const correct = Number(response?.selectedIndex) === expected?.correctIndex;
  return { correct, partial: false, score: correct ? 1 : 0, misconceptionTag: correct ? '' : 'psl/confused-question' };
}

function evaluatePlanModel(response, expected) {
  if (expected?.correctIndex !== undefined) {
    const correct = Number(response?.selectedIndex) === expected.correctIndex;
    return { correct, partial: false, score: correct ? 1 : 0, misconceptionTag: correct ? '' : 'psl/wrong-strategy' };
  }
  const modelMatch = normalizeText(response?.modelType) === normalizeText(expected?.modelType);
  const posMatch = normalizeText(response?.unknownPosition) === normalizeText(expected?.unknownPosition);
  if (modelMatch && posMatch) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  if (modelMatch || posMatch) {
    return {
      correct: false, partial: true, score: 0.5,
      misconceptionTag: !modelMatch ? 'psl/wrong-model-type' : 'psl/wrong-unknown-position',
    };
  }
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-model-type' };
}

function evaluatePlanReverseSteps(response, expected) {
  const ops = (response?.operations || []).map(normalizeText);
  const expectedOps = (expected?.operations || []).map(normalizeText);
  if (!expectedOps.length) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  const correct = ops.length === expectedOps.length && ops.every((o, i) => o === expectedOps[i]);
  if (correct) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  const overlap = ops.filter((o) => expectedOps.includes(o)).length;
  if (overlap > 0) return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/wrong-step-order' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-operations' };
}

function evaluatePlanTable(response, expected) {
  // Frontend sends { columns: ['Position', 'Value'] }; expected has columns array and requiredCount
  const selectedCols = response?.columns || [];
  const expectedCols = expected?.columns || [];
  const requiredCount = expected?.requiredCount || expectedCols.length;
  if (selectedCols.length >= requiredCount) {
    const allValid = selectedCols.every((c) => expectedCols.includes(c));
    if (allValid) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  }
  if (selectedCols.length > 0) return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/wrong-table-setup' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-table-setup' };
}

function evaluatePlanEquation(response, expected) {
  // Frontend sends { eliminateVar: 'apples' }; expected has variables array
  // Any variable from the list is a valid elimination choice
  const chosen = normalizeText(response?.eliminateVar);
  const validVars = (expected?.variables || []).map(normalizeText);
  if (chosen && validVars.includes(chosen)) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  if (chosen) return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/wrong-variable' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-variable' };
}

function evaluatePlanList(response, expected) {
  // Frontend sends { conditions: [0, 1, 2], range: '...' }; expected has conditions array
  const selected = response?.conditions || [];
  const expectedCount = (expected?.conditions || []).length;
  if (selected.length >= expectedCount) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  if (selected.length > 0) return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/missed-condition' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-conditions' };
}

function evaluatePlanGuess(response, expected) {
  // Frontend sends { constraints: [0, 1] }; expected has constraints array
  const selected = response?.constraints || [];
  const expectedCount = (expected?.constraints || []).length;
  if (selected.length >= expectedCount) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  if (selected.length > 0) return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/missed-constraint' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-constraints' };
}

const PLAN_EVALUATORS = {
  model: evaluatePlanModel,
  reverse_steps: evaluatePlanReverseSteps,
  table_setup: evaluatePlanTable,
  equation_setup: evaluatePlanEquation,
  list_candidates: evaluatePlanList,
  guess_setup: evaluatePlanGuess,
};

function evaluatePlan(response, expected) {
  const type = expected?.type || 'model';
  const evaluator = PLAN_EVALUATORS[type] || evaluatePlanModel;
  return evaluator(response, expected);
}

function evaluateSolveExpression(response, expected) {
  const submittedAnswer = Number(response?.answer);
  const correctAnswer = Number(expected?.answer);

  if (expected?.steps) {
    if (submittedAnswer === correctAnswer) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
    const intermediateCorrect = (response?.intermediates || []).some((v, i) => {
      const expStep = expected.steps[i];
      return expStep && Number(v) === safeEval(expStep.expression);
    });
    if (intermediateCorrect) {
      return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/arithmetic-error' };
    }
    return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/used-wrong-numbers' };
  }

  if (submittedAnswer === correctAnswer) return { correct: true, partial: false, score: 1, misconceptionTag: '' };

  const op = normalizeText(response?.operation);
  const expectedOp = normalizeText(expected?.operation);
  if (op && expectedOp && op !== expectedOp) {
    return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-operation' };
  }
  if (op === expectedOp) {
    return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/arithmetic-error' };
  }
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-operation' };
}

function evaluateSolveNumeric(response, expected) {
  const submitted = Number(response?.answer);
  const correct = Number(expected?.answer);
  if (submitted === correct) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-answer' };
}

function evaluateSolveReverseChain(response, expected) {
  const submitted = Number(response?.answer);
  const correct = Number(expected?.answer);
  if (submitted === correct) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  const steps = response?.steps || [];
  const expectedSteps = expected?.steps || [];
  const someCorrect = steps.some((s, i) => expectedSteps[i] && Number(s) === Number(expectedSteps[i]));
  if (someCorrect) return { correct: false, partial: true, score: 0.5, misconceptionTag: 'psl/arithmetic-error' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-reverse' };
}

function evaluateSolveGuessTable(response, expected) {
  const submitted = Number(response?.answer);
  const correct = Number(expected?.answer);
  if (submitted === correct) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
  return { correct: false, partial: false, score: 0, misconceptionTag: 'psl/wrong-guess' };
}

const SOLVE_EVALUATORS = {
  expression: evaluateSolveExpression,
  twoStep: evaluateSolveExpression,
  find_rule: evaluateSolveNumeric,
  eliminate: evaluateSolveNumeric,
  list_check: evaluateSolveNumeric,
  guess_table: evaluateSolveGuessTable,
  reverse_chain: evaluateSolveReverseChain,
};

function evaluateSolve(response, expected) {
  const type = expected?.type || (expected?.steps ? 'twoStep' : 'expression');
  const evaluator = SOLVE_EVALUATORS[type] || evaluateSolveExpression;
  return evaluator(response, expected);
}

function evaluateCheck(response) {
  const correct = response?.reasonable === true;
  return { correct, partial: false, score: correct ? 1 : 0, misconceptionTag: correct ? '' : 'psl/skipped-check' };
}

const EVALUATORS = {
  understand: evaluateUnderstand,
  identify_info: evaluateIdentifyInfo,
  identify_question: evaluateIdentifyQuestion,
  plan: evaluatePlan,
  solve: evaluateSolve,
  check: evaluateCheck,
};

export function evaluateStep(stepId, response, expectedResponse) {
  const evaluator = EVALUATORS[stepId];
  if (!evaluator) return { correct: false, partial: false, score: 0, misconceptionTag: '', feedback: 'Unknown step.' };

  const result = evaluator(response, expectedResponse);

  let feedback = '';
  if (result.correct) feedback = 'Well done!';
  else if (result.partial) feedback = 'Almost there — check your answer carefully.';
  else feedback = 'Not quite. Let’s look at this again.';

  return { ...result, feedback };
}

export function evaluateAttempt(steps) {
  if (!steps.length) return { overallCorrect: false, overallScore: 0 };
  const total = steps.reduce((sum, s) => sum + (s.score || 0), 0);
  const overallScore = Math.round((total / steps.length) * 100) / 100;
  const overallCorrect = steps.every((s) => s.correct);
  return { overallCorrect, overallScore };
}
