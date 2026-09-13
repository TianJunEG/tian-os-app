import { earlyNumeracySkillGraph, getPrerequisites } from './EarlyNumeracySkillGraph.js';

// Gentle next-skill selection for K2 Explore mode: revisit a weak skill first,
// otherwise advance to the earliest not-yet-mastered skill whose prerequisites
// are met (curriculum order). No fluency/retention gating.
export function selectNextEarlyNumeracyPracticeTarget({ masteredSkillIds = [], weakSkillIds = [] } = {}) {
  const mastered = new Set(masteredSkillIds);
  const weak = new Set(weakSkillIds);
  const order = earlyNumeracySkillGraph.skillIds;

  const firstWeak = order.find((id) => weak.has(id) && !mastered.has(id));
  if (firstWeak) return { skillId: firstWeak, reason: 'review_weak' };

  const ready = order.find((id) => {
    if (mastered.has(id)) return false;
    return getPrerequisites(id).every((p) => mastered.has(p));
  });
  if (ready) return { skillId: ready, reason: 'next_up' };

  // Everything mastered — keep practising the last skill for reinforcement.
  return { skillId: order[order.length - 1], reason: 'all_mastered' };
}

export default { selectNextEarlyNumeracyPracticeTarget };
