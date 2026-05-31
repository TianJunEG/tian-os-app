const DEFAULT_MIN_DAYS_BETWEEN_BASELINE = 45;

function toTs(value) {
  const ts = new Date(value || 0).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function daysSince(value) {
  const ts = toTs(value);
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

function hasValidPlacement(session = null) {
  const result = session?.result || {};
  return Boolean(
    result?.recommendedStartingSkill?.skillId
    || result?.recommendedStartingSkillId
    || result?.nextPracticePayload?.skillId
  );
}

function likelyNeedsRecheck(session = null) {
  const result = session?.result || {};
  if (result?.needsRecheck) return true;
  const weakCount = Array.isArray(result?.weakSkills) ? result.weakSkills.length : 0;
  return weakCount >= 4;
}

export function evaluateDiagnosticReplayPolicy({
  diagnosticPurpose = 'baseline',
  latestCompletedSession = null,
  minDaysBetweenBaseline = DEFAULT_MIN_DAYS_BETWEEN_BASELINE,
} = {}) {
  const purpose = String(diagnosticPurpose || 'baseline').toLowerCase();

  // Manual/assigned paths are always allowed.
  if (purpose === 'recheck' || purpose === 'assigned') {
    return {
      allowed: true,
      reason: 'manual_or_assigned_retake',
      replayGuardApplied: false,
    };
  }

  // Baseline diagnostic is required when no prior completed session exists.
  if (!latestCompletedSession) {
    return {
      allowed: true,
      reason: 'no_prior_diagnostic',
      replayGuardApplied: true,
    };
  }

  // Recovery path: if placement is missing/corrupted, allow baseline rerun.
  if (!hasValidPlacement(latestCompletedSession)) {
    return {
      allowed: true,
      reason: 'placement_missing_or_corrupted',
      replayGuardApplied: true,
    };
  }

  const days = daysSince(latestCompletedSession.completedAt || latestCompletedSession.updatedAt);
  if (days !== null && days >= Number(minDaysBetweenBaseline || DEFAULT_MIN_DAYS_BETWEEN_BASELINE)) {
    return {
      allowed: true,
      reason: 'long_inactivity',
      replayGuardApplied: true,
      daysSinceLatestDiagnostic: days,
    };
  }

  if (likelyNeedsRecheck(latestCompletedSession)) {
    return {
      allowed: true,
      reason: 'progress_recheck_needed',
      replayGuardApplied: true,
      daysSinceLatestDiagnostic: days,
    };
  }

  return {
    allowed: false,
    reason: 'recent_placement_exists',
    replayGuardApplied: true,
    daysSinceLatestDiagnostic: days,
  };
}

export default {
  evaluateDiagnosticReplayPolicy,
};

