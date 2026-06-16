import { getSkill } from './OperationsSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './OperationsQuestionFamilies.js';

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

function computeAnswer_OP001_0(a, b, v) { return a + b; }
function buildPrompt_OP001_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP001_1(a, b, v) { return a + b; }
function buildPrompt_OP001_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP002_0(a, b, v) { return a + b; }
function buildPrompt_OP002_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP002_1(a, b, v) { return a + b; }
function buildPrompt_OP002_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP003_0(a, b, v) { return a + b; }
function buildPrompt_OP003_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP003_1(a, b, v) { return a + b; }
function buildPrompt_OP003_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP004_0(a, b, v) { return a + b; }
function buildPrompt_OP004_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP004_1(a, b, v) { return a + b; }
function buildPrompt_OP004_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP005_0(a, b, v) { return a + b; }
function buildPrompt_OP005_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP005_1(a, b, v) { return a + b; }
function buildPrompt_OP005_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP006_0(a, b, v) { return a + b; }
function buildPrompt_OP006_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP006_1(a, b, v) { return a + b; }
function buildPrompt_OP006_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP007_0(a, b, v) { return a + b; }
function buildPrompt_OP007_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP007_1(a, b, v) { return a + b; }
function buildPrompt_OP007_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP008_0(a, b, v) { return a + b; }
function buildPrompt_OP008_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP008_1(a, b, v) { return a + b; }
function buildPrompt_OP008_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP009_0(a, b, v) { return a + b; }
function buildPrompt_OP009_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP009_1(a, b, v) { return a + b; }
function buildPrompt_OP009_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP010_0(a, b, v) { return a + b; }
function buildPrompt_OP010_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP010_1(a, b, v) { return a + b; }
function buildPrompt_OP010_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP011_0(a, b, v) { return a + b; }
function buildPrompt_OP011_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP011_1(a, b, v) { return a + b; }
function buildPrompt_OP011_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP012_0(a, b, v) { return a + b; }
function buildPrompt_OP012_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP012_1(a, b, v) { return a + b; }
function buildPrompt_OP012_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP013_0(a, b, v) { return a + b; }
function buildPrompt_OP013_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP013_1(a, b, v) { return a + b; }
function buildPrompt_OP013_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP014_0(a, b, v) { return a + b; }
function buildPrompt_OP014_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP014_1(a, b, v) { return a + b; }
function buildPrompt_OP014_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP015_0(a, b, v) { return a + b; }
function buildPrompt_OP015_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP015_1(a, b, v) { return a + b; }
function buildPrompt_OP015_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP016_0(a, b, v) { return a + b; }
function buildPrompt_OP016_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP016_1(a, b, v) { return a + b; }
function buildPrompt_OP016_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP017_0(a, b, v) { return a + b; }
function buildPrompt_OP017_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP017_1(a, b, v) { return a + b; }
function buildPrompt_OP017_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP018_0(a, b, v) { return a + b; }
function buildPrompt_OP018_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP018_1(a, b, v) { return a + b; }
function buildPrompt_OP018_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP019_0(a, b, v) { return a + b; }
function buildPrompt_OP019_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP019_1(a, b, v) { return a + b; }
function buildPrompt_OP019_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP020_0(a, b, v) { return a + b; }
function buildPrompt_OP020_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP020_1(a, b, v) { return a + b; }
function buildPrompt_OP020_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP021_0(a, b, v) { return a + b; }
function buildPrompt_OP021_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP021_1(a, b, v) { return a + b; }
function buildPrompt_OP021_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP022_0(a, b, v) { return a + b; }
function buildPrompt_OP022_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP022_1(a, b, v) { return a + b; }
function buildPrompt_OP022_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP023_0(a, b, v) { return a + b; }
function buildPrompt_OP023_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP023_1(a, b, v) { return a + b; }
function buildPrompt_OP023_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP024_0(a, b, v) { return a + b; }
function buildPrompt_OP024_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_OP024_1(a, b, v) { return a + b; }
function buildPrompt_OP024_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }

