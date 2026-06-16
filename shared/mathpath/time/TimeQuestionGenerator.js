import { getSkill } from './TimeSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './TimeQuestionFamilies.js';

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

function computeAnswer_TM001_0(a, b, v) { return a % 12 || 12; }
function buildPrompt_TM001_0(a, b, v) { return `The clock shows ${a % 12 || 12}:00. What time is it?`; }
function computeAnswer_TM001_1(a, b, v) { return (a % 12 || 12) * 100 + 30; }
function buildPrompt_TM001_1(a, b, v) { return `The minute hand points to 6 and the hour hand is between ${a % 12 || 12} and ${(a % 12 || 12) % 12 + 1}. What time is it? (e.g. 3:30)`; }
function computeAnswer_TM002_0(a, b, v) { return a * 100 + b * 5; }
function buildPrompt_TM002_0(a, b, v) { return `The clock shows ${a}:${(b * 5).toString().padStart(2,'0')}. Write the time.`; }
function computeAnswer_TM002_1(a, b, v) { return (a + 1) * 100 + b * 5; }
function buildPrompt_TM002_1(a, b, v) { return `It is ${a}:${(b * 5).toString().padStart(2,'0')} now. What time will it be 1 hour later?`; }
function computeAnswer_TM003_0(a, b, v) { return a * 60; }
function buildPrompt_TM003_0(a, b, v) { return `${a} hours = ? minutes`; }
function computeAnswer_TM003_1(a, b, v) { return a * 60 + b * 10; }
function buildPrompt_TM003_1(a, b, v) { return `${a} hours ${b * 10} minutes = ? minutes`; }
function computeAnswer_TM004_0(a, b, v) { return (a % 12 + 12); }
function buildPrompt_TM004_0(a, b, v) { return `Convert ${a % 12 || 12}:00 pm to 24-hour time. (Just the hour)`; }
function computeAnswer_TM004_1(a, b, v) { return (a % 12 || 12); }
function buildPrompt_TM004_1(a, b, v) { return `${(a % 12 + 12).toString().padStart(2,'0')}:${(b * 5).toString().padStart(2,'0')} in 12-hour time is ${(a % 12 || 12)}:${(b * 5).toString().padStart(2,'0')} ?`; }
function computeAnswer_TM005_0(a, b, v) { return a * 60 + b * 5; }
function buildPrompt_TM005_0(a, b, v) { return `A show starts at 2:00 pm and ends at ${2 + a}:${(b * 5).toString().padStart(2,'0')} pm. How many minutes did it last?`; }
function computeAnswer_TM005_1(a, b, v) { return a * 60 - b * 10; }
function buildPrompt_TM005_1(a, b, v) { return `A journey takes ${a} hours. ${b * 10} minutes have passed. How many minutes remain?`; }

function timTellHour(family, rng, variant) {
  const v = variant % 20;
  // Telling time to the hour and half-hour — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM001_0(a, b, v);
  const prompt = buildPrompt_TM001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'tim/hour-half', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'tim/hour-half', difficulty: family.difficulty, mode: 'practice' });
}
function timTellHourMCQ(family, rng, variant) {
  const v = variant % 20;
  // Telling time to the hour and half-hour — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM001_1(a, b, v);
  const prompt = buildPrompt_TM001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'tim/hour-half', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'tim/hour-half', difficulty: family.difficulty, mode: 'practice' });
}
function timTellMinutes(family, rng, variant) {
  const v = variant % 20;
  // Telling time to the minute — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM002_0(a, b, v);
  const prompt = buildPrompt_TM002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'tim/minute-skip', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'tim/minute-skip', difficulty: family.difficulty, mode: 'practice' });
}
function timTellMinutesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Telling time to the minute — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM002_1(a, b, v);
  const prompt = buildPrompt_TM002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'tim/minute-skip', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'tim/minute-skip', difficulty: family.difficulty, mode: 'practice' });
}
function timConvert(family, rng, variant) {
  const v = variant % 20;
  // Converting time units (hours, minutes, seconds) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM003_0(a, b, v);
  const prompt = buildPrompt_TM003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'tim/base-10-error', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'tim/base-10-error', difficulty: family.difficulty, mode: 'practice' });
}
function timConvertWord(family, rng, variant) {
  const v = variant % 20;
  // Converting time units (hours, minutes, seconds) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM003_1(a, b, v);
  const prompt = buildPrompt_TM003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'tim/base-10-error', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'tim/base-10-error', difficulty: family.difficulty, mode: 'practice' });
}
function tim24hr(family, rng, variant) {
  const v = variant % 20;
  // The 24-hour clock — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM004_0(a, b, v);
  const prompt = buildPrompt_TM004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice' });
}
function tim24hrMCQ(family, rng, variant) {
  const v = variant % 20;
  // The 24-hour clock — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM004_1(a, b, v);
  const prompt = buildPrompt_TM004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice' });
}
function timDuration(family, rng, variant) {
  const v = variant % 20;
  // Duration and time intervals — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM005_0(a, b, v);
  const prompt = buildPrompt_TM005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice' });
}
function timDurationWord(family, rng, variant) {
  const v = variant % 20;
  // Duration and time intervals — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_TM005_1(a, b, v);
  const prompt = buildPrompt_TM005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'timTellHour': timTellHour, 'timTellHourMCQ': timTellHourMCQ, 'timTellMinutes': timTellMinutes, 'timTellMinutesMCQ': timTellMinutesMCQ, 'timConvert': timConvert, 'timConvertWord': timConvertWord, 'tim24hr': tim24hr, 'tim24hrMCQ': tim24hrMCQ, 'timDuration': timDuration, 'timDurationWord': timDurationWord };

export function generateTimeQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkTimeAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateTimeQuestionSet, checkTimeAnswer };
