import { getSkill } from './AreaPerimeterSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './AreaPerimeterQuestionFamilies.js';

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

function computeAnswer_AP001_0(a, b, v) { return 2 * (a + b); }
function buildPrompt_AP001_0(a, b, v) { return `Find the perimeter of a rectangle with length ${a} cm and width ${b} cm.`; }
function computeAnswer_AP001_1(a, b, v) { return 4 * a; }
function buildPrompt_AP001_1(a, b, v) { return `Find the perimeter of a square with side ${a} cm.`; }
function computeAnswer_AP002_0(a, b, v) { return 2 * a + 3 * b; }
function buildPrompt_AP002_0(a, b, v) { return `An L-shaped figure has sides measuring ${a}, ${b}, ${a}, ${b}, ${b}, ${a} cm. Find the perimeter.`; }
function computeAnswer_AP002_1(a, b, v) { return a * 4 + b * 2; }
function buildPrompt_AP002_1(a, b, v) { return `A composite shape has 4 sides of ${a} cm and 2 sides of ${b} cm. Find the perimeter.`; }
function computeAnswer_AP003_0(a, b, v) { return a * b; }
function buildPrompt_AP003_0(a, b, v) { return `Find the area of a rectangle with length ${a} cm and width ${b} cm.`; }
function computeAnswer_AP003_1(a, b, v) { return a * a; }
function buildPrompt_AP003_1(a, b, v) { return `Find the area of a square with side ${a} cm.`; }
function computeAnswer_AP004_0(a, b, v) { return round2(a * b / 2); }
function buildPrompt_AP004_0(a, b, v) { return `Find the area of a triangle with base ${a} cm and height ${b} cm.`; }
function computeAnswer_AP004_1(a, b, v) { return round2(a * b / 2); }
function buildPrompt_AP004_1(a, b, v) { return `A right-angled triangle has legs ${a} cm and ${b} cm. Find its area.`; }
function computeAnswer_AP005_0(a, b, v) { return a * b + (a * Math.floor(b/2)); }
function buildPrompt_AP005_0(a, b, v) { return `A composite figure is made of a rectangle ${a}×${b} cm² and another rectangle ${a}×${Math.floor(b/2)} cm². Find the total area.`; }
function computeAnswer_AP005_1(a, b, v) { return a * b - Math.floor(a/2) * Math.floor(b/2); }
function buildPrompt_AP005_1(a, b, v) { return `A rectangle ${a}×${b} has a ${Math.floor(a/2)}×${Math.floor(b/2)} cm square cut from a corner. Find the remaining area.`; }
function computeAnswer_AP006_0(a, b, v) { return 2 * (a + b) * 100; }
function buildPrompt_AP006_0(a, b, v) { return `A garden is ${a} m long and ${b} m wide. Fencing costs $1 per cm. Find the fencing cost in dollars if perimeter in cm is ${2*(a+b)*100}.`; }
function computeAnswer_AP006_1(a, b, v) { return a * b; }
function buildPrompt_AP006_1(a, b, v) { return `A carpet tile is ${a} cm × ${b} cm. What is its area in cm²?`; }

function apPerimeterRect(family, rng, variant) {
  const v = variant % 20;
  // Perimeter of rectangles and squares — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP001_0(a, b, v);
  const prompt = buildPrompt_AP001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function apPerimeterRectWord(family, rng, variant) {
  const v = variant % 20;
  // Perimeter of rectangles and squares — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP001_1(a, b, v);
  const prompt = buildPrompt_AP001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function apPerimeterPolygon(family, rng, variant) {
  const v = variant % 20;
  // Perimeter of composite shapes — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP002_0(a, b, v);
  const prompt = buildPrompt_AP002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/missing-side', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/missing-side', difficulty: family.difficulty, mode: 'practice' });
}
function apPerimeterPolygonWord(family, rng, variant) {
  const v = variant % 20;
  // Perimeter of composite shapes — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP002_1(a, b, v);
  const prompt = buildPrompt_AP002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/missing-side', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/missing-side', difficulty: family.difficulty, mode: 'practice' });
}
function apAreaRect(family, rng, variant) {
  const v = variant % 20;
  // Area of rectangles and squares — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP003_0(a, b, v);
  const prompt = buildPrompt_AP003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function apAreaRectWord(family, rng, variant) {
  const v = variant % 20;
  // Area of rectangles and squares — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP003_1(a, b, v);
  const prompt = buildPrompt_AP003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/perimeter-area-confuse', difficulty: family.difficulty, mode: 'practice' });
}
function apAreaTriangle(family, rng, variant) {
  const v = variant % 20;
  // Area of triangles — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP004_0(a, b, v);
  const prompt = buildPrompt_AP004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/triangle-no-half', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/triangle-no-half', difficulty: family.difficulty, mode: 'practice' });
}
function apAreaTriangleWord(family, rng, variant) {
  const v = variant % 20;
  // Area of triangles — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP004_1(a, b, v);
  const prompt = buildPrompt_AP004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/triangle-no-half', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/triangle-no-half', difficulty: family.difficulty, mode: 'practice' });
}
function apAreaComposite(family, rng, variant) {
  const v = variant % 20;
  // Area of composite figures — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP005_0(a, b, v);
  const prompt = buildPrompt_AP005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/overlap-region', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/overlap-region', difficulty: family.difficulty, mode: 'practice' });
}
function apAreaCompositeWord(family, rng, variant) {
  const v = variant % 20;
  // Area of composite figures — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP005_1(a, b, v);
  const prompt = buildPrompt_AP005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'ap/overlap-region', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'ap/overlap-region', difficulty: family.difficulty, mode: 'practice' });
}
function apApply(family, rng, variant) {
  const v = variant % 20;
  // Perimeter and area in real-world contexts — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP006_0(a, b, v);
  const prompt = buildPrompt_AP006_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice' });
}
function apApplyWord(family, rng, variant) {
  const v = variant % 20;
  // Perimeter and area in real-world contexts — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_AP006_1(a, b, v);
  const prompt = buildPrompt_AP006_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'mea/area-units', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'apPerimeterRect': apPerimeterRect, 'apPerimeterRectWord': apPerimeterRectWord, 'apPerimeterPolygon': apPerimeterPolygon, 'apPerimeterPolygonWord': apPerimeterPolygonWord, 'apAreaRect': apAreaRect, 'apAreaRectWord': apAreaRectWord, 'apAreaTriangle': apAreaTriangle, 'apAreaTriangleWord': apAreaTriangleWord, 'apAreaComposite': apAreaComposite, 'apAreaCompositeWord': apAreaCompositeWord, 'apApply': apApply, 'apApplyWord': apApplyWord };

export function generateAreaPerimeterQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkAreaPerimeterAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateAreaPerimeterQuestionSet, checkAreaPerimeterAnswer };
