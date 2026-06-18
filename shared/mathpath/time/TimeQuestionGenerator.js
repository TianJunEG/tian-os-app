import { getSkill } from './TimeSkillGraph.js';
import { getQuestionFamily, getQuestionFamiliesBySkill } from './TimeQuestionFamilies.js';

// MathPath — Time question generator.
//
// Rebuilt for question quality (see MATHPATH_QUESTION_QUALITY_AUDIT.md). Key
// invariants:
//   • All clock times are held as MINUTES SINCE MIDNIGHT (0–1439) and rendered
//     via fmt12()/fmt24(); durations via fmtDur(). No concatenated integers like
//     "905", no impossible "20:15" clock faces or "70 minutes".
//   • Elapsed time is computed by real subtraction with hour-boundary carry and
//     midnight wrap — never fabricated.
//   • Distractors encode the family's misconception (base-10, AM/PM flip, …).
//   • Worked solutions show the method; coin-style clock diagrams are emitted
//     for the "read the clock" skills.
//   • checkTimeAnswer compares by MEANING: "9:30", "9.30", "0930", "9:30 a.m."
//     and "2 h 35 min" / "155 min" / "155" all normalise correctly.

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────────────
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

// ── Time formatting (minutes since midnight) ─────────────────────────────────
function pad2(n) { return String(n).padStart(2, '0'); }
function wrap(min) { return ((min % 1440) + 1440) % 1440; }
function fmt12(min) {
  const t = wrap(min);
  const h = Math.floor(t / 60), m = t % 60;
  const period = h < 12 ? 'a.m.' : 'p.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad2(m)} ${period}`;
}
function fmtClock(h12, m) { return `${h12}:${pad2(m)}`; } // plain clock face, no period
function fmt24(min) { const t = wrap(min); return `${pad2(Math.floor(t / 60))}${pad2(t % 60)}`; }
function fmtDur(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

// ── Question envelope builders ───────────────────────────────────────────────
function shortAnswer({ family, prompt, answerDisplay, acceptedAnswers, solutionSteps, misconceptionTag, difficulty, mode, diagram }) {
  return {
    id: `${family.id}#${mode}`,
    skillId: family.skillId,
    questionFamilyId: family.id,
    type: 'short_answer',
    prompt,
    choices: [],
    answer: { display: answerDisplay, value: answerDisplay },
    acceptedAnswers: acceptedAnswers && acceptedAnswers.length ? acceptedAnswers : [answerDisplay],
    solutionSteps,
    misconceptionTag,
    difficulty,
    mode,
    workingRequired: family.workingRequired,
    generatorKind: family.generatorKind,
    ...(diagram ? { diagram } : {}),
  };
}
function mcq({ family, prompt, answerDisplay, distractors, solutionSteps, misconceptionTag, difficulty, mode, rng, diagram }) {
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
    ...(diagram ? { diagram } : {}),
  };
}

const FIVE_MIN = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// ── TM001 — Telling time to the hour and half-hour (P1) ──────────────────────
function tm001Parts(rng) {
  const h = rint(rng, 1, 12);
  const m = pick(rng, [0, 30]);
  return { h, m };
}
function tm001Steps(h, m) {
  return [
    `The short (hour) hand is ${m === 0 ? `on the ${h}` : `between ${h} and ${h % 12 + 1}`}.`,
    m === 0 ? 'The long (minute) hand points to 12 — it is exactly o\'clock.'
            : 'The long (minute) hand points to 6 — it is half past.',
    `The time is ${fmtClock(h, m)}.`,
  ];
}
function monClockDiagram(h, m) { return { kind: 'clock', hour: h, minute: m }; }
function timTellHour(family, rng) {
  const { h, m } = tm001Parts(rng);
  return shortAnswer({
    family, prompt: 'What time does the clock show? (Write it as h:mm, e.g. 7:30)',
    answerDisplay: fmtClock(h, m), acceptedAnswers: [fmtClock(h, m)],
    solutionSteps: tm001Steps(h, m), misconceptionTag: 'tim/hour-half',
    difficulty: family.difficulty, mode: 'practice', diagram: monClockDiagram(h, m),
  });
}
function timTellHourMCQ(family, rng) {
  const { h, m } = tm001Parts(rng);
  const nextH = h % 12 + 1;
  const distractors = [
    fmtClock(nextH, m),              // read the hour hand as the next hour
    fmtClock(h, m === 0 ? 30 : 0),   // hour/half-hour confusion
    fmtClock(nextH, m === 0 ? 30 : 0),
  ];
  return mcq({
    family, prompt: 'What time does the clock show?',
    answerDisplay: fmtClock(h, m), distractors,
    solutionSteps: tm001Steps(h, m), misconceptionTag: 'tim/hour-half',
    difficulty: family.difficulty, mode: 'practice', rng, diagram: monClockDiagram(h, m),
  });
}