function opsOpAddFacts(family, rng, variant) {
  const v = variant % 20;
  // Addition facts within 20 (number bonds) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP001_0(a, b, v);
  const prompt = buildPrompt_OP001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/count-all', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/count-all', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpAddFactsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Addition facts within 20 (number bonds) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP001_1(a, b, v);
  const prompt = buildPrompt_OP001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/count-all', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/count-all', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpAdd2digit(family, rng, variant) {
  const v = variant % 20;
  // Adding 2-digit numbers (no regrouping) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP002_0(a, b, v);
  const prompt = buildPrompt_OP002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/place-misalign', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/place-misalign', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpAdd2digitMCQ(family, rng, variant) {
  const v = variant % 20;
  // Adding 2-digit numbers (no regrouping) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP002_1(a, b, v);
  const prompt = buildPrompt_OP002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/place-misalign', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/place-misalign', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpAddRegroup(family, rng, variant) {
  const v = variant % 20;
  // Adding with regrouping (carrying) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP003_0(a, b, v);
  const prompt = buildPrompt_OP003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/forgot-carry', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/forgot-carry', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpAddRegroupMCQ(family, rng, variant) {
  const v = variant % 20;
  // Adding with regrouping (carrying) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP003_1(a, b, v);
  const prompt = buildPrompt_OP003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/forgot-carry', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/forgot-carry', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpAddLarge(family, rng, variant) {
  const v = variant % 20;
  // Adding 3–4 digit numbers — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP004_0(a, b, v);
  const prompt = buildPrompt_OP004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/carry-cascade', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/carry-cascade', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpAddLargeMCQ(family, rng, variant) {
  const v = variant % 20;
  // Adding 3–4 digit numbers — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP004_1(a, b, v);
  const prompt = buildPrompt_OP004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'add/carry-cascade', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'add/carry-cascade', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSubFacts(family, rng, variant) {
  const v = variant % 20;
  // Subtraction facts within 20 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP005_0(a, b, v);
  const prompt = buildPrompt_OP005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/count-back-error', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/count-back-error', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSubFactsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Subtraction facts within 20 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP005_1(a, b, v);
  const prompt = buildPrompt_OP005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/count-back-error', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/count-back-error', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSub2digit(family, rng, variant) {
  const v = variant % 20;
  // Subtracting 2-digit numbers (no regrouping) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP006_0(a, b, v);
  const prompt = buildPrompt_OP006_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSub2digitMCQ(family, rng, variant) {
  const v = variant % 20;
  // Subtracting 2-digit numbers (no regrouping) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP006_1(a, b, v);
  const prompt = buildPrompt_OP006_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSubRegroup(family, rng, variant) {
  const v = variant % 20;
  // Subtracting with regrouping (borrowing) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP007_0(a, b, v);
  const prompt = buildPrompt_OP007_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSubRegroupMCQ(family, rng, variant) {
  const v = variant % 20;
  // Subtracting with regrouping (borrowing) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP007_1(a, b, v);
  const prompt = buildPrompt_OP007_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/smaller-from-larger', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSubLarge(family, rng, variant) {
  const v = variant % 20;
  // Subtracting 3–4 digit numbers (incl. across zeros) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP008_0(a, b, v);
  const prompt = buildPrompt_OP008_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/across-zeros', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/across-zeros', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpSubLargeMCQ(family, rng, variant) {
  const v = variant % 20;
  // Subtracting 3–4 digit numbers (incl. across zeros) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP008_1(a, b, v);
  const prompt = buildPrompt_OP008_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'sub/across-zeros', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'sub/across-zeros', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMultFacts(family, rng, variant) {
  const v = variant % 20;
  // Multiplication facts (times tables to 12) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP009_0(a, b, v);
  const prompt = buildPrompt_OP009_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/repeated-add-slow', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/repeated-add-slow', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMultFactsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Multiplication facts (times tables to 12) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP009_1(a, b, v);
  const prompt = buildPrompt_OP009_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/repeated-add-slow', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/repeated-add-slow', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMultBy10100(family, rng, variant) {
  const v = variant % 20;
  // Multiplying by 10, 100 and 1000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP010_0(a, b, v);
  const prompt = buildPrompt_OP010_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/append-zeros-decimal', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/append-zeros-decimal', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMultBy10100MCQ(family, rng, variant) {
  const v = variant % 20;
  // Multiplying by 10, 100 and 1000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP010_1(a, b, v);
  const prompt = buildPrompt_OP010_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/append-zeros-decimal', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/append-zeros-decimal', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMult2x1(family, rng, variant) {
  const v = variant % 20;
  // Multiplying 2–3 digit by 1 digit — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP011_0(a, b, v);
  const prompt = buildPrompt_OP011_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/forgot-carry', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/forgot-carry', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMult2x1MCQ(family, rng, variant) {
  const v = variant % 20;
  // Multiplying 2–3 digit by 1 digit — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP011_1(a, b, v);
  const prompt = buildPrompt_OP011_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/forgot-carry', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/forgot-carry', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMultLong(family, rng, variant) {
  const v = variant % 20;
  // Long multiplication (2 digit × 2 digit) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP012_0(a, b, v);
  const prompt = buildPrompt_OP012_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/missing-placeholder', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/missing-placeholder', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMultLongMCQ(family, rng, variant) {
  const v = variant % 20;
  // Long multiplication (2 digit × 2 digit) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP012_1(a, b, v);
  const prompt = buildPrompt_OP012_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mult/missing-placeholder', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mult/missing-placeholder', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivFacts(family, rng, variant) {
  const v = variant % 20;
  // Division facts (inverse of times tables) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP013_0(a, b, v);
  const prompt = buildPrompt_OP013_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/order-reversal', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/order-reversal', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivFactsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Division facts (inverse of times tables) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP013_1(a, b, v);
  const prompt = buildPrompt_OP013_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/order-reversal', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/order-reversal', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivShort(family, rng, variant) {
  const v = variant % 20;
  // Short division by a 1-digit number — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP014_0(a, b, v);
  const prompt = buildPrompt_OP014_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/drop-zero', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/drop-zero', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivShortMCQ(family, rng, variant) {
  const v = variant % 20;
  // Short division by a 1-digit number — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP014_1(a, b, v);
  const prompt = buildPrompt_OP014_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/drop-zero', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/drop-zero', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivRemainder(family, rng, variant) {
  const v = variant % 20;
  // Division with remainders (interpreting) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP015_0(a, b, v);
  const prompt = buildPrompt_OP015_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/ignore-remainder', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/ignore-remainder', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivRemainderMCQ(family, rng, variant) {
  const v = variant % 20;
  // Division with remainders (interpreting) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP015_1(a, b, v);
  const prompt = buildPrompt_OP015_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/ignore-remainder', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/ignore-remainder', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivLong(family, rng, variant) {
  const v = variant % 20;
  // Long division by a 2-digit number — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP016_0(a, b, v);
  const prompt = buildPrompt_OP016_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/bad-estimate', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/bad-estimate', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpDivLongMCQ(family, rng, variant) {
  const v = variant % 20;
  // Long division by a 2-digit number — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP016_1(a, b, v);
  const prompt = buildPrompt_OP016_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'div/bad-estimate', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'div/bad-estimate', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMentalAddSub(family, rng, variant) {
  const v = variant % 20;
  // Mental addition & subtraction strategies — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP017_0(a, b, v);
  const prompt = buildPrompt_OP017_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mental/no-compensation', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mental/no-compensation', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMentalAddSubMCQ(family, rng, variant) {
  const v = variant % 20;
  // Mental addition & subtraction strategies — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP017_1(a, b, v);
  const prompt = buildPrompt_OP017_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mental/no-compensation', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mental/no-compensation', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMentalMultDiv(family, rng, variant) {
  const v = variant % 20;
  // Mental multiplication & division strategies — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP018_0(a, b, v);
  const prompt = buildPrompt_OP018_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mental/no-factoring', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mental/no-factoring', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpMentalMultDivMCQ(family, rng, variant) {
  const v = variant % 20;
  // Mental multiplication & division strategies — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP018_1(a, b, v);
  const prompt = buildPrompt_OP018_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mental/no-factoring', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mental/no-factoring', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpOrderOfOps(family, rng, variant) {
  const v = variant % 20;
  // Order of operations (× ÷ before + −) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP019_0(a, b, v);
  const prompt = buildPrompt_OP019_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/left-to-right', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/left-to-right', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpOrderOfOpsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Order of operations (× ÷ before + −) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP019_1(a, b, v);
  const prompt = buildPrompt_OP019_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/left-to-right', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/left-to-right', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpOrderOfOpsBrackets(family, rng, variant) {
  const v = variant % 20;
  // Order of operations with brackets — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP020_0(a, b, v);
  const prompt = buildPrompt_OP020_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/ignore-brackets', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/ignore-brackets', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpOrderOfOpsBracketsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Order of operations with brackets — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP020_1(a, b, v);
  const prompt = buildPrompt_OP020_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/ignore-brackets', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/ignore-brackets', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpFactorsMultiples(family, rng, variant) {
  const v = variant % 20;
  // Factors and multiples — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP021_0(a, b, v);
  const prompt = buildPrompt_OP021_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/factor-multiple-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/factor-multiple-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpFactorsMultiplesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Factors and multiples — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP021_1(a, b, v);
  const prompt = buildPrompt_OP021_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/factor-multiple-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/factor-multiple-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpHcfLcm(family, rng, variant) {
  const v = variant % 20;
  // HCF and LCM (incl. word problems) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP022_0(a, b, v);
  const prompt = buildPrompt_OP022_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/hcf-lcm-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/hcf-lcm-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpHcfLcmMCQ(family, rng, variant) {
  const v = variant % 20;
  // HCF and LCM (incl. word problems) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP022_1(a, b, v);
  const prompt = buildPrompt_OP022_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/hcf-lcm-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/hcf-lcm-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpModelDrawing(family, rng, variant) {
  const v = variant % 20;
  // Model drawing (bar models) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP023_0(a, b, v);
  const prompt = buildPrompt_OP023_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/model-wrong-parts', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/model-wrong-parts', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpModelDrawingMCQ(family, rng, variant) {
  const v = variant % 20;
  // Model drawing (bar models) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP023_1(a, b, v);
  const prompt = buildPrompt_OP023_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/model-wrong-parts', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/model-wrong-parts', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpWordMultiStep(family, rng, variant) {
  const v = variant % 20;
  // Multi-step word problems — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP024_0(a, b, v);
  const prompt = buildPrompt_OP024_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/wrong-operation-choice', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/wrong-operation-choice', difficulty: family.difficulty, mode: 'practice' });
}
function opsOpWordMultiStepMCQ(family, rng, variant) {
  const v = variant % 20;
  // Multi-step word problems — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_OP024_1(a, b, v);
  const prompt = buildPrompt_OP024_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'op/wrong-operation-choice', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'op/wrong-operation-choice', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'opsOpAddFacts': opsOpAddFacts, 'opsOpAddFactsMCQ': opsOpAddFactsMCQ, 'opsOpAdd2digit': opsOpAdd2digit, 'opsOpAdd2digitMCQ': opsOpAdd2digitMCQ, 'opsOpAddRegroup': opsOpAddRegroup, 'opsOpAddRegroupMCQ': opsOpAddRegroupMCQ, 'opsOpAddLarge': opsOpAddLarge, 'opsOpAddLargeMCQ': opsOpAddLargeMCQ, 'opsOpSubFacts': opsOpSubFacts, 'opsOpSubFactsMCQ': opsOpSubFactsMCQ, 'opsOpSub2digit': opsOpSub2digit, 'opsOpSub2digitMCQ': opsOpSub2digitMCQ, 'opsOpSubRegroup': opsOpSubRegroup, 'opsOpSubRegroupMCQ': opsOpSubRegroupMCQ, 'opsOpSubLarge': opsOpSubLarge, 'opsOpSubLargeMCQ': opsOpSubLargeMCQ, 'opsOpMultFacts': opsOpMultFacts, 'opsOpMultFactsMCQ': opsOpMultFactsMCQ, 'opsOpMultBy10100': opsOpMultBy10100, 'opsOpMultBy10100MCQ': opsOpMultBy10100MCQ, 'opsOpMult2x1': opsOpMult2x1, 'opsOpMult2x1MCQ': opsOpMult2x1MCQ, 'opsOpMultLong': opsOpMultLong, 'opsOpMultLongMCQ': opsOpMultLongMCQ, 'opsOpDivFacts': opsOpDivFacts, 'opsOpDivFactsMCQ': opsOpDivFactsMCQ, 'opsOpDivShort': opsOpDivShort, 'opsOpDivShortMCQ': opsOpDivShortMCQ, 'opsOpDivRemainder': opsOpDivRemainder, 'opsOpDivRemainderMCQ': opsOpDivRemainderMCQ, 'opsOpDivLong': opsOpDivLong, 'opsOpDivLongMCQ': opsOpDivLongMCQ, 'opsOpMentalAddSub': opsOpMentalAddSub, 'opsOpMentalAddSubMCQ': opsOpMentalAddSubMCQ, 'opsOpMentalMultDiv': opsOpMentalMultDiv, 'opsOpMentalMultDivMCQ': opsOpMentalMultDivMCQ, 'opsOpOrderOfOps': opsOpOrderOfOps, 'opsOpOrderOfOpsMCQ': opsOpOrderOfOpsMCQ, 'opsOpOrderOfOpsBrackets': opsOpOrderOfOpsBrackets, 'opsOpOrderOfOpsBracketsMCQ': opsOpOrderOfOpsBracketsMCQ, 'opsOpFactorsMultiples': opsOpFactorsMultiples, 'opsOpFactorsMultiplesMCQ': opsOpFactorsMultiplesMCQ, 'opsOpHcfLcm': opsOpHcfLcm, 'opsOpHcfLcmMCQ': opsOpHcfLcmMCQ, 'opsOpModelDrawing': opsOpModelDrawing, 'opsOpModelDrawingMCQ': opsOpModelDrawingMCQ, 'opsOpWordMultiStep': opsOpWordMultiStep, 'opsOpWordMultiStepMCQ': opsOpWordMultiStepMCQ };

export function generateOperationsQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkOperationsAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateOperationsQuestionSet, checkOperationsAnswer };
