// questions.js — thin façade over the per-skill engines (lib/engines.js).
//
// Generation, reconstruction, sibling params, and diagnosis all delegate to the engine for the
// skill's `gen` type, so there is one place per skill to edit its behaviour. Each question
// carries everything the client needs to render and grade (type, LaTeX/text prompt, optional
// visual, answer, choices, worked steps) without importing this module.

import { getSkill } from './graph.js';
import { engineFor } from './engines.js';

export function generateQuestion(skill, seed) {
  if (typeof skill === 'string') skill = getSkill(skill);
  return engineFor(skill.gen).generate(skill, seed);
}

// Rebuild the exact question from the params the client echoes back (seed = params).
export function reconstruct(skillId, params) {
  return generateQuestion(getSkill(skillId), params);
}

export function buildSession(skill, count) {
  return Array.from({ length: count }, () => generateQuestion(skill));
}

// Params for a parallel "now you try" item near the missed one.
export function siblingParams(skillId, params) {
  return engineFor(getSkill(skillId).gen).sibling(params);
}

// Map a wrong answer to a named misconception.
export function diagnose(skillId, params, given) {
  return engineFor(getSkill(skillId).gen).diagnose(params, given);
}

export function isCorrect(question, given) {
  return question.question_type === 'choice'
    ? String(given) === String(question.answer)
    : Number(given) === Number(question.answer);
}