// ── TM002 — Telling time to the minute (P2) ──────────────────────────────────
function tm002Parts(rng) {
  const h = rint(rng, 1, 12);
  const m = pick(rng, FIVE_MIN.filter((x) => x !== 0));
  return { h, m };
}
function tm002Steps(h, m) {
  return [
    `The short (hour) hand is just past ${h}.`,
    `The long (minute) hand points to ${m / 5} on the clock — that is ${m} minutes (count in fives).`,
    `The time is ${fmtClock(h, m)}.`,
  ];
}
function timTellMinutes(family, rng) {
  const { h, m } = tm002Parts(rng);
  return shortAnswer({
    family, prompt: 'What time does the clock show? (Write it as h:mm, e.g. 7:20)',
    answerDisplay: fmtClock(h, m), acceptedAnswers: [fmtClock(h, m)],
    solutionSteps: tm002Steps(h, m), misconceptionTag: 'tim/minute-skip',
    difficulty: family.difficulty, mode: 'practice', diagram: monClockDiagram(h, m),
  });
}
function timTellMinutesMCQ(family, rng) {
  const { h, m } = tm002Parts(rng);
  const distractors = [
    fmtClock(h, m / 5),               // read the minute-hand number as the minutes
    fmtClock(h, (m + 5) % 60),        // miscount by one five-minute mark
    fmtClock(h, (m + 55) % 60),
  ];
  return mcq({
    family, prompt: 'What time does the clock show?',
    answerDisplay: fmtClock(h, m), distractors,
    solutionSteps: tm002Steps(h, m), misconceptionTag: 'tim/minute-skip',
    difficulty: family.difficulty, mode: 'practice', rng, diagram: monClockDiagram(h, m),
  });
}

// ── TM003 — Converting time units (P3) ───────────────────────────────────────
// variant cycles three conversion shapes.
function tm003Build(rng, variant) {
  const kind = variant % 3;
  if (kind === 0) {
    const h = rint(rng, 2, 9);
    return {
      prompt: `${h} hours = ____ minutes`,
      answer: h * 60,
      steps: ['1 hour = 60 minutes.', `${h} × 60 = ${h * 60} minutes.`],
      distractors: [h * 100, h * 10, h * 6],   // base-10 slips
    };
  }
  if (kind === 1) {
    const m = rint(rng, 2, 9);
    return {
      prompt: `${m} minutes = ____ seconds`,
      answer: m * 60,
      steps: ['1 minute = 60 seconds.', `${m} × 60 = ${m * 60} seconds.`],
      distractors: [m * 100, m * 10, m * 6],
    };
  }
  const h = rint(rng, 1, 4);
  const m = pick(rng, [10, 15, 20, 30, 40, 45]);
  return {
    prompt: `${h} h ${m} min = ____ minutes`,
    answer: h * 60 + m,
    steps: [`${h} hour(s) = ${h * 60} minutes.`, `${h * 60} + ${m} = ${h * 60 + m} minutes.`],
    distractors: [h * 100 + m, h * 10 + m, h + m],  // treated 1 h as 100 / 10
  };
}
function timConvert(family, rng, variant) {
  const q = tm003Build(rng, variant);
  return shortAnswer({
    family, prompt: q.prompt, answerDisplay: String(q.answer),
    acceptedAnswers: [String(q.answer)], solutionSteps: q.steps,
    misconceptionTag: 'tim/base-10-error', difficulty: family.difficulty, mode: 'practice',
  });
}
function timConvertWord(family, rng, variant) {
  const q = tm003Build(rng, variant);
  return mcq({
    family, prompt: q.prompt, answerDisplay: String(q.answer),
    distractors: q.distractors.map(String), solutionSteps: q.steps,
    misconceptionTag: 'tim/base-10-error', difficulty: family.difficulty, mode: 'practice', rng,
  });
}

