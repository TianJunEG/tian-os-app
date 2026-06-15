// Bridge between MathPath domain skills and PSL heuristic hint ladders.
//
// A domain skill carries an optional `heuristic` field (e.g. 'bar-model',
// 'before-after', 'ratio') that maps to a PSL hint-ladder key. When a
// student struggles with a tagged skill the bridge can:
//   1. return the matching heuristic key for the hint generator
//   2. build the PSL template query filter so the session can pull related
//      guided-practice problems
//
// Heuristic keys match the keys in services/psl/hintGenerator.js
// HEURISTIC_HINTS and the `heuristic` field on PSLProblemTemplate documents.
//
// PSL seeded coverage (as at Step 5):
//   'bar-model', 'before-after', 'work-backwards', 'guess-check', 'ratio',
//   'assumption', 'excess-shortage', 'pattern-recognition', 'simultaneous',
//   'data-interpretation'

import { getHintsForStep } from '../psl/hintGenerator.js';

// Heuristics that have seeded PSL problem templates.
const PSL_SEEDED_HEURISTICS = new Set([
  'bar-model',
  'before-after',
  'work-backwards',
  'guess-check',
  'ratio',
  'assumption',
  'excess-shortage',
  'pattern-recognition',
  'simultaneous',
  'data-interpretation',
]);

// Static index built from the `heuristic` fields authored on domain skills.
// Source of truth: scripts/domains/*.js — update here when new skills are tagged.
export const SLUG_TO_HEURISTIC = {
  // Four operations
  'op.model-drawing':   'bar-model',
  'op.word-multi-step': 'bar-model',
  // Fractions
  'fr.word-problems':   'bar-model',
  'fr.word-multi-step': 'bar-model',
  'fr.exam-applications': 'bar-model',
  // Percentage
  'pct.of-quantity':      'bar-model',
  'pct.find-whole':       'work-backwards',
  'pct.increase-decrease':'bar-model',
  'pct.before-after':     'before-after',
  'pct.discount':         'bar-model',
  'pct.gst':              'bar-model',
  // Ratio & Rate
  'rr.divide':     'ratio',
  'rr.divide-3':   'ratio',
  'rr.before-after':'before-after',
  'rr.combine':    'ratio',
  'rr.rate-tiered':'ratio',
  'rr.speed-avg':  'ratio',
  'rr.proportion': 'ratio',
  // Money
  'mon.word-problems': 'bar-model',
  // Area & Perimeter
  'ap.apply': 'bar-model',
  // Volume
  'vol.water-rate': 'ratio',
};

/**
 * Return the PSL heuristic key for a domain skill slug, or null if the skill
 * has no heuristic tag.
 */
export function getHeuristicForSkill(slug) {
  return SLUG_TO_HEURISTIC[slug] ?? null;
}

/**
 * Whether PSL has seeded problem templates for a given heuristic key.
 * Use this to decide whether to offer a PSL follow-up session.
 */
export function hasPSLContent(heuristic) {
  return PSL_SEEDED_HEURISTICS.has(heuristic);
}

/**
 * Whether PSL has seeded problem templates for the skill's heuristic.
 * Convenience wrapper combining getHeuristicForSkill + hasPSLContent.
 */
export function skillHasPSLContent(slug) {
  const h = getHeuristicForSkill(slug);
  return h !== null && hasPSLContent(h);
}

/**
 * Return hint-ladder entries for a given skill slug, step, and usage count.
 * Delegates to hintGenerator — the bridge handles the slug→heuristic lookup.
 *
 * @param {string} slug          — domain skill slug (e.g. 'rr.before-after')
 * @param {string} stepId        — PSL step id ('understand', 'plan', 'solve', etc.)
 * @param {number} hintsUsedCount
 * @param {object} options       — forwarded to getHintsForStep (misconceptionTag, problemVars)
 */
export function getHintsForSkillStep(slug, stepId, hintsUsedCount = 0, options = {}) {
  const heuristic = getHeuristicForSkill(slug);
  return getHintsForStep(stepId, heuristic, hintsUsedCount, options);
}

/**
 * Build the PSL template query filter for a domain skill at a given level.
 * Use the result directly as a MongoDB query object on PSLProblemTemplate.
 *
 * @param {string} slug   — domain skill slug
 * @param {string} level  — e.g. 'Primary 5'
 * @returns {{ heuristic: string, level: string } | null}
 */
export function getPSLTemplateQuery(slug, level) {
  const heuristic = getHeuristicForSkill(slug);
  if (!heuristic || !hasPSLContent(heuristic)) return null;
  return { heuristic, level };
}

export default {
  getHeuristicForSkill,
  hasPSLContent,
  skillHasPSLContent,
  getHintsForSkillStep,
  getPSLTemplateQuery,
  SLUG_TO_HEURISTIC,
};
