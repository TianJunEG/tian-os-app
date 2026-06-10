import { getSkill } from './p3MeasTimeSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p3MeasTimeQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad2(n) { return String(n).padStart(2, '0'); }

// ---------------------------------------------------------------------------
// P3-MT-01: Compound Units to Smaller Unit
// ---------------------------------------------------------------------------

function generateCompoundUnits(familyId) {
  if (familyId.endsWith('_001')) {
    // m & cm → cm
    const m = randInt(1, 9);
    const cm = randInt(0, 99);
    const total = m * 100 + cm;
    return {
      skillId: 'P3-MT-01',
      questionFamilyId: familyId,
      prompt: `Convert ${m} m ${cm} cm to cm.`,
      answer: total,
      answerType: 'number',
      instructionHint: '1 m = 100 cm. Multiply the metres by 100, then add the centimetres.',
      solutionText: `${m} m = ${m * 100} cm. ${m * 100} + ${cm} = ${total} cm.`,
      misconceptionTraps: ['wrong_conversion_factor', 'adds_without_converting'],
    };
  }

  if (familyId.endsWith('_002')) {
    // kg & g → g
    const kg = randInt(1, 9);
    const g = randInt(0, 999);
    const total = kg * 1000 + g;
    return {
      skillId: 'P3-MT-01',
      questionFamilyId: familyId,
      prompt: `Convert ${kg} kg ${g} g to g.`,
      answer: total,
      answerType: 'number',
      instructionHint: '1 kg = 1000 g. Multiply the kilograms by 1000, then add the grams.',
      solutionText: `${kg} kg = ${kg * 1000} g. ${kg * 1000} + ${g} = ${total} g.`,
      misconceptionTraps: ['wrong_conversion_factor', 'adds_without_converting'],
    };
  }

  // _003: km & m → m  OR  L & mL → mL
  const useKm = pick([true, false]);
  if (useKm) {
    const km = randInt(1, 9);
    const m = randInt(0, 999);
    const total = km * 1000 + m;
    return {
      skillId: 'P3-MT-01',
      questionFamilyId: familyId,
      prompt: `Convert ${km} km ${m} m to m.`,
      answer: total,
      answerType: 'number',
      instructionHint: '1 km = 1000 m.',
      solutionText: `${km} km = ${km * 1000} m. ${km * 1000} + ${m} = ${total} m.`,
      misconceptionTraps: ['wrong_conversion_factor', 'adds_without_converting', 'unit_label_swap'],
    };
  }
  const L = randInt(1, 9);
  const mL = randInt(0, 999);
  const total = L * 1000 + mL;
  return {
    skillId: 'P3-MT-01',
    questionFamilyId: familyId,
    prompt: `Convert ${L} L ${mL} mL to mL.`,
    answer: total,
    answerType: 'number',
    instructionHint: '1 L = 1000 mL.',
    solutionText: `${L} L = ${L * 1000} mL. ${L * 1000} + ${mL} = ${total} mL.`,
    misconceptionTraps: ['wrong_conversion_factor', 'adds_without_converting', 'unit_label_swap'],
  };
}

// ---------------------------------------------------------------------------
// P3-MT-02: Telling Time (to the minute)
// ---------------------------------------------------------------------------

