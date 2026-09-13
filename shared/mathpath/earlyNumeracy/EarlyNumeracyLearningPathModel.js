import { earlyNumeracySkillGraph } from './EarlyNumeracySkillGraph.js';
import { selectNextEarlyNumeracyPracticeTarget } from './EarlyNumeracyPracticeEngine.js';

// Pure view-model for the K2 Early Numeracy learning-path (skill map) screen.
// Mirrors MoneyLearningPathModel. Gentle mode: a skill counts as "complete" once
// it reaches accurate/mastered (no separate fluent/retained ladder for K2).

const COMPLETE_STATUSES = new Set(['accurate', 'fluent', 'retained', 'mastered']);
const WEAK_STATUSES = new Set(['needs_review', 'needsreview', 'weak']);

const skills = earlyNumeracySkillGraph.skills;
const nameById = new Map(skills.map((s) => [s.id, s.name]));

function statusLabelFor(rawStatus, locked) {
  if (locked) return 'Locked';
  const status = String(rawStatus || '').toLowerCase();
  if (COMPLETE_STATUSES.has(status)) return 'Got it!';
  if (WEAK_STATUSES.has(status)) return 'Keep trying';
  if (status === 'learning') return 'Learning';
  return 'Not Started';
}

export function buildEarlyNumeracyLearningPathView({ masteryRecords = [] } = {}) {
  const statusBySkill = new Map();
  for (const record of masteryRecords) {
    if (record && record.skillId) statusBySkill.set(record.skillId, String(record.status || '').toLowerCase());
  }

  const completeSet = new Set();
  const weakSet = new Set();
  for (const [skillId, status] of statusBySkill) {
    if (COMPLETE_STATUSES.has(status)) completeSet.add(skillId);
    else if (WEAK_STATUSES.has(status)) weakSet.add(skillId);
  }

  const recommended = selectNextEarlyNumeracyPracticeTarget({
    masteredSkillIds: [...completeSet],
    weakSkillIds: [...weakSet],
  });

  const skillViews = skills.map((skill) => {
    const status = statusBySkill.get(skill.id) || '';
    const complete = completeSet.has(skill.id);
    const missingPrereqs = (skill.prerequisites || []).filter((p) => !completeSet.has(p));
    const locked = !complete && missingPrereqs.length > 0;
    const current = skill.id === recommended.skillId && !locked;
    return {
      id: skill.id,
      name: skill.name,
      strand: skill.strand || 'Skills',
      singaporeLevel: skill.singaporeLevel || [],
      statusLabel: statusLabelFor(status, locked),
      locked,
      current,
      complete,
      needsReview: WEAK_STATUSES.has(status),
      missingPrerequisiteNames: missingPrereqs.map((p) => nameById.get(p) || p),
    };
  });

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

  return {
    strands,
    progress: {
      total,
      mastered,
      inProgress,
      notStarted: total - mastered - inProgress,
      percentageMastered: total ? Math.round((mastered / total) * 100) : 0,
    },
    recommendedNext: {
      skillId: recommended.skillId,
      skillName: nameById.get(recommended.skillId) || recommended.skillId || 'First skill',
      reason: recommended.reason || 'next_up',
    },
  };
}

export default { buildEarlyNumeracyLearningPathView };
