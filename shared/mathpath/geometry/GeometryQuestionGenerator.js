import { getSkill } from './GeometrySkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './GeometryQuestionFamilies.js';

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

function computeAnswer_GE001_0(a, b, v) { return a + b; }
function buildPrompt_GE001_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE001_1(a, b, v) { return a + b; }
function buildPrompt_GE001_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE002_0(a, b, v) { return a + b; }
function buildPrompt_GE002_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE002_1(a, b, v) { return a + b; }
function buildPrompt_GE002_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE003_0(a, b, v) { return a + b; }
function buildPrompt_GE003_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE003_1(a, b, v) { return a + b; }
function buildPrompt_GE003_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE004_0(a, b, v) { return a + b; }
function buildPrompt_GE004_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE004_1(a, b, v) { return a + b; }
function buildPrompt_GE004_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE005_0(a, b, v) { return a + b; }
function buildPrompt_GE005_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE005_1(a, b, v) { return a + b; }
function buildPrompt_GE005_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE006_0(a, b, v) { return a + b; }
function buildPrompt_GE006_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE006_1(a, b, v) { return a + b; }
function buildPrompt_GE006_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE007_0(a, b, v) { return a + b; }
function buildPrompt_GE007_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE007_1(a, b, v) { return a + b; }
function buildPrompt_GE007_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE008_0(a, b, v) { return a + b; }
function buildPrompt_GE008_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE008_1(a, b, v) { return a + b; }
function buildPrompt_GE008_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE009_0(a, b, v) { return a + b; }
function buildPrompt_GE009_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE009_1(a, b, v) { return a + b; }
function buildPrompt_GE009_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE010_0(a, b, v) { return a + b; }
function buildPrompt_GE010_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE010_1(a, b, v) { return a + b; }
function buildPrompt_GE010_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE011_0(a, b, v) { return a + b; }
function buildPrompt_GE011_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE011_1(a, b, v) { return a + b; }
function buildPrompt_GE011_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE012_0(a, b, v) { return a + b; }
function buildPrompt_GE012_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE012_1(a, b, v) { return a + b; }
function buildPrompt_GE012_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE013_0(a, b, v) { return a + b; }
function buildPrompt_GE013_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE013_1(a, b, v) { return a + b; }
function buildPrompt_GE013_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE014_0(a, b, v) { return a + b; }
function buildPrompt_GE014_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE014_1(a, b, v) { return a + b; }
function buildPrompt_GE014_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE015_0(a, b, v) { return a + b; }
function buildPrompt_GE015_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE015_1(a, b, v) { return a + b; }
function buildPrompt_GE015_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE016_0(a, b, v) { return a + b; }
function buildPrompt_GE016_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE016_1(a, b, v) { return a + b; }
function buildPrompt_GE016_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE017_0(a, b, v) { return a + b; }
function buildPrompt_GE017_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE017_1(a, b, v) { return a + b; }
function buildPrompt_GE017_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE018_0(a, b, v) { return a + b; }
function buildPrompt_GE018_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE018_1(a, b, v) { return a + b; }
function buildPrompt_GE018_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE019_0(a, b, v) { return a + b; }
function buildPrompt_GE019_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE019_1(a, b, v) { return a + b; }
function buildPrompt_GE019_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE020_0(a, b, v) { return a + b; }
function buildPrompt_GE020_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE020_1(a, b, v) { return a + b; }
function buildPrompt_GE020_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE021_0(a, b, v) { return a + b; }
function buildPrompt_GE021_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE021_1(a, b, v) { return a + b; }
function buildPrompt_GE021_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE022_0(a, b, v) { return a + b; }
function buildPrompt_GE022_0(a, b, v) { return `Compute: ${a} + ${b} = ?`; }
function computeAnswer_GE022_1(a, b, v) { return a + b; }
function buildPrompt_GE022_1(a, b, v) { return `Compute: ${a} + ${b} = ?`; }