function generateTellingTime(familyId) {
  if (familyId.endsWith('_001')) {
    // Minutes on a number (multiples of 5)
    const hour = randInt(1, 12);
    const minuteIdx = randInt(0, 11); // 0,5,10,...,55
    const minute = minuteIdx * 5;
    const timeStr = `${hour}:${pad2(minute)}`;
    return {
      skillId: 'P3-MT-02',
      questionFamilyId: familyId,
      prompt: `The short hand points just past ${hour} and the long hand points at ${minuteIdx === 0 ? 12 : minuteIdx}. What time is it?`,
      answer: timeStr,
      answerType: 'text',
      instructionHint: 'Short hand = hour, long hand = minutes. Each number = 5 minutes.',
      solutionText: `The short hand shows ${hour}. The long hand at ${minuteIdx === 0 ? 12 : minuteIdx} means ${minute} minutes. The time is ${timeStr}.`,
      misconceptionTraps: ['reads_minute_hand_as_hour', 'off_by_one_hour'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Minutes between numbers
    const hour = randInt(1, 12);
    const fiveBlock = randInt(0, 11);
    const extra = randInt(1, 4);
    const minute = fiveBlock * 5 + extra;
    const timeStr = `${hour}:${pad2(minute)}`;
    return {
      skillId: 'P3-MT-02',
      questionFamilyId: familyId,
      prompt: `The short hand is just past ${hour}. The long hand is ${extra} small mark${extra > 1 ? 's' : ''} past the ${fiveBlock === 0 ? 12 : fiveBlock}. What time is it?`,
      answer: timeStr,
      answerType: 'text',
      instructionHint: 'Count by fives to the number, then count on by ones for the extra marks.',
      solutionText: `Hour = ${hour}. Minutes = ${fiveBlock * 5} + ${extra} = ${minute}. The time is ${timeStr}.`,
      misconceptionTraps: ['reads_minute_hand_as_hour', 'off_by_one_hour', 'counts_minutes_by_fives_only'],
    };
  }

  // _003: Write time in words (given digital time)
  const hour = randInt(1, 12);
  const minute = randInt(1, 59);
  const timeStr = `${hour}:${pad2(minute)}`;
  const pastTo = minute <= 30 ? 'past' : 'to';
  const displayMin = minute <= 30 ? minute : 60 - minute;
  const displayHour = minute <= 30 ? hour : (hour % 12) + 1;

  return {
    skillId: 'P3-MT-02',
    questionFamilyId: familyId,
    prompt: `Write ${timeStr} using "past" or "to". How many minutes ${pastTo} ${displayHour}?`,
    answer: displayMin,
    answerType: 'number',
    instructionHint: 'If minutes ≤ 30, say "past". If minutes > 30, subtract from 60 and say "to" the next hour.',
    solutionText: `${timeStr} is ${displayMin} minutes ${pastTo} ${displayHour}.`,
    misconceptionTraps: ['off_by_one_hour'],
  };
}

// ---------------------------------------------------------------------------
// P3-MT-03: 24-Hour Clock
// ---------------------------------------------------------------------------

function generate24HourClock(familyId) {
  if (familyId.endsWith('_001')) {
    // 12h a.m. → 24h
    const hour = randInt(1, 11); // 1am - 11am
    const minute = randInt(0, 59);
    const answer = `${pad2(hour)}:${pad2(minute)}`;
    return {
      skillId: 'P3-MT-03',
      questionFamilyId: familyId,
      prompt: `Convert ${hour}:${pad2(minute)} a.m. to 24-hour time.`,
      answer,
      answerType: 'text',
      instructionHint: 'For a.m., just add a leading zero if needed.',
      solutionText: `${hour}:${pad2(minute)} a.m. = ${answer} in 24-hour time.`,
      misconceptionTraps: ['confuses_midnight_noon', 'drops_leading_zero_24h'],
    };
  }

  if (familyId.endsWith('_002')) {
    // 12h p.m. → 24h
    const hour = randInt(1, 11); // 1pm - 11pm
    const minute = randInt(0, 59);
    const h24 = hour + 12;
    const answer = `${h24}:${pad2(minute)}`;
    return {
      skillId: 'P3-MT-03',
      questionFamilyId: familyId,
      prompt: `Convert ${hour}:${pad2(minute)} p.m. to 24-hour time.`,
      answer,
      answerType: 'text',
      instructionHint: 'For p.m., add 12 to the hour.',
      solutionText: `${hour}:${pad2(minute)} p.m. = ${hour} + 12 = ${h24} → ${answer}.`,
      misconceptionTraps: ['forgets_add_12_for_pm', 'confuses_midnight_noon'],
    };
  }

  // _003: 24h → 12h
  const h24 = randInt(0, 23);
  const minute = randInt(0, 59);
  const period = h24 < 12 ? 'a.m.' : 'p.m.';
  let h12;
  if (h24 === 0) h12 = 12;
  else if (h24 <= 12) h12 = h24;
  else h12 = h24 - 12;
  const answer = `${h12}:${pad2(minute)} ${period}`;
  return {
    skillId: 'P3-MT-03',
    questionFamilyId: familyId,
    prompt: `Convert ${pad2(h24)}:${pad2(minute)} to 12-hour time.`,
    answer,
    answerType: 'text',
    instructionHint: 'If the hour is 13 or more, subtract 12 and add p.m.',
    solutionText: `${pad2(h24)}:${pad2(minute)} = ${answer}.`,
    misconceptionTraps: ['forgets_add_12_for_pm', 'confuses_midnight_noon'],
  };
}

// ---------------------------------------------------------------------------
// P3-MT-04: Finding a Duration
// ---------------------------------------------------------------------------

function generateDuration(familyId) {
  if (familyId.endsWith('_001')) {
    // Duration between two times (within 2 hours)
    const startH = randInt(7, 16);
    const startM = randInt(0, 59);
    const duration = randInt(15, 120);
    const totalMin = startH * 60 + startM + duration;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    return {
      skillId: 'P3-MT-04',
      questionFamilyId: familyId,
      prompt: `How many minutes is it from ${startH}:${pad2(startM)} to ${endH}:${pad2(endM)}?`,
      answer: duration,
      answerType: 'number',
      instructionHint: 'Count on from the start time to the end time.',
      solutionText: `From ${startH}:${pad2(startM)} to ${endH}:${pad2(endM)} is ${duration} minutes.`,
      misconceptionTraps: ['subtracts_minutes_across_hour_wrong', 'treats_60min_as_100'],
    };
  }

  if (familyId.endsWith('_002')) {
    // End time given start + duration
    const startH = randInt(7, 16);
    const startM = randInt(0, 59);
    const duration = randInt(15, 120);
    const totalMin = startH * 60 + startM + duration;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    const answer = `${endH}:${pad2(endM)}`;
    return {
      skillId: 'P3-MT-04',
      questionFamilyId: familyId,
      prompt: `It is ${startH}:${pad2(startM)}. What time will it be in ${duration} minutes?`,
      answer,
      answerType: 'text',
      instructionHint: 'Add the minutes. If you go past 59, add 1 hour.',
      solutionText: `${startH}:${pad2(startM)} + ${duration} min = ${answer}.`,
      misconceptionTraps: ['treats_60min_as_100'],
    };
  }

  // _003: Start time given end and duration
  const endH = randInt(8, 18);
  const endM = randInt(0, 59);
  const duration = randInt(15, 120);
  const totalMin = endH * 60 + endM - duration;
  const startH = Math.floor(totalMin / 60);
  const startM = totalMin % 60;
  const answer = `${startH}:${pad2(startM)}`;
  return {
    skillId: 'P3-MT-04',
    questionFamilyId: familyId,
    prompt: `A lesson ends at ${endH}:${pad2(endM)}. It lasted ${duration} minutes. What time did it start?`,
    answer,
    answerType: 'text',
    instructionHint: 'Subtract the duration from the end time.',
    solutionText: `${endH}:${pad2(endM)} - ${duration} min = ${answer}.`,
    misconceptionTraps: ['subtracts_minutes_across_hour_wrong', 'treats_60min_as_100'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P3-MT-01': generateCompoundUnits,
  'P3-MT-02': generateTellingTime,
  'P3-MT-03': generate24HourClock,
  'P3-MT-04': generateDuration,
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
