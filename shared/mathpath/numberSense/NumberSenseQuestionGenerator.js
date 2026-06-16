import { getSkill } from './NumberSenseSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './NumberSenseQuestionFamilies.js';

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

function computeAnswer_NS001_0(a, b, v) { return a + b; }
function buildPrompt_NS001_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS001_1(a, b, v) { return a + b; }
function buildPrompt_NS001_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS002_0(a, b, v) { return a + b; }
function buildPrompt_NS002_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS002_1(a, b, v) { return a + b; }
function buildPrompt_NS002_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS003_0(a, b, v) { return a + b; }
function buildPrompt_NS003_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS003_1(a, b, v) { return a + b; }
function buildPrompt_NS003_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS004_0(a, b, v) { return a + b; }
function buildPrompt_NS004_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS004_1(a, b, v) { return a + b; }
function buildPrompt_NS004_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS005_0(a, b, v) { return a + b; }
function buildPrompt_NS005_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS005_1(a, b, v) { return a + b; }
function buildPrompt_NS005_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS006_0(a, b, v) { return a + b; }
function buildPrompt_NS006_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS006_1(a, b, v) { return a + b; }
function buildPrompt_NS006_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS007_0(a, b, v) { return a + b; }
function buildPrompt_NS007_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS007_1(a, b, v) { return a + b; }
function buildPrompt_NS007_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS008_0(a, b, v) { return a + b; }
function buildPrompt_NS008_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS008_1(a, b, v) { return a + b; }
function buildPrompt_NS008_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS009_0(a, b, v) { return a + b; }
function buildPrompt_NS009_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS009_1(a, b, v) { return a + b; }
function buildPrompt_NS009_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS010_0(a, b, v) { return a + b; }
function buildPrompt_NS010_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS010_1(a, b, v) { return a + b; }
function buildPrompt_NS010_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS011_0(a, b, v) { return a + b; }
function buildPrompt_NS011_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS011_1(a, b, v) { return a + b; }
function buildPrompt_NS011_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS012_0(a, b, v) { return a + b; }
function buildPrompt_NS012_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS012_1(a, b, v) { return a + b; }
function buildPrompt_NS012_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS013_0(a, b, v) { return a + b; }
function buildPrompt_NS013_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS013_1(a, b, v) { return a + b; }
function buildPrompt_NS013_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS014_0(a, b, v) { return a + b; }
function buildPrompt_NS014_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS014_1(a, b, v) { return a + b; }
function buildPrompt_NS014_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS015_0(a, b, v) { return a + b; }
function buildPrompt_NS015_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS015_1(a, b, v) { return a + b; }
function buildPrompt_NS015_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS016_0(a, b, v) { return a + b; }
function buildPrompt_NS016_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS016_1(a, b, v) { return a + b; }
function buildPrompt_NS016_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS017_0(a, b, v) { return a + b; }
function buildPrompt_NS017_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS017_1(a, b, v) { return a + b; }
function buildPrompt_NS017_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS018_0(a, b, v) { return a + b; }
function buildPrompt_NS018_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS018_1(a, b, v) { return a + b; }
function buildPrompt_NS018_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS019_0(a, b, v) { return a + b; }
function buildPrompt_NS019_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS019_1(a, b, v) { return a + b; }
function buildPrompt_NS019_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS020_0(a, b, v) { return a + b; }
function buildPrompt_NS020_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS020_1(a, b, v) { return a + b; }
function buildPrompt_NS020_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS021_0(a, b, v) { return a + b; }
function buildPrompt_NS021_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS021_1(a, b, v) { return a + b; }
function buildPrompt_NS021_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS022_0(a, b, v) { return a + b; }
function buildPrompt_NS022_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS022_1(a, b, v) { return a + b; }
function buildPrompt_NS022_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS023_0(a, b, v) { return a + b; }
function buildPrompt_NS023_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_NS023_1(a, b, v) { return a + b; }
function buildPrompt_NS023_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }

