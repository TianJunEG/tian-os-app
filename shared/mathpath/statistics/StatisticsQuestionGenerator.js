import { getSkill } from './StatisticsSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './StatisticsQuestionFamilies.js';

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

function computeAnswer_ST001_0(a, b, v) { return a + b + 3 + 5; }
function buildPrompt_ST001_0(a, b, v) { return `A table shows: Apples: ${a}, Bananas: ${b}, Mangoes: 3, Pears: 5. What is the total number of fruits?`; }
function computeAnswer_ST001_1(a, b, v) { return Math.max(a, b, 3, 5); }
function buildPrompt_ST001_1(a, b, v) { return `A table shows: Red: ${a}, Blue: ${b}, Green: 3, Yellow: 5. Which colour has the most? Answer with the count.`; }
function computeAnswer_ST002_0(a, b, v) { return a * b; }
function buildPrompt_ST002_0(a, b, v) { return `In a pictograph, each symbol represents ${b} items. There are ${a} symbols for Monday. How many items for Monday?`; }
function computeAnswer_ST002_1(a, b, v) { return (a - b) * 3; }
function buildPrompt_ST002_1(a, b, v) { return `A pictograph (key: 1 symbol = 3 items) shows Day A has ${a} symbols and Day B has ${b} symbols. How many more items did Day A have?`; }
function computeAnswer_ST003_0(a, b, v) { return a + b + 4 + 7; }
function buildPrompt_ST003_0(a, b, v) { return `A bar graph shows: Class A: ${a}, Class B: ${b}, Class C: 4, Class D: 7 students. What is the total?`; }
function computeAnswer_ST003_1(a, b, v) { return a - b; }
function buildPrompt_ST003_1(a, b, v) { return `A bar graph shows Team X scored ${a} and Team Y scored ${b}. How many more did Team X score?`; }
// Second reading is a+b so the rise is exactly b (always positive). The old
// version answered a+b (the sum of the two readings), not the rise, and its
// "increased ${b-a}°C" text went negative when a > b. See audit.
function computeAnswer_ST004_0(a, b, v) { return b; }
function buildPrompt_ST004_0(a, b, v) { return `A line graph shows the temperature was ${a}°C at 9 am and ${a + b}°C at noon. By how much did the temperature rise?`; }
// January reading is a+b, February is a, so the fall is exactly b (positive).
// The old version answered a−b, which went negative whenever b > a. See audit.
function computeAnswer_ST004_1(a, b, v) { return b; }
function buildPrompt_ST004_1(a, b, v) { return `A line graph shows sales of ${a + b} units in January and ${a} units in February. By how much did sales fall?`; }
function computeAnswer_ST005_0(a, b, v) { return a + b + 5 + 3; }
function buildPrompt_ST005_0(a, b, v) { return `From a bar chart: Mon: ${a}, Tue: ${b}, Wed: 5, Thu: 3. What is the total for all 4 days?`; }
function computeAnswer_ST005_1(a, b, v) { return Math.max(a, b, 5, 3); }
function buildPrompt_ST005_1(a, b, v) { return `From the same chart (Mon:${a}, Tue:${b}, Wed:5, Thu:3), what was the highest daily value?`; }
// Exact mean (round2); the old Math.floor silently truncated a real fraction
// (e.g. mean 5.5 reported as 5), misgrading the student. Means may be decimal.
function computeAnswer_ST006_0(a, b, v) { return round2((a + b + (a+1) + (b-1)) / 4); }
function buildPrompt_ST006_0(a, b, v) { return `Find the mean of ${a}, ${b}, ${a+1}, ${b-1}.`; }
function computeAnswer_ST006_1(a, b, v) { return round2((a + b + 3*a) / 5); }
function buildPrompt_ST006_1(a, b, v) { return `Five numbers are ${a}, ${b}, ${a}, ${a}, ${a}. Find the mean.`; }
function computeAnswer_ST007_0(a, b, v) { return a * b; }
function buildPrompt_ST007_0(a, b, v) { return `The mean of ${b} numbers is ${a}. What is their total sum?`; }
// New mean = (old total + added score) / (old count + 1)
//          = (a·b + 2a) / (b + 1). The old formula simplified to 2a (it just
// returned the added score), which is wrong. Means may be decimal → round2.
function computeAnswer_ST007_1(a, b, v) { return round2((a * b + 2 * a) / (b + 1)); }
function buildPrompt_ST007_1(a, b, v) { return `The mean of ${b} scores is ${a}. After adding one more score of ${2*a}, what is the new mean?`; }
// Use b (range 2–10) so the percentage b·10 is always ≤ 100% and the sector
// b·36° is a whole number ≤ 360°. The old version used a (up to 25) → >100%
// pies, and divided the degrees by 10 (40% → 14° instead of 144°). See audit.
function computeAnswer_ST008_0(a, b, v) { return b * 36; }
function buildPrompt_ST008_0(a, b, v) { return `In a pie chart, ${b * 10}% of the students chose red. How many degrees is that sector? (A full circle is 360°.)`; }
// Guarantee part ≤ whole so the percentage never exceeds 100%. The old version
// used independent a, b and produced "2 students, 10 chose Science → 500%".
function computeAnswer_ST008_1(a, b, v) { return Math.round(Math.min(a, b) / Math.max(a, b) * 100); }
function buildPrompt_ST008_1(a, b, v) { return `In a class of ${Math.max(a, b)} students, ${Math.min(a, b)} chose Science. What percentage chose Science? (Round to the nearest whole number.)`; }

