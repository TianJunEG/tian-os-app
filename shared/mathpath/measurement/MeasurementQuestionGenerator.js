import { getSkill } from './MeasurementSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './MeasurementQuestionFamilies.js';

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

function computeAnswer_ME001_0(a, b, v) { return a + b; }
function buildPrompt_ME001_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME001_1(a, b, v) { return a + b; }
function buildPrompt_ME001_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME002_0(a, b, v) { return a + b; }
function buildPrompt_ME002_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME002_1(a, b, v) { return a + b; }
function buildPrompt_ME002_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME003_0(a, b, v) { return a + b; }
function buildPrompt_ME003_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME003_1(a, b, v) { return a + b; }
function buildPrompt_ME003_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME004_0(a, b, v) { return a + b; }
function buildPrompt_ME004_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME004_1(a, b, v) { return a + b; }
function buildPrompt_ME004_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME005_0(a, b, v) { return a + b; }
function buildPrompt_ME005_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME005_1(a, b, v) { return a + b; }
function buildPrompt_ME005_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME006_0(a, b, v) { return a + b; }
function buildPrompt_ME006_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME006_1(a, b, v) { return a + b; }
function buildPrompt_ME006_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME007_0(a, b, v) { return a + b; }
function buildPrompt_ME007_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME007_1(a, b, v) { return a + b; }
function buildPrompt_ME007_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME008_0(a, b, v) { return a + b; }
function buildPrompt_ME008_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME008_1(a, b, v) { return a + b; }
function buildPrompt_ME008_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME009_0(a, b, v) { return a + b; }
function buildPrompt_ME009_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME009_1(a, b, v) { return a + b; }
function buildPrompt_ME009_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME010_0(a, b, v) { return a + b; }
function buildPrompt_ME010_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME010_1(a, b, v) { return a + b; }
function buildPrompt_ME010_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME011_0(a, b, v) { return a + b; }
function buildPrompt_ME011_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME011_1(a, b, v) { return a + b; }
function buildPrompt_ME011_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME012_0(a, b, v) { return a + b; }
function buildPrompt_ME012_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME012_1(a, b, v) { return a + b; }
function buildPrompt_ME012_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME013_0(a, b, v) { return a + b; }
function buildPrompt_ME013_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME013_1(a, b, v) { return a + b; }
function buildPrompt_ME013_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME014_0(a, b, v) { return a + b; }
function buildPrompt_ME014_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_ME014_1(a, b, v) { return a + b; }
function buildPrompt_ME014_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }

