const STORAGE_KEY = 'tianos.mathpath.domainProgress.v1';

function nowIso() {
  return new Date().toISOString();
}

function toTs(value) {
  const ts = new Date(value || 0).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function daysSince(value) {
  if (!value) return null;
  const ts = toTs(value);
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

function safeReadRoot() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function safeWriteRoot(next) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (_) {
    // best-effort local cache only
  }
}

function composeKey(studentId, domainId) {
  return `${studentId || 'anonymous'}::${domainId || 'fractions'}`;
}

export function getMathPathDomainProgressState(studentId, domainId = 'fractions') {
  const root = safeReadRoot();
  return root[composeKey(studentId, domainId)] || null;
}

export function setMathPathDomainProgressState(studentId, domainId = 'fractions', updates = {}) {
  const root = safeReadRoot();
  const key = composeKey(studentId, domainId);
  const prev = root[key] || {};
  root[key] = {
    ...prev,
    ...updates,
    studentId,
    domainId,
    updatedAt: nowIso(),
  };
  safeWriteRoot(root);
  return root[key];
}

export function clearMathPathDomainProgressState(studentId, domainId = 'fractions') {
  const root = safeReadRoot();
  const key = composeKey(studentId, domainId);
  if (root[key]) {
    delete root[key];
    safeWriteRoot(root);
  }
}

export function deriveNeedsRecheck({
  diagnosticCompleted,
  lastSessionAt,
  weakSkills = [],
  recentMistakeTypes = [],
  forceRecheck = false,
}) {
  if (!diagnosticCompleted) return false;
  if (forceRecheck) return true;
  const inactiveDays = daysSince(lastSessionAt);
  const longInactivity = inactiveDays !== null && inactiveDays >= 45;
  const sustainedStruggle = weakSkills.length >= 4 || recentMistakeTypes.length >= 3;
  return Boolean(longInactivity || sustainedStruggle);
}

export function buildMathPathDomainProgressState({
  studentId,
  domainId = 'fractions',
  latestDiagnostic,
  masteryPayload,
  mistakesPayload,
  topicMapPayload,
  existingState,
}) {
  const placement = latestDiagnostic || {};
  const mastery = masteryPayload || {};
  const map = topicMapPayload || {};
  const mistakes = mistakesPayload || {};
  const records = Array.isArray(mastery.records) ? mastery.records : [];
  const weakSkills = Array.isArray(mastery.weakSkills) ? mastery.weakSkills : [];
  const mostRecentPractice = records
    .map((r) => r.lastPracticedAt)
    .filter(Boolean)
    .sort((a, b) => toTs(b) - toTs(a))[0] || null;
  const diagnosticCompleted = Boolean(placement.hasPlacement);
  const diagnosticCompletedAt = placement.completedAt || existingState?.diagnosticCompletedAt || null;
  const currentSkillId =
    mastery.recommended?.skillId ||
    placement.result?.recommendedStartingSkill?.skillId ||
    existingState?.currentSkillId ||
    null;
  const recentMistakeTypes = [...new Set(
    (mistakes.mistakes || [])
      .slice(0, 25)
      .map((m) => m?.misconceptionTag || m?.mistakeType || '')
      .filter(Boolean)
  )];
  const skillMasteryStatus = records.reduce((acc, r) => {
    if (!r?.skillId) return acc;
    acc[String(r.skillId)] = r.status || 'not_started';
    return acc;
  }, {});

  const totalSkills = (map.topics || []).reduce((sum, t) => sum + Number(t.total || 0), 0);
  const masteredCount = (map.topics || []).reduce((sum, t) => sum + Number(t.masteredCount || 0), 0);
  const unitCompleted = totalSkills > 0 && masteredCount >= totalSkills;
  const needsRecheck = deriveNeedsRecheck({
    diagnosticCompleted,
    lastSessionAt: mostRecentPractice || diagnosticCompletedAt,
    weakSkills,
    recentMistakeTypes,
    forceRecheck: Boolean(existingState?.forceRecheck),
  });

  return {
    studentId,
    domainId,
    diagnosticCompleted,
    diagnosticCompletedAt,
    lastSessionAt: mostRecentPractice || diagnosticCompletedAt || existingState?.lastSessionAt || null,
    currentSkillId,
    skillMasteryStatus,
    weakSkills: weakSkills.map((w) => ({
      skillId: w.skillId || null,
      skillName: w.skillName || '',
      topicName: w.topicName || '',
      status: w.status || 'needs_review',
    })),
    recentMistakeTypes,
    needsRecheck,
    masteryCheckCompleted: Boolean(existingState?.masteryCheckCompleted),
    masteryCheckCompletedAt: existingState?.masteryCheckCompletedAt || null,
    unitCompleted,
    totalSkills,
    masteredCount,
    forceRecheck: Boolean(existingState?.forceRecheck),
    updatedAt: nowIso(),
  };
}

export const mathPathDomainProgressState = {
  getMathPathDomainProgressState,
  setMathPathDomainProgressState,
  clearMathPathDomainProgressState,
  deriveNeedsRecheck,
  buildMathPathDomainProgressState,
};

export default mathPathDomainProgressState;
