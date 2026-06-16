import { getSkill } from './CirclesSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './CirclesQuestionFamilies.js';

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

function computeAnswer_CI001_0(a, b, v) { return a * 2; }
function buildPrompt_CI001_0(a, b, v) { return `The radius of a circle is ${a} cm. What is its diameter?`; }
function computeAnswer_CI001_1(a, b, v) { return a; }
function buildPrompt_CI001_1(a, b, v) { return `The diameter of a circle is ${a * 2} cm. What is its radius?`; }
function computeAnswer_CI002_0(a, b, v) { return round2(2 * 3.14 * a); }
function buildPrompt_CI002_0(a, b, v) { return `Find the circumference of a circle with radius ${a} cm. (Use π = 3.14)`; }
function computeAnswer_CI002_1(a, b, v) { return round2(3.14 * a * 2); }
function buildPrompt_CI002_1(a, b, v) { return `Find the circumference of a circle with diameter ${a * 2} cm. (Use π = 3.14)`; }
function computeAnswer_CI003_0(a, b, v) { return round2(3.14 * a * a); }
function buildPrompt_CI003_0(a, b, v) { return `Find the area of a circle with radius ${a} cm. (Use π = 3.14)`; }
// Prompt states diameter = a*2, so radius = a. Area = πr² = 3.14·a².
// (Previously computed 3.14·(a/2)² — wrong by a factor of 4. See audit.)
function computeAnswer_CI003_1(a, b, v) { return round2(3.14 * a * a); }
function buildPrompt_CI003_1(a, b, v) { return `Find the area of a circle with diameter ${a * 2} cm. (Use π = 3.14)`; }
function computeAnswer_CI004_0(a, b, v) { return round2(3.14 * a * a / 2); }
function buildPrompt_CI004_0(a, b, v) { return `Find the area of a semicircle with radius ${a} cm. (Use π = 3.14)`; }
function computeAnswer_CI004_1(a, b, v) { return round2(3.14 * a * a / 4); }
function buildPrompt_CI004_1(a, b, v) { return `Find the area of a quarter-circle with radius ${a} cm. (Use π = 3.14)`; }

function cirParts(family, rng, variant) {
  const v = variant % 20;
  // Parts of a circle (radius, diameter, centre) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI001_0(a, b, v);
  const prompt = buildPrompt_CI001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice' });
}
function cirPartsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Parts of a circle (radius, diameter, centre) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI001_1(a, b, v);
  const prompt = buildPrompt_CI001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice' });
}
function cirCircumference(family, rng, variant) {
  const v = variant % 20;
  // Circumference of a circle — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI002_0(a, b, v);
  const prompt = buildPrompt_CI002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice' });
}
function cirCircumferenceWord(family, rng, variant) {
  const v = variant % 20;
  // Circumference of a circle — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI002_1(a, b, v);
  const prompt = buildPrompt_CI002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/radius-diameter', difficulty: family.difficulty, mode: 'practice' });
}
function cirArea(family, rng, variant) {
  const v = variant % 20;
  // Area of a circle — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI003_0(a, b, v);
  const prompt = buildPrompt_CI003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/area-uses-diameter', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/area-uses-diameter', difficulty: family.difficulty, mode: 'practice' });
}
function cirAreaWord(family, rng, variant) {
  const v = variant % 20;
  // Area of a circle — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI003_1(a, b, v);
  const prompt = buildPrompt_CI003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/area-uses-diameter', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/area-uses-diameter', difficulty: family.difficulty, mode: 'practice' });
}
function cirSemiQuarter(family, rng, variant) {
  const v = variant % 20;
  // Semicircles and quarter-circles — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI004_0(a, b, v);
  const prompt = buildPrompt_CI004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/half-wrong', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/half-wrong', difficulty: family.difficulty, mode: 'practice' });
}
function cirSemiQuarterWord(family, rng, variant) {
  const v = variant % 20;
  // Semicircles and quarter-circles — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_CI004_1(a, b, v);
  const prompt = buildPrompt_CI004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'cir/half-wrong', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'cir/half-wrong', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'cirParts': cirParts, 'cirPartsMCQ': cirPartsMCQ, 'cirCircumference': cirCircumference, 'cirCircumferenceWord': cirCircumferenceWord, 'cirArea': cirArea, 'cirAreaWord': cirAreaWord, 'cirSemiQuarter': cirSemiQuarter, 'cirSemiQuarterWord': cirSemiQuarterWord };

export function generateCirclesQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkCirclesAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateCirclesQuestionSet, checkCirclesAnswer };