function meaMeaLength(family, rng, variant) {
  const v = variant % 20;
  // Length and its units (cm, m, km) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME001_0(a, b, v);
  const prompt = buildPrompt_ME001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaLengthMCQ(family, rng, variant) {
  const v = variant % 20;
  // Length and its units (cm, m, km) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME001_1(a, b, v);
  const prompt = buildPrompt_ME001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaMass(family, rng, variant) {
  const v = variant % 20;
  // Mass and its units (g, kg) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME002_0(a, b, v);
  const prompt = buildPrompt_ME002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaMassMCQ(family, rng, variant) {
  const v = variant % 20;
  // Mass and its units (g, kg) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME002_1(a, b, v);
  const prompt = buildPrompt_ME002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/wrong-unit', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaVolumeCapacity(family, rng, variant) {
  const v = variant % 20;
  // Volume and capacity (ml, L) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME003_0(a, b, v);
  const prompt = buildPrompt_ME003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/capacity-volume-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/capacity-volume-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaVolumeCapacityMCQ(family, rng, variant) {
  const v = variant % 20;
  // Volume and capacity (ml, L) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME003_1(a, b, v);
  const prompt = buildPrompt_ME003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/capacity-volume-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/capacity-volume-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaReadScales(family, rng, variant) {
  const v = variant % 20;
  // Reading measuring scales — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME004_0(a, b, v);
  const prompt = buildPrompt_ME004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/scale-interval', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/scale-interval', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaReadScalesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Reading measuring scales — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME004_1(a, b, v);
  const prompt = buildPrompt_ME004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/scale-interval', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/scale-interval', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaTimeTell(family, rng, variant) {
  const v = variant % 20;
  // Telling time and the 24-hour clock — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME005_0(a, b, v);
  const prompt = buildPrompt_ME005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaTimeTellMCQ(family, rng, variant) {
  const v = variant % 20;
  // Telling time and the 24-hour clock — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME005_1(a, b, v);
  const prompt = buildPrompt_ME005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/24hr-convert', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaTimeDuration(family, rng, variant) {
  const v = variant % 20;
  // Duration and time intervals — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME006_0(a, b, v);
  const prompt = buildPrompt_ME006_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaTimeDurationMCQ(family, rng, variant) {
  const v = variant % 20;
  // Duration and time intervals — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME006_1(a, b, v);
  const prompt = buildPrompt_ME006_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaUnitConvert(family, rng, variant) {
  const v = variant % 20;
  // Unit conversions (length, mass, volume) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME007_0(a, b, v);
  const prompt = buildPrompt_ME007_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/convert-direction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/convert-direction', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaUnitConvertMCQ(family, rng, variant) {
  const v = variant % 20;
  // Unit conversions (length, mass, volume) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME007_1(a, b, v);
  const prompt = buildPrompt_ME007_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/convert-direction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/convert-direction', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaCompareMeasures(family, rng, variant) {
  const v = variant % 20;
  // Comparing and converting measurements — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME008_0(a, b, v);
  const prompt = buildPrompt_ME008_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/compare-mixed-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/compare-mixed-units', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaCompareMeasuresMCQ(family, rng, variant) {
  const v = variant % 20;
  // Comparing and converting measurements — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME008_1(a, b, v);
  const prompt = buildPrompt_ME008_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/compare-mixed-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/compare-mixed-units', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaPerimeterApply(family, rng, variant) {
  const v = variant % 20;
  // Perimeter in measurement contexts — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME009_0(a, b, v);
  const prompt = buildPrompt_ME009_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/perimeter-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/perimeter-units', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaPerimeterApplyMCQ(family, rng, variant) {
  const v = variant % 20;
  // Perimeter in measurement contexts — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME009_1(a, b, v);
  const prompt = buildPrompt_ME009_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/perimeter-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/perimeter-units', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaAreaApply(family, rng, variant) {
  const v = variant % 20;
  // Area in measurement contexts — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME010_0(a, b, v);
  const prompt = buildPrompt_ME010_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaAreaApplyMCQ(family, rng, variant) {
  const v = variant % 20;
  // Area in measurement contexts — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME010_1(a, b, v);
  const prompt = buildPrompt_ME010_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaVolumeCuboid(family, rng, variant) {
  const v = variant % 20;
  // Volume of cubes and cuboids — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME011_0(a, b, v);
  const prompt = buildPrompt_ME011_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaVolumeCuboidMCQ(family, rng, variant) {
  const v = variant % 20;
  // Volume of cubes and cuboids — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME011_1(a, b, v);
  const prompt = buildPrompt_ME011_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaNetsVolume(family, rng, variant) {
  const v = variant % 20;
  // Nets and volume of cuboids — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME012_0(a, b, v);
  const prompt = buildPrompt_ME012_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaNetsVolumeMCQ(family, rng, variant) {
  const v = variant % 20;
  // Nets and volume of cuboids — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME012_1(a, b, v);
  const prompt = buildPrompt_ME012_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaVolumeRate(family, rng, variant) {
  const v = variant % 20;
  // Volume, water level and rate — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME013_0(a, b, v);
  const prompt = buildPrompt_ME013_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaVolumeRateMCQ(family, rng, variant) {
  const v = variant % 20;
  // Volume, water level and rate — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME013_1(a, b, v);
  const prompt = buildPrompt_ME013_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaMoney(family, rng, variant) {
  const v = variant % 20;
  // Money word problems and reasoning — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME014_0(a, b, v);
  const prompt = buildPrompt_ME014_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/money-decimal-place', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/money-decimal-place', difficulty: family.difficulty, mode: 'practice' });
}
function meaMeaMoneyMCQ(family, rng, variant) {
  const v = variant % 20;
  // Money word problems and reasoning — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ME014_1(a, b, v);
  const prompt = buildPrompt_ME014_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/money-decimal-place', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/money-decimal-place', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'meaMeaLength': meaMeaLength, 'meaMeaLengthMCQ': meaMeaLengthMCQ, 'meaMeaMass': meaMeaMass, 'meaMeaMassMCQ': meaMeaMassMCQ, 'meaMeaVolumeCapacity': meaMeaVolumeCapacity, 'meaMeaVolumeCapacityMCQ': meaMeaVolumeCapacityMCQ, 'meaMeaReadScales': meaMeaReadScales, 'meaMeaReadScalesMCQ': meaMeaReadScalesMCQ, 'meaMeaTimeTell': meaMeaTimeTell, 'meaMeaTimeTellMCQ': meaMeaTimeTellMCQ, 'meaMeaTimeDuration': meaMeaTimeDuration, 'meaMeaTimeDurationMCQ': meaMeaTimeDurationMCQ, 'meaMeaUnitConvert': meaMeaUnitConvert, 'meaMeaUnitConvertMCQ': meaMeaUnitConvertMCQ, 'meaMeaCompareMeasures': meaMeaCompareMeasures, 'meaMeaCompareMeasuresMCQ': meaMeaCompareMeasuresMCQ, 'meaMeaPerimeterApply': meaMeaPerimeterApply, 'meaMeaPerimeterApplyMCQ': meaMeaPerimeterApplyMCQ, 'meaMeaAreaApply': meaMeaAreaApply, 'meaMeaAreaApplyMCQ': meaMeaAreaApplyMCQ, 'meaMeaVolumeCuboid': meaMeaVolumeCuboid, 'meaMeaVolumeCuboidMCQ': meaMeaVolumeCuboidMCQ, 'meaMeaNetsVolume': meaMeaNetsVolume, 'meaMeaNetsVolumeMCQ': meaMeaNetsVolumeMCQ, 'meaMeaVolumeRate': meaMeaVolumeRate, 'meaMeaVolumeRateMCQ': meaMeaVolumeRateMCQ, 'meaMeaMoney': meaMeaMoney, 'meaMeaMoneyMCQ': meaMeaMoneyMCQ };

export function generateMeasurementQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkMeasurementAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateMeasurementQuestionSet, checkMeasurementAnswer };
