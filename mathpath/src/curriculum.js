// curriculum.js — the skill ladder.
//
// Kumon-style: progress is by *mastery of levels*, not age. Each level (A, B, C, D)
// holds a few ordered skills. A learner climbs one rung at a time and only advances
// when fluent. `spec` drives procedural question generation in generator.js.
// `timeTarget` (seconds/question) lets mastery consider *speed*, not just correctness.

export const LEVELS = [
  { id: 'A', title: 'Addition Foundations' },
  { id: 'B', title: 'Subtraction Foundations' },
  { id: 'C', title: 'Two-Digit Addition' },
  { id: 'D', title: 'Two-Digit Subtraction' },
];

export const SKILLS = [
  // ---- Level A: addition ----
  { id: 'A1', level: 'A', name: 'Adding within 5',
    hint: 'Start at the bigger number and count up.',
    example: '3 + 2 = 5',
    spec: { op: '+', aRange: [1, 4], bRange: [1, 4], maxSum: 5 }, timeTarget: 6 },

  { id: 'A2', level: 'A', name: 'Adding within 10',
    hint: 'Think "how many more to make 10?" then add the rest.',
    example: '6 + 3 = 9',
    spec: { op: '+', aRange: [1, 9], bRange: [1, 9], maxSum: 10 }, timeTarget: 7 },

  { id: 'A3', level: 'A', name: 'Adding within 20',
    hint: 'Make a 10 first, e.g. 8 + 5 → 8 + 2 + 3 = 15.',
    example: '8 + 7 = 15',
    spec: { op: '+', aRange: [2, 9], bRange: [2, 9], minSum: 11, maxSum: 18 }, timeTarget: 8 },

  // ---- Level B: subtraction ----
  { id: 'B1', level: 'B', name: 'Subtracting within 10',
    hint: 'Count back from the first number.',
    example: '9 − 4 = 5',
    spec: { op: '-', aRange: [2, 10], bRange: [1, 9] }, timeTarget: 7 },

  { id: 'B2', level: 'B', name: 'Subtracting within 20',
    hint: 'Take away down to the nearest 10 first, then the rest.',
    example: '15 − 7 = 8',
    spec: { op: '-', aRange: [11, 18], bRange: [2, 9] }, timeTarget: 9 },

  // ---- Level C: two-digit addition ----
  { id: 'C1', level: 'C', name: '2-digit + 1-digit (no carrying)',
    hint: 'Add the ones, then bring down the tens.',
    example: '42 + 5 = 47',
    spec: { op: '+', aRange: [10, 89], bRange: [1, 9], carry: false }, timeTarget: 10 },

  { id: 'C2', level: 'C', name: '2-digit + 2-digit (no carrying)',
    hint: 'Add the ones column, then the tens column.',
    example: '34 + 25 = 59',
    spec: { op: '+', aRange: [10, 80], bRange: [10, 80], carry: false, maxSum: 99 }, timeTarget: 12 },

  { id: 'C3', level: 'C', name: '2-digit + 2-digit (with carrying)',
    hint: 'When the ones add to 10 or more, carry 1 ten into the next column.',
    example: '48 + 37 = 85',
    spec: { op: '+', aRange: [15, 84], bRange: [15, 84], carry: true, maxSum: 99 }, timeTarget: 15 },

  // ---- Level D: two-digit subtraction ----
  { id: 'D1', level: 'D', name: '2-digit − 1-digit (no borrowing)',
    hint: 'Subtract the ones, then bring down the tens.',
    example: '47 − 5 = 42',
    spec: { op: '-', aRange: [12, 99], bRange: [1, 9], borrow: false }, timeTarget: 11 },

  { id: 'D2', level: 'D', name: '2-digit − 2-digit (no borrowing)',
    hint: 'Subtract the ones column, then the tens column.',
    example: '58 − 23 = 35',
    spec: { op: '-', aRange: [20, 99], bRange: [10, 79], borrow: false }, timeTarget: 13 },

  { id: 'D3', level: 'D', name: '2-digit − 2-digit (with borrowing)',
    hint: 'When the top ones digit is too small, borrow 1 ten and regroup.',
    example: '52 − 27 = 25',
    spec: { op: '-', aRange: [21, 99], bRange: [12, 89], borrow: true }, timeTarget: 16 },
];

export const QUESTIONS_PER_SESSION = 10;
export const MASTERY_ACCURACY = 0.9;   // fraction of first-try-correct needed
export const SPEED_GRACE = 1.5;        // allow up to timeTarget * grace and still pass

export function getSkill(id) { return SKILLS.find((s) => s.id === id) || null; }
export function skillIndex(id) { return SKILLS.findIndex((s) => s.id === id); }
export function getLevel(id) { return LEVELS.find((l) => l.id === id) || null; }
export function skillsInLevel(levelId) { return SKILLS.filter((s) => s.level === levelId); }

export function nextSkillId(id) {
  const i = skillIndex(id);
  return i >= 0 && i < SKILLS.length - 1 ? SKILLS[i + 1].id : null;
}

export function skillLabel(id) {
  const s = getSkill(id);
  if (!s) return '';
  return `Level ${s.level} · ${s.name}`;
}
