import { getSkill } from './MoneySkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './MoneyQuestionFamilies.js';

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

function computeAnswer_MN001_0(a, b, v) { return a; }
function buildPrompt_MN001_0(a, b, v) { return `How many 10-cent coins make $${(a * 10 / 100).toFixed(2)}?`; }
function computeAnswer_MN001_1(a, b, v) { return a * 20; }
function buildPrompt_MN001_1(a, b, v) { return `What is the value of ${a} 20-cent coins in cents?`; }
function computeAnswer_MN002_0(a, b, v) { return a + b; }
function buildPrompt_MN002_0(a, b, v) { return `$${a}.00 + $${b}.00 = ?`; }
function computeAnswer_MN002_1(a, b, v) { return a * 100 + b * 5; }
function buildPrompt_MN002_1(a, b, v) { return `You have $${a} and $${b / 20}.${(b * 5 % 100).toString().padStart(2,'0')}. How much money do you have altogether? (in cents)`; }
function computeAnswer_MN003_0(a, b, v) { return a * b; }
function buildPrompt_MN003_0(a, b, v) { return `A book costs $${a}. How much do ${b} books cost?`; }
function computeAnswer_MN003_1(a, b, v) { return a * b; }
function buildPrompt_MN003_1(a, b, v) { return `${b} pens cost $${a} each. What is the total cost?`; }
function computeAnswer_MN004_0(a, b, v) { return (a + b) - a; }
function buildPrompt_MN004_0(a, b, v) { return `An item costs $${a}. You pay $${a + b}. How much change do you get?`; }
function computeAnswer_MN004_1(a, b, v) { return b * 10 - a; }
function buildPrompt_MN004_1(a, b, v) { return `You buy items costing $${a} in total. You pay with $${b * 10}. How much change?`; }
function computeAnswer_MN005_0(a, b, v) { return a * b + b; }
function buildPrompt_MN005_0(a, b, v) { return `Mia buys ${a} books at $${b} each and a pen for $${b}. How much does she pay in total?`; }
function computeAnswer_MN005_1(a, b, v) { return a - b * 2; }
function buildPrompt_MN005_1(a, b, v) { return `Ali had $${a}. He spent $${b} each day for 2 days. How much did he have left?`; }

function monCoinsNotes(family, rng, variant) {
  const v = variant % 20;
  // Recognising coins and notes — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN001_0(a, b, v);
  const prompt = buildPrompt_MN001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/face-value', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/face-value', difficulty: family.difficulty, mode: 'practice' });
}
function monCoinsNotesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Recognising coins and notes — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN001_1(a, b, v);
  const prompt = buildPrompt_MN001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/face-value', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/face-value', difficulty: family.difficulty, mode: 'practice' });
}
function monAdd(family, rng, variant) {
  const v = variant % 20;
  // Adding amounts of money — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN002_0(a, b, v);
  const prompt = buildPrompt_MN002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/cents-overflow', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/cents-overflow', difficulty: family.difficulty, mode: 'practice' });
}
function monAddWord(family, rng, variant) {
  const v = variant % 20;
  // Adding amounts of money — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN002_1(a, b, v);
  const prompt = buildPrompt_MN002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/cents-overflow', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/cents-overflow', difficulty: family.difficulty, mode: 'practice' });
}
function monTotalCost(family, rng, variant) {
  const v = variant % 20;
  // Finding total cost (unit price × quantity) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN003_0(a, b, v);
  const prompt = buildPrompt_MN003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/add-not-multiply', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/add-not-multiply', difficulty: family.difficulty, mode: 'practice' });
}
function monTotalCostMCQ(family, rng, variant) {
  const v = variant % 20;
  // Finding total cost (unit price × quantity) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN003_1(a, b, v);
  const prompt = buildPrompt_MN003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/add-not-multiply', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/add-not-multiply', difficulty: family.difficulty, mode: 'practice' });
}
function monChange(family, rng, variant) {
  const v = variant % 20;
  // Calculating change — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN004_0(a, b, v);
  const prompt = buildPrompt_MN004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/change-direction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/change-direction', difficulty: family.difficulty, mode: 'practice' });
}
function monChangeWord(family, rng, variant) {
  const v = variant % 20;
  // Calculating change — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN004_1(a, b, v);
  const prompt = buildPrompt_MN004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/change-direction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/change-direction', difficulty: family.difficulty, mode: 'practice' });
}
function monWordProb(family, rng, variant) {
  const v = variant % 20;
  // Money word problems — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN005_0(a, b, v);
  const prompt = buildPrompt_MN005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/money-decimal-place', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/money-decimal-place', difficulty: family.difficulty, mode: 'practice' });
}
function monWordProbMulti(family, rng, variant) {
  const v = variant % 20;
  // Money word problems — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_MN005_1(a, b, v);
  const prompt = buildPrompt_MN005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mon/money-decimal-place', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mon/money-decimal-place', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'monCoinsNotes': monCoinsNotes, 'monCoinsNotesMCQ': monCoinsNotesMCQ, 'monAdd': monAdd, 'monAddWord': monAddWord, 'monTotalCost': monTotalCost, 'monTotalCostMCQ': monTotalCostMCQ, 'monChange': monChange, 'monChangeWord': monChangeWord, 'monWordProb': monWordProb, 'monWordProbMulti': monWordProbMulti };

export function generateMoneyQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkMoneyAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateMoneyQuestionSet, checkMoneyAnswer };
