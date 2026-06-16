import { getSkill } from './AlgebraSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './AlgebraQuestionFamilies.js';

// Seeded RNG (mulberry32)
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function makeRng(seedStr) {
  let a = hashSeed(seedStr);
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rint(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
function pick(rng, arr) { return arr[rint(rng, 0, arr.length - 1)]; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function round2(v) { return Math.round(v * 100) / 100; }

function shortAnswer({ family, prompt, answer, display, solutionSteps, misconceptionTag, difficulty, mode }) {
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'short_answer',
    prompt,
    choices: [],
    answer: { display: display ?? String(answer), value: answer },
    acceptedAnswers: [display ?? String(answer)],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
  };
}

function mcq({ family, prompt, answerDisplay, distractors, solutionSteps, misconceptionTag, difficulty, mode, rng }) {
  const seen = new Set([answerDisplay]);
  const opts = [];
  for (const d of distractors.map(String)) {
    if (!seen.has(d)) { seen.add(d); opts.push(d); }
  }
  const choices = [answerDisplay, ...opts.slice(0, 3)];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rint(rng, 0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'mcq',
    prompt,
    choices,
    answer: { display: answerDisplay, value: answerDisplay },
    acceptedAnswers: [answerDisplay],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
  };
}

// The answer is the UNKNOWN, not the right-hand-side total. For `a + ___ = a+b`
// the missing number is b; for `___ × b = a*b` it is a. The old code returned
// the RHS total (a+b / a*b), misgrading every AL001/AL002 item. See audit.
function computeAnswer_AL001_0(a, b, v) { return b; }
function buildPrompt_AL001_0(a, b, v) { return `${a} + ___ = ${a + b}. What is the missing number?`; }
function computeAnswer_AL001_1(a, b, v) { return a; }
function buildPrompt_AL001_1(a, b, v) { return `___ × ${b} = ${a * b}. What is the missing number?`; }
function computeAnswer_AL002_0(a, b, v) { return a; }
function buildPrompt_AL002_0(a, b, v) { return `n + ${b} = ${a + b}. What is n?`; }
function computeAnswer_AL002_1(a, b, v) { return a; }
function buildPrompt_AL002_1(a, b, v) { return `k × ${b} = ${a * b}. What is k?`; }
function computeAnswer_AL003_0(a, b, v) { return a * b; }
function buildPrompt_AL003_0(a, b, v) { return `If n = ${a}, what is ${b}n?`; }
function computeAnswer_AL003_1(a, b, v) { return a + b; }
function buildPrompt_AL003_1(a, b, v) { return `Write the expression for '${b} more than n' when n = ${a}.`; }
function computeAnswer_AL004_0(a, b, v) { return a + b; }
function buildPrompt_AL004_0(a, b, v) { return `Write an expression for '${a} more than n' then evaluate when n = ${b}.`; }
function computeAnswer_AL004_1(a, b, v) { return a * b; }
function buildPrompt_AL004_1(a, b, v) { return `Write an expression for '${a} times n' then evaluate when n = ${b}.`; }
function computeAnswer_AL005_0(a, b, v) { return a * b + 3; }
function buildPrompt_AL005_0(a, b, v) { return `Evaluate ${a}n + 3 when n = ${b}.`; }
function computeAnswer_AL005_1(a, b, v) { return 2 * a + b; }
function buildPrompt_AL005_1(a, b, v) { return `Find the value of 2m + ${b} when m = ${a}.`; }
function computeAnswer_AL006_0(a, b, v) { return a + b; }
function buildPrompt_AL006_0(a, b, v) { return `Simplify: ${a}n + ${b}n. Write your answer as a single term.`; }
function computeAnswer_AL006_1(a, b, v) { return a - b; }
function buildPrompt_AL006_1(a, b, v) { return `Simplify: ${a}x − ${b}x.`; }
function computeAnswer_AL007_0(a, b, v) { return a + b; }
function buildPrompt_AL007_0(a, b, v) { return `Expand and simplify: ${a}(n + ${b}). Write your answer (coefficient of n first).`; }
function computeAnswer_AL007_1(a, b, v) { return a * b + a; }
function buildPrompt_AL007_1(a, b, v) { return `Expand: ${a}(${b}n + 1). What is the coefficient of n?`; }
function computeAnswer_AL008_0(a, b, v) { return a + b; }
function buildPrompt_AL008_0(a, b, v) { return `Solve: n − ${b} = ${a}. What is n?`; }
function computeAnswer_AL008_1(a, b, v) { return a * b; }
function buildPrompt_AL008_1(a, b, v) { return `Solve: m ÷ ${b} = ${a}. What is m?`; }
// Equation 2n + b = 2a + b ⇒ n = a (always a clean integer). The old version
// built the RHS from one formula and the answer from another, so prompt and key
// disagreed (e.g. "2n + 10 = 14" was keyed 6 instead of 2). See audit.
function computeAnswer_AL009_0(a, b, v) { return a; }
function buildPrompt_AL009_0(a, b, v) { return `Solve: 2n + ${b} = ${2 * a + b}. What is n?`; }
function computeAnswer_AL009_1(a, b, v) { return a; }
function buildPrompt_AL009_1(a, b, v) { return `Solve: 3k − ${b} = ${3*a - b}. What is k?`; }
function computeAnswer_AL010_0(a, b, v) { return Math.floor((a - b) / 3); }
function buildPrompt_AL010_0(a, b, v) { return `Three times a number plus ${b} equals ${3*Math.floor((a-b)/3)+b || a}. Find the number.`; }
function computeAnswer_AL010_1(a, b, v) { return a; }
function buildPrompt_AL010_1(a, b, v) { return `Mia has n stickers. After giving away ${b}, she has ${a - b || a} left. Find n.`; }

function algUnknownArith(family, rng, variant) {
  const v = variant % 20;
  // Unknowns in arithmetic (missing numbers) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL001_0(a, b, v);
  const prompt = buildPrompt_AL001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/equals-means-answer', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/equals-means-answer', difficulty: family.difficulty, mode: 'practice' });
}
function algUnknownArithMCQ(family, rng, variant) {
  const v = variant % 20;
  // Unknowns in arithmetic (missing numbers) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL001_1(a, b, v);
  const prompt = buildPrompt_AL001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/equals-means-answer', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/equals-means-answer', difficulty: family.difficulty, mode: 'practice' });
}
function algUnknownLetter(family, rng, variant) {
  const v = variant % 20;
  // Using a letter for an unknown — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL002_0(a, b, v);
  const prompt = buildPrompt_AL002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/letter-as-label', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/letter-as-label', difficulty: family.difficulty, mode: 'practice' });
}
function algUnknownLetterMCQ(family, rng, variant) {
  const v = variant % 20;
  // Using a letter for an unknown — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL002_1(a, b, v);
  const prompt = buildPrompt_AL002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/letter-as-label', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/letter-as-label', difficulty: family.difficulty, mode: 'practice' });
}
function algNotation(family, rng, variant) {
  const v = variant % 20;
  // Algebraic notation — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL003_0(a, b, v);
  const prompt = buildPrompt_AL003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/3n-means-3-plus-n', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/3n-means-3-plus-n', difficulty: family.difficulty, mode: 'practice' });
}
function algNotationMCQ(family, rng, variant) {
  const v = variant % 20;
  // Algebraic notation — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL003_1(a, b, v);
  const prompt = buildPrompt_AL003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/3n-means-3-plus-n', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/3n-means-3-plus-n', difficulty: family.difficulty, mode: 'practice' });
}
function algFormExpression(family, rng, variant) {
  const v = variant % 20;
  // Forming expressions from words — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL004_0(a, b, v);
  const prompt = buildPrompt_AL004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/word-order', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/word-order', difficulty: family.difficulty, mode: 'practice' });
}
function algFormExpressionMCQ(family, rng, variant) {
  const v = variant % 20;
  // Forming expressions from words — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL004_1(a, b, v);
  const prompt = buildPrompt_AL004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/word-order', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/word-order', difficulty: family.difficulty, mode: 'practice' });
}
function algSubstitute(family, rng, variant) {
  const v = variant % 20;
  // Substitution (evaluating expressions) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL005_0(a, b, v);
  const prompt = buildPrompt_AL005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/sub-no-times', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/sub-no-times', difficulty: family.difficulty, mode: 'practice' });
}
function algSubstituteWord(family, rng, variant) {
  const v = variant % 20;
  // Substitution (evaluating expressions) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL005_1(a, b, v);
  const prompt = buildPrompt_AL005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/sub-no-times', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/sub-no-times', difficulty: family.difficulty, mode: 'practice' });
}
function algSimplifyAdd(family, rng, variant) {
  const v = variant % 20;
  // Simplifying by collecting like terms — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL006_0(a, b, v);
  const prompt = buildPrompt_AL006_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/combine-unlike', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/combine-unlike', difficulty: family.difficulty, mode: 'practice' });
}
function algSimplifyAddMCQ(family, rng, variant) {
  const v = variant % 20;
  // Simplifying by collecting like terms — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL006_1(a, b, v);
  const prompt = buildPrompt_AL006_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/combine-unlike', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/combine-unlike', difficulty: family.difficulty, mode: 'practice' });
}
function algSimplifyMixed(family, rng, variant) {
  const v = variant % 20;
  // Simplifying with brackets (distributive law) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL007_0(a, b, v);
  const prompt = buildPrompt_AL007_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/distribute-partial', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/distribute-partial', difficulty: family.difficulty, mode: 'practice' });
}
function algSimplifyMixedMCQ(family, rng, variant) {
  const v = variant % 20;
  // Simplifying with brackets (distributive law) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL007_1(a, b, v);
  const prompt = buildPrompt_AL007_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/distribute-partial', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/distribute-partial', difficulty: family.difficulty, mode: 'practice' });
}
function algEquation1Step(family, rng, variant) {
  const v = variant % 20;
  // Solving one-step linear equations — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL008_0(a, b, v);
  const prompt = buildPrompt_AL008_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/same-side-op', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/same-side-op', difficulty: family.difficulty, mode: 'practice' });
}
function algEquation1StepWord(family, rng, variant) {
  const v = variant % 20;
  // Solving one-step linear equations — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL008_1(a, b, v);
  const prompt = buildPrompt_AL008_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/same-side-op', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/same-side-op', difficulty: family.difficulty, mode: 'practice' });
}
function algEquation2Step(family, rng, variant) {
  const v = variant % 20;
  // Solving two-step linear equations — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL009_0(a, b, v);
  const prompt = buildPrompt_AL009_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/order-of-undo', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/order-of-undo', difficulty: family.difficulty, mode: 'practice' });
}
function algEquation2StepWord(family, rng, variant) {
  const v = variant % 20;
  // Solving two-step linear equations — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL009_1(a, b, v);
  const prompt = buildPrompt_AL009_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/order-of-undo', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/order-of-undo', difficulty: family.difficulty, mode: 'practice' });
}
function algWordToEquation(family, rng, variant) {
  const v = variant % 20;
  // Forming and solving equations from word problems — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL010_0(a, b, v);
  const prompt = buildPrompt_AL010_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/wrong-relation', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/wrong-relation', difficulty: family.difficulty, mode: 'practice' });
}
function algWordToEquationMCQ(family, rng, variant) {
  const v = variant % 20;
  // Forming and solving equations from word problems — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AL010_1(a, b, v);
  const prompt = buildPrompt_AL010_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'alg/wrong-relation', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'alg/wrong-relation', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'algUnknownArith': algUnknownArith, 'algUnknownArithMCQ': algUnknownArithMCQ, 'algUnknownLetter': algUnknownLetter, 'algUnknownLetterMCQ': algUnknownLetterMCQ, 'algNotation': algNotation, 'algNotationMCQ': algNotationMCQ, 'algFormExpression': algFormExpression, 'algFormExpressionMCQ': algFormExpressionMCQ, 'algSubstitute': algSubstitute, 'algSubstituteWord': algSubstituteWord, 'algSimplifyAdd': algSimplifyAdd, 'algSimplifyAddMCQ': algSimplifyAddMCQ, 'algSimplifyMixed': algSimplifyMixed, 'algSimplifyMixedMCQ': algSimplifyMixedMCQ, 'algEquation1Step': algEquation1Step, 'algEquation1StepWord': algEquation1StepWord, 'algEquation2Step': algEquation2Step, 'algEquation2StepWord': algEquation2StepWord, 'algWordToEquation': algWordToEquation, 'algWordToEquationMCQ': algWordToEquationMCQ };

export function generateAlgebraQuestionSet({ skillId, count = 6, mode = 'practice' }) {
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return [];
  const questions = [];
  let variant = 0;
  for (let i = 0; i < count; i++) {
    const family = families[i % families.length];
    const rng = makeRng(`${skillId}-${family.id}-${variant}`);
    const gen = GENERATORS[family.generatorKind];
    if (gen) questions.push(gen(family, rng, variant));
    variant++;
  }
  return questions;
}

export function checkAlgebraAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateAlgebraQuestionSet, checkAlgebraAnswer };