// ── TM004 — The 24-hour clock (P4) ───────────────────────────────────────────
function tm004Build(rng, variant) {
  const m = pick(rng, [0, 5, 15, 20, 30, 40, 45, 50]);
  if (variant % 2 === 0) {
    // 12-hour → 24-hour
    const h = rint(rng, 1, 11);
    const pm = rng() < 0.5;
    const min24 = (pm ? h + 12 : h) * 60 + m;
    const ans = fmt24(min24);
    return {
      prompt: `Write ${h}:${pad2(m)} ${pm ? 'p.m.' : 'a.m.'} in 24-hour time.`,
      answer: ans,
      steps: pm
        ? ['For p.m. times, add 12 to the hour.', `${h} + 12 = ${h + 12}, so ${h}:${pad2(m)} p.m. = ${ans}.`]
        : ['For a.m. times, keep the hour and write it as two digits.', `${h}:${pad2(m)} a.m. = ${ans}.`],
      distractors: [
        fmt24(wrap(min24 + 720)),   // forgot/over-applied the +12 (a.m./p.m. flip)
        fmt24(wrap(min24 + 60)),    // off by one hour
        fmt24(wrap(min24 + 5)),     // off by five minutes
      ],
    };
  }
  // 24-hour → 12-hour
  const H = rint(rng, 1, 23);
  const min24 = H * 60 + m;
  const ans = fmt12(min24);
  return {
    prompt: `Write ${fmt24(min24)} in 12-hour time (include a.m. or p.m.).`,
    answer: ans,
    steps: H >= 12
      ? ['For 1300–2300, subtract 12 and write p.m.', `${H} − 12 = ${H === 12 ? 12 : H - 12}, so ${fmt24(min24)} = ${ans}.`]
      : ['For 0000–1159, the hour is the same and the time is a.m.', `${fmt24(min24)} = ${ans}.`],
    distractors: [
      fmt12(wrap(min24 + 720)),   // flipped a.m./p.m.
      fmt12(wrap(min24 + 60)),    // off by one hour
      fmt12(wrap(min24 + 5)),     // off by five minutes
    ],
  };
}
function tim24hr(family, rng, variant) {
  const q = tm004Build(rng, variant);
  return shortAnswer({
    family, prompt: q.prompt, answerDisplay: q.answer, acceptedAnswers: [q.answer],
    solutionSteps: q.steps, misconceptionTag: 'mea/24hr-convert',
    difficulty: family.difficulty, mode: 'practice',
  });
}
function tim24hrMCQ(family, rng, variant) {
  const q = tm004Build(rng, variant);
  return mcq({
    family, prompt: q.prompt, answerDisplay: q.answer, distractors: q.distractors,
    solutionSteps: q.steps, misconceptionTag: 'mea/24hr-convert',
    difficulty: family.difficulty, mode: 'practice', rng,
  });
}

