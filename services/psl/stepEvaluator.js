export const STEP_IDS = ['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check'];

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

function evaluatePlan(response, expected) {
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

function evaluateSolve(response, expected) {
  const submittedAnswer = Number(response?.answer);
  const correctAnswer = Number(expected?.answer);

  if (expected?.steps) {
    if (submittedAnswer === correctAnswer) return { correct: true, partial: false, score: 1, misconceptionTag: '' };
    const intermediateCorrect = (response?.intermediates || []).some((v, i) => {
      const expStep = expected.steps[i];
      return expStep && Number(v) === eval(expStep.expression.replace(/×/g, '*'));
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
