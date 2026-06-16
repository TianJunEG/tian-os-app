import { ratioRateSkillGraph } from './ratioRateSkillGraph.js';

// Pure view-model for the student Ratio & Rate learning-path screen. Keeps all the
// status / prerequisite-locking / recommended-next logic out of the JSX so it is
// unit-testable without a DOM. The page is a thin presentational consumer of
// buildRatioRateLearningPathView().
//
// No practice engine exists for ratioRate yet — recommended-next is implemented
// inline: prefer the first weak (needs-review) unlocked skill, then the first
// non-mastered unlocked skill, then fall back to the very first skill overall.

const COMPLETE_STATUSES = new Set(['accurate', 'fluent', 'retained', 'mastered']);
const WEAK_STATUSES = new Set(['needs_review', 'needsreview', 'weak']);

const skills = ratioRateSkillGraph.skills;
const nameById = new Map(skills.map((s) => [s.id, s.name]));

function statusLabelFor(rawStatus, locked) {
  if (locked) return 'Locked';
  const status = String(rawStatus || '').toLowerCase();
  if (status === 'retained') return 'Retained';
  if (status === 'fluent') return 'Fluent';
  if (status === 'accurate' || status === 'mastered') return 'Accurate';
  if (WEAK_STATUSES.has(status)) return 'Needs Review';
  if (status === 'learning') return 'Learning';
  return 'Not Started';
}

// Inline recommended-next: first weak unlocked skill → first non-mastered unlocked skill
// → first skill overall.
function selectNextRatioRatePracticeTarget({ masteredSkillIds, weakSkillIds }) {
  const masteredSet = new Set(masteredSkillIds);
  const weakSet = new Set(weakSkillIds);

  // Build locked set: a skill is locked if it has prerequisites none of which are mastered.
  const lockedSet = new Set();
  for (const skill of skills) {
    const missingPrereqs = skill.prerequisites.filter((p) => !masteredSet.has(p));
    if (!masteredSet.has(skill.id) && missingPrereqs.length > 0) {
      lockedSet.add(skill.id);
    }
  }

  // Prefer weak skills that are not locked.
  for (const skill of skills) {
    if (weakSet.has(skill.id) && !lockedSet.has(skill.id)) {
      return { skillId: skill.id, reason: 'needs_review' };
    }
  }

  // Otherwise first non-mastered unlocked skill.
  for (const skill of skills) {
    if (!masteredSet.has(skill.id) && !lockedSet.has(skill.id)) {
      return { skillId: skill.id, reason: 'next_up' };
    }
  }

  // Fallback: first skill overall.
  return { skillId: skills[0].id, reason: 'fallback' };
}

// masteryRecords: [{ skillId, status }] — skillId is an R-code (R001…R015).
export function buildRatioRateLearningPathView({ masteryRecords = [] } = {}) {
  const statusBySkill = new Map();
  for (const record of masteryRecords) {
    if (record && record.skillId && /^R0\d\d$/.test(record.skillId)) {
      statusBySkill.set(record.skillId, String(record.status || '').toLowerCase());
    }
  }

  const completeSet = new Set();
  const weakSet = new Set();
  for (const [skillId, status] of statusBySkill) {
    if (COMPLETE_STATUSES.has(status)) completeSet.add(skillId);
    else if (WEAK_STATUSES.has(status)) weakSet.add(skillId);
  }

  const recommended = selectNextRatioRatePracticeTarget({
    masteredSkillIds: [...completeSet],
    weakSkillIds: [...weakSet],
  });

  const skillViews = skills.map((skill) => {
    const status = statusBySkill.get(skill.id) || '';
    const complete = completeSet.has(skill.id);
    const missingPrereqs = skill.prerequisites.filter((p) => !completeSet.has(p));
    const locked = !complete && missingPrereqs.length > 0;
    const current = skill.id === recommended.skillId && !locked;
    return {
      id: skill.id,
      name: skill.name,
      strand: skill.strand,
      singaporeLevel: skill.singaporeLevel || [],
      statusLabel: statusLabelFor(status, locked),
      locked,
      current,
      complete,
      needsReview: WEAK_STATUSES.has(status),
      missingPrerequisiteNames: missingPrereqs.map((p) => nameById.get(p) || p),
    };
  });

  // Group by strand in graph order (first appearance wins).
  const strandOrder = [];
  const strandMap = new Map();
  for (const view of skillViews) {
    if (!strandMap.has(view.strand)) {
      strandMap.set(view.strand, []);
      strandOrder.push(view.strand);
    }
    strandMap.get(view.strand).push(view);
  }
  const strands = strandOrder.map((label) => ({ label, skills: strandMap.get(label) }));

  const total = skills.length;
  const mastered = completeSet.size;
  const inProgress = skillViews.filter((v) => !v.complete && statusBySkill.has(v.id)).length;
  const notStarted = total - mastered - inProgress;

  return {
    strands,
    recommendedNext: {
      skillId: recommended.skillId,
      skillName: nameById.get(recommended.skillId) || recommended.skillId,
      reason: recommended.reason,
    },
    progress: {
      total,
      mastered,
      inProgress,
      notStarted,
      percentageMastered: total ? Math.round((mastered / total) * 100) : 0,
    },
  };
}

export default buildRatioRateLearningPathView;
