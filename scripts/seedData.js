// Pure demo data + builders for the launch-video seed (no DB/deps, so it's unit-testable).
// Engineered so each child lands across readiness bands (green/amber/red rings) on camera.

// Spelling: a 'mastered' word ends on a 3+ correct streak; a 'weak' word's newest attempt is wrong.
export function buildSpellingAttempts(words, { user, child }, base = Date.now() - 12 * 864e5) {
  const docs = [];
  let t = base;
  for (const w of words) {
    const seq = w.kind === 'mastered' ? [true, true, true, true] : [true, false, false];
    for (const correct of seq) { docs.push({ user, child, word: w.word, correct, mode: 'mock', createdAt: new Date(t) }); t += 6 * 60 * 1000; }
  }
  return docs;
}
export function buildResults({ user, child }, specs) {
  return specs.map((s) => ({ user, child, source: s.source, subject: s.subject, topic: s.topic, accuracy: s.accuracy, mastered: !!s.mastered, minutes: 8 }));
}

export const ETHAN_WORDS = [
  { word: 'necessary', kind: 'mastered' }, { word: 'rhythm', kind: 'mastered' }, { word: 'separate', kind: 'mastered' },
  { word: 'definitely', kind: 'mastered' }, { word: 'accommodate', kind: 'mastered' },
  { word: 'embarrass', kind: 'weak' }, { word: 'conscience', kind: 'weak' },
];
export const MAYA_WORDS = [
  { word: 'because', kind: 'mastered' }, { word: 'friend', kind: 'mastered' }, { word: 'school', kind: 'mastered' }, { word: 'people', kind: 'mastered' },
  { word: 'beautiful', kind: 'weak' }, { word: 'different', kind: 'weak' }, { word: 'favourite', kind: 'weak' },
];
export const ETHAN_RESULTS = [
  { source: 'mathpath', subject: 'emath', topic: 'Algebra', accuracy: 90, mastered: true },
  { source: 'mathpath', subject: 'emath', topic: 'Ratio & Proportion', accuracy: 88, mastered: true },
  { source: 'mathpath', subject: 'emath', topic: 'Speed', accuracy: 70 },
  { source: 'math-heuristics', subject: 'emath', topic: 'Linear Equations', accuracy: 55 },
  { source: 'science', subject: 'chem', topic: 'Atomic Structure', accuracy: 80 },
  { source: 'science', subject: 'chem', topic: 'Acids & Bases', accuracy: 52 },
  { source: 'science', subject: 'bio', topic: 'Cell Structure', accuracy: 92, mastered: true },
  { source: 'science', subject: 'bio', topic: 'Transport', accuracy: 88, mastered: true },
  { source: 'science', subject: 'phys', topic: 'Forces', accuracy: 86, mastered: true },
  { source: 'science', subject: 'phys', topic: 'Energy', accuracy: 60 },
];
export const MAYA_RESULTS = [
  { source: 'mathpath', subject: 'emath', topic: 'Fractions', accuracy: 84 },
  { source: 'mathpath', subject: 'emath', topic: 'Multiplication', accuracy: 92, mastered: true },
  { source: 'math-heuristics', subject: 'emath', topic: 'Word Problems', accuracy: 48 },
];
