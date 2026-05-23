// storage.js — learner progress, persisted in the browser.
//
// Thin slice: a single local learner profile in localStorage. The shape mirrors what a
// backend `Progress` document would hold later, so swapping in an API is a localised change.

const KEY = 'mathpath.progress.v1';

export function defaultProgress() {
  return {
    learner: 'Learner',
    placed: false,
    currentSkillId: 'A1',
    mastery: {},  // skillId -> { mastered, bestAccuracy, bestAvgTimeSec, sessions }
    history: [],  // { skillId, at, accuracy, avgTimeSec, mastered }
  };
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

// Fold a scored session into progress: update best stats, mark mastery, advance the rung.
export function applySessionResult(progress, score, nextSkillId) {
  const prev = progress.mastery[score.skillId] || { mastered: false, sessions: 0 };
  progress.mastery[score.skillId] = {
    mastered: prev.mastered || score.mastered,
    bestAccuracy: Math.max(prev.bestAccuracy || 0, score.accuracy),
    bestAvgTimeSec: prev.bestAvgTimeSec
      ? Math.min(prev.bestAvgTimeSec, score.avgTimeSec)
      : score.avgTimeSec,
    sessions: prev.sessions + 1,
  };

  progress.history.unshift({
    skillId: score.skillId,
    at: Date.now(),
    accuracy: score.accuracy,
    avgTimeSec: score.avgTimeSec,
    mastered: score.mastered,
  });
  progress.history = progress.history.slice(0, 30);

  if (score.mastered && nextSkillId) {
    progress.currentSkillId = nextSkillId;
  }
  return saveProgress(progress);
}

// Used by placement to pre-mark everything proven in the probe.
export function markMastered(progress, skillIds) {
  for (const id of skillIds) {
    const prev = progress.mastery[id] || { sessions: 0 };
    progress.mastery[id] = { ...prev, mastered: true, bestAccuracy: Math.max(prev.bestAccuracy || 0, 1) };
  }
  return progress;
}