function nsNsCountTo20(family, rng, variant) {
  const v = variant % 20;
  // Counting to 20 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS001_0(a, b, v);
  const prompt = buildPrompt_NS001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/teen-ty', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/teen-ty', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCountTo20MCQ(family, rng, variant) {
  const v = variant % 20;
  // Counting to 20 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS001_1(a, b, v);
  const prompt = buildPrompt_NS001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/teen-ty', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/teen-ty', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCountTo100(family, rng, variant) {
  const v = variant % 20;
  // Counting to 100 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS002_0(a, b, v);
  const prompt = buildPrompt_NS002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/decade-boundary', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/decade-boundary', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCountTo100MCQ(family, rng, variant) {
  const v = variant % 20;
  // Counting to 100 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS002_1(a, b, v);
  const prompt = buildPrompt_NS002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/decade-boundary', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/decade-boundary', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCountSkip(family, rng, variant) {
  const v = variant % 20;
  // Skip counting (2s, 5s, 10s) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS003_0(a, b, v);
  const prompt = buildPrompt_NS003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/lose-step', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/lose-step', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCountSkipMCQ(family, rng, variant) {
  const v = variant % 20;
  // Skip counting (2s, 5s, 10s) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS003_1(a, b, v);
  const prompt = buildPrompt_NS003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/lose-step', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/lose-step', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCountTo1000(family, rng, variant) {
  const v = variant % 20;
  // Counting to 1000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS004_0(a, b, v);
  const prompt = buildPrompt_NS004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/hundred-boundary', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/hundred-boundary', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCountTo1000MCQ(family, rng, variant) {
  const v = variant % 20;
  // Counting to 1000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS004_1(a, b, v);
  const prompt = buildPrompt_NS004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'count/hundred-boundary', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'count/hundred-boundary', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPvTensOnes(family, rng, variant) {
  const v = variant % 20;
  // Place value: tens and ones — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS005_0(a, b, v);
  const prompt = buildPrompt_NS005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/digit-vs-value', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/digit-vs-value', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPvTensOnesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Place value: tens and ones — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS005_1(a, b, v);
  const prompt = buildPrompt_NS005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/digit-vs-value', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/digit-vs-value', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPv3Digit(family, rng, variant) {
  const v = variant % 20;
  // Place value to 1000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS006_0(a, b, v);
  const prompt = buildPrompt_NS006_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/zero-placeholder', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/zero-placeholder', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPv3DigitMCQ(family, rng, variant) {
  const v = variant % 20;
  // Place value to 1000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS006_1(a, b, v);
  const prompt = buildPrompt_NS006_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/zero-placeholder', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/zero-placeholder', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPv45Digit(family, rng, variant) {
  const v = variant % 20;
  // Place value to 100 000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS007_0(a, b, v);
  const prompt = buildPrompt_NS007_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/grouping', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/grouping', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPv45DigitMCQ(family, rng, variant) {
  const v = variant % 20;
  // Place value to 100 000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS007_1(a, b, v);
  const prompt = buildPrompt_NS007_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/grouping', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/grouping', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPv6Digit(family, rng, variant) {
  const v = variant % 20;
  // Place value to 1 000 000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS008_0(a, b, v);
  const prompt = buildPrompt_NS008_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/place-name', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/place-name', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPv6DigitMCQ(family, rng, variant) {
  const v = variant % 20;
  // Place value to 1 000 000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS008_1(a, b, v);
  const prompt = buildPrompt_NS008_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pv/place-name', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pv/place-name', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCompareTo100(family, rng, variant) {
  const v = variant % 20;
  // Comparing numbers to 100 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS009_0(a, b, v);
  const prompt = buildPrompt_NS009_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'compare/leading-digit', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'compare/leading-digit', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCompareTo100MCQ(family, rng, variant) {
  const v = variant % 20;
  // Comparing numbers to 100 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS009_1(a, b, v);
  const prompt = buildPrompt_NS009_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'compare/leading-digit', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'compare/leading-digit', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCompareLarge(family, rng, variant) {
  const v = variant % 20;
  // Comparing numbers to 100 000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS010_0(a, b, v);
  const prompt = buildPrompt_NS010_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'compare/length-not-value', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'compare/length-not-value', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsCompareLargeMCQ(family, rng, variant) {
  const v = variant % 20;
  // Comparing numbers to 100 000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS010_1(a, b, v);
  const prompt = buildPrompt_NS010_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'compare/length-not-value', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'compare/length-not-value', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsOrderTo100(family, rng, variant) {
  const v = variant % 20;
  // Ordering numbers to 100 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS011_0(a, b, v);
  const prompt = buildPrompt_NS011_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/local-not-global', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/local-not-global', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsOrderTo100MCQ(family, rng, variant) {
  const v = variant % 20;
  // Ordering numbers to 100 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS011_1(a, b, v);
  const prompt = buildPrompt_NS011_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/local-not-global', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/local-not-global', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsOrderLarge(family, rng, variant) {
  const v = variant % 20;
  // Ordering numbers to 100 000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS012_0(a, b, v);
  const prompt = buildPrompt_NS012_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/by-length', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/by-length', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsOrderLargeMCQ(family, rng, variant) {
  const v = variant % 20;
  // Ordering numbers to 100 000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS012_1(a, b, v);
  const prompt = buildPrompt_NS012_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'order/by-length', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'order/by-length', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPatternSkip(family, rng, variant) {
  const v = variant % 20;
  // Number patterns: skip-count sequences — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS013_0(a, b, v);
  const prompt = buildPrompt_NS013_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pattern/step-drift', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pattern/step-drift', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPatternSkipMCQ(family, rng, variant) {
  const v = variant % 20;
  // Number patterns: skip-count sequences — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS013_1(a, b, v);
  const prompt = buildPrompt_NS013_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pattern/step-drift', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pattern/step-drift', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPatternArithmetic(family, rng, variant) {
  const v = variant % 20;
  // Number patterns: constant difference — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS014_0(a, b, v);
  const prompt = buildPrompt_NS014_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pattern/op-confusion', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pattern/op-confusion', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPatternArithmeticMCQ(family, rng, variant) {
  const v = variant % 20;
  // Number patterns: constant difference — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS014_1(a, b, v);
  const prompt = buildPrompt_NS014_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pattern/op-confusion', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pattern/op-confusion', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPatternComplex(family, rng, variant) {
  const v = variant % 20;
  // Number patterns: position rules — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS015_0(a, b, v);
  const prompt = buildPrompt_NS015_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pattern/assume-linear', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pattern/assume-linear', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsPatternComplexMCQ(family, rng, variant) {
  const v = variant % 20;
  // Number patterns: position rules — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS015_1(a, b, v);
  const prompt = buildPrompt_NS015_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'pattern/assume-linear', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'pattern/assume-linear', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsRound10100(family, rng, variant) {
  const v = variant % 20;
  // Rounding to the nearest 10 and 100 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS016_0(a, b, v);
  const prompt = buildPrompt_NS016_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'round/always-up', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'round/always-up', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsRound10100MCQ(family, rng, variant) {
  const v = variant % 20;
  // Rounding to the nearest 10 and 100 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS016_1(a, b, v);
  const prompt = buildPrompt_NS016_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'round/always-up', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'round/always-up', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsRound1000(family, rng, variant) {
  const v = variant % 20;
  // Rounding to the nearest 1000 — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS017_0(a, b, v);
  const prompt = buildPrompt_NS017_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'round/no-cascade', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'round/no-cascade', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsRound1000MCQ(family, rng, variant) {
  const v = variant % 20;
  // Rounding to the nearest 1000 — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS017_1(a, b, v);
  const prompt = buildPrompt_NS017_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'round/no-cascade', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'round/no-cascade', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsEstimateSums(family, rng, variant) {
  const v = variant % 20;
  // Estimating sums and differences — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS018_0(a, b, v);
  const prompt = buildPrompt_NS018_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'estimate/exact-not-estimate', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'estimate/exact-not-estimate', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsEstimateSumsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Estimating sums and differences — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS018_1(a, b, v);
  const prompt = buildPrompt_NS018_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'estimate/exact-not-estimate', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'estimate/exact-not-estimate', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsEstimateProducts(family, rng, variant) {
  const v = variant % 20;
  // Estimating products and quotients — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS019_0(a, b, v);
  const prompt = buildPrompt_NS019_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'estimate/round-one', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'estimate/round-one', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsEstimateProductsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Estimating products and quotients — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS019_1(a, b, v);
  const prompt = buildPrompt_NS019_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'estimate/round-one', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'estimate/round-one', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsEstimateCheck(family, rng, variant) {
  const v = variant % 20;
  // Estimation to check reasonableness — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS020_0(a, b, v);
  const prompt = buildPrompt_NS020_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'estimate/ignore-check', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'estimate/ignore-check', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsEstimateCheckMCQ(family, rng, variant) {
  const v = variant % 20;
  // Estimation to check reasonableness — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS020_1(a, b, v);
  const prompt = buildPrompt_NS020_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'estimate/ignore-check', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'estimate/ignore-check', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsNegIntro(family, rng, variant) {
  const v = variant % 20;
  // Negative numbers on a number line — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS021_0(a, b, v);
  const prompt = buildPrompt_NS021_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'neg/magnitude-order', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'neg/magnitude-order', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsNegIntroMCQ(family, rng, variant) {
  const v = variant % 20;
  // Negative numbers on a number line — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS021_1(a, b, v);
  const prompt = buildPrompt_NS021_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'neg/magnitude-order', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'neg/magnitude-order', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsNegCompareOrder(family, rng, variant) {
  const v = variant % 20;
  // Comparing and ordering integers — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS022_0(a, b, v);
  const prompt = buildPrompt_NS022_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'neg/order-like-positive', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'neg/order-like-positive', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsNegCompareOrderMCQ(family, rng, variant) {
  const v = variant % 20;
  // Comparing and ordering integers — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS022_1(a, b, v);
  const prompt = buildPrompt_NS022_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'neg/order-like-positive', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'neg/order-like-positive', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsNegContext(family, rng, variant) {
  const v = variant % 20;
  // Negative numbers in context (temperature, levels) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS023_0(a, b, v);
  const prompt = buildPrompt_NS023_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'neg/direction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'neg/direction', difficulty: family.difficulty, mode: 'practice' });
}
function nsNsNegContextMCQ(family, rng, variant) {
  const v = variant % 20;
  // Negative numbers in context (temperature, levels) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_NS023_1(a, b, v);
  const prompt = buildPrompt_NS023_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'neg/direction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'neg/direction', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'nsNsCountTo20': nsNsCountTo20, 'nsNsCountTo20MCQ': nsNsCountTo20MCQ, 'nsNsCountTo100': nsNsCountTo100, 'nsNsCountTo100MCQ': nsNsCountTo100MCQ, 'nsNsCountSkip': nsNsCountSkip, 'nsNsCountSkipMCQ': nsNsCountSkipMCQ, 'nsNsCountTo1000': nsNsCountTo1000, 'nsNsCountTo1000MCQ': nsNsCountTo1000MCQ, 'nsNsPvTensOnes': nsNsPvTensOnes, 'nsNsPvTensOnesMCQ': nsNsPvTensOnesMCQ, 'nsNsPv3Digit': nsNsPv3Digit, 'nsNsPv3DigitMCQ': nsNsPv3DigitMCQ, 'nsNsPv45Digit': nsNsPv45Digit, 'nsNsPv45DigitMCQ': nsNsPv45DigitMCQ, 'nsNsPv6Digit': nsNsPv6Digit, 'nsNsPv6DigitMCQ': nsNsPv6DigitMCQ, 'nsNsCompareTo100': nsNsCompareTo100, 'nsNsCompareTo100MCQ': nsNsCompareTo100MCQ, 'nsNsCompareLarge': nsNsCompareLarge, 'nsNsCompareLargeMCQ': nsNsCompareLargeMCQ, 'nsNsOrderTo100': nsNsOrderTo100, 'nsNsOrderTo100MCQ': nsNsOrderTo100MCQ, 'nsNsOrderLarge': nsNsOrderLarge, 'nsNsOrderLargeMCQ': nsNsOrderLargeMCQ, 'nsNsPatternSkip': nsNsPatternSkip, 'nsNsPatternSkipMCQ': nsNsPatternSkipMCQ, 'nsNsPatternArithmetic': nsNsPatternArithmetic, 'nsNsPatternArithmeticMCQ': nsNsPatternArithmeticMCQ, 'nsNsPatternComplex': nsNsPatternComplex, 'nsNsPatternComplexMCQ': nsNsPatternComplexMCQ, 'nsNsRound10100': nsNsRound10100, 'nsNsRound10100MCQ': nsNsRound10100MCQ, 'nsNsRound1000': nsNsRound1000, 'nsNsRound1000MCQ': nsNsRound1000MCQ, 'nsNsEstimateSums': nsNsEstimateSums, 'nsNsEstimateSumsMCQ': nsNsEstimateSumsMCQ, 'nsNsEstimateProducts': nsNsEstimateProducts, 'nsNsEstimateProductsMCQ': nsNsEstimateProductsMCQ, 'nsNsEstimateCheck': nsNsEstimateCheck, 'nsNsEstimateCheckMCQ': nsNsEstimateCheckMCQ, 'nsNsNegIntro': nsNsNegIntro, 'nsNsNegIntroMCQ': nsNsNegIntroMCQ, 'nsNsNegCompareOrder': nsNsNegCompareOrder, 'nsNsNegCompareOrderMCQ': nsNsNegCompareOrderMCQ, 'nsNsNegContext': nsNsNegContext, 'nsNsNegContextMCQ': nsNsNegContextMCQ };

export function generateNumberSenseQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkNumberSenseAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateNumberSenseQuestionSet, checkNumberSenseAnswer };
