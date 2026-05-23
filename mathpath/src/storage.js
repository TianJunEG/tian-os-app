// storage.js — learner progress, persisted in the browser, namespaced per curriculum.
//
// A learner can work in more than one framework (e.g. Singapore P1 and Foundational), each
// with its own placement, current rung, mastery and history. The shape mirrors what a backend
// `Progress` document would hold, so swapping localStorage for an API is a localised change.

const KEY = 'mathpath.progress.v2';

export function defaultProgress() {
  return { learner: 'Learner', activeCurriculumId: null, byCurriculum: {} };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch (_) { /* corrupt or unavailable — fall through to default */ }
  return defaultProgress();
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch (_) { /* storage full or blocked — non-fatal for a practice session */ }
  return progress;
}

export function resetProgress() {
  return saveProgress(defaultProgress());
}

// Lazily initialise and return the progress record for one curriculum.
export function curriculumProgress(progress, curriculumId, firstSkillId) {
  if (!progress.byCurriculum[curriculumId]) {
    progress.byCurriculum[curriculumId] = {
      placed: false,
      currentSkillId: firstSkillId,
      mastery: {},  // skillId -> { mastered, bestAccuracy, bestAvgTimeSec, sessions }
      history: [],  // { skillId, at, accuracy, avgTimeSec, mastered }
    };
  }
  return progress.byCurriculum[curriculumId];
}

// Fold a scored session into one curriculum's progress (caller persists the whole object).
export function applySessionResult(cp, score, nextSkillId) {
  const prev = cp.mastery[score.skillId] || { mastered: false, sessions: 0 };
  cp.mastery[score.skillId] = {
    mastered: prev.mastered || score.mastered,
    bestAccuracy: Math.max(prev.bestAccuracy || 0, score.accuracy),
    bestAvgTimeSec: prev.bestAvgTimeSec ? Math.min(prev.bestAvgTimeSec, score.avgTimeSec) : score.avgTimeSec,
    sessions: prev.sessions + 1,
  };

  cp.history.unshift({
    skillId: score.skillId, at: Date.now(),
    accuracy: score.accuracy, avgTimeSec: score.avgTimeSec, mastered: score.mastered,
  });
  cp.history = cp.history.slice(0, 30);

  if (score.mastered && nextSkillId) cp.currentSkillId = nextSkillId;
  return cp;
}

// Pre-mark everything proven during placement.
export function markMastered(cp, skillIds) {
  for (const id of skillIds) {
    const prev = cp.mastery[id] || { sessions: 0 };
    cp.mastery[id] = { ...prev, mastered: true, bestAccuracy: Math.max(prev.bestAccuracy || 0, 1) };
  }
  return cp;
}
