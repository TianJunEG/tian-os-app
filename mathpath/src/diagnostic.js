// diagnostic.js — placement.
//
// The Kip McGrath idea: assess first, then practise the *gap*. We probe one question
// per rung from the bottom up. The first miss is where the learner starts (practise the
// first thing they can't do). The controller stops early after two misses in a row.

import { activeSkills } from './curriculum.js';
import { generateProblem } from './generator.js';

export const STOP_AFTER_CONSECUTIVE_MISSES = 2;

export function buildProbes() {
  return activeSkills().map((skill) => ({ skill, problem: generateProblem(skill) }));
}

// results: [{ skillId, correct }] in ladder order (may be partial if stopped early).
// Returns the skill id to start practising.
export function placementFromResults(results) {
  const firstMiss = results.find((r) => !r.correct);
  if (firstMiss) return firstMiss.skillId;
  const skills = activeSkills();
  return skills[skills.length - 1].id; // aced everything → start at the top rung
}

// Skills proven correct in the probe (everything before the first gap) can be
// pre-marked mastered so the progress map reflects the placement.
export function provenSkillIds(results) {
  const proven = [];
  for (const r of results) {
    if (!r.correct) break;
    proven.push(r.skillId);
  }
  return proven;
}
