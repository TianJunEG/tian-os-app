import { getSkill } from './VolumeSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './VolumeQuestionFamilies.js';

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

function computeAnswer_VL001_0(a, b, v) { return a * b * 2; }
function buildPrompt_VL001_0(a, b, v) { return `A rectangular arrangement of unit cubes is ${a} long, ${b} wide and 2 high. How many unit cubes are there?`; }
function computeAnswer_VL001_1(a, b, v) { return a * b * 3; }
function buildPrompt_VL001_1(a, b, v) { return `A solid is ${a} cm long, ${b} cm wide and 3 cm high. How many 1-cm cubes fit inside it?`; }
function computeAnswer_VL002_0(a, b, v) { return a * b * 3; }
function buildPrompt_VL002_0(a, b, v) { return `Find the volume of a cuboid with length ${a} cm, width ${b} cm and height 3 cm.`; }
function computeAnswer_VL002_1(a, b, v) { return a * b * 4; }
function buildPrompt_VL002_1(a, b, v) { return `A box is ${a} cm long, ${b} cm wide and 4 cm tall. What is its volume?`; }
function computeAnswer_VL003_0(a, b, v) { return a * b * 2; }
function buildPrompt_VL003_0(a, b, v) { return `A net folds to make a cuboid ${a} cm × ${b} cm × 2 cm. What is the volume?`; }
function computeAnswer_VL003_1(a, b, v) { return a * a * b; }
function buildPrompt_VL003_1(a, b, v) { return `A cube has side ${a} cm. What is its volume? Then if height doubles to ${b} cm, what would volume be?`; }
function computeAnswer_VL004_0(a, b, v) { return a * b * 3; }
function buildPrompt_VL004_0(a, b, v) { return `A tank is ${a} cm × ${b} cm × 3 cm. Water fills it at 1 cm³ per second. How many seconds to fill it?`; }
function computeAnswer_VL004_1(a, b, v) { return a * 60; }
function buildPrompt_VL004_1(a, b, v) { return `Water flows into a tank at ${a} litres per minute. How many litres flow in after 60 minutes?`; }

function volUnitCubes(family, rng, variant) {
  const v = variant % 20;
  // Counting unit cubes to find volume — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL001_0(a, b, v);
  const prompt = buildPrompt_VL001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'vol/hidden-cubes', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'vol/hidden-cubes', difficulty: family.difficulty, mode: 'practice' });
}
function volUnitCubesMCQ(family, rng, variant) {
  const v = variant % 20;
  // Counting unit cubes to find volume — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL001_1(a, b, v);
  const prompt = buildPrompt_VL001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'vol/hidden-cubes', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'vol/hidden-cubes', difficulty: family.difficulty, mode: 'practice' });
}
function volCuboid(family, rng, variant) {
  const v = variant % 20;
  // Volume of cubes and cuboids — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL002_0(a, b, v);
  const prompt = buildPrompt_VL002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice' });
}
function volCuboidWord(family, rng, variant) {
  const v = variant % 20;
  // Volume of cubes and cuboids — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL002_1(a, b, v);
  const prompt = buildPrompt_VL002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/volume-add-edges', difficulty: family.difficulty, mode: 'practice' });
}
function volNets(family, rng, variant) {
  const v = variant % 20;
  // Nets and volume of cuboids — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL003_0(a, b, v);
  const prompt = buildPrompt_VL003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice' });
}
function volNetsWord(family, rng, variant) {
  const v = variant % 20;
  // Nets and volume of cuboids — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL003_1(a, b, v);
  const prompt = buildPrompt_VL003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/net-dimensions', difficulty: family.difficulty, mode: 'practice' });
}
function volWaterRate(family, rng, variant) {
  const v = variant % 20;
  // Volume, water level and flow rate — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL004_0(a, b, v);
  const prompt = buildPrompt_VL004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function volWaterRateWord(family, rng, variant) {
  const v = variant % 20;
  // Volume, water level and flow rate — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_VL004_1(a, b, v);
  const prompt = buildPrompt_VL004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/rate-volume-confuse', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'volUnitCubes': volUnitCubes, 'volUnitCubesMCQ': volUnitCubesMCQ, 'volCuboid': volCuboid, 'volCuboidWord': volCuboidWord, 'volNets': volNets, 'volNetsWord': volNetsWord, 'volWaterRate': volWaterRate, 'volWaterRateWord': volWaterRateWord };

export function generateVolumeQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkVolumeAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateVolumeQuestionSet, checkVolumeAnswer };