// ── TM005 — Duration and time intervals (P5) ─────────────────────────────────
function tm005Build(rng, variant) {
  const startH = rint(rng, 6, 21);
  const startM = pick(rng, [0, 5, 10, 15, 20, 30, 40, 45, 50]);
  const start = startH * 60 + startM;
  if (variant % 2 === 0) {
    // start + duration → end time (may cross the hour or midnight)
    const durH = rint(rng, 1, 4);
    const durM = pick(rng, [5, 10, 15, 20, 30, 40, 45, 50]);
    const dur = durH * 60 + durM;
    const end = wrap(start + dur);
    return {
      prompt: `A show starts at ${fmt12(start)} and lasts ${fmtDur(dur)}. What time does it end?`,
      answer: fmt12(end),
      steps: [
        `Add the hours first: ${fmt12(start)} + ${durH} h = ${fmt12(start + durH * 60)}.`,
        `Then add the minutes: + ${durM} min = ${fmt12(end)} (carry an hour if the minutes pass 60).`,
      ],
      distractors: [
        fmt12(wrap(end + 60)),           // off by one hour
        fmt12(wrap(end + 720)),          // a.m./p.m. flip
        // base-60 slip: added the minutes without carrying the extra hour
        fmt12(wrap(start + durH * 60 + ((startM + durM) % 60))),
      ],
    };
  }
  // elapsed time between two clock times
  const diff = rint(rng, 8, 59) + 60 * rint(rng, 0, 4); // 8 min … ~5 h
  const end = wrap(start + diff);
  return {
    prompt: `How much time passes from ${fmt12(start)} to ${fmt12(end)}?`,
    answer: fmtDur(diff),
    steps: [
      `From ${fmt12(start)} to ${fmt12(start + Math.floor(diff / 60) * 60)} is ${Math.floor(diff / 60)} h.`,
      `Then to ${fmt12(end)} is ${diff % 60} min more, so ${fmtDur(diff)} in total.`,
    ],
    distractors: [
      fmtDur(diff + 60),                       // counted an extra hour
      fmtDur(Math.max(5, diff - 60)),          // one hour short
      fmtDur(diff + 5),                         // miscounted by one five-minute step
    ],
  };
}
function timDuration(family, rng, variant) {
  const q = tm005Build(rng, variant);
  return shortAnswer({
    family, prompt: q.prompt, answerDisplay: q.answer, acceptedAnswers: [q.answer],
    solutionSteps: q.steps, misconceptionTag: 'mea/time-base-60',
    difficulty: family.difficulty, mode: 'practice',
  });
}
function timDurationWord(family, rng, variant) {
  const q = tm005Build(rng, variant);
  return mcq({
    family, prompt: q.prompt, answerDisplay: q.answer, distractors: q.distractors,
    solutionSteps: q.steps, misconceptionTag: 'mea/time-base-60',
    difficulty: family.difficulty, mode: 'practice', rng,
  });
}

// ── Word-problem families (_003): one per skill, real-world contexts ─────────

// TM001W — Translate a spoken time phrase to h:mm
function tm001Word(family, rng) {
  const h = rint(rng, 1, 12);
  const halfPast = rng() < 0.5;
  const m = halfPast ? 30 : 0;
  const context = pick(rng, ['library', 'bakery', 'sports hall', 'pool', 'clinic']);
  const action = pick(rng, ['opens', 'closes', 'starts', 'ends']);
  const timePhrase = halfPast ? `half past ${h}` : `${h} o'clock`;
  const ans = fmtClock(h, m);
  return shortAnswer({
    family,
    prompt: `A ${context} ${action}s at ${timePhrase} in the morning. Write this time as h:mm.`,
    answerDisplay: ans, acceptedAnswers: [ans],
    solutionSteps: [
      halfPast
        ? `"Half past ${h}" means 30 minutes after the ${h} o'clock mark.`
        : `"${h} o'clock" means exactly on the hour — 0 minutes past ${h}.`,
      `The time is ${ans}.`,
    ],
    misconceptionTag: 'tim/hour-half', difficulty: family.difficulty, mode: 'practice',
  });
}

// TM002W — Translate a five-minute "X past/to Y" phrase to h:mm
function tm002Word(family, rng) {
  const h = rint(rng, 1, 12);
  const m = pick(rng, FIVE_MIN.filter((x) => x !== 0));
  const pastTo = m <= 30 ? 'past' : 'to';
  const minRef = m <= 30 ? m : 60 - m;
  const hRef = m <= 30 ? h : (h % 12) + 1;
  const timePhrase = m === 30
    ? `half past ${h}`
    : `${minRef} minutes ${pastTo} ${hRef}`;
  const context = pick(rng, ['school bell', 'alarm clock', 'library clock', 'station clock']);
  const ans = fmtClock(h, m);
  return shortAnswer({
    family,
    prompt: `A ${context} shows ${timePhrase}. Write this time as h:mm.`,
    answerDisplay: ans, acceptedAnswers: [ans],
    solutionSteps: [
      m === 30
        ? `"Half past ${h}" means 30 minutes after ${h}:00.`
        : m <= 30
          ? `"${minRef} minutes past ${hRef}" — the hour is ${h} and the minutes are ${m}.`
          : `"${minRef} minutes to ${hRef}" means ${60 - minRef} minutes are gone, so the time is ${h}:${pad2(m)}.`,
      `The time is ${ans}.`,
    ],
    misconceptionTag: 'tim/minute-skip', difficulty: family.difficulty, mode: 'practice',
  });
}