function statTableRead(family, rng, variant) {
  const v = variant % 20;
  // Reading tables — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST001_0(a, b, v);
  const prompt = buildPrompt_ST001_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/row-column-mix', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/row-column-mix', difficulty: family.difficulty, mode: 'practice' });
}
function statTableReadMCQ(family, rng, variant) {
  const v = variant % 20;
  // Reading tables — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST001_1(a, b, v);
  const prompt = buildPrompt_ST001_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/row-column-mix', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/row-column-mix', difficulty: family.difficulty, mode: 'practice' });
}
function statPictureGraph(family, rng, variant) {
  const v = variant % 20;
  // Picture graphs — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST002_0(a, b, v);
  const prompt = buildPrompt_ST002_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/ignore-key', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/ignore-key', difficulty: family.difficulty, mode: 'practice' });
}
function statPictureGraphMCQ(family, rng, variant) {
  const v = variant % 20;
  // Picture graphs — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST002_1(a, b, v);
  const prompt = buildPrompt_ST002_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/ignore-key', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/ignore-key', difficulty: family.difficulty, mode: 'practice' });
}
function statBarGraph(family, rng, variant) {
  const v = variant % 20;
  // Bar graphs — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST003_0(a, b, v);
  const prompt = buildPrompt_ST003_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/scale-interval', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/scale-interval', difficulty: family.difficulty, mode: 'practice' });
}
function statBarGraphMCQ(family, rng, variant) {
  const v = variant % 20;
  // Bar graphs — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST003_1(a, b, v);
  const prompt = buildPrompt_ST003_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/scale-interval', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/scale-interval', difficulty: family.difficulty, mode: 'practice' });
}
function statLineGraph(family, rng, variant) {
  const v = variant % 20;
  // Line graphs — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST004_0(a, b, v);
  const prompt = buildPrompt_ST004_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/point-misread', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/point-misread', difficulty: family.difficulty, mode: 'practice' });
}
function statLineGraphMCQ(family, rng, variant) {
  const v = variant % 20;
  // Line graphs — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST004_1(a, b, v);
  const prompt = buildPrompt_ST004_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/point-misread', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/point-misread', difficulty: family.difficulty, mode: 'practice' });
}
function statInterpret(family, rng, variant) {
  const v = variant % 20;
  // Interpreting and comparing data — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST005_0(a, b, v);
  const prompt = buildPrompt_ST005_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/trend-overread', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/trend-overread', difficulty: family.difficulty, mode: 'practice' });
}
function statInterpretMCQ(family, rng, variant) {
  const v = variant % 20;
  // Interpreting and comparing data — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST005_1(a, b, v);
  const prompt = buildPrompt_ST005_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/trend-overread', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/trend-overread', difficulty: family.difficulty, mode: 'practice' });
}
function statMeanConcept(family, rng, variant) {
  const v = variant % 20;
  // Average (mean) — concept — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST006_0(a, b, v);
  const prompt = buildPrompt_ST006_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/mean-not-divide', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/mean-not-divide', difficulty: family.difficulty, mode: 'practice' });
}
function statMeanConceptWord(family, rng, variant) {
  const v = variant % 20;
  // Average (mean) — concept — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST006_1(a, b, v);
  const prompt = buildPrompt_ST006_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/mean-not-divide', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/mean-not-divide', difficulty: family.difficulty, mode: 'practice' });
}
function statMeanApply(family, rng, variant) {
  const v = variant % 20;
  // Mean: finding the total or a missing value — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST007_0(a, b, v);
  const prompt = buildPrompt_ST007_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/mean-reverse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/mean-reverse', difficulty: family.difficulty, mode: 'practice' });
}
function statMeanApplyWord(family, rng, variant) {
  const v = variant % 20;
  // Mean: finding the total or a missing value — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST007_1(a, b, v);
  const prompt = buildPrompt_ST007_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/mean-reverse', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/mean-reverse', difficulty: family.difficulty, mode: 'practice' });
}
function statPieChart(family, rng, variant) {
  const v = variant % 20;
  // Pie charts — short answer
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST008_0(a, b, v);
  const prompt = buildPrompt_ST008_0(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (false) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/pie-angle-fraction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/pie-angle-fraction', difficulty: family.difficulty, mode: 'practice' });
}
function statPieChartMCQ(family, rng, variant) {
  const v = variant % 20;
  // Pie charts — MCQ
  const nums = [pick(rng, [2,3,4,5,6,7,8,9,10,12,15,20,25]), pick(rng, [2,3,4,5,6,7,8,10])];
  const a = nums[0], b = nums[1];
  const answer = computeAnswer_ST008_1(a, b, v);
  const prompt = buildPrompt_ST008_1(a, b, v);
  const display = String(answer);
  const steps = ['Identify the key information.', 'Apply the correct method.', 'Calculate: ' + display];
  if (true) {
    const distractors = [String(answer + rint(rng,1,3)), String(answer + rint(rng,4,8)), String(Math.max(1, answer - rint(rng,1,3)))];
    return mcq({ family, prompt, answerDisplay: display, distractors, solutionSteps: steps, misconceptionTag: 'stat/pie-angle-fraction', difficulty: family.difficulty, mode: 'practice', rng });
  }
  return shortAnswer({ family, prompt, answer, display, solutionSteps: steps, misconceptionTag: 'stat/pie-angle-fraction', difficulty: family.difficulty, mode: 'practice' });
}

const GENERATORS = { 'statTableRead': statTableRead, 'statTableReadMCQ': statTableReadMCQ, 'statPictureGraph': statPictureGraph, 'statPictureGraphMCQ': statPictureGraphMCQ, 'statBarGraph': statBarGraph, 'statBarGraphMCQ': statBarGraphMCQ, 'statLineGraph': statLineGraph, 'statLineGraphMCQ': statLineGraphMCQ, 'statInterpret': statInterpret, 'statInterpretMCQ': statInterpretMCQ, 'statMeanConcept': statMeanConcept, 'statMeanConceptWord': statMeanConceptWord, 'statMeanApply': statMeanApply, 'statMeanApplyWord': statMeanApplyWord, 'statPieChart': statPieChart, 'statPieChartMCQ': statPieChartMCQ };

export function generateStatisticsQuestionSet({ skillId, count = 6, mode = 'practice' }) {
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

export function checkStatisticsAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '').trim().toLowerCase();
  const given = String(studentResponse).trim().toLowerCase().replace(/\s+/g, '');
  const clean = (s) => s.replace(/\s+/g, '').replace(/,/g, '');
  return { correct: clean(given) === clean(expected) };
}

export default { generateStatisticsQuestionSet, checkStatisticsAnswer };
