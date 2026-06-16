import { operationsSkillGraph } from './OperationsSkillGraph.js';
import { selectNextOperationsPracticeTarget } from './OperationsPracticeEngine.js';

// Pure view-model for the student Operations learning-path screen.
// Mirrors decimalsLearningPathModel.js exactly — no DOM, no React, fully unit-testable.

const COMPLETE_STATUSES = new Set(['accurate', 'fluent', 'retained', 'mastered']);
const WEAK_STATUSES = new Set(['needs_review', 'needsreview', 'weak']);

const skills = operationsSkillGraph.skills;
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

export function buildOperationsLearningPathView({ masteryRecords = [] } = {}) {
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

  const recommended = selectNextOperationsPracticeTarget({
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

export default { buildOperationsLearningPathView };