// TM003W — Time-unit conversion embedded in a real context
function tm003Word(family, rng, variant) {
  const kind = variant % 3;
  let prompt, ans, steps;
  if (kind === 0) {
    const h = rint(rng, 1, 4);
    const ctx = pick(rng, ['flight', 'road trip', 'film', 'match', 'concert']);
    ans = h * 60;
    prompt = `A ${ctx} lasts ${h} hour${h > 1 ? 's' : ''}. How many minutes is that?`;
    steps = ['1 hour = 60 minutes.', `${h} × 60 = ${ans} minutes.`];
  } else if (kind === 1) {
    const m2 = rint(rng, 2, 9);
    const ctx = pick(rng, ['sprint', 'warm-up', 'quiz', 'song', 'drill']);
    ans = m2 * 60;
    prompt = `A ${ctx} lasts ${m2} minutes. How many seconds is that?`;
    steps = ['1 minute = 60 seconds.', `${m2} × 60 = ${ans} seconds.`];
  } else {
    const h = rint(rng, 1, 4), m2 = pick(rng, [10, 15, 20, 30, 40, 45]);
    const ctx = pick(rng, ['bus ride', 'hike', 'workshop', 'swim session']);
    ans = h * 60 + m2;
    prompt = `A ${ctx} takes ${h} h ${m2} min. How many minutes is that in total?`;
    steps = [`${h} hour${h > 1 ? 's' : ''} = ${h * 60} minutes.`, `${h * 60} + ${m2} = ${ans} minutes.`];
  }
  return shortAnswer({
    family, prompt, answerDisplay: String(ans), acceptedAnswers: [String(ans)],
    solutionSteps: steps, misconceptionTag: 'tim/base-10-error',
    difficulty: family.difficulty, mode: 'practice',
  });
}

// TM004W — 24-hour clock embedded in a transport/timetable context
function tm004Word(family, rng, variant) {
  const ctx = pick(rng, ['bus timetable', 'train schedule', 'flight board', 'school timetable']);
  const m = pick(rng, [0, 5, 15, 20, 30, 40, 45, 50]);
  let prompt, ans, steps;
  if (variant % 2 === 0) {
    const h = rint(rng, 1, 11);
    const pm = rng() < 0.5;
    const min24 = (pm ? h + 12 : h) * 60 + m;
    ans = fmt24(min24);
    prompt = `A ${ctx} shows a departure at ${h}:${pad2(m)} ${pm ? 'p.m.' : 'a.m.'}. Write this time in 24-hour format.`;
    steps = pm
      ? [`For p.m., add 12 to the hour: ${h} + 12 = ${h + 12}.`, `The 24-hour time is ${ans}.`]
      : [`For a.m., write the hour with two digits.`, `The 24-hour time is ${ans}.`];
  } else {
    const H = rint(rng, 1, 23);
    const min24 = H * 60 + m;
    ans = fmt12(min24);
    prompt = `A ${ctx} shows ${fmt24(min24)}. Write this time in 12-hour format (include a.m. or p.m.).`;
    steps = H >= 12
      ? [`For 1300–2300, subtract 12 and write p.m.: ${H} − 12 = ${H === 12 ? 12 : H - 12}.`, `The 12-hour time is ${ans}.`]
      : [`For 0000–1159, keep the hour and write a.m.`, `The 12-hour time is ${ans}.`];
  }
  return shortAnswer({
    family, prompt, answerDisplay: ans, acceptedAnswers: [ans],
    solutionSteps: steps, misconceptionTag: 'mea/24hr-convert',
    difficulty: family.difficulty, mode: 'practice',
  });
}