function geoGeo2dShapes(family, rng, variant) {
  const v = variant % 20;
  // Identifying 2D shapes — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE001_0(a, b, v);
  const prompt = buildPrompt_GE001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/orientation-changes-shape', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/orientation-changes-shape', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeo2dShapesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Identifying 2D shapes — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE001_1(a, b, v);
  const prompt = buildPrompt_GE001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/orientation-changes-shape', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/orientation-changes-shape', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeo2dProperties(family, rng, variant) {
  const v = variant % 20;
  // Properties of 2D shapes (sides and vertices) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE002_0(a, b, v);
  const prompt = buildPrompt_GE002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/side-vertex-count', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/side-vertex-count', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeo2dPropertiesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Properties of 2D shapes (sides and vertices) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE002_1(a, b, v);
  const prompt = buildPrompt_GE002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/side-vertex-count', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/side-vertex-count', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoLines(family, rng, variant) {
  const v = variant % 20;
  // Parallel and perpendicular lines — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE003_0(a, b, v);
  const prompt = buildPrompt_GE003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/parallel-perp-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/parallel-perp-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoLinesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Parallel and perpendicular lines — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE003_1(a, b, v);
  const prompt = buildPrompt_GE003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/parallel-perp-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/parallel-perp-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleIntro(family, rng, variant) {
  const v = variant % 20;
  // Angle types (right, acute, obtuse) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE004_0(a, b, v);
  const prompt = buildPrompt_GE004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/angle-by-arm-length', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/angle-by-arm-length', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleIntroMCQ(family, rng, variant) {
  const v = variant % 20;
  // Angle types (right, acute, obtuse) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE004_1(a, b, v);
  const prompt = buildPrompt_GE004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/angle-by-arm-length', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/angle-by-arm-length', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleMeasure(family, rng, variant) {
  const v = variant % 20;
  // Measuring and drawing angles — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE005_0(a, b, v);
  const prompt = buildPrompt_GE005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/protractor-scale', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/protractor-scale', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleMeasureMCQ(family, rng, variant) {
  const v = variant % 20;
  // Measuring and drawing angles — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE005_1(a, b, v);
  const prompt = buildPrompt_GE005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/protractor-scale', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/protractor-scale', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleLinePoint(family, rng, variant) {
  const v = variant % 20;
  // Angles on a line and at a point — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE006_0(a, b, v);
  const prompt = buildPrompt_GE006_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/angle-relationship', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/angle-relationship', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleLinePointMCQ(family, rng, variant) {
  const v = variant % 20;
  // Angles on a line and at a point — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE006_1(a, b, v);
  const prompt = buildPrompt_GE006_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/angle-relationship', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/angle-relationship', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoTriangleTypes(family, rng, variant) {
  const v = variant % 20;
  // Types of triangles — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE007_0(a, b, v);
  const prompt = buildPrompt_GE007_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/triangle-by-look', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/triangle-by-look', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoTriangleTypesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Types of triangles — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE007_1(a, b, v);
  const prompt = buildPrompt_GE007_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/triangle-by-look', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/triangle-by-look', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoTriangleAngles(family, rng, variant) {
  const v = variant % 20;
  // Angle properties of triangles — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE008_0(a, b, v);
  const prompt = buildPrompt_GE008_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/angle-sum-wrong', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/angle-sum-wrong', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoTriangleAnglesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Angle properties of triangles — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE008_1(a, b, v);
  const prompt = buildPrompt_GE008_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/angle-sum-wrong', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/angle-sum-wrong', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoQuadTypes(family, rng, variant) {
  const v = variant % 20;
  // Types of quadrilaterals and their properties — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE009_0(a, b, v);
  const prompt = buildPrompt_GE009_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/square-not-rectangle', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/square-not-rectangle', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoQuadTypesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Types of quadrilaterals and their properties — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE009_1(a, b, v);
  const prompt = buildPrompt_GE009_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/square-not-rectangle', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/square-not-rectangle', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleQuad(family, rng, variant) {
  const v = variant % 20;
  // Angles in special quadrilaterals — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE010_0(a, b, v);
  const prompt = buildPrompt_GE010_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/quad-angle-relationship', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/quad-angle-relationship', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAngleQuadMCQ(family, rng, variant) {
  const v = variant % 20;
  // Angles in special quadrilaterals — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE010_1(a, b, v);
  const prompt = buildPrompt_GE010_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/quad-angle-relationship', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/quad-angle-relationship', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoSymmetry(family, rng, variant) {
  const v = variant % 20;
  // Line symmetry — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE011_0(a, b, v);
  const prompt = buildPrompt_GE011_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/diagonal-symmetry-miss', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/diagonal-symmetry-miss', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoSymmetryMCQ(family, rng, variant) {
  const v = variant % 20;
  // Line symmetry — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE011_1(a, b, v);
  const prompt = buildPrompt_GE011_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/diagonal-symmetry-miss', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/diagonal-symmetry-miss', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoSymmetryComplete(family, rng, variant) {
  const v = variant % 20;
  // Completing symmetric figures — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE012_0(a, b, v);
  const prompt = buildPrompt_GE012_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/reflect-not-translate', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/reflect-not-translate', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoSymmetryCompleteMCQ(family, rng, variant) {
  const v = variant % 20;
  // Completing symmetric figures — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE012_1(a, b, v);
  const prompt = buildPrompt_GE012_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/reflect-not-translate', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/reflect-not-translate', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeo3dShapes(family, rng, variant) {
  const v = variant % 20;
  // Identifying 3D solids (faces, edges, vertices) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE013_0(a, b, v);
  const prompt = buildPrompt_GE013_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/faces-edges-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/faces-edges-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeo3dShapesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Identifying 3D solids (faces, edges, vertices) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE013_1(a, b, v);
  const prompt = buildPrompt_GE013_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/faces-edges-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/faces-edges-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoNetsViews(family, rng, variant) {
  const v = variant % 20;
  // Nets and views of solids — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE014_0(a, b, v);
  const prompt = buildPrompt_GE014_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/net-folding', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/net-folding', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoNetsViewsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Nets and views of solids — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE014_1(a, b, v);
  const prompt = buildPrompt_GE014_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/net-folding', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/net-folding', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoPosition(family, rng, variant) {
  const v = variant % 20;
  // Position and compass directions — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE015_0(a, b, v);
  const prompt = buildPrompt_GE015_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/compass-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/compass-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoPositionMCQ(family, rng, variant) {
  const v = variant % 20;
  // Position and compass directions — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE015_1(a, b, v);
  const prompt = buildPrompt_GE015_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/compass-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/compass-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoConstruct(family, rng, variant) {
  const v = variant % 20;
  // Drawing and constructing figures — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE016_0(a, b, v);
  const prompt = buildPrompt_GE016_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/construction-precision', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/construction-precision', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoConstructMCQ(family, rng, variant) {
  const v = variant % 20;
  // Drawing and constructing figures — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE016_1(a, b, v);
  const prompt = buildPrompt_GE016_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/construction-precision', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/construction-precision', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoPerimeter(family, rng, variant) {
  const v = variant % 20;
  // Perimeter foundations (distance around) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE017_0(a, b, v);
  const prompt = buildPrompt_GE017_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/perimeter-vs-area', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/perimeter-vs-area', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoPerimeterMCQ(family, rng, variant) {
  const v = variant % 20;
  // Perimeter foundations (distance around) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE017_1(a, b, v);
  const prompt = buildPrompt_GE017_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/perimeter-vs-area', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/perimeter-vs-area', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAreaRect(family, rng, variant) {
  const v = variant % 20;
  // Area foundations (covering; rectangles) — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE018_0(a, b, v);
  const prompt = buildPrompt_GE018_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/area-add-sides', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/area-add-sides', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAreaRectMCQ(family, rng, variant) {
  const v = variant % 20;
  // Area foundations (covering; rectangles) — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE018_1(a, b, v);
  const prompt = buildPrompt_GE018_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/area-add-sides', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/area-add-sides', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAreaTriangle(family, rng, variant) {
  const v = variant % 20;
  // Area of triangles — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE019_0(a, b, v);
  const prompt = buildPrompt_GE019_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/triangle-no-half', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/triangle-no-half', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoAreaTriangleMCQ(family, rng, variant) {
  const v = variant % 20;
  // Area of triangles — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE019_1(a, b, v);
  const prompt = buildPrompt_GE019_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/triangle-no-half', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/triangle-no-half', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoCircle(family, rng, variant) {
  const v = variant % 20;
  // Circumference and area of a circle — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE020_0(a, b, v);
  const prompt = buildPrompt_GE020_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/radius-diameter-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/radius-diameter-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoCircleMCQ(family, rng, variant) {
  const v = variant % 20;
  // Circumference and area of a circle — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE020_1(a, b, v);
  const prompt = buildPrompt_GE020_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/radius-diameter-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/radius-diameter-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoCircleParts(family, rng, variant) {
  const v = variant % 20;
  // Perimeter and area of circle parts — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE021_0(a, b, v);
  const prompt = buildPrompt_GE021_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/forgot-straight-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/forgot-straight-edges', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoCirclePartsMCQ(family, rng, variant) {
  const v = variant % 20;
  // Perimeter and area of circle parts — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE021_1(a, b, v);
  const prompt = buildPrompt_GE021_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/forgot-straight-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/forgot-straight-edges', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoComposite(family, rng, variant) {
  const v = variant % 20;
  // Composite figures: area and perimeter — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE022_0(a, b, v);
  const prompt = buildPrompt_GE022_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/double-count-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/double-count-edges', difficulty: family.difficulty, mode: 'practice' });
}
function geoGeoCompositeMCQ(family, rng, variant) {
  const v = variant % 20;
  // Composite figures: area and perimeter — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_GE022_1(a, b, v);
  const prompt = buildPrompt_GE022_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'geo/double-count-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'geo/double-count-edges', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'geoGeo2dShapes': geoGeo2dShapes, 'geoGeo2dShapesMCQ': geoGeo2dShapesMCQ, 'geoGeo2dProperties': geoGeo2dProperties, 'geoGeo2dPropertiesMCQ': geoGeo2dPropertiesMCQ, 'geoGeoLines': geoGeoLines, 'geoGeoLinesMCQ': geoGeoLinesMCQ, 'geoGeoAngleIntro': geoGeoAngleIntro, 'geoGeoAngleIntroMCQ': geoGeoAngleIntroMCQ, 'geoGeoAngleMeasure': geoGeoAngleMeasure, 'geoGeoAngleMeasureMCQ': geoGeoAngleMeasureMCQ, 'geoGeoAngleLinePoint': geoGeoAngleLinePoint, 'geoGeoAngleLinePointMCQ': geoGeoAngleLinePointMCQ, 'geoGeoTriangleTypes': geoGeoTriangleTypes, 'geoGeoTriangleTypesMCQ': geoGeoTriangleTypesMCQ, 'geoGeoTriangleAngles': geoGeoTriangleAngles, 'geoGeoTriangleAnglesMCQ': geoGeoTriangleAnglesMCQ, 'geoGeoQuadTypes': geoGeoQuadTypes, 'geoGeoQuadTypesMCQ': geoGeoQuadTypesMCQ, 'geoGeoAngleQuad': geoGeoAngleQuad, 'geoGeoAngleQuadMCQ': geoGeoAngleQuadMCQ, 'geoGeoSymmetry': geoGeoSymmetry, 'geoGeoSymmetryMCQ': geoGeoSymmetryMCQ, 'geoGeoSymmetryComplete': geoGeoSymmetryComplete, 'geoGeoSymmetryCompleteMCQ': geoGeoSymmetryCompleteMCQ, 'geoGeo3dShapes': geoGeo3dShapes, 'geoGeo3dShapesMCQ': geoGeo3dShapesMCQ, 'geoGeoNetsViews': geoGeoNetsViews, 'geoGeoNetsViewsMCQ': geoGeoNetsViewsMCQ, 'geoGeoPosition': geoGeoPosition, 'geoGeoPositionMCQ': geoGeoPositionMCQ, 'geoGeoConstruct': geoGeoConstruct, 'geoGeoConstructMCQ': geoGeoConstructMCQ, 'geoGeoPerimeter': geoGeoPerimeter, 'geoGeoPerimeterMCQ': geoGeoPerimeterMCQ, 'geoGeoAreaRect': geoGeoAreaRect, 'geoGeoAreaRectMCQ': geoGeoAreaRectMCQ, 'geoGeoAreaTriangle': geoGeoAreaTriangle, 'geoGeoAreaTriangleMCQ': geoGeoAreaTriangleMCQ, 'geoGeoCircle': geoGeoCircle, 'geoGeoCircleMCQ': geoGeoCircleMCQ, 'geoGeoCircleParts': geoGeoCircleParts, 'geoGeoCirclePartsMCQ': geoGeoCirclePartsMCQ, 'geoGeoComposite': geoGeoComposite, 'geoGeoCompositeMCQ': geoGeoCompositeMCQ };

export function generateGeometryQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkGeometryAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateGeometryQuestionSet, checkGeometryAnswer };
