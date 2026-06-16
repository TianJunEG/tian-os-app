import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';

/**
 * Recheck-gated mastery evidence.
 *
 * Mastery is NEVER inferred from practice accuracy or attempt count. A fractions skill is only
 * promoted to the `retained` state (which is what parent/student/teacher views count as
 * "mastered") when the student passes a recheck diagnostic on that skill.
 *
 * A recheck skill is considered passed when its per-skill snapshot score meets the pass
 * threshold (the same threshold the student-facing recheck summary uses for `isSecure`).
 */
export const RECHECK_PASS_THRESHOLD = 70;

const asArray = (value) => (Array.isArray(value) ? value : []);

function isRecheckSession(session = {}) {
  return String(session.diagnosticPurpose || '') === 'recheck';
}

/**
 * Returns the skill ids the student passed in a completed recheck session.
 */
export function selectPassingRecheckSkills(session = {}) {
  if (!isRecheckSession(session)) return [];
  return asArray(session.perSkillSnapshot)
    .filter((row) => {
      const score = Number(row?.score);
      const answered = Number(row?.questionsAnswered ?? 0);
      return Boolean(row?.skillId) && answered > 0 && Number.isFinite(score) && score >= RECHECK_PASS_THRESHOLD;
    })
    .map((row) => String(row.skillId).toUpperCase());
}

/**
 * Promotes passed recheck skills to the retained (mastered) state. No-op for non-recheck sessions
 * or when no skill passed. Applies to all registered domains, not just fractions.
 * Returns the skills promoted.
 */
export async function applyRecheckMasteryEvidence({ session = {} } = {}) {
  const studentId = String(session.studentId || '');
  const domainId = String(session.domainId || 'fractions');
  if (!studentId || !isRecheckSession(session)) {
    return { applied: false, skillIds: [] };
  }
  const skillIds = [...new Set(selectPassingRecheckSkills(session))];
  if (!skillIds.length) {
    return { applied: false, skillIds: [] };
  }
  const now = new Date();
  await Promise.all(skillIds.map((skillId) =>
    MathPathStudentSkillState.findOneAndUpdate(
      { studentId, domainId, skillId },
      {
        $set: {
          status: 'retained',
          retentionStatus: 'retained',
          retainedAt: now,
          masteredAt: now,
          lastReviewedAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  ));
  return { applied: true, skillIds };
}

export default {
  RECHECK_PASS_THRESHOLD,
  selectPassingRecheckSkills,
  applyRecheckMasteryEvidence,
};
