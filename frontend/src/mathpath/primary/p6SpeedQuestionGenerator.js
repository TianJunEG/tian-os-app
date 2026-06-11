import { getSkill } from './p6SpeedSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6SpeedQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---------------------------------------------------------------------------
// Singapore-style names
// ---------------------------------------------------------------------------
const NAMES = [
  'Wei Ling', 'Jun Hao', 'Siti', 'Ravi', 'Mei Xuan',
  'Aisha', 'Zheng Wei', 'Kumar', 'Li Ting', 'Hafiz',
  'Priya', 'Jia En', 'Darren', 'Nurul', 'Yi Xuan',
];

const VEHICLES = ['car', 'bus', 'van', 'taxi', 'motorcycle'];
const PEOPLE_TRANSPORT = ['cyclist', 'jogger', 'walker'];
const PLACES_A = ['Jurong', 'Tampines', 'Woodlands', 'Bedok', 'Clementi', 'Ang Mo Kio', 'Punggol'];
const PLACES_B = ['Changi', 'Sentosa', 'Toa Payoh', 'Bishan', 'Yishun', 'Bukit Timah', 'Pasir Ris'];

// ---------------------------------------------------------------------------
// Time formatting helpers
// ---------------------------------------------------------------------------
function formatTime(hours, minutes) {
  const h = Math.floor(hours);
  const m = Math.round(minutes !== undefined ? minutes : (hours - h) * 60);
  const period = h < 12 ? 'a.m.' : 'p.m.';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function addMinutesToTime(baseHour, baseMin, addMinutes) {
  const totalMin = baseHour * 60 + baseMin + addMinutes;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { hour: h, min: m };
}

// ---------------------------------------------------------------------------
// P6-SPD-01: Speed-Distance-Time Basics
// ---------------------------------------------------------------------------

function generateSDTBasics(familyId) {
  if (familyId.endsWith('_001')) {
    // Find Speed: speed = distance / time
    const vehicle = pick(VEHICLES);
    // Pick time first (whole hours 1-5), then pick distance as a multiple of time
    const time = randInt(1, 5);
    const speedVal = pick([40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 120]);
    const distance = speedVal * time;

    return {
      skillId: 'P6-SPD-01',
      questionFamilyId: familyId,
      prompt: `A ${vehicle} travels ${distance} km in ${time} hour${time > 1 ? 's' : ''}. What is its speed in km/h?`,
      answer: speedVal,
      answerType: 'number',
      instructionHint: 'Use the formula: Speed = Distance ÷ Time.',
      solutionText: `Speed = ${distance} km ÷ ${time} h = ${speedVal} km/h.`,
      misconceptionTraps: ['confuses_speed_distance_time_formula', 'uses_wrong_formula_arrangement'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Find Distance: distance = speed × time
    const name = pick(NAMES);
    const mode = pick(['cycles', 'jogs', 'drives', 'walks']);
    const speed = pick([8, 10, 12, 15, 20, 30, 40, 50, 60, 80]);
    const time = randInt(1, 5);
    const distance = speed * time;

    return {
      skillId: 'P6-SPD-01',
      questionFamilyId: familyId,
      prompt: `${name} ${mode} at a speed of ${speed} km/h for ${time} hour${time > 1 ? 's' : ''}. What is the total distance travelled?`,
      answer: distance,
      answerType: 'number',
      instructionHint: 'Use the formula: Distance = Speed × Time.',
      solutionText: `Distance = ${speed} km/h × ${time} h = ${distance} km.`,
      misconceptionTraps: ['confuses_speed_distance_time_formula', 'uses_wrong_formula_arrangement'],
    };
  }

  // _003: Find Time: time = distance / speed
  const vehicle = pick(VEHICLES);
  const placeA = pick(PLACES_A);
  const placeB = pick(PLACES_B);
  // Pick speed, then time, compute distance
  const speed = pick([40, 50, 60, 75, 80, 90, 100, 120]);
  const time = randInt(1, 5);
  const distance = speed * time;

  return {
    skillId: 'P6-SPD-01',
    questionFamilyId: familyId,
    prompt: `A ${vehicle} travels ${distance} km from ${placeA} to ${placeB} at a speed of ${speed} km/h. How many hours does the journey take?`,
    answer: time,
    answerType: 'number',
    instructionHint: 'Use the formula: Time = Distance ÷ Speed.',
    solutionText: `Time = ${distance} km ÷ ${speed} km/h = ${time} h.`,
    misconceptionTraps: ['confuses_speed_distance_time_formula', 'uses_wrong_formula_arrangement', 'forgets_time_unit_conversion'],
  };
}

// ---------------------------------------------------------------------------
// P6-SPD-02: Average Speed
// ---------------------------------------------------------------------------

function generateAverageSpeed(familyId) {
  if (familyId.endsWith('_001')) {
    // Two-leg: given distance & speed for each leg
    // Pick speeds and distances so total time divides total distance evenly
    const speed1 = pick([40, 50, 60, 80, 100]);
    const speed2 = pick([30, 40, 50, 60, 75, 80]);
    // time1 and time2 in hours (whole numbers)
    const time1 = randInt(1, 3);
    const time2 = randInt(1, 3);
    const dist1 = speed1 * time1;
    const dist2 = speed2 * time2;
    const totalDist = dist1 + dist2;
    const totalTime = time1 + time2;
    const avgSpeed = totalDist / totalTime;

    // Only use if avgSpeed is a whole number
    if (avgSpeed !== Math.floor(avgSpeed)) {
      // Retry with controlled values
      const t1 = 2, t2 = 3;
      const s1 = 60, s2 = 40;
      const d1 = s1 * t1; // 120
      const d2 = s2 * t2; // 120
      const td = d1 + d2; // 240
      const tt = t1 + t2; // 5
      const as = td / tt; // 48

      return {
        skillId: 'P6-SPD-02',
        questionFamilyId: familyId,
        prompt: `${pick(NAMES)} drove ${d1} km at ${s1} km/h, then ${d2} km at ${s2} km/h. What was the average speed for the whole journey?`,
        answer: as,
        answerType: 'number',
        instructionHint: 'Average speed = Total distance ÷ Total time. Do NOT average the two speeds.',
        solutionText: `Time for first part = ${d1} ÷ ${s1} = ${t1} h. Time for second part = ${d2} ÷ ${s2} = ${t2} h. Total distance = ${td} km. Total time = ${tt} h. Average speed = ${td} ÷ ${tt} = ${as} km/h.`,
        misconceptionTraps: ['averages_speeds_instead_of_total', 'distance_not_additive_for_average'],
      };
    }

    const name = pick(NAMES);
    return {
      skillId: 'P6-SPD-02',
      questionFamilyId: familyId,
      prompt: `${name} drove ${dist1} km at ${speed1} km/h, then ${dist2} km at ${speed2} km/h. What was the average speed for the whole journey?`,
      answer: avgSpeed,
      answerType: 'number',
      instructionHint: 'Average speed = Total distance ÷ Total time. Do NOT average the two speeds.',
      solutionText: `Time for first part = ${dist1} ÷ ${speed1} = ${time1} h. Time for second part = ${dist2} ÷ ${speed2} = ${time2} h. Total distance = ${totalDist} km. Total time = ${totalTime} h. Average speed = ${totalDist} ÷ ${totalTime} = ${avgSpeed} km/h.`,
      misconceptionTraps: ['averages_speeds_instead_of_total', 'distance_not_additive_for_average'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Two-leg: given distances and speeds, find average speed
    // Constrain so that each leg time is a whole number and avg is whole
    const combos = [
      { d1: 90, s1: 45, d2: 60, s2: 30 },   // t1=2, t2=2, avg=150/4=37.5 — skip
      { d1: 120, s1: 60, d2: 80, s2: 40 },   // t1=2, t2=2, avg=200/4=50
      { d1: 150, s1: 50, d2: 100, s2: 50 },   // t1=3, t2=2, avg=250/5=50
      { d1: 180, s1: 60, d2: 120, s2: 40 },   // t1=3, t2=3, avg=300/6=50
      { d1: 100, s1: 50, d2: 80, s2: 40 },    // t1=2, t2=2, avg=180/4=45
      { d1: 240, s1: 80, d2: 120, s2: 60 },   // t1=3, t2=2, avg=360/5=72
      { d1: 200, s1: 100, d2: 150, s2: 75 },  // t1=2, t2=2, avg=350/4=87.5 — skip
      { d1: 160, s1: 80, d2: 90, s2: 45 },    // t1=2, t2=2, avg=250/4=62.5 — skip
      { d1: 200, s1: 100, d2: 100, s2: 50 },  // t1=2, t2=2, avg=300/4=75
      { d1: 60, s1: 30, d2: 120, s2: 60 },    // t1=2, t2=2, avg=180/4=45
      { d1: 180, s1: 90, d2: 120, s2: 40 },   // t1=2, t2=3, avg=300/5=60
      { d1: 150, s1: 75, d2: 120, s2: 40 },   // t1=2, t2=3, avg=270/5=54
      { d1: 240, s1: 80, d2: 160, s2: 80 },   // t1=3, t2=2, avg=400/5=80
    ];
    // Filter to those with whole-number avg speed
    const valid = combos.filter((c) => {
      const t1 = c.d1 / c.s1, t2 = c.d2 / c.s2;
      const avg = (c.d1 + c.d2) / (t1 + t2);
      return avg === Math.floor(avg);
    });
    const c = pick(valid);
    const t1 = c.d1 / c.s1;
    const t2 = c.d2 / c.s2;
    const totalDist = c.d1 + c.d2;
    const totalTime = t1 + t2;
    const avgSpeed = totalDist / totalTime;
    const name = pick(NAMES);
    const placeA = pick(PLACES_A);
    const placeB = pick(PLACES_B);

    return {
      skillId: 'P6-SPD-02',
      questionFamilyId: familyId,
      prompt: `${name} travelled from ${placeA} to ${placeB}. The first ${c.d1} km was at ${c.s1} km/h and the remaining ${c.d2} km was at ${c.s2} km/h. Find the average speed for the entire journey.`,
      answer: avgSpeed,
      answerType: 'number',
      instructionHint: 'First find the time for each part. Then: Average speed = Total distance ÷ Total time.',
      solutionText: `Time for first part = ${c.d1} ÷ ${c.s1} = ${t1} h. Time for second part = ${c.d2} ÷ ${c.s2} = ${t2} h. Total distance = ${totalDist} km. Total time = ${totalTime} h. Average speed = ${totalDist} ÷ ${totalTime} = ${avgSpeed} km/h.`,
      misconceptionTraps: ['averages_speeds_instead_of_total', 'forgets_time_unit_conversion'],
    };
  }

  // _003: Two-leg given distances and times, find avg speed
  const t1 = randInt(1, 4);
  const t2 = randInt(1, 4);
  const totalTime = t1 + t2;
  // Pick totalDist as a multiple of totalTime for a clean answer
  const multiplier = pick([10, 12, 15, 20, 25, 30, 40, 50]);
  const totalDist = multiplier * totalTime;
  // Split distance into two parts
  const dist1 = randInt(Math.floor(totalDist * 0.2), Math.floor(totalDist * 0.8));
  const dist2 = totalDist - dist1;
  const avgSpeed = multiplier;
  const name = pick(NAMES);

  return {
    skillId: 'P6-SPD-02',
    questionFamilyId: familyId,
    prompt: `${name} took ${t1} hour${t1 > 1 ? 's' : ''} to travel ${dist1} km and another ${t2} hour${t2 > 1 ? 's' : ''} to travel ${dist2} km. What was the average speed for the whole journey?`,
    answer: avgSpeed,
    answerType: 'number',
    instructionHint: 'Average speed = Total distance ÷ Total time. Add up the distances and add up the times first.',
    solutionText: `Total distance = ${dist1} + ${dist2} = ${totalDist} km. Total time = ${t1} + ${t2} = ${totalTime} h. Average speed = ${totalDist} ÷ ${totalTime} = ${avgSpeed} km/h.`,
    misconceptionTraps: ['averages_speeds_instead_of_total', 'distance_not_additive_for_average'],
  };
}

// ---------------------------------------------------------------------------
// P6-SPD-03: Speed Word Problems
// ---------------------------------------------------------------------------

function generateSpeedWordProblem(familyId) {
  if (familyId.endsWith('_001')) {
    // Catching up problem
    // Person A leaves at time X, Person B leaves later at a faster speed
    // B catches A when distance_A = distance_B
    // A has a head start of (delay * speedA) km
    // Relative speed = speedB - speedA
    // Time for B to catch up = headStart / (speedB - speedA)
    // Constrain for whole-number minutes
    const nameA = pick(NAMES);
    let nameB = pick(NAMES);
    while (nameB === nameA) nameB = pick(NAMES);

    // Careful construction: speedB - speedA should divide headStart evenly
    const speedA = pick([40, 50, 60]);
    const speedDiff = pick([10, 20, 30, 40]); // speedB - speedA
    const speedB = speedA + speedDiff;
    // Delay in hours: use 0.5 or 1 for clean results
    const delayOptions = [0.5, 1, 1.5, 2];
    const delayHours = pick(delayOptions);
    const headStart = speedA * delayHours;
    const catchUpTimeHours = headStart / speedDiff;
    // catchUpTimeHours must give clean minutes
    const catchUpMinutes = catchUpTimeHours * 60;

    if (catchUpMinutes !== Math.floor(catchUpMinutes) || catchUpMinutes > 300) {
      // Fallback with known good values
      // A at 60 km/h, B at 80 km/h, B leaves 30 min later
      // headStart = 60 * 0.5 = 30 km, relative = 20, time = 30/20 = 1.5 h
      const sA = 60, sB = 80, delay = 0.5;
      const hs = sA * delay; // 30
      const ct = hs / (sB - sA); // 1.5
      const startHour = pick([7, 8, 9]);
      const startMin = 0;
      const bStartMin = delay * 60; // 30
      const meetTime = addMinutesToTime(startHour, bStartMin, ct * 60);
      const meetTimeStr = formatTime(meetTime.hour, meetTime.min);

      return {
        skillId: 'P6-SPD-03',
        questionFamilyId: familyId,
        prompt: `${nameA} left home at ${formatTime(startHour, startMin)} travelling at ${sA} km/h. ${nameB} left the same place at ${formatTime(startHour, bStartMin)} travelling in the same direction at ${sB} km/h. At what time did ${nameB} catch up with ${nameA}?`,
        answer: meetTimeStr,
        answerType: 'text',
        instructionHint: 'Find the head start distance, then use the difference in speeds to find how long it takes to close the gap.',
        solutionText: `Head start = ${sA} × ${delay} = ${hs} km. Speed difference = ${sB} − ${sA} = ${sB - sA} km/h. Time for ${nameB} to catch up = ${hs} ÷ ${sB - sA} = ${ct} h = ${ct * 60} min. ${nameB} catches up at ${meetTimeStr}.`,
        misconceptionTraps: ['subtracts_speeds_for_same_direction', 'time_in_hours_not_minutes'],
      };
    }

    const startHour = pick([7, 8, 9]);
    const startMin = 0;
    const bStartMinFromMidnight = startHour * 60 + startMin + delayHours * 60;
    const bStartHour = Math.floor(bStartMinFromMidnight / 60);
    const bStartMin = bStartMinFromMidnight % 60;
    const meetTime = addMinutesToTime(bStartHour, bStartMin, catchUpMinutes);
    const meetTimeStr = formatTime(meetTime.hour, meetTime.min);

    return {
      skillId: 'P6-SPD-03',
      questionFamilyId: familyId,
      prompt: `${nameA} left home at ${formatTime(startHour, startMin)} travelling at ${speedA} km/h. ${nameB} left the same place at ${formatTime(bStartHour, bStartMin)} travelling in the same direction at ${speedB} km/h. At what time did ${nameB} catch up with ${nameA}?`,
      answer: meetTimeStr,
      answerType: 'text',
      instructionHint: 'Find the head start distance, then use the difference in speeds to find how long it takes to close the gap.',
      solutionText: `Head start = ${speedA} × ${delayHours} = ${headStart} km. Speed difference = ${speedB} − ${speedA} = ${speedDiff} km/h. Time for ${nameB} to catch up = ${headStart} ÷ ${speedDiff} = ${catchUpTimeHours} h = ${catchUpMinutes} min. ${nameB} catches up at ${meetTimeStr}.`,
      misconceptionTraps: ['subtracts_speeds_for_same_direction', 'time_in_hours_not_minutes'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Meeting problem (opposite directions)
    // Two people start from two places, travel towards each other
    // They meet when combined distance = total distance
    // Time = total distance / (speed1 + speed2)
    const nameA = pick(NAMES);
    let nameB = pick(NAMES);
    while (nameB === nameA) nameB = pick(NAMES);
    const placeA = pick(PLACES_A);
    const placeB = pick(PLACES_B);

    const speedA = pick([40, 50, 60, 70, 80]);
    const speedB = pick([30, 40, 50, 60, 70]);
    const combinedSpeed = speedA + speedB;
    // Pick time so total distance is clean
    const timeHours = pick([1, 2, 3]);
    const totalDist = combinedSpeed * timeHours;
    // Ask for distance from A's starting point when they meet
    const distFromA = speedA * timeHours;

    return {
      skillId: 'P6-SPD-03',
      questionFamilyId: familyId,
      prompt: `${placeA} and ${placeB} are ${totalDist} km apart. ${nameA} starts from ${placeA} at ${speedA} km/h and ${nameB} starts from ${placeB} at ${speedB} km/h. They travel towards each other at the same time. How far from ${placeA} do they meet?`,
      answer: distFromA,
      answerType: 'number',
      instructionHint: 'When travelling towards each other, add the speeds. Then find the time to meet, and use it to calculate the distance from one starting point.',
      solutionText: `Combined speed = ${speedA} + ${speedB} = ${combinedSpeed} km/h. Time to meet = ${totalDist} ÷ ${combinedSpeed} = ${timeHours} h. Distance from ${placeA} = ${speedA} × ${timeHours} = ${distFromA} km.`,
      misconceptionTraps: ['subtracts_speeds_for_same_direction', 'uses_wrong_formula_arrangement'],
    };
  }

  // _003: Journey with rest stop
  // Total journey has a driving part, a rest, then more driving
  // Ask for average speed for the whole journey (including rest)
  const name = pick(NAMES);
  const placeA = pick(PLACES_A);
  const placeB = pick(PLACES_B);

  // Driving part 1
  const speed1 = pick([40, 50, 60, 80]);
  const driveTime1 = randInt(1, 3);
  const dist1 = speed1 * driveTime1;

  // Rest stop in minutes (convert to hours for calculation)
  const restMinutes = pick([30, 60]);
  const restHours = restMinutes / 60;

  // Driving part 2
  const speed2 = pick([40, 50, 60, 80]);
  const driveTime2 = randInt(1, 2);
  const dist2 = speed2 * driveTime2;

  const totalDist = dist1 + dist2;
  const totalTimeHours = driveTime1 + restHours + driveTime2;
  const avgSpeed = totalDist / totalTimeHours;

  // If not clean, use fallback
  if (avgSpeed !== Math.floor(avgSpeed)) {
    // drive 120 km in 2h, rest 30 min, drive 60 km in 1h => total 180 km in 3.5h ≈ 51.4 — not clean
    // drive 80 km in 1h, rest 30 min, drive 40 km in 1h => total 120 km in 2.5h = 48 — clean
    const fd1 = 80, ft1 = 1, frest = 30, fd2 = 40, ft2 = 1;
    const fTotalDist = fd1 + fd2;
    const fTotalTime = ft1 + (frest / 60) + ft2;
    const fAvg = fTotalDist / fTotalTime; // 120/2.5 = 48

    return {
      skillId: 'P6-SPD-03',
      questionFamilyId: familyId,
      prompt: `${name} drove from ${placeA} to ${placeB}. He drove ${fd1} km in ${ft1} hour, stopped for ${frest} minutes for a break, then drove another ${fd2} km in ${ft2} hour. What was his average speed for the whole journey, including the rest stop?`,
      answer: fAvg,
      answerType: 'number',
      instructionHint: 'Remember to include the rest stop time in the total time. Average speed = Total distance ÷ Total time.',
      solutionText: `Total distance = ${fd1} + ${fd2} = ${fTotalDist} km. Total time = ${ft1} + 0.5 + ${ft2} = ${fTotalTime} h. Average speed = ${fTotalDist} ÷ ${fTotalTime} = ${fAvg} km/h.`,
      misconceptionTraps: ['ignores_rest_stops_in_time', 'forgets_time_unit_conversion'],
    };
  }

  return {
    skillId: 'P6-SPD-03',
    questionFamilyId: familyId,
    prompt: `${name} drove from ${placeA} to ${placeB}. He drove ${dist1} km in ${driveTime1} hour${driveTime1 > 1 ? 's' : ''}, stopped for ${restMinutes} minutes for a break, then drove another ${dist2} km in ${driveTime2} hour${driveTime2 > 1 ? 's' : ''}. What was his average speed for the whole journey, including the rest stop?`,
    answer: avgSpeed,
    answerType: 'number',
    instructionHint: 'Remember to include the rest stop time in the total time. Average speed = Total distance ÷ Total time.',
    solutionText: `Total distance = ${dist1} + ${dist2} = ${totalDist} km. Total time = ${driveTime1} + ${restHours} + ${driveTime2} = ${totalTimeHours} h. Average speed = ${totalDist} ÷ ${totalTimeHours} = ${avgSpeed} km/h.`,
    misconceptionTraps: ['ignores_rest_stops_in_time', 'forgets_time_unit_conversion'],
  };
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

const generatorsBySkill = {
  'P6-SPD-01': generateSDTBasics,
  'P6-SPD-02': generateAverageSpeed,
  'P6-SPD-03': generateSpeedWordProblem,
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
    visualRequirement: family.visualRequirement || skill.visual,
  };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const q = generateQuestion(skillId, options);
    if (q) questions.push(q);
  }
  return questions;
}

export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) {
    const set = generateQuestionSet(skillId, questionsPerSkill);
    questions.push(...set);
  }
  return questions;
}

export function getSupportedSkillIds() {
  return Object.keys(generatorsBySkill);
}

export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