// TM005W — Multi-step: find actual travel time excluding a mid-journey stop
function tm005Multi(family, rng) {
  const startH = rint(rng, 7, 17);
  const startM = pick(rng, [0, 5, 10, 15, 20, 30, 40, 45, 50]);
  const travelMin = rint(rng, 40, 180);
  const stopMin = pick(rng, [10, 15, 20, 30]);
  const start = startH * 60 + startM;
  const end = wrap(start + travelMin + stopMin);
  const vehicle = pick(rng, ['bus', 'train', 'ferry', 'coach']);
  const ans = fmtDur(travelMin);
  return shortAnswer({
    family,
    prompt: `A ${vehicle} departs at ${fmt12(start)} and arrives at ${fmt12(end)}. During the journey it stops for ${stopMin} minutes. How long is the actual travel time, excluding the stop?`,
    answerDisplay: ans, acceptedAnswers: [ans],
    solutionSteps: [
      `Total time from ${fmt12(start)} to ${fmt12(end)} = ${fmtDur(travelMin + stopMin)}.`,
      `Travel time = ${fmtDur(travelMin + stopMin)} − ${stopMin} min = ${ans}.`,
    ],
    misconceptionTag: 'mea/time-base-60', difficulty: family.difficulty, mode: 'practice',
  });
}

const GENERATORS = {
  timTellHour, timTellHourMCQ,
  timTellMinutes, timTellMinutesMCQ,
  timConvert, timConvertWord,
  tim24hr, tim24hrMCQ,
  timDuration, timDurationWord,
  timTellHourWord: tm001Word,
  timTellMinutesWord: tm002Word,
  timConvertContext: tm003Word,
  tim24hrSchedule: tm004Word,
  timDurationMulti: tm005Multi,
};

export function generateTimeQuestionSet({ skillId, count = 6, mode = 'practice', sessionSalt = '' }) {
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return [];
  const questions = [];
  const seenPrompts = new Set();
  let variant = 0;
  let fi = 0;
  const maxAttempts = count * 5;
  while (questions.length < count && variant < maxAttempts) {
    const family = families[fi % families.length];
    const rng = makeRng(`${skillId}-${family.id}-${variant}-${sessionSalt}`);
    const gen = GENERATORS[family.generatorKind];
    if (gen) {
      const q = gen(family, rng, variant);
      const dedupKey = q.prompt + '|||' + (q.answer?.display ?? q.answer);
      if (!seenPrompts.has(dedupKey) || variant >= count * 3) {
        seenPrompts.add(dedupKey);
        questions.push(q);
        fi++;
      }
    }
    variant++;
  }
  return questions;
}

// Normalise a time/duration/number answer so equivalent notations compare equal:
//   clock times → "T<minutes since midnight>"  ("9:30", "0930", "9:30 a.m.")
//   durations / quantities → "D<total>"        ("2 h 35 min", "155 min", "155")
function normalizeTime(raw) {
  let s = String(raw).trim().toLowerCase();
  const pm = /p\.?\s?m/.test(s);
  const am = /a\.?\s?m/.test(s);
  let core = s.replace(/[ap]\.?\s?m\.?/g, '').trim();
  core = core.replace(/\.$/, '');                  // drop a trailing full stop
  const colon = /^(\d{1,2})[:.](\d{2})$/.exec(core.replace(/\s/g, ''));
  if (colon) {
    let h = +colon[1]; const m = +colon[2];
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    return `T${wrap(h * 60 + m)}`;
  }
  const four = /^(\d{2})(\d{2})$/.exec(core.replace(/\s/g, ''));
  if (four && !am && !pm) {
    const h = +four[1], m = +four[2];
    if (h < 24 && m < 60) return `T${h * 60 + m}`;
  }
  let total = 0; let matched = false;
  const hm = /(\d+)\s*h(?:ours?|rs?)?/.exec(core);
  if (hm) { total += (+hm[1]) * 60; matched = true; }
  const mm = /(\d+)\s*m(?:in(?:ute)?s?)?\b/.exec(core);
  if (mm) { total += (+mm[1]); matched = true; }
  if (matched) return `D${total}`;
  const num = /(\d+)/.exec(core);
  if (num) return `D${+num[1]}`;
  return core;
}

export function checkTimeAnswer({ question, studentResponse }) {
  if (!question || studentResponse == null) return { correct: false };
  const expected = String(question.answer?.display ?? question.answer ?? '');
  return { correct: normalizeTime(studentResponse) === normalizeTime(expected) };
}

export default { generateTimeQuestionSet, checkTimeAnswer };
