import { getSkill } from './p2TimeSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p2TimeQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad2(n) { return String(n).padStart(2, '0'); }

const WORD_TIMES = [
  { words: "o'clock", minutes: 0 },
  { words: 'half past', minutes: 30 },
  { words: 'quarter past', minutes: 15 },
  { words: 'quarter to', minutes: 45, toNext: true },
];

// ---------------------------------------------------------------------------
// P2-TM-01: Telling Time to 5 Minutes
// ---------------------------------------------------------------------------

function generateTellingTime(familyId) {
  if (familyId.endsWith('_001')) {
    // Read time from hand description
    const hour = randInt(1, 12);
    const minuteIdx = randInt(0, 11); // 0..11 → 0,5,10,...,55
    const minute = minuteIdx * 5;
    const numberOnClock = minuteIdx === 0 ? 12 : minuteIdx;
    const timeStr = `${hour}:${pad2(minute)}`;

    // Build MCQ choices
    const choices = [timeStr];
    // Wrong: reading minute hand number as hours
    const wrongHour = `${numberOnClock}:${pad2(minute)}`;
    if (wrongHour !== timeStr) choices.push(wrongHour);
    // Wrong: reading minute hand number as minutes
    const wrongMin = `${hour}:${pad2(numberOnClock)}`;
    if (wrongMin !== timeStr && !choices.includes(wrongMin)) choices.push(wrongMin);
    // Wrong: off by 5
    const offBy5 = `${hour}:${pad2(Math.min(minute + 5, 55))}`;
    if (!choices.includes(offBy5)) choices.push(offBy5);
    // Pad to 4 if needed
    while (choices.length < 4) {
      const rh = randInt(1, 12);
      const rm = randInt(0, 11) * 5;
      const rc = `${rh}:${pad2(rm)}`;
      if (!choices.includes(rc)) choices.push(rc);
    }

    return {
      skillId: 'P2-TM-01',
      questionFamilyId: familyId,
      prompt: `The hour hand points to ${hour} and the minute hand points to ${numberOnClock}. What time is it?`,
      answer: timeStr,
      answerType: 'choice',
      choices: choices.slice(0, 4),
      instructionHint: `The hour hand shows ${hour}. The minute hand at ${numberOnClock} means ${numberOnClock} × 5 = ${minute} minutes.`,
      solutionText: `Hour = ${hour}. Minute hand at ${numberOnClock} means ${minute} minutes. The time is ${timeStr}.`,
      misconceptionTraps: ['confuses_hour_minute_hands', 'reads_minutes_as_hours'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Time in words to digital
    const hour = randInt(1, 12);
    const wordTime = pick(WORD_TIMES);
    let displayHour = hour;
    let minute = wordTime.minutes;
    if (wordTime.toNext) {
      displayHour = hour; // "quarter to 4" means 3:45
      // We phrase it as "quarter to {hour}" so the answer hour is hour - 1
      const answerHour = hour === 1 ? 12 : hour - 1;
      const timeStr = `${answerHour}:${pad2(minute)}`;

      const choices = [timeStr];
      // Wrong: uses the stated hour directly
      const wrong1 = `${hour}:${pad2(minute)}`;
      if (!choices.includes(wrong1)) choices.push(wrong1);
      // Wrong: reads as 15 past
      const wrong2 = `${answerHour}:15`;
      if (!choices.includes(wrong2)) choices.push(wrong2);
      while (choices.length < 4) {
        const rh = randInt(1, 12);
        const rm = randInt(0, 11) * 5;
        const rc = `${rh}:${pad2(rm)}`;
        if (!choices.includes(rc)) choices.push(rc);
      }

      return {
        skillId: 'P2-TM-01',
        questionFamilyId: familyId,
        prompt: `What is ${wordTime.words} ${hour} in digital time?`,
        answer: timeStr,
        answerType: 'choice',
        choices: choices.slice(0, 4),
        instructionHint: `"Quarter to ${hour}" means 15 minutes before ${hour}, which is ${answerHour}:45.`,
        solutionText: `Quarter to ${hour} = ${answerHour}:45. The time is ${timeStr}.`,
        misconceptionTraps: ['reads_minutes_as_hours', 'off_by_five_minutes'],
      };
    }

    const timeStr = `${displayHour}:${pad2(minute)}`;
    const choices = [timeStr];
    // Wrong: swap hour
    const wrong1 = `${minute === 0 ? 12 : Math.floor(minute / 5)}:${pad2(displayHour > 9 ? displayHour : displayHour * 5)}`;
    if (wrong1 !== timeStr && !choices.includes(wrong1)) choices.push(wrong1);
    while (choices.length < 4) {
      const rh = randInt(1, 12);
      const rm = randInt(0, 11) * 5;
      const rc = `${rh}:${pad2(rm)}`;
      if (!choices.includes(rc)) choices.push(rc);
    }

    return {
      skillId: 'P2-TM-01',
      questionFamilyId: familyId,
      prompt: `What is ${wordTime.words === "o'clock" ? `${displayHour} ${wordTime.words}` : `${wordTime.words} ${displayHour}`} in digital time?`,
      answer: timeStr,
      answerType: 'choice',
      choices: choices.slice(0, 4),
      instructionHint: `"${wordTime.words}" means ${minute} minutes.`,
      solutionText: `${wordTime.words === "o'clock" ? `${displayHour} o'clock` : `${wordTime.words} ${displayHour}`} = ${timeStr}.`,
      misconceptionTraps: ['reads_minutes_as_hours', 'off_by_five_minutes'],
    };
  }

  // _003: What time will it be in X minutes?
  const hour = randInt(1, 12);
  const minuteIdx = randInt(0, 11);
  const minute = minuteIdx * 5;
  const addMinutes = pick([5, 10, 15, 20, 25, 30]);
  const totalMinutes = hour * 60 + minute + addMinutes;
  let endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  // Wrap to 12-hour format
  if (endHour > 12) endHour -= 12;
  if (endHour === 0) endHour = 12;
  const startStr = `${hour}:${pad2(minute)}`;
  const endStr = `${endHour}:${pad2(endMinute)}`;

  const choices = [endStr];
  // Wrong: forgot to carry the hour
  const wrongNoCarry = `${hour}:${pad2((minute + addMinutes) % 60)}`;
  if (wrongNoCarry !== endStr && !choices.includes(wrongNoCarry)) choices.push(wrongNoCarry);
  // Wrong: off by 5
  const wrongOff5 = `${endHour}:${pad2(Math.max(0, endMinute - 5))}`;
  if (wrongOff5 !== endStr && !choices.includes(wrongOff5)) choices.push(wrongOff5);
  while (choices.length < 4) {
    const rh = randInt(1, 12);
    const rm = randInt(0, 11) * 5;
    const rc = `${rh}:${pad2(rm)}`;
    if (!choices.includes(rc)) choices.push(rc);
  }

  return {
    skillId: 'P2-TM-01',
    questionFamilyId: familyId,
    prompt: `It is ${startStr} now. What time will it be in ${addMinutes} minutes?`,
    answer: endStr,
    answerType: 'choice',
    choices: choices.slice(0, 4),
    instructionHint: `Start at ${startStr} and count forward ${addMinutes} minutes.`,
    solutionText: `${startStr} + ${addMinutes} minutes = ${endStr}.`,
    misconceptionTraps: ['off_by_five_minutes', 'confuses_hour_minute_hands'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P2-TM-01': generateTellingTime,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId
    ? families.find((f) => f.id === options.questionFamilyId) || pick(families)
    : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return {
    ...question,
    questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    difficulty: family.difficulty,
    fluencyTargetSeconds: family.fluencyTargetSeconds,
  };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) questions.push(...generateQuestionSet(skillId, questionsPerSkill));
  return questions;
}

export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
